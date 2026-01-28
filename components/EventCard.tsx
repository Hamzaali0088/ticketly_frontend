import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Event } from '@/data/mockData';
import { useRouter } from 'expo-router';
import { getEventImageUrl } from '@/lib/utils/imageUtils';

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

  // Price / access label (handle optional price safely)
  const priceValue = typeof event.price === 'number' ? event.price : 0;
  const isFree = priceValue === 0;
  const priceLabel = isFree
    ? 'Free'
    : `Rs ${priceValue.toLocaleString('en-PK')}`;

  // Prepare attendee avatars (host + joined users)
  const hostAvatarUrl = event.hostAvatarUrl || event.image;
  const joinedUsers = event.joinedUsers || [];
  const joinedCount = event.joinedCount ?? joinedUsers.length ?? 0;
  const visibleJoined = joinedUsers.slice(0, 2);
  const remainingCount = Math.max(joinedCount - visibleJoined.length, 0);

  return (
    <TouchableOpacity
      className="bg-[#1F1F1F] rounded-xl overflow-hidden mb-4 w-[48%]"
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View className="w-full h-[180px] relative">
        <Image
          source={{ uri: getEventImageUrl(event) || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {/* Price pill (e.g. Free / Rs 500) */}
        <View className="absolute bottom-2 left-3 bg-black/80 rounded-full px-3 py-1 ">
          <Text className="text-white text-[11px] font-semibold">
            {priceLabel}
          </Text>
        </View>
        {/* Joined users avatars pill on image */}
        {(joinedUsers.length > 0 || hostAvatarUrl) && (
          <View className="absolute bottom-0 right-2 flex-row items-center translate-y-1/2">
            {/* Joined users (small overlapping avatars) */}
            {joinedUsers.length > 0 && (
              <View className="flex-row items-center bg-black/80 rounded-full p-1 mr-1">
                {visibleJoined.map((user, index) => (
                  <Image
                    key={user.id}
                    source={{
                      uri:
                        user.avatarUrl ||
                        'https://images.unsplash.com/photo-1494797710133-75adf6c1f4a3?w=200',
                    }}
                    className="w-5 h-5 rounded-full border border-[#111827]"
                    style={{ marginLeft: index === 0 ? 0 : -6 }}
                    resizeMode="cover"
                  />
                ))}
                {remainingCount > 0 && (
                  <View className="ml-1 px-1.5 py-[1px] rounded-full bg-[#111827]">
                    <Text className="text-white text-[8px] font-medium">
                      +{remainingCount}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Host avatar on image (slightly larger) */}

          </View>
        )}

      </View>
      <View className="p-3">
        {/* Date & time row (e.g. 15 Feb 11:00) */}
        <Text className="text-[#9CA3AF] text-[11px] mb-1">
          {new Date(event.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          })}{' '}
          {event.time}
        </Text>
        <Text className="text-white text-base font-semibold mb-2" numberOfLines={2}>
          {event.title}
        </Text>
        {/* <View className="flex-row items-center">
          <Text className="text-xs mr-1">📍</Text>
          <Text className="text-[#9CA3AF] text-xs flex-1" numberOfLines={1}>
            {event.venue.length > 30 ? `${event.venue.substring(0, 30)}...` : event.venue}
          </Text>
        </View> */}

        {/* Host row (text + avatar). Joined users are shown on the image pill above */}
        {hostAvatarUrl && (
          <View className="flex-row items-center justify-between">
            {/* Host */}
            <View className="flex-row items-center gap-2">
              {hostAvatarUrl && (
                <Image
                  source={{
                    uri:
                      hostAvatarUrl ||
                      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
                  }}
                  className="w-5 h-5 rounded-full border border-[#111827] bg-black/80"
                  resizeMode="cover"
                />
              )}
              <View>
                <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                  {event.organizerName || 'Host'}
                </Text>
                <Text className="text-[#9CA3AF] text-[10px]">(Host)</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

