import { getPollenCache, setPollenCache } from '@/services/database';
import { ENV } from '@/config/env';
import type { DailyPollenForecast, PollenLevel, PollenTypeData } from './types';

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

  const daily: DailyPollenForecast[] = (json.dailyInfo ?? []).map((day) => {
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

  await setPollenCache(cacheKey, daily);
  return daily;
}
