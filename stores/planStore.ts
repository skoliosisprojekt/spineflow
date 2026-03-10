// SAFETY: Every exercise MUST pass getSafety() !== 'avoid' before being shown.
// This is a HARD requirement. AI suggestions are validated client-side.
// Never trust AI output alone — always verify with getSafety().
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exercises as allExercises, exerciseMods, exerciseFusionMods } from '../data/exercises';
import { getSafety as getExerciseSafety } from '../lib/safety';
import type { Exercise, SurgeryType, CurveType, GoalType, ExperienceType, BodyType, SafetyLevel } from '../types';

export interface PlanExercise {
  exerciseId: number;
  sets: number;
  safety: SafetyLevel;
  note?: string; // modification/safety note
}

export interface WorkoutPlan {
  id: string;
  createdAt: string;
  exercises: PlanExercise[];
  profile: {
    surgery: SurgeryType;
    curveType: CurveType;
    goal: GoalType;
    experience: ExperienceType;
    bodyType: BodyType;
    equipment: string[];
  };
}

interface PlanState {
  plan: WorkoutPlan | null;
  generatePlan: (profile: WorkoutPlan['profile']) => void;  // equipment must be included in profile
  clearPlan: () => void;
  loadPlan: () => Promise<void>;
  addExerciseToPlan: (exerciseId: number, sets: number, curveType: CurveType, surgery: SurgeryType) => void;
  removeExerciseFromPlan: (exerciseId: number) => void;
  replaceExerciseInPlan: (removeId: number, addId: number, sets: number, curveType: CurveType, surgery: SurgeryType) => void;
}

const STORAGE_KEY = 'spineflow_workout_plan';

// Uses the full safety system including surgery downgrades
function getFullSafety(exercise: Exercise, curveType: CurveType, surgery: SurgeryType): SafetyLevel {
  return getExerciseSafety(exercise.id, exercise.safety, curveType, surgery);
}

function scoreSafety(level: SafetyLevel): number {
  if (level === 'safe') return 3;
  if (level === 'modify') return 1;
  return 0; // avoid
}

function generateExercisePlan(profile: WorkoutPlan['profile']): PlanExercise[] {
  const { surgery, curveType, goal, experience, bodyType, equipment } = profile;
  const isPostSurgery = surgery !== 'none';

  // SAFETY FIRST: use full safety system (includes surgery downgrades)
  // Strictly filter out all 'avoid' exercises — these must NEVER appear
  let candidates = allExercises.filter((e) => getFullSafety(e, curveType, surgery) !== 'avoid');

  // EQUIPMENT HARD GATE — only show exercises the user can actually perform
  candidates = candidates.filter(
    (e) => e.equip.length === 0 || e.equip.every((eq) => equipment.includes(eq)),
  );

  // Post-surgery: ONLY 'safe' exercises — never risk 'modify' exercises on fused spines
  if (isPostSurgery) {
    candidates = candidates.filter((e) => getFullSafety(e, curveType, surgery) === 'safe');
  }

  // Sort by safety score (safe first), then by id for stability
  candidates.sort((a, b) => {
    const sa = scoreSafety(getFullSafety(a, curveType, surgery));
    const sb = scoreSafety(getFullSafety(b, curveType, surgery));
    if (sb !== sa) return sb - sa;
    return a.id - b.id;
  });

  // Determine how many exercises per muscle group based on goal + experience
  const muscleTargets: Record<string, number> = {
    chest: 1, back: 2, legs: 2, shoulders: 1, arms: 1, core: 2,
  };

  // Adjust for goal
  if (goal === 'muscle') {
    muscleTargets.chest = 2;
    muscleTargets.back = 2;
    muscleTargets.legs = 2;
    muscleTargets.shoulders = 2;
    muscleTargets.arms = 2;
    muscleTargets.core = 1;
  } else if (goal === 'strength') {
    muscleTargets.chest = 2;
    muscleTargets.back = 2;
    muscleTargets.legs = 3;
    muscleTargets.shoulders = 1;
    muscleTargets.arms = 1;
    muscleTargets.core = 1;
  } else if (goal === 'posture') {
    muscleTargets.chest = 1;
    muscleTargets.back = 3;
    muscleTargets.legs = 1;
    muscleTargets.shoulders = 2;
    muscleTargets.arms = 0;
    muscleTargets.core = 3;
  } else if (goal === 'pain') {
    muscleTargets.chest = 1;
    muscleTargets.back = 2;
    muscleTargets.legs = 1;
    muscleTargets.shoulders = 1;
    muscleTargets.arms = 0;
    muscleTargets.core = 2;
  }

  // Adjust for experience
  if (experience === 'beginner') {
    Object.keys(muscleTargets).forEach((k) => {
      muscleTargets[k] = Math.max(1, muscleTargets[k] - 1);
    });
  } else if (experience === 'advanced') {
    Object.keys(muscleTargets).forEach((k) => {
      muscleTargets[k] = Math.min(muscleTargets[k] + 1, 4);
    });
  }

  // Post-surgery: reduce volume
  if (isPostSurgery) {
    Object.keys(muscleTargets).forEach((k) => {
      muscleTargets[k] = Math.max(1, muscleTargets[k] - 1);
    });
  }

  // Pick exercises per muscle group
  const selected: PlanExercise[] = [];
  const muscles: string[] = ['back', 'legs', 'chest', 'shoulders', 'core', 'arms'];

  for (const muscle of muscles) {
    const count = muscleTargets[muscle] || 0;
    if (count === 0) continue;

    const pool = candidates.filter((e) => e.muscle === muscle);
    const picked = pool.slice(0, count);

    for (const ex of picked) {
      // Determine sets based on exercise data and experience
      const baseSetsMatch = ex.sets.match(/(\d+)/);
      let sets = baseSetsMatch ? parseInt(baseSetsMatch[1], 10) : 3;

      // Adjust sets for experience
      if (experience === 'beginner') sets = Math.max(3, sets - 1);
      if (experience === 'advanced') sets = Math.min(sets + 1, 5);
      if (isPostSurgery) sets = Math.max(3, sets - 1);

      // Adjust for body type
      if (bodyType === 'hardgainer') sets = Math.max(3, sets - 1);
      if (bodyType === 'softgainer') sets = Math.min(sets + 1, 5);

      const safety = getFullSafety(ex, curveType, surgery);
      // Attach specific safety instructions (store i18n key so UI can translate)
      let note: string | undefined;
      if (isPostSurgery && exerciseFusionMods[ex.id]) {
        note = `exerciseFusionMods.${ex.id}`;
      } else if (safety === 'modify' && exerciseMods[ex.id]) {
        note = `exerciseMods.${ex.id}`;
      } else if (safety === 'modify') {
        note = 'workout.modifyForm';
      }

      selected.push({ exerciseId: ex.id, sets, safety, note });
    }
  }

  return selected;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: null,

  generatePlan: (profile) => {
    const exercises = generateExercisePlan(profile);
    const plan: WorkoutPlan = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      exercises,
      profile,
    };
    set({ plan });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan)).catch(() => {});
  },

  clearPlan: () => {
    set({ plan: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },

  addExerciseToPlan: (exerciseId, sets, curveType, surgery) => {
    const { plan } = get();
    if (!plan) return;
    if (plan.exercises.some((e) => e.exerciseId === exerciseId)) return; // already in plan
    const ex = allExercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    const safety = getFullSafety(ex, curveType, surgery);
    if (safety === 'avoid') return; // safety guard
    let note: string | undefined;
    if (surgery !== 'none' && exerciseFusionMods[exerciseId]) note = `exerciseFusionMods.${exerciseId}`;
    else if (safety === 'modify' && exerciseMods[exerciseId]) note = `exerciseMods.${exerciseId}`;
    const updated: WorkoutPlan = {
      ...plan,
      exercises: [...plan.exercises, { exerciseId, sets, safety, note }],
    };
    set({ plan: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removeExerciseFromPlan: (exerciseId) => {
    const { plan } = get();
    if (!plan) return;
    const updated: WorkoutPlan = {
      ...plan,
      exercises: plan.exercises.filter((e) => e.exerciseId !== exerciseId),
    };
    set({ plan: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  replaceExerciseInPlan: (removeId, addId, sets, curveType, surgery) => {
    const { plan } = get();
    if (!plan) return;
    const ex = allExercises.find((e) => e.id === addId);
    if (!ex) return;
    const safety = getFullSafety(ex, curveType, surgery);
    if (safety === 'avoid') return;
    let note: string | undefined;
    if (surgery !== 'none' && exerciseFusionMods[addId]) note = `exerciseFusionMods.${addId}`;
    else if (safety === 'modify' && exerciseMods[addId]) note = `exerciseMods.${addId}`;
    const updated: WorkoutPlan = {
      ...plan,
      exercises: plan.exercises.map((e) =>
        e.exerciseId === removeId ? { exerciseId: addId, sets, safety, note } : e
      ),
    };
    set({ plan: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  loadPlan: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkoutPlan;
        // Invalidate plans generated before equipment filtering was added.
        // If equipment is missing/empty-array-from-old-format, discard the plan
        // so the user is prompted to regenerate with correct filtering.
        if (!Array.isArray(parsed.profile?.equipment)) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }
        set({ plan: parsed });
      }
    } catch {}
  },
}));
