import { useMemo } from 'react';
import { useLocation } from './useLocation';
import { useWeatherForecast } from '../api';
import { useMergedPollen } from './useMergedPollen';
import type { MergedDailyPollenForecast, WeatherPoint } from '../types';

interface UseCurrentPollenResult {
  today: MergedDailyPollenForecast | null;
  forecast: MergedDailyPollenForecast[];
  todayWeather: WeatherPoint | null;
  limitedCoverage: boolean;
  loading: boolean;
  error: Error | null;
  permissionDenied: boolean;
  staleSince: string | null;
}

export function useCurrentPollen(): UseCurrentPollenResult {
  const { location, permissionDenied, loading: locLoading } = useLocation();

  const mergedPollen = useMergedPollen(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );
  const weatherQuery = useWeatherForecast(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );

  const currentHour = new Date().toISOString().slice(0, 13);
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayWeather = useMemo(() => {
    if (!weatherQuery.data) return null;
    return (
      weatherQuery.data.hourly.find((h) => h.time.startsWith(currentHour)) ??
      weatherQuery.data.hourly.find((h) => h.time.startsWith(todayStr)) ??
      null
    );
  }, [weatherQuery.data, currentHour, todayStr]);

  const loading =
    locLoading ||
    (location !== null && (mergedPollen.loading || weatherQuery.isFetching));

  const error = mergedPollen.error ?? (weatherQuery.error as Error | null);

  return {
    today: mergedPollen.today,
    forecast: mergedPollen.forecast,
    todayWeather,
    limitedCoverage: mergedPollen.limitedCoverage,
    loading,
    error,
    permissionDenied,
    staleSince: mergedPollen.staleSince,
  };
}
