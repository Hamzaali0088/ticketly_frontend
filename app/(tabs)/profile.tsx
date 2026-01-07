import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/useAppStore';
import { EventCard } from '@/components/EventCard';
import { authAPI } from '@/lib/api/auth';
import { eventsAPI } from '@/lib/api/events';
import type { Event } from '@/lib/api/events';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Token storage keys (must match client.ts)
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Helper function to convert API event to app event format
const convertEvent = (apiEvent: Event) => ({
  id: apiEvent._id,
  title: apiEvent.title,
  description: apiEvent.description,
  date: apiEvent.date,
  time: apiEvent.time,
  venue: apiEvent.location,
  city: apiEvent.location.split(',')[0] || apiEvent.location,
  category: 'Event',
  image: apiEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
  organizerId: apiEvent.createdBy?._id || '',
  organizerName: apiEvent.createdBy?.fullName || 'Organizer',
  price: apiEvent.ticketPrice,
  accessType: apiEvent.ticketPrice > 0 ? 'paid' as const : 'open' as const,
  registeredUsers: [],
  likedUsers: [],
});

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const setUser = useAppStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'liked'>('created');
  const [loading, setLoading] = useState(false);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const hasLoadedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only load if user exists and we haven't loaded for this user ID yet
    if (user?._id) {
      // If user ID changed, reset the loaded flag
      if (currentUserIdRef.current !== user._id) {
        currentUserIdRef.current = user._id;
        hasLoadedRef.current = false;
      }

      // Load data only once per user
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadMyEvents();
        // Skip loadProfile to avoid loop - user data is already in store from login
        // loadProfile();
      }
    }
  }, [user?._id]); // Only depend on user ID, not the entire user object

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.user) {
        // Only update if user ID is different (prevents loop)
        if (user?._id !== response.user._id) {
          setUser(response.user);
        }
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getMyEvents();
      if (response.success && response.events) {
        const convertedEvents = response.events.map(convertEvent);
        setMyEvents(convertedEvents);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
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
            <Text className="text-white text-2xl font-bold mb-4 text-center">Welcome to Ticketly</Text>
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

  // Filter events based on user's actions
  const createdEvents = myEvents.filter((event) => event.organizerId === user?._id);
  const joinedEvents: any[] = []; // Will be implemented when ticket/registration API is available
  const likedEvents: any[] = []; // Will be implemented when like API is available

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

  const renderEvents = () => {
    let eventsToShow: any[] = [];
    if (activeTab === 'created') eventsToShow = createdEvents;
    else if (activeTab === 'joined') eventsToShow = joinedEvents;
    else eventsToShow = likedEvents;

    if (loading) {
      return (
        <View className="py-10 items-center">
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      );
    }

    if (eventsToShow.length === 0) {
      return (
        <View className="py-10 items-center">
          <Text className="text-[#6B7280] text-sm">
            {activeTab === 'created' && 'No events created yet'}
            {activeTab === 'joined' && 'No events joined yet'}
            {activeTab === 'liked' && 'No events liked yet'}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-row flex-wrap justify-between">
        {eventsToShow.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F0F0F] pt-[60px]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
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
            <Text className="text-white text-2xl font-bold mb-1">{joinedEvents.length}</Text>
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


