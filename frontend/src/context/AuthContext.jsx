import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { apiClient, API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileFetchingRef = useRef(false);
  const initialCheckDone = useRef(false);

  const fetchUserProfile = useCallback(async () => {
    if (profileFetchingRef.current) {
      console.log('Profile fetch already in progress, skipping...');
      return;
    }
    
    profileFetchingRef.current = true;
    console.log('Fetching user profile...');
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
      setUser(response.data);
      console.log('User profile fetched successfully');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Token might be expired, remove it
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
      profileFetchingRef.current = false;
    }
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initialization attempts
      if (initialCheckDone.current) return;
      initialCheckDone.current = true;

      const token = localStorage.getItem('access_token');
      if (token) {
        // Verify token and get user info
        await fetchUserProfile();
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUserProfile]); // Added fetchUserProfile to dependencies since it's now memoized

  const login = useCallback(async (email, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const { tokens, user: userData } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      
      // Set user data
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }, []);

  const loginWithTokens = useCallback((userData, accessToken, refreshToken) => {
    // Store tokens
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Set user data
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and user state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refresh,
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      
      return access;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  }, [logout]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (token && !profileFetchingRef.current && !user) {
      await fetchUserProfile();
    } else if (!token) {
      setLoading(false);
    }
  }, [user, fetchUserProfile]);

  const value = {
    user,
    login,
    loginWithTokens,
    logout,
    refreshToken,
    fetchUserProfile,
    checkAuth,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 