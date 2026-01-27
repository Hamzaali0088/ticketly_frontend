import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { ticketsAPI, type Ticket } from '@/lib/api/tickets';
import { paymentsAPI } from '@/lib/api/payments';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_BASE_URL } from '@/lib/config';
import { getEventImageUrl } from '@/lib/utils/imageUtils';
import QRCode from 'react-native-qrcode-svg';

export default function TicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((state) => state.user);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment upload states
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [uploadingPayment, setUploadingPayment] = useState(false);

  // QR code loading states
  const [qrImageLoaded, setQrImageLoaded] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);

  // Helper function to get full payment screenshot URL (same logic as profile image)
  const getPaymentScreenshotUrl = () => {
    // If user has selected a new screenshot (local URI), use it
    if (screenshotUri && (screenshotUri.startsWith('file://') || screenshotUri.startsWith('content://'))) {
      return screenshotUri;
    }

    // Otherwise, use the payment screenshot URL from ticket
    if (!ticket?.paymentScreenshotUrl) return null;

    const paymentScreenshotUrl = ticket.paymentScreenshotUrl;

    // If backend returned a localhost URL (old data), rewrite it to use the current API base URL
    if (
      paymentScreenshotUrl.includes('localhost') ||
      paymentScreenshotUrl.includes('127.0.0.1')
    ) {
      // Strip `/api` from API_BASE_URL and keep only the path part from the original URL
      const baseUrl = API_BASE_URL.replace('/api', '');
      try {
        const url = new URL(paymentScreenshotUrl);
        const path = url.pathname || '';
        return `${baseUrl}${path}`;
      } catch {
        // Fallback: if URL parsing fails, try to find `/uploads` in the string
        const uploadsIndex = paymentScreenshotUrl.indexOf('/uploads');
        if (uploadsIndex !== -1) {
          const path = paymentScreenshotUrl.substring(uploadsIndex);
          return `${baseUrl}${path}`;
        }
      }
    }

    // If it's already a full URL, return it as is
    if (paymentScreenshotUrl.startsWith('http')) {
      return paymentScreenshotUrl;
    }

    // Otherwise, construct from relative path and API_BASE_URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${paymentScreenshotUrl}`;
  };

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
          console.log('📋 Ticket data received:', {
            hasEvent: !!response.ticket.event,
            hasCreatedBy: !!response.ticket.event?.createdBy,
            createdByPhone: response.ticket.event?.createdBy?.phone,
            eventPhone: response.ticket.event?.phone,
            organizerPhone: response.ticket.organizer?.phone,
            paymentScreenshotUrl: response.ticket.paymentScreenshotUrl,
          });
          setTicket(response.ticket);
          // Don't set screenshotUri from ticket - let getPaymentScreenshotUrl() handle it
          // This ensures we use the same logic as profile image (prefer URL, handle localhost, etc.)
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

  // Refresh ticket after payment submission
  const refreshTicket = async () => {
    if (!id) return;
    try {
      const response = await ticketsAPI.getTicketById(id);
      if (response.success && response.ticket) {
        setTicket(response.ticket);
      }
    } catch (err) {
      console.error('Error refreshing ticket:', err);
    }
  };

  // Pick payment screenshot from gallery
  const pickScreenshot = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to upload payment screenshots.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        // Use 3:4 aspect ratio for payment screenshots (taller images)
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setScreenshotUri(asset.uri);
        console.log('💳 Screenshot selected:', {
          uri: asset.uri.substring(0, 50) + '...',
          type: asset.type,
          width: asset.width,
          height: asset.height,
        });
      }
    } catch (error: any) {
      console.error('Error picking screenshot:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Submit payment with screenshot
  const handleSubmitPayment = async () => {
    // Minimal log for debugging
    console.log('🔵 Submit payment:', {
      ticketId: ticket?.id,
      hasScreenshot: !!screenshotUri,
    });

    if (!ticket) {
      console.error('❌ No ticket available');
      Alert.alert('Error', 'Ticket information not available.');
      return;
    }

    if (!screenshotUri) {
      console.error('❌ No screenshot selected');
      Alert.alert('Screenshot Required', 'Please select a payment screenshot to upload.');
      return;
    }

    try {
      setUploadingPayment(true);

      // Amount is derived from ticket.event.ticketPrice on backend (source of truth)
      const response = await paymentsAPI.submitPayment(
        ticket.id,
        paymentMethod,
        screenshotUri
      );

      if (response.success) {
        console.log('✅ Payment submitted successfully:', response);

        // Clear screenshot selection
        setScreenshotUri(null);

        // Refresh ticket to get updated status
        await refreshTicket();

        Alert.alert(
          'Screenshot Updated',
          'Your payment screenshot has been updated successfully. Your ticket is in review and our team will verify it within 24-48 hours.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally navigate back or stay on screen
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Payment submission failed');
      }
    } catch (error: any) {
      console.error('❌ Payment submission error:', error);
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        'Failed to submit payment. Please try again.';
      Alert.alert('Payment Submission Failed', errorMessage);
    } finally {
      setUploadingPayment(false);
    }
  };

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
      case 'payment_in_review':
        return '#3B82F6'; // Blue for "waiting for approval"
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
        return 'Pending';
      case 'payment_in_review':
        return 'In Review';
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
            <Text className="text-white text-sm font-bold">{ticket.accessKey || ticket.id.slice(-8).toUpperCase()}</Text>
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
            source={{ uri: getEventImageUrl(ticket.event) || 'https://via.placeholder.com/400' }}
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

        {/* QR Code Section - Show for confirmed tickets */}
        {ticket.status === 'confirmed' && ticket.accessKey && (
          <View className="p-5 border-t border-[#374151] items-center">
            <Text className="text-white text-base font-semibold mb-4">Scan QR Code at Entry</Text>
            <View className="bg-white p-5 rounded-xl mb-3 items-center justify-center">
              {/* Always use SVG QR code for reliability */}
              <QRCode
                value={ticket.accessKey}
                size={200}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text className="text-[#9CA3AF] text-xs text-center">
              Please arrive 15 minutes before the event starts
            </Text>
          </View>
        )}

        {/* Access Key & QR Code Section - Show for non-confirmed tickets */}
        {ticket.status !== 'confirmed' && ticket.accessKey && (
          <View className="p-5 border-t border-[#374151]">
            {/* QR Code - Show prominently at the top */}
            {ticket.accessKey && (
              <View className="items-center mb-4">
                <Text className="text-white text-base font-semibold mb-3">Your Ticket QR Code</Text>
                <View className="bg-white p-4 rounded-xl items-center justify-center">
                  {/* Always use SVG QR code for reliability */}
                  <QRCode
                    value={ticket.accessKey}
                    size={200}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <View className="bg-[#F59E0B]/20 rounded-lg px-4 py-2 mt-3">
                  <Text className="text-[#F59E0B] text-xs text-center font-semibold">
                    Complete payment to activate this ticket
                  </Text>
                </View>
              </View>
            )}
            
            {/* Ticket Number */}
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <Text className="text-white text-sm font-semibold">Ticket Number</Text>
            </View>
            <View className="bg-[#0F0F0F] rounded-xl p-4 border border-[#374151]">
              <Text className="text-[#D1D5DB] text-xs font-mono text-center" selectable>
                {ticket.accessKey}
              </Text>
            </View>
          </View>
        )}

        {ticket.status === 'payment_in_review' && (
          <View className="p-5 border-t border-[#374151]">
            <View className="items-center mb-4">
              <Text className="text-[#3B82F6] text-base font-semibold mb-2">
                In Review
              </Text>
              <Text className="text-[#9CA3AF] text-sm text-center mb-1">
                Your payment screenshot has been submitted successfully.
              </Text>
              <Text className="text-[#9CA3AF] text-sm text-center mb-1">
                Our team will verify your payment within 24-48 hours.
              </Text>
              <Text className="text-[#9CA3AF] text-sm text-center">
                You can update the screenshot until verification is complete.
              </Text>
            </View>

            {/* Payment Method Selection */}
            <View className="mb-4">
              <Text className="text-[#9CA3AF] text-xs mb-2">Payment Method</Text>
              <View className="flex-row gap-2">
                {['bank_transfer', 'easypaisa', 'jazzcash', 'other'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    className={`px-3 py-2 rounded-lg border ${paymentMethod === method
                      ? 'bg-[#9333EA] border-[#9333EA]'
                      : 'bg-[#1F1F1F] border-[#374151]'
                      }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${paymentMethod === method ? 'text-white' : 'text-[#9CA3AF]'
                        }`}
                    >
                      {method === 'bank_transfer'
                        ? 'Bank'
                        : method === 'easypaisa'
                          ? 'EasyPaisa'
                          : method === 'jazzcash'
                            ? 'JazzCash'
                            : 'Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Event Creator Phone Number */}
              {(() => {
                const phoneNumber = ticket.event?.createdBy?.phone || ticket.event?.phone || ticket.organizer?.phone;
                return phoneNumber ? (
                  <View className="mt-3">
                    <Text className="text-[#9CA3AF] text-xs mb-1">
                      Send payment to: {phoneNumber}
                    </Text>
                  </View>
                ) : null;
              })()}
            </View>

            {/* Screenshot Display/Update */}
            <View className="mb-4">
              <Text className="text-[#9CA3AF] text-xs mb-2">Payment Screenshot</Text>
              {getPaymentScreenshotUrl() ? (
                <View className="relative">
                  <Image
                    source={{ uri: getPaymentScreenshotUrl()! }}
                    className="w-full h-[200px] rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setScreenshotUri(null)}
                    className="absolute top-2 right-2 bg-[#EF4444] p-2 rounded-full"
                  >
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickScreenshot}
                    className="absolute bottom-2 right-2 bg-[#9333EA] px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-semibold ml-1">Update</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickScreenshot}
                  className="border-2 border-dashed border-[#374151] rounded-xl p-8 items-center justify-center bg-[#0F0F0F]"
                >
                  <MaterialIcons name="add-photo-alternate" size={48} color="#9CA3AF" />
                  <Text className="text-[#9CA3AF] text-sm mt-2 text-center">
                    Tap to select payment screenshot
                  </Text>
                  <Text className="text-[#6B7280] text-xs mt-1 text-center">
                    JPEG, PNG, GIF, or WebP (Max 5MB)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Update Button */}
            <TouchableOpacity
              onPress={() => {
                if (!screenshotUri) {
                  Alert.alert('Screenshot Required', 'Please select a payment screenshot first.');
                  return;
                }
                if (uploadingPayment) {
                  return;
                }
                handleSubmitPayment();
              }}
              disabled={uploadingPayment || !screenshotUri}
              activeOpacity={0.7}
              style={{
                opacity: !screenshotUri || uploadingPayment ? 0.5 : 1,
              }}
              className={`py-4 rounded-xl items-center ${!screenshotUri || uploadingPayment
                ? 'bg-[#374151]'
                : 'bg-[#9333EA]'
                }`}
            >
              {uploadingPayment ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white text-base font-semibold ml-2">
                    Updating...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-semibold">
                  Update Screenshot
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {ticket.status === 'pending_payment' && (
          <View className="p-5 border-t border-[#374151]">
            <Text className="text-[#F59E0B] text-base font-semibold mb-2 text-center">
              Payment Pending
            </Text>
            <Text className="text-[#9CA3AF] text-sm text-center mb-4">
              Please upload a screenshot of your payment to confirm your ticket.
            </Text>

            {/* Payment Method Selection */}
            <View className="mb-4">
              <Text className="text-[#9CA3AF] text-xs mb-2">Payment Method</Text>
              <View className="flex-row gap-2">
                {['bank_transfer', 'easypaisa', 'jazzcash', 'other'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    className={`px-3 py-2 rounded-lg border ${paymentMethod === method
                      ? 'bg-[#9333EA] border-[#9333EA]'
                      : 'bg-[#1F1F1F] border-[#374151]'
                      }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${paymentMethod === method ? 'text-white' : 'text-[#9CA3AF]'
                        }`}
                    >
                      {method === 'bank_transfer'
                        ? 'Bank'
                        : method === 'easypaisa'
                          ? 'EasyPaisa'
                          : method === 'jazzcash'
                            ? 'JazzCash'
                            : 'Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Event Creator Phone Number */}
              {(() => {
                const phoneNumber = ticket.event?.createdBy?.phone || ticket.event?.phone || ticket.organizer?.phone;
                return phoneNumber ? (
                  <View className="mt-3">
                    <Text className="text-[#9CA3AF] text-xs mb-1">
                      Send payment to: {phoneNumber}
                    </Text>
                  </View>
                ) : null;
              })()}
            </View>

            {/* Screenshot Selection */}
            <View className="mb-4">
              <Text className="text-[#9CA3AF] text-xs mb-2">Payment Screenshot</Text>
              {screenshotUri ? (
                <View className="relative">
                  <Image
                    source={{ uri: screenshotUri }}
                    className="w-full h-[200px] rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setScreenshotUri(null)}
                    className="absolute top-2 right-2 bg-[#EF4444] p-2 rounded-full"
                  >
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickScreenshot}
                  className="border-2 border-dashed border-[#374151] rounded-xl p-8 items-center justify-center bg-[#0F0F0F]"
                >
                  <MaterialIcons name="add-photo-alternate" size={48} color="#9CA3AF" />
                  <Text className="text-[#9CA3AF] text-sm mt-2 text-center">
                    Tap to select payment screenshot
                  </Text>
                  <Text className="text-[#6B7280] text-xs mt-1 text-center">
                    JPEG, PNG, GIF, or WebP (Max 5MB)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => {
                console.log('🔵 TouchableOpacity onPress triggered');
                console.log('🔵 Button state check:', {
                  hasScreenshot: !!screenshotUri,
                  isUploading: uploadingPayment,
                  disabled: !screenshotUri || uploadingPayment,
                });
                if (!screenshotUri) {
                  Alert.alert('Screenshot Required', 'Please select a payment screenshot first.');
                  return;
                }
                if (uploadingPayment) {
                  console.log('⚠️ Already uploading, ignoring click');
                  return;
                }
                handleSubmitPayment();
              }}
              disabled={uploadingPayment}
              activeOpacity={0.7}
              style={{
                opacity: !screenshotUri || uploadingPayment ? 0.5 : 1,
              }}
              className={`py-4 rounded-xl items-center ${!screenshotUri || uploadingPayment
                ? 'bg-[#374151]'
                : 'bg-[#9333EA]'
                }`}
            >
              {uploadingPayment ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white text-base font-semibold ml-2">
                    Submitting...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-semibold">
                  Submit Payment
                </Text>
              )}
            </TouchableOpacity>
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

