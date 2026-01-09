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
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    fullName: string;
    username?: string;
    email: string;
    authProvider?: string;
    role?: string;
    isVerified?: boolean;
    createdEvents?: string[];
    joinedEvents?: string[];
    likedEvents?: string[];
    createdAt?: string;
    updatedAt?: string;
  };
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

export interface JoinedEvent {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image?: string;
    email: string;
    phone: string;
    ticketPrice: number;
    totalTickets: number;
    status: string;
    createdBy?: {
      _id: string;
      fullName: string;
      username?: string;
      email: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  tickets: Array<{
    id: string;
    eventId: string;
    username: string;
    email: string;
    phone: string;
    status: string;
    accessKey?: string;
    qrCodeUrl?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface UserProfile {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  companyName?: string;
  role?: string;
  createdEvents?: any[];
  joinedEvents?: string[] | JoinedEvent[]; // Can be IDs (from login) or full objects (from profile)
  likedEvents?: any[];
  createdAt?: string;
  updatedAt?: string;
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

