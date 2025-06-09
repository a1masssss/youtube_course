import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserProfile } = useAuth();
  const hasProcessed = useRef(false);

  const handleOAuthCallback = useCallback(async () => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }
    
    hasProcessed.current = true;
    
    try {
      // Check for error in URL params first
      const urlParams = new URLSearchParams(location.search);
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      // Call API to get JWT tokens (user should be authenticated via session)
      const response = await fetch('http://localhost:8001/api/auth/callback/', {
        method: 'GET',
        credentials: 'include', // Include cookies for session auth
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store JWT tokens
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);

        // Fetch user profile to update auth context
        await fetchUserProfile();

        // Redirect to home page
        navigate('/', { replace: true });
      } else {
        console.error('Failed to get tokens from API');
        navigate('/login?error=oauth_failed');
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      navigate('/login?error=oauth_failed');
    }
  }, [location.search, navigate, fetchUserProfile]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ color: '#667eea', fontSize: '16px' }}>
        Completing sign in...
      </p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback; 