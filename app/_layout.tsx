import Sentry from '../lib/sentry';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, StatusBar } from 'react-native';
import { LoadingSpinner } from '../components/animations';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore, useProfileStore } from '../stores/settingsStore';
import { Session } from '@supabase/supabase-js';
import { identifyUser, resetUser, trackScreen } from '../lib/posthog';
import ErrorBoundary from '../components/ErrorBoundary';
import '../i18n';
import { loadSavedLanguage } from '../i18n';

function RootLayout() {
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
      if (session?.user) {
        setAuth(session.user.id, session.user.email || '');
        identifyUser(session.user.id, { email: session.user.email });
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          setAuth(session.user.id, session.user.email || '');
          identifyUser(session.user.id, { email: session.user.email });
        } else {
          clearAuth();
          resetUser();
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Track screen views
  useEffect(() => {
    if (!isLoading && segments.length > 0) {
      trackScreen(segments.join('/'));
    }
  }, [segments, isLoading]);

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
        <LoadingSpinner size={80} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="consent" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
      </Stack>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
