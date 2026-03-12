import type { GoalType, ExperienceType, BodyType, SurgeryType, Gender } from '../types';
import type { MaterialIcons } from '@expo/vector-icons';

export type SupplementCategory = 'performance' | 'spine' | 'recovery' | 'general';

export interface SupplementRec {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  category: SupplementCategory;
  priority: number;
}

const ALL_SUPPLEMENTS: Omit<SupplementRec, 'priority'>[] = [
  { key: 'creatine',    icon: 'bolt',            color: '#5B8DEF', category: 'performance' },
  { key: 'protein',     icon: 'fitness-center',  color: '#00B894', category: 'performance' },
  { key: 'magnesium',   icon: 'nights-stay',     color: '#AF52DE', category: 'recovery'    },
  { key: 'vitaminD',    icon: 'wb-sunny',        color: '#FF9500', category: 'spine'       },
  { key: 'omega3',      icon: 'water-drop',      color: '#5B8DEF', category: 'spine'       },
  { key: 'collagen',    icon: 'healing',         color: '#FF6B6B', category: 'spine'       },
  { key: 'betaAlanine', icon: 'speed',           color: '#FF9500', category: 'performance' },
  { key: 'caffeine',    icon: 'coffee',          color: '#8D6E63', category: 'performance' },
];

export function getSupplements(profile: {
  goal: GoalType;
  experience: ExperienceType;
  bodyType: BodyType;
  surgery: SurgeryType;
  age: number;
  gender: Gender;
}): SupplementRec[] {
  const { goal, experience, bodyType, surgery, age } = profile;
  const hasSurgery = surgery !== 'none';
  const isMuscle   = goal === 'muscle' || goal === 'strength';
  const isPain     = goal === 'pain';
  const isPosture  = goal === 'posture';

  const scores: Record<string, number> = {
    creatine:    0,
    protein:     0,
    magnesium:   0,
    vitaminD:    0,
    omega3:      0,
    collagen:    0,
    betaAlanine: 0,
    caffeine:    0,
  };

  // Creatine — muscle/strength
  if (isMuscle) scores.creatine += 10;
  if (bodyType === 'hardgainer') scores.creatine += 2;

  // Protein — muscle or hardgainer
  if (isMuscle) scores.protein += 9;
  if (bodyType === 'hardgainer') scores.protein += 3;

  // Magnesium — universal recovery, especially valuable for pain & surgery
  scores.magnesium += 5;
  if (isPain || hasSurgery) scores.magnesium += 4;
  if (isPosture) scores.magnesium += 2;

  // Vitamin D3+K2 — bone/spine health
  scores.vitaminD += 4;
  if (hasSurgery) scores.vitaminD += 6;
  if (isPain || isPosture) scores.vitaminD += 4;
  if (age > 40) scores.vitaminD += 3;

  // Omega-3 — anti-inflammatory
  if (isPain || hasSurgery) scores.omega3 += 9;
  if (isPosture) scores.omega3 += 3;
  if (age > 40) scores.omega3 += 2;

  // Collagen + Glucosamine — spinal discs & joints
  if (hasSurgery) scores.collagen += 9;
  if (isPain || isPosture) scores.collagen += 6;
  if (age > 40) scores.collagen += 2;

  // Beta-Alanine — advanced endurance/strength
  if (isMuscle && experience === 'advanced') scores.betaAlanine += 7;
  if (isMuscle && experience === 'intermediate') scores.betaAlanine += 4;

  // Caffeine / Pre-Workout — performance, not for beginners
  if (isMuscle && experience !== 'beginner') scores.caffeine += 6;

  return ALL_SUPPLEMENTS
    .map((s) => ({ ...s, priority: scores[s.key] }))
    .filter((s) => s.priority > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
}
