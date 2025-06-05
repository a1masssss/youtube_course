import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VideoPage.css';

const VideoPage = () => {
  const { playlistId, videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(`http://localhost:8001/api/videos/${videoId}/`);
        setVideo(response.data);
      } catch (err) {
        setError('Failed to load video');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return '';
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(`/${playlistId}`)} className="back-button">
          Back to Playlist
        </button>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(video?.url);

  return (
    <div className="video-page">
      <div className="video-header">
        <button onClick={() => navigate(`/${playlistId}`)} className="back-button">
          ← Back to Playlist
        </button>
      </div>
      
      <div className="video-content">
        {/* Video Player Section */}
        <div className="video-player-section">
          {embedUrl ? (
            <div className="video-player">
              <iframe
                src={embedUrl}
                title={video?.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="video-thumbnail-large">
              <img 
                src={video?.thumbnail} 
                alt={video?.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/640x360?text=No+Image';
                }}
              />
              <div className="play-overlay">
                <a href={video?.url} target="_blank" rel="noopener noreferrer" className="play-button">
                  ▶ Watch on YouTube
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="video-info-section">
          <div className="video-details">
            <h1>{video?.title}</h1>
            <div className="video-meta">
              <p className="video-url">
                <a href={video?.url} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube ↗
                </a>
              </p>
              <p className="video-id">Video ID: {video?.video_id}</p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="content-tabs-section">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button 
              className={`tab-button ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'summary' && (
              <div className="summary-section">
                {video?.summary ? (
                  <div className="summary-content">
                    <div className="content-header">
                      <h2>Video Summary</h2>
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(video.summary)}
                        title="Copy summary"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="summary-text">
                      {video.summary}
                    </div>
                  </div>
                ) : (
                  <div className="no-content">
                    <p>No summary available for this video.</p>
                    <small>Summary will be generated automatically when the video is processed.</small>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="transcript-section">
                {video?.full_transcript ? (
                  <div className="transcript-content">
                    <div className="content-header">
                      <h2>Full Transcript</h2>
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(video.full_transcript)}
                        title="Copy transcript"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="transcript-text">
                      {video.full_transcript}
                    </div>
                  </div>
                ) : (
                  <div className="no-content">
                    <p>No transcript available for this video.</p>
                    <small>Transcript will be generated automatically when the video is processed.</small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 