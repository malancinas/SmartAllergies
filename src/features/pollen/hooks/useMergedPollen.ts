import { useQuery } from '@tanstack/react-query';
import { usePollenForecast } from '../api';
import { fetchGooglePollenHome } from '../googlePollenApi';
import { wrapSingleSource } from '../pollenMerger';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { isEurope } from '@/utils/regionDetection';
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

  const inEurope = lat !== null && lon !== null && isEurope(lat, lon);
  const nonEuropePro = lat !== null && lon !== null && !inEurope && isPro;

  // Always fetch Open-Meteo — pollen fields are Europe-only but air quality and
  // hourly data (needed for the peak hours card) are available globally.
  const omQuery = usePollenForecast(lat, lon);

  // Google Pollen for non-Europe Pro users, 12-hour cache with rounded coords
  const googleQuery = useQuery({
    queryKey: ['pollen-google-home', Math.round(lat ?? 0), Math.round(lon ?? 0)],
    queryFn: () => fetchGooglePollenHome(lat!, lon!),
    enabled: nonEuropePro && !!ENV.GOOGLE_POLLEN_API_KEY,
    staleTime: 12 * 60 * 60 * 1000,
    retry: 1,
  });

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const fetchedAt = now.toISOString();

  const omDaily = omQuery.data?.daily ?? [];
  const limitedCoverage = omQuery.data?.limitedCoverage ?? false;

  let mergedForecast: MergedDailyPollenForecast[] = [];

  if (nonEuropePro && (googleQuery.data ?? []).length > 0) {
    // Use Google Pollen for tree/grass/weed levels, inject Open-Meteo air quality
    // (OM air quality is global; only its pollen fields are Europe-only).
    const wrapped = wrapSingleSource(googleQuery.data!, {
      name: 'Google Pollen',
      lastUpdated: fetchedAt,
      coverage: 'local',
    });
    mergedForecast = wrapped.map((day, i) => ({
      ...day,
      airQuality: omDaily[i]?.airQuality,
    }));
  } else if (inEurope && omDaily.length > 0) {
    mergedForecast = wrapSingleSource(omDaily, {
      name: 'Open-Meteo',
      lastUpdated: fetchedAt,
      coverage: limitedCoverage ? 'regional' : 'local',
    });
  }
  // Outside Europe + not Pro → empty forecast; home screen renders the upgrade UI

  const today = mergedForecast.find((d) => d.date === todayStr) ?? null;

  const loading = nonEuropePro
    ? googleQuery.isFetching || omQuery.isFetching
    : omQuery.isFetching;

  return {
    today,
    forecast: mergedForecast,
    // Hourly always from Open-Meteo — air quality hourly is global; pollen hourly
    // will be zero outside Europe but the peak hours card still uses AQ values.
    hourly: omQuery.data?.hourly ?? [],
    limitedCoverage: inEurope ? limitedCoverage : false,
    loading,
    error: (inEurope ? omQuery.error : googleQuery.error) as Error | null,
    staleSince: omQuery.data?.staleSince ?? null,
  };
}
