import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Aperture, WandSparkles, ImagePlus, Layers3, LayoutTemplate,
  FolderOpen, Settings2, Search, Bell, ChevronDown, Upload,
  Download, Sparkles, SlidersHorizontal, Type, Crop, Eraser,
  ScanFace, Languages, Menu, X, Plus, LockKeyhole, CircleHelp,
  ArrowUpRight, Image as ImageIcon, RotateCcw, Sun, Contrast,
 Droplets, LoaderCircle, Save, Trash2, ExternalLink, FileImage, LogOut
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './Auth';

import { jsPDF } from 'jspdf';
import {
  LANGUAGES,
  getTranslations,
  getDirection
} from './i18n';
import BackgroundRemover from './BackgroundRemover';
import PhotoEnhancer from './PhotoEnhancer';
import ResizeCrop from './ResizeCrop';
import ImageCompressor from './ImageCompressor';
import AdvancedPosterEditor from './AdvancedPosterEditor';
import LegalPages from './LegalPages';

const STORAGE_KEY = 'photo-ai-studio-projects-v1';



const tools = [
  { key: 'generate', icon: WandSparkles, tone: 'violet' },
  { key: 'edit', icon: Aperture, tone: 'blue' },
  { key: 'poster', icon: LayoutTemplate, tone: 'pink' },
  { key: 'remove', icon: Eraser, tone: 'orange' },
  { key: 'enhance', icon: ScanFace, tone: 'green' },
  { key: 'resize', icon: Crop, tone: 'cyan' },
  { key: 'compress', icon: FileImage, tone: 'violet' }
];

const templateCards = [
  { name: 'Event & Launch', tag: 'EVENT', cls: 'template-event' },
  { name: 'Birthday Story', tag: 'CELEBRATE', cls: 'template-birthday' },
  { name: 'Business Promo', tag: 'BRAND', cls: 'template-business' },
  { name: 'Festival Greeting', tag: 'FESTIVAL', cls: 'template-festival' }
];

function readProjects(storageKey) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image could not be loaded.'));
    img.src = src;
  });
}

export default function App() {
 const [lang, setLang] = useState(() => {
  try {
    const savedLang = localStorage.getItem('photo-ai-language');
    return LANGUAGES.some(item => item.code === savedLang)
      ? savedLang
      : 'en';
  } catch {
    return 'en';
  }
});
  const [active, setActiveState] = useState('overview');

const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const location = useLocation();
const navigate = useNavigate();

const routeMap = {
  '/': 'overview',
  '/ai-image-generator': 'generate',
  '/ai-photo-editor': 'edit',
  '/poster-maker': 'poster',
  '/advanced-poster': 'advanced-poster',
  '/projects': 'projects',
  '/templates': 'templates',
  '/background-remover': 'remove',
  '/ai-photo-enhancer': 'enhance',
  '/image-resizer': 'resize',
  '/image-compressor': 'compress',
'/about': 'about',
'/contact': 'contact',
'/privacy-policy': 'privacy',
'/terms-and-conditions': 'terms'
};

const activeRoutes = {
  overview: '/',
  generate: '/ai-image-generator',
  edit: '/ai-photo-editor',
  poster: '/poster-maker',
  'advanced-poster': '/advanced-poster',
  projects: '/projects',
  templates: '/templates',
  remove: '/background-remover',
  enhance: '/ai-photo-enhancer',
  resize: '/image-resizer',
 compress: '/image-compressor',
about: '/about',
contact: '/contact',
privacy: '/privacy-policy',
terms: '/terms-and-conditions'
};

useEffect(() => {
 const page = routeMap[location.pathname] || 'overview';
  setActiveState(page);
}, [location.pathname]);
useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    },
    (error) => {
      console.error('Authentication error:', error);
      setAuthLoading(false);
    }
  );

  return () => unsubscribe();
}, []);

function setActive(page) {
  setActiveState(page);

  const path = activeRoutes[page] || '/';

  if (location.pathname !== path) {
    navigate(path);
  }

  setMobileOpen(false);
}

  const [image, setImage] = useState('');
  const [sourceImageData, setSourceImageData] = useState('');
  const [legacyFlattened, setLegacyFlattened] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const [headline, setHeadline] = useState('MAKE IT MEMORABLE');
  const [subtitle, setSubtitle] = useState('Your story starts here');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [headlineSize, setHeadlineSize] = useState(42);
  const [subtitleSize, setSubtitleSize] = useState(22);
  const [textColor, setTextColor] = useState('#ffffff');

  const [projects, setProjects] = useState([]);
const [projectsLoadedFor, setProjectsLoadedFor] = useState(null);
const projectsStorageKey = user
  ? `${STORAGE_KEY}-${user.uid}`
  : null;
  const [notice, setNotice] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const fileRef = useRef(null);
  const exportInProgress = useRef(false);

  const t = getTranslations(lang);
  useEffect(() => {
  try {
    localStorage.setItem('photo-ai-language', lang);
  } catch (error) {
    console.error('Language preference could not be saved:', error);
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = getDirection(lang);
}, [lang]);

  // Login user ke projects load karo
useEffect(() => {
  if (!user || !projectsStorageKey) {
    setProjects([]);
    setProjectsLoadedFor(null);
    return;
  }

  const savedProjects = readProjects(projectsStorageKey);

  setProjects(savedProjects);
  setProjectsLoadedFor(projectsStorageKey);
}, [user, projectsStorageKey]);

// Sirf current login user ke projects save karo
useEffect(() => {
  if (!projectsStorageKey || projectsLoadedFor !== projectsStorageKey) {
    return;
  }

  try {
    localStorage.setItem(
      projectsStorageKey,
      JSON.stringify(projects)
    );
  } catch (error) {
    console.error('Project storage error:', error);
    setNotice('Storage full. Please delete some old projects.');
  }
}, [projects, projectsStorageKey, projectsLoadedFor]);

  useEffect(() => {
    return () => {
      if (image.startsWith('blob:')) URL.revokeObjectURL(image);
    };
  }, [image]);

  const activeTitle = {
    overview: t.nav[0],
    generate: t.generate,
    edit: t.edit,
    poster: t.poster,
    'advanced-poster': 'Advanced Poster Editor',
    projects: t.nav[3],
    templates: t.nav[4],
    remove: t.remove,
    enhance: t.enhance,
    resize: t.resize,
    compress: t.compress,
about: 'About Us',
contact: 'Contact Us',
privacy: 'Privacy Policy',
terms: 'Terms & Conditions'
  }[active] || t.title;

async function handleLogout() {
  try {
    await signOut(auth);
    setNotice('');
    setActiveState('overview');
    navigate('/');
  } catch (error) {
    console.error('Logout error:', error);
    setNotice('Logout failed. Please try again.');
  }
}
  async function selectImage(file) {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice('Please select JPG, PNG or WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setNotice('Image must be smaller than 15 MB.');
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          setNotice('Could not read image.');
          return;
        }

        if (image.startsWith('blob:')) URL.revokeObjectURL(image);

        setImage(URL.createObjectURL(file));
        setSourceImageData(reader.result);
        setFileName(file.name);
        setSelectedFile(file);
        setEditedImage('');
        setLegacyFlattened(false);
        setNotice('');
      };

      reader.onerror = () => setNotice('Could not read image.');
      reader.readAsDataURL(file);
    } catch {
      setNotice('Image upload failed.');
    }
  }

  function removeUploadedImage() {
    if (image.startsWith('blob:')) URL.revokeObjectURL(image);

    setImage('');
    setSourceImageData('');
    setFileName('');
    setSelectedFile(null);
    setEditedImage('');
    setLegacyFlattened(false);

    if (fileRef.current) fileRef.current.value = '';
  }

  async function callAI(endpoint) {
    if (aiLoading) return;

    const isGenerate = endpoint === 'generate';
    const currentPrompt = isGenerate ? prompt.trim() : editPrompt.trim();

    if (!currentPrompt) {
      setNotice('Please enter a prompt.');
      return;
    }

    if (!isGenerate && !selectedFile) {
      setNotice('Please upload an image first.');
      return;
    }

    setAiLoading(true);
    setNotice('');

    try {
      let options;

      if (isGenerate) {
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: currentPrompt })
        };
      } else {
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('prompt', currentPrompt);
        options = { method: 'POST', body: formData };
      }

      const response = await fetch(`/api/ai/${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'AI request failed.');
      if (!data.image) throw new Error('AI did not return an image.');

      if (isGenerate) setGeneratedImage(data.image);
      else setEditedImage(data.image);

      setNotice('AI image created successfully!');
    } catch (error) {
      setNotice(error.message || 'AI service is not available.');
    } finally {
      setAiLoading(false);
    }
  }

  function downloadDataImage(data, filename) {
    if (!data) {
      setNotice('No image available.');
      return;
    }

    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function createPosterCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas could not be created.');

    ctx.fillStyle = '#30265f';
    ctx.fillRect(0, 0, 1080, 1350);

    if (image) {
      const img = await loadImage(image);
      const scale = Math.max(1080 / img.width, 1350 / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      ctx.save();
      ctx.filter =
        `brightness(${brightness}%) ` +
        `contrast(${contrast}%) ` +
        `saturate(${saturation}%)`;

      ctx.drawImage(
        img,
        (1080 - drawWidth) / 2,
        (1350 - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    }

    if (!legacyFlattened) {
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.font = `bold ${headlineSize}px Arial`;
      ctx.fillText(headline, 540, 880, 950);
      ctx.font = `${subtitleSize}px Arial`;
      ctx.fillText(subtitle, 540, 1050, 950);
    }

    return canvas;
  }

  async function saveProject() {
    if (exportInProgress.current) return;

    if (!image || !sourceImageData) {
      setNotice('Please upload an original photo before saving.');
      return;
    }

    exportInProgress.current = true;

    try {
      const canvas = await createPosterCanvas();
      const preview = canvas.toDataURL('image/jpeg', 0.85);

      const project = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: headline.trim() || 'My Poster',
        sourceImageData,
        preview,
        headline,
        subtitle,
        brightness,
        contrast,
        saturation,
        headlineSize,
        subtitleSize,
        textColor,
        selectedTemplate,
        createdAt: new Date().toISOString()
      };

      setProjects(current => [project, ...current]);
      setNotice(t.projectSaved);
      setActive('projects');
    } catch (error) {
      console.error(error);
      setNotice('Could not save project. Try a smaller image.');
    } finally {
      exportInProgress.current = false;
    }
  }

  function openProject(project) {
    setHeadline(project.headline || '');
    setSubtitle(project.subtitle || '');
    setBrightness(project.brightness ?? 100);
    setContrast(project.contrast ?? 100);
    setSaturation(project.saturation ?? 100);
    setHeadlineSize(project.headlineSize ?? 42);
    setSubtitleSize(project.subtitleSize ?? 22);
    setTextColor(project.textColor || '#ffffff');
    setSelectedTemplate(project.selectedTemplate ?? 0);

    if (project.sourceImageData) {
      setImage(project.sourceImageData);
      setSourceImageData(project.sourceImageData);
      setLegacyFlattened(false);
      setFileName(project.name || 'Saved project');
      setNotice('Project opened. You can edit the text and adjustments.');
    } else {
      setImage(project.preview);
      setSourceImageData('');
      setLegacyFlattened(true);
      setFileName('Older saved poster');
      setNotice('Older project opened. Upload an original photo to make a new editable project.');
    }

    setSelectedFile(null);
    setEditedImage('');
    setActive('poster');
  }

  function deleteProject(id) {
    if (!window.confirm('Delete this saved project?')) return;

    setProjects(current => current.filter(project => project.id !== id));
    setNotice(t.projectDeleted);
  }

  async function exportPoster(format = 'png') {
    if (exportInProgress.current) return;

    exportInProgress.current = true;

    try {
      const canvas = await createPosterCanvas();

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [1080, 1350]
        });

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1080, 1350);
        pdf.save('poster.pdf');
      } else {
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            value => value
              ? resolve(value)
              : reject(new Error('Export failed.')),
            mime,
            0.95
          );
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `poster.${format}`;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }

      setNotice(`Poster ${format.toUpperCase()} downloaded!`);
    } catch (error) {
      setNotice(error.message || 'Download failed.');
    } finally {
      exportInProgress.current = false;
    }
  }
if (authLoading) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12
    }}>
      <LoaderCircle size={32} />
      <p>Checking your login...</p>
    </div>
  );
}

const publicPages = [
  'overview',
  'about',
  'contact',
  'privacy',
  'terms'
];

const requiresLogin = !user && !publicPages.includes(active);

if (requiresLogin) {
  return <Auth onLogin={setUser} />;
}
  const sidebar = (
    <aside className={`sidebar ${mobileOpen ? 'mobile-visible' : ''}`}>
      <div className="side-brand">
        <span className="brand-symbol"><Aperture size={21} /></span>
        <span>PHOTO<span>AI</span></span>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <div className="side-section-label">{t.workspace}</div>

      {[
        { key: 'overview', label: t.nav[0], icon: Layers3 },
        { key: 'generate', label: t.nav[1], icon: WandSparkles },
        { key: 'poster', label: t.nav[2], icon: LayoutTemplate },
       
        ...(user ? [
        { key: 'projects', label: t.nav[3], icon: FolderOpen }
        ] : []),
        { key: 'templates', label: t.nav[4], icon: ImageIcon }
        ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={`side-link ${active === key ? 'active' : ''}`}
          onClick={() => {
            setActive(key);
            setMobileOpen(false);
          }}
        >
          <Icon size={17} />{label}
          {key === 'generate' && <span className="new-tag">AI</span>}
        </button>
      ))}

      <button
        className={`side-link ${active === 'advanced-poster' ? 'active' : ''}`}
        onClick={() => {
          setActive('advanced-poster');
          setMobileOpen(false);
        }}
      >
        <span className="tool-mini violet"><WandSparkles size={14} /></span>
        Advanced Poster Editor
      </button>

      <div className="side-section-label tools-label">{t.tools}</div>

      {tools.map(({ key, icon: Icon, tone }) => (
        <button
          key={key}
          className={`side-link ${active === key ? 'active' : ''}`}
          onClick={() => {
            setActive(key);
            setMobileOpen(false);
          }}
        >
          <span className={`tool-mini ${tone}`}><Icon size={14} /></span>
          {t[key]}
        </button>
      ))}

      <div className="sidebar-bottom">
        <div className="plan-card">
          <div className="plan-icon"><Sparkles size={17} /></div>
          <b>{t.pro}</b>
          <p>Unlock your full creative potential.</p>
        </div>

      <button className="side-link" onClick={() => setNotice('Settings page is coming soon.')}>
          <Settings2 size={17} />{t.settings}
        </button>

       {user ? (
        <div className="user-mini">
        <div className="avatar">
        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
        </div>

       <div style={{ minWidth: 0 }}>
      <b>{user.displayName || 'User'}</b>
      <small>{user.email}</small>
    </div>
  </div>
) : (
  <button
    className="side-link"
    onClick={() => setActive('generate')}
  >
    Login / Create Account
  </button>
)}

{user && (
  <button className="side-link" onClick={handleLogout}>
    <LogOut size={17} />
    Logout
  </button>
)}
      </div>
    </aside>
  );

  return (
    <div className="app">
      {sidebar}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            PHOTO AI <span>/</span> {activeTitle}
          </div>

          <div className="topbar-actions">
            <div className="searchbox">
              <Search size={16} />
              <input placeholder={t.search} />
              <kbd>⌘ K</kbd>
            </div>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>

           <div className="language-selector">
  <Languages size={16} />

  <select
    className="language-select"
    value={lang}
    onChange={(event) => setLang(event.target.value)}
    aria-label="Select language"
  >
    {LANGUAGES.map((language) => (
      <option key={language.code} value={language.code}>
        {language.name}
      </option>
    ))}
  </select>
</div>

            <div className="avatar top-avatar">C</div>
          </div>
        </header>

        <div className="page-content">
{['about', 'contact', 'privacy', 'terms'].includes(active) && (
  <LegalPages
    page={active}
  />
)}
          {active === 'overview' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="overline">{t.greeting} ✦</div>
                  <h1>{t.title}</h1>
                  <p>{t.sub}</p>
                </div>
                <button className="primary-button" onClick={() => setActive('poster')}>
                  <Plus size={17} />{t.newProject}
                </button>
              </section>

              <section className="hero-banner">
                <div className="banner-copy">
                  <span className="banner-pill"><Sparkles size={13} />{t.pro}</span>
                  <h2>Imagine it. Create it.</h2>
                  <p>Your all-in-one creative studio is ready for your next idea.</p>
                  <button onClick={() => setActive('generate')}>
                    {t.start}<ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="banner-art">
                  <div className="banner-orb orb-one" />
                  <div className="banner-orb orb-two" />
                  <div className="floating-tile tile-one"><WandSparkles /></div>
                  <div className="floating-tile tile-two"><ImageIcon /></div>
                  <div className="banner-sample">
                    <span>CREATE</span>
                    <b>YOUR<br />VISION</b>
                    <i>PHOTO AI STUDIO</i>
                  </div>
                </div>
              </section>

              <div className="section-title">
                <div><span className="overline">{t.quickStart}</span><h2>{t.allTools}</h2></div>
                <span className="muted-caption">7 CREATIVE TOOLS</span>
              </div>

              <section className="tool-grid">
                {tools.map(({ key, icon: Icon, tone }) => (
                  <button className="tool-card" key={key} onClick={() => setActive(key)}>
                    <div className={`tool-icon ${tone}`}><Icon size={21} /></div>
                    <div><b>{t[key]}</b><p>Open creative workspace</p></div>
                    <ArrowUpRight className="tool-arrow" size={16} />
                  </button>
                ))}
              </section>

              <div className="section-title templates-title">
                <div><span className="overline">{t.popular}</span><h2>{t.templates}</h2></div>
                <button className="subtle-button" onClick={() => setActive('templates')}>
                  {t.viewAll}<ArrowUpRight size={14} />
                </button>
              </div>

              <section className="template-grid">
                {templateCards.map((item, index) => (
                  <button
                    key={item.name}
                    className={`template-tile ${item.cls}`}
                    onClick={() => {
                      setSelectedTemplate(index);
                      setActive('poster');
                    }}
                  >
                    <span>{item.tag}</span><b>{item.name}</b><i>PHOTO AI DESIGN</i>
                  </button>
                ))}
              </section>
            </>
          )}

          {active === 'poster' && (
            <section className="editor-page">
              <div className="page-heading">
                <div>
                  <span className="overline">CREATIVE WORKSPACE / 03</span>
                  <h1>{t.poster}</h1>
                  <p>Design, edit and save your poster.</p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="primary-button" onClick={saveProject}>
                    <Save size={16} /> {t.save}
                  </button>
                  <button className="primary-button" onClick={() => exportPoster('png')}>
                    <Download size={16} /> PNG
                  </button>
                  <button className="primary-button" onClick={() => exportPoster('jpg')}>
                    <Download size={16} /> JPG
                  </button>
                  <button className="primary-button" onClick={() => exportPoster('pdf')}>
                    <Download size={16} /> PDF
                  </button>
                </div>
              </div>

              <div className="editor-layout">
                <section className="editor-controls panel">
                  <div className="panel-head">
                    <h3><Upload size={17} />{t.upload}</h3><span>15 MB MAX</span>
                  </div>

                  <button className="upload-box" onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={27} /><b>{t.choose}</b>
                    <small>{fileName || t.uploadHint}</small>
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={event => selectImage(event.target.files?.[0])}
                  />

                  {image && (
                    <button className="remove-image" onClick={removeUploadedImage}>
                      {t.removeImage}
                    </button>
                  )}

                  <div className="panel-head controls-head">
                    <h3><SlidersHorizontal size={17} />{t.adjustments}</h3>
                    <button className="reset-button" onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }}>
                      <RotateCcw size={13} />{t.reset}
                    </button>
                  </div>

                  {[
                    [t.brightness, brightness, setBrightness, Sun],
                    [t.contrast, contrast, setContrast, Contrast],
                    [t.saturation, saturation, setSaturation, Droplets]
                  ].map(([label, value, setter, Icon]) => (
                    <label className="range-control" key={label}>
                      <span><span><Icon size={14} />{label}</span><b>{value}%</b></span>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={value}
                        onChange={event => setter(Number(event.target.value))}
                      />
                    </label>
                  ))}

                  <div className="panel-head controls-head">
                    <h3><Type size={17} />{t.headline}</h3>
                  </div>

                  <input
                    className="text-input"
                    value={headline}
                    maxLength={30}
                    onChange={event => setHeadline(event.target.value)}
                  />

                  <label className="field-label">{t.subtitle}</label>
                  <input
                    className="text-input"
                    value={subtitle}
                    maxLength={50}
                    onChange={event => setSubtitle(event.target.value)}
                  />

                  <label className="field-label">Headline size: {headlineSize}</label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={headlineSize}
                    onChange={event => setHeadlineSize(Number(event.target.value))}
                  />

                  <label className="field-label">Subtitle size: {subtitleSize}</label>
                  <input
                    type="range"
                    min="12"
                    max="60"
                    value={subtitleSize}
                    onChange={event => setSubtitleSize(Number(event.target.value))}
                  />

                  <label className="field-label">Text color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={event => setTextColor(event.target.value)}
                  />
                </section>

                <section className="canvas-section">
                  <div className="canvas-top">
                    <b>{t.canvas}</b><span>4:5 · 1080 × 1350</span>
                  </div>

                  <div className={`poster-canvas ${templateCards[selectedTemplate]?.cls || ''}`}>
                    {image ? (
                      <img
                        src={image}
                        alt="Poster background"
                        style={{
                          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                        }}
                      />
                    ) : (
                      <div className="canvas-empty">
                        <ImagePlus size={38} />
                        <b>{t.noImage}</b>
                        <small>{t.uploadHint}</small>
                        <button onClick={() => fileRef.current?.click()}>{t.upload}</button>
                      </div>
                    )}

                    {!legacyFlattened && (
                      <div className="canvas-text">
                        <small>PHOTO AI STUDIO</small>
                        <h2 style={{ color: textColor, fontSize: `${headlineSize}px` }}>
                          {headline}
                        </h2>
                        <p style={{ color: textColor, fontSize: `${subtitleSize}px` }}>
                          {subtitle}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="privacy-line">
                    <LockKeyhole size={13} />{t.local}
                  </p>
                </section>
              </div>
            </section>
          )}

          {active === 'advanced-poster' && <AdvancedPosterEditor />}

          {active === 'projects' && (
            <section>
              <div className="page-heading">
                <div>
                  <span className="overline">YOUR DESIGN LIBRARY</span>
                  <h1>{t.projects}</h1>
                  <p>{projects.length} saved project(s)</p>
                </div>
                <button className="primary-button" onClick={() => setActive('poster')}>
                  <Plus size={16} /> {t.newProject}
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="empty-projects panel">
                  <FolderOpen size={42} />
                  <h2>{t.empty}</h2>
                  <p>{t.emptyHint}</p>
                  <button className="primary-button" onClick={() => setActive('poster')}>
                    <Plus size={16} /> {t.newProject}
                  </button>
                </div>
              ) : (
                <div className="template-grid">
                  {projects.map(project => (
                    <article className="panel" key={project.id} style={{ overflow: 'hidden' }}>
                      <img
                        src={project.preview}
                        alt={project.name}
                        style={{
                          width: '100%',
                          aspectRatio: '4 / 5',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <div style={{ padding: 12 }}>
                        <b style={{ display: 'block', fontSize: 12 }}>{project.name}</b>
                        <small style={{ color: '#929ab3', fontSize: 9 }}>
                          {new Date(project.createdAt).toLocaleString()}
                        </small>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
                          <button className="primary-button" onClick={() => openProject(project)}>
                            <ExternalLink size={14} /> {t.open}
                          </button>
                          <button
                            className="primary-button"
                            onClick={() => downloadDataImage(project.preview, 'saved-poster.jpg')}
                          >
                            <Download size={14} /> {t.download}
                          </button>
                          <button className="reset-button" onClick={() => deleteProject(project.id)}>
                            <Trash2 size={14} /> {t.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {active === 'generate' && (
            <section className="ai-page">
              <div className="page-heading">
                <div>
                  <span className="overline">AI CREATION LAB / 01</span>
                  <h1>{t.generate}</h1>
                  <p>Turn your imagination into an image.</p>
                </div>
                <span className="coming-chip"><Sparkles size={13} />AI IMAGE STUDIO</span>
              </div>

              <div className="ai-workspace panel">
                <div className="ai-visual">
                  {generatedImage ? (
                    <div style={{ width: '100%' }}>
                      <img
                        src={generatedImage}
                        alt="Generated"
                        style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
                      />
                      <button
                        className="primary-button"
                        onClick={() => downloadDataImage(generatedImage, 'generated.png')}
                      >
                        <Download size={16} /> Download
                      </button>
                    </div>
                  ) : (
                    <>
                      <WandSparkles size={42} />
                      <h2>A blank canvas for big ideas.</h2>
                      <p>{t.aiDetail}</p>
                    </>
                  )}
                </div>

                <div className="ai-form">
                  <label>{t.prompt}</label>
                  <textarea
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    placeholder={t.promptHint}
                  />
                  <button
                    className="primary-button wide"
                    onClick={() => callAI('generate')}
                    disabled={!prompt.trim() || aiLoading}
                  >
                    {aiLoading ? <LoaderCircle size={16} /> : <Sparkles size={16} />}
                    {t.create}
                  </button>
                  <div className="notice-box">
                    <LockKeyhole size={16} />
                    <div><b>{t.aiNotice}</b><p>{t.aiDetail}</p></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {active === 'edit' && (
            <section className="ai-page">
              <div className="page-heading">
                <div>
                  <span className="overline">AI PHOTO EDITING LAB / 02</span>
                  <h1>{t.edit}</h1>
                  <p>Upload your photo and describe the changes.</p>
                </div>
              </div>

              <div className="ai-workspace panel">
                <div className="ai-visual">
                  {editedImage ? (
                    <img
                      src={editedImage}
                      alt="Edited"
                      style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
                    />
                  ) : image ? (
                    <img
                      src={image}
                      alt="Original"
                      style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
                    />
                  ) : (
                    <><ImagePlus size={42} /><h2>Upload your photo</h2></>
                  )}
                </div>

                <div className="ai-form">
                  <button className="upload-box" onClick={() => fileRef.current?.click()}>
                    <Upload size={25} /><b>{t.choose}</b>
                    <small>{fileName || t.uploadHint}</small>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={event => selectImage(event.target.files?.[0])}
                  />
                  <label>{t.editPrompt}</label>
                  <textarea
                    value={editPrompt}
                    onChange={event => setEditPrompt(event.target.value)}
                  />
                  <button
                    className="primary-button wide"
                    onClick={() => callAI('edit')}
                    disabled={!selectedFile || !editPrompt.trim() || aiLoading}
                  >
                    {aiLoading ? <LoaderCircle size={16} /> : <Sparkles size={16} />}
                    {t.editButton}
                  </button>
                  <button className="reset-button" onClick={removeUploadedImage}>
                    <RotateCcw size={14} /> Remove photo
                  </button>
                </div>
              </div>
            </section>
          )}

          {active === 'remove' && <BackgroundRemover />}
          {active === 'enhance' && <PhotoEnhancer />}
          {active === 'resize' && <ResizeCrop />}
          {active === 'compress' && <ImageCompressor />}

          {active === 'templates' && (
            <section>
              <div className="page-heading">
                <div>
                  <span className="overline">DESIGN LIBRARY</span>
                  <h1>{t.templates}</h1>
                </div>
              </div>
              <div className="template-grid large">
                {templateCards.map((item, index) => (
                  <button
                    key={item.name}
                    className={`template-tile ${item.cls}`}
                    onClick={() => {
                      setSelectedTemplate(index);
                      setActive('poster');
                    }}
                  >
                    <span>{item.tag}</span>
                    <b>{item.name}</b>
                    <i>PHOTO AI DESIGN</i>
                  </button>
                ))}
              </div>
            </section>
          )}

          {notice && (
            <div className="toast" role="status">
              <CircleHelp size={16} />{notice}
              <button onClick={() => setNotice('')}><X size={14} /></button>
            </div>
          )}

          <footer className="footer professional-footer">
  <div className="footer-brand">
    <div className="footer-logo">
      <Aperture size={22} />
      <strong>PHOTO<span>AI</span> STUDIO</strong>
    </div>
    <p>
      Create, edit and enhance your photos with simple creative tools.
    </p>
  </div>

  <div className="footer-links">
    <b>Company</b>
    <button onClick={() => setActive('about')}>About Us</button>
    <button onClick={() => setActive('contact')}>Contact Us</button>
  </div>

  <div className="footer-links">
    <b>Legal</b>
    <button onClick={() => setActive('privacy')}>Privacy Policy</button>
    <button onClick={() => setActive('terms')}>Terms & Conditions</button>
  </div>

  <div className="footer-links">
    <b>Contact</b>
    <a href="mailto:m.d.mpsd@gmail.com">m.d.mpsd@gmail.com</a>
    <a
      href="https://wa.me/918887516714"
      target="_blank"
      rel="noreferrer"
    >
      WhatsApp Support
    </a>
  </div>

  <div className="footer-bottom">
    <span>© 2026 PHOTO AI STUDIO. All rights reserved.</span>
    <span>CREATE WITHOUT LIMITS ✦</span>
  </div>
</footer>
        </div>
      </main>
    </div>
  );
}