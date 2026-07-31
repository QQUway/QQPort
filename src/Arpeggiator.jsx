import React, { useState, useEffect, useRef } from 'react';

/* ── Global shared audio context & analyser ──────────────────────────────────
   Exported so MatrixCanvas (and any future visualizer) can tap the same stream
   without re-creating a context.
   ─────────────────────────────────────────────────────────────────────────── */
export let sharedCtx      = null;
export let sharedAnalyser = null;

export function getOrCreateCtx() {
  if (!sharedCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    sharedCtx = new AudioContext();
    sharedAnalyser = sharedCtx.createAnalyser();
    sharedAnalyser.fftSize = 256;
    sharedAnalyser.connect(sharedCtx.destination);
  }
  return sharedCtx;
}

/* ── Notes / pattern data ─────────────────────────────────────────────────── */
const NOTES = [
  { name: 'C3',  semi: -12, type: 'white' },
  { name: 'C#3', semi: -11, type: 'black' },
  { name: 'D3',  semi: -10, type: 'white' },
  { name: 'D#3', semi: -9,  type: 'black' },
  { name: 'E3',  semi: -8,  type: 'white' },
  { name: 'F3',  semi: -7,  type: 'white' },
  { name: 'F#3', semi: -6,  type: 'black' },
  { name: 'G3',  semi: -5,  type: 'white' },
  { name: 'G#3', semi: -4,  type: 'black' },
  { name: 'A3',  semi: -3,  type: 'white' },
  { name: 'A#3', semi: -2,  type: 'black' },
  { name: 'B3',  semi: -1,  type: 'white' },
  { name: 'C4',  semi: 0,   type: 'white' },
  { name: 'C#4', semi: 1,   type: 'black' },
  { name: 'D4',  semi: 2,   type: 'white' },
  { name: 'D#4', semi: 3,   type: 'black' },
  { name: 'E4',  semi: 4,   type: 'white' },
  { name: 'F4',  semi: 5,   type: 'white' },
  { name: 'F#4', semi: 6,   type: 'black' },
  { name: 'G4',  semi: 7,   type: 'white' },
  { name: 'G#4', semi: 8,   type: 'black' },
  { name: 'A4',  semi: 9,   type: 'white' },
  { name: 'A#4', semi: 10,  type: 'black' },
  { name: 'B4',  semi: 11,  type: 'white' },
  { name: 'C5',  semi: 12,  type: 'white' },
];

const PATTERNS        = ['Up', 'Down', 'Up/Down', 'Random'];
const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'];
const RATES = [
  { label: '1/4',   mult: 1   },
  { label: '1/4T',  mult: 1.5 },
  { label: '1/8',   mult: 2   },
  { label: '1/8T',  mult: 3   },
  { label: '1/16',  mult: 4   },
  { label: '1/16T', mult: 6   },
  { label: '1/32',  mult: 8   },
];

/* ── Default ambient preset ────────────────────────────────────────────────── */
export const DEFAULT_PRESET = {
  activeNotes:   [0, 4, 7, 11],   // Cmaj7
  bpm:           90,
  rateIndex:     2,                // 1/8
  patternIndex:  2,                // Up/Down
  range:         2,
  stride:        1,
  timeSigIndex:  2,                // 4/4
};

/* ── Matrix canvas visualizer ────────────────────────────────────────────────
   Draws falling katakana / binary rain that pulses with audio amplitude.
   ─────────────────────────────────────────────────────────────────────────── */
export const MatrixCanvas = ({ analyser, active }) => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const dropsRef  = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');

    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01101001ハヒフヘホマミムメモ'.split('');
    const COL_W = 16;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const cols = Math.floor(canvas.width / COL_W);
      dropsRef.current = Array.from({ length: cols }, () => Math.random() * -canvas.height / COL_W);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      let amplitude = 0;
      if (analyser && freqData) {
        analyser.getByteFrequencyData(freqData);
        const sum = freqData.reduce((a, v) => a + v, 0);
        amplitude = sum / (freqData.length * 255); // 0–1
      }

      // Fade trail — alpha depends on amplitude (faster fade when louder)
      ctx.fillStyle = `rgba(13,13,18,${active ? 0.06 + amplitude * 0.12 : 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drops   = dropsRef.current;
      const speed   = active ? 0.6 + amplitude * 2.5 : 0.2;
      const opacity = active ? 0.35 + amplitude * 0.65 : 0.08;

      drops.forEach((y, i) => {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x    = i * COL_W;

        // Head glyph — bright
        const hue = active ? `hsl(${300 + amplitude * 60}, 80%, 70%)` : 'rgba(143,223,130,0.5)';
        ctx.fillStyle = hue;
        ctx.font      = `${COL_W - 2}px monospace`;
        ctx.globalAlpha = opacity;
        ctx.fillText(char, x, y * COL_W);

        // Dim the column behind
        ctx.fillStyle = active
          ? `rgba(255,126,179,${0.15 + amplitude * 0.3})`
          : 'rgba(143,223,130,0.12)';
        ctx.globalAlpha = opacity * 0.6;
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, (y - 1) * COL_W);

        ctx.globalAlpha = 1;

        if (y * COL_W > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speed;
      });
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className="matrix-canvas" />;
};

/* ── Main Arpeggiator ─────────────────────────────────────────────────────── */
const Arpeggiator = ({ onBack, embedded, initialPreset, autoPlay }) => {
  const preset = initialPreset ?? DEFAULT_PRESET;

  const [activeNotes,   setActiveNotes]   = useState(preset.activeNotes);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [bpm,           setBpm]           = useState(preset.bpm);
  const [rateIndex,     setRateIndex]     = useState(preset.rateIndex);
  const [patternIndex,  setPatternIndex]  = useState(preset.patternIndex);
  const [range,         setRange]         = useState(preset.range);
  const [stride,        setStride]        = useState(preset.stride);
  const [timeSigIndex,  setTimeSigIndex]  = useState(preset.timeSigIndex);
  const [currentNoteSemi, setCurrentNoteSemi] = useState(null);
  const [error,         setError]         = useState('');
  const [analyser,      setAnalyser]      = useState(null);

  const bufferRef           = useRef(null);
  const nextNoteTimeRef     = useRef(0);
  const currentStepRef      = useRef(0);
  const absoluteNoteCountRef = useRef(0);
  const timerIDRef          = useRef(null);

  // Init shared audio context + analyser
  useEffect(() => {
    const init = async () => {
      try {
        const ctx = getOrCreateCtx();
        setAnalyser(sharedAnalyser);
        if (ctx.state === 'suspended') await ctx.resume();
        const response    = await fetch('/synth-one-shot-beam.wav');
        if (!response.ok) throw new Error('Sample not found');
        const arrayBuffer = await response.arrayBuffer();
        bufferRef.current = await ctx.decodeAudioData(arrayBuffer);
        if (autoPlay) setIsPlaying(true);
      } catch (err) {
        setError(err.message);
      }
    };
    init();
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, [autoPlay]);

  const toggleNote = (semi) => {
    setActiveNotes(prev =>
      prev.includes(semi) ? prev.filter(n => n !== semi) : [...prev, semi].sort((a, b) => a - b)
    );
  };

  const playNote = (semi, time, isAccent) => {
    if (!sharedCtx || !bufferRef.current) return;
    const source  = sharedCtx.createBufferSource();
    source.buffer = bufferRef.current;
    source.playbackRate.value = Math.pow(2, semi / 12);
    const gainNode = sharedCtx.createGain();
    gainNode.gain.value = isAccent ? 1.0 : 0.3;
    source.connect(gainNode);
    gainNode.connect(sharedAnalyser);  // route through analyser
    source.start(time);
  };

  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = { activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex, isPlaying };
  }, [activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      if (sharedCtx?.state === 'suspended') sharedCtx.resume();
      currentStepRef.current = 0;
      absoluteNoteCountRef.current = 0;
      nextNoteTimeRef.current = sharedCtx ? sharedCtx.currentTime + 0.05 : 0;

      const loop = () => {
        if (!stateRef.current.isPlaying) return;
        const { activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex } = stateRef.current;
        if (bpm <= 0) { timerIDRef.current = setTimeout(loop, 100); return; }

        const secondsPerBeat = 60.0 / bpm;
        const timePerNote    = secondsPerBeat / RATES[rateIndex].mult;

        while (nextNoteTimeRef.current < sharedCtx.currentTime + 0.1) {
          if (activeNotes.length > 0) {
            let extendedNotes = [];
            for (let r = 0; r < range; r++)
              extendedNotes = extendedNotes.concat(activeNotes.map(n => n + r * 12));

            let step = currentStepRef.current;
            let logicalStep = step;
            if (stride > 1) logicalStep = Math.floor(step / stride) + (step % stride);

            let noteSemi = 0;
            const pattern = PATTERNS[patternIndex];
            if (pattern === 'Up') {
              noteSemi = extendedNotes[logicalStep % extendedNotes.length];
            } else if (pattern === 'Down') {
              noteSemi = extendedNotes[extendedNotes.length - 1 - (logicalStep % extendedNotes.length)];
            } else if (pattern === 'Up/Down') {
              const maxSteps = Math.max(1, (extendedNotes.length - 1) * 2);
              let idx = logicalStep % maxSteps;
              let arrIdx = idx < extendedNotes.length ? idx : maxSteps - idx;
              noteSemi = extendedNotes[arrIdx];
            } else {
              noteSemi = extendedNotes[Math.floor(Math.random() * extendedNotes.length)];
            }
            currentStepRef.current = step + 1;

            const [num, den] = TIME_SIGNATURES[timeSigIndex].split('/').map(Number);
            const notesPerBar = (num * 4 / den) * RATES[rateIndex].mult;
            const isAccent = (absoluteNoteCountRef.current % Math.round(notesPerBar)) === 0;

            const timeToPlay = nextNoteTimeRef.current - sharedCtx.currentTime;
            const uiSemi = noteSemi;
            setTimeout(() => {
              if (stateRef.current.isPlaying) setCurrentNoteSemi(uiSemi);
            }, Math.max(0, timeToPlay * 1000));

            playNote(noteSemi, nextNoteTimeRef.current, isAccent);
            absoluteNoteCountRef.current++;
          } else {
            setCurrentNoteSemi(null);
          }
          nextNoteTimeRef.current += timePerNote;
        }
        timerIDRef.current = setTimeout(loop, 25);
      };
      loop();
    } else {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setCurrentNoteSemi(null);
    }
    return () => { if (timerIDRef.current) clearTimeout(timerIDRef.current); };
  }, [isPlaying]);

  return (
    <div className="arp-view">
      {/* Matrix canvas behind everything */}
      <MatrixCanvas analyser={analyser} active={isPlaying} />

      {!embedded && <button className="nav-button" onClick={onBack}>← cd ..</button>}
      {!embedded && <h2 className="detail-title rgb-split">./arp</h2>}
      {!embedded && <p className="detail-content">Experimental VST Arpeggiator. Click piano keys to select notes.</p>}

      {error && (
        <div className="arp-error-banner">
          <span className="arp-error-icon">⚠</span>
          <span>Audio sample unavailable — place <code>synth-one-shot-beam.wav</code> in <code>public/</code></span>
        </div>
      )}

      <div className="vst-container">
        <div className="vst-controls">
          <button
            className={`vst-play-btn ${isPlaying ? 'active' : ''} ${error ? 'disabled' : ''}`}
            onClick={() => !error && setIsPlaying(!isPlaying)}
            disabled={!!error}
            title={error ? 'Audio sample unavailable' : (isPlaying ? 'Stop' : 'Play')}
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>

          <div className="vst-slider-group">
            <label>TEMPO: {bpm} BPM</label>
            <input type="range" min="0" max="240" value={bpm}
              onChange={e => setBpm(Number(e.target.value))} className="vst-slider" />
          </div>
          <div className="vst-slider-group">
            <label>TIME SIG: {TIME_SIGNATURES[timeSigIndex]}</label>
            <input type="range" min="0" max={TIME_SIGNATURES.length - 1} value={timeSigIndex}
              onChange={e => setTimeSigIndex(Number(e.target.value))} className="vst-slider" />
          </div>
          <div className="vst-slider-group">
            <label>RATE: {RATES[rateIndex].label}</label>
            <input type="range" min="0" max={RATES.length - 1} value={rateIndex}
              onChange={e => setRateIndex(Number(e.target.value))} className="vst-slider" />
          </div>
          <div className="vst-slider-group">
            <label>RANGE: {range} OCT</label>
            <input type="range" min="1" max="4" value={range}
              onChange={e => setRange(Number(e.target.value))} className="vst-slider" />
          </div>
          <div className="vst-slider-group">
            <label>STRIDE: {stride} NOTES</label>
            <input type="range" min="1" max="8" value={stride}
              onChange={e => setStride(Number(e.target.value))} className="vst-slider" />
          </div>
          <div className="vst-slider-group">
            <label>PATTERN: {PATTERNS[patternIndex]}</label>
            <input type="range" min="0" max="3" value={patternIndex}
              onChange={e => setPatternIndex(Number(e.target.value))} className="vst-slider" />
          </div>
        </div>

        <div className="piano-container">
          {NOTES.map(note => {
            const isActive      = activeNotes.includes(note.semi);
            const isPlayingNow  = isPlaying && currentNoteSemi === note.semi;
            return (
              <div
                key={note.name}
                className={`piano-key key-${note.type} ${isActive ? 'active' : ''} ${isPlayingNow ? 'playing' : ''}`}
                onClick={() => toggleNote(note.semi)}
              >
                <span className="key-label">{note.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Arpeggiator;
