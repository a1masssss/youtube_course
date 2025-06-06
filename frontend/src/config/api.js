// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log(API_BASE_URL);


// API Endpoints
export const API_ENDPOINTS = {
  PLAYLISTS: `${API_BASE_URL}/playlists/`,
  VIDEOS: `${API_BASE_URL}/videos/`,
  MY_COURSES: `${API_BASE_URL}/my-courses/`,
};

// Helper functions
export const getPlaylistUrl = (playlistId) => `${API_ENDPOINTS.PLAYLISTS}${playlistId}/`;
export const getVideoUrl = (videoId) => `${API_ENDPOINTS.VIDEOS}${videoId}/`;

export default API_ENDPOINTS; 