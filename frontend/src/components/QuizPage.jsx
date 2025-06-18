import React from 'react';
import { useParams } from 'react-router-dom';

const QuizPage = () => {
  const { uuid } = useParams();

  return (
    <div className="quiz-page">
      <div className="quiz-content">
        <h1>Quiz</h1>
        <p>Video UUID: {uuid}</p>
        <p>This page will display quiz for the selected video.</p>
      </div>
    </div>
  );
};

export default QuizPage; 