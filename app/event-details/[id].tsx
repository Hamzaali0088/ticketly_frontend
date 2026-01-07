import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { getEventById } from '@/data/mockData';
import { Modal } from '@/components/Modal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const events = useAppStore((state) => state.events);
  const user = useAppStore((state) => state.user);
  const toggleEventLike = useAppStore((state) => state.toggleEventLike);
  const registerForEvent = useAppStore((state) => state.registerForEvent);
  
  const event = getEventById(id || '');
  const [isLiked, setIsLiked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (event && user) {
      const userId = (user as any)._id || user.id;
      setIsLiked(event.likedUsers.includes(userId));
      setIsRegistered(event.registeredUsers.includes(userId));
    }
  }, [event, user]);

  if (!event) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-[#EF4444] text-lg mb-6">Event not found</Text>
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

  const handleLike = () => {
    const isAuthenticated = useAppStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to like events', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (user) {
      toggleEventLike(event.id, user._id || user.id);
      setIsLiked(!isLiked);
    }
  };

  const handleRegister = () => {
    const isAuthenticated = useAppStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to register for events', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (!user) return;

    if (isRegistered) {
      Alert.alert('Already Registered', 'You are already registered for this event');
      router.push(`/ticket/${event.id}`);
      return;
    }

    registerForEvent(event.id, user._id || user.id);
    setIsRegistered(true);
    setModalMessage('Successfully registered for the event!');
    setShowModal(true);
  };

  const handleViewTicket = () => {
    router.push(`/ticket/${event.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const timeRemaining = getTimeRemaining(event.registrationDeadline);

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View className="w-full h-[300px] relative">
          <Image
            source={{ uri: event.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute top-[50px] left-5 bg-black/50 w-10 h-10 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            className="absolute top-[50px] right-5 bg-black/50 w-10 h-10 rounded-full items-center justify-center"
            onPress={handleLike}
          >
            <MaterialIcons 
              name={isLiked ? "favorite" : "favorite-border"} 
              size={20} 
              color={isLiked ? "#EF4444" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>

        {/* Event Info Card */}
        <View className="bg-[#1F1F1F] rounded-t-3xl p-5 -mt-5">
          <View className="flex-row justify-between items-start mb-6">
            <Text className="text-white text-2xl font-bold flex-1 mr-3">{event.title}</Text>
            <View className="bg-[#374151] py-1.5 px-3 rounded-xl">
              <Text className="text-[#D1D5DB] text-xs font-semibold">
                {event.accessType === 'open' ? 'Open for all' : event.accessType === 'paid' ? 'Paid' : 'Invite only'}
              </Text>
            </View>
          </View>

          {/* Registration Deadline */}
          {event.registrationDeadline && (
            <View className="flex-row mb-5 items-start">
              <MaterialIcons name="access-time" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold mb-1">Registration Deadline</Text>
                <Text className="text-[#D1D5DB] text-sm mb-0.5">
                  {formatDate(event.registrationDeadline)}, {formatTime(event.time)}
                </Text>
                {timeRemaining && (
                  <Text className="text-[#EF4444] text-xs mt-1">
                    Time remaining: {timeRemaining}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Event Date & Time */}
          <View className="flex-row mb-5 items-start">
            <MaterialIcons name="calendar-today" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">Event Date & Time</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">
                {formatDate(event.date)}, {formatTime(event.time)} till
              </Text>
              {event.endTime && (
                <Text className="text-[#D1D5DB] text-sm mb-0.5">
                  {formatDate(event.date)}, {formatTime(event.endTime)}
                </Text>
              )}
            </View>
          </View>

          {/* Location */}
          <View className="flex-row mb-5 items-start">
            <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">Location</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">{event.venue}</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">{event.city}</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="#9CA3AF" style={{ marginLeft: 8, marginTop: 2 }} />
          </View>

          {/* Price */}
          <View className="flex-row mb-5 items-start">
            <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">Registration Starting From</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">
                {event.price ? `PKR ${event.price.toLocaleString()}` : 'Fee would be calculated at the time of checkout'}
              </Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            className={`py-4 rounded-xl items-center mt-2 ${isRegistered ? 'bg-[#10B981]' : 'bg-[#9333EA]'}`}
            onPress={isRegistered ? handleViewTicket : handleRegister}
          >
            <Text className="text-white text-base font-bold">
              {isRegistered ? 'View Ticket' : 'Register Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Event Description Section */}
        <View className="p-5 border-t border-[#1F1F1F]">
          <Text className="text-white text-xl font-bold mb-3">Event Description</Text>
          <Text className="text-[#D1D5DB] text-sm leading-6 mb-3">
            {event.fullDescription || event.description}
          </Text>
          
          {event.entryPolicy && (
            <>
              <Text className="text-white text-base font-semibold mt-3 mb-2">Entry Policy:</Text>
              <Text className="text-[#D1D5DB] text-sm leading-6">• {event.entryPolicy}</Text>
            </>
          )}
          
          <TouchableOpacity className="flex-row items-center mt-3">
            <Text className="text-[#9333EA] text-sm font-semibold mr-1">View more</Text>
            <MaterialIcons name="expand-more" size={16} color="#9333EA" />
          </TouchableOpacity>
        </View>

        {/* Organized By */}
        <View className="p-5 border-t border-[#1F1F1F]">
          <Text className="text-white text-xl font-bold mb-3">Organized By</Text>
          <Text className="text-white text-base font-semibold">{event.organizerName}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          router.push(`/ticket/${event.id}`);
        }}
        title="Success"
        message={modalMessage}
        primaryButtonText="View Ticket"
        onPrimaryPress={() => {
          setShowModal(false);
          router.push(`/ticket/${event.id}`);
        }}
      />
    </View>
  );
}

