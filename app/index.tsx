import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { getAccessToken, getRefreshToken } from '@/lib/api/client';
import { authAPI } from '@/lib/api/auth';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const login = useAppStore((state) => state.login);

  useEffect(() => {
    // Silently check authentication in the background
    // Don't block the app from showing - always show home page
    const checkAuthSilently = async () => {
      try {
        const accessToken = await getAccessToken();
        
        if (accessToken) {
          // Try to get user profile to verify token is valid
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.user) {
              // User is authenticated, silently login
              login(response.user);
              return;
            }
          } catch (error: any) {
            // Handle network errors gracefully
            if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.message?.includes('Network')) {
              console.log('Network error - backend may not be accessible');
              // Don't try to refresh if network is down
              return;
            }
            
            // If access token is expired, try refresh token
            if (error.response?.status === 401) {
              const refreshToken = await getRefreshToken();
              if (refreshToken) {
                try {
                  const refreshResponse = await authAPI.refreshToken(refreshToken);
                  if (refreshResponse.success) {
                    // Get profile with new token
                    const profileResponse = await authAPI.getProfile();
                    if (profileResponse.success && profileResponse.user) {
                      // Silently login user
                      login(profileResponse.user);
                    }
                  }
                } catch (refreshError) {
                  // Refresh failed, user will need to login when they try to access protected features
                  console.log('Token refresh failed');
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Silently fail - don't block the app
      }
    };

    checkAuthSilently();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Always redirect to home page (tabs) - don't show login page
  return <Redirect href="/(tabs)" />;
}

