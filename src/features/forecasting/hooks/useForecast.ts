import { useMemo, useEffect } from 'react';
import { useCurrentPollen } from '@/features/pollen/hooks/useCurrentPollen';
import { useSymptomHistory } from '@/features/symptoms/hooks/useSymptomHistory';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { rescheduleIfNeeded } from '@/services/notifications';
import { buildCorrelationWeights, computeRiskScore } from '../engine';
import type { AllergyForecast } from '../types';

export function useForecast(): AllergyForecast & { loading: boolean; error: Error | null } {
  const { forecast, loading: pollenLoading, error: pollenError } = useCurrentPollen();
  const { data: logs, isLoading: logsLoading } = useSymptomHistory(60);
  const { allergyAlertEnabled, alertThreshold, alertHour } = useSettingsStore();

  const result = useMemo<AllergyForecast>(() => {
    if (forecast.length === 0 || !logs) {
      return {
        today: null,
        upcoming: [],
        weights: { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false },
      };
    }

    // Use all forecast days as proxy for "history" when we don't have
    // actual historical pollen data. In production you'd also call the
    // Open-Meteo historical API for the past 60 days.
    const weights = buildCorrelationWeights(logs, forecast);

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
  }, [forecast, logs]);

  // Re-schedule the morning alert whenever the forecast or user settings change
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
    loading: pollenLoading || logsLoading,
    error: pollenError,
  };
}
