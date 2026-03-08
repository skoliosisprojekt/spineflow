import { supabase } from './supabase';
import type { WorkoutRecord } from '../stores/historyStore';

export interface CloudProfile {
  surgery: string;
  curve_type: string;
  goal: string;
  experience: string;
  body_type: string;
  equipment: string[];
  language: string;
  theme: string;
  units: string;
  profile_complete: boolean;
}

/** Upserts user profile fields. Call fire-and-forget (.catch(() => {})). */
export async function saveProfileToCloud(
  userId: string,
  data: Partial<CloudProfile>,
): Promise<void> {
  await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
}

/** Returns the cloud profile row, or null if not found / offline. */
export async function loadProfileFromCloud(userId: string): Promise<CloudProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select(
      'surgery, curve_type, goal, experience, body_type, equipment, language, theme, units, profile_complete',
    )
    .eq('user_id', userId)
    .maybeSingle();
  return (data as CloudProfile) ?? null;
}

/** Upserts a single workout record. Call fire-and-forget. */
export async function saveWorkoutToCloud(
  userId: string,
  record: WorkoutRecord,
): Promise<void> {
  await supabase.from('workout_history').upsert(
    {
      id: record.id,
      user_id: userId,
      date: record.date,
      exercises: record.exercises,
      total_sets: record.totalSets,
      completed_sets: record.completedSets,
      total_volume: record.totalVolume,
      total_reps: record.totalReps,
      duration_ms: record.durationMs ?? null,
    },
    { onConflict: 'id' },
  );
}

/** Fetches up to 200 latest workout records for a user. */
export async function loadHistoryFromCloud(userId: string): Promise<WorkoutRecord[]> {
  const { data } = await supabase
    .from('workout_history')
    .select(
      'id, date, exercises, total_sets, completed_sets, total_volume, total_reps, duration_ms',
    )
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(200);
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    date: r.date,
    exercises: r.exercises,
    totalSets: r.total_sets,
    completedSets: r.completed_sets,
    totalVolume: r.total_volume,
    totalReps: r.total_reps,
    durationMs: r.duration_ms ?? undefined,
  }));
}
