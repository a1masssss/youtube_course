import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import MyCoursesPage from './components/MyCoursesPage';
import ClerkLoginPage from './components/ClerkLoginPage';
import ClerkSignupPage from './components/ClerkSignupPage';
import LandingPage from './components/LandingPage';
import ClerkDebug from './components/ClerkDebug';
import TestRegistration from './components/TestRegistration';
import AuthenticationTest from './components/AuthenticationTest';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Simple component to handle root route - always show LandingPage
const RootRoute = () => {
  return <LandingPage />;
};

// Protected route component for Clerk
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <ClerkLoginPage />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<ClerkLoginPage />} />
            <Route path="/signup" element={<ClerkSignupPage />} />
            <Route path="/debug" element={<ClerkDebug />} />
            <Route path="/test-registration" element={<TestRegistration />} />
            <Route path="/auth-test" element={<AuthenticationTest />} />
            <Route 
              path="/create" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-courses" 
              element={
                <ProtectedRoute>
                  <MyCoursesPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
