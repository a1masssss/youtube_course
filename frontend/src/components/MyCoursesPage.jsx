import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Trash2 } from 'lucide-react';
import { apiCall } from '../utils/auth';
import { API_ENDPOINTS } from '../config/clerkApi';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isSignedIn) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching courses...');
        const response = await apiCall(API_ENDPOINTS.MY_COURSES, {}, getToken);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Курсы загружены:', data);
          setPlaylists(data);
        } else {
          setError('Ошибка загрузки курсов');
        }
      } catch (error) {
        console.error('Ошибка:', error);
        setError('Не удалось загрузить курсы');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [getToken, isSignedIn]);

  const handlePlaylistClick = (playlistUuid) => {
    navigate(`/${playlistUuid}`);
  };

  const handleDeleteClick = (e, playlist) => {
    e.stopPropagation();
    setDeleteConfirmation({
      playlistId: playlist.id,
      title: playlist.title
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    setDeleting(true);
    try {
      const response = await apiCall(
        `/my-courses/${deleteConfirmation.playlistId}/delete/`, 
        { method: 'DELETE' }, 
        getToken
      );
      
      if (response.ok) {
        setPlaylists(prev => prev.filter(p => p.id !== deleteConfirmation.playlistId));
        console.log('✅ Курс удален');
      } else {
        setError('Ошибка удаления курса');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      setError('Не удалось удалить курс');
    } finally {
      setDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const getPlaylistThumbnail = (playlist) => {
    if (playlist.playlist_thumbnail) {
      return playlist.playlist_thumbnail;
    }
    if (playlist.videos && playlist.videos.length > 0 && playlist.videos[0].thumbnail) {
      return playlist.videos[0].thumbnail;
    }
    return 'https://via.placeholder.com/320x180?text=Course+Thumbnail';
  };

  if (loading) {
    return (
      <div className="my-courses-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <div>Loding...</div>
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
            🔄 Попробовать снова
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
          <h2>Пока нет курсов</h2>
          <p>Добавьте YouTube плейлист на главной странице</p>
          <button 
            onClick={() => navigate('/')} 
            className="add-course-button"
          >
            ➕ Добавить первый курс
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {playlists.map((playlist) => (
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
                <button 
                  className="delete-course-button"
                  onClick={(e) => handleDeleteClick(e, playlist)}
                  title="Удалить курс"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модал подтверждения удаления */}
      {deleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚠️ Подтвердить удаление</h3>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите удалить этот курс?</p>
              <p className="course-title-preview">"{deleteConfirmation.title}"</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={cancelDelete} 
                className="cancel-button"
                disabled={deleting}
              >
                Отмена
              </button>
              <button 
                onClick={confirmDelete} 
                className="confirm-button"
                disabled={deleting}
              >
                {deleting ? '🔄 Удаление...' : '🗑️ Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage; 