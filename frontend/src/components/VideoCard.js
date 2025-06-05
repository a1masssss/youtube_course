import React from 'react';
import './VideoCard.css';

const VideoCard = ({ video, onClick }) => {
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-card" onClick={onClick}>
      <div className="video-thumbnail">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/320x180?text=No+Image';
          }}
        />
        {video.duration && (
          <div className="duration-badge">
            {formatDuration(video.duration)}
          </div>
        )}
        <div className="play-overlay">
          <div className="play-icon">▶</div>
        </div>
      </div>
      
      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>
        
        {video.summary && (
          <div className="video-summary">
            <p>{truncateText(video.summary, 120)}</p>
          </div>
        )}
        
        <div className="video-status">
          <div className="status-indicators">
            {video.full_transcript && (
              <span className="status-badge transcript">📝 Transcript</span>
            )}
            {video.summary && (
              <span className="status-badge summary">📄 Summary</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard; 