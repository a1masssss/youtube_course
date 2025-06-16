import React, { useState, useEffect, useCallback } from 'react';
import MindMap from '../MindMap';
import { API_ENDPOINTS } from '../../config/api';
import './MindmapTab.css';

const MindmapTab = ({ video }) => {
  const [mindmapData, setMindmapData] = useState(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState(null);

  // Fetch existing mindmap
  const fetchMindmap = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setMindmapLoading(true);
    setMindmapError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.MINDMAP}?video_uuid=${video.uuid_video}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.status === 404) {
        // Mindmap not found - clear data to show generate button
        setMindmapData(null);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        if (data.mindmap && Object.keys(data.mindmap).length > 0) {
          setMindmapData(data.mindmap);
          console.log('✅ Mindmap loaded successfully:', data);
        } else {
          setMindmapData(null);
        }
      } else {
        throw new Error(data.error || 'Failed to load mindmap');
      }
    } catch (error) {
      console.error('❌ Mindmap loading error:', error);
      setMindmapError(error.message);
    } finally {
      setMindmapLoading(false);
    }
  }, [video?.uuid_video]);

  // Generate new mindmap
  const generateMindmap = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setMindmapLoading(true);
    setMindmapError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.MINDMAP}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_uuid: video.uuid_video
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.mindmap && Object.keys(data.mindmap).length > 0) {
          setMindmapData(data.mindmap);
          console.log('✅ Mindmap generated successfully:', data);
        } else {
          throw new Error('Empty mindmap data received');
        }
      } else {
        throw new Error(data.error || 'Failed to generate mindmap');
      }
    } catch (error) {
      console.error('❌ Mindmap generation error:', error);
      setMindmapError(error.message);
    } finally {
      setMindmapLoading(false);
    }
  }, [video?.uuid_video]);

  // Reset state and load mindmap when video changes
  useEffect(() => {
    const videoId = video?.uuid_video;
    if (!videoId) return;

    // Reset state
    setMindmapData(null);
    setMindmapError(null);
    
    // Create AbortController for this effect
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      setMindmapLoading(true);
      setMindmapError(null);
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.MINDMAP}?video_uuid=${videoId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortController.signal
          }
        );

        if (abortController.signal.aborted) return;

        if (response.status === 404) {
          // Mindmap not found - clear data to show generate button
          if (isMounted) {
            setMindmapData(null);
          }
          return;
        }

        const data = await response.json();
        
        if (response.ok && isMounted) {
          if (data.mindmap && Object.keys(data.mindmap).length > 0) {
            setMindmapData(data.mindmap);
            console.log('✅ Mindmap loaded successfully:', data);
          } else {
            setMindmapData(null);
          }
        } else if (isMounted) {
          throw new Error(data.error || 'Failed to load mindmap');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Mindmap fetch aborted');
          return;
        }
        if (isMounted) {
          console.error('❌ Mindmap loading error:', error);
          setMindmapError(error.message);
        }
      } finally {
        if (isMounted) {
          setMindmapLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [video?.uuid_video]); // Only depend on video UUID

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
          <button className="control-button" onClick={fetchMindmap}>
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