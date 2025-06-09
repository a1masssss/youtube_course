import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log('Environment variable REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('Using API_BASE_URL:', API_BASE_URL);

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for long-running operations like playlist processing
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Endpoints
export const API_ENDPOINTS = {
  // Course endpoints
  PLAYLISTS: `/playlists/`,
  VIDEOS: `/videos/`,
  MY_COURSES: `/my-courses/`,
  SUMMARY_CHATBOT: `/summary-chatbot/`,
  FLASHCARDS: `/flashcards/`,
  
  // Authentication endpoints
  AUTH: {
    LOGIN: `/auth/login/`,
    REGISTER: `/auth/register/`,
    LOGOUT: `/auth/logout/`,
    REFRESH: `/auth/refresh/`,
    PROFILE: `/auth/profile/`,
  },

  // Helper functions
  getPlaylist: (playlistUuid) => `/playlists/${playlistUuid}/`,
  video: (videoUuid) => `/videos/${videoUuid}/`,
};

console.log('API_ENDPOINTS:', API_ENDPOINTS);

// Helper functions (for backward compatibility)
export const getPlaylistUrl = (playlistUuid) => `${API_ENDPOINTS.PLAYLISTS}${playlistUuid}/`;
export const getVideoUrl = (videoUuid) => `${API_ENDPOINTS.VIDEOS}${videoUuid}/`;

export default API_BASE_URL; 