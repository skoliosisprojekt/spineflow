// SAFETY: Every exercise MUST pass getSafety() !== 'avoid' before being shown.
// This is a HARD requirement. AI suggestions are validated client-side.
// Never trust AI output alone — always verify with getSafety().
//
// This module provides shared safety-filtering utilities used by:
//   - stores/planStore.ts (free workout generator)
//   - app/(tabs)/workout.tsx (AI analysis adjustment cards)
//   - lib/aiAnalysis.ts (AI-generated exercise lists)

import { exercises as allExercises, exerciseNames, exerciseMods, exerciseFusionMods } from '../data/exercises';
import { getSafety } from './safety';
import type { CurveType, ExerciseCategory, GoalType, ExperienceType, SafetyLevel, SurgeryType, Exercise } from '../types';

/**
 * Returns true if the exercise is safe or modifiable for this user profile.
 * Returns false (HARD BLOCK) if getSafety() === 'avoid'.
 */
export function isExerciseAllowed(
  exerciseId: number,
  curveType: CurveType,
  surgery: SurgeryType,
): boolean {
  const ex = allExercises.find((e) => e.id === exerciseId);
  if (!ex) return false; // Unknown exercise — block it
  return getSafety(exerciseId, ex.safety, curveType, surgery) !== 'avoid';
}

/**
 * Returns the SafetyLevel for an exercise, or 'avoid' if the exercise is unknown.
 */
export function getExerciseSafetyLevel(
  exerciseId: number,
  curveType: CurveType,
  surgery: SurgeryType,
): SafetyLevel {
  const ex = allExercises.find((e) => e.id === exerciseId);
  if (!ex) return 'avoid';
  return getSafety(exerciseId, ex.safety, curveType, surgery);
}

/**
 * Filters a list of exercise IDs, removing any that are 'avoid' for this profile.
 * Use this as the final safety gate on any AI-generated exercise list.
 */
export function filterSafeExerciseIds(
  ids: number[],
  curveType: CurveType,
  surgery: SurgeryType,
): number[] {
  return ids.filter((id) => isExerciseAllowed(id, curveType, surgery));
}

// ─── Smart Workout Generator ──────────────────────────────────────────────────

export interface GeneratedWorkoutExercise {
  exerciseId: number;
  name: string;
  muscle: string;
  category: ExerciseCategory;
  sets: number;
  safety: 'safe' | 'modify';
  estimatedMinutes: number;
  modification?: string;
  reason?: string; // KI-Begründung — only present for AI-generated workouts
}

export interface GeneratedWorkout {
  exercises: GeneratedWorkoutExercise[];
  totalEstimatedMinutes: number;
  muscleGroupDistribution: Record<string, number>;
}

export interface WorkoutProfile {
  curveType: CurveType;
  surgery: SurgeryType;
  goal: GoalType;
  experience: ExperienceType;
  equipment: string[];
}

/**
 * Generates a safe, ordered, time-fitted workout for a scoliosis patient.
 *
 * Order guarantee: activation → compound (heaviest first) → isolation → core
 * Safety guarantee: no 'avoid' exercise ever reaches the output.
 */
export function generateWorkout(
  duration: 30 | 45 | 60 | 90,
  profile: WorkoutProfile,
  muscleGroups?: string[],
): GeneratedWorkout {
  const { curveType, surgery, goal, experience, equipment } = profile;
  const isPostSurgery = surgery !== 'none';

  // ── STEP 1: Filter pool ────────────────────────────────────────────────────
  const pool = allExercises.filter((ex) => {
    // Equipment: bodyweight exercises always available; otherwise user must own all required items
    const hasEquip = ex.equip.length === 0 || ex.equip.every((e) => equipment.includes(e));
    if (!hasEquip) return false;
    // SAFETY HARD GATE
    if (getSafety(ex.id, ex.safety, curveType, surgery) === 'avoid') return false;
    // Optional muscle group filter
    if (muscleGroups?.length && !muscleGroups.includes(ex.muscle)) return false;
    return true;
  });

  // ── STEP 2: Target exercise count ─────────────────────────────────────────
  const targetCount = duration === 30 ? 5 : duration === 45 ? 7 : duration === 60 ? 9 : 12;

  // ── STEP 3: Score + select ─────────────────────────────────────────────────
  function scoreExercise(ex: Exercise, muscleCounts: Record<string, number>): number {
    // Hard cap: max 3 exercises per muscle group
    if ((muscleCounts[ex.muscle] ?? 0) >= 3) return -999;

    let score = ex.priority;

    // Goal biasing
    if (goal === 'posture') {
      if (ex.muscle === 'back') score += 2;
      if (ex.muscle === 'shoulders') score += 1;
      if (ex.category === 'core' || ex.category === 'activation') score += 1;
    } else if (goal === 'strength') {
      if (ex.category === 'compound') score += 2;
    } else if (goal === 'pain') {
      if (ex.category === 'activation' || ex.category === 'core') score += 2;
      if (ex.category === 'isolation') score += 1;
      if (ex.category === 'compound') score -= 2;
    } else {
      // muscle: balanced but back still gets a nudge
      if (ex.muscle === 'back') score += 1;
    }

    // Scoliosis rule: back exercises should be ~2× chest exercises.
    // Penalise chest if adding it would break the 2:1 ratio.
    if (ex.muscle === 'chest') {
      const backCount = muscleCounts['back'] ?? 0;
      const chestCount = muscleCounts['chest'] ?? 0;
      if ((chestCount + 1) * 2 > backCount + 1) score -= 3;
    }

    return score;
  }

  const activationPool = pool.filter((e) => e.category === 'activation');
  const compoundPool   = pool.filter((e) => e.category === 'compound');
  const isolationPool  = pool.filter((e) => e.category === 'isolation');
  const corePool       = pool.filter((e) => e.category === 'core');

  // Pick the single best activation and core exercise (reserved slots)
  const pickBest = (arr: Exercise[]): Exercise | undefined =>
    arr.length === 0 ? undefined : arr.reduce((b, e) => (e.priority > b.priority ? e : b));

  const bestActivation = pickBest(activationPool);
  const bestCore       = pickBest(corePool);

  const pickedActivation: Exercise[] = bestActivation ? [bestActivation] : [];
  const pickedCore: Exercise[]       = bestCore       ? [bestCore]       : [];

  const reservedIds = new Set([...pickedActivation, ...pickedCore].map((e) => e.id));
  const mainSlots   = Math.max(0, targetCount - pickedActivation.length - pickedCore.length);

  // Main pool: compounds + isolations (excluding reserved)
  const mainPool = [...compoundPool, ...isolationPool].filter((e) => !reservedIds.has(e.id));

  // Greedy selection — re-evaluate scores after each pick so muscle balance
  // and back:chest ratio are respected dynamically
  const mainSelected: Exercise[] = [];
  const muscleCounts: Record<string, number> = {};
  for (const ex of pickedActivation) {
    muscleCounts[ex.muscle] = (muscleCounts[ex.muscle] ?? 0) + 1;
  }

  const remaining = [...mainPool];
  for (let i = 0; i < mainSlots && remaining.length > 0; i++) {
    let bestScore = -Infinity;
    let bestIdx   = -1;
    for (let j = 0; j < remaining.length; j++) {
      const s = scoreExercise(remaining[j], muscleCounts);
      if (s > bestScore) { bestScore = s; bestIdx = j; }
    }
    if (bestIdx < 0 || bestScore <= -100) break;
    const picked = remaining.splice(bestIdx, 1)[0];
    mainSelected.push(picked);
    muscleCounts[picked.muscle] = (muscleCounts[picked.muscle] ?? 0) + 1;
  }

  // ── STEP 4: Order: activation → compound (heavy first) → isolation → core ─
  const categoryOrder: Record<ExerciseCategory, number> = {
    activation: 0, compound: 1, isolation: 2, core: 3,
  };

  const allSelected = [...pickedActivation, ...mainSelected, ...pickedCore];
  allSelected.sort((a, b) => {
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (catDiff !== 0) return catDiff;
    // Within compounds: heavier (more timePerSet) goes first to protect a fresh spine
    if (a.category === 'compound') return b.timePerSet - a.timePerSet;
    return 0;
  });

  // ── STEP 5: Assign sets + build result ────────────────────────────────────
  function assignSets(ex: Exercise): number {
    let sets = experience === 'advanced' ? 4 : 3;
    if (experience === 'intermediate' && ex.category === 'compound') sets = 4;
    if (duration === 30) sets = Math.max(2, sets - 1);
    if (duration === 90 && ex.category === 'compound') sets = Math.min(5, sets + 1);
    return sets;
  }

  const resultExercises: GeneratedWorkoutExercise[] = allSelected.map((ex) => {
    const safetyLevel = getSafety(ex.id, ex.safety, curveType, surgery);
    const sets = assignSets(ex);
    const estimatedMinutes = parseFloat(((ex.timePerSet * sets) / 60).toFixed(1));

    let modification: string | undefined;
    if (safetyLevel === 'modify') {
      modification = (isPostSurgery ? exerciseFusionMods[ex.id] : exerciseMods[ex.id])
        ?? 'Modified form required — see exercise details.';
    }

    return {
      exerciseId: ex.id,
      name: exerciseNames[ex.id] ?? `Exercise ${ex.id}`,
      muscle: ex.muscle,
      category: ex.category,
      sets,
      safety: safetyLevel as 'safe' | 'modify',
      estimatedMinutes,
      modification,
    };
  });

  const totalEstimatedMinutes = Math.round(
    resultExercises.reduce((sum, e) => sum + e.estimatedMinutes, 0),
  );

  const muscleGroupDistribution: Record<string, number> = {};
  for (const ex of resultExercises) {
    muscleGroupDistribution[ex.muscle] = (muscleGroupDistribution[ex.muscle] ?? 0) + 1;
  }

  return { exercises: resultExercises, totalEstimatedMinutes, muscleGroupDistribution };
}
