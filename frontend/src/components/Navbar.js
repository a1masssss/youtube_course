import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Project Info Section */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <span className="icon">🎓</span>
          </div>
          <div className="brand-info">
            <h1 className="brand-title">Course Summarizer</h1>
            <p className="brand-subtitle">AI-Powered YouTube Learning</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/my-courses" 
            className={`nav-link ${isActive('/my-courses') ? 'active' : ''}`}
          >
            My Courses
          </Link>
          <span className="nav-link disabled">Explore</span>
          <span className="nav-link disabled">Creators</span>
        </div>

        {/* Right Section - Skip Profile and Theme */}
        <div className="navbar-actions">
          <span className="nav-action disabled">A</span>
          <span className="nav-action disabled">🌙</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 