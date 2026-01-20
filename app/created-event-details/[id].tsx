import React, { useState, useEffect } from 'react';
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
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI, type Event } from '@/lib/api/events';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type TicketStatus = 'all' | 'pending_payment' | 'payment_in_review' | 'confirmed' | 'used' | 'cancelled';

interface Ticket {
  id: string;
  user?: {
    _id: string;
    fullName: string;
    username?: string;
    email: string;
  };
  username: string;
  email: string;
  phone: string;
  status: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CreatedEventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((state) => state.user);

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TicketStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Get event ID helper
  const getEventId = () => {
    return Array.isArray(id) ? id[0] : id;
  };

  // Fetch event details
  const fetchEvent = async () => {
    const eventId = getEventId();

    if (!eventId) {
      setError('Event ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching event with ID:', eventId, 'Type:', typeof eventId);
      const response = await eventsAPI.getEventById(String(eventId));

      if (response.success && response.event) {
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
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load event';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tickets for this event
  const fetchTickets = async () => {
    const eventId = getEventId();

    if (!eventId) return;

    try {
      setLoadingTickets(true);
      console.log('Fetching tickets for event ID:', eventId);
      const response = await eventsAPI.getTicketsByEventId(String(eventId));
      if (response.success && response.tickets) {
        console.log('Tickets fetched successfully:', response.tickets.length);
        setTickets(response.tickets);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      console.error('Ticket error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      // Don't set error state for tickets - just log it
      // The event might still be viewable even if tickets fail to load
    } finally {
      setLoadingTickets(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event) {
      fetchTickets();
    }
  }, [event, id]);

  // Refresh both event and tickets
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchEvent(), fetchTickets()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter tickets by status
  const getFilteredTickets = () => {
    if (activeTab === 'all') {
      return tickets;
    }
    return tickets.filter((ticket) => ticket.status === activeTab);
  };

  // Get status info for styling
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
          label: 'Submitted'
        };
      case 'pending_payment':
        return {
          bgColor: 'bg-[#F59E0B]/20',
          borderColor: 'border-[#F59E0B]/50',
          badgeColor: 'bg-[#F59E0B]',
          textColor: 'text-[#F59E0B]',
          iconColor: '#F59E0B',
          icon: 'schedule',
          label: 'Pending'
        };
      case 'payment_in_review':
        return {
          bgColor: 'bg-[#3B82F6]/20',
          borderColor: 'border-[#3B82F6]/50',
          badgeColor: 'bg-[#3B82F6]',
          textColor: 'text-[#3B82F6]',
          iconColor: '#3B82F6',
          icon: 'hourglass-empty',
          label: 'In Review'
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

  // Get count for each status
  const getStatusCount = (status: TicketStatus) => {
    if (status === 'all') return tickets.length;
    return tickets.filter((ticket) => ticket.status === status).length;
  };

  const tabs: { key: TicketStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending_payment', label: 'Pending' },
    { key: 'payment_in_review', label: 'In Review' },
    { key: 'confirmed', label: 'Submitted' },
    { key: 'used', label: 'Used' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (loading && !event) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        {/* Fixed Reload Button */}
        <TouchableOpacity
          className="absolute top-[50px] right-5 z-50 bg-black/50 w-10 h-10 rounded-full items-center justify-center"
          onPress={onRefresh}
          disabled={refreshing || loading}
        >
          <MaterialIcons
            name="refresh"
            size={20}
            color="#FFFFFF"
            style={{
              transform: [{ rotate: refreshing || loading ? '180deg' : '0deg' }]
            }}
          />
        </TouchableOpacity>
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
        {/* Fixed Reload Button */}
        <TouchableOpacity
          className="absolute top-[50px] right-5 z-50 bg-black/50 w-10 h-10 rounded-full items-center justify-center"
          onPress={onRefresh}
          disabled={refreshing || loading}
        >
          <MaterialIcons
            name="refresh"
            size={20}
            color="#FFFFFF"
            style={{
              transform: [{ rotate: refreshing || loading ? '180deg' : '0deg' }]
            }}
          />
        </TouchableOpacity>
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

  const filteredTickets = getFilteredTickets();

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      {/* Fixed Reload Button - Always Visible */}
      <TouchableOpacity
        className="absolute top-[50px] right-5 z-50 bg-black/70 w-10 h-10 rounded-full items-center justify-center shadow-lg"
        onPress={onRefresh}
        disabled={refreshing || loading}
        style={{ elevation: 5 }}
      >
        <MaterialIcons
          name="refresh"
          size={20}
          color="#FFFFFF"
          style={{
            transform: [{ rotate: refreshing || loading ? '180deg' : '0deg' }]
          }}
        />
      </TouchableOpacity>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333EA"
            colors={["#9333EA"]}
          />
        }
        stickyHeaderIndices={[1]}
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
        </View>

        {/* Sticky Container: Event Info Card + Tabs */}
        <View className="bg-[#0F0F0F]">
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
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}, {event.time}
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

            {/* Total Tickets Count */}
            <View className="flex-row mb-5 items-start">
              <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold mb-1">Total Tickets</Text>
                <Text className="text-[#D1D5DB] text-sm mb-0.5">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} sold
                </Text>
              </View>
            </View>
          </View>

          {/* Tabs Section */}
          <View className="px-5 pt-5 pb-4 bg-[#0F0F0F]">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {tabs.map((tab) => {
                const count = getStatusCount(tab.key);
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    className={`py-2.5 px-4 rounded-xl flex-row items-center gap-2 ${isActive ? 'bg-[#9333EA]' : 'bg-[#1F1F1F]'
                      }`}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`}>
                      {tab.label}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[#374151]'}`}>
                      <Text className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Tickets List */}
        <View className="px-5 mt-2">
          {loadingTickets ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#9333EA" />
              <Text className="text-white text-sm mt-4">Loading tickets...</Text>
            </View>
          ) : filteredTickets.length === 0 ? (
            <View className="py-10 items-center">
              <MaterialIcons name="confirmation-number" size={48} color="#6B7280" />
              <Text className="text-[#6B7280] text-sm mt-4">
                {activeTab === 'all' ? 'No tickets found' : `No ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()} tickets`}
              </Text>
            </View>
          ) : (
            <View>
              {filteredTickets.map((ticket) => {
                const statusInfo = getStatusInfo(ticket.status);
                const ticketId = ticket.id || ticket.user?._id || 'unknown';
                const displayName = ticket.user?.fullName || ticket.username || 'Unknown User';
                const displayEmail = ticket.user?.email || ticket.email || 'No email';
                const displayPhone = ticket.phone || 'No phone';

                return (
                  <View
                    key={ticketId}
                    className={`${statusInfo.bgColor} ${statusInfo.borderColor} rounded-xl p-4 mb-3 border-2`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <MaterialIcons
                          name={statusInfo.icon as any}
                          size={20}
                          color={statusInfo.iconColor}
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-white text-sm font-bold flex-1">
                          {displayName}
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
                          {displayEmail}
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-2">
                        <MaterialIcons name="phone" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                        <Text className="text-[#D1D5DB] text-xs">
                          {displayPhone}
                        </Text>
                      </View>
                      {ticket.createdAt && (
                        <View className="flex-row items-center">
                          <MaterialIcons name="calendar-today" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                          <Text className="text-[#9CA3AF] text-[10px]">
                            {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      )}
                      {ticket.user?.username && (
                        <View className="flex-row items-center mt-2">
                          <MaterialIcons name="person" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                          <Text className="text-[#9CA3AF] text-[10px]">
                            @{ticket.user.username}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

