import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner } from '../components/animations';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore, useProfileStore } from '../stores/settingsStore';
import { Session } from '@supabase/supabase-js';
import { resetUser, trackScreen, captureError } from '../lib/posthog';
import { identifyUserProfile } from '../lib/analytics';
import ErrorBoundary from '../components/ErrorBoundary';
import OfflineBanner from '../components/OfflineBanner';
import { resetUserData } from '../lib/resetUserData';
import { loadProfileFromCloud, loadHistoryFromCloud } from '../lib/cloudSync';
import { pullNutritionFromCloud, pushNutritionToCloud } from '../lib/nutritionSync';
import { onDbInit } from '../lib/db';
import { SQLiteProvider } from 'expo-sqlite';
import { useHistoryStore } from '../stores/historyStore';
import { usePremiumStore } from '../stores/premiumStore';
import '../i18n';
import { loadSavedLanguage } from '../i18n';
import { useTheme, useIsDark } from '../lib/theme';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Global unhandled JS error handler — catches crashes outside React tree
try {
  const ErrUtils = (global as any).ErrorUtils;
  if (ErrUtils?.setGlobalHandler) {
    const prev = ErrUtils.getGlobalHandler();
    ErrUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      captureError(error, { source: 'GlobalErrorUtils', is_fatal: isFatal });
      prev?.(error, isFatal);
    });
  }
} catch {}

const LAST_USER_KEY = 'spineflow_last_user_id';

function RootLayout() {
  const C = useTheme();
  const isDark = useIsDark();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, consentGiven, profileComplete, welcomeSeen, hasAcceptedBetaTerms,
          setAuth, clearAuth, loadPersistedState, setProfileComplete } = useAuthStore();
  const { loadSettings, setLanguage, setTheme, setUnits } = useSettingsStore();
  const { loadProfile, setSurgery, setCurveType, setGoal, setExperience, setBodyType, setEquipment } = useProfileStore();
  const { setWorkouts } = useHistoryStore();
  const { checkPremiumStatus } = usePremiumStore();

  useEffect(() => {
    const init = async () => {
      try {
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
            if (cloudProfile.language) {
              // Only apply cloud language if the user hasn't set a local preference
              const localLang = await AsyncStorage.getItem('language');
              if (!localLang) await setLanguage(cloudProfile.language);
            }
            if (cloudProfile.theme) await setTheme(cloudProfile.theme as any);
            if (cloudProfile.units) await setUnits(cloudProfile.units as any);
            if (cloudProfile.profile_complete) await setProfileComplete(true);
            await checkPremiumStatus(cloudProfile.is_beta_tester ?? false);
          identifyUserProfile(session.user.id, {
            email: session.user.email ?? undefined,
            curve_type: cloudProfile.curve_type,
            surgery: cloudProfile.surgery,
            goal: cloudProfile.goal,
            experience: cloudProfile.experience,
            body_type: cloudProfile.body_type,
          });
          } else {
            // No profile row yet (new user still in onboarding) —
            // checkPremiumStatus(false) will restore BETA_KEY from AsyncStorage cache
            identifyUserProfile(session.user.id, { email: session.user.email ?? undefined });
            await checkPremiumStatus(false);
          }
        } catch {}

        // Restore workout history from cloud (non-blocking)
        loadHistoryFromCloud(session.user.id)
          .then((cloudHistory) => { if (cloudHistory.length > 0) setWorkouts(cloudHistory); })
          .catch(() => {});

        // Restore & sync nutrition data from cloud (non-blocking)
        pullNutritionFromCloud(session.user.id).catch(() => {});
        pushNutritionToCloud(session.user.id).catch(() => {});

        setAuth(session.user.id, session.user.email || '');
      } else {
        await loadProfile();
      }
      } catch (e) {
        console.warn('[layout] init error:', e);
        captureError(e, { source: '_layout.init' });
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync().catch(() => {});
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          setAuth(session.user.id, session.user.email || '');
          identifyUserProfile(session.user.id, { email: session.user.email ?? undefined });
          AsyncStorage.setItem(LAST_USER_KEY, session.user.id).catch(() => {});
          // Push any locally queued changes when a new session is established
          pushNutritionToCloud(session.user.id).catch(() => {});
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
    const inWelcome     = segments[0] === 'welcome';
    const inAuth        = segments[0] === 'auth';
    const inConsent     = segments[0] === 'consent';
    const inOnboarding  = segments[0] === 'onboarding';
    const inLegalConsent = (segments[0] as string) === 'legal-consent';

    if (!welcomeSeen) {
      if (!inWelcome) router.replace('/welcome');
    } else if (!isAuthenticated) {
      if (!inAuth) router.replace('/auth/login');
    } else if (!consentGiven) {
      if (!inConsent) router.replace('/consent');
    } else if (!profileComplete) {
      if (!inOnboarding) router.replace('/onboarding/surgery');
    } else if (!hasAcceptedBetaTerms) {
      if (!inLegalConsent) router.replace('/legal-consent' as any);
    } else {
      if (inWelcome || inAuth || inConsent || inOnboarding || inLegalConsent) router.replace('/(tabs)');
    }
  }, [isAuthenticated, consentGiven, profileComplete, welcomeSeen, hasAcceptedBetaTerms, isLoading, segments]);

  return (
    <SQLiteProvider
      databaseName="spineflow_nutrition.db"
      onInit={onDbInit}
      onError={(e) => console.warn('[SQLiteProvider]', e)}
    >
    <ErrorBoundary>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
          <LoadingSpinner size={80} />
        </View>
      ) : (
        <>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="consent" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="exercise/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings/index" options={{ presentation: 'card' }} />
            <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
            <Stack.Screen name="planner" options={{ presentation: 'card' }} />
            <Stack.Screen name="legal-consent" options={{ gestureEnabled: false }} />
          </Stack>
        </>
      )}
    </ErrorBoundary>
    </SQLiteProvider>
  );
}

export default RootLayout;
