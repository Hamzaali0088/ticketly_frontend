import { EventCard } from '@/components/EventCard';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI } from '@/lib/api/events';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  Easing,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Event } from '@/lib/api/events';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82; // 82% of screen width for better peek effect
const CARD_SPACING = 16; // Space between cards
const HORIZONTAL_PADDING = (width - CARD_WIDTH) / 2; // Center padding to center the cards

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
  const insets = useSafeAreaInsets();
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const animatedScales = useRef<Animated.Value[]>([]);

  // Calculate bottom padding: tab bar height + safe area bottom + extra padding
  // Tab bar layout: iOS height=90 (includes paddingBottom=30), Android height=75 + paddingBottom + marginBottom=10
  // Total space from bottom: iOS = 90 + insets.bottom, Android = 75 + max(insets.bottom, 50) + 10 + insets.bottom
  const tabBarTotalHeight = Platform.OS === 'ios' 
    ? 90 + insets.bottom // iOS: height includes padding, add safe area
    : 75 + Math.max(insets.bottom, 50) + 10 + insets.bottom; // Android: height + paddingBottom + marginBottom + safe area
  const bottomPadding = tabBarTotalHeight + 20; // Extra 20px for comfortable spacing

  useEffect(() => {
    // Load events on mount - no authentication required
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
        setUpcomingEvents(convertedEvents); // Show all events, not just 6
        // Set first 5 events as featured for carousel
        if (convertedEvents.length > 0) {
          const featured = convertedEvents.slice(0, Math.min(5, convertedEvents.length));
          setFeaturedEvents(featured);
          // Initialize animated scales for each card
          animatedScales.current = featured.map((_, index) => 
            new Animated.Value(index === 0 ? 1 : 0.92)
          );
        }
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
        contentContainerStyle={{ paddingBottom: bottomPadding }}
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
        {featuredEvents.length > 0 && (
          <View className="mb-6">
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const slideIndex = Math.round(
                  event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING)
                );
                const clampedIndex = Math.min(Math.max(0, slideIndex), featuredEvents.length - 1);
                if (clampedIndex !== currentSlide) {
                  // Animate all cards smoothly over 1 second with easing
                  animatedScales.current.forEach((scale, index) => {
                    Animated.timing(scale, {
                      toValue: index === clampedIndex ? 1 : 0.92,
                      duration: 1000,
                      easing: Easing.out(Easing.cubic),
                      useNativeDriver: true,
                    }).start();
                  });
                  setCurrentSlide(clampedIndex);
                }
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                {
                  useNativeDriver: false,
                  listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                    const slideIndex = Math.round(
                      event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING)
                    );
                    const clampedIndex = Math.min(Math.max(0, slideIndex), featuredEvents.length - 1);
                    if (clampedIndex !== currentSlide && animatedScales.current.length > 0) {
                      // Animate all cards smoothly over 1 second
                      animatedScales.current.forEach((scale, index) => {
                        Animated.timing(scale, {
                          toValue: index === clampedIndex ? 1 : 0.92,
                          duration: 1000,
                          useNativeDriver: true,
                        }).start();
                      });
                      setCurrentSlide(clampedIndex);
                    }
                  },
                }
              )}
              scrollEventThrottle={16}
              className="mb-3"
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate={0.92}
              bounces={false}
              contentContainerStyle={{
                paddingHorizontal: HORIZONTAL_PADDING,
              }}
            >
              {featuredEvents.map((event, index) => {
                const scrollPosition = index * (CARD_WIDTH + CARD_SPACING);
                const inputRange = [
                  scrollPosition - (CARD_WIDTH + CARD_SPACING),
                  scrollPosition - (CARD_WIDTH + CARD_SPACING) * 0.5,
                  scrollPosition,
                  scrollPosition + (CARD_WIDTH + CARD_SPACING) * 0.5,
                  scrollPosition + (CARD_WIDTH + CARD_SPACING),
                ];
                
                // Smooth opacity interpolation for real-time feedback
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.7, 0.8, 1, 0.8, 0.7],
                  extrapolate: 'clamp',
                });

                // Use animated scale value for smooth 1-second transitions
                const animatedScale = animatedScales.current[index] || new Animated.Value(0.92);

                return (
                  <Animated.View
                    key={event.id}
                    style={{
                      width: CARD_WIDTH,
                      height: 300,
                      marginRight: CARD_SPACING,
                      borderRadius: 20,
                      overflow: 'hidden',
                      transform: [{ scale: animatedScale }],
                      opacity,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/event-details/${event.id}`)}
              activeOpacity={0.9}
                      style={{ width: '100%', height: '100%' }}
            >
              <Image
                      source={{ uri: event.image }}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                resizeMode="cover"
              />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: 20,
                        borderBottomLeftRadius: 20,
                        borderBottomRightRadius: 20,
                      }}
                    >
                      <View style={{ gap: 8 }}>
                        <Text
                          className="text-white text-2xl font-bold"
                          numberOfLines={2}
                          style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                        >
                          {event.title}
                        </Text>
                        <Text
                          className="text-[#D1D5DB] text-sm"
                          style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}
                        >
                          {event.venue}
                  </Text>
                        <Text
                          className="text-[#9333EA] text-sm font-semibold"
                          style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}
                        >
                          {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
                    {/* Subtle shadow for depth */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                      pointerEvents="none"
                    />
                  </Animated.View>
                );
              })}
            </ScrollView>
            {/* Pagination Dots */}
            <View className="flex-row justify-center gap-2 mt-4">
              {featuredEvents.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: index === currentSlide ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: index === currentSlide ? '#FFFFFF' : '#374151',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
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
