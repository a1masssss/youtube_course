import React from 'react';
import './VideoCard.css';

const VideoCard = ({ video, onClick }) => {
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
      </div>
      
      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>
      </div>
    </div>
  );
};

export default VideoCard; 