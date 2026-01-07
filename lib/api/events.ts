import apiClient from './client';

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
};

