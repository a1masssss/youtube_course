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
      <div className="min-h-screen bg-[#0A0A1B] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-white mt-4">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A1B] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0A0A1B] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Video not found</p>
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
    <div className="min-h-screen bg-[#0A0A1B] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <div className="bg-gray-900/30 rounded-3xl p-8 border border-gray-800">
          {/* Video Title */}
          <h1 className="text-2xl font-bold text-white mb-6">{video?.title}</h1>

          {/* Top Section: Video + Transcript */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* YouTube Video */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 rounded-2xl p-1 border border-gray-700">
                <div className="aspect-video w-full">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video?.title}
                      className="w-full h-full rounded-xl"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <img 
                          src={video?.thumbnail} 
                          alt={video?.title}
                          className="max-w-full max-h-full rounded-lg mb-4"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/640x360?text=No+Image';
                          }}
                        />
                        <a 
                          href={video?.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                        >
                          ▶ Watch on YouTube
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 h-full">
                <h3 className="text-lg font-semibold text-white mb-4">Transcript</h3>
                <div className="h-80 overflow-y-auto">
                  <TranscriptTab video={video} isCompact={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="w-full">
            {/* Tab Navigation */}
            <div className="grid grid-cols-5 bg-gray-800/50 border border-gray-700 rounded-2xl p-1 mb-6">
              <button
                onClick={() => setActiveTab('summary')}
                className={`rounded-xl py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'summary'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`rounded-xl py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'flashcards'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setActiveTab('mindmap')}
                className={`rounded-xl py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'mindmap'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Mindmap
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`rounded-xl py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`rounded-xl py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Chat
              </button>
            </div>

            {/* Content Area */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 min-h-96">
              {activeTab === 'summary' && <SummaryTab video={video} />}
              {activeTab === 'flashcards' && <FlashcardsTab video={video} />}
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