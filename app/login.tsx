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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleGoogleLogin = () => {
    // Dummy Google login - just log in with mock user
    console.log('Google login pressed');
    login(mockUser);
    router.replace('/(tabs)');
  };

  const handleEmailSubmit = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    // Dummy OTP send - just show OTP input
    console.log('OTP sent to:', email);
    setOtpSent(true);
    Alert.alert('OTP Sent', `OTP has been sent to ${email}. Use any 6-digit code for demo.`);
  };

  const handleOTPSubmit = () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    // Dummy OTP verification - just log in
    console.log('OTP verified:', otp);
    login(mockUser);
    router.replace('/(tabs)');
  };

  if (loginMethod === 'email' && !otpSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>ticketly</Text>
            <Text style={styles.subtitle}>Enter your email to receive OTP</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. fatimaali@gmail.com"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleEmailSubmit}>
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setLoginMethod(null)}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (loginMethod === 'email' && otpSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>ticketly</Text>
            <Text style={styles.subtitle}>Enter the OTP sent to {email}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#6B7280"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleOTPSubmit}>
              <Text style={styles.primaryButtonText}>Verify OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setOtpSent(false);
                setOtp('');
              }}
            >
              <Text style={styles.linkText}>Resend OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setLoginMethod(null);
                setOtpSent(false);
                setOtp('');
                setEmail('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>ticketly</Text>
          <Text style={styles.subtitle}>Login via google account to proceed.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => setLoginMethod('email')}
          >
            <Text style={styles.emailButtonText}>Continue with Email + OTP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Contact Us</Text>
          <Text style={styles.footerText}>Privacy Policy</Text>
          <Text style={styles.footerText}>Terms of Service</Text>
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>📷</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>2025 Ticketly. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 48,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
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
  primaryButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    backgroundColor: '#1F1F1F',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  copyright: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});

