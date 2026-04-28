import { useMemo, useEffect, useRef } from 'react';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useSymptomHistory } from '@/features/symptoms/hooks/useSymptomHistory';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { useAllergyProfile } from '@/features/insights/hooks/useAllergyProfile';
import { rescheduleIfNeeded } from '@/services/notifications';
import {
  allergenProfileToWeights,
  buildCorrelationWeights,
  computeRiskScore,
  correlationsToWeights,
  weightsToAllergenProfile,
} from '../engine';
import type { AllergyForecast, CorrelationWeights } from '../types';

export function useForecast(): AllergyForecast & { loading: boolean; error: Error | null } {
  const { forecast, loading: pollenLoading, error: pollenError } = useCurrentPollen();
  const { data: logs, isLoading: logsLoading } = useSymptomHistory(60);
  const {
    alertThreshold,
    morningAlertEnabled,
    morningAlertHour,
    eveningAlertEnabled,
    eveningAlertHour,
    alertDays,
    allergenProfile,
    setAllergenProfile,
    setAllergenProfileLastAutoUpdated,
  } = useSettingsStore();
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = tier === 'pro';

  const { data: profileData, loading: profileLoading } = useAllergyProfile();

  const result = useMemo<AllergyForecast>(() => {
    if (forecast.length === 0 || !logs) {
      return { today: null, upcoming: [], weights: allergenProfileToWeights(allergenProfile) };
    }

    let weights: CorrelationWeights;

    if (isPro && profileData?.ready) {
      weights = correlationsToWeights(profileData.correlations);
    } else if (isPro) {
      // Pro but still building profile: proxy approach
      weights = buildCorrelationWeights(logs, forecast);
    } else {
      // Free: weight by manually selected allergens
      weights = allergenProfileToWeights(allergenProfile);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayForecast = forecast.find((d) => d.date === todayStr);
    const upcomingForecasts = forecast.filter((d) => d.date > todayStr);

    return {
      today: todayForecast ? computeRiskScore(todayForecast, weights) : null,
      upcoming: upcomingForecasts.map((d) => ({
        ...computeRiskScore(d, weights),
        pollenLevels: { tree: d.tree.level, grass: d.grass.level, weed: d.weed.level },
        rawValues: { tree: d.tree.rawValue, grass: d.grass.rawValue, weed: d.weed.rawValue },
        species: d.species,
        airQuality: d.airQuality,
      })),
      weights,
    };
  }, [forecast, logs, isPro, profileData, allergenProfile]);

  // Auto-write allergenProfile for Pro users once correlations are ready.
  // Uses a ref to avoid re-running on every render when correlations haven't changed.
  const lastSyncedCorrelations = useRef<string | null>(null);
  useEffect(() => {
    if (!isPro || !profileData?.ready) return;
    const correlationKey = profileData.correlations.map((c) => `${c.key}:${c.correlation.toFixed(3)}`).join(',');
    if (lastSyncedCorrelations.current === correlationKey) return;
    lastSyncedCorrelations.current = correlationKey;

    const learnedWeights = correlationsToWeights(profileData.correlations);
    const learnedProfile = weightsToAllergenProfile(learnedWeights);
    setAllergenProfile(learnedProfile);
    setAllergenProfileLastAutoUpdated(new Date().toISOString().slice(0, 10));
  }, [isPro, profileData?.ready, profileData?.correlations]);

  useEffect(() => {
    if (result.today) {
      rescheduleIfNeeded({
        todayRiskLevel: result.today.level,
        tomorrowRiskLevel: result.upcoming[0]?.level ?? null,
        threshold: alertThreshold,
        morningAlertEnabled,
        morningAlertHour,
        eveningAlertEnabled,
        eveningAlertHour,
        alertDays,
      }).catch(() => {});
    }
  }, [result.today, result.upcoming, alertThreshold, morningAlertEnabled, morningAlertHour, eveningAlertEnabled, eveningAlertHour, alertDays]);

  return {
    ...result,
    loading: pollenLoading || logsLoading || (isPro && profileLoading),
    error: pollenError,
  };
}
