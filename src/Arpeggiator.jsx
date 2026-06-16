import React, { useState, useEffect, useRef } from 'react';

const NOTES = [
  { name: 'C3', semi: -12, type: 'white' },
  { name: 'C#3', semi: -11, type: 'black' },
  { name: 'D3', semi: -10, type: 'white' },
  { name: 'D#3', semi: -9, type: 'black' },
  { name: 'E3', semi: -8, type: 'white' },
  { name: 'F3', semi: -7, type: 'white' },
  { name: 'F#3', semi: -6, type: 'black' },
  { name: 'G3', semi: -5, type: 'white' },
  { name: 'G#3', semi: -4, type: 'black' },
  { name: 'A3', semi: -3, type: 'white' },
  { name: 'A#3', semi: -2, type: 'black' },
  { name: 'B3', semi: -1, type: 'white' },
  { name: 'C4', semi: 0, type: 'white' },
  { name: 'C#4', semi: 1, type: 'black' },
  { name: 'D4', semi: 2, type: 'white' },
  { name: 'D#4', semi: 3, type: 'black' },
  { name: 'E4', semi: 4, type: 'white' },
  { name: 'F4', semi: 5, type: 'white' },
  { name: 'F#4', semi: 6, type: 'black' },
  { name: 'G4', semi: 7, type: 'white' },
  { name: 'G#4', semi: 8, type: 'black' },
  { name: 'A4', semi: 9, type: 'white' },
  { name: 'A#4', semi: 10, type: 'black' },
  { name: 'B4', semi: 11, type: 'white' },
  { name: 'C5', semi: 12, type: 'white' }
];

const PATTERNS = ['Up', 'Down', 'Up/Down', 'Random'];
const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '9/8', '12/8'];
const RATES = [
  { label: '1/4', mult: 1 },
  { label: '1/4T', mult: 1.5 },
  { label: '1/8', mult: 2 },
  { label: '1/8T', mult: 3 },
  { label: '1/16', mult: 4 },
  { label: '1/16T', mult: 6 },
  { label: '1/32', mult: 8 }
];

const Arpeggiator = ({ onBack }) => {
  const [activeNotes, setActiveNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [rateIndex, setRateIndex] = useState(4); // Default 1/16
  const [patternIndex, setPatternIndex] = useState(0);
  const [range, setRange] = useState(1);
  const [stride, setStride] = useState(1);
  const [timeSigIndex, setTimeSigIndex] = useState(2); // Default 4/4
  const [currentNoteSemi, setCurrentNoteSemi] = useState(null);
  const [error, setError] = useState('');
  
  const audioCtxRef = useRef(null);
  const bufferRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const absoluteNoteCountRef = useRef(0);
  const timerIDRef = useRef(null);

  // Load the sample on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        const response = await fetch('/synth-one-shot-beam.wav');
        if (!response.ok) throw new Error('Sample not found');
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        bufferRef.current = audioBuffer;
      } catch (err) {
        setError(err.message);
      }
    };
    initAudio();
    
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const toggleNote = (semi) => {
    setActiveNotes(prev => {
      if (prev.includes(semi)) return prev.filter(n => n !== semi);
      return [...prev, semi].sort((a, b) => a - b);
    });
  };

  const playNote = (semi, time, isAccent) => {
    if (!audioCtxRef.current || !bufferRef.current) return;
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    
    // Web Audio pitch shift formula
    source.playbackRate.value = Math.pow(2, semi / 12);
    
    const gainNode = audioCtxRef.current.createGain();
    // Accents are much louder so the downbeat pops
    gainNode.gain.value = isAccent ? 1.0 : 0.3;
    
    source.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    source.start(time);
  };

  const stateRef = useRef({ activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex, isPlaying });
  useEffect(() => {
    stateRef.current = { activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex, isPlaying };
  }, [activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      currentStepRef.current = 0;
      absoluteNoteCountRef.current = 0;
      nextNoteTimeRef.current = audioCtxRef.current ? audioCtxRef.current.currentTime + 0.05 : 0;
      
      const loop = () => {
        if (!stateRef.current.isPlaying) return;
        const { activeNotes, bpm, patternIndex, range, stride, rateIndex, timeSigIndex } = stateRef.current;
        
        if (bpm <= 0) {
          timerIDRef.current = setTimeout(loop, 100);
          return;
        }
        
        const secondsPerBeat = 60.0 / bpm;
        const timePerNote = secondsPerBeat / RATES[rateIndex].mult;
        
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
          if (activeNotes.length > 0) {
            let extendedNotes = [];
            for (let r = 0; r < range; r++) {
              extendedNotes = extendedNotes.concat(activeNotes.map(n => n + r * 12));
            }

            let step = currentStepRef.current;
            let logicalStep = step;
            if (stride > 1) {
              logicalStep = Math.floor(step / stride) + (step % stride);
            }

            let noteSemi = 0;
            const pattern = PATTERNS[patternIndex];
            
            if (pattern === 'Up') {
              let idx = logicalStep % extendedNotes.length;
              noteSemi = extendedNotes[idx];
              currentStepRef.current = step + 1;
            } else if (pattern === 'Down') {
              let idx = logicalStep % extendedNotes.length;
              noteSemi = extendedNotes[extendedNotes.length - 1 - idx];
              currentStepRef.current = step + 1;
            } else if (pattern === 'Up/Down') {
              const maxSteps = Math.max(1, (extendedNotes.length - 1) * 2);
              let idx = logicalStep % maxSteps;
              let arrayIdx = idx < extendedNotes.length ? idx : maxSteps - idx;
              noteSemi = extendedNotes[arrayIdx];
              currentStepRef.current = step + 1;
            } else if (pattern === 'Random') {
              let idx = Math.floor(Math.random() * extendedNotes.length);
              noteSemi = extendedNotes[idx];
              currentStepRef.current = step + 1;
            }
            
            // Calculate Accent
            const [num, den] = TIME_SIGNATURES[timeSigIndex].split('/').map(Number);
            const notesPerBar = (num * 4 / den) * RATES[rateIndex].mult;
            const isAccent = (absoluteNoteCountRef.current % Math.round(notesPerBar)) === 0;

            const timeToPlay = nextNoteTimeRef.current - audioCtxRef.current.currentTime;
            const uiSemi = noteSemi;
            setTimeout(() => {
              if (stateRef.current.isPlaying) {
                setCurrentNoteSemi(uiSemi);
              }
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
    
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="arp-view">
      <button className="nav-button" onClick={onBack}>&lt; cd ..</button>
      <h2 className="detail-title rgb-split">./arp</h2>
      <p className="detail-content">Experimental VST Arpeggiator. Click piano keys to select notes.</p>
      
      {error && <div className="error-text">Audio Error: {error}</div>}

      <div className="vst-container">
        <div className="vst-controls">
          <button 
            className={`vst-play-btn ${isPlaying ? 'active' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
          
          <div className="vst-slider-group">
            <label>TEMPO: {bpm} BPM</label>
            <input 
              type="range" 
              min="0" 
              max="240" 
              value={bpm} 
              onChange={e => setBpm(Number(e.target.value))} 
              className="vst-slider"
            />
          </div>

          <div className="vst-slider-group">
            <label>TIME SIG: {TIME_SIGNATURES[timeSigIndex]}</label>
            <input 
              type="range" 
              min="0" 
              max={TIME_SIGNATURES.length - 1} 
              value={timeSigIndex} 
              onChange={e => setTimeSigIndex(Number(e.target.value))} 
              className="vst-slider"
            />
          </div>

          <div className="vst-slider-group">
            <label>RATE: {RATES[rateIndex].label}</label>
            <input 
              type="range" 
              min="0" 
              max={RATES.length - 1} 
              value={rateIndex} 
              onChange={e => setRateIndex(Number(e.target.value))} 
              className="vst-slider"
            />
          </div>

          <div className="vst-slider-group">
            <label>RANGE: {range} OCT</label>
            <input 
              type="range" 
              min="1" 
              max="4" 
              value={range} 
              onChange={e => setRange(Number(e.target.value))} 
              className="vst-slider"
            />
          </div>

          <div className="vst-slider-group">
            <label>STRIDE: {stride} NOTES</label>
            <input 
              type="range" 
              min="1" 
              max="8" 
              value={stride} 
              onChange={e => setStride(Number(e.target.value))} 
              className="vst-slider"
            />
          </div>

          <div className="vst-slider-group">
            <label>PATTERN: {PATTERNS[patternIndex]}</label>
            <input 
              type="range" 
              min="0" 
              max="3" 
              value={patternIndex} 
              onChange={e => setPatternIndex(Number(e.target.value))} 
              className="vst-slider"
            />
          </div>
        </div>

        <div className="piano-container">
          {NOTES.map(note => {
            const isActive = activeNotes.includes(note.semi);
            const isPlayingNow = isPlaying && currentNoteSemi === note.semi;
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
