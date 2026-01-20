import apiClient from './client';
import { setTokens, clearTokens } from './client';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';

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
  profileImage?: string | null;
  profileImageUrl?: string | null;
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

  // Upload Profile Image
  uploadProfileImage: async (imageUri: string): Promise<{ success: boolean; message: string; profileImage: string; profileImageUrl?: string; user?: UserProfile }> => {
    // Platform detection: Use Platform.OS as the primary check
    const isWeb = Platform.OS === 'web';
    
    // Create FormData for multipart/form-data upload
    const FormDataConstructor = (isWeb && typeof window !== 'undefined' && (window as any).FormData) 
      ? (window as any).FormData 
      : FormData;
    const formData = new FormDataConstructor();
    
    // Extract filename and MIME type from URI
    // CRITICAL: React Native URIs can be file:// or content://
    // content:// URIs don't have filenames, so we need a fallback
    let filename = 'image.jpg'; // default
    let type = 'image/jpeg'; // default
    
    // Try to extract filename from URI
    if (imageUri.includes('/')) {
      const uriParts = imageUri.split('/');
      const lastPart = uriParts[uriParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart.split('?')[0]; // Remove query params
      }
    }
    
    // Determine MIME type from file extension
    // This is a fallback - ideally use type from expo-image-picker asset
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'png') type = 'image/png';
    else if (ext === 'gif') type = 'image/gif';
    else if (ext === 'webp') type = 'image/webp';
    else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
    
    // For content:// URIs on Android, generate a proper filename
    if (imageUri.startsWith('content://')) {
      filename = `image_${Date.now()}.${ext || 'jpg'}`;
    }
    
    if (isWeb) {
      // Web browser environment
      try {
        let blob: Blob;
        
        // Helper function to convert response to blob
        const responseToBlob = async (response: Response): Promise<Blob> => {
          if (typeof response.blob === 'function') {
            return await response.blob();
          }
          if (typeof response.arrayBuffer === 'function') {
            const arrayBuffer = await response.arrayBuffer();
            return new Blob([arrayBuffer], { type: response.headers.get('content-type') || type });
          }
          const text = await response.text();
          return new Blob([text], { type: response.headers.get('content-type') || type });
        };
        
        // Helper function to convert data URL to blob
        const dataURLToBlob = (dataURL: string): Blob => {
          const arr = dataURL.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : type;
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };
        
        // Handle different URI types
        if (imageUri.startsWith('data:')) {
          blob = dataURLToBlob(imageUri);
        } else if (imageUri.startsWith('blob:')) {
          const response = await fetch(imageUri);
          blob = await responseToBlob(response);
        } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          const response = await fetch(imageUri);
          blob = await responseToBlob(response);
        } else {
          const response = await fetch(imageUri);
          blob = await responseToBlob(response);
        }
        
        // Create a File object from the blob
        const file = new File([blob], filename, { type: blob.type || type });
        formData.append('image', file);
      } catch (error) {
        console.error('Error processing image for web upload:', error);
        throw new Error('Failed to process image for upload: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      // React Native environment
      // CRITICAL: FormData structure for React Native must use this exact format
      // The field name 'image' must match Multer's field name in backend
      // uri must be a valid file:// or content:// URI from expo-image-picker
      formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);
      
      console.log('📱 React Native FormData prepared:', {
        fieldName: 'image',
        uri: imageUri.substring(0, 50) + '...',
        type,
        name: filename,
      });
    }

    // Make request with multipart/form-data
    // DO NOT set Content-Type header manually - axios will set it with boundary
    try {
      console.log('📤 Sending upload request to:', '/auth/upload-profile-image');
      const response = await apiClient.post('/auth/upload-profile-image', formData, {
        timeout: 60000, // 60 seconds timeout for file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Let axios handle Content-Type automatically for FormData
        headers: {
          // Explicitly remove any Content-Type to let axios set it with boundary
        },
      });
      
      console.log('✅ Upload successful:', {
        success: response.data?.success,
        profileImage: response.data?.profileImage,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload failed:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
      });
      
      // Provide user-friendly error messages
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and ensure the backend server is running.');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid image file. Please try a different image.');
      }
      if (error.response?.status === 413) {
        throw new Error('Image file is too large. Maximum size is 5MB.');
      }
      
      throw error;
    }
  },
};

