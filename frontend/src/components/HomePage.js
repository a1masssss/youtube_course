import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import './HomePage.css';

const HomePage = () => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setError('Please enter a playlist URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.PLAYLISTS, {
        url: playlistUrl
      });
      
      const playlistId = response.data.id;
      navigate(`/${playlistId}`);
    } catch (err) {
      setError('Failed to process playlist. Please check the URL and try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h1 className="hero-title">Course Manager</h1>
          <p className="hero-subtitle">Transform YouTube playlists into organized learning experiences</p>
        </div>
      </div>

      <div className="main-content">
        <div className="form-container">
          <div className="form-header">
            <h2>Add New Course</h2>
            <p>Enter a YouTube playlist URL to get started</p>
          </div>
          
          <form onSubmit={handleSubmit} className="playlist-form">
            <div className="input-wrapper">
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.99C4.24 7 2 9.24 2 12s2.24 5 4.99 5H11v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.01c2.75 0 4.99 2.24 4.99 5s-2.24 5-4.99 5H13v1.9h4.01C19.76 17 22 14.76 22 12s-2.24-5-4.99-5H13V7z"/>
                </svg>
              </div>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://youtube.com/playlist?list=..."
                className="playlist-input"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className={`submit-button ${loading ? 'loading' : ''}`}
              disabled={loading || !playlistUrl.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Course
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

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,6L10.25,11L13.1,14.8L11.5,16C9.81,13.75 7,10 7,10L1,18H23L14,6Z"/>
                </svg>
              </div>
              <h3>AI Summaries</h3>
              <p>Get intelligent summaries of video content</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                </svg>
              </div>
              <h3>Transcripts</h3>
              <p>Access full video transcripts for easy reference</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
              </div>
              <h3>Organized</h3>
              <p>Keep your learning materials structured and accessible</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 