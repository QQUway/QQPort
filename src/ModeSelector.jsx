import React, { useState, useEffect } from 'react';

const ModeSelector = ({ onSelect }) => {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleSelect = (mode) => {
    setSelected(mode);
    setTimeout(() => {
      onSelect(mode);
    }, 600); // fade out duration
  };

  // Keyboard navigation
  useEffect(() => {
    if (selected) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setHovered('terminal');
      if (e.key === 'ArrowRight') setHovered('gui');
      if (e.key === 'Enter' && hovered) handleSelect(hovered);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hovered, selected]);

  return (
    <div className={`mode-selector-container ${selected ? 'fade-out' : ''}`}>
      <h1 className="mode-selector-title">Select your interface</h1>
      
      <div className="mode-panels">
        {/* Terminal Panel */}
        <div 
          className={`mode-panel terminal-panel ${hovered === 'terminal' ? 'hovered' : ''} ${selected === 'terminal' ? 'selected' : ''}`}
          onMouseEnter={() => setHovered('terminal')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleSelect('terminal')}
        >
          <div className="panel-content">
            <h2 className="panel-title">&gt;_ Terminal</h2>
            <ul className="panel-features">
              <li>CRT • Glitch</li>
              <li>Command-line</li>
              <li>For hackers</li>
            </ul>
          </div>
          <div className="panel-bg scanlines"></div>
        </div>

        {/* GUI Panel */}
        <div 
          className={`mode-panel gui-panel ${hovered === 'gui' ? 'hovered' : ''} ${selected === 'gui' ? 'selected' : ''}`}
          onMouseEnter={() => setHovered('gui')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleSelect('gui')}
        >
          <div className="panel-content">
            <h2 className="panel-title">◈ GUI</h2>
            <ul className="panel-features">
              <li>Modern • Clean</li>
              <li>Visual • Smooth</li>
              <li>For everyone</li>
            </ul>
          </div>
          <div className="panel-bg gui-gradient"></div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
