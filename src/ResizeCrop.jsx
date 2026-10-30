import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  ImagePlus,
  Download,
  RotateCcw,
  RotateCw,
  Crop,
  Maximize2,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  Move,
  MousePointer2
} from 'lucide-react';

const presets = [
  { name: 'Original', label: 'Free', ratio: 0, shape: 'original' },
  { name: 'Square', label: '1:1', ratio: 1, shape: 'square' },
  { name: 'Portrait', label: '4:5', ratio: 4 / 5, shape: 'portrait' },
  { name: 'Landscape', label: '16:9', ratio: 16 / 9, shape: 'landscape' },
  { name: 'Story', label: '9:16', ratio: 9 / 16, shape: 'story' },
  { name: 'YouTube', label: '16:9', ratio: 16 / 9, shape: 'youtube' }
];

const INITIAL_CROP = { x: 0, y: 0, w: 1, h: 1 };

export default function ResizeCrop() {
  const inputRef = useRef(null);
  const imageWrapRef = useRef(null);
  const dragRef = useRef(null);

  const [file, setFile] = useState(null);
  const [image, setImage] = useState('');
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [ratio, setRatio] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Photo load nahi ho payi.'));
      img.src = src;
    });
  }

  function getRotatedDimensions(img, angle) {
    const sideways = Math.abs(angle % 180) === 90;

    return sideways
      ? { width: img.naturalHeight, height: img.naturalWidth }
      : { width: img.naturalWidth, height: img.naturalHeight };
  }

  function selectFile(selected) {
    if (!selected) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setNotice('JPG, PNG ya WEBP photo select karein.');
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setNotice('Photo 15 MB se chhoti honi chahiye.');
      return;
    }

    const url = URL.createObjectURL(selected);
    const img = new Image();

    img.onload = () => {
      setFile(selected);
      setImage(url);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setRatio(0);
      setRotation(0);
      setCrop(INITIAL_CROP);
      setNotice('Photo successfully uploaded.');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setNotice('Photo open nahi ho payi.');
    };

    img.src = url;
  }

  function makeCropForRatio(value, imageAspect) {
    if (!value) return INITIAL_CROP;

    let w = 1;
    let h = 1;

    if (imageAspect > value) {
      w = value / imageAspect;
    } else {
      h = imageAspect / value;
    }

    return {
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w,
      h
    };
  }

  async function choosePreset(value) {
    setRatio(value);

    if (!image) return;

    try {
      const img = await loadImage(image);
      const dimensions = getRotatedDimensions(img, rotation);
      const imageAspect = dimensions.width / dimensions.height;

      setCrop(makeCropForRatio(value, imageAspect));

      if (value === 0) {
        setWidth(dimensions.width);
        setHeight(dimensions.height);
      } else {
        const newWidth = Math.min(12000, dimensions.width);
        const newHeight = Math.min(12000, Math.round(newWidth / value));

        setWidth(newWidth);
        setHeight(newHeight);
      }
    } catch {
      setNotice('Ratio change nahi ho paya.');
    }
  }

  function changeWidth(value) {
    const next = Math.max(1, Math.min(12000, Number(value) || 1));
    setWidth(next);

    if (keepRatio && ratio > 0) {
      setHeight(Math.min(12000, Math.round(next / ratio)));
    }
  }

  function changeHeight(value) {
    const next = Math.max(1, Math.min(12000, Number(value) || 1));
    setHeight(next);

    if (keepRatio && ratio > 0) {
      setWidth(Math.min(12000, Math.round(next * ratio)));
    }
  }

  async function rotatePhoto(direction) {
    if (!image) return;

    const nextRotation = (rotation + direction + 360) % 360;

    try {
      const img = await loadImage(image);
      const dimensions = getRotatedDimensions(img, nextRotation);
      const imageAspect = dimensions.width / dimensions.height;

      setRotation(nextRotation);
      setCrop(makeCropForRatio(ratio, imageAspect));

      if (ratio === 0) {
        setWidth(dimensions.width);
        setHeight(dimensions.height);
      }

      setNotice('Photo rotated.');
    } catch {
      setNotice('Photo rotate nahi ho payi.');
    }
  }

  function startCropAction(event, mode) {
    if (!imageWrapRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = imageWrapRef.current.getBoundingClientRect();

    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: { ...crop },
      imageWidth: rect.width,
      imageHeight: rect.height
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCropAction(event) {
    if (!dragRef.current) return;

    const drag = dragRef.current;
    const dx = (event.clientX - drag.startX) / drag.imageWidth;
    const dy = (event.clientY - drag.startY) / drag.imageHeight;

    const original = drag.startCrop;

    if (drag.mode === 'move') {
      setCrop({
        ...original,
        x: Math.max(0, Math.min(1 - original.w, original.x + dx)),
        y: Math.max(0, Math.min(1 - original.h, original.y + dy))
      });
    }

    if (drag.mode === 'resize') {
      const nextW = Math.max(
        0.08,
        Math.min(1 - original.x, original.w + dx)
      );

      const nextH = Math.max(
        0.08,
        Math.min(1 - original.y, original.h + dy)
      );

      setCrop({
        ...original,
        w: nextW,
        h: nextH
      });
    }
  }

  function finishCropAction() {
    dragRef.current = null;
    setDragging(false);
  }

  async function downloadImage(format = 'png') {
    if (!image) {
      setNotice('Pehle photo upload karein.');
      return;
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1 ||
      width > 12000 ||
      height > 12000
    ) {
      setNotice('Width aur height 1 se 12000 pixels ke beech rakhein.');
      return;
    }

    try {
      const img = await loadImage(image);

      const sideways = Math.abs(rotation % 180) === 90;

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = sideways ? img.naturalHeight : img.naturalWidth;
      sourceCanvas.height = sideways ? img.naturalWidth : img.naturalHeight;

      const sourceCtx = sourceCanvas.getContext('2d');

      if (!sourceCtx) throw new Error('Canvas create nahi ho paya.');

      sourceCtx.translate(sourceCanvas.width / 2, sourceCanvas.height / 2);
      sourceCtx.rotate((rotation * Math.PI) / 180);

      sourceCtx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2
      );

      const sx = crop.x * sourceCanvas.width;
      const sy = crop.y * sourceCanvas.height;
      const sw = crop.w * sourceCanvas.width;
      const sh = crop.h * sourceCanvas.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Export canvas create nahi hua.');

      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        sourceCanvas,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        width,
        height
      );

      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          result => result
            ? resolve(result)
            : reject(new Error('Export failed.')),
          mime,
          0.95
        );
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `photo-ai-${width}x${height}.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 3000);

      setNotice(`${format.toUpperCase()} download successfully started!`);
    } catch (error) {
      console.error(error);
      setNotice(error.message || 'Download nahi ho paya.');
    }
  }

  function resetTool() {
    if (image) URL.revokeObjectURL(image);

    setImage('');
    setFile(null);
    setWidth(1080);
    setHeight(1080);
    setRatio(0);
    setRotation(0);
    setCrop(INITIAL_CROP);
    setKeepRatio(true);
    setNotice('');

    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section className="editor-page resize-studio">

      <style>{`
        .resize-studio .resize-panel {
          border: 1px solid rgba(160,145,255,.20);
          border-radius: 20px;
          background: linear-gradient(145deg,rgba(35,38,67,.98),rgba(20,23,43,.98));
          box-shadow: 0 18px 45px rgba(0,0,0,.18);
          padding: 22px;
        }

        .resize-studio .ratio-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .resize-studio .ratio-card {
          min-height: 100px;
          padding: 10px 5px;
          border-radius: 13px;
          border: 1px solid rgba(160,145,255,.16);
          background: rgba(255,255,255,.035);
          color: #c6c9df;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: .2s ease;
        }

        .resize-studio .ratio-card:hover:not(:disabled) {
          border-color: #a78bfa;
          background: rgba(167,139,250,.10);
          transform: translateY(-2px);
        }

        .resize-studio .ratio-card.selected {
          border: 1px solid #b49aff;
          background: linear-gradient(145deg,rgba(139,92,246,.25),rgba(59,130,246,.12));
          color: #fff;
          box-shadow: 0 0 0 2px rgba(167,139,250,.10);
        }

        .resize-studio .ratio-card:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .resize-studio .ratio-shape {
          width: 31px;
          height: 31px;
          border: 2px solid #a78bfa;
          border-radius: 5px;
          background: rgba(167,139,250,.12);
        }

        .resize-studio .ratio-shape.original { width: 30px; height: 24px; }
        .resize-studio .ratio-shape.portrait { width: 23px; height: 31px; }
        .resize-studio .ratio-shape.landscape,
        .resize-studio .ratio-shape.youtube { width: 38px; height: 22px; }
        .resize-studio .ratio-shape.story { width: 18px; height: 32px; }

        .resize-studio .ratio-card b { font-size: 11px; }
        .resize-studio .ratio-card small { font-size: 10px; color: #9da5c2; }

        .resize-studio .rotate-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }

        .resize-studio .rotate-action {
          min-height: 88px;
          border-radius: 15px;
          border: 1px solid rgba(167,139,250,.22);
          background: rgba(255,255,255,.04);
          color: #e6e2ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: .2s ease;
        }

        .resize-studio .rotate-action:hover:not(:disabled) {
          background: rgba(139,92,246,.20);
          border-color: #a78bfa;
          transform: translateY(-2px);
        }

        .resize-studio .rotate-action:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .resize-studio .rotate-action svg { color: #b49aff; }
        .resize-studio .rotate-action small { color: #9da5c2; font-size: 10px; }

        .resize-studio .rotation-status {
          margin-top: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(139,92,246,.10);
          color: #c8baff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
        }

        .resize-studio .dimension-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 13px;
        }

        .resize-studio .dimension-row > div { flex: 1; min-width: 0; }
        .resize-studio .dimension-separator { color: #a78bfa; padding-top: 25px; }

        .resize-studio .download-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .resize-studio .resize-preview {
          min-height: 450px;
          border-radius: 16px;
          background: #171a2b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
          overflow: hidden;
        }

        .resize-studio .crop-image-wrap {
          position: relative;
          display: inline-block;
          max-width: 100%;
          max-height: 560px;
          line-height: 0;
          user-select: none;
          touch-action: none;
        }

        .resize-studio .crop-image-wrap > img {
          display: block;
          max-width: 100%;
          max-height: 560px;
          width: auto;
          height: auto;
          border-radius: 8px;
          pointer-events: none;
        }

        .resize-studio .crop-frame {
          position: absolute;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 9999px rgba(0,0,0,.48);
          cursor: move;
          touch-action: none;
          box-sizing: border-box;
        }

        .resize-studio .crop-frame::before,
        .resize-studio .crop-frame::after {
          content: '';
          position: absolute;
          background: rgba(255,255,255,.45);
          pointer-events: none;
        }

        .resize-studio .crop-frame::before {
          left: 33.33%;
          top: 0;
          bottom: 0;
          width: 1px;
        }

        .resize-studio .crop-frame::after {
          top: 33.33%;
          left: 0;
          right: 0;
          height: 1px;
        }

        .resize-studio .crop-handle {
          position: absolute;
          width: 17px;
          height: 17px;
          right: -8px;
          bottom: -8px;
          border: 2px solid #fff;
          border-radius: 5px;
          background: #9b72ff;
          cursor: nwse-resize;
          touch-action: none;
          z-index: 2;
        }

        .resize-studio .crop-help {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 12px;
          margin-top: 13px;
          border-radius: 10px;
          background: rgba(139,92,246,.10);
          color: #c8baff;
          font-size: 12px;
        }

        @media(max-width:700px) {
          .resize-studio .ratio-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .resize-studio .resize-panel { padding: 15px; }
          .resize-studio .resize-preview { min-height: 300px; padding: 12px; }
        }
      `}</style>

      <div className="page-heading">
        <div>
          <span className="overline">CREATIVE LAB / 06</span>
          <h1>Resize & Crop Studio</h1>
          <p>Resize, crop and rotate your photos for every platform.</p>
        </div>
      </div>

      <div className="editor-layout">

        <div className="editor-controls panel resize-panel">

          <div className="panel-head">
            <h3><Upload size={17} /> Upload your photo</h3>
            <span>15 MB MAX</span>
          </div>

          <button className="upload-box" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={28} />
            <b>{file ? file.name : 'Choose Photo'}</b>
            <small>JPG, PNG or WEBP · Maximum 15 MB</small>
          </button>

          <input
            ref={inputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={event => selectFile(event.target.files?.[0])}
          />

          <div className="panel-head controls-head">
            <h3><Crop size={17} /> Crop Ratio</h3>
            <span>SELECT SIZE</span>
          </div>

          <div className="ratio-grid">
            {presets.map(item => (
              <button
                key={item.name}
                className={`ratio-card ${ratio === item.ratio && image ? 'selected' : ''}`}
                disabled={!image}
                onClick={() => choosePreset(item.ratio)}
              >
                <span className={`ratio-shape ${item.shape}`} />
                <b>{item.name}</b>
                <small>{item.label}</small>
              </button>
            ))}
          </div>

          <div className="panel-head controls-head">
            <h3><Maximize2 size={17} /> Image Dimensions</h3>
          </div>

          <div className="dimension-row">
            <div>
              <label className="field-label">Width (px)</label>
              <input
                className="text-input"
                type="number"
                min="1"
                max="12000"
                value={width}
                disabled={!image}
                onChange={event => changeWidth(event.target.value)}
              />
            </div>

            <span className="dimension-separator">×</span>

            <div>
              <label className="field-label">Height (px)</label>
              <input
                className="text-input"
                type="number"
                min="1"
                max="12000"
                value={height}
                disabled={!image}
                onChange={event => changeHeight(event.target.value)}
              />
            </div>
          </div>

          <label className="bg-blur-toggle" style={{ marginTop: 15 }}>
            <input
              type="checkbox"
              checked={keepRatio}
              disabled={!image}
              onChange={event => setKeepRatio(event.target.checked)}
            />
            Lock aspect ratio
          </label>

          <div className="panel-head controls-head">
            <h3><RefreshCw size={17} /> Rotate Photo</h3>
          </div>

          <div className="rotate-box">
            <button
              className="rotate-action"
              disabled={!image}
              onClick={() => rotatePhoto(-90)}
            >
              <RotateCcw size={25} />
              <b>Rotate Left</b>
              <small>90° anticlockwise</small>
            </button>

            <button
              className="rotate-action"
              disabled={!image}
              onClick={() => rotatePhoto(90)}
            >
              <RotateCw size={25} />
              <b>Rotate Right</b>
              <small>90° clockwise</small>
            </button>
          </div>

          <div className="rotation-status">
            <span>Current rotation</span>
            <b>{rotation}°</b>
          </div>

          <div className="panel-head controls-head">
            <h3><Move size={17} /> Drag & Crop</h3>
          </div>

          <div className="crop-help">
            <MousePointer2 size={17} />
            Drag the crop frame to move it. Drag the purple corner to resize.
          </div>

          <button
            className="reset-button"
            style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}
            onClick={() => setCrop(INITIAL_CROP)}
            disabled={!image}
          >
            <Crop size={14} /> Reset Crop Frame
          </button>

          <button
            className="reset-button"
            style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
            onClick={resetTool}
          >
            <RotateCcw size={14} /> Start Again
          </button>

          <div className="download-actions">
            <button
              className="primary-button"
              disabled={!image}
              onClick={() => downloadImage('png')}
            >
              <Download size={16} /> HD PNG
            </button>

            <button
              className="primary-button"
              disabled={!image}
              onClick={() => downloadImage('jpg')}
            >
              <Download size={16} /> HD JPG
            </button>
          </div>
        </div>

        <div className="canvas-section panel resize-panel">

          <div className="canvas-top">
            <b>Photo Preview & Crop</b>
            <span>{width} × {height} px</span>
          </div>

          <div className="resize-preview">
            {image ? (
              <div className="crop-image-wrap" ref={imageWrapRef}>
                <img
                  src={image}
                  alt="Crop preview"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />

                <div
                  className="crop-frame"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    cursor: dragging ? 'grabbing' : 'move'
                  }}
                  onPointerDown={event => startCropAction(event, 'move')}
                  onPointerMove={moveCropAction}
                  onPointerUp={finishCropAction}
                  onPointerCancel={finishCropAction}
                  onLostPointerCapture={finishCropAction}
                >
                  <span
                    className="crop-handle"
                    onPointerDown={event => startCropAction(event, 'resize')}
                    onPointerMove={moveCropAction}
                    onPointerUp={finishCropAction}
                    onPointerCancel={finishCropAction}
                    onLostPointerCapture={finishCropAction}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-empty">
                <ImagePlus size={44} />
                <b>Your photo will appear here</b>
                <small>Upload an image to start resizing</small>
                <button
                  className="primary-button"
                  onClick={() => inputRef.current?.click()}
                  style={{ marginTop: 15 }}
                >
                  <Upload size={15} /> Upload Photo
                </button>
              </div>
            )}
          </div>

          {image && (
            <>
              <div className="rotation-status">
                <span><CheckCircle2 size={14} /> Photo ready</span>
                <b>{rotation}° rotated</b>
              </div>

              <p className="privacy-line" style={{ marginTop: 14 }}>
                <LockKeyhole size={14} />
                Photo processing happens in your browser.
              </p>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div className="notice-box" role="status" style={{ marginTop: 15 }}>
          {notice}
          <button
            className="reset-button"
            onClick={() => setNotice('')}
            style={{ marginLeft: 10 }}
          >
            <CheckCircle2 size={14} /> OK
          </button>
        </div>
      )}
    </section>
  );
}