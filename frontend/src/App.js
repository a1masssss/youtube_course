import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import MyCoursesPage from './components/MyCoursesPage';
import VideoPage from './components/VideoPage';
import PlaylistPage from './components/PlaylistPage';
import FlashCardsPage from './components/FlashCardsPage';
import MindMap from './components/MindMap';
import QuizPage from './components/QuizPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
          <Route path="/playlist/:uuid" element={<ProtectedRoute><PlaylistPage /></ProtectedRoute>} />
          <Route path="/video/:uuid" element={<ProtectedRoute><VideoPage /></ProtectedRoute>} />
          <Route path="/flashcards/:uuid" element={<ProtectedRoute><FlashCardsPage /></ProtectedRoute>} />
          <Route path="/mindmap/:uuid" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
          <Route path="/quiz/:uuid" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/:playlistUuid/:videoUuid" element={<ProtectedRoute><VideoPage /></ProtectedRoute>} />
          <Route path="/:uuid" element={<ProtectedRoute><PlaylistPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}
export default App; 