import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Event } from '@/data/mockData';
import { useRouter } from 'expo-router';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const router = useRouter();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/event-details/${event.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  };

  const { month, day } = formatDate(event.date);

  return (
    <TouchableOpacity
      className="bg-[#1F1F1F] rounded-xl overflow-hidden mb-4 w-[48%]"
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View className="w-full h-[180px] relative">
        <Image
          source={{ uri: event.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute top-2 right-2 bg-[#EF4444] rounded-lg py-1.5 px-2.5 items-center min-w-[50px]">
          <Text className="text-white text-[10px] font-semibold uppercase">{month}</Text>
          <Text className="text-white text-base font-bold">{day}</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-white text-base font-semibold mb-2" numberOfLines={2}>
          {event.title}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-xs mr-1">📍</Text>
          <Text className="text-[#9CA3AF] text-xs flex-1" numberOfLines={1}>
            {event.venue.length > 30 ? `${event.venue.substring(0, 30)}...` : event.venue}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

