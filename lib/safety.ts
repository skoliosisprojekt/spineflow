import type { SafetyLevel, SurgeryType, CurveType } from '../types';

const surgeryDowngrade: Record<string, Record<string, SafetyLevel>> = {
  none:    { safe: 'safe',   modify: 'modify', avoid: 'avoid' },
  partial: { safe: 'modify', modify: 'avoid',  avoid: 'avoid' },
  full:    { safe: 'avoid',  modify: 'avoid',  avoid: 'avoid' },
  vbt:     { safe: 'safe',   modify: 'modify', avoid: 'avoid' },
  rods:    { safe: 'modify', modify: 'avoid',  avoid: 'avoid' },
};

const fusionSafeExercises = [7, 9, 12, 14, 20, 24, 25, 27, 32, 33];

const fusionOverrides: Record<number, Record<string, SafetyLevel>> = {
  2:  { partial: 'modify', full: 'modify' },
  4:  { partial: 'safe',   full: 'modify' },
  5:  { partial: 'safe',   full: 'safe' },
  7:  { partial: 'safe',   full: 'safe' },
  9:  { partial: 'safe',   full: 'safe' },
  11: { partial: 'safe',   full: 'modify' },
  12: { partial: 'safe',   full: 'safe' },
  14: { partial: 'safe',   full: 'safe' },
  16: { partial: 'safe',   full: 'safe' },
  17: { partial: 'safe',   full: 'safe' },
  20: { partial: 'safe',   full: 'safe' },
  21: { partial: 'safe',   full: 'modify' },
  23: { partial: 'modify', full: 'modify' },
  24: { partial: 'safe',   full: 'safe' },
  25: { partial: 'safe',   full: 'safe' },
  26: { partial: 'safe',   full: 'modify' },
  27: { partial: 'safe',   full: 'safe' },
  28: { partial: 'safe',   full: 'safe' },
  30: { partial: 'safe',   full: 'modify' },
  32: { partial: 'safe',   full: 'safe' },
  33: { partial: 'safe',   full: 'safe' },
  34: { partial: 'safe',   full: 'modify' },
};

export function getSafety(
  exerciseId: number,
  exerciseSafety: Record<string, SafetyLevel>,
  curveType: CurveType,
  surgery: SurgeryType
): SafetyLevel {
  const baseSafety = exerciseSafety[curveType] || 'modify';
  if (surgery === 'none' || surgery === 'vbt') return baseSafety;
  if (fusionOverrides[exerciseId]?.[surgery]) {
    return fusionOverrides[exerciseId][surgery];
  }
  if (fusionSafeExercises.includes(exerciseId)) return baseSafety;
  return surgeryDowngrade[surgery]?.[baseSafety] || baseSafety;
}
