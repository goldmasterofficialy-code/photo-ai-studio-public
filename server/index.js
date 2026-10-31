import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.OPENAI_API_KEY || '';
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15);

const OPENAI_URL = 'https://api.openai.com/v1/images';
const MODEL = 'gpt-image-1';

const cooldowns = new Map();
const COOLDOWN_MS = 10000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error('Only JPG, PNG and WEBP images are allowed.')
      );
    }

    callback(null, true);
  }
});

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'PHOTO AI API',
    aiConfigured: Boolean(API_KEY),
    model: MODEL
  });
});

// Request cooldown
function checkCooldown(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const last = cooldowns.get(ip) || 0;

  if (now - last < COOLDOWN_MS) {
    const wait = Math.ceil(
      (COOLDOWN_MS - (now - last)) / 1000
    );

    return res.status(429).json({
      error: `Please wait ${wait} seconds before trying again.`
    });
  }

  cooldowns.set(ip, now);

  // Keep the map from growing indefinitely.
  if (cooldowns.size > 1000) {
    for (const [key, value] of cooldowns) {
      if (now - value > COOLDOWN_MS * 2) {
        cooldowns.delete(key);
      }
    }
  }

  next();
}

// Prompt validation
function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return 'Please enter a prompt.';
  }

  if (prompt.trim().length > 4000) {
    return 'Prompt must be shorter than 4000 characters.';
  }

  return null;
}

// OpenAI API request
async function requestOpenAI(url, options) {
  if (!API_KEY) {
    const error = new Error(
      'OpenAI API key is not configured on the server.'
    );

    error.status = 503;
    throw error;
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    180000
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...options.headers
      }
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }

    if (!response.ok) {
      console.error('OpenAI error:', {
        status: response.status,
        message: data.error?.message || 'Unknown error'
      });

      const error = new Error(
        data.error?.message || 'OpenAI image request failed.'
      );

      error.status = response.status;
      throw error;
    }

    const base64 = data.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error('OpenAI did not return an image.');
    }

    return `data:image/png;base64,${base64}`;

  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        'Request timed out. Please try again.'
      );

      timeoutError.status = 504;
      throw timeoutError;
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}

// Generate image
app.post(
  '/api/ai/generate',
  checkCooldown,
  async (req, res) => {
    try {
      const prompt = req.body?.prompt;
      const validationError = validatePrompt(prompt);

      if (validationError) {
        return res.status(400).json({
          error: validationError
        });
      }

      const image = await requestOpenAI(
        `${OPENAI_URL}/generations`,
        {
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
        }
      );

      return res.json({
        success: true,
        image,
        format: 'png'
      });

    } catch (error) {
      console.error('Generation error:', error.message);

      return res.status(error.status || 500).json({
        error: error.message
      });
    }
  }
);

// Edit image
app.post(
  '/api/ai/edit',
  checkCooldown,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload an image first.'
        });
      }

      const prompt = req.body?.prompt;
      const validationError = validatePrompt(prompt);

      if (validationError) {
        return res.status(400).json({
          error: validationError
        });
      }

      const form = new FormData();

      form.append('model', MODEL);
      form.append('prompt', prompt.trim());
      form.append('size', '1024x1024');
      form.append('quality', 'low');
      form.append('output_format', 'png');

      const blob = new Blob(
        [req.file.buffer],
        { type: req.file.mimetype }
      );

      form.append(
        'image',
        blob,
        req.file.originalname || 'upload.png'
      );

      const image = await requestOpenAI(
        `${OPENAI_URL}/edits`,
        {
          method: 'POST',
          body: form
        }
      );

      return res.json({
        success: true,
        image,
        format: 'png'
      });

    } catch (error) {
      console.error('Editing error:', error.message);

      return res.status(error.status || 500).json({
        error: error.message
      });
    }
  }
);

// Error handling
app.use((error, _req, res, _next) => {
  console.error('Server error:', error.message);

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `Image exceeds ${MAX_UPLOAD_MB} MB.`
      : 'Image upload failed.';

    return res.status(400).json({ error: message });
  }

  return res.status(error.status || 400).json({
    error: error.message || 'Something went wrong.'
  });
});

// Start local server only outside Vercel
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

// Export app for Vercel
export default app;