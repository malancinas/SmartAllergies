export const SYMPTOM_TYPES = [
  'sneezing',
  'itchy_eyes',
  'runny_nose',
  'congestion',
  'skin_reaction',
  'headache',
] as const;

export type SymptomType = (typeof SYMPTOM_TYPES)[number];

export const TIME_SLOTS = [
  { key: 'early_morning', label: 'Early morning', hours: [5, 6, 7] },
  { key: 'morning', label: 'Morning', hours: [8, 9, 10, 11] },
  { key: 'midday', label: 'Midday', hours: [12, 13] },
  { key: 'afternoon', label: 'Afternoon', hours: [14, 15, 16, 17] },
  { key: 'evening', label: 'Evening', hours: [18, 19, 20, 21] },
  { key: 'night', label: 'Night', hours: [22, 23, 0, 1, 2, 3, 4] },
] as const;

export type TimeSlotKey = (typeof TIME_SLOTS)[number]['key'];

export interface SymptomLog {
  id: string;
  loggedAt: string; // ISO8601
  severity: number; // 1–10
  symptoms: SymptomType[];
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  medications: string | null;
}

export interface CreateSymptomLogInput {
  symptoms: SymptomType[];
  severity: number;
  timeSlot: TimeSlotKey;
  notes?: string;
  medications?: string;
  latitude?: number;
  longitude?: number;
}
