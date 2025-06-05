import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import PlaylistPage from './components/PlaylistPage';
import VideoPage from './components/VideoPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>YouTube Playlist Viewer</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:playlistId" element={<PlaylistPage />} />
            <Route path="/:playlistId/:videoId" element={<VideoPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
