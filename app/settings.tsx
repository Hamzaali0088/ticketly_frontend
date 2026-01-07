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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { authAPI } from '@/lib/api/auth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Edit Profile state
  const [name, setName] = useState(user?.fullName || '');
  const [loadingName, setLoadingName] = useState(false);
  
  // Security state
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    if (name === user?.fullName) {
      Alert.alert('Info', 'No changes made');
      return;
    }

    setLoadingName(true);
    setNameError('');
    try {
      const response = await authAPI.updateUser({ name: name.trim() });
      if (response.success) {
        if (response.user) {
          setUser(response.user);
        }
        Alert.alert('Success', 'Name updated successfully');
      } else {
        setNameError(response.message || 'Failed to update name');
      }
    } catch (error: any) {
      setNameError(error.response?.data?.message || 'Failed to update name. Please try again.');
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (email === user?.email) {
      Alert.alert('Info', 'No changes made');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoadingEmail(true);
    setEmailError('');
    try {
      const response = await authAPI.updateUser({ email: email.trim() });
      if (response.success) {
        if (response.user) {
          setUser(response.user);
        }
        Alert.alert('Success', 'Email updated successfully');
        setEmail(email.trim());
      } else {
        setEmailError(response.message || 'Failed to update email');
      }
    } catch (error: any) {
      setEmailError(error.response?.data?.message || 'Failed to update email. Please try again.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setLoadingPassword(true);
    setPasswordError('');
    try {
      const response = await authAPI.updateUser({ password: newPassword });
      if (response.success) {
        Alert.alert('Success', 'Password updated successfully', [
          { text: 'OK', onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
        ]);
      } else {
        setPasswordError(response.message || 'Failed to update password');
      }
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoadingPassword(false);
    }
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
        {/* Header */}
        <View className="flex-row items-center justify-between pt-[60px] px-5 pb-5">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View className="flex-row px-5 mb-6 gap-2">
          <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-lg ${activeTab === 'profile' ? 'bg-[#9333EA]' : 'bg-[#1F1F1F]'}`}
            onPress={() => setActiveTab('profile')}
          >
            <Text className={`text-sm font-semibold ${activeTab === 'profile' ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Edit Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-lg ${activeTab === 'security' ? 'bg-[#9333EA]' : 'bg-[#1F1F1F]'}`}
            onPress={() => setActiveTab('security')}
          >
            <Text className={`text-sm font-semibold ${activeTab === 'security' ? 'text-white' : 'text-[#9CA3AF]'}`}>
              Security
            </Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Tab */}
        {activeTab === 'profile' && (
          <View className="px-5">
            <Text className="text-white text-lg font-bold mb-5">Update Your Name</Text>
            <Text className="text-white text-sm font-semibold mb-2">Full Name</Text>
            <TextInput
              className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base mb-5 ${nameError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
              placeholder="Enter your full name"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              autoCapitalize="words"
            />
            {nameError && (
              <Text className="text-[#EF4444] text-xs mt-[-20px] mb-3 px-1">{nameError}</Text>
            )}

            <TouchableOpacity
              className={`bg-[#9333EA] py-4 rounded-xl items-center mb-6 ${loadingName ? 'opacity-60' : ''}`}
              onPress={handleUpdateName}
              disabled={loadingName}
            >
              {loadingName ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Update Name</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <View className="px-5">
            <Text className="text-white text-lg font-bold mb-5">Change Email</Text>
            <Text className="text-white text-sm font-semibold mb-2">Email</Text>
            <TextInput
              className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base mb-5 ${emailError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {emailError && (
              <Text className="text-[#EF4444] text-xs mt-[-20px] mb-3 px-1">{emailError}</Text>
            )}

            <TouchableOpacity
              className={`bg-[#9333EA] py-4 rounded-xl items-center mb-6 ${loadingEmail ? 'opacity-60' : ''}`}
              onPress={handleUpdateEmail}
              disabled={loadingEmail}
            >
              {loadingEmail ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Update Email</Text>
              )}
            </TouchableOpacity>

            <View className="h-px bg-[#1F1F1F] my-8" />

            <Text className="text-white text-lg font-bold mb-5">Change Password</Text>
            <Text className="text-white text-sm font-semibold mb-2">Current Password</Text>
            <View className="relative mb-5">
              <TextInput
                className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 pr-12 text-white text-base"
                placeholder="Enter current password"
                placeholderTextColor="#6B7280"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4 top-3.5 p-1"
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <MaterialIcons
                  name={showCurrentPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-white text-sm font-semibold mb-2">New Password</Text>
            <View className="relative mb-5">
              <TextInput
                className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 pr-12 text-white text-base ${passwordError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
                placeholder="Enter new password (min 8 characters)"
                placeholderTextColor="#6B7280"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4 top-3.5 p-1"
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <MaterialIcons
                  name={showNewPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-white text-sm font-semibold mb-2">Confirm New Password</Text>
            <View className="relative mb-5">
              <TextInput
                className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 pr-12 text-white text-base ${passwordError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
                placeholder="Confirm new password"
                placeholderTextColor="#6B7280"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4 top-3.5 p-1"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text className="text-[#EF4444] text-xs mt-[-20px] mb-3 px-1">{passwordError}</Text>
            )}

            <TouchableOpacity
              className={`bg-[#9333EA] py-4 rounded-xl items-center mb-6 ${loadingPassword ? 'opacity-60' : ''}`}
              onPress={handleUpdatePassword}
              disabled={loadingPassword}
            >
              {loadingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

