import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { EventCard } from '@/components/EventCard';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const events = useAppStore((state) => state.events);
  const [activeTab, setActiveTab] = useState<'created' | 'joined' | 'liked'>('created');

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please login to view profile</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Filter events based on user's actions
  const createdEvents = events.filter((event) => event.organizerId === user.id);
  const joinedEvents = events.filter((event) => event.registeredUsers.includes(user.id));
  const likedEvents = events.filter((event) => event.likedUsers.includes(user.id));

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
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
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              {user.companyName && (
                <Text style={styles.company}>{user.companyName}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => Alert.alert('Edit Profile', 'Edit profile feature coming soon')}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
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

        {/* Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Change Password', 'Change password feature coming soon')}
          >
            <Text style={styles.settingText}>Change Password</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Edit Email', 'Edit email feature coming soon')}
          >
            <Text style={styles.settingText}>Edit Email</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon')}
          >
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  company: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#1F1F1F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
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

