import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CompletedSet {
  weight: number;
  reps: number;
}

export interface CompletedExercise {
  exerciseId: number;
  sets: CompletedSet[];
}

export interface WorkoutRecord {
  id: string;
  date: string; // ISO string
  exercises: CompletedExercise[];
  totalSets: number;
  completedSets: number;
  totalVolume: number;
  totalReps: number;
  durationMs?: number;
}

interface HistoryState {
  workouts: WorkoutRecord[];
  saveWorkout: (record: WorkoutRecord) => void;
  deleteWorkout: (id: string) => void;
  loadHistory: () => Promise<void>;
}

const STORAGE_KEY = 'spineflow_workout_history';

export const useHistoryStore = create<HistoryState>((set, get) => ({
  workouts: [],

  saveWorkout: (record) => {
    const updated = [record, ...get().workouts];
    set({ workouts: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  deleteWorkout: (id) => {
    const updated = get().workouts.filter((w) => w.id !== id);
    set({ workouts: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  loadHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ workouts: JSON.parse(raw) as WorkoutRecord[] });
      }
    } catch {}
  },
}));
