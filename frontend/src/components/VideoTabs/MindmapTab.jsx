import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiCall } from '../../utils/auth';
import MindMap from '../MindMap';
import { API_ENDPOINTS } from '../../config/clerkApi';
import './MindmapTab.css';

const MindmapTab = ({ video }) => {
  const { getToken } = useAuth();
  const [mindmapData, setMindmapData] = useState(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState(null);

  // Generate new mindmap
  const generateMindmap = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setMindmapLoading(true);
    setMindmapError(null);
    
    try {
      const response = await apiCall(API_ENDPOINTS.MINDMAP, {
        method: 'POST',
        body: JSON.stringify({
          video_uuid: video.uuid_video
        })
      }, getToken);

      if (response.ok) {
        const data = await response.json();
        if (data.mindmap && Object.keys(data.mindmap).length > 0) {
          setMindmapData(data.mindmap);
          console.log('✅ Mindmap generated successfully:', data);
        } else {
          throw new Error('Empty mindmap data received');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate mindmap');
      }
    } catch (error) {
      console.error('❌ Mindmap generation error:', error);
      setMindmapError(error.message);
    } finally {
      setMindmapLoading(false);
    }
  }, [video?.uuid_video, getToken]);

  // Retry function for error state
  const retryLoadMindmap = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setMindmapLoading(true);
    setMindmapError(null);
    
    try {
      const response = await apiCall(`${API_ENDPOINTS.MINDMAP}?video_uuid=${video.uuid_video}`, {
        method: 'GET'
      }, getToken);

      if (response.status === 404) {
        setMindmapData(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.mindmap && Object.keys(data.mindmap).length > 0) {
          setMindmapData(data.mindmap);
          console.log('✅ Mindmap loaded successfully:', data);
        } else {
          setMindmapData(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load mindmap');
      }
    } catch (error) {
      console.error('❌ Mindmap loading error:', error);
      setMindmapError(error.message);
    } finally {
      setMindmapLoading(false);
    }
  }, [video?.uuid_video, getToken]);

  // Reset state and load mindmap when video changes
  useEffect(() => {
    const videoId = video?.uuid_video;
    if (!videoId) return;

    console.log('🔍 MindmapTab useEffect triggered for video:', videoId);

    // Reset state
    setMindmapData(null);
    setMindmapError(null);
    
    // Create AbortController for this effect
    const abortController = new AbortController();
    let isMounted = true;
    
    const loadMindmap = async () => {
      if (!isMounted) return;
      
      console.log('📥 Starting mindmap fetch for video:', videoId);
      setMindmapLoading(true);
      setMindmapError(null);
      
      try {
        const response = await apiCall(`${API_ENDPOINTS.MINDMAP}?video_uuid=${videoId}`, {
          method: 'GET'
        }, getToken);

        if (abortController.signal.aborted || !isMounted) return;

        if (response.status === 404) {
          // Mindmap not found - clear data to show generate button
          setMindmapData(null);
          console.log('📭 No mindmap found for video:', videoId);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.mindmap && Object.keys(data.mindmap).length > 0) {
            setMindmapData(data.mindmap);
            console.log('✅ Mindmap loaded successfully for video:', videoId);
          } else {
            setMindmapData(null);
            console.log('📭 Empty mindmap data for video:', videoId);
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load mindmap');
        }
      } catch (error) {
        if (error.name === 'AbortError' || !isMounted) return;
        console.error('❌ Mindmap loading error:', error);
        setMindmapError(error.message);
      } finally {
        if (isMounted) {
          setMindmapLoading(false);
        }
      }
    };

    loadMindmap();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up MindmapTab effect for video:', videoId);
      isMounted = false;
      abortController.abort();
    };
  }, [video?.uuid_video, getToken]);

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

  if (mindmapLoading) {
    return (
      <div className="mindmap-section">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Generating mindmap...</p>
        </div>
      </div>
    );
  }

  if (mindmapError) {
    return (
      <div className="mindmap-section">
        <div className="error-content">
          <p>Error: {mindmapError}</p>
          <button className="control-button" onClick={retryLoadMindmap}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show generate button if no mindmap exists
  if (!mindmapData) {
    return (
      <div className="mindmap-section">
        <div className="no-content">
          <button className="control-button" onClick={generateMindmap}>
            Generate Mindmap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mindmap-section">
      <div className="mindmap-container">
        <MindMap mindmapData={mindmapData} />
      </div>
    </div>
  );
};

export default MindmapTab; 