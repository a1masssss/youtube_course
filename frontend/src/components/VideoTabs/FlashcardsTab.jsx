import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiCall } from '../../utils/auth';
import { API_ENDPOINTS } from '../../config/clerkApi';
import './FlashcardsTab.css';

const FlashcardsTab = ({ video }) => {
  const { getToken } = useAuth();
  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Generate new flashcards
  const generateFlashcards = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    
    try {
      const response = await apiCall(API_ENDPOINTS.FLASHCARDS, {
        method: 'POST',
        body: JSON.stringify({
          video_uuid: video.uuid_video
        })
      }, getToken);

      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.flashcards || []);
        setCurrentIndex(0);
        setIsFlipped(false);
        console.log('✅ Flashcards generated successfully:', data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }
    } catch (error) {
      console.error('❌ Flashcards generation error:', error);
      setFlashcardsError(error.message);
    } finally {
      setFlashcardsLoading(false);
    }
  }, [video?.uuid_video, getToken]);

  // Retry function for error state
  const retryLoadFlashcards = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    
    try {
      const response = await apiCall(`${API_ENDPOINTS.FLASHCARDS}?video_uuid=${video.uuid_video}`, {
        method: 'GET'
      }, getToken);

      if (response.status === 404) {
        setFlashcards([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.flashcards || []);
        setCurrentIndex(0);
        setIsFlipped(false);
        console.log('✅ Flashcards loaded successfully:', data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load flashcards');
      }
    } catch (error) {
      console.error('❌ Flashcards loading error:', error);
      setFlashcardsError(error.message);
    } finally {
      setFlashcardsLoading(false);
    }
  }, [video?.uuid_video, getToken]);

  // Reset state and load flashcards when video changes
  useEffect(() => {
    const videoId = video?.uuid_video;
    if (!videoId) return;

    console.log('🔍 FlashcardsTab useEffect triggered for video:', videoId);

    // Reset state
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlashcards([]);
    setFlashcardsError(null);
    
    // Create AbortController for this effect
    const abortController = new AbortController();
    let isMounted = true;
    
    // Define fetch function inside useEffect to avoid dependency issues
    const loadFlashcards = async () => {
      if (!isMounted) return;
      
      console.log('📥 Starting flashcards fetch for video:', videoId);
      setFlashcardsLoading(true);
      setFlashcardsError(null);
      
      try {
        const response = await apiCall(`${API_ENDPOINTS.FLASHCARDS}?video_uuid=${videoId}`, {
          method: 'GET',
          signal: abortController.signal
        }, getToken);

        if (abortController.signal.aborted || !isMounted) return;

        if (response.status === 404) {
          // Flashcards not found - clear data to show generate button
          setFlashcards([]);
          console.log('📭 No flashcards found for video:', videoId);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setFlashcards(data.flashcards || []);
          setCurrentIndex(0);
          setIsFlipped(false);
          console.log('✅ Flashcards loaded successfully for video:', videoId);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load flashcards');
        }
      } catch (error) {
        if (error.name === 'AbortError' || !isMounted) return;
        console.error('❌ Flashcards loading error:', error);
        setFlashcardsError(error.message);
      } finally {
        if (isMounted) {
          setFlashcardsLoading(false);
        }
      }
    };

    loadFlashcards();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up FlashcardsTab effect for video:', videoId);
      isMounted = false;
      abortController.abort();
    };
  }, [video?.uuid_video, getToken]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (flashcardsLoading) {
    return (
      <div className="flashcards-empty">
        <div className="loading-spinner" />
        <p>Generating flashcards...</p>
      </div>
    );
  }

  if (flashcardsError) {
    return (
      <div className="flashcards-empty">
        <p>Error: {flashcardsError}</p>
        <button className="control-button" onClick={retryLoadFlashcards}>
          Try Again
        </button>
      </div>
    );
  }

  // Show generate button if no flashcards exist
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flashcards-empty">
        <button className="control-button" onClick={generateFlashcards}>
          Generate Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="flashcards-container">
      <div className="flashcard-progress">
        {currentIndex + 1} / {flashcards.length}
      </div>
      
      <div 
        className={`flashcard ${isFlipped ? 'is-flipped' : ''}`} 
        onClick={handleFlip}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <div className="flashcard-content">
              {flashcards[currentIndex].question}
            </div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-content">
              {flashcards[currentIndex].answer}
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button 
          className="control-button"
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
        >
          Previous
        </button>
        <button 
          className="control-button"
          onClick={handleNext}
          disabled={flashcards.length <= 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FlashcardsTab; 