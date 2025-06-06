import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VideoCard from './VideoCard';
import { getPlaylistUrl } from '../config/api';
import './PlaylistPage.css';

const PlaylistPage = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await axios.get(getPlaylistUrl(playlistId));
        setPlaylist(response.data);
      } catch (err) {
        setError('Failed to load playlist');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  const handleVideoClick = (videoId) => {
    navigate(`/${playlistId}/${videoId}`);
  };

  const getProcessingStats = () => {
    if (!playlist?.videos) return { total: 0, withTranscript: 0, withSummary: 0 };
    
    const total = playlist.videos.length;
    const withTranscript = playlist.videos.filter(v => v.full_transcript).length;
    const withSummary = playlist.videos.filter(v => v.summary).length;
    
    return { total, withTranscript, withSummary };
  };

  const exportSummaries = () => {
    if (!playlist?.videos) return;
    
    const summaries = playlist.videos
      .filter(v => v.summary)
      .map(v => `${v.title}\n${'='.repeat(v.title.length)}\n\n${v.summary}\n\n`)
      .join('');
    
    const blob = new Blob([summaries], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.title}_summaries.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const stats = getProcessingStats();

  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        
        <div className="playlist-info">
          <h2>{playlist?.title}</h2>
          <div className="playlist-stats">
            <span className="stat-item">📹 {stats.total} videos</span>
            <span className="stat-item">📝 {stats.withTranscript} transcripts</span>
            <span className="stat-item">📄 {stats.withSummary} summaries</span>
          </div>
        </div>

        {stats.withSummary > 0 && (
          <div className="playlist-actions">
            <button onClick={exportSummaries} className="export-button">
              📥 Export All Summaries
            </button>
          </div>
        )}
      </div>
      
      <div className="videos-grid">
        {playlist?.videos?.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => handleVideoClick(video.id)}
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