// ControlBar.jsx
import React from 'react';
import '../styles/controlbar.css';
import icon from '../assets/icon.png'; 

export default function ControlBar({ onStart, onStop, onExport }) {
  return (
    <div className="control-bar">
      <img src={icon} alt="icon" className="control-bar-icon" />
      <div className="control-bar-buttons">
        <button onClick={onStart}>开始</button>
        <button onClick={onStop}>结束</button>
        <button onClick={onExport}>导出</button>
      </div>
    </div>
  );
}


