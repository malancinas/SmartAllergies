import { useMemo } from 'react';
import { useLocation } from './useLocation';
import { useWeatherForecast } from '../api';
import { useMergedPollen } from './useMergedPollen';
import type { MergedDailyPollenForecast, WeatherPoint, HourlyPollenPoint } from '../types';

interface UseCurrentPollenResult {
  today: MergedDailyPollenForecast | null;
  forecast: MergedDailyPollenForecast[];
  todayHourly: HourlyPollenPoint[];
  todayWeather: WeatherPoint | null;
  weatherForecast: WeatherPoint[];
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

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentHour = `${todayStr}T${pad(now.getHours())}`;

  const todayHourly = useMemo(
    () => mergedPollen.hourly.filter((h) => h.time.startsWith(todayStr)),
    [mergedPollen.hourly, todayStr],
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
    (location !== null && (mergedPollen.loading || weatherQuery.isFetching));

  const error = mergedPollen.error ?? (weatherQuery.error as Error | null);

  return {
    today: mergedPollen.today,
    forecast: mergedPollen.forecast,
    todayHourly,
    todayWeather,
    weatherForecast: weatherQuery.data?.hourly ?? [],
    limitedCoverage: mergedPollen.limitedCoverage,
    loading,
    error,
    permissionDenied,
    staleSince: mergedPollen.staleSince,
  };
}
