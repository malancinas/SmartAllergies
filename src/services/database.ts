import * as SQLite from 'expo-sqlite';
import { logger } from './logger';

// ─── Schema ─────────────────────────────────────────────────────────────────

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS symptom_logs (
    id TEXT PRIMARY KEY,
    logged_at TEXT NOT NULL,
    severity INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    notes TEXT,
    medications TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS log_symptoms (
    log_id TEXT NOT NULL,
    symptom TEXT NOT NULL,
    PRIMARY KEY (log_id, symptom),
    FOREIGN KEY (log_id) REFERENCES symptom_logs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS pollen_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS api_quota (
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    call_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS log_environment (
    log_id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    grass_pollen REAL,
    tree_pollen REAL,
    weed_pollen REAL,
    pm25 REAL,
    pm10 REAL,
    ozone REAL,
    no2 REAL,
    so2 REAL,
    uv_index REAL,
    dust REAL,
    FOREIGN KEY (log_id) REFERENCES symptom_logs(id) ON DELETE CASCADE
  )`,
];

export const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;

// ─── Singleton ───────────────────────────────────────────────────────────────

let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('localallergies.db');

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  for (const sql of MIGRATIONS) {
    await db.execAsync(sql);
  }

  // Additive migration: add medications column to existing databases
  try {
    await db.execAsync(`ALTER TABLE symptom_logs ADD COLUMN medications TEXT`);
  } catch {
    // Column already exists on fresh installs — safe to ignore
  }

  // Additive migration: add created_at for the 48-hour edit window
  try {
    await db.execAsync(`ALTER TABLE symptom_logs ADD COLUMN created_at TEXT`);
    // Backfill existing rows so they are treated as already committed (outside the edit window)
    await db.execAsync(`UPDATE symptom_logs SET created_at = logged_at WHERE created_at IS NULL`);
  } catch {
    // Column already exists — safe to ignore
  }

  logger.debug('Database initialised');
  return db;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    _dbPromise = initDatabase().catch((err) => {
      _dbPromise = null;
      throw err;
    });
  }
  return _dbPromise;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SymptomLogRow {
  id: string;
  logged_at: string;
  created_at: string;
  severity: number;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  medications: string | null;
  symptoms: string[]; // populated by join
}

// ─── Symptom Logs ────────────────────────────────────────────────────────────

export async function insertSymptomLog(params: {
  id: string;
  loggedAt: string;
  severity: number;
  symptoms: string[];
  latitude?: number;
  longitude?: number;
  notes?: string;
  medications?: string;
}): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO symptom_logs (id, logged_at, created_at, severity, latitude, longitude, notes, medications)
     VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?)`,
    params.id,
    params.loggedAt,
    params.severity,
    params.latitude ?? null,
    params.longitude ?? null,
    params.notes ?? null,
    params.medications ?? null,
  );

  for (const symptom of params.symptoms) {
    await db.runAsync(
      `INSERT OR IGNORE INTO log_symptoms (log_id, symptom) VALUES (?, ?)`,
      params.id,
      symptom,
    );
  }
}

export async function getSymptomLogs(
  fromDate: string,
  toDate: string,
): Promise<SymptomLogRow[]> {
  const db = await getDatabase();

  const logs = await db.getAllAsync<Omit<SymptomLogRow, 'symptoms'>>(
    `SELECT * FROM symptom_logs WHERE logged_at >= ? AND logged_at <= ? ORDER BY logged_at DESC`,
    fromDate,
    toDate,
  );

  const results: SymptomLogRow[] = [];
  for (const log of logs) {
    const symptomRows = await db.getAllAsync<{ symptom: string }>(
      `SELECT symptom FROM log_symptoms WHERE log_id = ?`,
      log.id,
    );
    results.push({ ...log, symptoms: symptomRows.map((r) => r.symptom) });
  }

  return results;
}

export async function deleteSymptomLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM symptom_logs WHERE id = ?`, id);
}

export async function updateSymptomLog(params: {
  id: string;
  loggedAt: string;
  severity: number;
  symptoms: string[];
  notes?: string;
  medications?: string;
}): Promise<{ success: boolean; reason?: 'window_expired' | 'not_found' }> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ created_at: string }>(
    `SELECT created_at FROM symptom_logs WHERE id = ?`,
    params.id,
  );
  if (!row) return { success: false, reason: 'not_found' };

  if (Date.now() - new Date(row.created_at).getTime() > EDIT_WINDOW_MS) {
    return { success: false, reason: 'window_expired' };
  }

  await db.runAsync(
    `UPDATE symptom_logs SET logged_at = ?, severity = ?, notes = ?, medications = ? WHERE id = ?`,
    params.loggedAt,
    params.severity,
    params.notes ?? null,
    params.medications ?? null,
    params.id,
  );

  await db.runAsync(`DELETE FROM log_symptoms WHERE log_id = ?`, params.id);
  for (const symptom of params.symptoms) {
    await db.runAsync(
      `INSERT OR IGNORE INTO log_symptoms (log_id, symptom) VALUES (?, ?)`,
      params.id,
      symptom,
    );
  }

  return { success: true };
}

export async function getSymptomLogById(id: string): Promise<SymptomLogRow | null> {
  const db = await getDatabase();
  const log = await db.getFirstAsync<Omit<SymptomLogRow, 'symptoms'>>(
    `SELECT * FROM symptom_logs WHERE id = ?`,
    id,
  );
  if (!log) return null;

  const symptomRows = await db.getAllAsync<{ symptom: string }>(
    `SELECT symptom FROM log_symptoms WHERE log_id = ?`,
    id,
  );
  return { ...log, symptoms: symptomRows.map((r) => r.symptom) };
}

// ─── Pollen Cache ────────────────────────────────────────────────────────────

export async function getPollenCache<T>(key: string, ttlMs = 60 * 60 * 1000): Promise<T | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data: string; fetched_at: string }>(
    `SELECT data, fetched_at FROM pollen_cache WHERE cache_key = ?`,
    key,
  );
  if (!row) return null;

  const fetchedAt = new Date(row.fetched_at).getTime();
  if (Date.now() - fetchedAt > ttlMs) {
    await db.runAsync(`DELETE FROM pollen_cache WHERE cache_key = ?`, key);
    return null;
  }

  try {
    return JSON.parse(row.data) as T;
  } catch {
    return null;
  }
}

export async function setPollenCache(key: string, data: unknown): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO pollen_cache (cache_key, data, fetched_at) VALUES (?, ?, ?)`,
    key,
    JSON.stringify(data),
    new Date().toISOString(),
  );
}

// Google Maps Platform ToS permits caching for performance; 24h matches the Pollen API's own
// daily update cadence, so cached tiles are never stale by more than one data refresh cycle.
const TILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getTileCache(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data: string; fetched_at: string }>(
    `SELECT data, fetched_at FROM pollen_cache WHERE cache_key = ?`,
    key,
  );
  if (!row) return null;
  if (Date.now() - new Date(row.fetched_at).getTime() > TILE_CACHE_TTL_MS) {
    await db.runAsync(`DELETE FROM pollen_cache WHERE cache_key = ?`, key);
    return null;
  }
  return row.data;
}

export async function setTileCache(key: string, dataUri: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO pollen_cache (cache_key, data, fetched_at) VALUES (?, ?, ?)`,
    key,
    dataUri,
    new Date().toISOString(),
  );
}

// ─── API Quota ───────────────────────────────────────────────────────────────

export const DAILY_API_LIMIT = 150;

export async function getApiCallCount(userId: string): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const row = await db.getFirstAsync<{ call_count: number }>(
    `SELECT call_count FROM api_quota WHERE user_id = ? AND date = ?`,
    userId,
    today,
  );
  return row?.call_count ?? 0;
}

export async function incrementApiCallCount(userId: string, by = 1): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  await db.runAsync(
    `INSERT OR IGNORE INTO api_quota (user_id, date, call_count) VALUES (?, ?, 0)`,
    userId,
    today,
  );
  await db.runAsync(
    `UPDATE api_quota SET call_count = call_count + ? WHERE user_id = ? AND date = ?`,
    by,
    userId,
    today,
  );
  const row = await db.getFirstAsync<{ call_count: number }>(
    `SELECT call_count FROM api_quota WHERE user_id = ? AND date = ?`,
    userId,
    today,
  );
  return row?.call_count ?? by;
}

// ─── Log Environment ─────────────────────────────────────────────────────────

export interface LogEnvironmentInput {
  logId: string;
  date: string; // YYYY-MM-DD
  grassPollen?: number;
  treePollen?: number;
  weedPollen?: number;
  pm25?: number;
  pm10?: number;
  ozone?: number;
  no2?: number;
  so2?: number;
  uvIndex?: number;
  dust?: number;
}

export async function insertLogEnvironment(params: LogEnvironmentInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO log_environment
      (log_id, date, grass_pollen, tree_pollen, weed_pollen, pm25, pm10, ozone, no2, so2, uv_index, dust)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params.logId,
    params.date,
    params.grassPollen ?? null,
    params.treePollen ?? null,
    params.weedPollen ?? null,
    params.pm25 ?? null,
    params.pm10 ?? null,
    params.ozone ?? null,
    params.no2 ?? null,
    params.so2 ?? null,
    params.uvIndex ?? null,
    params.dust ?? null,
  );
}

export interface CorrelationDataRow {
  date: string;
  maxSeverity: number;
  grassPollen: number | null;
  treePollen: number | null;
  weedPollen: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  so2: number | null;
  uvIndex: number | null;
  dust: number | null;
}

export async function getCorrelationData(): Promise<CorrelationDataRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    date: string;
    max_severity: number;
    grass_pollen: number | null;
    tree_pollen: number | null;
    weed_pollen: number | null;
    pm25: number | null;
    pm10: number | null;
    ozone: number | null;
    no2: number | null;
    so2: number | null;
    uv_index: number | null;
    dust: number | null;
  }>(
    `SELECT
       DATE(sl.logged_at) AS date,
       MAX(sl.severity) AS max_severity,
       AVG(le.grass_pollen) AS grass_pollen,
       AVG(le.tree_pollen) AS tree_pollen,
       AVG(le.weed_pollen) AS weed_pollen,
       AVG(le.pm25) AS pm25,
       AVG(le.pm10) AS pm10,
       AVG(le.ozone) AS ozone,
       AVG(le.no2) AS no2,
       AVG(le.so2) AS so2,
       AVG(le.uv_index) AS uv_index,
       AVG(le.dust) AS dust
     FROM symptom_logs sl
     JOIN log_environment le ON le.log_id = sl.id
     GROUP BY DATE(sl.logged_at)
     ORDER BY date ASC`,
  );

  return rows.map((r) => ({
    date: r.date,
    maxSeverity: r.max_severity,
    grassPollen: r.grass_pollen,
    treePollen: r.tree_pollen,
    weedPollen: r.weed_pollen,
    pm25: r.pm25,
    pm10: r.pm10,
    ozone: r.ozone,
    no2: r.no2,
    so2: r.so2,
    uvIndex: r.uv_index,
    dust: r.dust,
  }));
}

/** Returns the most recent cache entry whose key starts with `prefix`, ignoring TTL. */
export async function getStalePollenCacheByPrefix<T>(
  prefix: string,
): Promise<{ data: T; fetchedAt: string } | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data: string; fetched_at: string }>(
    `SELECT data, fetched_at FROM pollen_cache WHERE cache_key LIKE ? ORDER BY fetched_at DESC LIMIT 1`,
    `${prefix}%`,
  );
  if (!row) return null;
  try {
    return { data: JSON.parse(row.data) as T, fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}
