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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { eventsAPI } from '@/lib/api/events';
import { Modal } from '@/components/Modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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
  imageUri: string | null;
  imageUrl: string | null;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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
    imageUri: null,
    imageUrl: null,
  });

  const categories = ['Music', 'Technology', 'Festival', 'Sports', 'Arts', 'Business', 'Other'];

  const handleInputChange = (field: keyof EventFormData, value: string | Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload event images.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setFormData((prev) => ({ ...prev, imageUri }));

      // Upload image immediately
      await uploadImage(imageUri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      console.log('🔄 Starting image upload...');
      const response = await eventsAPI.uploadEventImage(imageUri);
      if (response.success) {
        console.log('✅ Image upload successful:', response.imageUrl);
        setFormData((prev) => ({ ...prev, imageUrl: response.imageUrl }));
      } else {
        console.error('❌ Upload failed - response not successful:', response);
        // Don't show error alert - image is optional
        console.warn('Image upload failed, but continuing without image (optional)');
        // Clear the imageUri so we don't try to upload again
        setFormData((prev) => ({ ...prev, imageUri: null, imageUrl: null }));
      }
    } catch (error: any) {
      console.error('❌ Upload error caught:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      // Don't show error alert - image is optional
      console.warn('Image upload failed, but continuing without image (optional)');
      // Clear the imageUri so we don't try to upload again
      setFormData((prev) => ({ ...prev, imageUri: null, imageUrl: null }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    if (!formData.eventName || !formData.eventLocation || !formData.eventDate || !formData.eventCity) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Event Name, Location, Date, City)');
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      Alert.alert('Validation Error', 'Please provide an event description (at least 10 characters)');
      return;
    }

    if (!formData.email || !formData.phone) {
      Alert.alert('Validation Error', 'Please fill in your email and phone number');
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
      // If image was selected but not uploaded yet, try to upload it (optional)
      let imageUrl = formData.imageUrl;
      if (formData.imageUri && !formData.imageUrl) {
        setUploadingImage(true);
        try {
          const uploadResponse = await eventsAPI.uploadEventImage(formData.imageUri);
          if (uploadResponse.success) {
            imageUrl = uploadResponse.imageUrl;
            setFormData((prev) => ({ ...prev, imageUrl }));
          } else {
            // Image upload failed, but continue without image (it's optional)
            console.warn('Image upload failed, continuing without image');
            imageUrl = '';
          }
        } catch (uploadError: any) {
          // Image upload failed, but continue without image (it's optional)
          console.warn('Image upload error, continuing without image:', uploadError.message);
          imageUrl = '';
        } finally {
          setUploadingImage(false);
        }
      }

      const eventDate = formData.eventDate.toISOString().split('T')[0];
      const response = await eventsAPI.createEvent({
        title: formData.eventName,
        description: formData.description,
        date: eventDate,
        time: '18:00', // Default time
        location: `${formData.eventLocation}, ${formData.eventCity}`,
        image: imageUrl || '',
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
            <View>
              {Platform.OS === 'ios' && (
                <View className="flex-row justify-end gap-2 mt-2 mb-2">
                  <TouchableOpacity
                    className="bg-[#1F1F1F] px-4 py-2 rounded-lg"
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text className="text-white text-sm">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-[#9333EA] px-4 py-2 rounded-lg"
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text className="text-white text-sm font-semibold">Done</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={formData.eventDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      handleInputChange('eventDate', selectedDate);
                    }
                  } else {
                    // iOS - update date as user scrolls
                    if (selectedDate) {
                      handleInputChange('eventDate', selectedDate);
                    }
                  }
                }}
              />
            </View>
          )}

          <Text className="text-white text-sm font-semibold mb-2 mt-4">Event City</Text>
          <TextInput
            className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base"
            placeholder="Enter city name"
            placeholderTextColor="#6B7280"
            value={formData.eventCity}
            onChangeText={(value) => handleInputChange('eventCity', value)}
          />

          <Text className="text-white text-sm font-semibold mb-2 mt-4">
            Event Thumbnail <Text className="text-[#6B7280] text-xs">(Optional)</Text>
          </Text>
          <TouchableOpacity
            className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-4 px-4 items-center justify-center"
            onPress={pickImage}
            disabled={uploadingImage}
          >
            {formData.imageUri ? (
              <View className="w-full items-center">
                <Image
                  source={{ uri: formData.imageUri }}
                  className="w-full h-[200px] rounded-lg mb-2"
                  resizeMode="cover"
                />
                {uploadingImage && (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#9333EA" size="small" />
                    <Text className="text-[#9333EA] text-sm ml-2">Uploading...</Text>
                  </View>
                )}
                {formData.imageUrl && !uploadingImage && (
                  <Text className="text-[#10B981] text-sm">✓ Image uploaded</Text>
                )}
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => setFormData((prev) => ({ ...prev, imageUri: null, imageUrl: null }))}
                >
                  <Text className="text-[#EF4444] text-sm">Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center">
                <MaterialIcons name="add-photo-alternate" size={24} color="#9333EA" />
                <Text className="text-[#9333EA] text-base font-semibold ml-2">
                  {uploadingImage ? 'Uploading...' : 'Select Image from Gallery'}
                </Text>
              </View>
            )}
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

