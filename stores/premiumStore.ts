import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'spineflow_premium';
const BETA_KEY    = 'spineflow_beta_tester';

interface PremiumState {
  isPremium: boolean;
  isBetaTester: boolean;
  /**
   * Call after loading the cloud profile.
   * If isBetaTester === true → grant Premium immediately, bypass RevenueCat.
   * Otherwise → check RevenueCat entitlements (stub until SDK is installed).
   */
  checkPremiumStatus: (isBetaTester: boolean) => Promise<void>;
  setPremium: (value: boolean) => Promise<void>;
  loadPremium: () => Promise<void>;
  resetPremium: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  isBetaTester: false,

  checkPremiumStatus: async (isBetaTester) => {
    if (isBetaTester) {
      // Beta bypass: full access, no RevenueCat needed
      set({ isBetaTester: true, isPremium: true });
      await AsyncStorage.setItem(BETA_KEY, 'true');
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      return;
    }

    // Check if beta status was cached from a previous session / same session
    const betaRaw = await AsyncStorage.getItem(BETA_KEY);
    if (betaRaw === 'true') {
      set({ isBetaTester: true, isPremium: true });
      return;
    }

    // ── RevenueCat check (stub — replace with real SDK calls when installed) ──
    // import Purchases from 'react-native-purchases';
    // const info = await Purchases.getCustomerInfo();
    // const active = !!info.entitlements.active['Premium'];
    // set({ isBetaTester: false, isPremium: active });
    // await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    //
    // Until RevenueCat is installed, fall back to the persisted local value:
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    set({ isBetaTester: false, isPremium: raw ? JSON.parse(raw) : false });
  },

  setPremium: async (isPremium) => {
    set({ isPremium });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(isPremium));
  },

  loadPremium: async () => {
    const [premRaw, betaRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(BETA_KEY),
    ]);
    const isBetaTester = betaRaw === 'true';
    const isPremium    = isBetaTester || (premRaw ? JSON.parse(premRaw) : false);
    set({ isPremium, isBetaTester });
  },

  resetPremium: () => {
    set({ isPremium: false, isBetaTester: false });
    AsyncStorage.multiRemove([STORAGE_KEY, BETA_KEY]).catch(() => {});
  },
}));
