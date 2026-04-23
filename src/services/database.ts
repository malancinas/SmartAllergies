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
];

// ─── Singleton ───────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync('smartallergies.db');

  // Enable WAL mode for better concurrent read performance
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  for (const sql of MIGRATIONS) {
    await _db.execAsync(sql);
  }

  // Additive migration: add medications column to existing databases
  try {
    await _db.execAsync(`ALTER TABLE symptom_logs ADD COLUMN medications TEXT`);
  } catch {
    // Column already exists on fresh installs (included in CREATE TABLE above) — safe to ignore
  }

  logger.debug('Database initialised');
  return _db;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SymptomLogRow {
  id: string;
  logged_at: string;
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
    `INSERT INTO symptom_logs (id, logged_at, severity, latitude, longitude, notes, medications)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

// ─── Pollen Cache ────────────────────────────────────────────────────────────

export async function getPollenCache<T>(key: string): Promise<T | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data: string; fetched_at: string }>(
    `SELECT data, fetched_at FROM pollen_cache WHERE cache_key = ?`,
    key,
  );
  if (!row) return null;

  // Expire entries older than 1 hour
  const fetchedAt = new Date(row.fetched_at).getTime();
  if (Date.now() - fetchedAt > 60 * 60 * 1000) {
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
