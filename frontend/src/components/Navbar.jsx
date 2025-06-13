import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };



  // Don't show navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Project Info Section */}
        <div className="navbar-brand">
          <div className="brand-info">
            <Link to="/landing" className="brand-link">
              <h1 className="brand-title">Coursiva</h1>
            </Link>
          </div>
        </div>

        {/* Navigation Links - Only show for authenticated users */}
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

        {/* Authentication Section */}
        <div className="navbar-auth">
          {loading ? (
            <div className="auth-loading">Loading...</div>
          ) : isAuthenticated ? (
            <div className="auth-user">
              <span className="user-greeting">
                Hello, {user?.first_name || user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
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