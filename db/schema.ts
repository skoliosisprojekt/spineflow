import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'spineflow.db';

let _db: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  _db = await openDatabaseAsync(DB_NAME);
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_adjustments (
      id              TEXT    PRIMARY KEY,
      user_id         TEXT    NOT NULL,
      type            TEXT    NOT NULL CHECK(type IN ('add', 'remove', 'adjust')),
      exercise_id     INTEGER NOT NULL,
      reason          TEXT    NOT NULL,
      replace_with_id INTEGER,
      suggested_weight REAL,
      suggested_sets  TEXT,
      status          TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'dismissed')),
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_adjustments_user_status
      ON workout_adjustments (user_id, status);

    CREATE TABLE IF NOT EXISTS workout_analyses (
      id          TEXT PRIMARY KEY,
      workout_id  TEXT NOT NULL UNIQUE,
      analysis    TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return _db;
}

export type AdjustmentType = 'add' | 'remove' | 'adjust';
export type AdjustmentStatus = 'pending' | 'accepted' | 'dismissed';

export interface WorkoutAdjustment {
  id: string;
  user_id: string;
  type: AdjustmentType;
  exercise_id: number;
  reason: string;
  replace_with_id: number | null;
  suggested_weight: number | null;
  suggested_sets: string | null;
  status: AdjustmentStatus;
  created_at: string;
}
