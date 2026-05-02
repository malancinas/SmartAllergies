import { useQuery } from '@tanstack/react-query';
import { usePollenForecast } from '../api';
import { fetchGooglePollenForecast } from '../googlePollenApi';
import { mergePollenSources, wrapSingleSource } from '../pollenMerger';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { ENV } from '@/config/env';
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
  const { isPro } = useSubscription();
  const enabled = lat !== null && lon !== null;

  // Always fetch Open-Meteo (primary, free)
  const omQuery = usePollenForecast(lat, lon);

  // Fetch Google Pollen only for Pro users with key configured
  const googleQuery = useQuery({
    queryKey: ['pollen-google', lat?.toFixed(2), lon?.toFixed(2)],
    queryFn: () => fetchGooglePollenForecast(lat!, lon!),
    enabled: enabled && isPro && !!ENV.GOOGLE_POLLEN_API_KEY,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    // Don't propagate Google errors — merger handles missing data gracefully
  });

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const fetchedAt = now.toISOString();

  const omDaily = omQuery.data?.daily ?? [];
  const googleDaily = googleQuery.data ?? [];
  const limitedCoverage = omQuery.data?.limitedCoverage ?? false;

  let mergedForecast: MergedDailyPollenForecast[] = [];

  if (omDaily.length > 0 && googleDaily.length > 0 && isPro) {
    mergedForecast = mergePollenSources(omDaily, googleDaily, limitedCoverage, fetchedAt);
  } else if (omDaily.length > 0) {
    mergedForecast = wrapSingleSource(omDaily, {
      name: 'Open-Meteo',
      lastUpdated: fetchedAt,
      coverage: limitedCoverage ? 'regional' : 'local',
    });
  }

  const today = mergedForecast.find((d) => d.date === todayStr) ?? null;

  const loading =
    omQuery.isFetching || (isPro && !!ENV.GOOGLE_POLLEN_API_KEY && googleQuery.isFetching);

  const error = (omQuery.error as Error | null);

  const staleSince = omQuery.data?.staleSince ?? null;

  return { today, forecast: mergedForecast, hourly: omQuery.data?.hourly ?? [], limitedCoverage, loading, error, staleSince };
}
