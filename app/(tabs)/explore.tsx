import { EventCard } from '@/components/EventCard';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI } from '@/lib/api/events';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import { getEventImageUrl, getProfileImageUrl } from '@/lib/utils/imageUtils';
import {
  FlatList,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Event } from '@/lib/api/events';

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
  image: getEventImageUrl(apiEvent) || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
  organizerId: apiEvent.createdBy?._id || '',
  organizerName: apiEvent.createdBy?.fullName || 'Organizer',
  price: apiEvent.ticketPrice,
  accessType: apiEvent.ticketPrice > 0 ? 'paid' as const : 'open' as const,
  registeredUsers: [],
  likedUsers: [],
  hostAvatarUrl: apiEvent.createdBy ? getProfileImageUrl(apiEvent.createdBy as any) : null,
  joinedUsers: (apiEvent.joinedUsers || []).map((user) => ({
    id: user._id,
    name: user.name,
    avatarUrl: user.profileImageUrl || undefined,
  })),
  joinedCount: apiEvent.joinedCount ?? (apiEvent.joinedUsers?.length ?? 0),
});

export default function ExploreScreen() {
  const router = useRouter();
  const events = useAppStore((state) => state.events);
  const setEvents = useAppStore((state) => state.setEvents);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate bottom padding: tab bar height + safe area bottom + extra padding
  // Tab bar layout: iOS height=90 (includes paddingBottom=30), Android height=75 + paddingBottom + marginBottom=10
  // Total space from bottom: iOS = 90 + insets.bottom, Android = 75 + max(insets.bottom, 50) + 10 + insets.bottom
  const tabBarTotalHeight = Platform.OS === 'ios' 
    ? 90 + insets.bottom // iOS: height includes padding, add safe area
    : 75 + Math.max(insets.bottom, 50) + 10 + insets.bottom; // Android: height + paddingBottom + marginBottom + safe area
  const bottomPadding = tabBarTotalHeight + 20; // Extra 20px for comfortable spacing

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await eventsAPI.getApprovedEvents();
      if (response.success && response.events) {
        const convertedEvents = response.events.map(convertEvent);
        setEvents(convertedEvents);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadEvents(true);
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return events;
    }
    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        event.city.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0F0F0F] pt-[60px] justify-center items-center">
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F0F0F] pt-[60px]">
      <View className="px-5 pb-5">
        <Text className="text-3xl font-bold text-white mb-4">Explore Events</Text>
        <TextInput
          className="bg-[#1F1F1F] rounded-xl py-3 px-4 text-white text-sm"
          placeholder="Search by event..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPadding }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333EA"
            colors={["#9333EA"]}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-15">
            <Text className="text-[#6B7280] text-base">No events found</Text>
          </View>
        }
      />
    </View>
  );
}
