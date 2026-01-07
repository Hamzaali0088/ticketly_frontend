import { useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';

export default function Index() {
  const router = useRouter();

  // Immediately redirect to tabs (home page) on app start
  // Login will only be shown when user tries to perform actions that require authentication
  return <Redirect href="/(tabs)" />;
}

