import React, { useState } from 'react';
import Arpeggiator from './Arpeggiator';

/* ── Static music data ── */
const PUBLISHED_WORKS = [
  {
    id: 1,
    title: 'Melancholic Ensemble',
    artist: 'Northanger',
    year: '2024',
    role: ['Composer', 'Guitarist'],
    genre: 'Indie / Shoegaze',
    credits: [
      { name: 'Kanza Amanda',                     role: 'Composer / Lyricist' },
      { name: 'Rifqi Habib Ur Rahman',             role: 'Composer / Guitarist' },
      { name: 'Dimas Bagus Nandito',               role: 'Composer / Lyricist' },
      { name: 'Svetlana Abigail Valeria Tambuwun', role: 'Composer / Lyricist' },
      { name: 'Muhammad Fabiansyah Abubakar',      role: 'Composer / Lyricist' },
    ],
    links: {
      spotify: 'https://open.spotify.com/track/melancholic-ensemble',
      apple: 'https://music.apple.com/search?term=Northanger+Melancholic+Ensemble',
    },
    description: 'A cinematic ensemble piece blending post-rock textures with introspective lyricism. Contributed as composer and lead guitarist.',
  },
];

const UPCOMING_WORKS = [
  {
    id: 1,
    title: 'Limbo',
    status: 'Pre-save Now',
    description: 'An upcoming release — atmospheric and textured. Pre-save to be notified on release day.',
    presaveEmbed: 'https://show.co/social-unlock/5yLeo1NeY7pmHn2Dp8bGTR/widget',
  },
];

/* ── Sub-component: Published Track Card ── */
const TrackCard = ({ track, isExpanded, onToggle }) => (
  <div
    className={`music-track-card ${isExpanded ? 'expanded' : ''}`}
    onClick={onToggle}
    role="button"
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onToggle()}
    aria-expanded={isExpanded}
  >
    <div className="music-track-header">
      <div className="music-track-meta">
        <div className="music-track-roles">
          {track.role.map(r => (
            <span key={r} className="music-role-badge">{r}</span>
          ))}
        </div>
        <h3 className="music-track-title">{track.title}</h3>
        <p className="music-track-artist">
          <span className="text-muted">by</span> {track.artist}
          <span className="music-track-year"> · {track.year}</span>
          <span className="music-track-genre"> · {track.genre}</span>
        </p>
      </div>
      <div className="music-track-expand-hint">
        <span>{isExpanded ? '▲ Collapse' : '▼ Details'}</span>
      </div>
    </div>

    {isExpanded && (
      <div className="music-track-detail" onClick={e => e.stopPropagation()}>
        <p className="music-track-description">{track.description}</p>

        <div className="music-credits">
          <h4 className="music-credits-title">Full Credits</h4>
          <div className="music-credits-grid">
            {track.credits.map((c, i) => (
              <div key={i} className={`music-credit-item ${c.name === 'Rifqi Habib Ur Rahman' ? 'is-you' : ''}`}>
                <span className="music-credit-name">{c.name}</span>
                <span className="music-credit-role">{c.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="music-track-links">
          <a
            href="https://open.spotify.com/search/Northanger%20Melancholic%20Ensemble"
            target="_blank"
            rel="noopener noreferrer"
            className="music-stream-btn spotify"
          >
            ♪ Spotify
          </a>
          <a
            href="https://music.apple.com/search?term=Northanger+Melancholic+Ensemble"
            target="_blank"
            rel="noopener noreferrer"
            className="music-stream-btn apple"
          >
            ♪ Apple Music
          </a>
        </div>
      </div>
    )}
  </div>
);

/* ── Sub-component: Upcoming Card ── */
const UpcomingCard = ({ work }) => (
  <div className="music-upcoming-card">
    <div className="music-upcoming-header">
      <div>
        <span className="music-upcoming-badge">Upcoming</span>
        <h3 className="music-upcoming-title">{work.title}</h3>
        <p className="music-upcoming-description">{work.description}</p>
      </div>
    </div>
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
  </div>
);

/* ── Main Music Component ── */
const MusicPage = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('discography');
  const [expandedTrack, setExpandedTrack] = useState(null);

  return (
    <div className="music-view detail-view">
      <button className="nav-button" onClick={onBack}>← cd ..</button>
      <h2 className="detail-title rgb-split">./music</h2>

      {/* Section tabs */}
      <div className="music-tabs">
        <button
          className={`music-tab ${activeSection === 'discography' ? 'active' : ''}`}
          onClick={() => setActiveSection('discography')}
        >
          ◈ Discography
        </button>
        <button
          className={`music-tab ${activeSection === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveSection('upcoming')}
        >
          ⟳ Upcoming
        </button>
        <button
          className={`music-tab ${activeSection === 'arp' ? 'active' : ''}`}
          onClick={() => setActiveSection('arp')}
        >
          ♫ Arpeggiator
        </button>
      </div>

      {/* ── Discography ── */}
      {activeSection === 'discography' && (
        <div className="music-section">
          <p className="music-section-intro">
            Published releases and contributions — as composer, guitarist, and collaborator.
          </p>
          <div className="music-track-list">
            {PUBLISHED_WORKS.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                isExpanded={expandedTrack === track.id}
                onToggle={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming ── */}
      {activeSection === 'upcoming' && (
        <div className="music-section">
          <p className="music-section-intro">
            Work in progress and upcoming releases.
          </p>
          <div className="music-upcoming-list">
            {UPCOMING_WORKS.map(work => (
              <UpcomingCard key={work.id} work={work} />
            ))}
          </div>
        </div>
      )}

      {/* ── Arpeggiator ── */}
      {activeSection === 'arp' && (
        <div className="music-section">
          <Arpeggiator onBack={() => setActiveSection('discography')} embedded />
        </div>
      )}
    </div>
  );
};

export default MusicPage;
