import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { authAPI, type PublicUserProfile } from '@/lib/api/auth';
import { getProfileImageUrl, getEventImageUrl } from '@/lib/utils/imageUtils';
import { EventCard } from '@/components/EventCard';

type TabKey = 'created' | 'joined' | 'liked';

// Convert API event to EventCard format (same shape as profile/explore)
function convertEvent(apiEvent: any) {
  const eventId = apiEvent._id || apiEvent.id || (apiEvent as any)?._id || (apiEvent as any)?.id;
  const dateStr = apiEvent.date
    ? String(apiEvent.date).includes('T')
      ? String(apiEvent.date).split('T')[0]
      : apiEvent.date
    : '';
  const priceNum =
    apiEvent.price?.price === 'free' || apiEvent.price?.currency === null
      ? 0
      : typeof apiEvent.price?.price === 'number'
        ? apiEvent.price.price
        : apiEvent.ticketPrice ?? 0;
  return {
    id: eventId || '',
    title: apiEvent.title || '',
    description: apiEvent.description ?? '',
    date: dateStr,
    time: apiEvent.time || '',
    venue: apiEvent.location || '',
    city: (apiEvent.location || '').split(',')[0] || apiEvent.location || '',
    category: 'Event',
    image: getEventImageUrl(apiEvent as any) || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    organizerId: apiEvent.createdBy?._id || apiEvent.createdBy?.id || '',
    organizerName: apiEvent.createdBy?.fullName || 'Organizer',
    price: priceNum,
    accessType: priceNum > 0 ? ('paid' as const) : ('open' as const),
    registeredUsers: [],
    likedUsers: [],
    hostAvatarUrl: apiEvent.createdBy ? getProfileImageUrl(apiEvent.createdBy as any) : null,
    joinedUsers: (apiEvent.joinedUsers || []).map((u: any) => ({
      id: u._id || u.id,
      name: u.name || u.fullName,
      avatarUrl: u.profileImageUrl || u.avatarUrl,
    })),
    joinedCount: apiEvent.joinedCount ?? (apiEvent.joinedUsers?.length ?? 0),
  };
}


export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('created');

  const fetchProfile = useCallback(
    async (showRefreshing = false) => {
      if (!id) {
        setError('User ID is required');
        setLoading(false);
        return;
      }
      try {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const response = await authAPI.getUserProfileById(id);
        if (response.success && response.user) {
          setProfile(response.user);
        } else {
          setError('User not found');
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to load profile';
        setError(msg);
        setProfile(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => fetchProfile(true);

  const createdEvents = (profile?.createdEvents || []).map(convertEvent);
  const joinedEvents = (profile?.joinedEvents || [])
    .map((item: any) => (item?.event ? convertEvent(item.event) : null))
    .filter(Boolean);
  const likedEvents = (profile?.likedEvents || []).map(convertEvent);

  const currentEvents =
    activeTab === 'created' ? createdEvents : activeTab === 'joined' ? joinedEvents : likedEvents;

  const safeTop = 50 + insets.top;

  if (loading && !profile) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <ActivityIndicator size="large" color="#9333EA" />
          <Text className="text-white text-base mt-4">Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-[#EF4444] text-lg mb-6">{error || 'User not found'}</Text>
          <TouchableOpacity
            className="bg-[#9333EA] py-3 px-6 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white text-base font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const profileImageUri = getProfileImageUrl(profile) || undefined;

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333EA"
            colors={['#9333EA']}
          />
        }
      >
        {/* Profile image header (same style as event-details thumbnail) */}
        <View className="w-full h-[300px] relative bg-[#1F1F1F]">
          <Image
            source={{
              uri: profileImageUri || 'https://via.placeholder.com/400?text=No+Photo',
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute bg-black/50 w-10 h-10 rounded-full items-center justify-center"
            style={{ top: safeTop, left: 20 }}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Details card (same style as event-details info card) */}
        <View className="bg-[#1F1F1F] rounded-t-3xl p-5 -mt-5">
          <Text className="text-white text-2xl font-bold mb-1">{profile.fullName}</Text>
          {profile.companyName ? (
            <Text className="text-[#9333EA] text-base font-semibold mb-6">{profile.companyName}</Text>
          ) : (
            <View className="mb-6" />
          )}

          {/* Stats row */}
          <View className="flex-row justify-around py-4 border-t border-b border-[#2D2D2D] mb-6">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{createdEvents.length}</Text>
              <Text className="text-[#9CA3AF] text-xs">Created</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{joinedEvents.length}</Text>
              <Text className="text-[#9CA3AF] text-xs">Joined</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{likedEvents.length}</Text>
              <Text className="text-[#9CA3AF] text-xs">Liked</Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row mb-5 gap-2">
            {(['created', 'joined', 'liked'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === tab ? 'bg-[#9333EA]' : 'bg-[#2D2D2D]'}`}
              >
                <Text
                  className={`text-xs font-semibold ${activeTab === tab ? 'text-white' : 'text-[#9CA3AF]'}`}
                >
                  {tab === 'created' ? 'Created' : tab === 'joined' ? 'Joined' : 'Liked'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Event list */}
          {currentEvents.length === 0 ? (
            <View className="py-10 items-center">
              <MaterialIcons name="event-busy" size={48} color="#4B5563" />
              <Text className="text-[#9CA3AF] text-base mt-3">
                No {activeTab} events yet
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/event-details/${event.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
