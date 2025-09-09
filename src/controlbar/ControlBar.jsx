// ControlBar.jsx
import React from 'react';
import '../styles/controlbar.css';
import icon from '../assets/icon.jpg'; 

export default function ControlBar({ onStart, onStop}) {
  return (
    <div className="control-bar">
      <img src={icon} alt="icon" className="control-bar-icon" />
      <div className="control-bar-buttons">
        <button onClick={onStart}>开始</button>
        <button onClick={onStop}>结束</button>
      </div>
    </div>
  );
}


