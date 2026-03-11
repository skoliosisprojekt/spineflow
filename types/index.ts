export type SurgeryType = 'none' | 'partial' | 'full' | 'vbt' | 'rods';
export type CurveType = 'thoracic' | 'lumbar' | 'thoracolumbar' | 'scurve' | 'unsure';
export type GoalType = 'muscle' | 'strength' | 'posture' | 'pain';
export type ExperienceType = 'beginner' | 'intermediate' | 'advanced';
export type BodyType = 'hardgainer' | 'normal' | 'softgainer';
export type SafetyLevel = 'safe' | 'modify' | 'avoid';
export type ExerciseCategory = 'activation' | 'compound' | 'isolation' | 'core';
export type ThemeMode = 'system' | 'light' | 'dark';
export type WeightUnit = 'kg' | 'lbs';
export type HydrationType = 'water' | 'shake' | 'bcaa';
export type Gender = 'male' | 'female' | 'diverse';

export interface UserProfile {
  id: string;
  surgery: SurgeryType;
  curveType: CurveType;
  goal: GoalType;
  experience: ExperienceType;
  bodyType: BodyType;
  equipment: string[];
  language: string;
  theme: ThemeMode;
  units: WeightUnit;
}

export interface Exercise {
  id: number;
  muscle: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
  sets: string;
  rest: string;
  targets: string[];
  equip: string[];
  safety: Record<string, SafetyLevel>;
  timePerSet: number;        // seconds per set including rest
  category: ExerciseCategory;
  priority: 1 | 2 | 3 | 4 | 5; // higher = more important for scoliosis
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  isPr: boolean;
}
