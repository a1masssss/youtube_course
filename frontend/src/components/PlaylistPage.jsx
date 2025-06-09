import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, API_ENDPOINTS } from '../config/api';
import VideoCard from './VideoCard';
import './PlaylistPage.css';

const PlaylistPage = () => {
  const { playlistUuid } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.getPlaylist(playlistUuid));
        setPlaylist(response.data);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    if (playlistUuid) {
      fetchPlaylist();
    }
  }, [playlistUuid]);

  const handleVideoClick = (videoUuid) => {
    navigate(`/${playlistUuid}/${videoUuid}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        
        <div className="playlist-info">
          <h2>{playlist?.title}</h2>
        </div>
      </div>
      
      <div className="videos-grid">
        {playlist?.videos?.map((video) => (
          <VideoCard
            key={video.uuid_video}
            video={video}
            onClick={() => handleVideoClick(video.uuid_video)}
          />
        ))}
      </div>

      {(!playlist?.videos || playlist.videos.length === 0) && (
        <div className="no-videos">
          <p>No videos found in this playlist.</p>
        </div>
      )}
    </div>
  );
};

export default PlaylistPage; 