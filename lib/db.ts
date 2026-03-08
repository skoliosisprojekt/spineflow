import { type SQLiteDatabase } from 'expo-sqlite';

// ── Singleton DB instance ─────────────────────────────────────────────────────
// Set by onDbInit() which is passed as the onInit prop to <SQLiteProvider>.
// Never call getDb() before SQLiteProvider has finished initialising.
let _db: SQLiteDatabase | null = null;

function getDb(): SQLiteDatabase {
  if (!_db) throw new Error('[db] SQLiteProvider has not finished initialising yet.');
  return _db;
}

// ── Schema initialisation ─────────────────────────────────────────────────────
// Pass this function as the `onInit` prop of <SQLiteProvider> in _layout.tsx.
// SQLiteProvider opens the database on the correct native thread and passes
// the ready instance here before rendering any children.
export async function onDbInit(db: SQLiteDatabase): Promise<void> {
  _db = db; // set immediately so CRUD can run even if schema init partially fails
  try {
  // One execAsync per statement — avoids native multi-statement parsing issues
  try { await db.execAsync('PRAGMA journal_mode = WAL'); } catch { /* non-fatal */ }
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS meals (' +
    '  id         INTEGER PRIMARY KEY AUTOINCREMENT,' +
    '  name       TEXT    NOT NULL,' +
    '  calories   INTEGER NOT NULL DEFAULT 0,' +
    '  protein    REAL    NOT NULL DEFAULT 0,' +
    '  carbs      REAL    NOT NULL DEFAULT 0,' +
    '  fat        REAL    NOT NULL DEFAULT 0,' +
    '  meal_type  TEXT    NOT NULL,' +
    '  date       TEXT    NOT NULL,' +
    '  timestamp  INTEGER NOT NULL,' +
    '  synced     INTEGER NOT NULL DEFAULT 0,' +
    '  deleted_at INTEGER' +
    ')'
  );
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS hydration (' +
    '  id             INTEGER PRIMARY KEY AUTOINCREMENT,' +
    '  amount_ml      INTEGER NOT NULL,' +
    '  beverage_type  TEXT    NOT NULL,' +
    '  date           TEXT    NOT NULL,' +
    '  timestamp      INTEGER NOT NULL,' +
    '  synced         INTEGER NOT NULL DEFAULT 0,' +
    '  deleted_at     INTEGER' +
    ')'
  );
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_meals_date     ON meals(date)');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_hydration_date ON hydration(date)');

  // Migration: add sync columns to existing installs BEFORE creating indexes on them
  const safe = async (sql: string) => { try { await db.execAsync(sql); } catch {} };
  await safe('ALTER TABLE meals ADD COLUMN synced INTEGER NOT NULL DEFAULT 0');
  await safe('ALTER TABLE meals ADD COLUMN deleted_at INTEGER');
  await safe('ALTER TABLE hydration ADD COLUMN synced INTEGER NOT NULL DEFAULT 0');
  await safe('ALTER TABLE hydration ADD COLUMN deleted_at INTEGER');

  // Now that synced column is guaranteed to exist, create indexes on it
  await safe('CREATE INDEX IF NOT EXISTS idx_meals_synced     ON meals(synced)');
  await safe('CREATE INDEX IF NOT EXISTS idx_hydration_synced ON hydration(synced)');
  } catch (e) {
    console.warn('[db] onDbInit error:', e);
  }
}

// ── Internal row types ────────────────────────────────────────────────────────
export interface MealRow {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  date: string;
  timestamp: number;
  synced: number;          // 0 = pending push, 1 = synced
  deleted_at: number | null; // null = active, timestamp = soft-deleted
}

export interface HydrationRow {
  id: number;
  amount_ml: number;
  beverage_type: string;
  date: string;
  timestamp: number;
  synced: number;
  deleted_at: number | null;
}

// ── Date helper ───────────────────────────────────────────────────────────────
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Meals ─────────────────────────────────────────────────────────────────────
export async function dbAddMeal(params: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: string;
  date: string;
  timestamp: number;
}): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO meals (name, calories, protein, carbs, fat, meal_type, date, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.name,
      params.calories,
      params.protein,
      params.carbs,
      params.fat,
      params.mealType,
      params.date,
      params.timestamp,
    ],
  );
  return result.lastInsertRowId;
}

export async function dbSoftDeleteMeal(id: number): Promise<void> {
  await getDb().runAsync(
    'UPDATE meals SET deleted_at = ?, synced = 0 WHERE id = ?',
    [Date.now(), id],
  );
}

export async function dbHardDeleteMeal(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM meals WHERE id = ?', [id]);
}

export async function dbGetMealsForDate(date: string): Promise<MealRow[]> {
  return getDb().getAllAsync<MealRow>(
    'SELECT * FROM meals WHERE date = ? AND deleted_at IS NULL ORDER BY timestamp ASC',
    [date],
  );
}

export async function dbDeleteMealsForDate(date: string): Promise<void> {
  await getDb().runAsync('DELETE FROM meals WHERE date = ?', [date]);
}

export async function dbDeleteAllMeals(): Promise<void> {
  await getDb().runAsync('DELETE FROM meals');
}

// ── Hydration ─────────────────────────────────────────────────────────────────
export async function dbAddHydration(params: {
  amountMl: number;
  beverageType: string;
  date: string;
  timestamp: number;
}): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO hydration (amount_ml, beverage_type, date, timestamp)
     VALUES (?, ?, ?, ?)`,
    [params.amountMl, params.beverageType, params.date, params.timestamp],
  );
  return result.lastInsertRowId;
}

export async function dbSoftDeleteHydration(id: number): Promise<void> {
  await getDb().runAsync(
    'UPDATE hydration SET deleted_at = ?, synced = 0 WHERE id = ?',
    [Date.now(), id],
  );
}

export async function dbHardDeleteHydration(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM hydration WHERE id = ?', [id]);
}

export async function dbGetHydrationForDate(date: string): Promise<HydrationRow[]> {
  return getDb().getAllAsync<HydrationRow>(
    'SELECT * FROM hydration WHERE date = ? AND deleted_at IS NULL ORDER BY timestamp ASC',
    [date],
  );
}

export async function dbDeleteHydrationForDate(date: string): Promise<void> {
  await getDb().runAsync('DELETE FROM hydration WHERE date = ?', [date]);
}

export async function dbDeleteAllHydration(): Promise<void> {
  await getDb().runAsync('DELETE FROM hydration');
}

export async function dbDeleteAllNutritionData(): Promise<void> {
  await getDb().runAsync('DELETE FROM meals');
  await getDb().runAsync('DELETE FROM hydration');
}

// ── Sync helpers ──────────────────────────────────────────────────────────────

export function dbGetPendingUpsertMeals(): MealRow[] {
  return getDb().getAllSync<MealRow>(
    'SELECT * FROM meals WHERE synced = 0 AND deleted_at IS NULL',
  );
}

export function dbGetPendingDeleteMeals(): MealRow[] {
  return getDb().getAllSync<MealRow>(
    'SELECT * FROM meals WHERE synced = 0 AND deleted_at IS NOT NULL',
  );
}

export function dbGetPendingUpsertHydration(): HydrationRow[] {
  return getDb().getAllSync<HydrationRow>(
    'SELECT * FROM hydration WHERE synced = 0 AND deleted_at IS NULL',
  );
}

export function dbGetPendingDeleteHydration(): HydrationRow[] {
  return getDb().getAllSync<HydrationRow>(
    'SELECT * FROM hydration WHERE synced = 0 AND deleted_at IS NOT NULL',
  );
}

export function dbMarkMealSynced(id: number): void {
  getDb().runSync('UPDATE meals SET synced = 1 WHERE id = ?', [id]);
}

export function dbMarkHydrationSynced(id: number): void {
  getDb().runSync('UPDATE hydration SET synced = 1 WHERE id = ?', [id]);
}

export function dbUpsertPulledMeal(row: {
  local_id: number; name: string; calories: number; protein: number;
  carbs: number; fat: number; meal_type: string; date: string; timestamp: number;
}): void {
  getDb().runSync(
    `INSERT OR IGNORE INTO meals
       (id, name, calories, protein, carbs, fat, meal_type, date, timestamp, synced, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)`,
    [row.local_id, row.name, row.calories, row.protein, row.carbs,
     row.fat, row.meal_type, row.date, row.timestamp],
  );
}

export function dbUpsertPulledHydration(row: {
  local_id: number; amount_ml: number; beverage_type: string;
  date: string; timestamp: number;
}): void {
  getDb().runSync(
    `INSERT OR IGNORE INTO hydration
       (id, amount_ml, beverage_type, date, timestamp, synced, deleted_at)
     VALUES (?, ?, ?, ?, ?, 1, NULL)`,
    [row.local_id, row.amount_ml, row.beverage_type, row.date, row.timestamp],
  );
}
