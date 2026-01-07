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
import { useAppStore } from '@/store/useAppStore';
import { EventCard } from '@/components/EventCard';
import { authAPI } from '@/lib/api/auth';
import { eventsAPI } from '@/lib/api/events';
import type { Event } from '@/lib/api/events';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Welcome to Ticketly</Text>
            <Text style={styles.emptyText}>
              Login to create events, register for events, and manage your profile
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>Login / Sign Up</Text>
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
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const renderEvents = () => {
    let eventsToShow: typeof events = [];
    if (activeTab === 'created') eventsToShow = createdEvents;
    else if (activeTab === 'joined') eventsToShow = joinedEvents;
    else eventsToShow = likedEvents;

    if (loading) {
      return (
        <View style={styles.emptyEventsContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      );
    }

    if (eventsToShow.length === 0) {
      return (
        <View style={styles.emptyEventsContainer}>
          <Text style={styles.emptyEventsText}>
            {activeTab === 'created' && 'No events created yet'}
            {activeTab === 'joined' && 'No events joined yet'}
            {activeTab === 'liked' && 'No events liked yet'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.eventsGrid}>
        {eventsToShow.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/settings')}
          >
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Section - Centered */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          {user.companyName && (
            <Text style={styles.company}>{user.companyName}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{createdEvents.length}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{joinedEvents.length}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{likedEvents.length}</Text>
            <Text style={styles.statLabel}>Liked</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'created' && styles.tabActive]}
            onPress={() => setActiveTab('created')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'created' && styles.tabTextActive,
              ]}
            >
              Created Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'joined' && styles.tabActive]}
            onPress={() => setActiveTab('joined')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'joined' && styles.tabTextActive,
              ]}
            >
              Joined Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
            onPress={() => setActiveTab('liked')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'liked' && styles.tabTextActive,
              ]}
            >
              Liked Events
            </Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>{renderEvents()}</View>

        {/* Logout */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  company: {
    color: '#9333EA',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  menuButton: {
    backgroundColor: '#1F1F1F',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1F1F1F',
  },
  tabActive: {
    backgroundColor: '#9333EA',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyEventsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyEventsText: {
    color: '#6B7280',
    fontSize: 14,
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  settingArrow: {
    color: '#9CA3AF',
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

