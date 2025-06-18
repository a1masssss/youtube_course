import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const ClerkSignupPage = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <SignUp 
        redirectUrl="/"
        signInUrl="/login"
      />
    </div>
  );
};

export default ClerkSignupPage; 