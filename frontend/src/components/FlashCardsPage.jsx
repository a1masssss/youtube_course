import React from 'react';
import { useParams } from 'react-router-dom';

const FlashCardsPage = () => {
  const { uuid } = useParams();

  return (
    <div className="flashcards-page">
      <div className="flashcards-content">
        <h1>FlashCards</h1>
        <p>Video UUID: {uuid}</p>
        <p>This page will display flashcards for the selected video.</p>
      </div>
    </div>
  );
};

export default FlashCardsPage; 