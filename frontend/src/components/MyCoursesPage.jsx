import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { apiClient, API_ENDPOINTS } from '../config/api';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { playlistId, title }
  const [deleting, setDeleting] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (fetchingRef.current) return;
      
      fetchingRef.current = true;
      try {
        const response = await apiClient.get(API_ENDPOINTS.MY_COURSES);
        console.log('📋 Playlists data:', response.data);
        setPlaylists(response.data);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlistUuid) => {
    navigate(`/${playlistUuid}`);
  };

  const handleDeleteClick = (e, playlist) => {
    e.stopPropagation(); // Prevent card click
    setDeleteConfirmation({
      playlistId: playlist.id,
      title: playlist.title
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    setDeleting(true);
    try {
      await apiClient.delete(API_ENDPOINTS.DELETE_COURSE(deleteConfirmation.playlistId));
      
      // Remove from local state
      setPlaylists(prev => prev.filter(p => p.id !== deleteConfirmation.playlistId));
      
      console.log('✅ Course deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      setError('Failed to delete course');
    } finally {
      setDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
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
                  <button 
                    className="delete-course-button"
                    onClick={(e) => handleDeleteClick(e, playlist)}
                    title="Delete course"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚠️ Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this course?</p>
              <div className="course-to-delete">
                <strong>"{deleteConfirmation.title}"</strong>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage; 