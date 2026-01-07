import { EventCard } from '@/components/EventCard';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI } from '@/lib/api/events';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { Event } from '@/lib/api/events';

const { width } = Dimensions.get('window');

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

export default function HomeScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setEvents = useAppStore((state) => state.setEvents);
  const [featuredEvent, setFeaturedEvent] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load events on mount - no authentication required
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getApprovedEvents();
      if (response.success && response.events) {
        const convertedEvents = response.events.map(convertEvent);
        setEvents(convertedEvents);
        setUpcomingEvents(convertedEvents.slice(0, 6));
        if (convertedEvents.length > 0) {
          setFeaturedEvent(convertedEvents[0]);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0F0F0F] justify-center items-center">
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-[60px] px-5 pb-5">
          <Text className="text-3xl font-bold text-white mb-4">ticketly</Text>
          <TouchableOpacity
            className="bg-[#1F1F1F] rounded-xl py-3 px-4"
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text className="text-[#6B7280] text-sm">Search by event</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Event Carousel */}
        {featuredEvent && (
          <View className="mb-6">
            <TouchableOpacity
              className="w-[calc(100%-40px)] h-[280px] rounded-2xl overflow-hidden mx-5 mb-3"
              onPress={() => router.push(`/event-details/${featuredEvent.id}`)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: featuredEvent.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-5">
                <View className="gap-2">
                  <Text className="text-white text-2xl font-bold" numberOfLines={2}>
                    {featuredEvent.title}
                  </Text>
                  <Text className="text-[#D1D5DB] text-sm">{featuredEvent.venue}</Text>
                  <Text className="text-[#9333EA] text-sm font-semibold">
                    {new Date(featuredEvent.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <View className="flex-row justify-center gap-2 mt-2">
              <View className="w-6 h-2 rounded-full bg-white" />
              <View className="w-2 h-2 rounded-full bg-[#374151]" />
              <View className="w-2 h-2 rounded-full bg-[#374151]" />
            </View>
          </View>
        )}



        {/* Upcoming Events */}
        <View className="px-5">
          <Text className="text-white text-xl font-bold mb-4">Upcoming Events</Text>
          {upcomingEvents.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-[#6B7280] text-sm">No events available</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
