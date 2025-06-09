import React from 'react';
import './GoogleLoginButton.css';

const GoogleLoginButton = ({ text = "Continue with Google" }) => {
  const handleGoogleLogin = () => {
    // Redirect to Django backend Google OAuth endpoint (directly to Google)
    const backendUrl = process.env.REACT_APP_API_BASE_URL?.replace('/api', '');
    window.location.href = `${backendUrl}/accounts/google/login/`;
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      className="google-login-button"
      type="button"
    >
      <div className="google-login-content">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="google-icon"
        >
          <path 
            d="M37.9766 16.4093H36.4998V16.3332H19.9998V23.6665H30.3609C28.8493 27.9354 24.7876 30.9998 19.9998 30.9998C13.9251 30.9998 8.99984 26.0746 8.99984 19.9998C8.99984 13.9251 13.9251 8.99984 19.9998 8.99984C22.8039 8.99984 25.355 10.0577 27.2974 11.7856L32.483 6.6C29.2087 3.54842 24.8288 1.6665 19.9998 1.6665C9.87526 1.6665 1.6665 9.87525 1.6665 19.9998C1.6665 30.1244 9.87526 38.3332 19.9998 38.3332C30.1244 38.3332 38.3332 30.1244 38.3332 19.9998C38.3332 18.7706 38.2067 17.5707 37.9766 16.4093Z" 
            fill="#FFC107"
          />
          <path 
            d="M3.78076 11.4666L9.80418 15.884C11.434 11.8488 15.3812 8.99984 20.0003 8.99984C22.8043 8.99984 25.3554 10.0577 27.2978 11.7856L32.4834 6.60001C29.2091 3.54842 24.8293 1.6665 20.0003 1.6665C12.9584 1.6665 6.85159 5.64209 3.78076 11.4666Z" 
            fill="#FF3D00"
          />
          <path 
            d="M20 38.3337C24.7355 38.3337 29.0383 36.5215 32.2915 33.5744L26.6174 28.7729C24.7149 30.2197 22.3901 31.0023 20 31.0004C15.2315 31.0004 11.1825 27.9598 9.65721 23.7166L3.67871 28.3228C6.71288 34.2601 12.8747 38.3337 20 38.3337Z" 
            fill="#4CAF50"
          />
          <path 
            d="M37.9768 16.4093H36.5V16.3333H20V23.6666H30.3611C29.638 25.6983 28.3356 27.4737 26.6147 28.7733L26.6174 28.7715L32.2916 33.573C31.8901 33.9378 38.3333 29.1666 38.3333 19.9999C38.3333 18.7707 38.2068 17.5708 37.9768 16.4093Z" 
            fill="#1976D2"
          />
        </svg>
        <span className="google-text">{text}</span>
      </div>
    </button>
  );
};

export default GoogleLoginButton; 