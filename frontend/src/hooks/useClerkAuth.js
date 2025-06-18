import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [clerkToken, setClerkToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const token = await getToken();
          setClerkToken(token);
        } catch (error) {
          console.error('Error getting Clerk token:', error);
        }
      }
      setLoading(false);
    };

    fetchToken();
  }, [isSignedIn, isLoaded, getToken]);

  // Function to get fresh token for API calls
  const getAuthHeaders = async () => {
    if (!isSignedIn) return {};
    
    try {
      const token = await getToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {};
    }
  };

  return {
    clerkToken,
    isSignedIn,
    isLoaded,
    loading,
    getAuthHeaders,
  };
}; 