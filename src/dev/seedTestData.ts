import { getDatabase, insertLogEnvironment } from '@/services/database';

function makeId(daysAgo: number, index: number): string {
  return `seed-${daysAgo}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

type Symptom = 'sneezing' | 'itchy_eyes' | 'runny_nose' | 'congestion' | 'skin_reaction' | 'headache' | 'none';

type DayEntry = {
  daysAgo: number;
  severity: number;
  symptoms: Symptom[];
  timeSlot: string;
  hour: number;
  medications?: string;
  grassPollen?: number;
  treePollen?: number;
  weedPollen?: number;
  pm25?: number;
  pm10?: number;
  ozone?: number;
  no2?: number;
  so2?: number;
  uvIndex?: number;
};

// 40-day scenario: early season build-up, peaking mid-period, tapering off
const DAYS: DayEntry[] = [
  // Pollen rises steadily then peaks, tracking severity closely.
  // Air quality stays at a realistic urban background with a couple of independent pollution spikes
  // that do NOT coincide with high-severity days — this keeps its correlation lower than pollen.
  { daysAgo: 40, severity: 1, symptoms: ['sneezing'], timeSlot: 'morning', hour: 9, grassPollen: 4, treePollen: 3, weedPollen: 1, pm25: 10, pm10: 18, ozone: 55, no2: 20, so2: 3, uvIndex: 2 },
  { daysAgo: 39, severity: 2, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 8, grassPollen: 5, treePollen: 3, weedPollen: 1, pm25: 9, pm10: 16, ozone: 54, no2: 19, so2: 3, uvIndex: 2 },
  { daysAgo: 38, severity: 1, symptoms: ['runny_nose'], timeSlot: 'afternoon', hour: 14, grassPollen: 5, treePollen: 4, weedPollen: 1, pm25: 11, pm10: 20, ozone: 56, no2: 21, so2: 3, uvIndex: 2 },
  { daysAgo: 37, severity: 2, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 10, grassPollen: 6, treePollen: 4, weedPollen: 1, pm25: 8, pm10: 15, ozone: 55, no2: 18, so2: 3, uvIndex: 3 },
  { daysAgo: 36, severity: 2, symptoms: ['runny_nose'], timeSlot: 'midday', hour: 12, grassPollen: 7, treePollen: 5, weedPollen: 2, pm25: 19, pm10: 34, ozone: 62, no2: 32, so2: 6, uvIndex: 3 },
  { daysAgo: 35, severity: 3, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 8, treePollen: 5, weedPollen: 2, pm25: 9, pm10: 16, ozone: 57, no2: 21, so2: 3, uvIndex: 3 },
  { daysAgo: 34, severity: 2, symptoms: ['congestion'], timeSlot: 'evening', hour: 19, grassPollen: 8, treePollen: 5, weedPollen: 2, pm25: 10, pm10: 18, ozone: 58, no2: 22, so2: 4, uvIndex: 3 },
  { daysAgo: 33, severity: 3, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 8, grassPollen: 9, treePollen: 6, weedPollen: 2, pm25: 8, pm10: 14, ozone: 56, no2: 19, so2: 3, uvIndex: 3 },
  { daysAgo: 32, severity: 3, symptoms: ['itchy_eyes', 'sneezing'], timeSlot: 'morning', hour: 10, grassPollen: 10, treePollen: 7, weedPollen: 2, pm25: 22, pm10: 39, ozone: 65, no2: 37, so2: 7, uvIndex: 3 },
  { daysAgo: 31, severity: 3, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 9, grassPollen: 11, treePollen: 7, weedPollen: 3, pm25: 9, pm10: 16, ozone: 58, no2: 21, so2: 3, uvIndex: 3 },
  { daysAgo: 30, severity: 3, symptoms: ['sneezing'], timeSlot: 'morning', hour: 9, grassPollen: 12, treePollen: 8, weedPollen: 3, pm25: 18, pm10: 32, ozone: 68, no2: 35, so2: 6, uvIndex: 3 },
  { daysAgo: 29, severity: 4, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 8, grassPollen: 15, treePollen: 10, weedPollen: 3, pm25: 9, pm10: 16, ozone: 60, no2: 22, so2: 4, uvIndex: 3 },
  { daysAgo: 28, severity: 3, symptoms: ['runny_nose'], timeSlot: 'afternoon', hour: 14, grassPollen: 14, treePollen: 9, weedPollen: 3, pm25: 22, pm10: 40, ozone: 62, no2: 38, so2: 7, uvIndex: 4 },
  { daysAgo: 27, severity: 5, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 10, grassPollen: 32, treePollen: 21, weedPollen: 5, pm25: 10, pm10: 18, ozone: 61, no2: 24, so2: 4, uvIndex: 4 },
  { daysAgo: 26, severity: 6, symptoms: ['itchy_eyes', 'congestion', 'sneezing'], timeSlot: 'midday', hour: 12, grassPollen: 35, treePollen: 23, weedPollen: 5, pm25: 8, pm10: 15, ozone: 59, no2: 21, so2: 4, uvIndex: 5 },
  { daysAgo: 25, severity: 7, symptoms: ['sneezing', 'runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 38, treePollen: 25, weedPollen: 6, pm25: 11, pm10: 20, ozone: 63, no2: 25, so2: 5, uvIndex: 5 },
  { daysAgo: 24, severity: 7, symptoms: ['sneezing', 'congestion', 'headache'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 35, treePollen: 22, weedPollen: 5, pm25: 9, pm10: 16, ozone: 60, no2: 22, so2: 4, uvIndex: 5 },
  { daysAgo: 23, severity: 5, symptoms: ['runny_nose', 'congestion'], timeSlot: 'afternoon', hour: 15, medications: 'Flonase', grassPollen: 30, treePollen: 19, weedPollen: 4, pm25: 19, pm10: 34, ozone: 65, no2: 33, so2: 6, uvIndex: 6 },
  { daysAgo: 22, severity: 8, symptoms: ['sneezing', 'itchy_eyes', 'runny_nose', 'congestion'], timeSlot: 'morning', hour: 7, medications: 'Cetirizine, Flonase', grassPollen: 42, treePollen: 28, weedPollen: 6, pm25: 12, pm10: 22, ozone: 64, no2: 27, so2: 5, uvIndex: 6 },
  { daysAgo: 21, severity: 7, symptoms: ['sneezing', 'itchy_eyes', 'headache'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine, Flonase', grassPollen: 40, treePollen: 26, weedPollen: 6, pm25: 10, pm10: 18, ozone: 62, no2: 24, so2: 4, uvIndex: 6 },
  { daysAgo: 20, severity: 8, symptoms: ['sneezing', 'runny_nose', 'itchy_eyes', 'skin_reaction'], timeSlot: 'midday', hour: 12, medications: 'Cetirizine, Flonase, Piriton', grassPollen: 45, treePollen: 30, weedPollen: 7, pm25: 13, pm10: 23, ozone: 65, no2: 28, so2: 5, uvIndex: 7 },
  { daysAgo: 19, severity: 9, symptoms: ['sneezing', 'congestion', 'headache', 'itchy_eyes'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 50, treePollen: 33, weedPollen: 7, pm25: 11, pm10: 20, ozone: 63, no2: 25, so2: 5, uvIndex: 7 },
  { daysAgo: 18, severity: 9, symptoms: ['sneezing', 'itchy_eyes', 'runny_nose', 'congestion', 'headache'], timeSlot: 'early_morning', hour: 6, medications: 'Cetirizine, Flonase', grassPollen: 52, treePollen: 35, weedPollen: 8, pm25: 14, pm10: 25, ozone: 66, no2: 29, so2: 5, uvIndex: 7 },
  { daysAgo: 17, severity: 8, symptoms: ['sneezing', 'runny_nose', 'congestion'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine, Flonase', grassPollen: 48, treePollen: 31, weedPollen: 7, pm25: 9, pm10: 16, ozone: 60, no2: 22, so2: 4, uvIndex: 6 },
  { daysAgo: 16, severity: 7, symptoms: ['itchy_eyes', 'runny_nose', 'sneezing'], timeSlot: 'afternoon', hour: 14, medications: 'Cetirizine', grassPollen: 44, treePollen: 28, weedPollen: 6, pm25: 21, pm10: 38, ozone: 67, no2: 36, so2: 7, uvIndex: 6 },
  { daysAgo: 15, severity: 6, symptoms: ['sneezing', 'congestion'], timeSlot: 'morning', hour: 10, medications: 'Cetirizine', grassPollen: 38, treePollen: 24, weedPollen: 6, pm25: 10, pm10: 18, ozone: 61, no2: 23, so2: 4, uvIndex: 6 },
  { daysAgo: 14, severity: 6, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine', grassPollen: 35, treePollen: 22, weedPollen: 5, pm25: 8, pm10: 15, ozone: 59, no2: 21, so2: 4, uvIndex: 5 },
  { daysAgo: 13, severity: 5, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'midday', hour: 13, medications: 'Cetirizine', grassPollen: 30, treePollen: 18, weedPollen: 5, pm25: 17, pm10: 31, ozone: 64, no2: 31, so2: 6, uvIndex: 5 },
  { daysAgo: 12, severity: 7, symptoms: ['sneezing', 'itchy_eyes', 'headache'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 38, treePollen: 25, weedPollen: 6, pm25: 12, pm10: 22, ozone: 63, no2: 26, so2: 5, uvIndex: 5 },
  { daysAgo: 11, severity: 6, symptoms: ['congestion', 'sneezing'], timeSlot: 'evening', hour: 19, medications: 'Cetirizine', grassPollen: 32, treePollen: 21, weedPollen: 5, pm25: 9, pm10: 16, ozone: 60, no2: 22, so2: 4, uvIndex: 4 },
  { daysAgo: 10, severity: 5, symptoms: ['runny_nose', 'congestion'], timeSlot: 'afternoon', hour: 15, grassPollen: 28, treePollen: 18, weedPollen: 4, pm25: 20, pm10: 36, ozone: 66, no2: 34, so2: 6, uvIndex: 5 },
  { daysAgo: 9, severity: 4, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 24, treePollen: 15, weedPollen: 4, pm25: 8, pm10: 14, ozone: 58, no2: 20, so2: 4, uvIndex: 4 },
  { daysAgo: 8, severity: 5, symptoms: ['runny_nose', 'sneezing'], timeSlot: 'morning', hour: 10, medications: 'Cetirizine', grassPollen: 26, treePollen: 16, weedPollen: 4, pm25: 10, pm10: 18, ozone: 61, no2: 23, so2: 4, uvIndex: 5 },
  { daysAgo: 7, severity: 4, symptoms: ['itchy_eyes'], timeSlot: 'midday', hour: 12, grassPollen: 20, treePollen: 13, weedPollen: 3, pm25: 16, pm10: 29, ozone: 63, no2: 30, so2: 5, uvIndex: 5 },
  { daysAgo: 6, severity: 3, symptoms: ['sneezing'], timeSlot: 'morning', hour: 8, grassPollen: 18, treePollen: 11, weedPollen: 3, pm25: 8, pm10: 14, ozone: 58, no2: 20, so2: 4, uvIndex: 4 },
  { daysAgo: 5, severity: 3, symptoms: ['runny_nose'], timeSlot: 'afternoon', hour: 14, grassPollen: 16, treePollen: 10, weedPollen: 3, pm25: 7, pm10: 13, ozone: 57, no2: 19, so2: 3, uvIndex: 4 },
  { daysAgo: 4, severity: 4, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 9, grassPollen: 19, treePollen: 12, weedPollen: 3, pm25: 23, pm10: 41, ozone: 69, no2: 39, so2: 7, uvIndex: 4 },
  { daysAgo: 3, severity: 3, symptoms: ['congestion'], timeSlot: 'evening', hour: 20, grassPollen: 15, treePollen: 9, weedPollen: 3, pm25: 9, pm10: 16, ozone: 59, no2: 21, so2: 4, uvIndex: 3 },
  { daysAgo: 2, severity: 2, symptoms: ['sneezing'], timeSlot: 'morning', hour: 10, grassPollen: 12, treePollen: 7, weedPollen: 2, pm25: 7, pm10: 12, ozone: 56, no2: 18, so2: 3, uvIndex: 3 },
  { daysAgo: 1, severity: 3, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 14, treePollen: 8, weedPollen: 3, pm25: 8, pm10: 14, ozone: 58, no2: 20, so2: 4, uvIndex: 4 },
];

function daysAgoISO(daysAgo: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const seedTestLogs = () => seedDays(DAYS, 0);

// 20-day scenario: clear pollen-driven pattern for testing Pearson correlation
const DAYS_20: DayEntry[] = [
  { daysAgo: 20, severity: 2, symptoms: ['sneezing'], timeSlot: 'morning', hour: 9, grassPollen: 8, treePollen: 5, weedPollen: 2, pm25: 10, pm10: 18, ozone: 58, no2: 22, so2: 4, uvIndex: 3 },
  { daysAgo: 19, severity: 3, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 8, grassPollen: 12, treePollen: 8, weedPollen: 2, pm25: 9, pm10: 16, ozone: 57, no2: 21, so2: 3, uvIndex: 3 },
  { daysAgo: 18, severity: 2, symptoms: ['runny_nose'], timeSlot: 'afternoon', hour: 15, grassPollen: 10, treePollen: 6, weedPollen: 2, pm25: 20, pm10: 36, ozone: 63, no2: 33, so2: 6, uvIndex: 4 },
  { daysAgo: 17, severity: 4, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 18, treePollen: 12, weedPollen: 3, pm25: 8, pm10: 15, ozone: 59, no2: 21, so2: 4, uvIndex: 4 },
  { daysAgo: 16, severity: 5, symptoms: ['sneezing', 'congestion', 'itchy_eyes'], timeSlot: 'morning', hour: 8, grassPollen: 32, treePollen: 21, weedPollen: 5, pm25: 11, pm10: 20, ozone: 61, no2: 24, so2: 4, uvIndex: 5 },
  { daysAgo: 15, severity: 6, symptoms: ['runny_nose', 'itchy_eyes', 'sneezing'], timeSlot: 'midday', hour: 12, grassPollen: 36, treePollen: 24, weedPollen: 5, pm25: 9, pm10: 17, ozone: 60, no2: 22, so2: 4, uvIndex: 5 },
  { daysAgo: 14, severity: 6, symptoms: ['sneezing', 'runny_nose', 'congestion'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine', grassPollen: 40, treePollen: 26, weedPollen: 6, pm25: 21, pm10: 38, ozone: 66, no2: 35, so2: 6, uvIndex: 5 },
  { daysAgo: 13, severity: 7, symptoms: ['sneezing', 'itchy_eyes', 'headache', 'congestion'], timeSlot: 'morning', hour: 7, medications: 'Cetirizine, Flonase', grassPollen: 38, treePollen: 25, weedPollen: 6, pm25: 10, pm10: 18, ozone: 62, no2: 24, so2: 4, uvIndex: 6 },
  { daysAgo: 12, severity: 8, symptoms: ['sneezing', 'runny_nose', 'itchy_eyes', 'congestion'], timeSlot: 'early_morning', hour: 6, medications: 'Cetirizine, Flonase', grassPollen: 44, treePollen: 29, weedPollen: 7, pm25: 12, pm10: 22, ozone: 63, no2: 26, so2: 5, uvIndex: 6 },
  { daysAgo: 11, severity: 7, symptoms: ['sneezing', 'congestion', 'headache'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 40, treePollen: 26, weedPollen: 6, pm25: 9, pm10: 16, ozone: 61, no2: 23, so2: 4, uvIndex: 6 },
  { daysAgo: 10, severity: 6, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'afternoon', hour: 14, medications: 'Cetirizine', grassPollen: 34, treePollen: 22, weedPollen: 5, pm25: 8, pm10: 14, ozone: 59, no2: 21, so2: 4, uvIndex: 5 },
  { daysAgo: 9, severity: 5, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine', grassPollen: 28, treePollen: 18, weedPollen: 5, pm25: 22, pm10: 40, ozone: 67, no2: 37, so2: 7, uvIndex: 5 },
  { daysAgo: 8, severity: 6, symptoms: ['sneezing', 'itchy_eyes', 'headache'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 32, treePollen: 21, weedPollen: 5, pm25: 11, pm10: 20, ozone: 62, no2: 25, so2: 5, uvIndex: 5 },
  { daysAgo: 7, severity: 4, symptoms: ['congestion', 'sneezing'], timeSlot: 'midday', hour: 12, medications: 'Cetirizine', grassPollen: 22, treePollen: 14, weedPollen: 4, pm25: 9, pm10: 16, ozone: 60, no2: 22, so2: 4, uvIndex: 5 },
  { daysAgo: 6, severity: 3, symptoms: ['sneezing'], timeSlot: 'morning', hour: 9, grassPollen: 16, treePollen: 10, weedPollen: 3, pm25: 8, pm10: 14, ozone: 58, no2: 20, so2: 3, uvIndex: 4 },
  { daysAgo: 5, severity: 4, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'afternoon', hour: 15, grassPollen: 20, treePollen: 13, weedPollen: 4, pm25: 18, pm10: 32, ozone: 64, no2: 30, so2: 5, uvIndex: 4 },
  { daysAgo: 4, severity: 3, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 10, grassPollen: 17, treePollen: 11, weedPollen: 3, pm25: 9, pm10: 16, ozone: 59, no2: 21, so2: 4, uvIndex: 4 },
  { daysAgo: 3, severity: 2, symptoms: ['congestion'], timeSlot: 'evening', hour: 20, grassPollen: 12, treePollen: 8, weedPollen: 2, pm25: 7, pm10: 13, ozone: 57, no2: 19, so2: 3, uvIndex: 3 },
  { daysAgo: 2, severity: 2, symptoms: ['sneezing'], timeSlot: 'morning', hour: 9, grassPollen: 11, treePollen: 7, weedPollen: 2, pm25: 8, pm10: 14, ozone: 58, no2: 20, so2: 3, uvIndex: 3 },
  { daysAgo: 1, severity: 3, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 8, grassPollen: 14, treePollen: 9, weedPollen: 3, pm25: 8, pm10: 15, ozone: 59, no2: 21, so2: 4, uvIndex: 4 },
];

async function seedDays(days: DayEntry[], idOffset: number): Promise<void> {
  const db = await getDatabase();

  for (let i = 0; i < days.length; i++) {
    const entry = days[i];
    const id = makeId(entry.daysAgo, i + idOffset);
    const loggedAt = daysAgoISO(entry.daysAgo, entry.hour);
    const dateStr = loggedAt.slice(0, 10);

    await db.runAsync(
      `INSERT INTO symptom_logs (id, logged_at, created_at, severity, latitude, longitude, location_label, notes, medications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, loggedAt, loggedAt, entry.severity, 51.5074, -0.1278, 'London, United Kingdom', null, entry.medications ?? null,
    );

    for (const symptom of entry.symptoms) {
      await db.runAsync(
        `INSERT OR IGNORE INTO log_symptoms (log_id, symptom) VALUES (?, ?)`,
        id, symptom,
      );
    }

    if (entry.grassPollen !== undefined) {
      await insertLogEnvironment({
        logId: id,
        date: dateStr,
        grassPollen: entry.grassPollen,
        treePollen: entry.treePollen,
        weedPollen: entry.weedPollen,
        pm25: entry.pm25,
        pm10: entry.pm10,
        ozone: entry.ozone,
        no2: entry.no2,
        so2: entry.so2,
        uvIndex: entry.uvIndex,
      });
    }
  }
}

// Slices reuse DAYS_20 data — no duplication needed
const DAYS_15 = DAYS_20.slice(DAYS_20.length - 15);
const DAYS_10 = DAYS_20.slice(DAYS_20.length - 10);

// DAYS has 40 entries (daysAgo 40→1); slice from index 10 gives daysAgo 30→1
const DAYS_30 = DAYS.slice(10);

export const seedTestLogs10 = () => seedDays(DAYS_10, 300);
export const seedTestLogs15 = () => seedDays(DAYS_15, 200);
export const seedTestLogs20 = () => seedDays(DAYS_20, 100);
export const seedTestLogs30 = () => seedDays(DAYS_30, 400);
export const seedTestLogs40 = () => seedDays(DAYS, 500);

export async function clearTestLogs(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM symptom_logs WHERE id LIKE 'seed-%'`);
}
