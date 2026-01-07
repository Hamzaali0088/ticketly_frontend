import apiClient from './client';
import { setTokens, clearTokens } from './client';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  otpRequired?: boolean;
  tempToken?: string;
}

export interface VerifyOtpRequest {
  otp: string;
  tempToken: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    username?: string;
    phone?: string;
    companyName?: string;
    role?: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  companyName?: string;
  role?: string;
  createdAt?: string;
}

// Auth API functions
export const authAPI = {
  // Signup
  signup: async (data: SignupRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  // Login (Step 1 - Send OTP)
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Verify OTP (Step 2 - Complete Login)
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post('/auth/verify-otp', data);
    const result = response.data;
    
    // Save tokens after successful verification
    if (result.accessToken && result.refreshToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }
    
    return result;
  },

  // Refresh Access Token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    const result = response.data;
    
    // Save new tokens
    if (result.accessToken && result.refreshToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }
    
    return result;
  },

  // Get User Profile
  getProfile: async (): Promise<{ success: boolean; user: UserProfile }> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Update User (Self Update)
  updateUser: async (data: { name?: string; email?: string; password?: string }): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
    const response = await apiClient.put('/auth/update', data);
    return response.data;
  },

  // Delete User
  deleteUser: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete('/auth/delete');
    await clearTokens();
    return response.data;
  },
};

