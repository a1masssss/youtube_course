import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper function to create API client with Clerk token
export const createClerkApiClient = (getToken) => {
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000,
  });

  // Request interceptor to add Clerk token
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        // Get token without template first, as backend integration template might not be configured
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🔑 Adding Clerk token to request:', config.url);
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Unauthorized request:', error.response.data);
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// API Endpoints
export const API_ENDPOINTS = {
  // Course endpoints
  PLAYLISTS: `playlists/`,
  VIDEOS: `videos/`,
  MY_COURSES: `my-courses/`,
  DELETE_COURSE: (playlistId) => `my-courses/${playlistId}/delete/`,
  SUMMARY_CHATBOT: `summary-chatbot/`,
  FLASHCARDS: `flashcards/`,
  MINDMAP: `mindmap/`,
  QUIZ: `quiz/`,
  QUIZ_SUBMIT: `quiz/submit/`,
  QUIZ_EXPLAIN: `quiz/explain/`,
  
  // Helper functions
  getPlaylist: (playlistUuid) => `playlists/${playlistUuid}/`,
  getPlaylistVideosList: (playlistUuid) => `playlists/${playlistUuid}/videos/`,
  video: (videoUuid) => `videos/${videoUuid}/`,
};

export default API_BASE_URL; 