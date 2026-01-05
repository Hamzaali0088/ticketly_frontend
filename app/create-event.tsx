import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { mockUser } from '@/data/mockData';
import { Modal } from '@/components/Modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  const user = useAppStore((state) => state.user) || mockUser;
  const addEvent = useAppStore((state) => state.addEvent);
  
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    companyName: user.companyName || '',
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

  const handleSubmit = () => {
    if (!formData.eventCategory || !formData.description) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Create new event
    const newEvent = {
      id: `event-${Date.now()}`,
      title: formData.eventName,
      description: formData.description,
      fullDescription: formData.description,
      date: formData.eventDate!.toISOString().split('T')[0],
      time: '7:00 PM',
      venue: formData.eventLocation,
      city: formData.eventCity,
      category: formData.eventCategory,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      organizerId: user.id,
      organizerName: formData.companyName || user.name || 'Event Organizer',
      accessType: 'open' as const,
      registeredUsers: [],
      likedUsers: [],
    };

    addEvent(newEvent);
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Event</Text>
            <View style={{ width: 30 }} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fatima Ali"
              placeholderTextColor="#6B7280"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. fatimaali@gmail.com"
              placeholderTextColor="#6B7280"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countryCode}>
                <Text style={styles.countryCodeText}>PK</Text>
                <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="+92 334495437"
                placeholderTextColor="#6B7280"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paymo events"
              placeholderTextColor="#6B7280"
              value={formData.companyName}
              onChangeText={(value) => handleInputChange('companyName', value)}
            />

            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Catcha cat"
              placeholderTextColor="#6B7280"
              value={formData.eventName}
              onChangeText={(value) => handleInputChange('eventName', value)}
            />

            <Text style={styles.label}>Event Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g LUMS"
              placeholderTextColor="#6B7280"
              value={formData.eventLocation}
              onChangeText={(value) => handleInputChange('eventLocation', value)}
            />

            <Text style={styles.label}>Event Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, !formData.eventDate && styles.placeholder]}>
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

            <Text style={styles.label}>Event City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city name"
              placeholderTextColor="#6B7280"
              value={formData.eventCity}
              onChangeText={(value) => handleInputChange('eventCity', value)}
            />

            <TouchableOpacity style={styles.nextButton} onPress={handleStep1Next}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleStep2Back}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Event Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.datePickerText, !formData.eventDate && styles.placeholder]}>
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

          <Text style={styles.label}>Event City</Text>
          <TouchableOpacity style={styles.dropdownButton}>
            <Text style={[styles.dropdownText, !formData.eventCity && styles.placeholder]}>
              {formData.eventCity || 'Select City'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <Text style={styles.label}>Event Category</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
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
            <Text style={[styles.dropdownText, !formData.eventCategory && styles.placeholder]}>
              {formData.eventCategory || 'Select Category'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <Text style={styles.label}>What is your event about</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter a description..."
            placeholderTextColor="#6B7280"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
            <Text style={styles.createButtonText}>Create Event</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
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
  form: {
    paddingHorizontal: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCode: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },
  datePickerButton: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdownButton: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  placeholder: {
    color: '#6B7280',
  },
  nextButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

