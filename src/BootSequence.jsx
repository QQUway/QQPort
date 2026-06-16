import React, { useState, useEffect, useRef } from 'react';

const BOOT_LINES = [
  "shoegaze-os bootloader v1.0.4",
  "Loading shoegaze-os kernel...",
  "[    0.000000] Initializing cgroup subsys cpuset",
  "[    0.000000] Linux version 6.5.0-qquway (gcc version 12.2.0)",
  "[    0.002314] Loading CPU microcode update...",
  "[    0.015243] SMP: Bringing up secondary CPUs...",
  "[    0.042314] shoegaze_audio_driver: Loaded module successfully.",
  "[    0.153421] mounting ethereal_fs on /mnt/dreams...",
  "[    0.284511] Initializing visual distortion filters...",
  "[    0.412456] Setting up glitch matrices...",
  "[    0.801234] Network interface lo: link up.",
  "[    1.245211] Establishing secure connection to qquway mainframes...",
  "[    1.590123] Fetching latest memory fragments...",
  "[    1.890123] Boot sequence complete. Starting user session..."
];

const BootSequence = ({ onComplete }) => {
  const [lines, setLines] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    let timeoutId;
    let currentIndex = 0;

    const showNextLine = () => {
      if (currentIndex < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[currentIndex]]);
        currentIndex++;
        
        // Auto scroll
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }

        // Random delay between 20ms and 150ms, except for some lines that take longer
        let delay = Math.random() * 100 + 20;
        if (currentIndex === 11) delay = 600; // Establishing connection takes longer
        if (currentIndex === 1) delay = 300; // Loading kernel...
        if (currentIndex === 13) delay = 500;

        timeoutId = setTimeout(showNextLine, delay);
      } else {
        // Finished
        timeoutId = setTimeout(() => {
          onComplete();
        }, 600);
      }
    };

    timeoutId = setTimeout(showNextLine, 200);

    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  return (
    <div className="boot-sequence" ref={containerRef} style={{
      width: '100%',
      height: '100%',
      color: '#aaa',
      fontFamily: 'var(--font-mono)',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      textAlign: 'left'
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: '4px' }}>{line}</div>
      ))}
      <div className="boot-cursor" style={{ 
        width: '8px', 
        height: '16px', 
        backgroundColor: '#aaa', 
        marginTop: '4px',
        animation: 'blink 1s step-end infinite' 
      }}></div>
    </div>
  );
};

export default BootSequence;
