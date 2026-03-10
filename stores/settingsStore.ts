import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfileToCloud } from '../lib/cloudSync';
import { useAuthStore } from './authStore';
import { usePremiumStore } from './premiumStore';
import i18n from '../i18n';
import type { ThemeMode, WeightUnit, SurgeryType, CurveType, GoalType, ExperienceType, BodyType, Gender } from '../types';

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
    await i18n.changeLanguage(language);
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
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  setSurgery: (s: SurgeryType) => void;
  setCurveType: (c: CurveType) => void;
  setGoal: (g: GoalType) => void;
  setExperience: (e: ExperienceType) => void;
  setBodyType: (b: BodyType) => void;
  setEquipment: (e: string[]) => void;
  setHeight: (h: number) => void;
  setWeight: (w: number) => void;
  setAge: (a: number) => void;
  setGender: (g: Gender) => void;
  saveProfile: () => Promise<void>;
  saveBodyData: () => Promise<void>;
  loadProfile: () => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  surgery: 'none', curveType: 'thoracic', goal: 'muscle',
  experience: 'beginner', bodyType: 'normal', equipment: [],
  height: 0, weight: 0, age: 0, gender: 'male',
  setSurgery: (surgery) => set({ surgery }),
  setCurveType: (curveType) => set({ curveType }),
  setGoal: (goal) => set({ goal }),
  setExperience: (experience) => set({ experience }),
  setBodyType: (bodyType) => set({ bodyType }),
  setEquipment: (equipment) => set({ equipment }),
  setHeight: (height) => set({ height }),
  setWeight: (weight) => set({ weight }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  saveProfile: async () => {
    const { surgery, curveType, goal, experience, bodyType, equipment } = get();
    await AsyncStorage.setItem('profile', JSON.stringify({ surgery, curveType, goal, experience, bodyType, equipment }));
    const uid = useAuthStore.getState().userId;
    if (uid) {
      const isBetaTester = usePremiumStore.getState().isBetaTester;
      saveProfileToCloud(uid, {
        surgery, curve_type: curveType, goal, experience, body_type: bodyType, equipment,
        is_beta_tester: isBetaTester,
      }).catch(() => {});
    }
  },
  saveBodyData: async () => {
    const { height, weight, age, gender } = get();
    await AsyncStorage.setItem('bodyData', JSON.stringify({ height, weight, age, gender }));
  },
  loadProfile: async () => {
    const [profileRaw, bodyRaw] = await Promise.all([
      AsyncStorage.getItem('profile'),
      AsyncStorage.getItem('bodyData'),
    ]);
    if (profileRaw) set(JSON.parse(profileRaw));
    if (bodyRaw) set(JSON.parse(bodyRaw));
  },
  resetProfile: () => {
    set({ surgery: 'none', curveType: 'thoracic', goal: 'muscle', experience: 'beginner', bodyType: 'normal', equipment: [], height: 0, weight: 0, age: 0, gender: 'male' });
    AsyncStorage.multiRemove(['profile', 'bodyData']).catch(() => {});
  },
}));
