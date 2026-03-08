import { getDatabase, type WorkoutAdjustment, type AdjustmentStatus } from './schema';

export interface NewAdjustment {
  type: 'add' | 'remove' | 'adjust';
  exercise_id: number;
  reason: string;
  replace_with_id?: number | null;
  suggested_weight?: number | null;
  suggested_sets?: string | null;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getPendingAdjustments(userId: string): Promise<WorkoutAdjustment[]> {
  const db = await getDatabase();
  return db.getAllAsync<WorkoutAdjustment>(
    `SELECT * FROM workout_adjustments WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC`,
    [userId],
  );
}

export async function updateAdjustmentStatus(id: string, status: AdjustmentStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE workout_adjustments SET status = ? WHERE id = ?`,
    [status, id],
  );
}

export async function saveAdjustments(userId: string, adjustments: NewAdjustment[]): Promise<void> {
  if (adjustments.length === 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const a of adjustments) {
      await db.runAsync(
        `INSERT INTO workout_adjustments (id, user_id, type, exercise_id, reason, replace_with_id, suggested_weight, suggested_sets)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          userId,
          a.type,
          a.exercise_id,
          a.reason,
          a.replace_with_id ?? null,
          a.suggested_weight ?? null,
          a.suggested_sets ?? null,
        ],
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Workout analyses (rate limiting + re-view)
// ---------------------------------------------------------------------------

export interface StoredAnalysis {
  id: string;
  workout_id: string;
  analysis: string;
  created_at: string;
}

export async function getAnalysis(workoutId: string): Promise<StoredAnalysis | null> {
  const db = await getDatabase();
  return db.getFirstAsync<StoredAnalysis>(
    `SELECT * FROM workout_analyses WHERE workout_id = ?`,
    [workoutId],
  );
}

export async function saveAnalysis(workoutId: string, analysis: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_analyses (id, workout_id, analysis) VALUES (?, ?, ?)`,
    [uuid(), workoutId, analysis],
  );
}

export async function clearOldAdjustments(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM workout_adjustments
     WHERE user_id = ?
       AND status IN ('accepted', 'dismissed')
       AND datetime(created_at) < datetime('now', '-30 days')`,
    [userId],
  );
}
