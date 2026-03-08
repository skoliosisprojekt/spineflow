import { supabase } from './supabase';
import {
  dbGetPendingUpsertMeals, dbGetPendingDeleteMeals,
  dbGetPendingUpsertHydration, dbGetPendingDeleteHydration,
  dbMarkMealSynced, dbMarkHydrationSynced,
  dbHardDeleteMeal, dbHardDeleteHydration,
  dbUpsertPulledMeal, dbUpsertPulledHydration,
} from './db';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SupaMealRow {
  local_id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  date: string;
  timestamp: number;
}

interface SupaHydrationRow {
  local_id: number;
  amount_ml: number;
  beverage_type: string;
  date: string;
  timestamp: number;
}

// ── Push (Local → Cloud) ──────────────────────────────────────────────────────
/**
 * Pushes all unsynced local rows to Supabase.
 * Safe to call repeatedly — idempotent via upsert on (user_id, local_id).
 * Silently skips rows that fail so a single bad row never blocks the queue.
 */
export async function pushNutritionToCloud(userId: string): Promise<void> {
  await Promise.allSettled([
    pushMeals(userId),
    pushHydration(userId),
  ]);
}

async function pushMeals(userId: string): Promise<void> {
  // Upsert new/updated rows
  const toUpsert = dbGetPendingUpsertMeals();
  for (const row of toUpsert) {
    try {
      const { error } = await supabase.from('nutrition_meals').upsert(
        {
          user_id: userId,
          local_id: row.id,
          name: row.name,
          calories: row.calories,
          protein: row.protein,
          carbs: row.carbs,
          fat: row.fat,
          meal_type: row.meal_type,
          date: row.date,
          timestamp: row.timestamp,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,local_id' },
      );
      if (!error) dbMarkMealSynced(row.id);
    } catch { /* leave synced=0, retry next push */ }
  }

  // Hard-delete rows that were soft-deleted locally
  const toDelete = dbGetPendingDeleteMeals();
  for (const row of toDelete) {
    try {
      const { error } = await supabase
        .from('nutrition_meals')
        .delete()
        .match({ user_id: userId, local_id: row.id });
      if (!error) await dbHardDeleteMeal(row.id);
    } catch { /* leave for next push */ }
  }
}

async function pushHydration(userId: string): Promise<void> {
  const toUpsert = dbGetPendingUpsertHydration();
  for (const row of toUpsert) {
    try {
      const { error } = await supabase.from('nutrition_hydration').upsert(
        {
          user_id: userId,
          local_id: row.id,
          amount_ml: row.amount_ml,
          beverage_type: row.beverage_type,
          date: row.date,
          timestamp: row.timestamp,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,local_id' },
      );
      if (!error) dbMarkHydrationSynced(row.id);
    } catch { /* leave synced=0, retry next push */ }
  }

  const toDelete = dbGetPendingDeleteHydration();
  for (const row of toDelete) {
    try {
      const { error } = await supabase
        .from('nutrition_hydration')
        .delete()
        .match({ user_id: userId, local_id: row.id });
      if (!error) await dbHardDeleteHydration(row.id);
    } catch { /* leave for next push */ }
  }
}

// ── Pull (Cloud → Local) ──────────────────────────────────────────────────────
/**
 * Fetches ALL of the user's nutrition data from Supabase and inserts any rows
 * not already present in local SQLite (INSERT OR IGNORE by primary key).
 * Call this once after login / on a fresh install to restore historical data.
 * 5-second timeout prevents app hang on slow connections.
 */
export async function pullNutritionFromCloud(userId: string): Promise<void> {
  await Promise.allSettled([
    withTimeout(pullMeals(userId), 5_000),
    withTimeout(pullHydration(userId), 5_000),
  ]);
}

async function pullMeals(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('nutrition_meals')
    .select('local_id, name, calories, protein, carbs, fat, meal_type, date, timestamp')
    .eq('user_id', userId);
  if (error || !data) return;
  for (const row of data as SupaMealRow[]) {
    try { dbUpsertPulledMeal(row); } catch { /* skip conflicting row */ }
  }
}

async function pullHydration(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('nutrition_hydration')
    .select('local_id, amount_ml, beverage_type, date, timestamp')
    .eq('user_id', userId);
  if (error || !data) return;
  for (const row of data as SupaHydrationRow[]) {
    try { dbUpsertPulledHydration(row); } catch { /* skip conflicting row */ }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
