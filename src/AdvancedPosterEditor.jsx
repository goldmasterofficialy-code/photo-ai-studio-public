import './AdvancedPosterEditor.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload, ImagePlus, Type, Download, Save, Undo2, Redo2,
  Trash2, Plus, Move, RotateCcw, FileImage
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const STORAGE_KEY = 'photo-ai-studio-projects-v1';

const fonts = [
  'Arial',
  'Georgia',
  'Impact',
  'Verdana',
  'Times New Roman',
  'Courier New'
];

const stickers = ['⭐', '❤️', '🔥', '✨', '🎉', '🌸', '💯', '🎯'];

const initialDesign = {
  headline: 'MAKE IT MEMORABLE',
  subtitle: 'Your story starts here',
  font: 'Arial',
  fontSize: 58,
  textColor: '#ffffff',
  outline: false,
  shadow: true,
  textX: 540,
  textY: 850,
  subtitleSize: 24,
  logoX: 900,
  logoY: 1150,
  logoSize: 130,
  stickerList: []
};

export default function AdvancedPosterEditor() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const logoRef = useRef(null);
  const dragRef = useRef(null);
  const filePhotoRef = useRef(null);
  const fileLogoRef = useRef(null);

  const [photo, setPhoto] = useState('');
  const [logo, setLogo] = useState('');
  const [design, setDesign] = useState(initialDesign);

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [selectedSticker, setSelectedSticker] = useState(null);
  const [selectedItem, setSelectedItem] = useState('text');
  const [notice, setNotice] = useState('');
  const [assetsReady, setAssetsReady] = useState(0);
  const [exporting, setExporting] = useState(false);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const updateDesign = useCallback((changes) => {
    setDesign(current => {
      setPast(old => [...old.slice(-29), current]);
      setFuture([]);
      return { ...current, ...changes };
    });
  }, []);

  function updateSticker(id, changes) {
    setDesign(current => ({
      ...current,
      stickerList: current.stickerList.map(item =>
        item.id === id ? { ...item, ...changes } : item
      )
    }));
  }

  function undo() {
    if (!past.length) return;

    const previous = past[past.length - 1];

    setFuture(old => [design, ...old]);
    setPast(old => old.slice(0, -1));
    setDesign(previous);
    setNotice('Undo successful.');
  }

  function redo() {
    if (!future.length) return;

    const next = future[0];

    setPast(old => [...old.slice(-29), design]);
    setFuture(old => old.slice(1));
    setDesign(next);
    setNotice('Redo successful.');
  }

  function resetDesign() {
    setPast(old => [...old.slice(-29), design]);
    setFuture([]);
    setDesign(initialDesign);
    setSelectedSticker(null);
    setSelectedItem('text');
    setNotice('Design settings reset.');
  }

  function uploadPhoto(file) {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice('Please select JPG, PNG or WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setNotice('Photo must be smaller than 15 MB.');
      return;
    }

    const url = URL.createObjectURL(file);

    setPhoto(old => {
      if (old.startsWith('blob:')) URL.revokeObjectURL(old);
      return url;
    });

    setNotice('Photo uploaded successfully.');

    if (filePhotoRef.current) {
      filePhotoRef.current.value = '';
    }
  }

  function uploadLogo(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice('Please select a valid logo image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setNotice('Logo must be smaller than 10 MB.');
      return;
    }

    const url = URL.createObjectURL(file);

    setLogo(old => {
      if (old.startsWith('blob:')) URL.revokeObjectURL(old);
      return url;
    });

    setNotice('Logo uploaded successfully.');

    if (fileLogoRef.current) {
      fileLogoRef.current.value = '';
    }
  }

  function removePhoto() {
    setPhoto(old => {
      if (old.startsWith('blob:')) URL.revokeObjectURL(old);
      return '';
    });

    setNotice('Background photo removed.');
  }

  function removeLogo() {
    setLogo(old => {
      if (old.startsWith('blob:')) URL.revokeObjectURL(old);
      return '';
    });

    setNotice('Logo removed.');
  }

  function addSticker(value) {
    const sticker = {
      id: `${Date.now()}-${Math.random()}`,
      value,
      x: 540,
      y: 500,
      size: 65
    };

    updateDesign({
      stickerList: [...design.stickerList, sticker]
    });

    setSelectedSticker(sticker.id);
    setSelectedItem('sticker');
    setNotice('Sticker added. Drag it on the canvas.');
  }

  function deleteSelectedSticker() {
    if (!selectedSticker) return;

    updateDesign({
      stickerList: design.stickerList.filter(
        item => item.id !== selectedSticker
      )
    });

    setSelectedSticker(null);
    setSelectedItem('text');
    setNotice('Sticker deleted.');
  }

  function drawPoster() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    ctx.clearRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#30265f';
    ctx.fillRect(0, 0, 1080, 1350);

    if (imageRef.current?.complete && imageRef.current.naturalWidth) {
      const img = imageRef.current;
      const scale = Math.max(1080 / img.width, 1350 / img.height);
      const width = img.width * scale;
      const height = img.height * scale;

      ctx.drawImage(
        img,
        (1080 - width) / 2,
        (1350 - height) / 2,
        width,
        height
      );
    }

    const {
      headline,
      subtitle,
      font,
      fontSize,
      textColor,
      outline,
      shadow,
      textX,
      textY,
      subtitleSize,
      logoX,
      logoY,
      logoSize,
      stickerList
    } = design;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px "${font}"`;

    if (shadow) {
      ctx.shadowColor = '#000000b0';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 5;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    if (outline) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#111111';
      ctx.strokeText(headline, textX, textY, 950);
    }

    ctx.fillStyle = textColor;
    ctx.fillText(headline, textX, textY, 950);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = `${subtitleSize}px "${font}"`;
    ctx.fillText(subtitle, textX, textY + fontSize + 15, 950);

    stickerList.forEach(item => {
      ctx.font = `${item.size}px Arial`;
      ctx.fillText(item.value, item.x, item.y);
    });

    if (logo && logoRef.current?.complete && logoRef.current.naturalWidth) {
      ctx.drawImage(
        logoRef.current,
        logoX - logoSize / 2,
        logoY - logoSize / 2,
        logoSize,
        logoSize
      );
    }
  }

  useEffect(() => {
    drawPoster();
  }, [design, photo, logo, assetsReady]);

  useEffect(() => {
    return () => {
      if (photo.startsWith('blob:')) URL.revokeObjectURL(photo);
      if (logo.startsWith('blob:')) URL.revokeObjectURL(logo);
    };
  }, [photo, logo]);

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: Math.max(0, Math.min(1080,
        (event.clientX - rect.left) * 1080 / rect.width
      )),
      y: Math.max(0, Math.min(1350,
        (event.clientY - rect.top) * 1350 / rect.height
      ))
    };
  }

  function pointerDown(event) {
    if (event.button !== 0) return;

    const point = getCanvasPoint(event);

    const sticker = [...design.stickerList].reverse().find(item =>
      Math.abs(item.x - point.x) < item.size &&
      Math.abs(item.y - point.y) < item.size
    );

    let type = null;
    let id = null;

    if (sticker) {
      type = 'sticker';
      id = sticker.id;
      setSelectedSticker(sticker.id);
      setSelectedItem('sticker');
    } else if (
      logo &&
      Math.abs(point.x - design.logoX) < design.logoSize / 2 + 10 &&
      Math.abs(point.y - design.logoY) < design.logoSize / 2 + 10
    ) {
      type = 'logo';
      setSelectedItem('logo');
      setSelectedSticker(null);
    } else if (
      Math.abs(point.x - design.textX) < 475 &&
      Math.abs(point.y - design.textY) < design.fontSize + 35
    ) {
      type = 'text';
      setSelectedItem('text');
      setSelectedSticker(null);
    }

    if (!type) {
      setSelectedSticker(null);
      setSelectedItem('');
      return;
    }

    dragRef.current = {
      type,
      id,
      startDesign: design,
      startPoint: point
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;

    const point = getCanvasPoint(event);
    const dx = point.x - drag.startPoint.x;
    const dy = point.y - drag.startPoint.y;

    if (drag.type === 'text') {
      setDesign(current => ({
        ...current,
        textX: Math.max(50, Math.min(1030, drag.startDesign.textX + dx)),
        textY: Math.max(50, Math.min(1300, drag.startDesign.textY + dy))
      }));
    }

    if (drag.type === 'logo') {
      setDesign(current => ({
        ...current,
        logoX: Math.max(50, Math.min(1030, drag.startDesign.logoX + dx)),
        logoY: Math.max(50, Math.min(1300, drag.startDesign.logoY + dy))
      }));
    }

    if (drag.type === 'sticker') {
      setDesign(current => ({
        ...current,
        stickerList: current.stickerList.map(item =>
          item.id === drag.id
            ? {
                ...item,
                x: Math.max(30, Math.min(1050, item.x + dx)),
                y: Math.max(30, Math.min(1320, item.y + dy))
              }
            : item
        )
      }));

      drag.startPoint = point;
    }
  }

  function pointerUp() {
    const drag = dragRef.current;
    if (!drag) return;

    const before = drag.startDesign;

    setDesign(current => {
      if (JSON.stringify(before) !== JSON.stringify(current)) {
        setPast(old => [...old.slice(-29), before]);
        setFuture([]);
      }
      return current;
    });

    dragRef.current = null;
  }

  async function downloadPoster(format = 'png') {
    const canvas = canvasRef.current;
    if (!canvas || exporting) return;

    setExporting(true);

    try {
      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [1080, 1350]
        });

        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          1080,
          1350
        );

        pdf.save('photo-ai-poster.pdf');
      } else {
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpg' ? 0.94 : undefined;

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            result => result
              ? resolve(result)
              : reject(new Error('Could not export poster.')),
            mime,
            quality
          );
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `photo-ai-poster.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }

      setNotice(`Poster ${format.toUpperCase()} downloaded successfully.`);
    } catch (error) {
      setNotice(error.message || 'Download failed.');
    } finally {
      setExporting(false);
    }
  }

  function saveToProjects() {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const preview = canvas.toDataURL('image/jpeg', 0.88);

      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      const project = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: design.headline.trim() || 'Advanced Poster',
        preview,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([project, ...saved])
      );

      setNotice('Poster saved in My Projects.');
    } catch (error) {
      console.error(error);
      setNotice('Could not save project. Browser storage may be full.');
    }
  }

  return (
    <section className="advanced-editor">
      <div className="advanced-heading">
        <div>
          <span className="overline">PHOTO AI STUDIO / ADVANCED</span>
          <h1>Advanced Poster Editor</h1>
          <p>Design your poster with text, logo and stickers.</p>
        </div>

        <div className="advanced-actions">
          <button onClick={undo} disabled={!canUndo}>
            <Undo2 size={15} /> Undo
          </button>

          <button onClick={redo} disabled={!canRedo}>
            <Redo2 size={15} /> Redo
          </button>

          <button className="advanced-primary" onClick={() => downloadPoster('png')} disabled={exporting}>
            <Download size={15} /> PNG
          </button>

          <button className="advanced-primary" onClick={() => downloadPoster('jpg')} disabled={exporting}>
            <FileImage size={15} /> JPG
          </button>

          <button className="advanced-primary" onClick={() => downloadPoster('pdf')} disabled={exporting}>
            <Download size={15} /> PDF
          </button>

          <button className="advanced-primary" onClick={saveToProjects}>
            <Save size={15} /> Save Project
          </button>
        </div>
      </div>

      <div className="advanced-layout">
        <div className="advanced-panel">
          <h3><ImagePlus size={17} /> Background Photo</h3>

          <label className="advanced-upload">
            <Upload size={19} /> Upload Photo
            <input
              ref={filePhotoRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event => uploadPhoto(event.target.files?.[0])}
            />
          </label>

          {photo && (
            <button className="advanced-delete" onClick={removePhoto}>
              <Trash2 size={14} /> Remove Photo
            </button>
          )}

          <h3><Type size={17} /> Text Settings</h3>

          <label className="advanced-label">Headline</label>
          <input
            value={design.headline}
            maxLength={60}
            onChange={event => updateDesign({ headline: event.target.value })}
          />

          <label className="advanced-label">Subtitle</label>
          <input
            value={design.subtitle}
            maxLength={100}
            onChange={event => updateDesign({ subtitle: event.target.value })}
          />

          <label className="advanced-label">Font</label>
          <select
            value={design.font}
            onChange={event => updateDesign({ font: event.target.value })}
          >
            {fonts.map(item => <option key={item}>{item}</option>)}
          </select>

          <label className="advanced-label">
            Text size: {design.fontSize}px
          </label>
          <input
            type="range"
            min="20"
            max="110"
            value={design.fontSize}
            onChange={event => updateDesign({ fontSize: Number(event.target.value) })}
          />

          <label className="advanced-label">Text color</label>
          <input
            type="color"
            value={design.textColor}
            onChange={event => updateDesign({ textColor: event.target.value })}
          />

          <label className="advanced-check">
            <input
              type="checkbox"
              checked={design.shadow}
              onChange={event => updateDesign({ shadow: event.target.checked })}
            />
            Text Shadow
          </label>

          <label className="advanced-check">
            <input
              type="checkbox"
              checked={design.outline}
              onChange={event => updateDesign({ outline: event.target.checked })}
            />
            Text Outline
          </label>

          <h3><ImagePlus size={17} /> Logo</h3>

          <label className="advanced-upload">
            <Upload size={19} /> Upload Logo
            <input
              ref={fileLogoRef}
              hidden
              type="file"
              accept="image/*"
              onChange={event => uploadLogo(event.target.files?.[0])}
            />
          </label>

          {logo && (
            <>
              <button className="advanced-delete" onClick={removeLogo}>
                <Trash2 size={14} /> Remove Logo
              </button>

              <label className="advanced-label">
                Logo Size: {design.logoSize}px
              </label>
              <input
                type="range"
                min="30"
                max="350"
                value={design.logoSize}
                onChange={event => updateDesign({ logoSize: Number(event.target.value) })}
              />
            </>
          )}

          <h3><Plus size={17} /> Stickers</h3>

          <div className="advanced-stickers">
            {stickers.map(item => (
              <button key={item} onClick={() => addSticker(item)}>
                {item}
              </button>
            ))}
          </div>

          {selectedSticker && (
            <>
              <label className="advanced-label">
                Sticker Size: {
                  design.stickerList.find(item => item.id === selectedSticker)?.size || 65
                }px
              </label>

              <input
                type="range"
                min="20"
                max="180"
                value={
                  design.stickerList.find(item => item.id === selectedSticker)?.size || 65
                }
                onChange={event => {
                  const item = design.stickerList.find(
                    sticker => sticker.id === selectedSticker
                  );

                  if (item) {
                    updateDesign({
                      stickerList: design.stickerList.map(sticker =>
                        sticker.id === selectedSticker
                          ? { ...sticker, size: Number(event.target.value) }
                          : sticker
                      )
                    });
                  }
                }}
              />

              <button className="advanced-delete" onClick={deleteSelectedSticker}>
                <Trash2 size={14} /> Delete selected sticker
              </button>
            </>
          )}

          <button className="advanced-save" onClick={resetDesign}>
            <RotateCcw size={15} /> Reset Design
          </button>

          <button
            className="advanced-save"
            onClick={() => {
              setPast([]);
              setFuture([]);
              setNotice('Undo history cleared.');
            }}
          >
            <Save size={15} /> Clear Undo History
          </button>
        </div>

        <div className="advanced-canvas-panel">
          <div className="advanced-canvas-heading">
            <b>Your Poster Canvas</b>
            <span>4:5 · 1080 × 1350</span>
          </div>

          <div className="advanced-canvas-wrap">
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                touchAction: 'none',
                cursor: 'move'
              }}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
              onLostPointerCapture={pointerUp}
            />
          </div>

          <p className="advanced-help">
            <Move size={13} />
            Select and drag headline, logo or sticker to reposition it.
          </p>

          <p className="advanced-notice">
            {notice || 'Upload a photo to start designing your poster.'}
          </p>
        </div>
      </div>

      {photo && (
        <img
          ref={imageRef}
          src={photo}
          alt=""
          hidden
          onLoad={() => setAssetsReady(value => value + 1)}
        />
      )}

      {logo && (
        <img
          ref={logoRef}
          src={logo}
          alt=""
          hidden
          onLoad={() => setAssetsReady(value => value + 1)}
        />
      )}
    </section>
  );
}