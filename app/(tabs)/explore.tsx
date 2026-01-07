import { EventCard } from '@/components/EventCard';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI } from '@/lib/api/events';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
  image: apiEvent.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
  organizerId: apiEvent.createdBy?._id || '',
  organizerName: apiEvent.createdBy?.fullName || 'Organizer',
  price: apiEvent.ticketPrice,
  accessType: apiEvent.ticketPrice > 0 ? 'paid' as const : 'open' as const,
  registeredUsers: [],
  likedUsers: [],
});

export default function ExploreScreen() {
  const router = useRouter();
  const events = useAppStore((state) => state.events);
  const setEvents = useAppStore((state) => state.setEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getApprovedEvents();
      if (response.success && response.events) {
        const convertedEvents = response.events.map(convertEvent);
        setEvents(convertedEvents);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Events</Text>
        <TextInput
          style={styles.searchInput}
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
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
