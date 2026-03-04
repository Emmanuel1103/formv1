import React from 'react';
import './Loading.css';

const Loading = ({ size = 'md', fullScreen = false, text }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className={`loading-spinner loading-${size}`}></div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
