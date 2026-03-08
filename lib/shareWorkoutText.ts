import { Share, Platform } from 'react-native';
// @ts-ignore – deprecated but works without native rebuild
import { Clipboard } from 'react-native';
import { exercises as allExercises, exerciseNames, exerciseMods } from '../data/exercises';
import { getSafety } from './safety';
import type { WorkoutRecord, CompletedExercise } from '../stores/historyStore';
import type { CurveType, SurgeryType, ExperienceType } from '../types';

export interface ShareWorkoutParams {
  record: WorkoutRecord;
  curveType: CurveType;
  surgery: SurgeryType;
  experience: ExperienceType;
  /** Previous workout history (excluding the current record) for PR detection */
  history: WorkoutRecord[];
  /** Today's hydration in ml */
  hydrationMl?: number;
  /** Workout start time ISO string (if tracked) */
  startTime?: string;
}

// ---------------------------------------------------------------------------
// PR detection helpers
// ---------------------------------------------------------------------------

interface ExerciseBest {
  maxWeight: number;
  maxReps: number;
  maxSetVolume: number; // single-set volume
}

function buildHistoricalBests(history: WorkoutRecord[]): Map<number, ExerciseBest> {
  const map = new Map<number, ExerciseBest>();
  for (const w of history) {
    for (const ex of w.exercises) {
      const prev = map.get(ex.exerciseId) || { maxWeight: 0, maxReps: 0, maxSetVolume: 0 };
      for (const s of ex.sets) {
        if (s.weight > prev.maxWeight) prev.maxWeight = s.weight;
        if (s.reps > prev.maxReps) prev.maxReps = s.reps;
        const vol = s.weight * s.reps;
        if (vol > prev.maxSetVolume) prev.maxSetVolume = vol;
      }
      map.set(ex.exerciseId, prev);
    }
  }
  return map;
}

function detectPRs(
  ex: CompletedExercise,
  bests: Map<number, ExerciseBest>,
): { weightPR: boolean; repsPR: boolean; volumePR: boolean } {
  const prev = bests.get(ex.exerciseId);
  if (!prev) return { weightPR: true, repsPR: true, volumePR: true }; // first time = all PRs
  let weightPR = false;
  let repsPR = false;
  let volumePR = false;
  for (const s of ex.sets) {
    if (s.weight > prev.maxWeight) weightPR = true;
    if (s.reps > prev.maxReps) repsPR = true;
    if (s.weight * s.reps > prev.maxSetVolume) volumePR = true;
  }
  return { weightPR, repsPR, volumePR };
}

// ---------------------------------------------------------------------------
// Text generation
// ---------------------------------------------------------------------------

export function generateShareText(params: ShareWorkoutParams): string {
  const { record, curveType, surgery, experience, history, hydrationMl, startTime } = params;

  const d = new Date(record.date);
  const dateStr = d.toLocaleDateString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  // Duration
  let durationMin = 0;
  if (record.durationMs) {
    durationMin = Math.round(record.durationMs / 60000);
  } else if (startTime) {
    durationMin = Math.max(0, Math.round((d.getTime() - new Date(startTime).getTime()) / 60000));
  }

  // Historical bests (exclude current record)
  const bests = buildHistoricalBests(history.filter((w) => w.id !== record.id));

  // Muscle group counts (number of exercises per muscle)
  const muscleCounts = new Map<string, number>();
  for (const ex of record.exercises) {
    const info = allExercises.find((e) => e.id === ex.exerciseId);
    const muscle = info?.muscle || 'other';
    muscleCounts.set(muscle, (muscleCounts.get(muscle) || 0) + 1);
  }

  const lines: string[] = [];

  // Header
  lines.push(`SPINEFLOW WORKOUT — ${dateStr}, ${timeStr}`);
  lines.push('');
  lines.push(`Profil: ${curveType}, ${surgery === 'none' ? 'no surgery' : surgery}, ${experience}`);
  if (durationMin > 0) lines.push(`Dauer: ${durationMin} Min`);
  lines.push(`Uebungen: ${record.exercises.length} | Sets: ${record.completedSets} | Gesamtvolumen: ${record.totalVolume.toLocaleString()} kg`);
  lines.push('');

  // Exercises
  for (let idx = 0; idx < record.exercises.length; idx++) {
    const ex = record.exercises[idx];
    const name = exerciseNames[ex.exerciseId] || `Exercise ${ex.exerciseId}`;
    const info = allExercises.find((e) => e.id === ex.exerciseId);
    const muscle = info?.muscle || 'unknown';
    const safetyLevel = info ? getSafety(ex.exerciseId, info.safety, curveType, surgery) : 'safe';

    const exVolume = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
    const prs = detectPRs(ex, bests);
    const prTags: string[] = [];
    if (prs.weightPR) prTags.push('Weight PR!');
    if (prs.volumePR) prTags.push('Volume PR!');
    if (prs.repsPR) prTags.push('Reps PR!');

    const prStr = prTags.length > 0 ? `  ${prTags.join(' | ')}` : '';
    lines.push(`${idx + 1}. ${name} (${muscle}) — ${safetyLevel.toUpperCase()}${prStr}`);

    if (safetyLevel === 'modify') {
      const mod = exerciseMods[ex.exerciseId];
      if (mod) lines.push(`   Modification: ${mod}`);
    }

    for (let i = 0; i < ex.sets.length; i++) {
      const s = ex.sets[i];
      lines.push(`   Set ${i + 1}: ${s.weight}kg x ${s.reps}`);
    }

    if (exVolume > 0) {
      lines.push(`   Volumen: ${exVolume.toLocaleString()} kg`);
    }
    lines.push('');
  }

  // Muscle group summary
  if (muscleCounts.size > 0) {
    const parts = [...muscleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([m, c]) => `${m.charAt(0).toUpperCase() + m.slice(1)} (${c})`);
    lines.push(`Muskelgruppen: ${parts.join(', ')}`);
  }

  // Hydration
  if (hydrationMl !== undefined && hydrationMl > 0) {
    lines.push(`Hydration: ${(hydrationMl / 1000).toFixed(1)} L`);
  }

  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Share + Copy actions
// ---------------------------------------------------------------------------

export async function shareWorkoutText(text: string): Promise<void> {
  await Share.share(
    Platform.OS === 'ios'
      ? { message: text }
      : { message: text, title: 'SpineFlow Workout Report' },
  );
}

export function copyWorkoutText(text: string): void {
  Clipboard.setString(text);
}
