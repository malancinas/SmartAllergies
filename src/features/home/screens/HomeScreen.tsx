import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useForecast } from '@/features/forecasting/hooks/useForecast';
import { RiskBanner } from '../components/RiskBanner';
import { PollenSummary } from '../components/PollenSummary';
import { ForecastStrip } from '../components/ForecastStrip';

export default function HomeScreen() {
  const { user } = useAuth();
  const { today: todayPollen, todayWeather, limitedCoverage, permissionDenied, loading: pollenLoading } =
    useCurrentPollen();
  const { today: riskToday, upcoming, weights, loading: forecastLoading } = useForecast();

  const loading = pollenLoading || forecastLoading;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={5} className="py-4">
          {/* Greeting */}
          <View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
              Hello, {user?.name ?? 'there'} 👋
            </Text>
            <Text className="text-sm text-neutral-500 mt-1">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Location permission denied */}
          {permissionDenied && (
            <View className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4">
              <Text className="text-sm text-neutral-500 text-center">
                📍 Enable location access to see your local pollen forecast.
              </Text>
            </View>
          )}

          {/* Loading state */}
          {loading && !riskToday && (
            <View className="items-center py-8">
              <ActivityIndicator />
              <Text className="text-sm text-neutral-400 mt-3">Fetching pollen data…</Text>
            </View>
          )}

          {/* Risk banner */}
          {riskToday && (
            <RiskBanner level={riskToday.level} personalised={weights.personalised} />
          )}

          {/* Today's pollen breakdown */}
          {todayPollen && (
            <PollenSummary today={todayPollen} limitedCoverage={limitedCoverage} />
          )}

          {/* 5-day forecast strip */}
          {upcoming.length > 0 && <ForecastStrip upcoming={upcoming} />}

          {/* Weather context */}
          {todayWeather && (
            <View className="flex-row justify-around bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
              <WeatherStat label="Humidity" value={`${Math.round(todayWeather.humidity)}%`} />
              <WeatherStat label="Wind" value={`${Math.round(todayWeather.windSpeed)} km/h`} />
              <WeatherStat label="Temp" value={`${Math.round(todayWeather.temperature)}°C`} />
              <WeatherStat
                label="Rain chance"
                value={`${Math.round(todayWeather.precipitationProbability)}%`}
              />
            </View>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-base font-semibold text-neutral-800 dark:text-white">{value}</Text>
      <Text className="text-xs text-neutral-400 mt-0.5">{label}</Text>
    </View>
  );
}
