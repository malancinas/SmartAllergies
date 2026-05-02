import { useMemo, useEffect } from 'react';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useSymptomHistory } from '@/features/symptoms/hooks/useSymptomHistory';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { useAllergyProfile } from '@/features/insights/hooks/useAllergyProfile';
import { rescheduleAlertSchedules } from '@/services/notifications';
import {
  allergenProfileToWeights,
  buildCorrelationWeights,
  computeRiskScore,
  correlationsToWeights,
  advancedProfileToWeights,
} from '../engine';
import type { AllergyForecast, CorrelationWeights } from '../types';

export function useForecast(): AllergyForecast & { loading: boolean; error: Error | null } {
  const { forecast, loading: pollenLoading, error: pollenError } = useCurrentPollen();
  const { data: logs, isLoading: logsLoading } = useSymptomHistory(60);
  const {
    alertSchedules,
    notificationsEnabled,
    allergenProfile,
    allergenSource,
  } = useSettingsStore();
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = tier === 'pro';

  const { data: profileData, loading: profileLoading } = useAllergyProfile();

  const result = useMemo<AllergyForecast>(() => {
    if (forecast.length === 0 || !logs) {
      return { today: null, upcoming: [], weights: allergenProfileToWeights(allergenProfile) };
    }

    let weights: CorrelationWeights;

    if (isPro && allergenSource === 'model') {
      if (profileData?.advancedReady && profileData.advancedProfile) {
        weights = advancedProfileToWeights(profileData.advancedProfile);
      } else if (profileData?.ready) {
        weights = correlationsToWeights(profileData.correlations);
      } else {
        weights = buildCorrelationWeights(logs, forecast);
      }
    } else {
      weights = allergenProfileToWeights(allergenProfile);
    }

    const n = new Date();
    const p = (v: number) => String(v).padStart(2, '0');
    const todayStr = `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
    const todayForecast = forecast.find((d) => d.date === todayStr);
    const upcomingForecasts = forecast.filter((d) => d.date > todayStr);

    return {
      today: todayForecast
        ? {
            ...computeRiskScore(todayForecast, weights),
            pollenLevels: {
              tree: todayForecast.tree.level,
              grass: todayForecast.grass.level,
              weed: todayForecast.weed.level,
            },
          }
        : null,
      upcoming: upcomingForecasts.map((d) => ({
        ...computeRiskScore(d, weights),
        pollenLevels: { tree: d.tree.level, grass: d.grass.level, weed: d.weed.level },
        rawValues: { tree: d.tree.rawValue, grass: d.grass.rawValue, weed: d.weed.rawValue },
        species: d.species,
        airQuality: d.airQuality,
      })),
      weights,
    };
  }, [forecast, logs, isPro, allergenSource, profileData, allergenProfile]);

  useEffect(() => {
    // Personalised notification content only when the user has opted into the ML model
    const allergyProfileSummary = (isPro && allergenSource === 'model' && profileData?.ready)
      ? {
          phase: profileData.phase,
          primaryTrigger:
            profileData.advancedProfile?.primaryTrigger?.label ??
            profileData.correlations[0]?.label,
          topAggravator:
            profileData.advancedProfile?.topAggravator?.isSignificant
              ? profileData.advancedProfile.topAggravator.label
              : undefined,
        }
      : undefined;

    rescheduleAlertSchedules({
      schedules: alertSchedules,
      notificationsEnabled,
      todayData: result.today,
      tomorrowData: result.upcoming[0] ?? null,
      isPro,
      allergyProfile: allergyProfileSummary,
    }).catch(() => {});
  }, [result.today, result.upcoming, alertSchedules, notificationsEnabled, isPro, allergenSource, profileData]);

  return {
    ...result,
    loading: pollenLoading || logsLoading || (isPro && profileLoading),
    error: pollenError,
  };
}
