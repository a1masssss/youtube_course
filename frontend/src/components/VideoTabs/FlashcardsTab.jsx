import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './FlashcardsTab.css';

const FlashcardsTab = ({ video }) => {
  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState(null);
  const [flashcardsAttempted, setFlashcardsAttempted] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

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
        setCurrentCardIndex(0);
        setShowAnswer(false);
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

  const retryLoadFlashcards = () => {
    setFlashcardsAttempted(false);
    setFlashcardsError(null);
    loadFlashcards();
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // Auto-load flashcards when component mounts
  useEffect(() => {
    if (video && !flashcardsAttempted && !flashcardsLoading) {
      loadFlashcards();
    }
  }, [video, flashcardsAttempted, flashcardsLoading, loadFlashcards]);

  // Reset flashcards state when video changes
  useEffect(() => {
    setFlashcardsAttempted(false);
    setFlashcards([]);
    setFlashcardsError(null);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  }, [video?.uuid_video]);

  return (
    <div className="flashcards-section">
      {flashcardsLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading flashcards...</p>
          <small>Generating flashcards based on video content...</small>
        </div>
      )}
      
      {flashcardsError && (
        <div className="no-content">
          <p>❌ Error loading flashcards: {flashcardsError}</p>
          <div className="flashcard-buttons">
            <button 
              onClick={retryLoadFlashcards}
              disabled={flashcardsLoading}
              className="retry-button"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}
      
      {!flashcardsLoading && !flashcardsError && flashcards.length === 0 && (
        <div className="no-content">
          <p>No flashcards available for this video.</p>
          <small>Flashcards require video transcript to be available.</small>
        </div>
      )}
      
      {!flashcardsLoading && flashcards.length > 0 && (
        <div className="flashcards-container">
          <div className="flashcard-header">
            <div className="flashcard-progress">
              Card {currentCardIndex + 1} of {flashcards.length}
            </div>
          </div>
          
          <div className="flashcard-content">
            <div className="flashcard-front">
              <strong>Question:</strong><br />
              {flashcards[currentCardIndex]?.question}
            </div>
            
            {showAnswer && (
              <div className="flashcard-back">
                <strong>Answer:</strong><br />
                {flashcards[currentCardIndex]?.answer}
              </div>
            )}
          </div>
          
          <div className="flashcard-controls">
            <button 
              onClick={prevCard}
              disabled={currentCardIndex === 0}
              className="flashcard-control prev"
            >
              ← Prev
            </button>
            
            <button 
              onClick={toggleAnswer}
              className="flashcard-control toggle"
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
            
            <button 
              onClick={nextCard}
              disabled={currentCardIndex === flashcards.length - 1}
              className="flashcard-control next"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsTab; 