import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, API_ENDPOINTS } from '../config/api';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.MY_COURSES);
        console.log('📋 Playlists data:', response.data);
        setPlaylists(response.data);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlistUuid) => {
    navigate(`/${playlistUuid}`);
  };

  const getPlaylistThumbnail = (playlist) => {
    // First try to get playlist thumbnail
    if (playlist.playlist_thumbnail) {
      return playlist.playlist_thumbnail;
    }
    // Then try to get thumbnail from first video, fallback to placeholder
    if (playlist.videos && playlist.videos.length > 0 && playlist.videos[0].thumbnail) {
      return playlist.videos[0].thumbnail;
    }
    return 'https://via.placeholder.com/320x180?text=Course+Thumbnail';
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

            return (
              <div 
                key={playlist.uuid_playlist} 
                className="course-card"
                onClick={() => handlePlaylistClick(playlist.uuid_playlist)}
              >
                <div className="course-thumbnail">
                  <img 
                    src={getPlaylistThumbnail(playlist)} 
                    alt={playlist.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/320x180?text=Course+Thumbnail';
                    }}
                  />
                </div>

                <div className="course-info">
                  <h3 className="course-title">{playlist.title}</h3>
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