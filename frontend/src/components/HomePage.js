import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      const response = await axios.post('http://localhost:8001/api/playlists/', {
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
      <div className="home-container">
        <h2>Enter YouTube Playlist URL</h2>
        <form onSubmit={handleSubmit} className="playlist-form">
          <div className="input-group">
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://youtube.com/playlist?list=..."
              className="playlist-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !playlistUrl.trim()}
            >
              {loading ? 'Processing...' : 'Load Playlist'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default HomePage; 