import { useState, useEffect, useRef } from 'react';
import { MatrixCanvas, DEFAULT_PRESET, sharedCtx, sharedAnalyser, getOrCreateCtx } from './Arpeggiator';

/* ── Re-export getOrCreateCtx so Neofetch can init the audio context ── */
// (We import from Arpeggiator directly; getOrCreateCtx is not exported yet —
//  we duplicate the ambient logic here to keep Neofetch self-contained.)

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

/* ── ASCII logo ── */
const ASCII_LOGO = `
  ██████╗  ██████╗ ██╗   ██╗██╗    ██╗ █████╗ ██╗   ██╗
 ██╔═══██╗██╔═══██╗██║   ██║██║    ██║██╔══██╗╚██╗ ██╔╝
 ██║   ██║██║   ██║██║   ██║██║ █╗ ██║███████║ ╚████╔╝ 
 ██║▄▄ ██║██║▄▄ ██║██║   ██║██║███╗██║██╔══██║  ╚██╔╝  
 ╚██████╔╝╚██████╔╝╚██████╔╝╚███╔███╔╝██║  ██║   ██║   
  ╚══▀▀═╝  ╚══▀▀═╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝  
`;

const PALETTE = [
  '#0d0d12', '#ff7eb3', '#8fdf82', '#58a6ff',
  '#ff5f56', '#ffbd2e', '#a266ff', '#e0e0e0',
];

const ColorSwatch = () => (
  <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
    {PALETTE.map((c, i) => (
      <div key={i} title={c} style={{
        width: '22px', height: '22px', borderRadius: '3px',
        background: c, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }} />
    ))}
  </div>
);

const InfoRow = ({ label, value, valueColor }) => (
  <div className="nf-row">
    <span className="nf-label">{label}</span>
    <span className="nf-sep">:</span>
    <span className="nf-value" style={valueColor ? { color: valueColor } : {}}>{value}</span>
  </div>
);

const Divider = () => <div className="nf-divider" />;

/* ── Ambient arpeggiator engine (no UI, runs in background) ── */
const useAmbientArp = () => {
  const bufferRef    = useRef(null);
  const timerRef     = useRef(null);
  const stepRef      = useRef(0);
  const nextTimeRef  = useRef(0);
  const absRef       = useRef(0);
  const stateRef     = useRef({ playing: false });
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [analyser,         setAnalyser]         = useState(null);
  const [currentSemi,      setCurrentSemi]      = useState(null);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  useEffect(() => {
    let ctx;
    const init = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.connect(ctx.destination);
        setAnalyser(analyserNode);

        const res = await fetch('/synth-one-shot-beam.wav');
        if (!res.ok) { setAudioUnavailable(true); return; }
        const ab = await res.arrayBuffer();
        bufferRef.current = await ctx.decodeAudioData(ab);

        // Auto-start after first any user interaction (browser policy)
        const start = async () => {
          if (stateRef.current.playing) return;
          await ctx.resume();
          stateRef.current = { playing: true, ctx, analyserNode };
          setIsPlaying(true);
          document.removeEventListener('click',   start);
          document.removeEventListener('keydown', start);
        };
        document.addEventListener('click',   start, { once: true });
        document.addEventListener('keydown', start, { once: true });
      } catch { setAudioUnavailable(true); /* audio unavailable */ }
    };
    init();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      stateRef.current.playing = false;
      ctx?.close();
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const { ctx, analyserNode } = stateRef.current;
    if (!ctx || !bufferRef.current) return;

    const { activeNotes, bpm, rateIndex, patternIndex, range } = DEFAULT_PRESET;
    const RATES    = [1, 1.5, 2, 3, 4, 6, 8];
    const timePerNote = (60 / bpm) / RATES[rateIndex];

    stepRef.current   = 0;
    absRef.current    = 0;
    nextTimeRef.current = ctx.currentTime + 0.05;

    const loop = () => {
      if (!stateRef.current.playing) return;
      let extNotes = [];
      for (let r = 0; r < range; r++)
        extNotes = extNotes.concat(activeNotes.map(n => n + r * 12));

      while (nextTimeRef.current < ctx.currentTime + 0.1) {
        const maxSteps = Math.max(1, (extNotes.length - 1) * 2);
        const logStep  = stepRef.current % maxSteps;
        const arrIdx   = logStep < extNotes.length ? logStep : maxSteps - logStep;
        const semi     = extNotes[Math.max(0, Math.min(arrIdx, extNotes.length - 1))];

        const isAccent = (absRef.current % 8) === 0;
        const src    = ctx.createBufferSource();
        src.buffer   = bufferRef.current;
        src.playbackRate.value = Math.pow(2, semi / 12);
        const gain   = ctx.createGain();
        gain.gain.value = isAccent ? 0.25 : 0.08;  // very soft
        src.connect(gain);
        gain.connect(analyserNode);
        src.start(nextTimeRef.current);

        const delay = Math.max(0, (nextTimeRef.current - ctx.currentTime) * 1000);
        const s = semi;
        setTimeout(() => { if (stateRef.current.playing) setCurrentSemi(s); }, delay);

        stepRef.current++;
        absRef.current++;
        nextTimeRef.current += timePerNote;
      }
      timerRef.current = setTimeout(loop, 25);
    };
    loop();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying]);

  const stop = () => {
    stateRef.current.playing = false;
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentSemi(null);
  };

  return { isPlaying, analyser, currentSemi, stop, setIsPlaying, audioUnavailable };
};

/* ── Main Neofetch component ── */
const Neofetch = ({ projects = [], about = null, onNavigate }) => {
  const uptime = useUptime();
  const [resolution, setResolution] = useState('');
  const { isPlaying, analyser, stop, audioUnavailable } = useAmbientArp();

  useEffect(() => {
    const update = () => setResolution(`${window.innerWidth}x${window.innerHeight}`);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const skillCount = about?.skills?.length ?? 0;
  const certCount  = about?.certifications?.length ?? 0;
  const projCount  = projects.length;

  return (
    <div className="nf-root">
      {/* Background matrix — ambient when arp is playing */}
      <MatrixCanvas analyser={analyser} active={isPlaying} />

      {/* Left — ASCII art */}
      <div className="nf-logo-col">
        <pre className="nf-ascii">{ASCII_LOGO}</pre>
        <ColorSwatch />
        {isPlaying && (
          <div className="nf-ambient-badge" onClick={stop} title="Click to stop ambient audio">
            ♫ ambient · playing
          </div>
        )}
      </div>

      {/* Right — System info */}
      <div className="nf-info-col">
        <div className="nf-header">
          <span className="nf-user">guest</span>
          <span className="nf-at">@</span>
          <span className="nf-host">shoegaze-os</span>
        </div>
        <div className="nf-header-line" />

        <InfoRow label="OS"         value="shoegaze-os 1.0.0 (linux/web)" valueColor="var(--linux-green)" />
        <InfoRow label="Host"       value="qquway.portfolio" />
        <InfoRow label="Kernel"     value="React 18 + Axum 0.8 (Rust)" />
        <InfoRow label="Shell"      value="terminal-emu v1.0 (bash-compat)" />
        <InfoRow label="Uptime"     value={uptime} valueColor="var(--accent-color)" />
        <InfoRow label="Resolution" value={resolution} />
        <InfoRow label="Theme"      value="Shoegaze Dark [haze + chromatic]" valueColor="var(--accent-color)" />
        <InfoRow label="Audio"
          value={
            audioUnavailable ? 'unavailable — synth-one-shot-beam.wav missing' :
            isPlaying        ? 'Cmaj7 · 90bpm · Up/Down (ambient)' :
                               'click anywhere to enable'
          }
          valueColor={
            audioUnavailable ? 'var(--red-accent)' :
            isPlaying        ? 'var(--accent-color)' :
                               undefined
          }
        />

        <Divider />

        <InfoRow label="User"       value={about?.legal_identity ?? 'Rifqi Habib Ur Rahman'} valueColor="var(--linux-green)" />
        <InfoRow label="Alias"      value={about?.alias ?? 'qquway'} />
        <InfoRow label="Role"       value={about?.role ?? '—'} />

        <Divider />

        <InfoRow label="Projects"   value={`${projCount} loaded`} valueColor="var(--blue-accent)" />
        <InfoRow label="Skills"     value={`${skillCount} indexed`} valueColor="var(--blue-accent)" />
        <InfoRow label="Certs"      value={`${certCount} obtained`} valueColor="var(--blue-accent)" />
        <InfoRow label="Backend"    value="Rust / Axum @ 127.0.0.1:3000" />

        <Divider />

        <div className="nf-commands">
          {[
            { cmd: './projects', view: 'home',  label: 'projects' },
            { cmd: './whoami',   view: 'about', label: 'about' },
            { cmd: './music',    view: 'music', label: 'music' },
          ].map(({ cmd, view, label }) => (
            <button key={view} className="nf-cmd-btn"
              onClick={() => { stop(); onNavigate(view); }}
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
