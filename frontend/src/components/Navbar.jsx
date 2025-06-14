import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't show navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left side: Logo */}
        <div className="navbar-left">
          {/* Logo/Project Info Section */}
          <div className="navbar-brand">
            <div className="brand-info">
              <Link to="/landing" className="brand-link">
                <h1 className="brand-title">Coursiva</h1>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side: Navigation + Authentication Section */}
        <div className="navbar-auth">
          {/* Navigation Links for Authenticated Users */}
          {isAuthenticated && (
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
            </div>
          )}

          {loading ? (
            <div className="auth-loading"></div>
          ) : isAuthenticated ? (
            <div className="auth-user" ref={dropdownRef}>
              <div 
                className="user-avatar-section"
                onClick={toggleDropdown}
              >
                <div className="user-avatar">
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt="User Avatar" 
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-letter">
                      {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <span className="user-name">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.first_name || user?.email
                      }
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-link">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 