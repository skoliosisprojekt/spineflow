import { supabase } from './supabase';
import { generateShareText } from './shareWorkoutText';
import i18n from '../i18n';
import type { WorkoutRecord } from '../stores/historyStore';
import type { CurveType, SurgeryType, GoalType, ExperienceType } from '../types';
import type { NewAdjustment } from '../db/queries';
import { exercises as allExercises, exerciseNames, exerciseMods, exerciseFusionMods } from '../data/exercises';
import { getSafety } from './safety';
import type { GeneratedWorkout, GeneratedWorkoutExercise } from './workoutGenerator';

export interface AIAnalysisParams {
  currentRecord: WorkoutRecord;
  curveType: CurveType;
  surgery: SurgeryType;
  goal: GoalType;
  experience: ExperienceType;
  history: WorkoutRecord[];
  hydrationMl?: number;
  startTime?: string;
  language: string;
}

export interface AIAnalysisResult {
  /** The formatted analysis text (everything before <adjustments>) */
  analysisText: string;
  /** Parsed adjustments from the <adjustments> JSON block */
  adjustments: NewAdjustment[];
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

const ADJUSTMENTS_OPEN = '<adjustments>';
const ADJUSTMENTS_CLOSE = '</adjustments>';

function parseResponse(raw: string): AIAnalysisResult {
  let analysisText = raw;
  let adjustments: NewAdjustment[] = [];

  const openIdx = raw.indexOf(ADJUSTMENTS_OPEN);
  const closeIdx = raw.indexOf(ADJUSTMENTS_CLOSE);

  if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
    analysisText = raw.substring(0, openIdx).trim();
    const jsonStr = raw.substring(openIdx + ADJUSTMENTS_OPEN.length, closeIdx).trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        adjustments = parsed.map((a: any) => ({
          type: a.type || 'adjust',
          exercise_id: a.exercise_id ?? 0,
          reason: a.reason || '',
          replace_with_id: a.replace_with_id ?? null,
          suggested_weight: a.suggested_weight ?? null,
          suggested_sets: a.suggested_sets ?? null,
        }));
      }
    } catch {
      // JSON parse failed — keep analysisText, no adjustments
    }
  }

  return { analysisText, adjustments };
}

// ---------------------------------------------------------------------------
// AI Workout Generation
// ---------------------------------------------------------------------------

export interface AIWorkoutGenerateParams {
  duration: 30 | 45 | 60 | 90;
  profile: {
    curveType: CurveType;
    surgery: SurgeryType;
    goal: GoalType;
    experience: ExperienceType;
    equipment: string[];
  };
  muscleGroups?: string[];
  history: WorkoutRecord[];
  language: string;
}

const WORKOUT_OPEN  = '<workout>';
const WORKOUT_CLOSE = '</workout>';

function parseWorkoutResponse(
  raw: string,
  profile: AIWorkoutGenerateParams['profile'],
): GeneratedWorkoutExercise[] {
  const openIdx  = raw.indexOf(WORKOUT_OPEN);
  const closeIdx = raw.indexOf(WORKOUT_CLOSE);
  if (openIdx === -1 || closeIdx === -1 || closeIdx <= openIdx) return [];

  const jsonStr = raw.substring(openIdx + WORKOUT_OPEN.length, closeIdx).trim();
  let parsed: { exerciseId: number; sets: number; reason?: string }[] = [];
  try {
    const obj = JSON.parse(jsonStr);
    parsed = Array.isArray(obj) ? obj : (obj?.exercises ?? []);
  } catch {
    return [];
  }

  const { curveType, surgery } = profile;
  const isPostSurgery = surgery !== 'none';
  const result: GeneratedWorkoutExercise[] = [];

  for (const item of parsed) {
    const id = Number(item.exerciseId);
    const ex = allExercises.find((e) => e.id === id);
    if (!ex) continue;

    // SAFETY HARD GATE — never show 'avoid' exercises regardless of AI output
    const safetyLevel = getSafety(id, ex.safety, curveType, surgery);
    if (safetyLevel === 'avoid') continue;

    // EQUIPMENT HARD GATE — never show exercises requiring unavailable equipment
    const hasEquip = ex.equip.length === 0 || ex.equip.every((e) => profile.equipment.includes(e));
    if (!hasEquip) continue;

    const sets = Math.max(1, Math.min(6, Number(item.sets) || 3));
    const estimatedMinutes = parseFloat(((ex.timePerSet * sets) / 60).toFixed(1));

    let modification: string | undefined;
    if (safetyLevel === 'modify') {
      const modKey = isPostSurgery
        ? (exerciseFusionMods[id] ? `exerciseFusionMods.${id}` : 'workout.modifyForm')
        : (exerciseMods[id]       ? `exerciseMods.${id}`       : 'workout.modifyForm');
      modification = modKey;
    }

    result.push({
      exerciseId: id,
      name: exerciseNames[id] ?? `Exercise ${id}`,
      muscle: ex.muscle,
      category: ex.category,
      sets,
      safety: safetyLevel as 'safe' | 'modify',
      estimatedMinutes,
      modification,
      reason: item.reason ?? undefined,
    });
  }

  return result;
}

export async function runAIWorkoutGeneration(
  params: AIWorkoutGenerateParams,
): Promise<GeneratedWorkout> {
  const { duration, profile, muscleGroups, history, language } = params;

  // Last 5 workouts for history context
  const recentHistory = [...history].slice(0, 5);

  // Exercise IDs from last 2 workouts — AI should avoid repeating these
  const recentExerciseIds = [...history]
    .slice(0, 2)
    .flatMap((w) => w.exercises.map((e) => e.exerciseId))
    .filter((id, i, arr) => arr.indexOf(id) === i);

  // Build compact history text for the AI
  const historyText = recentHistory.length > 0
    ? recentHistory
        .map((rec, i) => [
          `--- Session ${i + 1} (${new Date(rec.date).toLocaleDateString()}) ---`,
          rec.exercises
            .map((e) => {
              const name = exerciseNames[e.exerciseId] ?? `Ex${e.exerciseId}`;
              const vol  = e.sets.reduce((s, set) => s + set.weight * set.reps, 0);
              return `  ${name}: ${e.sets.length} sets, ${vol.toLocaleString()} kg total`;
            })
            .join('\n'),
        ].join('\n'))
        .join('\n')
    : 'No previous workout history.';

  const { data: { session } } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke('analyze-workout', {
    body: {
      workoutData: historyText,
      profile: {
        curveType:  profile.curveType,
        surgery:    profile.surgery,
        goal:       profile.goal,
        experience: profile.experience,
      },
      language,
      mode: 'generate',
      generationParams: {
        duration,
        muscleGroups: muscleGroups ?? [],
        recentExerciseIds,
        equipment: profile.equipment,
      },
    },
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  });

  if (error) throw new Error(error.message || 'AI workout generation failed');

  const rawText = typeof data === 'string' ? data : (data?.text ?? JSON.stringify(data));
  const exercises = parseWorkoutResponse(rawText, profile);

  if (exercises.length === 0) {
    throw new Error('AI returned no valid exercises. Try regenerating.');
  }

  const totalEstimatedMinutes = Math.round(
    exercises.reduce((s, e) => s + e.estimatedMinutes, 0),
  );
  const muscleGroupDistribution: Record<string, number> = {};
  for (const ex of exercises) {
    muscleGroupDistribution[ex.muscle] = (muscleGroupDistribution[ex.muscle] ?? 0) + 1;
  }

  return { exercises, totalEstimatedMinutes, muscleGroupDistribution };
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export async function runAIAnalysis(params: AIAnalysisParams): Promise<AIAnalysisResult> {
  const { currentRecord, curveType, surgery, goal, experience, history, hydrationMl, startTime } = params;

  // Build combined workout data text
  const currentText = generateShareText({
    record: currentRecord,
    curveType,
    surgery,
    experience,
    history,
    hydrationMl,
    startTime,
  });

  const recentHistory = history
    .filter((w) => w.id !== currentRecord.id)
    .slice(0, 5);

  const historyTexts = recentHistory.map((rec) =>
    generateShareText({
      record: rec,
      curveType,
      surgery,
      experience,
      history: [],
    }),
  );

  const separator = '\n\n--- PREVIOUS WORKOUT ---\n\n';
  const workoutData = [currentText, ...historyTexts].join(separator);

  const { data: { session } } = await supabase.auth.getSession();
  const language = i18n.language || 'en';

  const { data, error } = await supabase.functions.invoke('analyze-workout', {
    body: {
      workoutData,
      profile: { curveType, surgery, goal, experience },
      language,
    },
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  });

  if (error) throw new Error(error.message || 'AI analysis failed');

  // The Edge Function returns the raw text with optional <adjustments> block
  const rawText = typeof data === 'string' ? data : (data?.analysis || data?.text || JSON.stringify(data));
  return parseResponse(rawText);
}
