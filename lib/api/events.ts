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
    
    // Extract filename from URI
    // React Native URIs can be file:// or content://, so we need to handle both
    let filename = imageUri.split('/').pop() || 'image.jpg';
    // Remove query parameters if any
    filename = filename.split('?')[0];
    
    // Determine MIME type from file extension
    let type = 'image/jpeg'; // default
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'png') type = 'image/png';
    else if (ext === 'gif') type = 'image/gif';
    else if (ext === 'webp') type = 'image/webp';
    else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
    
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
      console.log('Using REACT NATIVE upload path');
      // React Native environment
      // Append file to FormData using object format
      // The field name 'image' must match the multer field name in the backend
      formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);
      
      console.log('FormData prepared for React Native:', { 
        uri: imageUri, 
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
    // The Content-Type header will be automatically set by axios with the boundary
    console.log('Sending upload request to /events/upload-image');
    console.log('Request URL will be:', API_BASE_URL + '/events/upload-image');
    try {
      const response = await apiClient.post('/events/upload-image', formData, {
        timeout: 60000, // 60 seconds timeout for file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
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
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  },
};

