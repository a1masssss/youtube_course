import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');
        const fromDjango = urlParams.get('from_django');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (accessToken && refreshToken) {
          // Store tokens
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);

          // Fetch user profile and update auth context
          const backendUrl = process.env.REACT_APP_API_BASE_URL;
          const response = await fetch(`${backendUrl}/auth/profile/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            loginWithTokens(userData, accessToken, refreshToken);
            navigate('/');
          } else {
            throw new Error('Failed to fetch user data');
          }
        } else if (fromDjango) {
          // Try to get tokens from Django session
          const backendUrl = process.env.REACT_APP_API_BASE_URL;
          const response = await fetch(`${backendUrl}/auth/callback/`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            loginWithTokens(data.user, data.access_token, data.refresh_token);
            navigate('/');
          } else {
            throw new Error('Failed to get tokens from session');
          }
        } else {
          // If no tokens in URL, try to get them from Django session directly
          console.log('No tokens in URL, trying to get from Django session...');
          const backendUrl = process.env.REACT_APP_API_BASE_URL;
          const response = await fetch(`${backendUrl}/auth/callback/`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            loginWithTokens(data.user, data.access_token, data.refresh_token);
            navigate('/');
          } else {
            throw new Error('No tokens received and failed to get from session');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [navigate, loginWithTokens]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div className="spinner"></div>
      <p>Completing sign in...</p>
    </div>
  );
};

export default OAuthCallback; 