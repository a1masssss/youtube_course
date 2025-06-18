import React from 'react';
import { SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Transform YouTube Content into Interactive Learning
          </h1>
          <p className="hero-subtitle">
            Convert any YouTube playlist into comprehensive learning materials with AI-powered summaries, 
            flashcards, mind maps, and quizzes.
          </p>
        </div>
        
        <div className="hero-image">
          <div className="feature-preview">
            <div className="preview-card">
              <h3>📚 Smart Summaries</h3>
              <p>AI-generated summaries for quick understanding</p>
            </div>
            <div className="preview-card">
              <h3>🃏 Flashcards</h3>
              <p>Interactive flashcards for effective memorization</p>
            </div>
            <div className="preview-card">
              <h3>🧠 Mind Maps</h3>
              <p>Visual learning with interactive mind maps</p>
            </div>
            <div className="preview-card">
              <h3>📝 Quizzes</h3>
              <p>Test your knowledge with generated quizzes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 