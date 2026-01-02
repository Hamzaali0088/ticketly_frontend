import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  return null;
}

