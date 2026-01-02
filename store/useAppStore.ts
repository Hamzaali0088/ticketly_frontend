// Zustand store for app state management
import { create } from 'zustand';
import { User, Event } from '@/data/mockData';
import { mockUser, mockEvents } from '@/data/mockData';

interface AppState {
  user: User | null;
  events: Event[];
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setEvents: (events: Event[]) => void;
  toggleEventLike: (eventId: string, userId: string) => void;
  registerForEvent: (eventId: string, userId: string) => void;
  unregisterFromEvent: (eventId: string, userId: string) => void;
  addEvent: (event: Event) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  events: mockEvents,
  isAuthenticated: false,
  
  setUser: (user) => set({ user }),
  
  setEvents: (events) => set({ events }),
  
  toggleEventLike: (eventId, userId) => set((state) => ({
    events: state.events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            likedUsers: event.likedUsers.includes(userId)
              ? event.likedUsers.filter((id) => id !== userId)
              : [...event.likedUsers, userId],
          }
        : event
    ),
  })),
  
  registerForEvent: (eventId, userId) => set((state) => ({
    events: state.events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            registeredUsers: event.registeredUsers.includes(userId)
              ? event.registeredUsers
              : [...event.registeredUsers, userId],
          }
        : event
    ),
  })),
  
  unregisterFromEvent: (eventId, userId) => set((state) => ({
    events: state.events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            registeredUsers: event.registeredUsers.filter((id) => id !== userId),
          }
        : event
    ),
  })),
  
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events],
  })),
  
  login: (user) => set({ user, isAuthenticated: true }),
  
  logout: () => set({ user: null, isAuthenticated: false }),
}));

