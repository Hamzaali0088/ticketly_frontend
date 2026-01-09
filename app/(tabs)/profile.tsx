import { EventCard } from '@/components/EventCard';
import { authAPI } from '@/lib/api/auth';
import type { Event } from '@/lib/api/events';
import { eventsAPI } from '@/lib/api/events';
import { useAppStore } from '@/store/useAppStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Image
} from 'react-native';

// Token storage keys (must match client.ts)
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Helper function to convert API event to app event format
const convertEvent = (apiEvent: any) => {
  // Handle both _id and id fields (backend may return either)
  const eventId = apiEvent._id || apiEvent.id || (apiEvent as any)?._id || (apiEvent as any)?.id;

  if (!eventId) {
    console.warn('⚠️ Event missing ID:', apiEvent);
  }

  return {
    id: eventId || '',
    title: apiEvent.title || '',
    description: apiEvent.description || '',
    date: apiEvent.date || '',
    time: apiEvent.time || '',
    venue: apiEvent.location || '',
    city: (apiEvent.location || '').split(',')[0] || apiEvent.location || '',
    category: 'Event',
    image: apiEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    organizerId: apiEvent.createdBy?._id || apiEvent.createdBy?.id || '',
    organizerName: apiEvent.createdBy?.fullName || 'Organizer',
    price: apiEvent.ticketPrice || 0,
    accessType: (apiEvent.ticketPrice || 0) > 0 ? 'paid' as const : 'open' as const,
    registeredUsers: [],
    likedUsers: [],
  };
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const setUser = useAppStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'liked'>('created');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [joinedEventsData, setJoinedEventsData] = useState<any[]>([]); // Store full data with tickets
  const [likedEvents, setLikedEvents] = useState<any[]>([]);
  const hasLoadedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load immediately when user is available
    if (user?._id) {
      // If user ID changed, reset the loaded flag
      if (currentUserIdRef.current !== user._id) {
        currentUserIdRef.current = user._id;
        hasLoadedRef.current = false;
      }

      // Check if user has full event data (objects) or just IDs (strings) or empty arrays
      const createdEventsIsStrings = user.createdEvents && Array.isArray(user.createdEvents) && user.createdEvents.length > 0 && typeof user.createdEvents[0] === 'string';
      const joinedEventsIsStrings = user.joinedEvents && Array.isArray(user.joinedEvents) && user.joinedEvents.length > 0 && typeof user.joinedEvents[0] === 'string';
      const hasFullEventData = user.createdEvents && Array.isArray(user.createdEvents) && user.createdEvents.length > 0 && typeof user.createdEvents[0] === 'object';
      const hasFullJoinedData = user.joinedEvents && Array.isArray(user.joinedEvents) && user.joinedEvents.length > 0 && typeof user.joinedEvents[0] === 'object' && (user.joinedEvents[0] as any).event;

      // Always load profile if:
      // 1. We haven't loaded yet for this user (always load on first mount), OR
      // 2. User has only IDs (strings) instead of full objects, OR
      // 3. User doesn't have full event data (empty arrays or undefined)
      const needsFullData = !hasFullEventData || !hasFullJoinedData || createdEventsIsStrings || joinedEventsIsStrings;

      // Always load on first mount, or if we need full data
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadProfile();
      } else if (needsFullData) {
        // Reload if we don't have full data
        loadProfile();
      }
    }
  }, [user?._id]); // Only depend on user ID, but check data inside effect

  // Refresh profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        // Check if user has full event data (objects) or just IDs (strings) or empty
        const createdEventsIsStrings = user.createdEvents && Array.isArray(user.createdEvents) && user.createdEvents.length > 0 && typeof user.createdEvents[0] === 'string';
        const joinedEventsIsStrings = user.joinedEvents && Array.isArray(user.joinedEvents) && user.joinedEvents.length > 0 && typeof user.joinedEvents[0] === 'string';
        const hasFullEventData = user.createdEvents && Array.isArray(user.createdEvents) && user.createdEvents.length > 0 && typeof user.createdEvents[0] === 'object';
        const hasFullJoinedData = user.joinedEvents && Array.isArray(user.joinedEvents) && user.joinedEvents.length > 0 && typeof user.joinedEvents[0] === 'object' && (user.joinedEvents[0] as any).event;

        // Always load profile if user has only IDs or doesn't have full data
        if (createdEventsIsStrings || joinedEventsIsStrings || !hasFullEventData || !hasFullJoinedData) {
          loadProfile(true);
        }
      }
    }, [user?._id])
  );

  const loadProfile = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await authAPI.getProfile();
      if (response.success && response.user) {
        setUser(response.user);

        // Extract created events from the response
        if (response.user.createdEvents && Array.isArray(response.user.createdEvents) && response.user.createdEvents.length > 0) {
          // Check if it's an array of objects (full events) or strings (IDs)
          const firstItem = response.user.createdEvents[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            // Full event objects - map them directly
            const created = response.user.createdEvents.map((event: any) => convertEvent(event));
            setMyEvents(created);
          } else {
            // Just IDs - load from events API
            await loadMyEvents(false);
          }
        } else {
          // No created events or empty array - try loading from API
          await loadMyEvents(false);
        }

        // Extract joined events and liked events from the response
        if (response.user.joinedEvents && Array.isArray(response.user.joinedEvents) && response.user.joinedEvents.length > 0) {
          // Check if it's an array of objects (full joined events with tickets) or strings (IDs)
          const firstItem = response.user.joinedEvents[0];
          if (typeof firstItem === 'object' && firstItem !== null && firstItem.event) {
            // Full joined event objects with tickets - store them
            setJoinedEventsData(response.user.joinedEvents);

            // Also store converted events for display
            const joined = response.user.joinedEvents.map((item: any) => {
              if (item.event) {
                return convertEvent(item.event);
              }
              return null;
            }).filter(Boolean);
            setJoinedEvents(joined);
          } else {
            // Just IDs - clear for now (will be loaded when user navigates to profile)
            setJoinedEventsData([]);
            setJoinedEvents([]);
          }
        } else {
          setJoinedEventsData([]);
          setJoinedEvents([]);
        }

        if (response.user.likedEvents && Array.isArray(response.user.likedEvents) && response.user.likedEvents.length > 0) {
          // Check if it's an array of objects or strings
          const firstItem = response.user.likedEvents[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            // Full event objects
            const liked = response.user.likedEvents.map((event: any) => convertEvent(event));
            setLikedEvents(liked);
          } else {
            // Just IDs - clear for now
            setLikedEvents([]);
          }
        } else {
          setLikedEvents([]);
        }
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    hasLoadedRef.current = false;
    loadProfile(true);
  };

  const loadMyEvents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await eventsAPI.getMyEvents();
      if (response.success && response.events) {
        const convertedEvents = response.events.map(convertEvent);
        setMyEvents(convertedEvents);
      }
    } catch (error: any) {
      console.error('Failed to load events:', error);
      // Don't show alert if called from loadProfile to avoid double alerts
      if (showLoading) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to load events');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Show login option if user is not authenticated
  if (!user) {
    return (
      <View className="flex-1 bg-[#0F0F0F] pt-[60px]">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 items-center justify-center px-10 pt-[100px]">
            <Text className="text-white text-2xl font-bold mb-4 text-center">Welcome on Ticketly</Text>
            <Text className="text-[#9CA3AF] text-base mb-8 text-center leading-6">
              Login to create events, register for events, and manage your profile
            </Text>
            <TouchableOpacity
              className="bg-[#9333EA] py-4 px-8 rounded-xl"
              onPress={() => router.push('/login')}
            >
              <Text className="text-white text-base font-semibold">Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Use myEvents directly as created events (they're already filtered by the API)
  const createdEvents = myEvents;

  const handleLogout = async () => {
    console.log('🔴 Logout button clicked!');

    // Show confirmation dialog
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          console.log('❌ Logout cancelled by user');
        }
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await performLogout();
        },
      },
    ]);
  };

  const performLogout = async () => {
    console.log('✅ Logout confirmed, starting logout process...');
    try {
      console.log('Step 1: Checking tokens before removal...');
      const accessTokenBefore = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshTokenBefore = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      console.log('Access token exists:', !!accessTokenBefore, accessTokenBefore ? 'Length: ' + accessTokenBefore.length : 'null');
      console.log('Refresh token exists:', !!refreshTokenBefore, refreshTokenBefore ? 'Length: ' + refreshTokenBefore.length : 'null');

      // For web, also clear localStorage directly
      if (typeof window !== 'undefined' && window.localStorage) {
        console.log('Step 1.5: Clearing localStorage directly (web fallback)...');
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        console.log('✅ localStorage cleared directly');
      }

      console.log('Step 2: Removing tokens individually from AsyncStorage...');
      // Step 1: Clear tokens directly using the exact keys
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      ]);
      console.log('✅ Tokens removed individually from AsyncStorage');

      console.log('Step 3: Clearing all AsyncStorage...');
      // Step 2: Clear all AsyncStorage to ensure nothing remains
      await AsyncStorage.clear();
      console.log('✅ All AsyncStorage cleared');

      // Clear localStorage again after AsyncStorage.clear()
      if (typeof window !== 'undefined' && window.localStorage) {
        console.log('Step 3.5: Clearing localStorage again...');
        window.localStorage.clear();
        console.log('✅ localStorage cleared completely');
      }

      console.log('Step 4: Clearing user state in store...');
      // Step 3: Clear user state in store
      await logout();
      console.log('✅ User state cleared');

      console.log('Step 5: Waiting for storage operations to complete...');
      // Step 4: Small delay to ensure storage operations complete
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('Step 6: Verifying tokens are actually cleared...');
      // Step 5: Verify tokens are actually cleared
      const remainingAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const remainingRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      // Also check localStorage
      let localStorageAccessToken = null;
      let localStorageRefreshToken = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorageAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
        localStorageRefreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }

      console.log('AsyncStorage - Access token still exists:', !!remainingAccessToken);
      console.log('AsyncStorage - Refresh token still exists:', !!remainingRefreshToken);
      console.log('localStorage - Access token still exists:', !!localStorageAccessToken);
      console.log('localStorage - Refresh token still exists:', !!localStorageRefreshToken);

      if (remainingAccessToken || remainingRefreshToken || localStorageAccessToken || localStorageRefreshToken) {
        // If tokens still exist, clear again
        console.warn('⚠️ Tokens still exist, clearing again...');
        await AsyncStorage.clear();
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
        console.log('✅ Storage cleared again');
      }

      console.log('Step 7: Redirecting to home page...');
      // Step 6: Redirect to home page
      router.replace('/(tabs)');
      console.log('✅ Logout complete!');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force clear everything even if there's an error
      try {
        console.log('Attempting to clear storage after error...');
        await AsyncStorage.clear();
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
        console.log('✅ Storage cleared after error');
      } catch (clearError) {
        console.error('❌ Error clearing storage:', clearError);
      }
      // Clear state even if storage clear fails
      console.log('Clearing user state after error...');
      await logout();
      console.log('Redirecting to home page after error...');
      router.replace('/(tabs)');
    }
  };

  const renderJoinedEvent = (joinedEventData: any, index: number) => {
    const event = joinedEventData.event;
    const tickets = joinedEventData.tickets || [];

    // Handle both id and _id fields
    const eventId = event?.id || event?._id || (event as any)?._id || (event as any)?.id;

    if (!eventId) {
      console.warn('⚠️ Joined event missing ID:', event);
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return { month, day };
    };

    const { month, day } = formatDate(event.date);

    return (
      <TouchableOpacity
        className="bg-[#1F1F1F] rounded-xl overflow-hidden mb-4"
        onPress={() => {
          if (eventId) {
            console.log('📍 Navigating to joined event details with ID:', eventId);
            router.push(`/event-details/${eventId}`);
          } else {
            console.error('❌ Cannot navigate: event ID is missing');
          }
        }}
        activeOpacity={0.8}
      >
        <View className="w-full h-[180px] relative">
          <Image
            source={{ uri: event.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute top-2 right-2 bg-[#EF4444] rounded-lg py-1.5 px-2.5 items-center min-w-[50px]">
            <Text className="text-white text-[10px] font-semibold uppercase">{month}</Text>
            <Text className="text-white text-base font-bold">{day}</Text>
          </View>
          <View className="absolute top-2 left-2 bg-[#9333EA] rounded-lg py-1.5 px-2.5">
            <Text className="text-white text-xs font-semibold">{tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View className="p-3">
          <Text className="text-white text-base font-semibold mb-2" numberOfLines={2}>
            {event.title}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-xs mr-1">📍</Text>
            <Text className="text-[#9CA3AF] text-xs flex-1" numberOfLines={1}>
              {event.location?.length > 30 ? `${event.location.substring(0, 30)}...` : event.location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEvents = () => {
    if (loading) {
      return (
        <View className="py-10 items-center">
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      );
    }

    if (activeTab === 'joined') {
      if (joinedEventsData.length === 0) {
        return (
          <TouchableOpacity
            className="py-10 items-center"
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text className="text-[#6B7280] text-sm">No events joined yet</Text>
          </TouchableOpacity>
        );
      }

      return (
        <View>
          {joinedEventsData.map((joinedEventData, index) => {
            const event = joinedEventData.event;
            return (
              <View key={event?.id || event?._id || `event-${index}`}>
                {renderJoinedEvent(joinedEventData, index)}
              </View>
            );
          })}
        </View>
      );
    }

    let eventsToShow: any[] = [];
    if (activeTab === 'created') eventsToShow = createdEvents;
    else eventsToShow = likedEvents;

    if (eventsToShow.length === 0) {
      return (
        <TouchableOpacity
          className="py-10 items-center"
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text className="text-[#6B7280] text-sm">
            {activeTab === 'created' && 'No events created yet'}
            {activeTab === 'liked' && 'No events liked yet'}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View className="flex-row flex-wrap justify-between">
        {eventsToShow.map((event) => {
          // Ensure event ID is valid before rendering
          const eventId = event.id || event._id || (event as any)?._id || (event as any)?.id;

          if (!eventId) {
            console.warn('⚠️ Event missing ID, skipping navigation:', event);
            return null;
          }

          return (
            <EventCard
              key={eventId}
              event={event}
              onPress={() => {
                console.log('📍 Navigating to event details with ID:', eventId);
                // Navigate to created event details page for created events
                if (activeTab === 'created') {
                  router.push(`/created-event-details/${eventId}`);
                } else {
                  router.push(`/event-details/${eventId}`);
                }
              }}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F0F0F] pt-[60px]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333EA"
            colors={["#9333EA"]}
          />
        }
      >
        {/* Profile Header */}
        <View className="flex-row justify-end items-center px-5 pt-5 pb-2">
          <TouchableOpacity
            className="bg-[#1F1F1F] w-10 h-10 rounded-lg items-center justify-center"
            onPress={() => router.push('/settings')}
          >
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Section - Centered */}
        <View className="items-center py-6 pb-8">
          <View className="w-[100px] h-[100px] rounded-full bg-[#9333EA] items-center justify-center mb-4">
            <Text className="text-white text-4xl font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">{user.fullName}</Text>
          {user.companyName && (
            <Text className="text-[#9333EA] text-base font-semibold mt-1">{user.companyName}</Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row justify-around px-5 pb-6">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold mb-1">{createdEvents.length}</Text>
            <Text className="text-[#9CA3AF] text-xs">Created</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold mb-1">{joinedEventsData.length}</Text>
            <Text className="text-[#9CA3AF] text-xs">Joined</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold mb-1">{likedEvents.length}</Text>
            <Text className="text-[#9CA3AF] text-xs">Liked</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row px-5 mb-5 gap-2">
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'created' ? 'bg-[#9333EA]' : 'bg-[#1F1F1F]'}`}
            onPress={() => setActiveTab('created')}
          >
            <Text className={`text-xs font-semibold ${activeTab === 'created' ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Created Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'joined' ? 'bg-[#9333EA]' : 'bg-[#1F1F1F]'}`}
            onPress={() => setActiveTab('joined')}
          >
            <Text className={`text-xs font-semibold ${activeTab === 'joined' ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Joined Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'liked' ? 'bg-[#9333EA]' : 'bg-[#1F1F1F]'}`}
            onPress={() => setActiveTab('liked')}
          >
            <Text className={`text-xs font-semibold ${activeTab === 'liked' ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Liked Events
            </Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View className="px-5 mb-8">{renderEvents()}</View>

        {/* Logout */}
        <View className="px-5">
          <TouchableOpacity
            className="bg-[#EF4444] py-4 rounded-xl items-center mt-2"
            onPress={() => {
              console.log('🔴🔴🔴 Logout TouchableOpacity onPress triggered!');
              handleLogout();
            }}
            activeOpacity={0.7}
          >
            <Text className="text-white text-base font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}


