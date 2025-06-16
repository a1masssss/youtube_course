import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './FlashcardsTab.css';

const FlashcardsTab = ({ video }) => {
  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch existing flashcards
  const fetchFlashcards = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.FLASHCARDS}?video_uuid=${video.uuid_video}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.status === 404) {
        // Flashcards not found - clear data to show generate button
        setFlashcards([]);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setFlashcards(data.flashcards || []);
        setCurrentIndex(0);
        setIsFlipped(false);
        console.log('✅ Flashcards loaded successfully:', data);
      } else {
        throw new Error(data.error || 'Failed to load flashcards');
      }
    } catch (error) {
      console.error('❌ Flashcards loading error:', error);
      setFlashcardsError(error.message);
    } finally {
      setFlashcardsLoading(false);
    }
  }, [video?.uuid_video]);

  // Generate new flashcards
  const generateFlashcards = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.FLASHCARDS}`, {
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
        setFlashcards(data.flashcards || []);
        setCurrentIndex(0);
        setIsFlipped(false);
        console.log('✅ Flashcards generated successfully:', data);
      } else {
        throw new Error(data.error || 'Failed to generate flashcards');
      }
    } catch (error) {
      console.error('❌ Flashcards generation error:', error);
      setFlashcardsError(error.message);
    } finally {
      setFlashcardsLoading(false);
    }
  }, [video?.uuid_video]);

  // Reset state and load flashcards when video changes
  useEffect(() => {
    const videoId = video?.uuid_video;
    if (!videoId) return;

    // Reset state
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlashcards([]);
    setFlashcardsError(null);
    
    // Create AbortController for this effect
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      setFlashcardsLoading(true);
      setFlashcardsError(null);
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.FLASHCARDS}?video_uuid=${videoId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortController.signal
          }
        );

        if (abortController.signal.aborted) return;

        if (response.status === 404) {
          // Flashcards not found - clear data to show generate button
          if (isMounted) {
            setFlashcards([]);
          }
          return;
        }

        const data = await response.json();
        
        if (response.ok && isMounted) {
          setFlashcards(data.flashcards || []);
          setCurrentIndex(0);
          setIsFlipped(false);
          console.log('✅ Flashcards loaded successfully:', data);
        } else if (isMounted) {
          throw new Error(data.error || 'Failed to load flashcards');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Flashcards fetch aborted');
          return;
        }
        if (isMounted) {
          console.error('❌ Flashcards loading error:', error);
          setFlashcardsError(error.message);
        }
      } finally {
        if (isMounted) {
          setFlashcardsLoading(false);
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
        <button className="control-button" onClick={fetchFlashcards}>
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