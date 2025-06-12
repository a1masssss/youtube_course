import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './QuizTab.css';

const QuizTab = ({ video }) => {
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // Load quiz function
  const loadQuiz = useCallback(async () => {
    if (!video || quizAttempted) return;
    
    setQuizLoading(true);
    setQuizError(null);
    setQuizAttempted(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.QUIZ}`, {
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
        setQuizData(data.quiz_data);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        console.log('✅ Quiz loaded successfully:', data);
      } else {
        throw new Error(data.error || 'Failed to load quiz');
      }
    } catch (error) {
      console.error('❌ Quiz loading error:', error);
      setQuizError(error.message);
    } finally {
      setQuizLoading(false);
    }
  }, [video, quizAttempted]);

  const retryLoadQuiz = () => {
    setQuizAttempted(false);
    setQuizError(null);
    loadQuiz();
  };

  // Quiz answer selection
  const selectAnswer = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  // Calculate quiz results
  const calculateResults = () => {
    if (!quizData) return { score: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quizData.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_index) {
        correct++;
      }
    });
    
    return {
      score: correct,
      total: quizData.length,
      percentage: Math.round((correct / quizData.length) * 100)
    };
  };

  // Load quiz when component mounts
  useEffect(() => {
    if (video && !quizAttempted && !quizLoading) {
      loadQuiz();
    }
  }, [video, quizAttempted, quizLoading, loadQuiz]);

  // Reset quiz state when video changes
  useEffect(() => {
    setQuizAttempted(false);
    setQuizData(null);
    setQuizError(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  }, [video?.uuid_video]);

  return (
    <div className="quiz-section">
      {quizLoading && (
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading quiz...</p>
          <small>Generating questions based on video content...</small>
        </div>
      )}

      {quizError && (
        <div className="error-content">
          <p>❌ Error loading quiz: {quizError}</p>
          <button className="retry-button" onClick={retryLoadQuiz}>
            🔄 Try Again
          </button>
        </div>
      )}

      {!quizLoading && !quizError && !quizData && (
        <div className="no-content">
          <p>No quiz available for this video.</p>
          <small>Quiz requires video transcript to be available.</small>
        </div>
      )}

      {quizData && !showResults && (
        <div className="quiz-content">
          <div className="quiz-header">
            <h3>Quiz: {video?.title}</h3>
            <div className="quiz-progress">
              Question {currentQuestionIndex + 1} of {quizData.length}
            </div>
          </div>

          <div className="quiz-question">
            <div className="question-text">
              {quizData[currentQuestionIndex]?.question}
            </div>
            
            <div className="answer-options">
              {quizData[currentQuestionIndex]?.answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`answer-option ${
                    selectedAnswers[currentQuestionIndex] === index ? 'selected' : ''
                  }`}
                  onClick={() => selectAnswer(currentQuestionIndex, index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{answer}</span>
                </div>
              ))}
            </div>

            <div className="quiz-navigation">
              <button 
                className="nav-button"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                ← Previous
              </button>
              
              {currentQuestionIndex < quizData.length - 1 ? (
                <button 
                  className="nav-button"
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={selectedAnswers[currentQuestionIndex] === undefined}
                >
                  Next →
                </button>
              ) : (
                <button 
                  className="finish-button"
                  onClick={() => setShowResults(true)}
                  disabled={Object.keys(selectedAnswers).length !== quizData.length}
                >
                  Finish Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {quizData && showResults && (
        <div className="quiz-results">
          <div className="results-header">
            <h3>Quiz Results</h3>
            <div className="score-display">
              <div className="score-circle">
                {calculateResults().percentage}%
              </div>
              <div className="score-text">
                {calculateResults().score} out of {calculateResults().total} correct
              </div>
            </div>
          </div>

          <div className="questions-review">
            {quizData.map((question, qIndex) => {
              const userAnswer = selectedAnswers[qIndex];
              const isCorrect = userAnswer === question.correct_index;
              
              return (
                <div key={qIndex} className={`question-review ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="review-question">
                    <span className="question-number">Q{qIndex + 1}:</span>
                    {question.question}
                  </div>
                  <div className="review-answers">
                    {question.answers.map((answer, aIndex) => (
                      <div 
                        key={aIndex} 
                        className={`review-answer ${
                          aIndex === question.correct_index ? 'correct-answer' : ''
                        } ${
                          aIndex === userAnswer ? 'user-answer' : ''
                        }`}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + aIndex)}</span>
                        {answer}
                        {aIndex === question.correct_index && <span className="correct-mark">✓</span>}
                        {aIndex === userAnswer && aIndex !== question.correct_index && <span className="wrong-mark">✗</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-actions">
            <button 
              className="retake-button"
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setShowResults(false);
              }}
            >
              🔄 Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTab; 