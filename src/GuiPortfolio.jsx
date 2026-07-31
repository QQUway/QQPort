import React, { useEffect, useState } from 'react';
import './gui.css';
import { ALL_WORKS } from './MusicPage';
import Arpeggiator from './Arpeggiator';
import AsciiBackground from './AsciiBackground';

const isStatic = !!import.meta.env.VITE_IS_STATIC;
const API = isStatic ? '' : (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000');

const GuiPortfolio = ({ projects, about, switchMode }) => {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'projects', 'about', 'music'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Check if element is in the upper half of the viewport
          if (rect.top >= -100 && rect.top <= 400) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
    }
  };

  return (
    <div className="gui-mode">
      <AsciiBackground />
      <div className="gui-bg-gradient"></div>

      <nav className="top-navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(13, 13, 18, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="normie-nav-top">
          <button className={`normie-btn glitch-text ${activeSection === 'home' ? 'active' : ''}`} data-text="Home" onClick={() => scrollTo('home')} aria-label="Home">Home</button>
          <button className={`normie-btn glitch-text ${activeSection === 'projects' ? 'active' : ''}`} data-text="Projects" onClick={() => scrollTo('projects')} aria-label="Projects">Projects</button>
          <button className={`normie-btn glitch-text ${activeSection === 'about' ? 'active' : ''}`} data-text="About Me" onClick={() => scrollTo('about')} aria-label="About Me">About Me</button>
          <button className={`normie-btn glitch-text ${activeSection === 'music' ? 'active' : ''}`} data-text="Music" onClick={() => scrollTo('music')} aria-label="Music">Music</button>
        </div>
      </nav>

      <div className="gui-container">
        {/* Hero Section */}
        <section id="home" className="gui-section gui-hero">
          <h1>
            Hi, I'm <span className="highlight">{about?.alias || 'qquway'}</span>.
          </h1>
          <p className="gui-hero-role">
            {about?.role || 'Developer & Designer'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="gui-btn-primary" onClick={() => scrollTo('projects')}>
              View Projects
            </button>
            <button className="gui-btn-primary" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gui-text)' }} onClick={() => scrollTo('about')}>
              About Me
            </button>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="gui-section">
          <h2 className="gui-section-title">Projects</h2>
          <div className="gui-projects-grid">
            {projects?.map(p => (
              <div key={p.id} className="gui-project-card">
                {p.images && p.images.length > 0 && (
                  <div className="gui-project-image-wrap">
                    <img src={p.images[0].startsWith('/uploads') ? `${API}${p.images[0]}` : p.images[0]} alt={p.title} />
                  </div>
                )}
                <h3 className="gui-project-title">{p.title}</h3>
                <p className="gui-project-desc">{p.description}</p>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="gui-project-link">
                    View Source ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="gui-section">
          <h2 className="gui-section-title">About Me</h2>
          <div className="gui-about-content">
            <div>
              <p className="gui-about-text">
                {about?.background || 'A software developer exploring systems programming, web technologies, and audio synthesis.'}
              </p>
              
              {about?.skills && (
                <div className="gui-skills-cloud">
                  {about.skills.map((skill, i) => (
                    <span key={i} className="gui-skill-tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Certifications</h3>
              {about?.certifications && (
                <ul className="gui-certs-list">
                  {about.certifications.map((cert, i) => (
                    <li key={i}>{cert}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Music Section */}
        <section id="music" className="gui-section">
          <h2 className="gui-section-title">Music</h2>
          
          <div style={{ marginBottom: '4rem' }}>
            {ALL_WORKS.map((work) => (
              <div key={work.id} className="gui-project-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {work.artwork && (
                    <img src={work.artwork} alt={work.title} style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                  )}
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 className="gui-project-title" style={{ margin: 0 }}>
                        {work.title}
                        {work.artist && <span style={{ color: 'var(--gui-text-muted)', fontWeight: '400' }}> by {work.artist}</span>}
                      </h3>
                      <span className="gui-skill-tag" style={{ 
                        borderColor: work.status === 'released' ? 'var(--gui-secondary)' : 'var(--linux-green)',
                        color: work.status === 'released' ? 'var(--gui-secondary)' : 'var(--linux-green)'
                      }}>
                        {work.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="gui-about-text">{work.description}</p>
                    
                    {work.links && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {work.links.spotify && <a href={work.links.spotify} target="_blank" rel="noopener noreferrer" className="gui-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Spotify</a>}
                        {work.links.apple && <a href={work.links.apple} target="_blank" rel="noopener noreferrer" className="gui-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)' }}>Apple Music</a>}
                      </div>
                    )}
                  </div>
                </div>
                {work.presaveEmbed && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <iframe src={work.presaveEmbed} width="100%" height="200" frameBorder="0" title="Pre-save" loading="lazy"></iframe>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Interactive Synthesizer</h3>
          <div style={{ background: 'var(--gui-surface)', borderRadius: 'var(--gui-radius)', overflow: 'hidden', border: '1px solid var(--gui-border)' }}>
            <Arpeggiator embedded={true} />
          </div>
        </section>

        {/* Footer */}
        <footer className="gui-footer">
          <div className="gui-contact-grid" style={{ marginBottom: '3rem', borderTop: 'none', padding: 0 }}>
            {about?.cv_path && (
              <a href={about.cv_path.startsWith('/uploads') ? `${API}${about.cv_path}` : about.cv_path} target="_blank" rel="noopener noreferrer" className="gui-contact-card">
                <span className="gui-contact-icon">📄</span>
                <span>Download CV</span>
              </a>
            )}
            <a href="https://www.linkedin.com/in/rifqi-ur-rahman/" target="_blank" rel="noopener noreferrer" className="gui-contact-card">
              <span className="gui-contact-icon">in</span>
              <span>LinkedIn</span>
            </a>
            <a href="mailto:rifqihabib04@gmail.com" className="gui-contact-card">
              <span className="gui-contact-icon">✉</span>
              <span>Email Me</span>
            </a>
          </div>
          <p>© {new Date().getFullYear()} {about?.legal_identity || 'Rifqi Habib Ur Rahman'}. All rights reserved.</p>
        </footer>
      </div>

      {/* Mode Switcher */}
      <button 
        onClick={() => switchMode('terminal')} 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--gui-surface-hover)',
          border: '1px solid var(--gui-border)',
          color: 'var(--gui-text)',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(5px)'
        }}
        title="Switch to Terminal mode"
      >
        &gt;_ Terminal
      </button>
    </div>
  );
};

export default GuiPortfolio;
