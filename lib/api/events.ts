import apiClient from './client';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';

export interface Event {
  _id: string;
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
  status?: 'pending' | 'approved';
  createdBy?: {
    _id: string;
    fullName: string;
    username?: string;
    email: string;
    phone?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventRequest {
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
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  image?: string;
  email?: string;
  phone?: string;
  ticketPrice?: number;
  totalTickets?: number;
}

export interface EventsResponse {
  success: boolean;
  count: number;
  events: Event[];
}

export interface EventResponse {
  success: boolean;
  event: Event;
}

export interface CreateEventResponse {
  success: boolean;
  message: string;
  event: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
  };
}

// Event API functions
export const eventsAPI = {
  // Get All Approved Events (Public)
  getApprovedEvents: async (): Promise<EventsResponse> => {
    const response = await apiClient.get('/events');
    return response.data;
  },

  // Create Event
  createEvent: async (data: CreateEventRequest): Promise<CreateEventResponse> => {
    const response = await apiClient.post('/events', data);
    return response.data;
  },

  // Get My Events
  getMyEvents: async (): Promise<EventsResponse> => {
    const response = await apiClient.get('/events/my');
    return response.data;
  },

  // Get Event By ID
  getEventById: async (id: string): Promise<EventResponse> => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  // Update Event
  updateEvent: async (id: string, data: UpdateEventRequest): Promise<EventResponse> => {
    const response = await apiClient.put(`/events/${id}`, data);
    return response.data;
  },

  // Delete Event
  deleteEvent: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  },

  // Get Tickets By Event ID (Organizer only)
  getTicketsByEventId: async (eventId: string): Promise<{ success: boolean; count: number; tickets: any[] }> => {
    const response = await apiClient.get(`/events/${eventId}/tickets`);
    return response.data;
  },

  // Upload Event Image
  uploadEventImage: async (imageUri: string): Promise<{ success: boolean; message: string; imageUrl: string }> => {
    // Platform detection: Use Platform.OS as the primary check
    // React Native polyfills provide window/File/Blob, so we can't rely on those
    // Only use web path when Platform.OS is explicitly 'web'
    const isWeb = Platform.OS === 'web';
    
    // Create FormData for multipart/form-data upload
    // In web, use native browser FormData (window.FormData); in React Native, use React Native's FormData
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
    
    console.log('Uploading image - Platform detection:', { 
      imageUri, 
      filename, 
      type, 
      PlatformOS: Platform.OS,
      isWeb,
      uriType: imageUri.substring(0, 20),
      formDataType: formData.constructor.name
    });
    
    if (isWeb) {
      console.log('Using WEB upload path');
      // Web browser environment
      try {
        let blob: Blob;
        
        // Helper function to convert response to blob (works across different environments)
        const responseToBlob = async (response: Response): Promise<Blob> => {
          // Try blob() first (standard browser API)
          if (typeof response.blob === 'function') {
            return await response.blob();
          }
          // Fallback: use arrayBuffer() and create Blob manually
          if (typeof response.arrayBuffer === 'function') {
            const arrayBuffer = await response.arrayBuffer();
            return new Blob([arrayBuffer], { type: response.headers.get('content-type') || type });
          }
          // Last resort: try to get text and convert (not ideal but works)
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
          // Data URL - convert directly to blob without fetch
          blob = dataURLToBlob(imageUri);
        } else if (imageUri.startsWith('blob:')) {
          // Blob URL - fetch it
          const response = await fetch(imageUri);
          blob = await responseToBlob(response);
        } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          // HTTP URL - fetch it
          const response = await fetch(imageUri);
          blob = await responseToBlob(response);
        } else {
          // Try to fetch anyway (might be a relative path or file://)
          const response = await fetch(imageUri);
          blob = await responseToBlob(response);
        }
        
        // Create a File object from the blob
        const file = new File([blob], filename, { type: blob.type || type });
        formData.append('image', file);
        
        console.log('FormData prepared for web:', { 
          hasFile: file instanceof File, 
          fileName: file.name, 
          fileType: file.type,
          fileSize: file.size 
        });
      } catch (error) {
        console.error('Error processing image for web upload:', error);
        throw new Error('Failed to process image for upload: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      console.log('📱 Using REACT NATIVE upload path');
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
        name: filename 
      });
    }
    
    // Final check before sending
    console.log('Final FormData check:', {
      isFormData: formData instanceof FormData,
      formDataKeys: formData.constructor.name
    });

    // Make request with multipart/form-data
    // DO NOT set Content-Type header manually - axios will set it with boundary
    console.log('📤 Sending upload request to:', '/events/upload-image');
    console.log('📤 Request URL will be:', API_BASE_URL + '/events/upload-image');
    try {
      const response = await apiClient.post('/events/upload-image', formData, {
        timeout: 60000, // 60 seconds timeout for file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Let axios handle Content-Type automatically for FormData
        headers: {
          // Explicitly remove any Content-Type to let axios set it with boundary
        },
      });
      console.log('✅ Upload response received:', {
        success: response.data?.success,
        message: response.data?.message,
        imageUrl: response.data?.imageUrl
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload request failed:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
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

