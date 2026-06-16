import { useState, useEffect } from 'react';

/* ── Live uptime counter ── */
const useUptime = () => {
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(uptime / 3600).toString().padStart(2, '0');
  const m = Math.floor((uptime % 3600) / 60).toString().padStart(2, '0');
  const s = (uptime % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

/* ── ASCII art for "qquway" ── */
const ASCII_LOGO = `
  ██████╗  ██████╗ ██╗   ██╗██╗    ██╗ █████╗ ██╗   ██╗
 ██╔═══██╗██╔═══██╗██║   ██║██║    ██║██╔══██╗╚██╗ ██╔╝
 ██║   ██║██║   ██║██║   ██║██║ █╗ ██║███████║ ╚████╔╝ 
 ██║▄▄ ██║██║▄▄ ██║██║   ██║██║███╗██║██╔══██║  ╚██╔╝  
 ╚██████╔╝╚██████╔╝╚██████╔╝╚███╔███╔╝██║  ██║   ██║   
  ╚══▀▀═╝  ╚══▀▀═╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝  
`;

/* ── Color palette swatch row ── */
const PALETTE = [
  '#0d0d12', '#ff7eb3', '#8fdf82', '#58a6ff',
  '#ff5f56', '#ffbd2e', '#a266ff', '#e0e0e0',
];

const ColorSwatch = () => (
  <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
    {PALETTE.map((c, i) => (
      <div
        key={i}
        title={c}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '3px',
          background: c,
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      />
    ))}
  </div>
);

/* ── Single info row ── */
const InfoRow = ({ label, value, valueColor }) => (
  <div className="nf-row">
    <span className="nf-label">{label}</span>
    <span className="nf-sep">:</span>
    <span className="nf-value" style={valueColor ? { color: valueColor } : {}}>
      {value}
    </span>
  </div>
);

/* ── Section divider ── */
const Divider = () => <div className="nf-divider" />;

/* ── Main Neofetch component ── */
const Neofetch = ({ projects = [], about = null, onNavigate }) => {
  const uptime = useUptime();
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    const update = () =>
      setResolution(`${window.innerWidth}x${window.innerHeight}`);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const skillCount = about?.skills?.length ?? 0;
  const certCount  = about?.certifications?.length ?? 0;
  const projCount  = projects.length;

  return (
    <div className="nf-root">
      {/* Left — ASCII art */}
      <div className="nf-logo-col">
        <pre className="nf-ascii">{ASCII_LOGO}</pre>
        <ColorSwatch />
      </div>

      {/* Right — System info */}
      <div className="nf-info-col">
        {/* Header: user@host */}
        <div className="nf-header">
          <span className="nf-user">guest</span>
          <span className="nf-at">@</span>
          <span className="nf-host">shoegaze-os</span>
        </div>
        <div className="nf-header-line" />

        {/* System info */}
        <InfoRow label="OS"         value="shoegaze-os 1.0.0 (linux/web)" valueColor="var(--linux-green)" />
        <InfoRow label="Host"       value="qquway.portfolio" />
        <InfoRow label="Kernel"     value="React 18 + Axum 0.8 (Rust)" />
        <InfoRow label="Shell"      value="terminal-emu v1.0 (bash-compat)" />
        <InfoRow label="Uptime"     value={uptime} valueColor="var(--accent-color)" />
        <InfoRow label="Resolution" value={resolution} />
        <InfoRow label="Theme"      value="Shoegaze Dark [haze + chromatic]" valueColor="var(--accent-color)" />
        <InfoRow label="Font"       value="JetBrains Mono / Fira Code" />

        <Divider />

        {/* Owner info */}
        <InfoRow label="User"       value={about?.legal_identity ?? 'Rifqi Habib Ur Rahman'} valueColor="var(--linux-green)" />
        <InfoRow label="Alias"      value={about?.alias ?? 'qquway'} />
        <InfoRow label="Role"       value={about?.role ?? '—'} />

        <Divider />

        {/* Content stats */}
        <InfoRow label="Projects"   value={`${projCount} loaded`} valueColor="var(--blue-accent)" />
        <InfoRow label="Skills"     value={`${skillCount} indexed`} valueColor="var(--blue-accent)" />
        <InfoRow label="Certs"      value={`${certCount} obtained`} valueColor="var(--blue-accent)" />
        <InfoRow label="Backend"    value="Rust / Axum @ 127.0.0.1:3000" />

        <Divider />

        {/* Quick nav hints */}
        <div className="nf-commands">
          {[
            { cmd: './projects', view: 'home',  label: 'projects' },
            { cmd: './whoami',   view: 'about', label: 'about' },
            { cmd: './music',    view: 'music', label: 'music' },
          ].map(({ cmd, view, label }) => (
            <button
              key={view}
              className="nf-cmd-btn"
              onClick={() => onNavigate(view)}
              aria-label={`Go to ${label}`}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Neofetch;
