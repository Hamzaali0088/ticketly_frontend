import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

// Try to import global.css, but don't fail if it doesn't work
try {
  require("../global.css");
} catch (e) {
  console.warn('Could not load global.css:', e);
}

import { useColorScheme } from '@/hooks/useColorScheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Always set ready after fonts load or error, with a small delay
    if (loaded || fontError) {
      const timer = setTimeout(() => {
        setAppReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loaded, fontError]);

  // If font loading failed, log but continue
  if (fontError) {
    console.warn('Font loading error (continuing anyway):', fontError);
  }

  if (!appReady) {
    // Show loading screen while app initializes
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' }}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={{ color: '#FFFFFF', marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="create-event" />
          <Stack.Screen name="event-details/[id]" />
          <Stack.Screen name="ticket/[id]" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
