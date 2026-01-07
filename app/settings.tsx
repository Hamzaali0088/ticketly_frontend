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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.tabActive]}
            onPress={() => setActiveTab('security')}
          >
            <Text style={[styles.tabText, activeTab === 'security' && styles.tabTextActive]}>
              Security
            </Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Tab */}
        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Update Your Name</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
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
              <Text style={styles.errorText}>{nameError}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loadingName && styles.primaryButtonDisabled]}
              onPress={handleUpdateName}
              disabled={loadingName}
            >
              {loadingName ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Update Name</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Change Email</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
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
              <Text style={styles.errorText}>{emailError}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loadingEmail && styles.primaryButtonDisabled]}
              onPress={handleUpdateEmail}
              disabled={loadingEmail}
            >
              {loadingEmail ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Update Email</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Change Password</Text>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#6B7280"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="Enter new password (min 8 characters)"
              placeholderTextColor="#6B7280"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="Confirm new password"
              placeholderTextColor="#6B7280"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loadingPassword && styles.primaryButtonDisabled]}
              onPress={handleUpdatePassword}
              disabled={loadingPassword}
            >
              {loadingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1F1F1F',
  },
  tabActive: {
    backgroundColor: '#9333EA',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1F1F1F',
    marginVertical: 32,
  },
});

