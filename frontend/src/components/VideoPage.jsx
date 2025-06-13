import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './VideoPage.css';
import { SummaryTab, QuizTab, ChatTab, FlashcardsTab, MindmapTab, TranscriptTab } from './VideoTabs';

const VideoPage = () => {
  const { videoUuid } = useParams();
  
  // Video state
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoLoadingRef = useRef(false);
  const loadedVideoRef = useRef(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('summary');

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      if (videoLoadingRef.current || loadedVideoRef.current === videoUuid) return;
      
      videoLoadingRef.current = true;
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.video(videoUuid)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          setVideo(data);
          loadedVideoRef.current = videoUuid;
          console.log('Video loaded:', data);
        } else {
          setError('Failed to load video');
        }
      } catch (error) {
        console.error('Error loading video:', error);
        setError(error.message);
      } finally {
        setLoading(false);
        videoLoadingRef.current = false;
      }
    };

    if (videoUuid && loadedVideoRef.current !== videoUuid) {
      // Reset states when videoUuid changes
      setVideo(null);
      setError(null);
      setLoading(true);
      
      loadVideo();
    }
  }, [videoUuid]);

  if (loading) {
    return (
      <div className="video-page video-page--loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-page video-page--error">
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="video-page video-page--not-found">
        <div className="not-found-container">
          <p className="not-found-message">Video not found</p>
        </div>
      </div>
    );
  }

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

  const embedUrl = getYouTubeEmbedUrl(video?.url);

  return (
    <div className="video-page">
      <div className="video-page__container">
        <div className="video-page__content">
          <h1 className="video-page__title">{video?.title}</h1>

          <div className="video-page__main-section">
            <div className="video-player">
              <div className="video-player__wrapper">
                <div className="video-player__aspect-ratio">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video?.title}
                      className="video-player__iframe"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <div className="video-player__placeholder">
                      <div className="video-player__placeholder-content">
                        <img 
                          src={video?.thumbnail} 
                          alt={video?.title}
                          className="video-player__thumbnail"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/640x360?text=No+Image';
                          }}
                        />
                        <a 
                          href={video?.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="video-player__youtube-link"
                        >
                          ▶ Watch on YouTube
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="transcript-panel">
              <div className="transcript-panel__content">
                <h3 className="transcript-panel__title">Transcript</h3>
                <div className="transcript-panel__body">
                  <TranscriptTab video={video} isCompact={true} />
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            <div className="tabs__nav">
              <button
                onClick={() => setActiveTab('summary')}
                className={`tabs__button ${activeTab === 'summary' ? 'tabs__button--active' : ''}`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`tabs__button ${activeTab === 'flashcards' ? 'tabs__button--active' : ''}`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setActiveTab('mindmap')}
                className={`tabs__button ${activeTab === 'mindmap' ? 'tabs__button--active' : ''}`}
              >
                Mindmap
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`tabs__button ${activeTab === 'quiz' ? 'tabs__button--active' : ''}`}
              >
                Quiz
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`tabs__button ${activeTab === 'chat' ? 'tabs__button--active' : ''}`}
              >
                Chat
              </button>
            </div>

            <div className="tabs__content">
              {activeTab === 'summary' && <SummaryTab video={video} />}
              {activeTab === 'flashcards' && (
                <div className="slide-in-right">
                  <FlashcardsTab video={video} />
                </div>
              )}
              {activeTab === 'mindmap' && <MindmapTab video={video} />}
              {activeTab === 'quiz' && <QuizTab video={video} />}
              {activeTab === 'chat' && <ChatTab video={video} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 