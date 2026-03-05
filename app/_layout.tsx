import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const auth = useAuthStore();
  const profile = useProfileStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // 1. Initialize auth on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          auth.setSession(session);
          auth.setUser(session.user);
        } else {
          auth.setSession(null);
          auth.setUser(null);
        }
        auth.setLoading(false);
        setIsReady(true);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        auth.setSession(session);
        auth.setUser(session.user);
      }
      auth.setLoading(false);
      setIsReady(true);
    }).catch(() => {
      auth.setLoading(false);
      setIsReady(true);
    });

    const timeout = setTimeout(() => setIsReady(true), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // 2. Navigation state machine (Section 12)
  useEffect(() => {
    if (!isReady) return;

    const inAuth = segments[0] === 'auth';
    const inConsent = segments[0] === 'consent';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const isAuthenticated = auth.isAuthenticated;
    const hasConsent = !!profile.profile.hasAcceptedConsent;
    const hasOnboarded = !!profile.profile.hasCompletedOnboarding;

    if (!isAuthenticated) {
      if (!inAuth) router.replace('/auth/login');
    } else if (!hasConsent) {
      if (!inConsent) router.replace('/consent');
    } else if (!hasOnboarded) {
      if (!inOnboarding) router.replace('/onboarding/surgery');
    } else {
      if (!inTabs) router.replace('/(tabs)');
    }
  }, [isReady, auth.isAuthenticated, profile.profile.hasAcceptedConsent, profile.profile.hasCompletedOnboarding, segments]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00B894" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});
