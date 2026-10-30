import { useEffect, useRef, useState } from 'react';
import {
  Upload, ImagePlus, Download, FileImage, Zap,
  SlidersHorizontal, CheckCircle2, RotateCcw
} from 'lucide-react';

export default function ImageCompressor() {
  const inputRef = useRef(null);
  const [image, setImage] = useState('');
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState('image/jpeg');
  const [maxWidth, setMaxWidth] = useState(1920);
  const [result, setResult] = useState('');
  const [resultSize, setResultSize] = useState(0);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (image.startsWith('blob:')) URL.revokeObjectURL(image);
      if (result.startsWith('blob:')) URL.revokeObjectURL(result);
    };
  }, [image, result]);

  function uploadPhoto(selected) {
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setNotice('Please select an image file.');
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setNotice('Image must be smaller than 20 MB.');
      return;
    }

    if (image.startsWith('blob:')) URL.revokeObjectURL(image);
    if (result.startsWith('blob:')) URL.revokeObjectURL(result);

    setImage(URL.createObjectURL(selected));
    setFile(selected);
    setResult('');
    setResultSize(0);
    setNotice('Photo uploaded successfully.');
  }

  function formatSize(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function compressPhoto() {
    if (!file || !image) {
      setNotice('Please upload a photo first.');
      return;
    }

    setLoading(true);
    setNotice('');

    try {
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Photo could not be loaded.'));
        img.src = image;
      });

      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas could not be created.');

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          value => value
            ? resolve(value)
            : reject(new Error('Compression failed.')),
          format,
          quality / 100
        );
      });

      if (result.startsWith('blob:')) URL.revokeObjectURL(result);

      const url = URL.createObjectURL(blob);
      setResult(url);
      setResultSize(blob.size);

      const saving = ((file.size - blob.size) / file.size) * 100;

      setNotice(
        saving > 0
          ? `Compression complete! ${saving.toFixed(1)}% smaller.`
          : 'Image converted successfully. Try lower quality or dimensions for a smaller file.'
      );
    } catch (error) {
      setNotice(error.message || 'Could not compress the photo.');
    } finally {
      setLoading(false);
    }
  }

  function downloadPhoto() {
    if (!result) {
      setNotice('Please compress your photo first.');
      return;
    }

    const extension = format === 'image/webp' ? 'webp'
      : format === 'image/png' ? 'png' : 'jpg';

    const link = document.createElement('a');
    link.href = result;
    link.download = `photo-ai-compressed.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function resetTool() {
    if (image.startsWith('blob:')) URL.revokeObjectURL(image);
    if (result.startsWith('blob:')) URL.revokeObjectURL(result);

    setImage('');
    setFile(null);
    setResult('');
    setResultSize(0);
    setQuality(75);
    setFormat('image/jpeg');
    setMaxWidth(1920);
    setNotice('');

    if (inputRef.current) inputRef.current.value = '';
  }

  const savedPercent = file && resultSize
    ? Math.max(0, ((file.size - resultSize) / file.size) * 100)
    : 0;

  return (
    <section className="editor-page">
      <div className="page-heading">
        <div>
          <span className="overline">CREATIVE LAB / 07</span>
          <h1>Image Compressor</h1>
          <p>Reduce image size while keeping good visual quality.</p>
        </div>
        <span className="coming-chip">
          <Zap size={14} /> SMART COMPRESSION
        </span>
      </div>

      <div className="editor-layout">
        <div className="editor-controls panel">
          <div className="panel-head">
            <h3><Upload size={17} /> Upload photo</h3>
            <span>20 MB MAX</span>
          </div>

          <button
            className="upload-box"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={28} />
            <b>{file ? file.name : 'Choose Photo'}</b>
            <small>JPG, PNG, WEBP · Maximum 20 MB</small>
          </button>

          <input
            ref={inputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={event => uploadPhoto(event.target.files?.[0])}
          />

          <div className="panel-head controls-head">
            <h3><SlidersHorizontal size={17} /> Compression settings</h3>
          </div>

          <label className="range-control">
            <span>
              <span>Image quality</span>
              <b>{quality}%</b>
            </span>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={event => setQuality(Number(event.target.value))}
            />
          </label>

          <label className="field-label">Output format</label>
          <select
            className="text-input"
            value={format}
            onChange={event => setFormat(event.target.value)}
          >
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WEBP</option>
            <option value="image/png">PNG</option>
          </select>

          <label className="field-label">Maximum width</label>
          <select
            className="text-input"
            value={maxWidth}
            onChange={event => setMaxWidth(Number(event.target.value))}
          >
            <option value={640}>640 px</option>
            <option value={1280}>1280 px</option>
            <option value={1920}>1920 px</option>
            <option value={2560}>2560 px</option>
            <option value={4000}>4000 px</option>
            <option value={12000}>Original width (up to 12000 px)</option>
          </select>

          <button
            className="primary-button wide"
            style={{ marginTop: 20 }}
            disabled={!file || loading}
            onClick={compressPhoto}
          >
            <Zap size={16} />
            {loading ? 'Compressing...' : 'Compress Image'}
          </button>

          <button
            className="reset-button"
            style={{ marginTop: 14 }}
            onClick={resetTool}
          >
            <RotateCcw size={14} /> Start Again
          </button>

          {result && (
            <button
              className="primary-button wide"
              style={{ marginTop: 14 }}
              onClick={downloadPhoto}
            >
              <Download size={16} /> Download Compressed Photo
            </button>
          )}
        </div>

        <div className="canvas-section panel">
          <div className="canvas-top">
            <b>Compression Preview</b>
            <span>{result ? 'READY' : 'LIVE PREVIEW'}</span>
          </div>

          <div style={{
            minHeight: 420,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#171a2b',
            borderRadius: 12
          }}>
            {result ? (
              <img
                src={result}
                alt="Compressed result"
                style={{
                  maxWidth: '100%',
                  maxHeight: 550,
                  objectFit: 'contain',
                  borderRadius: 10
                }}
              />
            ) : image ? (
              <img
                src={image}
                alt="Original photo"
                style={{
                  maxWidth: '100%',
                  maxHeight: 550,
                  objectFit: 'contain',
                  borderRadius: 10
                }}
              />
            ) : (
              <div className="bg-empty">
                <FileImage size={45} />
                <b>Your photo will appear here</b>
                <small>Upload a photo to start compression</small>
              </div>
            )}
          </div>

          {file && (
            <div className="panel" style={{
              marginTop: 16,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14
            }}>
              <div>
                <small>Original size</small>
                <h2>{formatSize(file.size)}</h2>
              </div>
              <div>
                <small>Compressed size</small>
                <h2>{result ? formatSize(resultSize) : 'Not ready'}</h2>
              </div>

              {result && (
                <>
                  <div>
                    <small>Size reduced</small>
                    <h2>{savedPercent.toFixed(1)}%</h2>
                  </div>
                  <div>
                    <small>Output dimensions</small>
                    <h2 style={{ fontSize: 16 }}>
                      {maxWidth} px max
                    </h2>
                  </div>
                </>
              )}
            </div>
          )}

          {result && (
            <p className="privacy-line" style={{ marginTop: 14 }}>
              <CheckCircle2 size={14} />
              Compression completed in your browser.
            </p>
          )}
        </div>
      </div>

      {notice && (
        <div className="notice-box" role="status" style={{ marginTop: 16 }}>
          {notice}
        </div>
      )}
    </section>
  );
}