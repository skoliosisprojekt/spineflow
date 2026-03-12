import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HydrationType } from '../types';
import {
  dbAddMeal, dbSoftDeleteMeal, dbGetMealsForDate,
  dbDeleteMealsForDate, dbDeleteAllMeals,
  dbAddHydration, dbSoftDeleteHydration, dbGetHydrationForDate,
  dbDeleteHydrationForDate, dbDeleteAllHydration,
  todayDateString,
} from '../lib/db';
import type { MealRow, HydrationRow } from '../lib/db';
import { pushNutritionToCloud } from '../lib/nutritionSync';
import { useAuthStore } from './authStore';
import { trackMealLogged, trackHydrationLogged } from '../lib/analytics';

const getAuthUserId = () => useAuthStore.getState().userId;

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

// Goals remain in AsyncStorage — simple single key-value, no query needs
const GOALS_KEY = 'spineflow_nutrition_goals';

const DEFAULT_GOALS: DailyGoals = { water: 3000, protein: 120, calories: 2500 };

// ── Row → domain mappers ──────────────────────────────────────────────────────
function rowToMeal(row: MealRow): MealEntry {
  return {
    id: row.id.toString(),
    mealType: row.meal_type as MealType,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    time: new Date(row.timestamp).toISOString(),
  };
}

function rowToEntry(row: HydrationRow): HydrationEntry {
  return {
    id: row.id.toString(),
    type: row.beverage_type as HydrationType,
    amount: row.amount_ml,
    time: new Date(row.timestamp).toISOString(),
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useNutritionStore = create<NutritionState>((set, get) => ({
  entries: [],
  meals: [],
  goals: { ...DEFAULT_GOALS },

  addEntry: (type, amount) => {
    const now = Date.now();
    const date = todayDateString();
    // Optimistic update with a temporary id, replaced by SQLite row id on success
    const tempId = `tmp_${now}`;
    const optimistic: HydrationEntry = {
      id: tempId,
      type,
      amount,
      time: new Date(now).toISOString(),
    };
    set((s) => ({ entries: [...s.entries, optimistic] }));
    dbAddHydration({ amountMl: amount, beverageType: type, date, timestamp: now })
      .then((rowId) => {
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === tempId ? { ...e, id: rowId.toString() } : e,
          ),
        }));
        trackHydrationLogged(amount);
        const userId = getAuthUserId();
        if (userId) pushNutritionToCloud(userId).catch(() => {});
      })
      .catch((err) => {
        console.error('[nutritionStore] addEntry failed:', err);
        set((s) => ({ entries: s.entries.filter((e) => e.id !== tempId) }));
      });
  },

  removeEntry: (id) => {
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    dbSoftDeleteHydration(Number(id))
      .then(() => {
        const userId = getAuthUserId();
        if (userId) pushNutritionToCloud(userId).catch(() => {});
      })
      .catch(() => {});
  },

  addMeal: (meal) => {
    const now = Date.now();
    const date = todayDateString();
    const tempId = `tmp_${now}`;
    const optimistic: MealEntry = {
      ...meal,
      id: tempId,
      time: new Date(now).toISOString(),
    };
    set((s) => ({ meals: [...s.meals, optimistic] }));
    dbAddMeal({
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      mealType: meal.mealType,
      date,
      timestamp: now,
    })
      .then((rowId) => {
        set((s) => ({
          meals: s.meals.map((m) =>
            m.id === tempId ? { ...m, id: rowId.toString() } : m,
          ),
        }));
        trackMealLogged(meal.mealType);
        const userId = getAuthUserId();
        if (userId) pushNutritionToCloud(userId).catch(() => {});
      })
      .catch((err) => {
        console.error('[nutritionStore] addMeal failed:', err);
        set((s) => ({ meals: s.meals.filter((m) => m.id !== tempId) }));
      });
  },

  removeMeal: (id) => {
    set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
    dbSoftDeleteMeal(Number(id))
      .then(() => {
        const userId = getAuthUserId();
        if (userId) pushNutritionToCloud(userId).catch(() => {});
      })
      .catch(() => {});
  },

  setGoal: (field, value) => {
    const goals = { ...get().goals, [field]: value };
    set({ goals });
    AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals)).catch(() => {});
  },

  loadNutrition: async () => {
    try {
      const date = todayDateString();
      const [mealRows, hydrationRows, goalsRaw] = await Promise.all([
        dbGetMealsForDate(date),
        dbGetHydrationForDate(date),
        AsyncStorage.getItem(GOALS_KEY),
      ]);
      // Merge DB results with any in-flight optimistic entries (tmp_ IDs) so a
      // concurrent addMeal call does not get its optimistic entry wiped.
      set((s) => ({
        meals: [
          ...mealRows.map(rowToMeal),
          ...s.meals.filter((m) => m.id.startsWith('tmp_')),
        ],
        entries: [
          ...hydrationRows.map(rowToEntry),
          ...s.entries.filter((e) => e.id.startsWith('tmp_')),
        ],
        goals: goalsRaw
          ? { ...DEFAULT_GOALS, ...JSON.parse(goalsRaw) }
          : { ...DEFAULT_GOALS },
      }));
    } catch (err) {
      console.error('[nutritionStore] loadNutrition failed:', err);
    }
  },

  clearToday: () => {
    const date = todayDateString();
    set({ entries: [], meals: [] });
    Promise.all([
      dbDeleteMealsForDate(date),
      dbDeleteHydrationForDate(date),
    ]).catch(() => {});
  },

  resetNutrition: () => {
    set({ entries: [], meals: [], goals: { ...DEFAULT_GOALS } });
    Promise.all([
      dbDeleteAllMeals(),
      dbDeleteAllHydration(),
      AsyncStorage.removeItem(GOALS_KEY),
    ]).catch(() => {});
  },
}));
