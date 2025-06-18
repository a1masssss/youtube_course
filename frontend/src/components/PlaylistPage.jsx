import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiCall } from '../utils/auth';
import { API_ENDPOINTS } from '../config/clerkApi';
import VideoCard from './VideoCard';
import './PlaylistPage.css';

const PlaylistPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uuid) return;

    // Create AbortController for this effect
    const abortController = new AbortController();

    const fetchPlaylistVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching playlist videos for UUID:', uuid);
        const response = await apiCall(API_ENDPOINTS.getPlaylistVideosList(uuid), {
          method: 'GET',
          signal: abortController.signal
        }, getToken);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          console.log('🚫 Request was aborted for playlist:', uuid);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Playlist videos loaded:', data);
          setPlaylist(data);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load playlist');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('🚫 Fetch was aborted for playlist:', uuid);
          return;
        }
        console.error('❌ Error fetching playlist:', error);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistVideos();

    // Cleanup function to abort the request if component unmounts or dependencies change
    return () => {
      console.log('🧹 Cleanup: Aborting request for playlist:', uuid);
      abortController.abort();
    };
  }, [uuid, getToken]);

  const handleVideoClick = (videoUuid) => {
    navigate(`/${uuid}/${videoUuid}`);
  };

  if (loading) {
    return (
      <div className="playlist-page">
        {/* Loading silently in background */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="playlist-page">
      <div className="playlist-header">
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
    </div>
  );
};

export default PlaylistPage; 