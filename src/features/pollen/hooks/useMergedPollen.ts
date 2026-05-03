import { usePollenForecast } from '../api';
import { wrapSingleSource } from '../pollenMerger';
import type { MergedDailyPollenForecast } from '../types';

interface UseMergedPollenResult {
  today: MergedDailyPollenForecast | null;
  forecast: MergedDailyPollenForecast[];
  hourly: import('../types').HourlyPollenPoint[];
  limitedCoverage: boolean;
  loading: boolean;
  error: Error | null;
  staleSince: string | null;
}

export function useMergedPollen(
  lat: number | null,
  lon: number | null,
): UseMergedPollenResult {
  const omQuery = usePollenForecast(lat, lon);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const fetchedAt = now.toISOString();

  const omDaily = omQuery.data?.daily ?? [];
  const limitedCoverage = omQuery.data?.limitedCoverage ?? false;

  const mergedForecast: MergedDailyPollenForecast[] = omDaily.length > 0
    ? wrapSingleSource(omDaily, {
        name: 'Open-Meteo',
        lastUpdated: fetchedAt,
        coverage: limitedCoverage ? 'regional' : 'local',
      })
    : [];

  const today = mergedForecast.find((d) => d.date === todayStr) ?? null;

  return {
    today,
    forecast: mergedForecast,
    hourly: omQuery.data?.hourly ?? [],
    limitedCoverage,
    loading: omQuery.isFetching,
    error: omQuery.error as Error | null,
    staleSince: omQuery.data?.staleSince ?? null,
  };
}
