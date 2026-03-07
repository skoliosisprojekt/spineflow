import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore, useProfileStore } from '../stores/settingsStore';
import { Session } from '@supabase/supabase-js';
import '../i18n';
import { loadSavedLanguage } from '../i18n';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, consentGiven, profileComplete, welcomeSeen,
          setAuth, clearAuth, loadPersistedState } = useAuthStore();
  const { loadSettings } = useSettingsStore();
  const { loadProfile } = useProfileStore();

  useEffect(() => {
    const init = async () => {
      await loadSavedLanguage();
      await loadPersistedState();
      await loadSettings();
      await loadProfile();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setAuth(session.user.id, session.user.email || '');
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) setAuth(session.user.id, session.user.email || '');
        else clearAuth();
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Navigation state machine
  useEffect(() => {
    if (isLoading) return;
    const inWelcome = segments[0] === 'welcome';
    const inAuth = segments[0] === 'auth';
    const inConsent = segments[0] === 'consent';
    const inOnboarding = segments[0] === 'onboarding';

    if (!welcomeSeen) {
      if (!inWelcome) router.replace('/welcome');
    } else if (!isAuthenticated) {
      if (!inAuth) router.replace('/auth/login');
    } else if (!consentGiven) {
      if (!inConsent) router.replace('/consent');
    } else if (!profileComplete) {
      if (!inOnboarding) router.replace('/onboarding/surgery');
    } else {
      if (inWelcome || inAuth || inConsent || inOnboarding) router.replace('/(tabs)');
    }
  }, [isAuthenticated, consentGiven, profileComplete, welcomeSeen, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
        <ActivityIndicator size="large" color="#00B894" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="consent" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}
