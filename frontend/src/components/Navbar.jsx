import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useClerk, SignInButton, SignUpButton } from '@clerk/clerk-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await signOut();
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left side: Logo */}
        <div className="navbar-left">
          {/* Logo/Project Info Section */}
          <div className="navbar-brand">
            <div className="brand-info">
              <Link to="/" className="brand-link">
                <h1 className="brand-title">Coursiva</h1>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side: Navigation + Authentication Section */}
        <div className="navbar-auth">
          {/* Navigation Links for Authenticated Users */}
          {isSignedIn && (
            <div className="navbar-nav">
              <Link 
                to="/create" 
                className={`nav-link ${isActive('/create') ? 'active' : ''}`}
              >
                Create Course
              </Link>
              <Link 
                to="/my-courses" 
                className={`nav-link ${isActive('/my-courses') ? 'active' : ''}`}
              >
                My Courses
              </Link>
            </div>
          )}

          {!isLoaded ? (
            <div className="auth-loading">Loading...</div>
          ) : isSignedIn ? (
            <div className="auth-user" ref={dropdownRef}>
              <div 
                className="user-avatar-section"
                onClick={toggleDropdown}
              >
                <div className="user-avatar">
                  <div className="avatar-letter">
                    {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()}
                  </div>
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
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.firstName || user?.emailAddresses?.[0]?.emailAddress
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
              <SignInButton mode="modal">
                <button className="nav-link auth-btn">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="nav-link auth-btn primary">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 