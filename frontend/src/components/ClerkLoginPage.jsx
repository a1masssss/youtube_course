import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const ClerkLoginPage = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <SignIn 
        redirectUrl="/"
        signUpUrl="/signup"
      />
    </div>
  );
};

export default ClerkLoginPage; 