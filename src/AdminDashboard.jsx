import React, { useState, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000';

/* ─── Drag & Drop File Zone ─── */
const DropZone = ({ label, hint, accept, onFile, currentPath, uploading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  const displayName = currentPath
    ? decodeURIComponent(currentPath.split('/').pop())
    : null;

  return (
    <div
      className={`dropzone ${isDragging ? 'dragover' : ''} ${uploading ? 'uploading' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`dz-${label.replace(/\s+/g,'')}`).click()}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && document.getElementById(`dz-${label.replace(/\s+/g,'')}`).click()}
      aria-label={`Upload ${label}`}
    >
      <input
        id={`dz-${label.replace(/\s+/g,'')}`}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div className="dropzone-icon">{uploading ? '⟳' : isDragging ? '↓' : '⊕'}</div>
      <div className="dropzone-label">{uploading ? 'Uploading…' : label}</div>
      {!uploading && <div className="dropzone-hint">{hint}</div>}
      {displayName && !uploading && (
        <div className="dropzone-current">
          <span className="dropzone-current-label">Current:</span> {displayName}
        </div>
      )}
    </div>
  );
};

/* ─── Main Dashboard ─── */
const AdminDashboard = ({ onBack, onDataChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('about');
  const [about, setAbout] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);

  const [aboutStatus, setAboutStatus] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'adminqq.') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLoginError('Invalid credentials. Try again.');
    }
  };

  const fetchData = async () => {
    try {
      const [resAbout, resProjects] = await Promise.all([
        fetch(`${API}/api/about`),
        fetch(`${API}/api/projects`)
      ]);
      setAbout(await resAbout.json());
      setProjects(await resProjects.json());
    } catch (err) {
      console.error(err);
    }
  };

  const getHeaders = (withContentType = true) => {
    const h = { 'Authorization': 'admin:adminqq.' };
    if (withContentType) h['Content-Type'] = 'application/json';
    return h;
  };

  /* ── CV Upload ── */
  const handleCvFile = async (file) => {
    setCvUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/api/upload/cv`, {
        method: 'POST',
        headers: { 'Authorization': 'admin:adminqq.' },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setAbout(prev => ({ ...prev, cv_path: data.path }));
        if (onDataChange) onDataChange();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCvUploading(false);
    }
  };

  /* ── Image Upload for project ── */
  const handleImageFile = async (file) => {
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}/api/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': 'admin:adminqq.' },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setEditingProject(prev => ({
          ...prev,
          images: [...(prev.images || []), data.path]
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImgUploading(false);
    }
  };

  const handleSaveAbout = async () => {
    setAboutStatus('saving');
    try {
      const res = await fetch(`${API}/api/about`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(about)
      });
      if (res.ok) {
        setAboutStatus('success');
        if (onDataChange) onDataChange();
        setTimeout(() => setAboutStatus(null), 3000);
      } else {
        setAboutStatus('error');
      }
    } catch {
      setAboutStatus('error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/api/projects/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
        if (onDataChange) onDataChange();
      }
    } catch {
      alert('Error deleting project');
    }
  };

  const handleSaveProject = async () => {
    if (!editingProject) return;
    setProjectStatus('saving');
    const isNew = !editingProject.id;
    const url = isNew
      ? `${API}/api/projects`
      : `${API}/api/projects/${editingProject.id}`;

    try {
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editingProject)
      });
      if (res.ok) {
        const saved = await res.json();
        if (isNew) {
          setProjects([...projects, saved]);
        } else {
          setProjects(projects.map(p => p.id === saved.id ? saved : p));
        }
        setProjectStatus('success');
        if (onDataChange) onDataChange();
        setTimeout(() => { setProjectStatus(null); setEditingProject(null); }, 1200);
      } else {
        setProjectStatus('error');
      }
    } catch {
      setProjectStatus('error');
    }
  };

  /* ── LOGIN ── */
  if (!isAuthenticated) {
    return (
      <div className="admin-login-view">
        <button className="nav-button" onClick={onBack}>← cd ..</button>
        <h2 className="detail-title rgb-split">./admin_login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="admin-input" value={username}
              onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="admin-input" value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {loginError && <div className="error-text">{loginError}</div>}
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            LOGIN →
          </button>
        </form>
      </div>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <div className="admin-dashboard-view">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button className="nav-button" onClick={onBack}>← cd ..</button>
        <h2 className="detail-title rgb-split" style={{ marginBottom: 0 }}>./management_dashboard</h2>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          ☰ Manage About
        </button>
        <button className={`admin-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
          ◈ Manage Projects
        </button>
      </div>

      {/* ── ABOUT TAB ── */}
      {activeTab === 'about' && about && (
        <div className="admin-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="admin-input" value={about.username}
              onChange={e => setAbout({ ...about, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Alias</label>
            <input type="text" className="admin-input" value={about.alias || ''}
              onChange={e => setAbout({ ...about, alias: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Legal Identity</label>
            <input type="text" className="admin-input" value={about.legal_identity || ''}
              onChange={e => setAbout({ ...about, legal_identity: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input type="text" className="admin-input" value={about.role}
              onChange={e => setAbout({ ...about, role: e.target.value })} />
          </div>
          <div className="form-group admin-form-full">
            <label className="form-label">Background</label>
            <textarea className="admin-input" style={{ minHeight: '120px', resize: 'vertical' }}
              value={about.background} onChange={e => setAbout({ ...about, background: e.target.value })} />
          </div>
          <div className="form-group admin-form-full">
            <label className="form-label">
              Skills
              <span style={{ color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem', fontWeight: 'normal' }}> — comma-separated</span>
            </label>
            <input type="text" className="admin-input"
              value={about.skills.join(', ')}
              onChange={e => setAbout({ ...about, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          </div>
          <div className="form-group admin-form-full">
            <label className="form-label">
              Certifications
              <span style={{ color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem', fontWeight: 'normal' }}> — comma-separated</span>
            </label>
            <input type="text" className="admin-input"
              value={about.certifications.join(', ')}
              onChange={e => setAbout({ ...about, certifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          </div>

          {/* CV Upload dropzone */}
          <div className="form-group admin-form-full">
            <label className="form-label">CV / Resume</label>
            <DropZone
              label="Drop CV here or click to browse"
              hint="Accepts PDF, DOCX — will be available as a download on the About page"
              accept=".pdf,.doc,.docx"
              onFile={handleCvFile}
              currentPath={about.cv_path}
              uploading={cvUploading}
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSaveAbout} disabled={aboutStatus === 'saving'}>
              {aboutStatus === 'saving' ? '⟳ Saving…' : '✓ Save About'}
            </button>
            {aboutStatus === 'success' && <span className="save-status success">Saved successfully</span>}
            {aboutStatus === 'error'   && <span className="save-status error">Save failed — check server</span>}
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <div style={{ width: '100%' }}>
          {editingProject ? (
            <div className="admin-edit-form">
              <h3>{editingProject.id ? '✎ Edit Project' : '+ New Project'}</h3>
              <div className="admin-form">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" className="admin-input" autoFocus
                    value={editingProject.title}
                    onChange={e => setEditingProject({ ...editingProject, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input type="text" className="admin-input"
                    value={editingProject.description}
                    onChange={e => setEditingProject({ ...editingProject, description: e.target.value })} />
                </div>
                <div className="form-group admin-form-full">
                  <label className="form-label">Full Content</label>
                  <textarea className="admin-input" style={{ minHeight: '160px', resize: 'vertical' }}
                    value={editingProject.content}
                    onChange={e => setEditingProject({ ...editingProject, content: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Github / External Link</label>
                  <input type="url" className="admin-input" placeholder="https://github.com/..."
                    value={editingProject.link}
                    onChange={e => setEditingProject({ ...editingProject, link: e.target.value })} />
                </div>

                {/* Image drop zone */}
                <div className="form-group admin-form-full">
                  <label className="form-label">Images</label>

                  {/* Existing images with remove button */}
                  {editingProject.images?.length > 0 && (
                    <div className="admin-image-preview-list">
                      {editingProject.images.map((img, i) => (
                        <div key={i} className="admin-image-preview-item">
                          <img src={img.startsWith('/uploads') ? `${API}${img}` : img} alt={`img ${i+1}`} />
                          <button
                            className="admin-image-remove"
                            onClick={() => setEditingProject({ ...editingProject, images: editingProject.images.filter((_, idx) => idx !== i) })}
                            title="Remove image"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <DropZone
                    label="Drop image here or click to browse"
                    hint="PNG, JPG, WEBP — adds to image list above"
                    accept="image/*"
                    onFile={handleImageFile}
                    uploading={imgUploading}
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={handleSaveProject} disabled={projectStatus === 'saving'}>
                    {projectStatus === 'saving' ? '⟳ Saving…' : '✓ Save Project'}
                  </button>
                  <button className="btn-ghost" onClick={() => { setEditingProject(null); setProjectStatus(null); }}
                    disabled={projectStatus === 'saving'}>
                    Cancel
                  </button>
                  {projectStatus === 'success' && <span className="save-status success">Saved!</span>}
                  {projectStatus === 'error'   && <span className="save-status error">Save failed</span>}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </span>
                <button className="btn-primary"
                  onClick={() => setEditingProject({ id: 0, title: '', description: '', content: '', link: '', images: [] })}>
                  + Add New Project
                </button>
              </div>
              <div className="admin-project-list">
                {projects.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No projects yet.</p>
                )}
                {projects.map(p => (
                  <div key={p.id} className="admin-project-item">
                    <div className="admin-project-info">
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                    </div>
                    <div className="admin-project-actions">
                      <button className="btn-ghost"
                        style={{ borderColor: 'rgba(88,166,255,0.3)', color: 'var(--blue-accent)' }}
                        onClick={() => setEditingProject(p)}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDeleteProject(p.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
