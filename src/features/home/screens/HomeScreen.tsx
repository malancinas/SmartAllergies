import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useForecast } from '@/features/forecasting/hooks/useForecast';
import { RiskBanner } from '../components/RiskBanner';
import { PollenSummary } from '../components/PollenSummary';
import { ForecastStrip } from '../components/ForecastStrip';
import { DataQualitySheet } from '../components/DataQualitySheet';
import { CommunityBanner } from '@/features/community/components/CommunityBanner';
import { useCommunitySignal } from '@/features/community/hooks/useCommunitySignal';
import { usePollenStore } from '@/features/pollen/store';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { AddressSearch } from '../components/AddressSearch';

export default function HomeScreen() {
  const { user } = useAuth();
  const { today: todayPollen, todayWeather, limitedCoverage, permissionDenied, loading: pollenLoading, staleSince } =
    useCurrentPollen();
  const { today: riskToday, upcoming, weights, loading: forecastLoading } = useForecast();
  const [qualitySheetVisible, setQualitySheetVisible] = useState(false);

  const location = usePollenStore((s) => s.location);
  const allergenProfile = useSettingsStore((s) => s.allergenProfile);
  const { aggregate, loading: communityLoading } = useCommunitySignal(
    location?.latitude ?? null,
    location?.longitude ?? null,
  );

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

          {/* Stale data badge — shown when offline and serving cached data */}
          {staleSince && (
            <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2 flex-row items-center gap-2">
              <Text className="text-amber-600 dark:text-amber-400 text-xs">
                📶 No connection — showing data from {formatAge(staleSince)}
              </Text>
            </View>
          )}

          {/* Location permission denied — let user enter an address instead */}
          {permissionDenied && <AddressSearch />}

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

          {/* Community signal */}
          <CommunityBanner aggregate={aggregate} loading={communityLoading} />

          {/* Today's pollen breakdown */}
          {todayPollen && (
            <PollenSummary
              today={todayPollen}
              limitedCoverage={limitedCoverage}
              allergenProfile={allergenProfile}
              onQualityPress={() => setQualitySheetVisible(true)}
            />
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

      {/* Data quality sheet — rendered outside ScrollView so it overlays correctly */}
      {todayPollen && (
        <DataQualitySheet
          visible={qualitySheetVisible}
          onClose={() => setQualitySheetVisible(false)}
          today={todayPollen}
        />
      )}
    </Screen>
  );
}

function formatAge(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return 'less than an hour ago';
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-base font-semibold text-neutral-800 dark:text-white">{value}</Text>
      <Text className="text-xs text-neutral-400 mt-0.5">{label}</Text>
    </View>
  );
}
