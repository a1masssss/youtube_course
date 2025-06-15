import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './FlashcardsTab.css';

const FlashcardsTab = ({ video }) => {
  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState(null);
  const [flashcardsAttempted, setFlashcardsAttempted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load flashcards
  const loadFlashcards = useCallback(async () => {
    if (!video || flashcardsAttempted) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    setFlashcardsAttempted(true);
    
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
        console.log('✅ Flashcards loaded/generated successfully:', data);
      } else {
        throw new Error(data.error || 'Failed to load flashcards');
      }
    } catch (error) {
      console.error('❌ Flashcards loading error:', error);
      setFlashcardsError(error.message);
    } finally {
      setFlashcardsLoading(false);
    }
  }, [video, flashcardsAttempted]);

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

  // Load flashcards when video changes
  useEffect(() => {
    if (!video?.uuid_video) return;
    
    // Reset state
    setFlashcardsAttempted(false);
    setFlashcards([]);
    setFlashcardsError(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    // Load flashcards
    if (!flashcardsLoading) {
      loadFlashcards();
    }
  }, [video?.uuid_video, loadFlashcards]);

  if (flashcardsLoading) {
    return (
      <div className="flashcards-empty">
        <div className="loading-spinner" />
        <p>Loading flashcards...</p>
      </div>
    );
  }

  if (flashcardsError) {
    return (
      <div className="flashcards-empty">
        <p>Error loading flashcards: {flashcardsError}</p>
        <button 
          className="control-button" 
          onClick={() => {
            setFlashcardsAttempted(false);
            loadFlashcards();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flashcards-empty">
        <p>No flashcards available for this video yet.</p>
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