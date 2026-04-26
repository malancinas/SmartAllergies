import { useQuery } from '@tanstack/react-query';
import { getPollenCache, setPollenCache, getStalePollenCacheByPrefix } from '@/services/database';
import type {
  PollenForecastResponse,
  WeatherForecastResponse,
  DailyPollenForecast,
  HourlyPollenPoint,
  PollenLevel,
  PollenTypeData,
  SpeciesData,
  WeatherPoint,
} from './types';

// ─── Thresholds (grains/m³) ──────────────────────────────────────────────────

function classifyTree(value: number): PollenLevel {
  if (value === 0) return 'none';
  if (value < 15) return 'low';
  if (value < 90) return 'medium';
  if (value < 250) return 'high';
  return 'very_high';
}

function classifyGrass(value: number): PollenLevel {
  if (value === 0) return 'none';
  if (value < 5) return 'low';
  if (value < 30) return 'medium';
  if (value < 100) return 'high';
  return 'very_high';
}

function classifyWeed(value: number): PollenLevel {
  if (value === 0) return 'none';
  if (value < 10) return 'low';
  if (value < 50) return 'medium';
  if (value < 150) return 'high';
  return 'very_high';
}

const LEVEL_ORDER: PollenLevel[] = ['none', 'low', 'medium', 'high', 'very_high'];

function maxLevel(...levels: PollenLevel[]): PollenLevel {
  return levels.reduce((best, l) =>
    LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf(best) ? l : best,
  );
}

// ─── Fetch: Pollen (Air Quality API) ────────────────────────────────────────

async function fetchPollenForecast(
  lat: number,
  lon: number,
): Promise<PollenForecastResponse> {
  const latStr = lat.toFixed(2);
  const lonStr = lon.toFixed(2);
  const cacheKey = `pollen_${latStr}_${lonStr}_${new Date().toISOString().slice(0, 13)}`;
  const cachePrefix = `pollen_${latStr}_${lonStr}_`;

  const cached = await getPollenCache<PollenForecastResponse>(cacheKey);
  if (cached) return cached;

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
    `&timezone=auto&forecast_days=5`;

  let json: any;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pollen API error: ${res.status}`);
    json = await res.json();
  } catch (fetchErr) {
    const stale = await getStalePollenCacheByPrefix<PollenForecastResponse>(cachePrefix);
    if (stale) return { ...stale.data, staleSince: stale.fetchedAt };
    throw fetchErr;
  }

  const hourly: HourlyPollenPoint[] = (json.hourly.time as string[]).map(
    (time: string, i: number) => ({
      time,
      tree:
        (json.hourly.alder_pollen?.[i] ?? 0) +
        (json.hourly.birch_pollen?.[i] ?? 0) +
        (json.hourly.olive_pollen?.[i] ?? 0),
      grass: json.hourly.grass_pollen?.[i] ?? 0,
      weed:
        (json.hourly.mugwort_pollen?.[i] ?? 0) +
        (json.hourly.ragweed_pollen?.[i] ?? 0),
    }),
  );

  // Aggregate to daily max, tracking individual species
  type RawSpecies = {
    alder: number[]; birch: number[]; olive: number[];
    grass: number[]; mugwort: number[]; ragweed: number[];
  };
  const byDate = new Map<string, RawSpecies>();
  for (let i = 0; i < (json.hourly.time as string[]).length; i++) {
    const date = (json.hourly.time[i] as string).slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { alder: [], birch: [], olive: [], grass: [], mugwort: [], ragweed: [] });
    const entry = byDate.get(date)!;
    entry.alder.push(json.hourly.alder_pollen?.[i] ?? 0);
    entry.birch.push(json.hourly.birch_pollen?.[i] ?? 0);
    entry.olive.push(json.hourly.olive_pollen?.[i] ?? 0);
    entry.grass.push(json.hourly.grass_pollen?.[i] ?? 0);
    entry.mugwort.push(json.hourly.mugwort_pollen?.[i] ?? 0);
    entry.ragweed.push(json.hourly.ragweed_pollen?.[i] ?? 0);
  }

  const daily: DailyPollenForecast[] = Array.from(byDate.entries()).map(
    ([date, vals]) => {
      const alderMax = Math.max(...vals.alder);
      const birchMax = Math.max(...vals.birch);
      const oliveMax = Math.max(...vals.olive);
      const grassMax = Math.max(...vals.grass);
      const mugwortMax = Math.max(...vals.mugwort);
      const ragweedMax = Math.max(...vals.ragweed);

      const treeMax = alderMax + birchMax + oliveMax;
      const weedMax = mugwortMax + ragweedMax;

      const treeData: PollenTypeData = { level: classifyTree(treeMax), rawValue: treeMax };
      const grassData: PollenTypeData = { level: classifyGrass(grassMax), rawValue: grassMax };
      const weedData: PollenTypeData = { level: classifyWeed(weedMax), rawValue: weedMax };

      const species: SpeciesData[] = [
        { name: 'Birch', category: 'tree', level: classifyTree(birchMax), rawValue: birchMax },
        { name: 'Alder', category: 'tree', level: classifyTree(alderMax), rawValue: alderMax },
        { name: 'Olive', category: 'tree', level: classifyTree(oliveMax), rawValue: oliveMax },
        { name: 'Grass', category: 'grass', level: classifyGrass(grassMax), rawValue: grassMax },
        { name: 'Mugwort', category: 'weed', level: classifyWeed(mugwortMax), rawValue: mugwortMax },
        { name: 'Ragweed', category: 'weed', level: classifyWeed(ragweedMax), rawValue: ragweedMax },
      ];

      return {
        date,
        tree: treeData,
        grass: grassData,
        weed: weedData,
        overallLevel: maxLevel(treeData.level, grassData.level, weedData.level),
        species,
      };
    },
  );

  const allZero = hourly.every((h) => h.tree === 0 && h.grass === 0 && h.weed === 0);

  const result: PollenForecastResponse = { hourly, daily, limitedCoverage: allZero };
  await setPollenCache(cacheKey, result);
  return result;
}

// ─── Fetch: Weather ──────────────────────────────────────────────────────────

async function fetchWeatherForecast(
  lat: number,
  lon: number,
): Promise<WeatherForecastResponse> {
  const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}_${new Date().toISOString().slice(0, 13)}`;
  const cached = await getPollenCache<WeatherForecastResponse>(cacheKey);
  if (cached) return cached;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code` +
    `&timezone=auto&forecast_days=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const json = await res.json();

  const hourly: WeatherPoint[] = (json.hourly.time as string[]).map(
    (time: string, i: number) => ({
      time,
      temperature: json.hourly.temperature_2m?.[i] ?? 0,
      humidity: json.hourly.relative_humidity_2m?.[i] ?? 0,
      windSpeed: json.hourly.wind_speed_10m?.[i] ?? 0,
      precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
      weatherCode: json.hourly.weather_code?.[i] ?? 0,
    }),
  );

  const result: WeatherForecastResponse = { hourly };
  await setPollenCache(cacheKey, result);
  return result;
}

// ─── TanStack Query Hooks ────────────────────────────────────────────────────

export function usePollenForecast(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ['pollen', lat?.toFixed(2), lon?.toFixed(2)],
    queryFn: () => fetchPollenForecast(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
}

export function useWeatherForecast(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ['weather', lat?.toFixed(2), lon?.toFixed(2)],
    queryFn: () => fetchWeatherForecast(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
}
