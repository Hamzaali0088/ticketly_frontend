import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        return Promise.reject(error);
      }

      try {
        // Call refresh token API
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Save new tokens
        await AsyncStorage.multiSet([
          [ACCESS_TOKEN_KEY, newAccessToken],
          [REFRESH_TOKEN_KEY, newRefreshToken],
        ]);

        // Update the original request header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions to manage tokens
export const setTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
};

export const clearTokens = async () => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
};

export const getAccessToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export default apiClient;

