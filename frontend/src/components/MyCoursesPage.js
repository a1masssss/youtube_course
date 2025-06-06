import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.MY_COURSES);
        setPlaylists(response.data);
        console.log('📚 Fetched courses:', response.data);
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlistId) => {
    navigate(`/${playlistId}`);
  };

  const getPlaylistStats = (playlist) => {
    const totalVideos = playlist.videos?.length || 0;
    const withTranscripts = playlist.videos?.filter(v => v.full_transcript && v.full_transcript.trim())?.length || 0;
    const withSummaries = playlist.videos?.filter(v => v.summary && v.summary.trim())?.length || 0;
    
    return { totalVideos, withTranscripts, withSummaries };
  };

  const getPlaylistThumbnail = (playlist) => {
    // Try to get thumbnail from first video, fallback to placeholder
    if (playlist.videos && playlist.videos.length > 0 && playlist.videos[0].thumbnail) {
      return playlist.videos[0].thumbnail;
    }
    return 'https://via.placeholder.com/320x180?text=Course+Thumbnail';
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="my-courses-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-courses-page">
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
          <button onClick={() => window.location.reload()} className="retry-button">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="page-header">
        <h1>My Courses</h1>
        <p>All your YouTube playlists and learning progress</p>
        {playlists.length > 0 && (
          <div className="courses-summary">
            <span className="summary-item">📚 {playlists.length} courses</span>
            <span className="summary-item">
              🎯 {playlists.reduce((acc, p) => acc + (p.videos?.length || 0), 0)} total videos
            </span>
          </div>
        )}
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>No courses yet</h2>
          <p>Start by adding a YouTube playlist on the Home page</p>
          <button 
            onClick={() => navigate('/')} 
            className="add-course-button"
          >
            ➕ Add Your First Course
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {playlists.map((playlist) => {
            const stats = getPlaylistStats(playlist);
            const progressPercentage = stats.totalVideos > 0 
              ? Math.round((stats.withSummaries / stats.totalVideos) * 100) 
              : 0;

            return (
              <div 
                key={playlist.id} 
                className="course-card"
                onClick={() => handlePlaylistClick(playlist.id)}
              >
                <div className="course-thumbnail">
                  <img 
                    src={getPlaylistThumbnail(playlist)} 
                    alt={playlist.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/320x180?text=Course+Thumbnail';
                    }}
                  />
                  <div className="course-overlay">
                    <div className="course-icon">🎓</div>
                  </div>
                </div>

                <div className="course-info">
                  <h3 className="course-title">{playlist.title}</h3>
                  
                  <div className="course-description">
                    <p>{truncateText(playlist.description || `A comprehensive course with ${stats.totalVideos} videos covering various topics.`)}</p>
                  </div>

                  <div className="course-status">
                    <div className="status-indicators">
                      {progressPercentage === 100 ? (
                        <span className="status-badge complete">✅ Complete</span>
                      ) : progressPercentage > 0 ? (
                        <span className="status-badge progress">🔄 In Progress</span>
                      ) : (
                        <span className="status-badge new">🆕 New</span>
                      )}
                      <span className="status-badge videos">{stats.totalVideos} Videos</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage; 