import React, { useEffect, useRef } from 'react';

const TabComplete = ({ options, selectedIndex, onSelect }) => {
  const listRef = useRef(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!options || options.length === 0) return null;

  return (
    <div className="tab-complete-popup">
      <ul ref={listRef} className="tab-complete-list">
        {options.map((option, index) => (
          <li
            key={index}
            className={`tab-complete-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelect(option)}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabComplete;
