import { useEffect, useRef, useState } from 'react';
import { removeBackground } from '@imgly/background-removal';
import {
  Upload, Download, Eraser, ImagePlus, LoaderCircle,
  RotateCcw, CheckCircle2, Palette, Eye, Sparkles
} from 'lucide-react';

export default function BackgroundRemover() {
  const [original, setOriginal] = useState('');
  const [result, setResult] = useState('');
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [background, setBackground] = useState('transparent');
  const [customColor, setCustomColor] = useState('#ffffff');

  const [blurEnabled, setBlurEnabled] = useState(false);
  const [blurStrength, setBlurStrength] = useState(8);

  const [compare, setCompare] = useState(50);
  const [showCompare, setShowCompare] = useState(false);
  const [notice, setNotice] = useState('');

  const inputRef = useRef(null);

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Photo could not be loaded.'));
      img.src = src;
    });
  }

  function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Image could not be created.'));
      }, type, quality);
    });
  }

  async function createComposition(
    originalSrc,
    foregroundSrc,
    selectedBackground,
    selectedColor,
    useBlur,
    blur
  ) {
    const foreground = await loadImage(foregroundSrc);
    const originalImage = await loadImage(originalSrc);

    const width = foreground.naturalWidth;
    const height = foreground.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas is not available.');

    if (useBlur && blur > 0) {
      // Extra space prevents blurred edges from becoming transparent.
      const padding = Math.ceil(blur * 3);

      const backgroundCanvas = document.createElement('canvas');
      backgroundCanvas.width = width + padding * 2;
      backgroundCanvas.height = height + padding * 2;

      const backgroundCtx = backgroundCanvas.getContext('2d');

      if (!backgroundCtx) {
        throw new Error('Background canvas is not available.');
      }

      // Scale the original image to cover the expanded canvas.
      const scale = Math.max(
        backgroundCanvas.width / originalImage.naturalWidth,
        backgroundCanvas.height / originalImage.naturalHeight
      );

      const drawWidth = originalImage.naturalWidth * scale;
      const drawHeight = originalImage.naturalHeight * scale;

      const x = (backgroundCanvas.width - drawWidth) / 2;
      const y = (backgroundCanvas.height - drawHeight) / 2;

      // Draw the full original image with blur.
      backgroundCtx.save();
      backgroundCtx.filter = `blur(${blur}px)`;
      backgroundCtx.drawImage(
        originalImage,
        x,
        y,
        drawWidth,
        drawHeight
      );
      backgroundCtx.restore();

      // Crop the centre, removing the expanded padding.
      ctx.drawImage(
        backgroundCanvas,
        padding,
        padding,
        width,
        height,
        0,
        0,
        width,
        height
      );

      // Place the transparent cutout over the blurred background.
      ctx.drawImage(foreground, 0, 0, width, height);

    } else if (selectedBackground !== 'transparent') {
      ctx.fillStyle = selectedBackground === 'custom'
        ? selectedColor
        : selectedBackground;

      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(foreground, 0, 0, width, height);

    } else {
      ctx.drawImage(foreground, 0, 0, width, height);
    }

    return canvas;
  }

  useEffect(() => {
    if (!original || !result) {
      setPreview('');
      return;
    }

    let cancelled = false;
    let generatedUrl = '';

    async function updatePreview() {
      try {
        const canvas = await createComposition(
          original,
          result,
          background,
          customColor,
          blurEnabled,
          blurStrength
        );

        const blob = await canvasToBlob(canvas);

        if (cancelled) return;

        generatedUrl = URL.createObjectURL(blob);
        setPreview(generatedUrl);

      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setNotice(error.message || 'Preview could not be created.');
        }
      }
    }

    updatePreview();

    return () => {
      cancelled = true;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [
    original,
    result,
    background,
    customColor,
    blurEnabled,
    blurStrength
  ]);

  function clearUrls() {
    if (original) URL.revokeObjectURL(original);
    if (result) URL.revokeObjectURL(result);
    if (preview) URL.revokeObjectURL(preview);
  }

  function selectFile(selected) {
    if (!selected) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setNotice('Please select JPG, PNG or WEBP.');
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setNotice('Photo must be smaller than 15 MB.');
      return;
    }

    clearUrls();

    setFile(selected);
    setOriginal(URL.createObjectURL(selected));
    setResult('');
    setPreview('');

    setProgress(0);
    setCompare(50);
    setShowCompare(false);

    setBackground('transparent');
    setBlurEnabled(false);
    setBlurStrength(8);

    setNotice('');
  }

  async function processImage() {
    if (!file || loading) return;

    setLoading(true);
    setProgress(0);
    setNotice('AI model is preparing...');

    try {
      const blob = await removeBackground(file, {
        progress: (_key, current, total) => {
          if (total > 0) {
            setProgress(Math.round((current / total) * 100));
          }
        }
      });

      const newResult = URL.createObjectURL(blob);

      setResult(old => {
        if (old) URL.revokeObjectURL(old);
        return newResult;
      });

      setProgress(100);
      setNotice('Background removed successfully!');

    } catch (error) {
      console.error('Background removal error:', error);
      setNotice(error.message || 'Background removal failed.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadImage(format = 'png') {
    if (!result || !original) return;

    try {
      const canvas = await createComposition(
        original,
        result,
        background,
        customColor,
        blurEnabled,
        blurStrength
      );

      if (format === 'jpg') {
        const jpgCanvas = document.createElement('canvas');
        jpgCanvas.width = canvas.width;
        jpgCanvas.height = canvas.height;

        const ctx = jpgCanvas.getContext('2d');

        if (!ctx) throw new Error('JPG canvas is not available.');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        const blob = await canvasToBlob(jpgCanvas, 'image/jpeg', 0.95);
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'photo-ai-background.jpg';
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 3000);

      } else {
        const blob = await canvasToBlob(canvas);
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'photo-ai-background.png';
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }

      setNotice(`${format.toUpperCase()} download started!`);

    } catch (error) {
      console.error(error);
      setNotice(error.message || 'Download failed.');
    }
  }

  function resetTool() {
    clearUrls();

    setFile(null);
    setOriginal('');
    setResult('');
    setPreview('');

    setProgress(0);
    setCompare(50);
    setShowCompare(false);

    setBackground('transparent');
    setBlurEnabled(false);
    setBlurStrength(8);

    setNotice('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  const stageBackground = background === 'transparent'
    ? 'repeating-conic-gradient(#aaa 0% 25%, #eee 0% 50%) 50% / 20px 20px'
    : background === 'custom'
      ? customColor
      : background;

  return (
    <section className="bg-remover-page">
      <div className="page-heading">
        <div>
          <span className="overline">AI CREATIVE LAB / 04</span>
          <h1>Background Remover</h1>
          <p>Remove, replace and blur your photo background.</p>
        </div>
        <span className="coming-chip">
          <Sparkles size={14} /> PRO BACKGROUND STUDIO
        </span>
      </div>

      <div className="bg-remover-layout">
        <div className="bg-controls panel">
          <h3><Upload size={17} /> Upload your photo</h3>

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
            onClick={processImage}
            disabled={!file || loading}
          >
            {loading
              ? <><LoaderCircle size={16} /> Processing...</>
              : <><Eraser size={16} /> Remove Background</>}
          </button>

          {loading && (
            <div className="bg-progress">
              <div>
                <span>Processing image</span>
                <b>{progress}%</b>
              </div>
              <div className="bg-progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <small>First use may take longer while the AI model loads.</small>
            </div>
          )}

          <div className="bg-option-title">
            <Palette size={16} /> Background options
          </div>

          <div className="bg-color-options">
            {[
              { name: 'Transparent', value: 'transparent' },
              { name: 'White', value: '#ffffff' },
              { name: 'Black', value: '#000000' },
              { name: 'Blue', value: '#3984e8' },
              { name: 'Pink', value: '#ed9ac3' }
            ].map(item => (
              <button
                key={item.value}
                className={background === item.value ? 'selected' : ''}
                onClick={() => setBackground(item.value)}
                disabled={!result}
              >
                <span
                  style={{
                    background: item.value === 'transparent'
                      ? 'repeating-conic-gradient(#aaa 0% 25%, white 0% 50%) 50% / 12px 12px'
                      : item.value
                  }}
                />
                {item.name}
              </button>
            ))}
          </div>

          <label className="field-label">Custom background color</label>
          <input
            type="color"
            value={customColor}
            disabled={!result}
            onChange={e => {
              setCustomColor(e.target.value);
              setBackground('custom');
            }}
          />

          <div className="bg-option-title">
            <Sparkles size={16} /> Background Blur
          </div>

          <label className="bg-blur-toggle">
            <input
              type="checkbox"
              checked={blurEnabled}
              disabled={!result}
              onChange={e => setBlurEnabled(e.target.checked)}
            />
            Enable background blur
          </label>

          <label className="range-control">
            <span>
              <span>Blur strength</span>
              <b>{blurStrength}</b>
            </span>
            <input
              type="range"
              min="0"
              max="20"
              value={blurStrength}
              disabled={!result || !blurEnabled}
              onChange={e => setBlurStrength(Number(e.target.value))}
            />
          </label>

          <button
            className="reset-button"
            style={{ marginTop: 20 }}
            onClick={resetTool}
          >
            <RotateCcw size={14} /> Start again
          </button>
        </div>

        <div className="bg-preview panel">
          <div className="bg-preview-heading">
            <b>Photo Preview</b>
            <span>{result ? 'RESULT READY' : 'YOUR IMAGE'}</span>
          </div>

          <div
            className="bg-image-stage"
            style={{
              background: stageBackground,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {preview ? (
              showCompare && original ? (
                <>
                  <img
                    src={original}
                    alt="Original photo"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />

                  <img
                    src={preview}
                    alt="Edited photo"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      clipPath: `inset(0 ${100 - compare}% 0 0)`
                    }}
                  />

                  <span className="compare-label compare-left">AFTER</span>
                  <span className="compare-label compare-right">BEFORE</span>

                  <div
                    className="compare-divider"
                    style={{ left: `${compare}%` }}
                  />
                </>
              ) : (
                <img src={preview} alt="Processed photo" />
              )
            ) : original ? (
              <img src={original} alt="Original photo" />
            ) : (
              <div className="bg-empty">
                <ImagePlus size={45} />
                <b>Your photo will appear here</b>
                <small>Upload an image to get started</small>
              </div>
            )}
          </div>

          {result && (
            <>
              <div className="bg-success">
                <CheckCircle2 size={16} />
                Background removed successfully
              </div>

              <button
                className="reset-button"
                style={{ marginTop: 15 }}
                onClick={() => setShowCompare(!showCompare)}
              >
                <Eye size={15} />
                {showCompare ? 'Show result only' : 'Compare Before / After'}
              </button>

              {showCompare && (
                <label className="range-control">
                  <span>
                    <span>Comparison slider</span>
                    <b>{compare}%</b>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={compare}
                    onChange={e => setCompare(Number(e.target.value))}
                  />
                </label>
              )}

              <div className="bg-downloads">
                <button
                  className="primary-button"
                  onClick={() => downloadImage('png')}
                >
                  <Download size={16} /> Download PNG
                </button>

                <button
                  className="primary-button"
                  onClick={() => downloadImage('jpg')}
                >
                  <Download size={16} /> Download JPG
                </button>
              </div>
            </>
          )}

          <p className="privacy-line">
            <Eraser size={13} />
            Your photo is processed in your browser.
          </p>
        </div>
      </div>

      {notice && <div className="notice-box">{notice}</div>}
    </section>
  );
}