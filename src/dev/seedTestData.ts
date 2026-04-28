import { getDatabase, insertLogEnvironment } from '@/services/database';

function makeId(daysAgo: number, index: number): string {
  return `seed-${daysAgo}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

type Symptom = 'sneezing' | 'itchy_eyes' | 'runny_nose' | 'congestion' | 'skin_reaction' | 'headache' | 'none';

// Realistic 30-day scenario: mild symptoms early on, peaking mid-period, tapering off
const DAYS: Array<{
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
}> = [
  { daysAgo: 30, severity: 3, symptoms: ['sneezing'], timeSlot: 'morning', hour: 9, grassPollen: 12, treePollen: 8 },
  { daysAgo: 29, severity: 4, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 8, grassPollen: 15, treePollen: 10 },
  { daysAgo: 28, severity: 3, symptoms: ['runny_nose'], timeSlot: 'afternoon', hour: 14, grassPollen: 14, treePollen: 9 },
  { daysAgo: 27, severity: 5, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 10, medications: 'Cetirizine', grassPollen: 20, treePollen: 14 },
  { daysAgo: 26, severity: 4, symptoms: ['itchy_eyes', 'congestion'], timeSlot: 'midday', hour: 12, medications: 'Cetirizine', grassPollen: 22, treePollen: 15 },
  { daysAgo: 25, severity: 6, symptoms: ['sneezing', 'runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine', grassPollen: 28, treePollen: 18, pm25: 12 },
  { daysAgo: 24, severity: 7, symptoms: ['sneezing', 'congestion', 'headache'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 35, treePollen: 22, pm25: 14 },
  { daysAgo: 23, severity: 5, symptoms: ['runny_nose', 'congestion'], timeSlot: 'afternoon', hour: 15, medications: 'Flonase', grassPollen: 30, treePollen: 19 },
  { daysAgo: 22, severity: 8, symptoms: ['sneezing', 'itchy_eyes', 'runny_nose', 'congestion'], timeSlot: 'morning', hour: 7, medications: 'Cetirizine, Flonase', grassPollen: 42, treePollen: 28, pm25: 18 },
  { daysAgo: 21, severity: 7, symptoms: ['sneezing', 'itchy_eyes', 'headache'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine, Flonase', grassPollen: 40, treePollen: 26, pm25: 16 },
  { daysAgo: 20, severity: 8, symptoms: ['sneezing', 'runny_nose', 'itchy_eyes', 'skin_reaction'], timeSlot: 'midday', hour: 12, medications: 'Cetirizine, Flonase, Piriton', grassPollen: 45, treePollen: 30, pm25: 20 },
  { daysAgo: 19, severity: 9, symptoms: ['sneezing', 'congestion', 'headache', 'itchy_eyes'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 50, treePollen: 33, pm25: 22 },
  { daysAgo: 18, severity: 9, symptoms: ['sneezing', 'itchy_eyes', 'runny_nose', 'congestion', 'headache'], timeSlot: 'early_morning', hour: 6, medications: 'Cetirizine, Flonase', grassPollen: 52, treePollen: 35, pm25: 24 },
  { daysAgo: 17, severity: 8, symptoms: ['sneezing', 'runny_nose', 'congestion'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine, Flonase', grassPollen: 48, treePollen: 31, pm25: 20 },
  { daysAgo: 16, severity: 7, symptoms: ['itchy_eyes', 'runny_nose', 'sneezing'], timeSlot: 'afternoon', hour: 14, medications: 'Cetirizine', grassPollen: 44, treePollen: 28, pm25: 17 },
  { daysAgo: 15, severity: 6, symptoms: ['sneezing', 'congestion'], timeSlot: 'morning', hour: 10, medications: 'Cetirizine', grassPollen: 38, treePollen: 24, pm25: 14 },
  { daysAgo: 14, severity: 6, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 9, medications: 'Cetirizine', grassPollen: 35, treePollen: 22 },
  { daysAgo: 13, severity: 5, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'midday', hour: 13, medications: 'Cetirizine', grassPollen: 30, treePollen: 18 },
  { daysAgo: 12, severity: 7, symptoms: ['sneezing', 'itchy_eyes', 'headache'], timeSlot: 'morning', hour: 8, medications: 'Cetirizine, Flonase', grassPollen: 38, treePollen: 25, pm25: 16 },
  { daysAgo: 11, severity: 6, symptoms: ['congestion', 'sneezing'], timeSlot: 'evening', hour: 19, medications: 'Cetirizine', grassPollen: 32, treePollen: 21 },
  { daysAgo: 10, severity: 5, symptoms: ['runny_nose', 'congestion'], timeSlot: 'afternoon', hour: 15, grassPollen: 28, treePollen: 18 },
  { daysAgo: 9, severity: 4, symptoms: ['sneezing', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 24, treePollen: 15 },
  { daysAgo: 8, severity: 5, symptoms: ['runny_nose', 'sneezing'], timeSlot: 'morning', hour: 10, medications: 'Cetirizine', grassPollen: 26, treePollen: 16 },
  { daysAgo: 7, severity: 4, symptoms: ['itchy_eyes'], timeSlot: 'midday', hour: 12, grassPollen: 20, treePollen: 13 },
  { daysAgo: 6, severity: 3, symptoms: ['sneezing'], timeSlot: 'morning', hour: 8, grassPollen: 18, treePollen: 11 },
  { daysAgo: 5, severity: 3, symptoms: ['runny_nose'], timeSlot: 'afternoon', hour: 14, grassPollen: 16, treePollen: 10 },
  { daysAgo: 4, severity: 4, symptoms: ['sneezing', 'runny_nose'], timeSlot: 'morning', hour: 9, grassPollen: 19, treePollen: 12 },
  { daysAgo: 3, severity: 3, symptoms: ['congestion'], timeSlot: 'evening', hour: 20, grassPollen: 15, treePollen: 9 },
  { daysAgo: 2, severity: 2, symptoms: ['sneezing'], timeSlot: 'morning', hour: 10, grassPollen: 12, treePollen: 7 },
  { daysAgo: 1, severity: 3, symptoms: ['runny_nose', 'itchy_eyes'], timeSlot: 'morning', hour: 9, grassPollen: 14, treePollen: 8 },
];

function daysAgoISO(daysAgo: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export async function seedTestLogs(): Promise<void> {
  const db = await getDatabase();

  for (let i = 0; i < DAYS.length; i++) {
    const entry = DAYS[i];
    const id = makeId(entry.daysAgo, i);
    const loggedAt = daysAgoISO(entry.daysAgo, entry.hour);
    const dateStr = loggedAt.slice(0, 10);

    await db.runAsync(
      `INSERT INTO symptom_logs (id, logged_at, created_at, severity, latitude, longitude, notes, medications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      loggedAt,
      loggedAt,
      entry.severity,
      51.5074,   // London coords for consistency
      -0.1278,
      null,
      entry.medications ?? null,
    );

    for (const symptom of entry.symptoms) {
      await db.runAsync(
        `INSERT OR IGNORE INTO log_symptoms (log_id, symptom) VALUES (?, ?)`,
        id,
        symptom,
      );
    }

    if (entry.grassPollen !== undefined || entry.treePollen !== undefined || entry.pm25 !== undefined) {
      await insertLogEnvironment({
        logId: id,
        date: dateStr,
        grassPollen: entry.grassPollen,
        treePollen: entry.treePollen,
        weedPollen: 3,
        pm25: entry.pm25,
        pm10: entry.pm25 ? entry.pm25 * 1.8 : undefined,
        ozone: 60,
        uvIndex: 4,
      });
    }
  }
}

export async function clearTestLogs(): Promise<void> {
  const db = await getDatabase();
  // Cascade deletes log_symptoms and log_environment via FK
  await db.runAsync(`DELETE FROM symptom_logs WHERE notes IS NULL AND latitude = 51.5074`);
}
