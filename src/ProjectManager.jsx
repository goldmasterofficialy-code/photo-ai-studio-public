import { useEffect, useState } from 'react';
import {
  FolderOpen,
  Save,
  Trash2,
  Image as ImageIcon,
  Download,
  Clock,
  Search
} from 'lucide-react';

const STORAGE_KEY = 'photo-ai-studio-projects';

export default function ProjectManager({ onOpen }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );
      setProjects(Array.isArray(saved) ? saved : []);
    } catch {
      setProjects([]);
    }
  }

  function deleteProject(id) {
    const updated = projects.filter(project => project.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProjects(updated);
    setNotice('Project deleted.');
  }

  function downloadProject(project) {
    if (!project.image) {
      setNotice('This project has no saved image.');
      return;
    }

    const link = document.createElement('a');
    link.href = project.image;
    link.download = `${project.name || 'photo-ai-project'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const filteredProjects = projects.filter(project =>
    (project.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="editor-page">
      <div className="page-heading">
        <div>
          <span className="overline">YOUR CREATIVE LIBRARY</span>
          <h1>My Projects</h1>
          <p>Your saved designs in one place.</p>
        </div>

        <span className="coming-chip">
          <FolderOpen size={15} />
          {projects.length} PROJECTS
        </span>
      </div>

      <div className="panel" style={{ padding: '22px' }}>
        <div className="searchbox" style={{ maxWidth: '420px' }}>
          <Search size={16} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search your projects..."
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="empty-projects" style={{ marginTop: '25px' }}>
            <FolderOpen size={45} />
            <h2>No saved projects yet</h2>
            <p>
              Save your designs from Poster Maker to see them here.
            </p>
          </div>
        ) : (
          <div
            className="tool-grid"
            style={{ marginTop: '25px' }}
          >
            {filteredProjects.map(project => (
              <article
                className="tool-card"
                key={project.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: '12px'
                }}
              >
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.name}
                    style={{
                      width: '100%',
                      height: '190px',
                      objectFit: 'contain',
                      background: '#171827',
                      borderRadius: '10px'
                    }}
                  />
                ) : (
                  <div style={{
                    height: '190px',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    <ImageIcon size={40} />
                  </div>
                )}

                <div>
                  <b>{project.name}</b>
                  <p>
                    <Clock size={13} />
                    {' '}
                    {project.date || 'Saved project'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <button
                    className="primary-button"
                    onClick={() => onOpen?.(project)}
                  >
                    Open
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => downloadProject(project)}
                  >
                    <Download size={15} />
                  </button>

                  <button
                    className="reset-button"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {notice && (
          <p className="privacy-line" role="status">
            {notice}
          </p>
        )}
      </div>
    </section>
  );
}