import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/types/navigation';
import { Screen, Stack } from '@/components/layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useForecast } from '@/features/forecasting/hooks/useForecast';
import { RiskBanner } from '../components/RiskBanner';
import { PollenSummary } from '../components/PollenSummary';
import { ForecastStrip } from '../components/ForecastStrip';
import { PeakHoursCard } from '../components/PeakHoursCard';
import { usePollenStore } from '@/features/pollen/store';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { useAllergyProfile } from '@/features/insights/hooks/useAllergyProfile';
import { AddressSearch } from '../components/AddressSearch';
import { ChangeLocationSheet } from '@/features/location/components/ChangeLocationSheet';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user } = useAuth();
  const { today: todayPollen, forecast: pollenForecast, todayHourly, todayWeather, weatherForecast, limitedCoverage, permissionDenied, loading: pollenLoading, staleSince } =
    useCurrentPollen();
  const { today: riskToday, upcoming, weights, loading: forecastLoading } = useForecast();
  const { isPro, showPaywall, paywallProps } = useProGate();
  const [devProOverride, setDevProOverride] = useState<boolean | null>(null);
  const effectiveIsPro = __DEV__ && devProOverride !== null ? devProOverride : isPro;
  const { data: profileData } = useAllergyProfile();

  const location = usePollenStore((s) => s.location);
  const locationLabel = usePollenStore((s) => s.locationLabel);
  const allergenProfile = useSettingsStore((s) => s.allergenProfile);
  const allergenSource = useSettingsStore((s) => s.allergenSource);

  const TRIGGER_KEY_MAP: Record<string, string> = { grassPollen: 'grass', treePollen: 'tree', weedPollen: 'weed' };

  // When the user has opted into model-derived allergens, pull the active list from the ML output.
  const activeAllergens = useMemo(() => {
    if (effectiveIsPro && allergenSource === 'model' && profileData?.advancedProfile) {
      const modelList = profileData.advancedProfile.triggers
        .filter((t) => t.partialBeta > 0)
        .map((t) => TRIGGER_KEY_MAP[t.key])
        .filter(Boolean);
      if (modelList.length > 0) return modelList;
    }
    return allergenProfile;
  }, [effectiveIsPro, allergenSource, profileData?.advancedProfile, allergenProfile]);

  // Normalise ML trigger betas into per-allergen weights for the peak hours card.
  // Only active when Pro + the advanced model has converged (≥14 days of logs).
  const triggerWeights = useMemo(() => {
    if (!effectiveIsPro || !profileData?.advancedProfile) return undefined;
    const relevant = profileData.advancedProfile.triggers
      .filter((t) => t.partialBeta > 0 && activeAllergens.includes(TRIGGER_KEY_MAP[t.key]))
      .map((t) => ({ allergen: TRIGGER_KEY_MAP[t.key], beta: t.partialBeta }));
    if (relevant.length === 0) return undefined;
    const total = relevant.reduce((sum, t) => sum + t.beta, 0);
    return Object.fromEntries(relevant.map((t) => [t.allergen, t.beta / total]));
  }, [effectiveIsPro, profileData?.advancedProfile, activeAllergens]);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);

  async function handleChangeLocationPress() {
    if (!effectiveIsPro) {
      setAdPlaying(true);
      // TODO: swap the line below for your real rewarded-ad call, e.g.:
      //   await AdMob.showRewardedAd({ adUnitId: AD_UNIT_ID });
      // The ad plays full-screen automatically — no user confirmation needed.
      // The location picker opens as soon as it finishes.
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      setAdPlaying(false);
    }
    setShowLocationPicker(true);
  }
  const loading = pollenLoading || forecastLoading;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={5} className="py-4">
          {/* Greeting */}
          <View>
            {/* Location chip — own row at top */}
            <TouchableOpacity
              onPress={handleChangeLocationPress}
              activeOpacity={0.8}
              disabled={adPlaying}
              style={{ alignSelf: 'flex-start' }}
              className="flex-row items-center gap-1.5 bg-neutral-800 rounded-full px-3 py-1.5 mb-3"
            >
              {adPlaying ? (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginHorizontal: 4 }} />
              ) : (
                <>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ef4444' }} />
                  <Text
                    className="text-xs font-medium text-neutral-200"
                    numberOfLines={1}
                    style={{ maxWidth: 160 }}
                  >
                    {locationLabel ?? 'My location'}
                  </Text>
                  <Text className="text-xs text-neutral-500">▾</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              Hello, {user?.name ?? 'there'} 👋
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
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
            <RiskBanner
              level={riskToday.level}
              personalised={weights.personalised}
              isPro={effectiveIsPro}
              allergenSource={allergenSource}
              activeAllergens={activeAllergens}
              daysNeeded={
                effectiveIsPro && allergenSource === 'model' && !weights.personalised && profileData
                  ? profileData.daysNeeded - profileData.daysWithData
                  : undefined
              }
              topTrigger={
                effectiveIsPro && allergenSource === 'model' && weights.personalised && profileData
                  ? profileData.advancedReady && profileData.advancedProfile?.primaryTrigger
                    ? {
                        key: profileData.advancedProfile.primaryTrigger.key,
                        label: profileData.advancedProfile.primaryTrigger.label,
                        category: 'pollen' as const,
                        correlation: profileData.advancedProfile.primaryTrigger.pearsonR,
                        dataPoints: profileData.advancedProfile.dataPoints,
                      }
                    : profileData.correlations.find((r) => r.category === 'pollen')
                  : undefined
              }
              topAggravator={
                effectiveIsPro && allergenSource === 'model' && weights.personalised &&
                profileData?.advancedProfile?.topAggravator?.isSignificant
                  ? {
                      label: profileData.advancedProfile.topAggravator!.label,
                      residualCorrelation: profileData.advancedProfile.topAggravator!.residualCorrelation,
                    }
                  : undefined
              }
              onProfilePress={() => navigation.navigate('AllergyProfile')}
              onChangeAllergensPress={() =>
                navigation.getParent()?.navigate('Settings', { screen: 'AllergenProfile' })
              }
            />
          )}

          {/* Today's pollen breakdown */}
          {todayPollen && (
            <>
              <Text className="font-bold tracking-widest text-neutral-400 dark:text-neutral-300 uppercase px-0.5" style={{ fontSize: 13 }}>
                Today's Pollen
              </Text>
              <PollenSummary
                today={todayPollen}
                limitedCoverage={limitedCoverage}
                allergenProfile={activeAllergens}
                isPro={effectiveIsPro}
                onUpgradePress={() => showPaywall('Air quality details')}
                todayHourly={todayHourly}
                locationLabel={locationLabel ?? undefined}
              />
            </>
          )}

          {/* 5-day forecast strip — days after tomorrow are Pro-only */}
          {upcoming.length > 0 && (
            <>
              <Text className="font-bold tracking-widest text-neutral-400 dark:text-neutral-300 uppercase px-0.5" style={{ fontSize: 13 }}>
                Coming Up
              </Text>
              <ForecastStrip
                upcoming={upcoming}
                isPro={effectiveIsPro}
                onUpgradePress={() => showPaywall('Extended forecast')}
                weights={weights}
                riskToday={riskToday}
                locationLabel={locationLabel ?? undefined}
                weatherForecast={weatherForecast}
              />
            </>
          )}

          {/* Peak pollen hours — Pro feature using already-fetched hourly data */}
          <>
            <Text className="font-bold tracking-widest text-neutral-400 dark:text-neutral-300 uppercase px-0.5" style={{ fontSize: 13 }}>
              Peak Pollen Hours
            </Text>
            <PeakHoursCard
              todayHourly={todayHourly}
              isPro={effectiveIsPro}
              onUpgradePress={() => showPaywall('Peak pollen hours')}
              activeAllergens={activeAllergens}
              triggerWeights={triggerWeights}
            />
          </>

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

      {/* Floating Pro unlock pill — mirrors the map screen button, free users only */}
      {!effectiveIsPro && (
        <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => showPaywall('SmartAllergies Pro')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 13, marginRight: 6 }}>🔒</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
              Unlock Pro features
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DEV: free/pro toggle */}
      {__DEV__ && (
        <TouchableOpacity
          onPress={() =>
            setDevProOverride(
              devProOverride === true ? false : devProOverride === false ? null : true,
            )
          }
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: effectiveIsPro ? '#6d28d9' : '#6b7280',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
            elevation: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
            {devProOverride === null
              ? `${effectiveIsPro ? 'PRO' : 'FREE'} (real)`
              : effectiveIsPro
              ? 'PRO (dev)'
              : 'FREE (dev)'}
          </Text>
        </TouchableOpacity>
      )}

      <ChangeLocationSheet
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />
      <PaywallSheet {...paywallProps} />
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
