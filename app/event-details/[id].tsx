import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
      setIsLiked(event.likedUsers.includes(user.id));
      setIsRegistered(event.registeredUsers.includes(user.id));
    }
  }, [event, user]);

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleLike = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like events');
      router.push('/login');
      return;
    }
    toggleEventLike(event.id, user.id);
    setIsLiked(!isLiked);
  };

  const handleRegister = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to register for events');
      router.push('/login');
      return;
    }

    if (isRegistered) {
      Alert.alert('Already Registered', 'You are already registered for this event');
      router.push(`/ticket/${event.id}`);
      return;
    }

    registerForEvent(event.id, user.id);
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.image }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.likeButton}
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
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={styles.accessBadge}>
              <Text style={styles.accessText}>
                {event.accessType === 'open' ? 'Open for all' : event.accessType === 'paid' ? 'Paid' : 'Invite only'}
              </Text>
            </View>
          </View>

          {/* Registration Deadline */}
          {event.registrationDeadline && (
            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={20} color="#9CA3AF" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Registration Deadline</Text>
                <Text style={styles.infoValue}>
                  {formatDate(event.registrationDeadline)}, {formatTime(event.time)}
                </Text>
                {timeRemaining && (
                  <Text style={styles.timeRemaining}>
                    Time remaining: {timeRemaining}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Event Date & Time */}
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color="#9CA3AF" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Event Date & Time</Text>
              <Text style={styles.infoValue}>
                {formatDate(event.date)}, {formatTime(event.time)} till
              </Text>
              {event.endTime && (
                <Text style={styles.infoValue}>
                  {formatDate(event.date)}, {formatTime(event.endTime)}
                </Text>
              )}
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{event.venue}</Text>
              <Text style={styles.infoValue}>{event.city}</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="#9CA3AF" style={styles.arrowIcon} />
          </View>

          {/* Price */}
          <View style={styles.infoRow}>
            <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Registration Starting From</Text>
              <Text style={styles.infoValue}>
                {event.price ? `PKR ${event.price.toLocaleString()}` : 'Fee would be calculated at the time of checkout'}
              </Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isRegistered && styles.registeredButton]}
            onPress={isRegistered ? handleViewTicket : handleRegister}
          >
            <Text style={styles.registerButtonText}>
              {isRegistered ? 'View Ticket' : 'Register Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Event Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Event Description</Text>
          <Text style={styles.descriptionText}>
            {event.fullDescription || event.description}
          </Text>
          
          {event.entryPolicy && (
            <>
              <Text style={styles.policyTitle}>Entry Policy:</Text>
              <Text style={styles.policyText}>• {event.entryPolicy}</Text>
            </>
          )}
          
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>View more</Text>
            <MaterialIcons name="expand-more" size={16} color="#9333EA" />
          </TouchableOpacity>
        </View>

        {/* Organized By */}
        <View style={styles.organizerSection}>
          <Text style={styles.sectionTitle}>Organized By</Text>
          <Text style={styles.organizerName}>{event.organizerName}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  accessBadge: {
    backgroundColor: '#374151',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  accessText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 2,
  },
  timeRemaining: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  arrowIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  registerButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registeredButton: {
    backgroundColor: '#10B981',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  policyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  policyText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 22,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  viewMoreText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  organizerSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
  },
  organizerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    marginBottom: 24,
  },
});

