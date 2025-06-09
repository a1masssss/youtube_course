import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, API_ENDPOINTS } from '../config/api';
import './HomePage.css';





const HomePage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post(API_ENDPOINTS.PLAYLISTS, {
        url: url.trim()
      });

      console.log('✅ Playlist processed successfully:', response.data);
      
      // Navigate to the playlist page
      navigate(`/${response.data.uuid_playlist}`);
    } catch (error) {
      console.error('❌ Error processing playlist:', error);
      setError(error.response?.data?.error || 'Failed to process URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Explore any topic, on your schedule.</h1>
        </div>
      </div>

      <div className="main-content">
        <div className="form-container">
          <div className="form-header">
            <h2>Add New Course</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="playlist-form">
            <div className="input-wrapper">
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.99C4.24 7 2 9.24 2 12s2.24 5 4.99 5H11v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.01c2.75 0 4.99 2.24 4.99 5s-2.24 5-4.99 5H13v1.9h4.01C19.76 17 22 14.76 22 12s-2.24-5-4.99-5H13V7z"/>
                </svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/your-link"
                className="playlist-input"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className={`submit-button ${loading ? 'loading' : ''}`}
              disabled={loading || !url.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  Create Course
                </>
              )}
            </button>
            
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 