import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutExercise {
  exerciseId: number;
  sets: { weight: number; reps: number; completed: boolean }[];
  addedAt: number;
}

interface PendingExercise {
  exerciseId: number;
  numSets: number;
  weight?: number;
}

interface WorkoutState {
  /** Exercises in the current workout session */
  exercises: WorkoutExercise[];
  /** Whether a workout is actively in progress */
  isActive: boolean;

  addExercise: (exerciseId: number, defaultSets?: number) => boolean;
  removeExercise: (exerciseId: number) => void;
  hasExercise: (exerciseId: number) => boolean;
  updateSet: (exerciseId: number, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  toggleSetComplete: (exerciseId: number, setIndex: number) => void;
  addSet: (exerciseId: number) => void;
  removeSet: (exerciseId: number, setIndex: number) => void;
  clearWorkout: () => void;
  startWorkout: () => void;
  loadWorkout: () => Promise<void>;
  /** Save an AI-suggested exercise for the NEXT workout (survives clearWorkout) */
  saveExerciseForNextWorkout: (exerciseId: number, numSets: number, weight?: number) => Promise<void>;
}

const STORAGE_KEY = 'spineflow_current_workout';
const PENDING_KEY  = 'spineflow_next_workout_pending';

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  exercises: [],
  isActive: false,

  addExercise: (exerciseId: number, defaultSets = 3) => {
    const state = get();
    if (state.exercises.some((e) => e.exerciseId === exerciseId)) {
      return false; // already in workout
    }
    const entry: WorkoutExercise = {
      exerciseId,
      sets: Array.from({ length: defaultSets }, () => ({ weight: 0, reps: 0, completed: false })),
      addedAt: Date.now(),
    };
    const updated = [...state.exercises, entry];
    set({ exercises: updated, isActive: true });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    return true;
  },

  removeExercise: (exerciseId: number) => {
    const updated = get().exercises.filter((e) => e.exerciseId !== exerciseId);
    set({ exercises: updated, isActive: updated.length > 0 });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  hasExercise: (exerciseId: number) => {
    return get().exercises.some((e) => e.exerciseId === exerciseId);
  },

  updateSet: (exerciseId, setIndex, field, value) => {
    const updated = get().exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const sets = [...e.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...e, sets };
    });
    set({ exercises: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  toggleSetComplete: (exerciseId, setIndex) => {
    const updated = get().exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const sets = [...e.sets];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      return { ...e, sets };
    });
    set({ exercises: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  addSet: (exerciseId) => {
    const updated = get().exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      return { ...e, sets: [...e.sets, { weight: 0, reps: 0, completed: false }] };
    });
    set({ exercises: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removeSet: (exerciseId, setIndex) => {
    const updated = get().exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const sets = e.sets.filter((_, i) => i !== setIndex);
      return { ...e, sets: sets.length > 0 ? sets : [{ weight: 0, reps: 0, completed: false }] };
    });
    set({ exercises: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  clearWorkout: () => {
    set({ exercises: [], isActive: false });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  startWorkout: () => {
    set({ isActive: true });
  },

  loadWorkout: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let exercises: WorkoutExercise[] = raw ? (JSON.parse(raw) as WorkoutExercise[]) : [];

      // Merge AI-suggested exercises queued for next workout
      const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw) as PendingExercise[];
        for (const p of pending) {
          if (!exercises.some((e) => e.exerciseId === p.exerciseId)) {
            exercises = [...exercises, {
              exerciseId: p.exerciseId,
              addedAt: Date.now(),
              sets: Array.from({ length: p.numSets }, () => ({
                weight: p.weight ?? 0,
                reps: 0,
                completed: false,
              })),
            }];
          }
        }
        await AsyncStorage.removeItem(PENDING_KEY);
      }

      if (exercises.length > 0) {
        set({ exercises, isActive: exercises.length > 0 });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
      }
    } catch {}
  },

  saveExerciseForNextWorkout: async (exerciseId, numSets, weight) => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      const pending: PendingExercise[] = raw ? JSON.parse(raw) : [];
      if (!pending.some((p) => p.exerciseId === exerciseId)) {
        pending.push({ exerciseId, numSets, weight });
        await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      }
    } catch {}
  },
}));
