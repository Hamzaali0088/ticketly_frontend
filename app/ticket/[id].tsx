import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getEventById } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((state) => state.user);
  const events = useAppStore((state) => state.events);
  
  const event = getEventById(id || '');

  if (!event || !user) {
    return (
      <View className="flex-1 bg-[#0F0F0F]">
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-[#EF4444] text-lg mb-6">Ticket not found</Text>
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Generate a mock QR code data
  const qrCodeData = `EVENT:${event.id}|USER:${user.id}|TICKET:${Date.now()}`;

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
            <Text className="text-white text-sm font-bold">{Date.now().toString().slice(-8)}</Text>
          </View>
        </View>

        {/* Event Image */}
        <Image
          source={{ uri: event.image }}
          className="w-full h-[200px]"
          resizeMode="cover"
        />

        {/* Event Info */}
        <View className="p-5">
          <Text className="text-white text-2xl font-bold mb-1">{event.title}</Text>
          <Text className="text-[#9333EA] text-sm font-semibold mb-5">by {event.organizerName}</Text>

          <View className="flex-row mb-4 items-start">
            <MaterialIcons name="calendar-today" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs mb-1">Date</Text>
              <Text className="text-white text-sm mb-0.5">
                {formatDate(event.date)} at {event.time}
              </Text>
            </View>
          </View>

          <View className="flex-row mb-4 items-start">
            <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs mb-1">Venue</Text>
              <Text className="text-white text-sm mb-0.5">{event.venue}</Text>
              <Text className="text-white text-sm mb-0.5">{event.city}</Text>
            </View>
          </View>

          <View className="flex-row mb-4 items-start">
            <MaterialIcons name="person-outline" size={20} color="#9CA3AF" style={{ marginRight: 12, marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-[#9CA3AF] text-xs mb-1">Attendee</Text>
              <Text className="text-white text-sm mb-0.5">{user.name}</Text>
              <Text className="text-white text-sm mb-0.5">{user.email}</Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View className="p-5 border-t border-[#374151] items-center">
          <Text className="text-white text-base font-semibold mb-4">Scan QR Code at Entry</Text>
          <View className="bg-white p-5 rounded-xl mb-3">
            <View className="w-[200px] h-[200px] bg-[#F3F4F6] items-center justify-center rounded-lg">
              <Text className="text-[#6B7280] text-base font-bold mb-2">QR CODE</Text>
              <Text className="text-[#9CA3AF] text-[10px] text-center px-2.5">{qrCodeData}</Text>
            </View>
          </View>
          <Text className="text-[#9CA3AF] text-xs text-center">
            Please arrive 15 minutes before the event starts
          </Text>
        </View>

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
      <View className="flex-row gap-3 px-5">
        <TouchableOpacity
          className="flex-1 bg-[#9333EA] py-4 rounded-xl items-center"
          onPress={() => {
            // Dummy download action
            console.log('Download ticket');
          }}
        >
          <Text className="text-white text-base font-semibold">Download Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#1F1F1F] border border-[#374151] py-4 rounded-xl items-center"
          onPress={() => {
            // Dummy share action
            console.log('Share ticket');
          }}
        >
          <Text className="text-white text-base font-semibold">Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

