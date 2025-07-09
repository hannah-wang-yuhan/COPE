import React from 'react';
import '../styles/tabs.css';

export default function Tabs({ tabs, activeIndex, onTabChange }) {
  return (
    <div className="tab-bar">
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          className={`tab ${i === activeIndex ? 'active' : ''}`}
          onClick={() => onTabChange(i)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
}

