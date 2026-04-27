import { useMemo, useEffect } from 'react';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useSymptomHistory } from '@/features/symptoms/hooks/useSymptomHistory';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { useAllergyProfile } from '@/features/insights/hooks/useAllergyProfile';
import { rescheduleIfNeeded } from '@/services/notifications';
import { buildCorrelationWeights, computeRiskScore, correlationsToWeights } from '../engine';
import type { AllergyForecast, CorrelationWeights } from '../types';

const GENERIC_WEIGHTS: CorrelationWeights = {
  tree: 0.33,
  grass: 0.33,
  weed: 0.33,
  personalised: false,
};

export function useForecast(): AllergyForecast & { loading: boolean; error: Error | null } {
  const { forecast, loading: pollenLoading, error: pollenError } = useCurrentPollen();
  const { data: logs, isLoading: logsLoading } = useSymptomHistory(60);
  const { allergyAlertEnabled, alertThreshold, alertHour } = useSettingsStore();
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = tier === 'pro';

  // Pro path: use accurate environment-backed correlations from log_environment table
  const { data: profileData, loading: profileLoading } = useAllergyProfile();

  const result = useMemo<AllergyForecast>(() => {
    if (forecast.length === 0 || !logs) {
      return { today: null, upcoming: [], weights: GENERIC_WEIGHTS };
    }

    let weights: CorrelationWeights;

    if (isPro && profileData?.ready) {
      // Accurate path: correlations computed from real historical env snapshots
      weights = correlationsToWeights(profileData.correlations);
    } else if (!isPro) {
      // Free users: always generic, no personalisation
      weights = GENERIC_WEIGHTS;
    } else {
      // Pro but still building profile (< 7 days): fall back to proxy approach
      weights = buildCorrelationWeights(logs, forecast);
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
  }, [forecast, logs, isPro, profileData]);

  useEffect(() => {
    if (result.today) {
      rescheduleIfNeeded({
        riskLevel: result.today.level,
        threshold: alertThreshold,
        alertEnabled: allergyAlertEnabled,
        hour: alertHour,
      }).catch(() => {});
    }
  }, [result.today, allergyAlertEnabled, alertThreshold, alertHour]);

  return {
    ...result,
    loading: pollenLoading || logsLoading || (isPro && profileLoading),
    error: pollenError,
  };
}
