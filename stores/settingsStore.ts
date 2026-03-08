import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfileToCloud } from '../lib/cloudSync';
import { useAuthStore } from './authStore';
import type { ThemeMode, WeightUnit, SurgeryType, CurveType, GoalType, ExperienceType, BodyType } from '../types';

interface SettingsState {
  language: string;
  theme: ThemeMode;
  units: WeightUnit;
  setLanguage: (lang: string) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setUnits: (units: WeightUnit) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  theme: 'system',
  units: 'kg',
  setLanguage: async (language) => {
    set({ language });
    await AsyncStorage.setItem('language', language);
    const uid = useAuthStore.getState().userId;
    if (uid) saveProfileToCloud(uid, { language }).catch(() => {});
  },
  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem('theme', theme);
    const uid = useAuthStore.getState().userId;
    if (uid) saveProfileToCloud(uid, { theme }).catch(() => {});
  },
  setUnits: async (units) => {
    set({ units });
    await AsyncStorage.setItem('units', units);
    const uid = useAuthStore.getState().userId;
    if (uid) saveProfileToCloud(uid, { units }).catch(() => {});
  },
  loadSettings: async () => {
    const language = await AsyncStorage.getItem('language') || 'en';
    const theme = (await AsyncStorage.getItem('theme') as ThemeMode) || 'system';
    const units = (await AsyncStorage.getItem('units') as WeightUnit) || 'kg';
    set({ language, theme, units });
  },
}));

interface ProfileState {
  surgery: SurgeryType;
  curveType: CurveType;
  goal: GoalType;
  experience: ExperienceType;
  bodyType: BodyType;
  equipment: string[];
  setSurgery: (s: SurgeryType) => void;
  setCurveType: (c: CurveType) => void;
  setGoal: (g: GoalType) => void;
  setExperience: (e: ExperienceType) => void;
  setBodyType: (b: BodyType) => void;
  setEquipment: (e: string[]) => void;
  saveProfile: () => Promise<void>;
  loadProfile: () => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  surgery: 'none', curveType: 'thoracic', goal: 'muscle',
  experience: 'beginner', bodyType: 'normal', equipment: [],
  setSurgery: (surgery) => set({ surgery }),
  setCurveType: (curveType) => set({ curveType }),
  setGoal: (goal) => set({ goal }),
  setExperience: (experience) => set({ experience }),
  setBodyType: (bodyType) => set({ bodyType }),
  setEquipment: (equipment) => set({ equipment }),
  saveProfile: async () => {
    const { surgery, curveType, goal, experience, bodyType, equipment } = get();
    await AsyncStorage.setItem('profile', JSON.stringify({ surgery, curveType, goal, experience, bodyType, equipment }));
    const uid = useAuthStore.getState().userId;
    if (uid) {
      saveProfileToCloud(uid, {
        surgery, curve_type: curveType, goal, experience, body_type: bodyType, equipment,
      }).catch(() => {});
    }
  },
  loadProfile: async () => {
    const data = await AsyncStorage.getItem('profile');
    if (data) set(JSON.parse(data));
  },
  resetProfile: () => {
    set({ surgery: 'none', curveType: 'thoracic', goal: 'muscle', experience: 'beginner', bodyType: 'normal', equipment: [] });
    AsyncStorage.removeItem('profile').catch(() => {});
  },
}));
