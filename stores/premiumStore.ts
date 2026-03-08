import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'spineflow_premium';

interface PremiumState {
  isPremium: boolean;
  setPremium: (value: boolean) => Promise<void>;
  loadPremium: () => Promise<void>;
  resetPremium: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  setPremium: async (isPremium) => {
    set({ isPremium });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(isPremium));
  },
  loadPremium: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) set({ isPremium: JSON.parse(raw) });
  },
  resetPremium: () => {
    set({ isPremium: false });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
