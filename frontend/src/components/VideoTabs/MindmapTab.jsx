import React, { useState, useEffect, useRef, useCallback } from 'react';
import MindMap from '../MindMap';
import { API_ENDPOINTS } from '../../config/api';
import './MindmapTab.css';

const MindmapTab = ({ video }) => {
  const [mindmapData, setMindmapData] = useState(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState(null);
  const [mindmapAttempted, setMindmapAttempted] = useState(false);
  const requestInProgress = useRef(false);

  // Load mindmap function - first try GET, then POST if needed
  const loadMindmap = useCallback(async () => {
    if (!video || mindmapAttempted || requestInProgress.current) return;
    
    requestInProgress.current = true;
    setMindmapLoading(true);
    setMindmapError(null);
    setMindmapAttempted(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      // First, try to GET existing mindmap
      console.log('🔍 Checking for existing mindmap...');
      const getResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.MINDMAP}?video_uuid=${video.uuid_video}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        if (getData.mindmap && Object.keys(getData.mindmap).length > 0) {
          setMindmapData(getData.mindmap);
          console.log('✅ Existing mindmap loaded:', getData);
          return;
        }
      }
      
      // If no existing mindmap, generate new one with POST
      console.log('🧠 Generating new mindmap...');
      const postResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.MINDMAP}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_uuid: video.uuid_video
        })
      });

      const postData = await postResponse.json();
      
      if (postResponse.ok) {
        if (postData.mindmap && Object.keys(postData.mindmap).length > 0) {
          setMindmapData(postData.mindmap);
          console.log('✅ New mindmap generated:', postData);
        } else {
          throw new Error('Empty mindmap data received');
        }
      } else {
        throw new Error(postData.error || 'Failed to generate mindmap');
      }
    } catch (error) {
      console.error('❌ Mindmap error:', error);
      setMindmapError(error.message);
      setMindmapData(null);
    } finally {
      setMindmapLoading(false);
      requestInProgress.current = false;
    }
  }, [video, mindmapAttempted]);

  const retryLoadMindmap = () => {
    setMindmapAttempted(false);
    setMindmapError(null);
    requestInProgress.current = false;
    loadMindmap();
  };

  // Auto-load mindmap when component mounts
  useEffect(() => {
    if (video && !mindmapAttempted && !mindmapLoading) {
      loadMindmap();
    }
  }, [video, mindmapAttempted, mindmapLoading, loadMindmap]);

  // Reset mindmap state when video changes
  useEffect(() => {
    setMindmapAttempted(false);
    setMindmapData(null);
    setMindmapError(null);
    requestInProgress.current = false;
  }, [video?.uuid_video]);

  // Check if video has transcript for mindmap generation
  const hasTranscript = video?.full_transcript && video.full_transcript.trim() !== '';

  if (!hasTranscript) {
    return (
      <div className="mindmap-section">
        <div className="no-content">
          <p>Mind map requires video transcript.</p>
          <small>Transcript is not available for this video.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="mindmap-section">
      {/* Loading silently in background during generation */}
      
      {mindmapError && (
        <div className="mindmap-error">
          <h3>❌ Error loading mind map</h3>
          <p>{mindmapError}</p>
          <div className="mindmap-buttons">
            <button 
              onClick={retryLoadMindmap}
              disabled={mindmapLoading}
              className="retry-button"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}
      
      {!mindmapLoading && !mindmapError && !mindmapData && (
        <div className="mindmap-section">
          <div className="no-content">
            <p>No mind map available.</p>
            <small>Click below to generate a mind map for this video.</small>
            <button 
              onClick={retryLoadMindmap}
              className="generate-mindmap-button"
            >
              🧠 Generate Mind Map
            </button>
          </div>
        </div>
      )}
      
      {!mindmapLoading && !mindmapError && mindmapData && (
        <div className="mindmap-container">
          <MindMap mindmapData={mindmapData} />
        </div>
      )}
    </div>
  );
};

export default MindmapTab; 