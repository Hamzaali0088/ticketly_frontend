// API Configuration
// Set EXPO_PUBLIC_API_BASE_URL in your .env file
// Production: https://ticketlybackend-production.up.railway.app/api
// Development options:
//   - Web browser: http://localhost:5001/api
//   - Android emulator: http://10.0.2.2:5001/api
//   - iOS simulator: http://localhost:5001/api
//   - Physical device: http://YOUR_COMPUTER_IP:5001/api

import { Platform } from 'react-native';

// Get the API URL from environment variable or use default based on platform
let defaultUrl = 'https://ticketlybackend-production.up.railway.app/ap';

// For React Native (mobile), localhost won't work on physical devices
// Use your computer's local IP address instead
// To find your IP: run `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
// Common local IP: 192.168.x.x or 10.0.2.2 (Android emulator)
if (Platform.OS !== 'web') {
  // Mobile environment - check if we have an IP address set
  // If not set, default to localhost (will work for emulator/simulator)
  // For physical devices, you MUST set EXPO_PUBLIC_API_BASE_URL in .env
  // Example: EXPO_PUBLIC_API_BASE_URL=http://192.168.0.127:5001/api
  defaultUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';
  
  // For Android emulator, use 10.0.2.2 instead of localhost
  if (Platform.OS === 'android' && defaultUrl.includes('localhost')) {
    defaultUrl = defaultUrl.replace('localhost', '10.0.2.2');
  }
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || defaultUrl;

// Log the API URL being used (for debugging)
if (__DEV__) {
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('🌐 Platform:', Platform.OS);
}
