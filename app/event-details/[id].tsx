import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI, type Event } from '@/lib/api/events';
import { ticketsAPI } from '@/lib/api/tickets';
import { authAPI } from '@/lib/api/auth';
import { Modal } from '@/components/Modal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const toggleEventLike = useAppStore((state) => state.toggleEventLike);
  const registerForEvent = useAppStore((state) => state.registerForEvent);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [userTicketId, setUserTicketId] = useState<string | null>(null);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [ticketsSectionY, setTicketsSectionY] = useState<number>(0);

  // Fetch event from API
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await eventsAPI.getEventById(id);

        if (response.success && response.event) {
          // Transform backend event to match frontend structure
          const eventData = response.event as any;
          const transformedEvent: Event = {
            ...eventData,
            _id: eventData.id || eventData._id,
          };
          setEvent(transformedEvent);
        } else {
          setError('Event not found');
        }
      } catch (err: any) {
        console.error('Error fetching event:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load event';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Fetch user's tickets for this event
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!event || !user || !id) return;

      try {
        setLoadingTickets(true);
        const response = await ticketsAPI.getMyTickets();
        if (response.success && response.tickets) {
          // Filter tickets for this specific event
          const eventTickets = response.tickets.filter(
            (ticket: any) => ticket.event?._id === id || ticket.event?.id === id || ticket.eventId === id
          );
          setUserTickets(eventTickets);
          // Check if user is registered (has tickets)
          setIsRegistered(eventTickets.length > 0);
        }
      } catch (error) {
        console.error('Error fetching user tickets:', error);
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchUserTickets();
  }, [event, user, id]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <ActivityIndicator size="large" color="#9333EA" />
          <Text className="text-white text-base mt-4">Loading event...</Text>
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-[#EF4444] text-lg mb-6">{error || 'Event not found'}</Text>
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
    if (user && event) {
      const eventId = event._id || (event as any).id;
      const userId = (user as any)._id || user.id;
      toggleEventLike(eventId, userId);
      setIsLiked(!isLiked);
    }
  };

  const handleRegister = async () => {
    const isAuthenticated = useAppStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to register for events', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (!user || !event) return;

    const eventId = event._id || (event as any).id;

    // Check if user has phone number
    if (!user.phone || user.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }

    await createTicket(eventId, user.phone);
  };

  const createTicket = async (eventId: string, phone: string) => {
    if (!user || !event) return;

    try {
      setCreatingTicket(true);

      const ticketData = {
        eventId,
        username: user.username || user.fullName,
        email: user.email,
        phone: phone.trim(),
      };

      const response = await ticketsAPI.createTicket(ticketData);

      if (response.success && response.ticket) {
        // Refresh user profile to update joinedEvents
        try {
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.success && profileResponse.user) {
            setUser(profileResponse.user);
          }
        } catch (profileError) {
          console.error('Failed to refresh profile:', profileError);
          // Don't block success if profile refresh fails
        }

        // Refresh tickets list
        try {
          const ticketsResponse = await ticketsAPI.getMyTickets();
          if (ticketsResponse.success && ticketsResponse.tickets) {
            const eventTickets = ticketsResponse.tickets.filter(
              (ticket: any) => ticket.event?._id === id || ticket.event?.id === id || ticket.eventId === id
            );
            setUserTickets(eventTickets);
          }
        } catch (ticketsError) {
          console.error('Failed to refresh tickets:', ticketsError);
        }

        setUserTicketId(response.ticket.id);
        setIsRegistered(true);
        setModalMessage('Ticket created successfully! Please submit payment to confirm your ticket.');
        setShowModal(true);
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create ticket';
      Alert.alert('Error', errorMessage);
    } finally {
      setCreatingTicket(false);
      setShowPhoneModal(false);
      setPhoneInput('');
    }
  };

  const handlePhoneSubmit = () => {
    if (!phoneInput.trim() || phoneInput.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 10 digits)');
      return;
    }
    if (!event) return;
    const eventId = event._id || (event as any).id;
    createTicket(eventId, phoneInput);
  };

  const handleViewTicket = () => {
    // Always scroll to tickets section
    if (ticketsSectionY > 0) {
      scrollViewRef.current?.scrollTo({ y: ticketsSectionY - 20, animated: true });
    } else {
      // Fallback: scroll to end if position not measured yet
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
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

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View className="w-full h-[300px] relative">
          <Image
            source={{ uri: event.image || 'https://via.placeholder.com/400' }}
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
                {event.status === 'approved' ? 'Approved' : event.status === 'pending' ? 'Pending' : 'Draft'}
              </Text>
            </View>
          </View>

          {/* Event Date & Time */}
          <View className="flex-row mb-5 items-start">
            <MaterialIcons name="calendar-today" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">Event Date & Time</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">
                {formatDate(event.date)}, {formatTime(event.time)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row mb-5 items-start">
            <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">Location</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">{event.location}</Text>
            </View>
          </View>

          {/* Price */}
          <View className="flex-row mb-5 items-start">
            <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">Ticket Price</Text>
              <Text className="text-[#D1D5DB] text-sm mb-0.5">
                {event.ticketPrice ? `PKR ${event.ticketPrice.toLocaleString()}` : 'Free'}
              </Text>
              {event.totalTickets && (
                <Text className="text-[#9CA3AF] text-xs mt-1">
                  {event.totalTickets} tickets available
                </Text>
              )}
            </View>
          </View>

          {/* Register Button */}
          {!isRegistered && (
            <TouchableOpacity
              className={`py-4 rounded-xl items-center mt-2 ${isRegistered ? 'bg-[#10B981]' : 'bg-[#9333EA]'}`}
              onPress={isRegistered ? handleViewTicket : handleRegister}
              disabled={creatingTicket}
            >
              {creatingTicket ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Register Now
                </Text>
              )}
            </TouchableOpacity>
          )}

        </View>

        {/* Event Description Section */}
        <View className="p-5 border-t border-[#1F1F1F]">
          <Text className="text-white text-xl font-bold mb-3">Event Description</Text>
          <Text className="text-[#D1D5DB] text-sm leading-6 mb-3">
            {event.description}
          </Text>
        </View>

        {/* Contact Information */}
        {(event.email || event.phone) && (
          <View className="p-5 border-t border-[#1F1F1F]">
            <Text className="text-white text-xl font-bold mb-3">Contact Information</Text>
            {event.email && (
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="email" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <Text className="text-[#D1D5DB] text-sm">{event.email}</Text>
              </View>
            )}
            {event.phone && (
              <View className="flex-row items-center">
                <MaterialIcons name="phone" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <Text className="text-[#D1D5DB] text-sm">{event.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Organized By */}
        {event.createdBy && (
          <View className="p-5 border-t border-[#1F1F1F]">
            <Text className="text-white text-xl font-bold mb-3">Organized By</Text>
            <Text className="text-white text-base font-semibold">{event.createdBy.fullName}</Text>
            {event.createdBy.email && (
              <Text className="text-[#9CA3AF] text-sm mt-1">{event.createdBy.email}</Text>
            )}
          </View>
        )}

        {/* User's Tickets Section */}
        {user && userTickets.length > 0 && (
          <View
            className="p-5 border-t border-[#1F1F1F]"
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setTicketsSectionY(y);
            }}
          >
            <Text className="text-white text-xl font-bold mb-4">Your Tickets ({userTickets.length})</Text>
            {userTickets.map((ticket: any, ticketIndex: number) => {
              // Get status colors and info
              const getStatusInfo = (status: string) => {
                switch (status) {
                  case 'confirmed':
                    return {
                      bgColor: 'bg-[#10B981]/20',
                      borderColor: 'border-[#10B981]/50',
                      badgeColor: 'bg-[#10B981]',
                      textColor: 'text-[#10B981]',
                      iconColor: '#10B981',
                      icon: 'check-circle',
                      label: 'Confirmed'
                    };
                  case 'pending_payment':
                    return {
                      bgColor: 'bg-[#F59E0B]/20',
                      borderColor: 'border-[#F59E0B]/50',
                      badgeColor: 'bg-[#F59E0B]',
                      textColor: 'text-[#F59E0B]',
                      iconColor: '#F59E0B',
                      icon: 'schedule',
                      label: 'Pending Payment'
                    };
                  case 'payment_submitted':
                    return {
                      bgColor: 'bg-[#3B82F6]/20',
                      borderColor: 'border-[#3B82F6]/50',
                      badgeColor: 'bg-[#3B82F6]',
                      textColor: 'text-[#3B82F6]',
                      iconColor: '#3B82F6',
                      icon: 'hourglass-empty',
                      label: 'Payment Submitted'
                    };
                  case 'used':
                    return {
                      bgColor: 'bg-[#6B7280]/20',
                      borderColor: 'border-[#6B7280]/50',
                      badgeColor: 'bg-[#6B7280]',
                      textColor: 'text-[#6B7280]',
                      iconColor: '#6B7280',
                      icon: 'check',
                      label: 'Used'
                    };
                  case 'cancelled':
                    return {
                      bgColor: 'bg-[#EF4444]/20',
                      borderColor: 'border-[#EF4444]/50',
                      badgeColor: 'bg-[#EF4444]',
                      textColor: 'text-[#EF4444]',
                      iconColor: '#EF4444',
                      icon: 'cancel',
                      label: 'Cancelled'
                    };
                  default:
                    return {
                      bgColor: 'bg-[#9CA3AF]/20',
                      borderColor: 'border-[#9CA3AF]/50',
                      badgeColor: 'bg-[#9CA3AF]',
                      textColor: 'text-[#9CA3AF]',
                      iconColor: '#9CA3AF',
                      icon: 'help-outline',
                      label: status
                    };
                }
              };

              const statusInfo = getStatusInfo(ticket.status);
              const ticketId = ticket.id || ticket._id || `ticket-${ticketIndex}`;

              return (
                <TouchableOpacity
                  key={ticketId}
                  className={`${statusInfo.bgColor} ${statusInfo.borderColor} rounded-xl p-4 mb-3 border-2`}
                  onPress={() => router.push(`/ticket/${ticketId}`)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      {/* Ticket Header with Status */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                          <MaterialIcons
                            name={statusInfo.icon as any}
                            size={20}
                            color={statusInfo.iconColor}
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-white text-sm font-bold">
                            Ticket #{ticketId.slice(-8).toUpperCase()}
                          </Text>
                        </View>
                        <View className={`${statusInfo.badgeColor} px-3 py-1 rounded-full`}>
                          <Text className="text-white text-[10px] font-bold uppercase">
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      {/* Ticket Details */}
                      <View>
                        <View className="flex-row items-center mb-2">
                          <MaterialIcons name="email" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                          <Text className="text-[#D1D5DB] text-xs flex-1" numberOfLines={1}>
                            {ticket.email}
                          </Text>
                        </View>
                        <View className="flex-row items-center mb-2">
                          <MaterialIcons name="phone" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                          <Text className="text-[#D1D5DB] text-xs">
                            {ticket.phone}
                          </Text>
                        </View>
                        {ticket.createdAt && (
                          <View className="flex-row items-center">
                            <MaterialIcons name="calendar-today" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                            <Text className="text-[#9CA3AF] text-[10px]">
                              {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Arrow Icon */}
                    <View className="justify-center">
                      <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          if (userTicketId) {
            router.push(`/ticket/${userTicketId}`);
          } else if (event) {
            const eventId = event._id || (event as any).id;
            router.push(`/ticket/${eventId}`);
          }
        }}
        title="Success"
        message={modalMessage}
        primaryButtonText="View Ticket"
        onPrimaryPress={() => {
          setShowModal(false);
          if (userTicketId) {
            router.push(`/ticket/${userTicketId}`);
          } else if (event) {
            const eventId = event._id || (event as any).id;
            router.push(`/ticket/${eventId}`);
          }
        }}
      />

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <View className="absolute inset-0 bg-black/70 justify-center items-center p-5 z-50">
          <View className="bg-[#1F1F1F] rounded-2xl p-6 w-full max-w-[400px]">
            <Text className="text-white text-xl font-bold mb-2 text-center">Phone Number Required</Text>
            <Text className="text-[#D1D5DB] text-base leading-6 mb-4 text-center">
              Please enter your phone number to create a ticket
            </Text>
            <TextInput
              className="bg-[#374151] text-white px-4 py-3 rounded-xl mb-4"
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-[#2F2F2F]"
                onPress={() => {
                  setShowPhoneModal(false);
                  setPhoneInput('');
                }}
              >
                <Text className="text-white text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-[#9333EA]"
                onPress={handlePhoneSubmit}
                disabled={creatingTicket}
              >
                {creatingTicket ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-semibold">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

