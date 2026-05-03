import { getPollenCache, setPollenCache, getApiCallCount, incrementApiCallCount, DAILY_API_LIMIT } from '@/services/database';
import { ENV } from '@/config/env';
import { authStore } from '@/stores/persistent/authStore';
import type { DailyPollenForecast, PollenLevel, PollenTypeData } from './types';

export class QuotaExceededError extends Error {
  constructor() {
    super("You've reached your daily limit of 150 location lookups. Your quota resets at midnight.");
    this.name = 'QuotaExceededError';
  }
}

function getUserId(): string {
  return authStore.getState().user?.id ?? 'anonymous';
}

// Google's UPI index 0–5 maps to our PollenLevel
function indexToLevel(index: number | null): PollenLevel {
  if (index === null || index === 0) return 'none';
  if (index <= 1) return 'low';
  if (index <= 2) return 'medium'; // actually index 2 = low, 3 = medium per Google docs
  if (index <= 3) return 'medium';
  if (index <= 4) return 'high';
  return 'very_high';
}

// Placeholder raw value derived from index (Google doesn't expose grains/m³)
function indexToRaw(index: number | null): number {
  const map: Record<number, number> = { 0: 0, 1: 5, 2: 10, 3: 50, 4: 100, 5: 300 };
  return map[index ?? 0] ?? 0;
}

interface GooglePollenTypeInfo {
  code: string; // 'TREE' | 'GRASS' | 'WEED'
  indexInfo?: { value: number | null };
}

interface GoogleDayInfo {
  date: { year: number; month: number; day: number };
  pollenTypeInfo?: GooglePollenTypeInfo[];
}

// Shared HTTP fetch + parse logic used by both public functions
async function callGooglePollenApi(lat: number, lon: number): Promise<DailyPollenForecast[]> {
  const url =
    `https://pollen.googleapis.com/v1/forecast:lookup` +
    `?location.longitude=${lon}` +
    `&location.latitude=${lat}` +
    `&days=5` +
    `&key=${ENV.GOOGLE_POLLEN_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Pollen API error ${res.status}: ${body}`);
  }

  const json: { dailyInfo?: GoogleDayInfo[] } = await res.json();

  return (json.dailyInfo ?? []).map((day) => {
    const { year, month, day: d } = day.date;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    let treeIndex: number | null = null;
    let grassIndex: number | null = null;
    let weedIndex: number | null = null;

    for (const info of day.pollenTypeInfo ?? []) {
      const val = info.indexInfo?.value ?? null;
      if (info.code === 'TREE') treeIndex = val;
      else if (info.code === 'GRASS') grassIndex = val;
      else if (info.code === 'WEED') weedIndex = val;
    }

    const tree: PollenTypeData = { level: indexToLevel(treeIndex), rawValue: indexToRaw(treeIndex) };
    const grass: PollenTypeData = { level: indexToLevel(grassIndex), rawValue: indexToRaw(grassIndex) };
    const weed: PollenTypeData = { level: indexToLevel(weedIndex), rawValue: indexToRaw(weedIndex) };

    const LEVEL_ORDER: PollenLevel[] = ['none', 'low', 'medium', 'high', 'very_high'];
    const overallLevel = [tree.level, grass.level, weed.level].reduce((best, l) =>
      LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf(best) ? l : best,
    );

    return { date, tree, grass, weed, overallLevel };
  });
}

// Used by the Pro map screen — 1-hour cache, quota-tracked per user
export async function fetchGooglePollenForecast(
  lat: number,
  lon: number,
): Promise<DailyPollenForecast[]> {
  if (!ENV.GOOGLE_POLLEN_API_KEY) {
    throw new Error('Google Pollen API key not configured');
  }

  const cacheKey = `gpollen_${lat.toFixed(2)}_${lon.toFixed(2)}_${new Date().toISOString().slice(0, 13)}`;
  const cached = await getPollenCache<DailyPollenForecast[]>(cacheKey);
  if (cached) return cached;

  const userId = getUserId();
  const currentCount = await getApiCallCount(userId);
  if (currentCount >= DAILY_API_LIMIT) {
    throw new QuotaExceededError();
  }

  const daily = await callGooglePollenApi(lat, lon);
  await incrementApiCallCount(userId);
  await setPollenCache(cacheKey, daily);
  return daily;
}

// Used by the home page for non-Europe Pro users — 12-hour cache, 0-decimal rounded coords,
// coastal fallback to exact coords if rounded point returns no data
export async function fetchGooglePollenHome(
  lat: number,
  lon: number,
): Promise<DailyPollenForecast[]> {
  if (!ENV.GOOGLE_POLLEN_API_KEY) {
    throw new Error('Google Pollen API key not configured');
  }

  const roundedLat = Math.round(lat);
  const roundedLon = Math.round(lon);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const bucket = Math.floor(now.getHours() / 12); // 0 = midnight–noon, 1 = noon–midnight
  const cacheKey = `gpollen_home_${roundedLat}_${roundedLon}_${dateStr}_${bucket}`;

  const cached = await getPollenCache<DailyPollenForecast[]>(cacheKey);
  if (cached) return cached;

  const primary = await callGooglePollenApi(roundedLat, roundedLon);
  if (primary.length > 0) {
    await setPollenCache(cacheKey, primary);
    return primary;
  }

  // Coastal fallback: rounded point may be over ocean — retry with exact coords
  const exactKey = `gpollen_home_exact_${lat.toFixed(2)}_${lon.toFixed(2)}_${dateStr}_${bucket}`;
  const exactCached = await getPollenCache<DailyPollenForecast[]>(exactKey);
  if (exactCached) return exactCached;

  const fallback = await callGooglePollenApi(lat, lon);
  if (fallback.length > 0) await setPollenCache(exactKey, fallback);
  return fallback;
}
