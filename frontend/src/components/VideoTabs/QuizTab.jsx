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
        setQuizData(data.quiz_data || []);
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

  // Reset quiz state when video changes
  useEffect(() => {
    setQuizAttempted(false);
    setQuizData(null);
    setQuizError(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  }, [video?.uuid_video]);

  // Load quiz when component mounts
  useEffect(() => {
    if (video && !quizAttempted && !quizLoading) {
      loadQuiz();
    }
  }, [video, quizAttempted, quizLoading, loadQuiz]);

  if (quizLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading quiz...</div>
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="quiz-empty">
        <p>Error loading quiz: {quizError}</p>
        <button className="control-button" onClick={() => {
          setQuizAttempted(false);
          loadQuiz();
        }}>
          Try Again
        </button>
      </div>
    );
  }

  if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
    return (
      <div className="quiz-empty">
        <p>No quiz available for this video yet.</p>
        <small>Quiz will be generated based on video content.</small>
      </div>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  
  if (!currentQuestion || !Array.isArray(currentQuestion.answers)) {
    return (
      <div className="quiz-empty">
        <p>Invalid quiz data format.</p>
        <button className="control-button" onClick={() => {
          setQuizAttempted(false);
          loadQuiz();
        }}>
          Try Again
        </button>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === quizData.length - 1;

  const handleAnswerSelect = (optionIndex) => {
    if (showResults) return;
    
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionIndex
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quizData.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_index) {
        correctAnswers++;
      }
    });
    return {
      correct: correctAnswers,
      total: quizData.length,
      percentage: Math.round((correctAnswers / quizData.length) * 100)
    };
  };

  const isAnswerSelected = selectedAnswers[currentQuestionIndex] !== undefined;
  const selectedAnswer = selectedAnswers[currentQuestionIndex];

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <div className="quiz-score">
            <h2>Quiz Results</h2>
            <p>Score: {score.correct} out of {score.total} ({score.percentage}%)</p>
          </div>
          
          <div className="quiz-answers">
            {quizData.map((question, index) => (
              <div key={index} className="quiz-answer-review">
                <div className="question-text">
                  Question {index + 1}: {question.question}
                </div>
                <div className="options-container">
                  {question.answers.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`option-button ${
                        selectedAnswers[index] === optionIndex
                          ? optionIndex === question.correct_index
                            ? 'correct'
                            : 'incorrect'
                          : optionIndex === question.correct_index
                          ? 'correct'
                          : ''
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button
            className="control-button"
            onClick={() => {
              setQuizAttempted(false);
              setSelectedAnswers({});
              setShowResults(false);
              loadQuiz();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-content">
        <div className="question-container">
          <div className="question-text">
            {currentQuestion.question}
          </div>
          <div className="options-container">
            {currentQuestion.answers.map((option, index) => (
              <button
                key={index}
                className={`option-button ${
                  selectedAnswer === index ? 'selected' : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResults}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-controls">
          <div className="quiz-progress">
            Question {currentQuestionIndex + 1} of {quizData.length}
          </div>
          <div>
            {currentQuestionIndex > 0 && (
              <button
                className="control-button"
                onClick={handlePrevious}
                style={{ marginRight: '1rem' }}
              >
                Previous
              </button>
            )}
            <button
              className="control-button"
              onClick={handleNext}
              disabled={!isAnswerSelected}
            >
              {isLastQuestion ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTab; 