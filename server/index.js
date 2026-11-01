import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.OPENAI_API_KEY || '';
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15);

// gpt-image-1 बंद हो चुका है। नया समर्थित मॉडल इस्तेमाल करें।
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare';
const OPENAI_URL = 'https://api.openai.com/v1/images';

app.set('trust proxy', 1);

// Local development के लिए CORS.
// Production में frontend और API एक ही domain पर रखें।
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Same-origin/server-to-server requests में origin नहीं हो सकता।
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('This website origin is not allowed.'));
  }
}));

app.use(express.json({ limit: '1mb' }));

// Upload validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024,
    files: 1
  },
  fileFilter(_req, file, callback) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error('Only JPG, PNG and WEBP images are allowed.')
      );
    }

    callback(null, true);
  }
});

// Basic in-memory cooldown.
// Note: Serverless deployment में यह global rate limiter का विकल्प नहीं है।
const cooldowns = new Map();
const COOLDOWN_MS = 10000;

function checkCooldown(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const lastRequest = cooldowns.get(ip) || 0;

  if (now - lastRequest < COOLDOWN_MS) {
    const wait = Math.ceil(
      (COOLDOWN_MS - (now - lastRequest)) / 1000
    );

    return res.status(429).json({
      success: false,
      error: `Please wait ${wait} seconds before trying again.`
    });
  }

  cooldowns.set(ip, now);

  if (cooldowns.size > 1000) {
    for (const [key, value] of cooldowns.entries()) {
      if (now - value > COOLDOWN_MS * 2) {
        cooldowns.delete(key);
      }
    }
  }

  next();
}

function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return 'Please enter a prompt.';
  }

  if (prompt.trim().length > 4000) {
    return 'Prompt must be shorter than 4000 characters.';
  }

  return null;
}

// Common OpenAI request helper
async function requestOpenAI(endpoint, options = {}) {
  if (!API_KEY) {
    const error = new Error(
      'OpenAI API key is not configured. Add OPENAI_API_KEY to server environment variables.'
    );

    error.status = 503;
    throw error;
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 180000);

  try {
    const response = await fetch(`${OPENAI_URL}/${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...options.headers
      }
    });

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `OpenAI request failed with status ${response.status}.`;

      console.error('OpenAI API error:', {
        status: response.status,
        message
      });

      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    const base64 = data?.data?.[0]?.b64_json;

    if (!base64) {
      const error = new Error(
        'The AI service did not return an image. Please try again.'
      );

      error.status = 502;
      throw error;
    }

    return {
      image: `data:image/${data.output_format || 'png'};base64,${base64}`,
      format: data.output_format || 'png'
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        'The image request took too long. Please try again.'
      );

      timeoutError.status = 504;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'PHOTO AI API',
    aiConfigured: Boolean(API_KEY),
    model: MODEL
  });
});

// Generate image
app.post('/api/ai/generate', checkCooldown, async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const validationError = validatePrompt(prompt);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    const result = await requestOpenAI('generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt.trim(),
        size: '1024x1536',
        quality: 'low',
        output_format: 'png',
        n: 1
      })
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Image generation failed:', error.message);

    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Image generation failed.'
    });
  }
});

// Edit image
app.post(
  '/api/ai/edit',
  checkCooldown,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload an image first.'
        });
      }

      const prompt = req.body?.prompt;
      const validationError = validatePrompt(prompt);

      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError
        });
      }

      const form = new FormData();

      form.append('model', MODEL);
      form.append('prompt', prompt.trim());
      form.append('size', '1024x1024');
      form.append('quality', 'low');
      form.append('output_format', 'png');

      const imageBlob = new Blob(
        [req.file.buffer],
        { type: req.file.mimetype }
      );

      // OpenAI Image Edit API का multipart image field
      form.append(
        'image[]',
        imageBlob,
        req.file.originalname || 'upload.png'
      );

      const result = await requestOpenAI('edits', {
        method: 'POST',
        body: form
      });

      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Image editing failed:', error.message);

      return res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Image editing failed.'
      });
    }
  }
);

// Central error handler
app.use((error, _req, res, _next) => {
  console.error('Server error:', error.message);

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `Image exceeds the ${MAX_UPLOAD_MB} MB upload limit.`
      : 'Image upload failed. Please try again.';

    return res.status(400).json({
      success: false,
      error: message
    });
  }

  return res.status(error.status || 400).json({
    success: false,
    error: error.message || 'Something went wrong.'
  });
});

// Local server only.
// Vercel uses the serverless API entry point added separately.
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`PHOTO AI API running at http://localhost:${PORT}`);
  });

  function shutdown() {
    console.log('Shutting down PHOTO AI API...');

    server.close(() => {
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;