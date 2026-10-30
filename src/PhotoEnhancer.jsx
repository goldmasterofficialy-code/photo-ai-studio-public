import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  ImagePlus,
  Sparkles,
  Sun,
  Focus,
  Waves,
  Download,
  RotateCcw,
  LoaderCircle,
  CheckCircle2
} from 'lucide-react';

export default function PhotoEnhancer() {
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState('');
  const [result, setResult] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Photo could not be loaded.'));
      img.src = src;
    });
  }

  function selectFile(selected) {
    if (!selected) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setNotice('Please select JPG, PNG or WEBP.');
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setNotice('Image must be smaller than 15 MB.');
      return;
    }

    if (original) URL.revokeObjectURL(original);
    if (result) URL.revokeObjectURL(result);

    setFile(selected);
    setOriginal(URL.createObjectURL(selected));
    setResult('');
    setBrightness(100);
    setSharpness(0);
    setNoiseReduction(0);
    setNotice('Photo uploaded successfully.');
  }

  async function enhancePhoto(auto = false) {
    if (!file || loading) return;

    setLoading(true);
    setNotice('Enhancing your photo...');

    try {
      const img = await loadImage(original);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true
      });

      if (!ctx) throw new Error('Canvas is not available.');

      let bright = brightness;
      let sharp = sharpness;
      let denoise = noiseReduction;

      if (auto) {
        bright = 108;
        sharp = 35;
        denoise = 15;

        setBrightness(bright);
        setSharpness(sharp);
        setNoiseReduction(denoise);
      }

      ctx.filter = `brightness(${bright}%) contrast(${auto ? 108 : 100}%) saturate(${auto ? 112 : 100}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';

      let imageData = ctx.getImageData(
        0, 0, canvas.width, canvas.height
      );

      let pixels = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Noise reduction: smooth small pixel variations.
      if (denoise > 0 && width * height < 12000000) {
        const source = new Uint8ClampedArray(pixels);
        const amount = denoise / 100;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) {
              const average = (
                source[i - 4 + c] +
                source[i + 4 + c] +
                source[i - width * 4 + c] +
                source[i + width * 4 + c]
              ) / 4;

              pixels[i + c] =
                source[i + c] * (1 - amount * 0.35) +
                average * amount * 0.35;
            }
          }
        }
      }

      // Sharpness: a simple edge enhancement filter.
      if (sharp > 0 && width * height < 12000000) {
        const source = new Uint8ClampedArray(pixels);
        const amount = sharp / 100;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) {
              const center = source[i + c];
              const neighbors = (
                source[i - 4 + c] +
                source[i + 4 + c] +
                source[i - width * 4 + c] +
                source[i + width * 4 + c]
              ) / 4;

              pixels[i + c] = Math.max(
                0,
                Math.min(
                  255,
                  center + (center - neighbors) * amount * 1.5
                )
              );
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          value => value
            ? resolve(value)
            : reject(new Error('Enhanced image could not be created.')),
          'image/png'
        );
      });

      if (result) URL.revokeObjectURL(result);

      setResult(URL.createObjectURL(blob));
      setNotice('Photo enhanced successfully!');

    } catch (error) {
      console.error(error);
      setNotice(error.message || 'Enhancement failed.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadImage(format) {
    if (!result) {
      setNotice('Please enhance your photo first.');
      return;
    }

    try {
      const img = await loadImage(result);
      const canvas = document.createElement('canvas');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Export canvas is not available.');

      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          value => value
            ? resolve(value)
            : reject(new Error('Export failed.')),
          mime,
          0.98
        );
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `photo-ai-enhanced.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setNotice(`HD ${format.toUpperCase()} download started.`);

    } catch (error) {
      setNotice(error.message || 'Download failed.');
    }
  }

  function resetAdjustments() {
    setBrightness(100);
    setSharpness(0);
    setNoiseReduction(0);
    setResult('');
    setNotice('Adjustments reset.');
  }

  function resetAll() {
    if (original) URL.revokeObjectURL(original);
    if (result) URL.revokeObjectURL(result);

    setFile(null);
    setOriginal('');
    setResult('');
    setBrightness(100);
    setSharpness(0);
    setNoiseReduction(0);
    setNotice('');

    if (inputRef.current) inputRef.current.value = '';
  }

  useEffect(() => {
    return () => {
      if (original) URL.revokeObjectURL(original);
      if (result) URL.revokeObjectURL(result);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [original, result]);

  return (
    <section className="editor-page">
      <div className="page-heading">
        <div>
          <span className="overline">AI CREATIVE LAB / 05</span>
          <h1>AI Photo Enhancer</h1>
          <p>Improve brightness, sharpness and photo clarity.</p>
        </div>
        <span className="coming-chip">
          <Sparkles size={14} /> PHOTO ENHANCEMENT
        </span>
      </div>

      <div className="editor-layout">
        <div className="editor-controls panel">
          <div className="panel-head">
            <h3><Upload size={17} /> Upload your photo</h3>
            <span>15 MB MAX</span>
          </div>

          <button
            className="upload-box"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={28} />
            <b>{file ? file.name : 'Choose Photo'}</b>
            <small>JPG, PNG or WEBP · Maximum 15 MB</small>
          </button>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={e => selectFile(e.target.files?.[0])}
          />

          <button
            className="primary-button wide"
            onClick={() => enhancePhoto(true)}
            disabled={!file || loading}
          >
            {loading
              ? <><LoaderCircle size={16} /> Processing...</>
              : <><Sparkles size={16} /> Auto Enhance</>}
          </button>

          <div className="panel-head controls-head">
            <h3><Sun size={17} /> Manual adjustments</h3>
            <button className="reset-button" onClick={resetAdjustments}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <label className="range-control">
            <span>
              <span><Sun size={14} /> Brightness</span>
              <b>{brightness}%</b>
            </span>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              disabled={!file}
              onChange={e => setBrightness(Number(e.target.value))}
            />
          </label>

          <label className="range-control">
            <span>
              <span><Focus size={14} /> Sharpness</span>
              <b>{sharpness}%</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={sharpness}
              disabled={!file}
              onChange={e => setSharpness(Number(e.target.value))}
            />
          </label>

          <label className="range-control">
            <span>
              <span><Waves size={14} /> Noise Reduction</span>
              <b>{noiseReduction}%</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={noiseReduction}
              disabled={!file}
              onChange={e => setNoiseReduction(Number(e.target.value))}
            />
          </label>

          <button
            className="primary-button wide"
            style={{ marginTop: 18 }}
            onClick={() => enhancePhoto(false)}
            disabled={!file || loading}
          >
            {loading
              ? <><LoaderCircle size={16} /> Enhancing...</>
              : <><Sparkles size={16} /> Apply Enhancements</>}
          </button>

          <button
            className="reset-button"
            style={{ marginTop: 18 }}
            onClick={resetAll}
          >
            <RotateCcw size={14} /> Start again
          </button>
        </div>

        <div className="canvas-section">
          <div className="canvas-top">
            <b>Photo Preview</b>
            <span>{result ? 'ENHANCED RESULT' : 'ORIGINAL PHOTO'}</span>
          </div>

          <div className="poster-canvas">
            {result || original ? (
              <img
                src={result || original}
                alt="Photo preview"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="canvas-empty">
                <ImagePlus size={42} />
                <b>Upload a photo to begin</b>
                <small>Your enhanced photo will appear here.</small>
                <button onClick={() => inputRef.current?.click()}>
                  Choose Photo
                </button>
              </div>
            )}
          </div>

          {result && (
            <>
              <div className="bg-success" style={{ marginTop: 14 }}>
                <CheckCircle2 size={16} />
                Photo enhanced successfully
              </div>

              <div className="bg-downloads" style={{ marginTop: 15 }}>
                <button
                  className="primary-button"
                  onClick={() => downloadImage('png')}
                >
                  <Download size={16} /> HD PNG
                </button>
                <button
                  className="primary-button"
                  onClick={() => downloadImage('jpg')}
                >
                  <Download size={16} /> HD JPG
                </button>
              </div>
            </>
          )}

          <p className="privacy-line">
            <CheckCircle2 size={13} />
            Photo processing happens in your browser.
          </p>
        </div>
      </div>

      {notice && (
        <div className="notice-box" role="status">
          {notice}
        </div>
      )}
    </section>
  );
}