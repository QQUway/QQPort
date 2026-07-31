import React, { useState } from 'react';
import Arpeggiator from './Arpeggiator';

/* ── All releases in one unified list ── */
export const ALL_WORKS = [
  /* ── RELEASED ── */
  {
    id:      1,
    status:  'released',
    title:   'Melancholic Ensemble',
    artist:  'Northanger',
    year:    '2024',
    genre:   'Indie / Shoegaze',
    role:    ['Composer', 'Guitarist'],
    description: 'A cinematic ensemble piece blending post-rock textures with introspective lyricism. Contributed as composer and lead guitarist.',
    credits: [
      { name: 'Kanza Amanda',                     role: 'Composer / Lyricist' },
      { name: 'Rifqi Habib Ur Rahman',             role: 'Composer / Guitarist' },
      { name: 'Dimas Bagus Nandito',               role: 'Composer / Lyricist' },
      { name: 'Svetlana Abigail Valeria Tambuwun', role: 'Composer / Lyricist' },
      { name: 'Muhammad Fabiansyah Abubakar',      role: 'Composer / Lyricist' },
    ],
    links: {
      spotify: 'https://open.spotify.com/search/Northanger%20Melancholic%20Ensemble',
      apple:   'https://music.apple.com/search?term=Northanger+Melancholic+Ensemble',
    },
  },

  /* ── UPCOMING ── */
  {
    id:          2,
    status:      'upcoming',
    title:       'Limbo',
    description: 'An upcoming release — atmospheric and textured. Pre-save to be notified on release day.',
    presaveEmbed: 'https://show.co/social-unlock/5yLeo1NeY7pmHn2Dp8bGTR/widget',
  },
];

/* ── Status badge config ── */
const STATUS_CONFIG = {
  released: { label: 'Released', cls: 'badge-released' },
  upcoming: { label: 'Upcoming', cls: 'badge-upcoming' },
};

/* ── Unified track/release card ── */
const WorkCard = ({ work, isExpanded, onToggle }) => {
  const cfg = STATUS_CONFIG[work.status];

  return (
    <div className={`music-work-card ${work.status} ${isExpanded ? 'expanded' : ''}`}>
      {/* Header — always visible, clickable to expand released works */}
      <div
        className="music-work-header"
        onClick={() => work.status === 'released' && onToggle()}
        role={work.status === 'released' ? 'button' : undefined}
        tabIndex={work.status === 'released' ? 0 : undefined}
        onKeyDown={e => work.status === 'released' && e.key === 'Enter' && onToggle()}
        aria-expanded={work.status === 'released' ? isExpanded : undefined}
        style={{ cursor: work.status === 'released' ? 'pointer' : 'default' }}
      >
        <div className="music-work-left">
          <div className="music-work-badges">
            <span className={`music-status-badge ${cfg.cls}`}>{cfg.label}</span>
            {work.role?.map(r => (
              <span key={r} className="music-role-badge">{r}</span>
            ))}
          </div>
          <h3 className="music-track-title">{work.title}</h3>
          {work.artist && (
            <p className="music-track-artist">
              <span className="text-muted">by</span> {work.artist}
              {work.year  && <span className="music-track-year">  · {work.year}</span>}
              {work.genre && <span className="music-track-genre"> · {work.genre}</span>}
            </p>
          )}
          <p className="music-work-description">{work.description}</p>
        </div>

        {work.status === 'released' && (
          <div className="music-track-expand-hint">
            <span>{isExpanded ? '▲ Collapse' : '▼ Credits & Links'}</span>
          </div>
        )}
      </div>

      {/* Expanded detail for released works */}
      {work.status === 'released' && isExpanded && (
        <div className="music-track-detail" onClick={e => e.stopPropagation()}>
          {work.credits && (
            <div className="music-credits">
              <h4 className="music-credits-title">Full Credits</h4>
              <div className="music-credits-grid">
                {work.credits.map((c, i) => (
                  <div key={i} className={`music-credit-item ${c.name === 'Rifqi Habib Ur Rahman' ? 'is-you' : ''}`}>
                    <span className="music-credit-name">{c.name}</span>
                    <span className="music-credit-role">{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {work.links && (
            <div className="music-track-links">
              {work.links.spotify && (
                <a href={work.links.spotify} target="_blank" rel="noopener noreferrer" className="music-stream-btn spotify">
                  ♪ Spotify
                </a>
              )}
              {work.links.apple && (
                <a href={work.links.apple} target="_blank" rel="noopener noreferrer" className="music-stream-btn apple">
                  ♪ Apple Music
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pre-save embed for upcoming works */}
      {work.status === 'upcoming' && work.presaveEmbed && (
        <div className="music-presave-wrap">
          <iframe
            src={work.presaveEmbed}
            width="100%"
            height="450"
            frameBorder="0"
            title={`Pre-save ${work.title}`}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

/* ── Main Music Page ── */
const MusicPage = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('releases');
  const [expandedId,    setExpandedId]    = useState(null);

  return (
    <div className="music-view detail-view">
      <button className="nav-button" onClick={onBack}>← cd ..</button>
      <h2 className="detail-title rgb-split">./music</h2>

      <div className="music-tabs">
        <button
          className={`music-tab ${activeSection === 'releases' ? 'active' : ''}`}
          onClick={() => setActiveSection('releases')}
        >
          ◈ Releases
        </button>
        <button
          className={`music-tab ${activeSection === 'arp' ? 'active' : ''}`}
          onClick={() => setActiveSection('arp')}
        >
          ♫ Arpeggiator
        </button>
      </div>

      {/* ── All Releases (single column) ── */}
      {activeSection === 'releases' && (
        <div className="music-section">
          <p className="music-section-intro">
            All releases and contributions — past and upcoming.
          </p>
          <div className="music-work-list">
            {ALL_WORKS.map(work => (
              <WorkCard
                key={work.id}
                work={work}
                isExpanded={expandedId === work.id}
                onToggle={() => setExpandedId(expandedId === work.id ? null : work.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Arpeggiator ── */}
      {activeSection === 'arp' && (
        <div className="music-section">
          <Arpeggiator onBack={() => setActiveSection('releases')} embedded />
        </div>
      )}
    </div>
  );
};

export default MusicPage;
