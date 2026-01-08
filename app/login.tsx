import React, { useState, useEffect } from 'react';
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
import { getAccessToken, getRefreshToken, setTokens } from '@/lib/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Silently check auth on mount - if already authenticated, redirect to home
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        // Try to get user profile to verify token is valid
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.user) {
            // User is authenticated, login and redirect to tabs
            login(response.user);
            router.replace('/(tabs)');
            return;
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
                    // User is authenticated, login and redirect to tabs
                    login(profileResponse.user);
                    router.replace('/(tabs)');
                    return;
                  }
                }
              } catch (refreshError) {
                // Refresh failed - user can stay on login page
                console.log('Token refresh failed');
              }
            }
          }
        }
      }
    };
    checkAuth();
  }, [login, router]);

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
    // Clear previous error
    setLoginError('');

    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setLoginError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      if (response.success) {
        // Check if user is verified (has accessToken) or needs OTP (has tempToken)
        if (response.accessToken && response.refreshToken && response.user) {
          // User is verified - save tokens, set user in store, and redirect
          await setTokens(response.accessToken, response.refreshToken);
          login(response.user);
          router.replace('/(tabs)');
          // Note: No need to set loading to false as we're redirecting
        } else if (response.tempToken) {
          // User is not verified - show OTP form
          setLoginError('');
          setTempToken(response.tempToken);
          setOtpSent(true);
          Alert.alert('OTP Sent', `OTP has been sent to ${email}. Please check your email.`);
          setLoading(false);
        } else {
          // Show backend error message inline
          setLoginError(response.message || 'Failed to send OTP');
          setLoading(false);
        }
      } else {
        // Show backend error message inline
        setLoginError(response.message || 'Failed to send OTP');
        setLoading(false);
      }
    } catch (error: any) {
      // Extract error message from response
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP. Please try again.';
      setLoginError(errorMsg);
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
        className="flex-1 bg-[#0F0F0F]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-4">ticketly</Text>
            <Text className="text-base text-[#9CA3AF] text-center">Create your account</Text>
          </View>

          <View className="w-full">
            <Text className="text-white text-sm font-semibold mb-2">Full Name</Text>
            <TextInput
              className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 text-white text-base mb-2"
              placeholder="e.g. Fatima Ali"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text className="text-white text-sm font-semibold mb-2">Email</Text>
            <TextInput
              className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base mb-2 ${errorMessage ? 'border-[#EF4444]' : 'border-[#374151]'}`}
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
              <Text className="text-[#EF4444] text-xs mb-3 mt-[-4px] px-1">{errorMessage}</Text>
            )}

            <Text className="text-white text-sm font-semibold mb-2">Password</Text>
            <View className="relative mb-2">
              <TextInput
                className="bg-[#1F1F1F] border border-[#374151] rounded-xl py-3.5 px-4 pr-12 text-white text-base"
                placeholder="At least 8 characters"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showSignupPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4 top-3.5 p-1"
                onPress={() => setShowSignupPassword(!showSignupPassword)}
              >
                <MaterialIcons
                  name={showSignupPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`bg-[#9333EA] py-4 rounded-xl items-center mb-3 ${loading ? 'opacity-60' : ''}`}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mb-3"
              onPress={() => {
                setMode('login');
                setName('');
                setEmail('');
                setPassword('');
                setErrorMessage('');
              }}
            >
              <Text className="text-[#9333EA] text-sm font-semibold">Already have an account? Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#1F1F1F] border border-[#374151] py-4 rounded-xl items-center"
              onPress={() => {
                setLoginMethod(null);
                setName('');
                setEmail('');
                setPassword('');
                setErrorMessage('');
              }}
            >
              <Text className="text-white text-base font-semibold">Back</Text>
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
        className="flex-1 bg-[#0F0F0F]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-4">ticketly</Text>
            <Text className="text-base text-[#9CA3AF] text-center">Login to your account</Text>
          </View>

          <View className="w-full">
            <Text className="text-white text-sm font-semibold mb-2">Email</Text>
            <TextInput
              className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base mb-2 ${loginError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
              placeholder="e.g. fatimaali@gmail.com"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Clear error when user starts typing
                if (loginError) setLoginError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="text-white text-sm font-semibold mb-2">Password</Text>
            <View className="relative mb-2">
              <TextInput
                className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 pr-12 text-white text-base ${loginError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
                placeholder="Enter your password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  // Clear error when user starts typing
                  if (loginError) setLoginError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="absolute right-4 top-3.5 p-1"
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {loginError && (
              <Text className="text-[#EF4444] text-xs mb-3 mt-[-4px] px-1">{loginError}</Text>
            )}

            <TouchableOpacity
              className={`bg-[#9333EA] py-4 rounded-xl items-center mb-3 ${loading ? 'opacity-60' : ''}`}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Send OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mb-3"
              onPress={() => {
                setMode('signup');
                setEmail('');
                setPassword('');
                setLoginError('');
              }}
            >
              <Text className="text-[#9333EA] text-sm font-semibold">Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#1F1F1F] border border-[#374151] py-4 rounded-xl items-center"
              onPress={() => {
                setLoginMethod(null);
                setEmail('');
                setPassword('');
                setLoginError('');
              }}
            >
              <Text className="text-white text-base font-semibold">Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (loginMethod === 'email' && otpSent) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-[#0F0F0F]"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-white mb-4">ticketly</Text>
            <Text className="text-base text-[#9CA3AF] text-center">
              {email ? `Enter the OTP sent to ${email}` : 'Enter the OTP sent to your email'}
            </Text>
          </View>

          <View className="w-full">
            <Text className="text-white text-sm font-semibold mb-2">OTP</Text>
            <TextInput
              className={`bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base mb-2 ${otpError ? 'border-[#EF4444]' : 'border-[#374151]'}`}
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
              <Text className="text-[#EF4444] text-xs mb-3 mt-[-4px] px-1">{otpError}</Text>
            )}

            <TouchableOpacity
              className={`bg-[#9333EA] py-4 rounded-xl items-center mb-3 ${loading ? 'opacity-60' : ''}`}
              onPress={handleOTPSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mb-3"
              onPress={() => {
                setOtpSent(false);
                setOtp('');
                setOtpError('');
              }}
            >
              <Text className="text-[#9333EA] text-sm font-semibold">Resend OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#1F1F1F] border border-[#374151] py-4 rounded-xl items-center"
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
              <Text className="text-white text-base font-semibold">Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-white mb-4">ticketly</Text>
          <Text className="text-base text-[#9CA3AF] text-center">Login via google account to proceed.</Text>
        </View>

        <View className="w-full mb-12 gap-4">
          <TouchableOpacity className="bg-white flex-row items-center justify-center py-4 px-6 rounded-xl mb-4" onPress={handleGoogleLogin}>
            <Text className="text-2xl font-bold text-[#4285F4] mr-3">G</Text>
            <Text className="text-[#1F1F1F] text-base font-semibold">Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#1F1F1F] border border-[#374151] py-4 px-6 rounded-xl"
            onPress={() => {
              setLoginMethod('email');
              setMode('login');
            }}
          >
            <Text className="text-white text-base font-semibold text-center">Login with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#9333EA] py-4 px-6 rounded-xl"
            onPress={() => {
              setLoginMethod('email');
              setMode('signup');
            }}
          >
            <Text className="text-white text-base font-semibold text-center">Sign Up with Email</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-4 mb-6">
          <Text className="text-[#9CA3AF] text-sm">Contact Us</Text>
          <Text className="text-[#9CA3AF] text-sm">Privacy Policy</Text>
          <Text className="text-[#9CA3AF] text-sm">Terms of Service</Text>
        </View>

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity className="bg-[#1F1F1F] w-10 h-10 rounded-lg items-center justify-center">
            <Text className="text-white text-base">in</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#1F1F1F] w-10 h-10 rounded-lg items-center justify-center">
            <Text className="text-white text-base">📷</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-[#6B7280] text-xs text-center">2025 Ticketly. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}
