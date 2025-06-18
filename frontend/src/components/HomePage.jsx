import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/auth';
import { API_ENDPOINTS } from '../config/clerkApi';
import './HomePage.css';

const HomePage = () => {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await apiCall(API_ENDPOINTS.PLAYLISTS, {
        method: 'POST',
        body: JSON.stringify({ url: playlistUrl })
      }, getToken);

      if (response.ok) {
        setMessage('Курс создан успешно!');
        setPlaylistUrl('');
        
        // Переходим к курсам через 2 секунды
        setTimeout(() => {
          navigate('/my-courses');
        }, 2000);
      } else {
        const error = await response.json();
        setMessage(`❌ Ошибка: ${error.error || 'Не удалось создать курс'}`);
      }
    } catch (error) {
      console.error('Ошибка создания курса:', error);
      setMessage('❌ Ошибка создания курса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="welcome-section">
          <h1>Learn everything on your schedule.</h1>
        </div>

        {isSignedIn && (
          <div className="create-course-section">
            <h2>Create New Course</h2>
            <form onSubmit={handleSubmit} className="playlist-form">
              <div className="form-group">
                <input
                  type="url"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list="
                  className="playlist-input"
                  disabled={loading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="create-button"
                disabled={loading || !playlistUrl.trim()}
              >
                {loading ? '🔄 Creating...' : 'Create Course'}
              </button>
            </form>

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 