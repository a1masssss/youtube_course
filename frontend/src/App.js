import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import MyCoursesPage from './components/MyCoursesPage';
import PlaylistPage from './components/PlaylistPage';
import VideoPage from './components/VideoPage';
import CoursivaBrandPage from './components/CoursivaBrandPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import LandingPage from './components/LandingPage';
import OAuthCallback from './components/OAuthCallback';
import { useAuth } from './context/AuthContext';
import './App.css';

// Component to handle root route based on authentication
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <HomePage /> : <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/my-courses" element={
                <ProtectedRoute>
                  <MyCoursesPage />
                </ProtectedRoute>
              } />
              <Route path="/coursiva-brand" element={<CoursivaBrandPage />} />
              <Route path="/:playlistUuid" element={
                <ProtectedRoute>
                  <PlaylistPage />
                </ProtectedRoute>
              } />
              <Route path="/:playlistUuid/:videoUuid" element={
                <ProtectedRoute>
                  <VideoPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
