import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HydrationType } from '../types';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface HydrationEntry {
  id: string;
  type: HydrationType;
  amount: number; // ml
  time: string; // ISO string
}

export interface MealEntry {
  id: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  time: string; // ISO string
}

interface DailyGoals {
  water: number; // ml
  protein: number; // g
  calories: number; // kcal
}

interface NutritionState {
  entries: HydrationEntry[];
  meals: MealEntry[];
  goals: DailyGoals;

  addEntry: (type: HydrationType, amount: number) => void;
  removeEntry: (id: string) => void;
  addMeal: (meal: Omit<MealEntry, 'id' | 'time'>) => void;
  removeMeal: (id: string) => void;
  setGoal: (field: keyof DailyGoals, value: number) => void;
  loadNutrition: () => Promise<void>;
  clearToday: () => void;
  resetNutrition: () => void;
}

const ENTRIES_KEY = 'spineflow_nutrition_entries';
const MEALS_KEY = 'spineflow_nutrition_meals';
const GOALS_KEY = 'spineflow_nutrition_goals';

const DEFAULT_GOALS: DailyGoals = { water: 3000, protein: 120, calories: 2500 };

export const useNutritionStore = create<NutritionState>((set, get) => ({
  entries: [],
  meals: [],
  goals: { ...DEFAULT_GOALS },

  addEntry: (type, amount) => {
    const entry: HydrationEntry = {
      id: Date.now().toString(),
      type,
      amount,
      time: new Date().toISOString(),
    };
    const updated = [...get().entries, entry];
    set({ entries: updated });
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removeEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    set({ entries: updated });
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updated)).catch(() => {});
  },

  addMeal: (meal) => {
    const entry: MealEntry = {
      ...meal,
      id: Date.now().toString(),
      time: new Date().toISOString(),
    };
    const updated = [...get().meals, entry];
    set({ meals: updated });
    AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removeMeal: (id) => {
    const updated = get().meals.filter((m) => m.id !== id);
    set({ meals: updated });
    AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  setGoal: (field, value) => {
    const goals = { ...get().goals, [field]: value };
    set({ goals });
    AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals)).catch(() => {});
  },

  loadNutrition: async () => {
    try {
      const [entriesRaw, mealsRaw, goalsRaw] = await Promise.all([
        AsyncStorage.getItem(ENTRIES_KEY),
        AsyncStorage.getItem(MEALS_KEY),
        AsyncStorage.getItem(GOALS_KEY),
      ]);
      const state: Partial<NutritionState> = {};
      if (entriesRaw) state.entries = JSON.parse(entriesRaw);
      if (mealsRaw) state.meals = JSON.parse(mealsRaw);
      if (goalsRaw) state.goals = { ...DEFAULT_GOALS, ...JSON.parse(goalsRaw) };
      set(state as any);
    } catch {}
  },

  resetNutrition: () => {
    set({ entries: [], meals: [], goals: { ...DEFAULT_GOALS } });
    AsyncStorage.multiRemove([ENTRIES_KEY, MEALS_KEY, GOALS_KEY]).catch(() => {});
  },

  clearToday: () => {
    const today = new Date().toDateString();
    const updatedEntries = get().entries.filter((e) => new Date(e.time).toDateString() !== today);
    const updatedMeals = get().meals.filter((m) => new Date(m.time).toDateString() !== today);
    set({ entries: updatedEntries, meals: updatedMeals });
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updatedEntries)).catch(() => {});
    AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updatedMeals)).catch(() => {});
  },
}));
