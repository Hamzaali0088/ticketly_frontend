import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI } from '@/lib/api/events';
import { Modal } from '@/components/Modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator } from 'react-native';

interface EventFormData {
  // Step 1
  name: string;
  email: string;
  phone: string;
  companyName: string;
  eventName: string;
  eventLocation: string;
  eventDate: Date | null;
  eventCity: string;
  // Step 2
  eventCategory: string;
  description: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    eventName: '',
    eventLocation: '',
    eventDate: null,
    eventCity: '',
    eventCategory: '',
    description: '',
  });

  const categories = ['Music', 'Technology', 'Festival', 'Sports', 'Arts', 'Business', 'Other'];

  const handleInputChange = (field: keyof EventFormData, value: string | Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStep1Next = () => {
    if (!formData.eventName || !formData.eventLocation || !formData.eventDate || !formData.eventCity) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    setStep(2);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!formData.eventCategory || !formData.description || !formData.eventDate) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const isAuthenticated = useAppStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to create an event', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    setLoading(true);
    try {
      const eventDate = formData.eventDate.toISOString().split('T')[0];
      const response = await eventsAPI.createEvent({
        title: formData.eventName,
        description: formData.description,
        date: eventDate,
        time: '18:00', // Default time
        location: `${formData.eventLocation}, ${formData.eventCity}`,
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        email: formData.email,
        phone: formData.phone,
        ticketPrice: 0, // Default price
        totalTickets: 100, // Default tickets
      });

      if (response.success) {
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', response.message || 'Failed to create event');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  if (step === 1) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-[#0F0F0F]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between pt-[60px] px-5 pb-5">
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Create Event</Text>
            <View style={{ width: 30 }} />
          </View>

          <View className="px-5">
            <Text className="text-white text-sm font-semibold mb-2 mt-4">Name</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
              placeholder="e.g. Fatima Ali"
              placeholderTextColor="#6B7280"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Email</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
              placeholder="e.g. fatimaali@gmail.com"
              placeholderTextColor="#6B7280"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Phone Number</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-3 flex-row items-center gap-2">
                <Text className="text-white text-base font-semibold">PK</Text>
                <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TextInput
                className="flex-1 bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
                placeholder="+92 334495437"
                placeholderTextColor="#6B7280"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Company Name</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
              placeholder="e.g. Paymo events"
              placeholderTextColor="#6B7280"
              value={formData.companyName}
              onChangeText={(value) => handleInputChange('companyName', value)}
            />

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Event Name</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
              placeholder="e.g. Catcha cat"
              placeholderTextColor="#6B7280"
              value={formData.eventName}
              onChangeText={(value) => handleInputChange('eventName', value)}
            />

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Event Location</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
              placeholder="e.g LUMS"
              placeholderTextColor="#6B7280"
              value={formData.eventLocation}
              onChangeText={(value) => handleInputChange('eventLocation', value)}
            />

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Event Date</Text>
            <TouchableOpacity
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 flex-row justify-between items-center"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className={`text-base ${formData.eventDate ? 'text-white' : 'text-[#6B7280]'}`}>
                {formData.eventDate
                  ? formData.eventDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  : 'Select Date'}
              </Text>
              <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.eventDate || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    handleInputChange('eventDate', selectedDate);
                  }
                }}
              />
            )}

            <Text className="text-white text-sm font-semibold mb-2 mt-4">Event City</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
              placeholder="Enter city name"
              placeholderTextColor="#6B7280"
              value={formData.eventCity}
              onChangeText={(value) => handleInputChange('eventCity', value)}
            />

            <TouchableOpacity className="bg-[#9333EA] py-4 rounded-xl items-center mt-8" onPress={handleStep1Next}>
              <Text className="text-white text-base font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0F0F0F]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-[60px] px-5 pb-5">
          <TouchableOpacity onPress={handleStep2Back}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Create Event</Text>
          <View style={{ width: 30 }} />
        </View>

        <View className="px-5">
          <Text className="text-white text-sm font-semibold mb-2 mt-4">Event Date</Text>
          <TouchableOpacity
            className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 flex-row justify-between items-center"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className={`text-base ${formData.eventDate ? 'text-white' : 'text-[#6B7280]'}`}>
              {formData.eventDate
                ? formData.eventDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
                : 'Select Date'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.eventDate || new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  handleInputChange('eventDate', selectedDate);
                }
              }}
            />
          )}

          <Text className="text-white text-sm font-semibold mb-2 mt-4">Event City</Text>
          <TouchableOpacity className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 flex-row justify-between items-center">
            <Text className={`text-base ${formData.eventCity ? 'text-white' : 'text-[#6B7280]'}`}>
              {formData.eventCity || 'Select City'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <Text className="text-white text-sm font-semibold mb-2 mt-4">Event Category</Text>
          <TouchableOpacity
            className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 flex-row justify-between items-center"
            onPress={() => {
              Alert.alert(
                'Select Category',
                '',
                categories.map((cat) => ({
                  text: cat,
                  onPress: () => handleInputChange('eventCategory', cat),
                }))
              );
            }}
          >
            <Text className={`text-base ${formData.eventCategory ? 'text-white' : 'text-[#6B7280]'}`}>
              {formData.eventCategory || 'Select Category'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <Text className="text-white text-sm font-semibold mb-2 mt-4">What is your event about</Text>
          <TextInput
            className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base min-h-[120px] pt-3.5"
            placeholder="Enter a description..."
            placeholderTextColor="#6B7280"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`bg-[#9333EA] py-4 rounded-xl items-center mt-8 ${loading ? 'opacity-60' : ''}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Create Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Success!"
        message="Your request has been sent, we will contact you shortly."
        primaryButtonText="OK"
        onPrimaryPress={handleSuccessClose}
      />
    </KeyboardAvoidingView>
  );
}

