import { supabase } from './supabase';
import { generateShareText } from './shareWorkoutText';
import i18n from '../i18n';
import type { WorkoutRecord } from '../stores/historyStore';
import type { CurveType, SurgeryType, GoalType, ExperienceType } from '../types';
import type { NewAdjustment } from '../db/queries';

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
