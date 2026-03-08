import Sentry from '../lib/sentry';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner } from '../components/animations';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore, useProfileStore } from '../stores/settingsStore';
import { Session } from '@supabase/supabase-js';
import { identifyUser, resetUser, trackScreen } from '../lib/posthog';
import ErrorBoundary from '../components/ErrorBoundary';
import OfflineBanner from '../components/OfflineBanner';
import { resetUserData } from '../lib/resetUserData';
import { loadProfileFromCloud, loadHistoryFromCloud } from '../lib/cloudSync';
import { useHistoryStore } from '../stores/historyStore';
import '../i18n';
import { loadSavedLanguage } from '../i18n';

const LAST_USER_KEY = 'spineflow_last_user_id';

function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, consentGiven, profileComplete, welcomeSeen,
          setAuth, clearAuth, loadPersistedState, setProfileComplete } = useAuthStore();
  const { loadSettings, setLanguage, setTheme, setUnits } = useSettingsStore();
  const { loadProfile, setSurgery, setCurveType, setGoal, setExperience, setBodyType, setEquipment } = useProfileStore();
  const { setWorkouts } = useHistoryStore();

  useEffect(() => {
    const init = async () => {
      await loadSavedLanguage();
      await loadPersistedState();
      await loadSettings();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Clear local data if a different user's session is found
        const lastUserId = await AsyncStorage.getItem(LAST_USER_KEY);
        if (lastUserId && lastUserId !== session.user.id) {
          resetUserData();
        }
        await AsyncStorage.setItem(LAST_USER_KEY, session.user.id);
        await loadProfile(); // load local cache first (instant)

        // Restore from cloud (5 s timeout so app doesn't hang offline)
        try {
          const cloudProfile = await Promise.race([
            loadProfileFromCloud(session.user.id),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5_000)),
          ]);
          if (cloudProfile) {
            setSurgery(cloudProfile.surgery as any);
            setCurveType(cloudProfile.curve_type as any);
            setGoal(cloudProfile.goal as any);
            setExperience(cloudProfile.experience as any);
            setBodyType(cloudProfile.body_type as any);
            setEquipment(cloudProfile.equipment);
            await AsyncStorage.setItem('profile', JSON.stringify({
              surgery: cloudProfile.surgery,
              curveType: cloudProfile.curve_type,
              goal: cloudProfile.goal,
              experience: cloudProfile.experience,
              bodyType: cloudProfile.body_type,
              equipment: cloudProfile.equipment,
            }));
            if (cloudProfile.language) await setLanguage(cloudProfile.language);
            if (cloudProfile.theme) await setTheme(cloudProfile.theme as any);
            if (cloudProfile.units) await setUnits(cloudProfile.units as any);
            if (cloudProfile.profile_complete) await setProfileComplete(true);
          }
        } catch {}

        // Restore workout history from cloud (non-blocking)
        loadHistoryFromCloud(session.user.id)
          .then((cloudHistory) => { if (cloudHistory.length > 0) setWorkouts(cloudHistory); })
          .catch(() => {});

        setAuth(session.user.id, session.user.email || '');
        identifyUser(session.user.id, { email: session.user.email });
      } else {
        await loadProfile();
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          setAuth(session.user.id, session.user.email || '');
          identifyUser(session.user.id, { email: session.user.email });
          AsyncStorage.setItem(LAST_USER_KEY, session.user.id).catch(() => {});
        } else {
          resetUserData();
          clearAuth();
          resetUser();
          AsyncStorage.removeItem(LAST_USER_KEY).catch(() => {});
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
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="consent" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
        <Stack.Screen name="planner" options={{ presentation: 'card' }} />
      </Stack>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
