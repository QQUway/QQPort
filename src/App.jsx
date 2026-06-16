import { useState, useEffect } from 'react';
import Arpeggiator from './Arpeggiator';
import BootSequence from './BootSequence';
import MusicPage from './MusicPage';
import Neofetch from './Neofetch';

// Static data — bundled at build time, edited via manage.js
import projectsData from '../data/projects.json';
import aboutData    from '../data/about.json';

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [projects]  = useState(projectsData);
  const [about]     = useState(aboutData);
  const [loading]   = useState(false);
  const [error]     = useState(null);

  const [currentView, setCurrentView] = useState('hero');
  const [activeProject, setActiveProject] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [cmdError, setCmdError] = useState('');

  const navigate = (view) => {
    setCurrentView(view);
    setCmdError('');
    setInputValue('');
  };

  const handleProjectClick = (project) => {
    setActiveProject(project);
    navigate('project');
  };

  const handleBack = () => {
    if (currentView === 'project') navigate('home');
    else navigate('hero');
  };

  const handleCommandSubmit = (e) => {
    if (e.key !== 'Enter') return;
    const cmd = inputValue.trim().toLowerCase();
    if (!cmd) return;

    setInputValue('');
    setCmdError('');

    const routes = {
      './whoami': 'about', 'whoami': 'about',
      './projects': 'home', 'cd projects': 'home',
      './music': 'music', 'cd music': 'music',
      './arp': 'music',
      'help': 'hero', 'home': 'hero', 'ls': 'hero',
    };

    if (routes[cmd]) {
      navigate(routes[cmd]);
    } else if (cmd === 'cd ..') {
      if (currentView === 'project') navigate('home');
      else navigate('hero');
    } else if (cmd === 'clear') {
      setCmdError('');
    } else {
      setCmdError(`bash: ${cmd}: command not found`);
    }
  };

  const handleBootComplete = () => setIsBooting(false);

  const promptPath = {
    home: '~/projects',
    project: `~/projects/${activeProject?.title?.toLowerCase().replace(/\s+/g,'-') ?? ''}`,
    about: '~/whoami',
    music: '~/music',
  }[currentView] ?? '~';

  return (
    <div className="app-layout">
      <div className="ethereal-glow"></div>

      <nav className="top-navbar">
        <div className="normie-nav-top">
          <button className={`normie-btn glitch-text ${currentView === 'hero'  ? 'active' : ''}`} data-text="Home"     onClick={() => navigate('hero')}  aria-label="Home">Home</button>
          <button className={`normie-btn glitch-text ${currentView === 'home'  ? 'active' : ''}`} data-text="Projects" onClick={() => navigate('home')}  aria-label="Projects">Projects</button>
          <button className={`normie-btn glitch-text ${currentView === 'about' ? 'active' : ''}`} data-text="About Me" onClick={() => navigate('about')} aria-label="About Me">About Me</button>
          <button className={`normie-btn glitch-text ${currentView === 'music' ? 'active' : ''}`} data-text="Music"    onClick={() => navigate('music')} aria-label="Music">Music</button>
        </div>
      </nav>

      <main className="terminal-wrapper crt-flicker">
        <div className="scanlines"></div>
        <div className="terminal-container">
          <div className="terminal-content">

            <div className="terminal-body rgb-split">
              {isBooting ? (
                <BootSequence onComplete={handleBootComplete} />
              ) : (
                <>
                  {/* ── HERO / NEOFETCH ── */}
                  {currentView === 'hero' && (
                    <Neofetch projects={projects} about={about} onNavigate={navigate} />
                  )}

                  {/* ── PROJECTS ── */}
                  {currentView === 'home' && (
                    <div className="detail-view">
                      <button className="nav-button" onClick={handleBack}>← cd ..</button>
                      <div className="projects-grid">
                        {projects.length === 0 && <p className="text-muted">No projects found.</p>}
                        {projects.map(p => (
                          <div key={p.id} className="project-card"
                            onClick={() => handleProjectClick(p)}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && handleProjectClick(p)}
                            aria-label={`Open project: ${p.title}`}
                          >
                            <h3 className="project-title">{p.title}</h3>
                            <p>{p.description}</p>
                            <div className="click-hint">Click to expand details</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── PROJECT DETAIL ── */}
                  {currentView === 'project' && activeProject && (
                    <div className="detail-view">
                      <button className="nav-button" onClick={handleBack}>← cd ..</button>
                      <h2 className="detail-title">{activeProject.title}</h2>
                      {activeProject.link && (
                        <div className="project-links">
                          <a href={activeProject.link} target="_blank" rel="noopener noreferrer">
                            View Source / External Link ↗
                          </a>
                        </div>
                      )}
                      <p className="detail-content">{activeProject.content}</p>
                      {activeProject.images?.length > 0 && (
                        <div className="image-gallery">
                          {activeProject.images.map((img, idx) => (
                            <div key={idx} className="image-wrapper">
                              <img src={img} alt={`${activeProject.title} screenshot ${idx + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ABOUT ── */}
                  {currentView === 'about' && about && (
                    <div className="detail-view">
                      <button className="nav-button" onClick={handleBack}>← cd ..</button>
                      <div className="about-header">
                        <h2 className="about-title rgb-split">User: {about.username}</h2>
                        <div className="about-identity">
                          <div className="about-identity-row">
                            <span className="about-identity-label">Alias</span>
                            <span className="about-identity-value">{about.alias || about.username}</span>
                          </div>
                          <div className="about-identity-row">
                            <span className="about-identity-label">Legal Identity</span>
                            <span className="about-identity-value">{about.legal_identity}</span>
                          </div>
                        </div>
                        <p className="about-role"><span>▸ Role:</span> {about.role}</p>
                      </div>

                      <div className="about-section">
                        <h3>Contact</h3>
                        <div className="about-contact-grid">
                          <a className="about-contact-item" href="mailto:rifqihabib04@gmail.com">
                            <span className="about-contact-icon">✉</span>
                            <span>rifqihabib04@gmail.com</span>
                          </a>
                          <a className="about-contact-item" href="https://www.linkedin.com/in/rifqi-ur-rahman/" target="_blank" rel="noopener noreferrer">
                            <span className="about-contact-icon">in</span>
                            <span>linkedin.com/in/rifqi-ur-rahman</span>
                          </a>
                          {about.cv_path && (
                            <a className="about-contact-item about-cv-btn" href={about.cv_path} target="_blank" rel="noopener noreferrer" download>
                              <span className="about-contact-icon">↓</span>
                              <span>Download CV</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="about-section">
                        <h3>Background</h3>
                        <p style={{ lineHeight: '1.8', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {about.background}
                        </p>
                      </div>

                      <div className="about-section">
                        <h3>Skills</h3>
                        <div className="skills-grid">
                          {about.skills.map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>

                      <div className="about-section">
                        <h3>Certifications</h3>
                        <ul className="hacker-list">
                          {about.certifications.map((cert, idx) => (
                            <li key={idx}>{cert}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ── MUSIC ── */}
                  {currentView === 'music' && (
                    <MusicPage onBack={handleBack} />
                  )}
                </>
              )}
            </div>

            {!isBooting && (
              <div className="prompt-box">
                <div className="prompt-line">
                  <span className="prompt-user">guest@shoegaze-os</span>
                  <span className="text-muted">:</span>
                  <span className="prompt-path">{promptPath}</span>
                  <span className="prompt-dollar">$</span>
                  <input
                    type="text"
                    className="terminal-input"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleCommandSubmit}
                    placeholder="type a command..."
                    autoFocus
                    spellCheck="false"
                    autoComplete="off"
                    aria-label="Terminal input"
                  />
                </div>
                {cmdError && <div className="prompt-error">{cmdError}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
