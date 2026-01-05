import React from 'react';
import {
  View,
  Text,
  StyleSheet,
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
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
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
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Ticket</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Ticket Card */}
      <View style={styles.ticketCard}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>ticketly</Text>
          </View>
          <View style={styles.ticketNumberContainer}>
            <Text style={styles.ticketNumberLabel}>Ticket #</Text>
            <Text style={styles.ticketNumber}>{Date.now().toString().slice(-8)}</Text>
          </View>
        </View>

        {/* Event Image */}
        <Image
          source={{ uri: event.image }}
          style={styles.eventImage}
          resizeMode="cover"
        />

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.organizerName}>by {event.organizerName}</Text>

          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color="#9CA3AF" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(event.date)} at {event.time}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#9CA3AF" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{event.venue}</Text>
              <Text style={styles.infoValue}>{event.city}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person-outline" size={20} color="#9CA3AF" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Attendee</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Scan QR Code at Entry</Text>
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodePlaceholder}>
              <Text style={styles.qrCodeText}>QR CODE</Text>
              <Text style={styles.qrCodeData}>{qrCodeData}</Text>
            </View>
          </View>
          <Text style={styles.qrNote}>
            Please arrive 15 minutes before the event starts
          </Text>
        </View>

        {/* Ticket Footer */}
        <View style={styles.ticketFooter}>
          <Text style={styles.footerText}>
            This ticket is valid for one person only
          </Text>
          <Text style={styles.footerText}>
            For support, contact: support@ticketly.com
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => {
            // Dummy download action
            console.log('Download ticket');
          }}
        >
          <Text style={styles.downloadButtonText}>Download Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            // Dummy share action
            console.log('Share ticket');
          }}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  ticketNumberContainer: {
    alignItems: 'flex-end',
  },
  ticketNumberLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  ticketNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventInfo: {
    padding: 20,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  organizerName: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  qrSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  qrTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  qrCodeText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  qrCodeData: {
    color: '#9CA3AF',
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  qrNote: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  ticketFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#0F0F0F',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
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
  backButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

