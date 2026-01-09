import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { ticketsAPI, type Ticket } from '@/lib/api/tickets';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((state) => state.user);
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) {
        setError('Ticket ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await ticketsAPI.getTicketById(id);
        
        if (response.success && response.ticket) {
          setTicket(response.ticket);
        } else {
          setError('Ticket not found');
        }
      } catch (err: any) {
        console.error('Error fetching ticket:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load ticket';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <ActivityIndicator size="large" color="#9333EA" />
          <Text className="text-white text-base mt-4">Loading ticket...</Text>
        </View>
      </View>
    );
  }

  if (error || !ticket) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-[#EF4444] text-lg mb-6">{error || 'Ticket not found'}</Text>
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

  if (!user) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-[#EF4444] text-lg mb-6">Please login to view your ticket</Text>
          <TouchableOpacity
            className="bg-[#9333EA] py-3 px-6 rounded-xl"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white text-base font-semibold">Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending_payment':
        return '#F59E0B';
      case 'used':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending_payment':
        return 'Pending Payment';
      case 'used':
        return 'Used';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#0F0F0F]"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between pt-[60px] px-5 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Your Ticket</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Ticket Card */}
      <View className="bg-[#1F1F1F] mx-5 rounded-2xl overflow-hidden mb-6">
        {/* Ticket Header */}
        <View className="flex-row justify-between items-center p-5 border-b border-[#374151]">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">ticketly</Text>
          </View>
          <View className="items-end">
            <Text className="text-[#9CA3AF] text-xs mb-1">Ticket #</Text>
            <Text className="text-white text-sm font-bold">{ticket.id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View className="px-5 pt-3">
          <View className="self-start bg-[#1F1F1F] px-3 py-1.5 rounded-lg">
            <Text style={{ color: getStatusColor(ticket.status) }} className="text-xs font-semibold">
              {getStatusText(ticket.status)}
            </Text>
          </View>
        </View>

        {/* Event Image */}
        {ticket.event?.image && (
        <Image
            source={{ uri: ticket.event.image }}
            className="w-full h-[200px] mt-3"
          resizeMode="cover"
        />
        )}

        {/* Event Info */}
        <View className="p-5">
          <Text className="text-white text-2xl font-bold mb-1">{ticket.event?.title || 'Event'}</Text>
          {ticket.organizer && (
            <Text className="text-[#9333EA] text-sm font-semibold mb-5">
              by {ticket.organizer.fullName}
            </Text>
          )}

          {ticket.event?.date && (
          <View className="flex-row mb-4 items-start">
            <MaterialIcons name="calendar-today" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs mb-1">Date</Text>
              <Text className="text-white text-sm mb-0.5">
                  {formatDate(ticket.event.date)} {ticket.event.time && `at ${ticket.event.time}`}
              </Text>
            </View>
          </View>
          )}

          {ticket.event?.location && (
          <View className="flex-row mb-4 items-start">
            <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs mb-1">Venue</Text>
                <Text className="text-white text-sm mb-0.5">{ticket.event.location}</Text>
              </View>
            </View>
          )}

          {ticket.event?.ticketPrice !== undefined && (
            <View className="flex-row mb-4 items-start">
              <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-[#9CA3AF] text-xs mb-1">Ticket Price</Text>
                <Text className="text-white text-sm mb-0.5">
                  PKR {ticket.event.ticketPrice.toLocaleString()}
                </Text>
            </View>
          </View>
          )}

          <View className="flex-row mb-4 items-start">
            <MaterialIcons name="person-outline" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs mb-1">Attendee</Text>
              <Text className="text-white text-sm mb-0.5">{ticket.username}</Text>
              <Text className="text-white text-sm mb-0.5">{ticket.email}</Text>
              {ticket.phone && (
                <Text className="text-white text-sm mb-0.5">{ticket.phone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        {ticket.status === 'confirmed' && (
        <View className="p-5 border-t border-[#374151] items-center">
          <Text className="text-white text-base font-semibold mb-4">Scan QR Code at Entry</Text>
            {ticket.qrCodeUrl ? (
              <View className="bg-white p-5 rounded-xl mb-3">
                <Image
                  source={{ uri: ticket.qrCodeUrl }}
                  className="w-[200px] h-[200px]"
                  resizeMode="contain"
                />
              </View>
            ) : ticket.accessKey ? (
          <View className="bg-white p-5 rounded-xl mb-3">
            <View className="w-[200px] h-[200px] bg-[#F3F4F6] items-center justify-center rounded-lg">
                  <Text className="text-[#6B7280] text-base font-bold mb-2">Access Key</Text>
                  <Text className="text-[#9CA3AF] text-[10px] text-center px-2.5 font-mono">
                    {ticket.accessKey}
                  </Text>
            </View>
          </View>
            ) : null}
          <Text className="text-[#9CA3AF] text-xs text-center">
            Please arrive 15 minutes before the event starts
          </Text>
        </View>
        )}

        {ticket.status === 'pending_payment' && (
          <View className="p-5 border-t border-[#374151] items-center">
            <Text className="text-[#F59E0B] text-base font-semibold mb-2">
              Payment Pending
            </Text>
            <Text className="text-[#9CA3AF] text-sm text-center">
              Please complete payment to confirm your ticket and receive your QR code.
            </Text>
          </View>
        )}

        {/* Ticket Footer */}
        <View className="p-5 border-t border-[#374151] bg-[#0F0F0F]">
          <Text className="text-[#6B7280] text-xs text-center mb-1">
            This ticket is valid for one person only
          </Text>
          <Text className="text-[#6B7280] text-xs text-center mb-1">
            For support, contact: support@ticketly.com
          </Text>
        </View>
      </View>

      {/* Actions */}
      {ticket.status === 'confirmed' && (
      <View className="flex-row gap-3 px-5">
        <TouchableOpacity
          className="flex-1 bg-[#9333EA] py-4 rounded-xl items-center"
          onPress={() => {
              Alert.alert('Download', 'Ticket download feature coming soon!');
          }}
        >
          <Text className="text-white text-base font-semibold">Download Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#1F1F1F] border border-[#374151] py-4 rounded-xl items-center"
          onPress={() => {
              Alert.alert('Share', 'Ticket sharing feature coming soon!');
          }}
        >
          <Text className="text-white text-base font-semibold">Share</Text>
        </TouchableOpacity>
      </View>
      )}
    </ScrollView>
  );
}

