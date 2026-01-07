import React, { useState, useEffect } from 'react';
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
import { getAccessToken, getRefreshToken } from '@/lib/api/client';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'google' | 'email' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpError, setOtpError] = useState('');

  // Only check auth silently on mount - don't auto-redirect
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        // Try to get user profile to verify token is valid
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.user) {
            // Silently update auth state but don't redirect
            login(response.user);
          }
        } catch (error: any) {
          // If access token is expired, try refresh token
          if (error.response?.status === 401) {
            const refreshToken = await getRefreshToken();
            if (refreshToken) {
              try {
                const refreshResponse = await authAPI.refreshToken(refreshToken);
                if (refreshResponse.success) {
                  // Get profile with new token
                  const profileResponse = await authAPI.getProfile();
                  if (profileResponse.success && profileResponse.user) {
                    // Silently update auth state but don't redirect
                    login(profileResponse.user);
                  }
                }
              } catch (refreshError) {
                // Refresh failed, clear tokens - user will need to login
                console.log('Token refresh failed');
              }
            }
          }
        }
      }
    };
    checkAuth();
  }, []);

  const handleGoogleLogin = () => {
    // Google OAuth - redirect to backend
    Alert.alert('Info', 'Google login will be implemented with OAuth flow');
    // TODO: Implement Google OAuth flow
  };

  const handleSignup = async () => {
    // Clear previous error
    setErrorMessage('');

    if (!name || !email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.signup({ name, email, password });
      if (response.success) {
        // Automatically switch to login mode after successful signup
        // Clear name and password, keep email for convenience
        setName('');
        setPassword('');
        setErrorMessage('');
        setMode('login');
        setLoginMethod('email');

        Alert.alert('Success', 'Account created successfully! Please login with your email and password.');
      } else {
        // Show backend error message inline
        setErrorMessage(response.message || 'Failed to create account');
      }
    } catch (error: any) {
      // Extract error message from response and show inline
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create account. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      if (response.success && response.tempToken) {
        setTempToken(response.tempToken);
        setOtpSent(true);
        Alert.alert('OTP Sent', `OTP has been sent to ${email}. Please check your email.`);
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    // Clear previous error
    setOtpError('');

    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!tempToken) {
      setOtpError('Session expired. Please try logging in again.');
      setOtpSent(false);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOtp({ otp, tempToken });
      if (response.success && response.user) {
        // User is now logged in with tokens saved
        setOtpError('');
        login(response.user);
        // Redirect to home page immediately after successful login
        router.replace('/(tabs)');
        // Note: No need to set loading to false as we're redirecting
      } else {
        // Show backend error message inline
        setOtpError(response.message || 'Failed to verify OTP');
        setLoading(false);
      }
    } catch (error: any) {
      // Extract error message from response
      const errorMsg = error.response?.data?.message || error.message || 'Failed to verify OTP. Please try again.';
      setOtpError(errorMsg);
      setLoading(false);
    }
  };

  // Signup Form
  if (mode === 'signup' && loginMethod === 'email' && !otpSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>ticketly</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fatima Ali"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errorMessage && styles.inputError]}
              placeholder="e.g. fatimaali@gmail.com"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Clear error when user starts typing
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setMode('login');
                setName('');
                setEmail('');
                setPassword('');
                setErrorMessage('');
              }}
            >
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setLoginMethod(null);
                setName('');
                setEmail('');
                setPassword('');
                setErrorMessage('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Login Form
  if (mode === 'login' && loginMethod === 'email' && !otpSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>ticketly</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
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

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setMode('signup');
                setEmail('');
                setPassword('');
              }}
            >
              <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setLoginMethod(null);
                setEmail('');
                setPassword('');
              }}
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
              style={[styles.input, otpError && styles.inputError]}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#6B7280"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                // Clear error when user starts typing
                if (otpError) setOtpError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
            />
            {otpError && (
              <Text style={styles.errorText}>{otpError}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleOTPSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setOtpSent(false);
                setOtp('');
                setOtpError('');
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
                setPassword('');
                setName('');
                setTempToken('');
                setOtpError('');
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

        <View style={styles.buttonContainer} className='gap-4'>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => {
              setLoginMethod('email');
              setMode('login');
            }}
          >
            <Text style={styles.emailButtonText}>Login with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => {
              setLoginMethod('email');
              setMode('signup');
            }}
          >
            <Text style={styles.signupButtonText}>Sign Up with Email</Text>
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
  signupButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  signupButtonText: {
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
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
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
