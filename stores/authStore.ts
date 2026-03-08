import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfileToCloud } from '../lib/cloudSync';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  consentGiven: boolean;
  profileComplete: boolean;
  welcomeSeen: boolean;
  setAuth: (userId: string, email: string) => void;
  clearAuth: () => void;
  setConsentGiven: (given: boolean) => Promise<void>;
  setProfileComplete: (complete: boolean) => Promise<void>;
  setWelcomeSeen: () => Promise<void>;
  loadPersistedState: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userId: null,
  email: null,
  consentGiven: false,
  profileComplete: false,
  welcomeSeen: false,

  setAuth: (userId, email) => set({ isAuthenticated: true, userId, email }),
  clearAuth: () => {
    set({ isAuthenticated: false, userId: null, email: null, consentGiven: false, profileComplete: false });
    AsyncStorage.removeItem('profileComplete').catch(() => {});
  },

  setConsentGiven: async (given) => {
    set({ consentGiven: given });
    await AsyncStorage.setItem('consentGiven', given ? 'true' : 'false');
  },

  setProfileComplete: async (complete) => {
    set({ profileComplete: complete });
    await AsyncStorage.setItem('profileComplete', complete ? 'true' : 'false');
    const userId = get().userId;
    if (userId && complete) saveProfileToCloud(userId, { profile_complete: true }).catch(() => {});
  },

  setWelcomeSeen: async () => {
    set({ welcomeSeen: true });
    await AsyncStorage.setItem('welcomeSeen', 'true');
  },

  loadPersistedState: async () => {
    const consent = await AsyncStorage.getItem('consentGiven');
    const profile = await AsyncStorage.getItem('profileComplete');
    const welcome = await AsyncStorage.getItem('welcomeSeen');
    set({
      consentGiven: consent === 'true',
      profileComplete: profile === 'true',
      welcomeSeen: welcome === 'true',
    });
  },
}));
