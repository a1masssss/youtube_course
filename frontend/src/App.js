import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import MyCoursesPage from './components/MyCoursesPage';
import PlaylistPage from './components/PlaylistPage';
import VideoPage from './components/VideoPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/:playlistId" element={<PlaylistPage />} />
            <Route path="/:playlistId/:videoId" element={<VideoPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
