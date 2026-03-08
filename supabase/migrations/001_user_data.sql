-- ============================================================
-- SpineFlow Cloud Sync Tables
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- user_profiles: one row per authenticated user
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id          TEXT PRIMARY KEY,
  surgery          TEXT NOT NULL DEFAULT 'none',
  curve_type       TEXT NOT NULL DEFAULT 'thoracic',
  goal             TEXT NOT NULL DEFAULT 'muscle',
  experience       TEXT NOT NULL DEFAULT 'beginner',
  body_type        TEXT NOT NULL DEFAULT 'normal',
  equipment        JSONB NOT NULL DEFAULT '[]',
  language         TEXT NOT NULL DEFAULT 'en',
  theme            TEXT NOT NULL DEFAULT 'system',
  units            TEXT NOT NULL DEFAULT 'kg',
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile access"
  ON user_profiles FOR ALL
  TO authenticated
  USING  (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- workout_history: many rows per user
CREATE TABLE IF NOT EXISTS workout_history (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  date           TEXT NOT NULL,
  exercises      JSONB NOT NULL DEFAULT '[]',
  total_sets     INTEGER NOT NULL DEFAULT 0,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  total_volume   REAL NOT NULL DEFAULT 0,
  total_reps     INTEGER NOT NULL DEFAULT 0,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_history_user_date
  ON workout_history (user_id, date DESC);

ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own history access"
  ON workout_history FOR ALL
  TO authenticated
  USING  (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
