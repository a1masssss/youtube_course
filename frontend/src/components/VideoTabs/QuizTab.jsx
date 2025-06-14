import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './QuizTab.css';

const QuizTab = ({ video }) => {
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [savedResults, setSavedResults] = useState(null);
  
  // Ref to prevent double requests
  const initialFetchDone = useRef(false);

  // Fetch existing quiz
  const fetchQuiz = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setQuizLoading(true);
    setQuizError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.QUIZ}?video_uuid=${video.uuid_video}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.status === 404) {
        // Quiz not found - clear data to show generate button
        setQuizData(null);
        setQuizCompleted(false);
        setSavedResults(null);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setQuizData(data.quiz.quiz_json || []);
        
        // Check if quiz is completed
        if (data.completion && data.completion.is_completed) {
          setQuizCompleted(true);
          setSavedResults(data.completion);
          setShowResults(true);
          
          // Reconstruct selected answers from saved results
          const reconstructedAnswers = {};
          if (data.completion.user_answers) {
            data.completion.user_answers.forEach(answer => {
              reconstructedAnswers[answer.question_index] = answer.selected_answer;
            });
            setSelectedAnswers(reconstructedAnswers);
          }
        } else {
          setQuizCompleted(false);
          setSavedResults(null);
        }
        
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
  }, [video?.uuid_video]);

  // Generate new quiz
  const generateQuiz = useCallback(async () => {
    if (!video?.uuid_video) return;
    
    setQuizLoading(true);
    setQuizError(null);
    
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
        setQuizData(data.quiz.quiz_json || []);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
        setQuizCompleted(false);
        setSavedResults(null);
        console.log('✅ Quiz generated successfully:', data);
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (error) {
      console.error('❌ Quiz generation error:', error);
      setQuizError(error.message);
    } finally {
      setQuizLoading(false);
    }
  }, [video?.uuid_video]);

  // Submit quiz results
  const submitQuizResults = useCallback(async (answers) => {
    if (!video?.uuid_video || !answers) return;
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Convert answers object to array
      const userAnswersArray = [];
      for (let i = 0; i < quizData.length; i++) {
        userAnswersArray.push(answers[i] !== undefined ? answers[i] : -1);
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}${API_ENDPOINTS.QUIZ_SUBMIT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_uuid: video.uuid_video,
          user_answers: userAnswersArray
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setQuizCompleted(true);
        setSavedResults(data.results);
        console.log('✅ Quiz results saved successfully:', data);
      } else {
        console.error('❌ Failed to save quiz results:', data.error);
      }
    } catch (error) {
      console.error('❌ Error submitting quiz results:', error);
    }
  }, [video?.uuid_video, quizData]);

  // Reset state and load quiz when video changes
  useEffect(() => {
    const videoId = video?.uuid_video;
    if (!videoId) return;

    // Reset state
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizCompleted(false);
    setSavedResults(null);
    
    // Prevent double fetch in development mode
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchQuiz();
    }

    // Cleanup function to reset the ref when component unmounts or video changes
    return () => {
      initialFetchDone.current = false;
    };
  }, [video?.uuid_video, fetchQuiz]);

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
        <p>Error: {quizError}</p>
        <button className="control-button" onClick={fetchQuiz}>
          Try Again
        </button>
      </div>
    );
  }

  // Show generate button if no quiz exists
  if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
    return (
      <div className="quiz-empty">
        <p>No quiz available for this video yet.</p>
        <button className="control-button" onClick={generateQuiz}>
          Generate Quiz
        </button>
      </div>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  
  if (!currentQuestion || !Array.isArray(currentQuestion.answers)) {
    return (
      <div className="quiz-empty">
        <p>Invalid quiz data format.</p>
        <button className="control-button" onClick={fetchQuiz}>
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
      // Submit quiz results when completing the quiz
      if (!quizCompleted) {
        submitQuizResults(selectedAnswers);
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const calculateScore = () => {
    // Use saved results if available, otherwise calculate from current answers
    if (savedResults) {
      return {
        correct: savedResults.correct_answers_count,
        total: savedResults.total_questions,
        percentage: parseFloat(savedResults.score_percentage).toFixed(1)
      };
    }
    
    let correctAnswers = 0;
    quizData.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_index) {
        correctAnswers++;
      }
    });
    return {
      correct: correctAnswers,
      total: quizData.length,
      percentage: ((correctAnswers / quizData.length) * 100).toFixed(1)
    };
  };

  const isAnswerSelected = selectedAnswers[currentQuestionIndex] !== undefined;

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <div className="quiz-score">
            <h2>Quiz Results</h2>
            <p>Score: {score.correct} out of {score.total} ({score.percentage}%)</p>
            {quizCompleted && savedResults && (
              <p className="completion-info">
                Completed on: {new Date(savedResults.completed_at).toLocaleDateString()}
              </p>
            )}
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
          
          {!quizCompleted && (
            <button
              className="control-button"
              onClick={() => {
                setSelectedAnswers({});
                setShowResults(false);
                setCurrentQuestionIndex(0);
              }}
            >
              Try Again
            </button>
          )}
          
          {quizCompleted && (
            <div className="quiz-completed-actions">
              <p className="completion-message">
                ✅ Quiz completed and results saved!
              </p>
              <button
                className="control-button"
                onClick={() => {
                  setSelectedAnswers({});
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setQuizCompleted(false);
                  setSavedResults(null);
                  generateQuiz();
                }}
              >
                Generate New Quiz
              </button>
            </div>
          )}
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
                  selectedAnswers[currentQuestionIndex] === index ? 'selected' : ''
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