import { useMemo } from 'react';
import { useLocation } from './useLocation';
import { usePollenForecast, useWeatherForecast } from '../api';
import type { DailyPollenForecast, WeatherPoint } from '../types';

interface UseCurrentPollenResult {
  today: DailyPollenForecast | null;
  forecast: DailyPollenForecast[];
  todayWeather: WeatherPoint | null;
  limitedCoverage: boolean;
  loading: boolean;
  error: Error | null;
  permissionDenied: boolean;
}

export function useCurrentPollen(): UseCurrentPollenResult {
  const { location, permissionDenied, loading: locLoading } = useLocation();

  const pollenQuery = usePollenForecast(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );
  const weatherQuery = useWeatherForecast(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentHour = new Date().toISOString().slice(0, 13);

  const today = useMemo(
    () => pollenQuery.data?.daily.find((d) => d.date === todayStr) ?? null,
    [pollenQuery.data, todayStr],
  );

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
    (location !== null && (pollenQuery.isFetching || weatherQuery.isFetching));

  const error =
    (pollenQuery.error as Error | null) ?? (weatherQuery.error as Error | null);

  return {
    today,
    forecast: pollenQuery.data?.daily ?? [],
    todayWeather,
    limitedCoverage: pollenQuery.data?.limitedCoverage ?? false,
    loading,
    error,
    permissionDenied,
  };
}
