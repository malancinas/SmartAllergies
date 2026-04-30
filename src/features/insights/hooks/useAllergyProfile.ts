import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCorrelationData } from '@/services/database';
import { computeCorrelations, MIN_DAYS_FOR_RESULTS } from '../correlationEngine';
import { computeAdvancedProfile, MIN_DAYS_FOR_ADVANCED } from '../advancedEngine';
import { useAllergyProfileStore } from '@/stores/persistent/allergyProfileStore';
import type { CorrelationResult, AdvancedAllergyProfile } from '../types';

export interface AllergyProfileData {
  // Phase 1
  correlations: CorrelationResult[];
  daysWithData: number;
  daysNeeded: number;
  ready: boolean;

  // Phase 2 — resolved profile (may be the persisted committed profile if latest regressed)
  advancedProfile: AdvancedAllergyProfile | null;
  advancedReady: boolean;
  advancedDaysNeeded: number;
  phase: 1 | 2;

  // Current model quality even before advancedReady, used for the progress bar
  currentRSquared: number;
}

export function useAllergyProfile(): {
  data: AllergyProfileData | null;
  loading: boolean;
  error: Error | null;
} {
  const { committedProfile, setCommittedProfile } = useAllergyProfileStore();

  const query = useQuery({
    queryKey: ['allergy-profile'],
    queryFn: async (): Promise<{
      correlations: CorrelationResult[];
      daysWithData: number;
      ready: boolean;
      freshAdvancedProfile: AdvancedAllergyProfile | null;
      currentRSquared: number;
    }> => {
      const rows = await getCorrelationData();
      const daysWithData = rows.length;
      const ready = daysWithData >= MIN_DAYS_FOR_RESULTS;
      const correlations = ready ? computeCorrelations(rows) : [];

      let freshAdvancedProfile: AdvancedAllergyProfile | null = null;
      if (daysWithData >= MIN_DAYS_FOR_ADVANCED) {
        freshAdvancedProfile = computeAdvancedProfile(rows);
      }

      return {
        correlations,
        daysWithData,
        ready,
        freshAdvancedProfile,
        currentRSquared: freshAdvancedProfile?.rSquared ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Commit the profile when the fresh computation clears the quality bar
  useEffect(() => {
    const fresh = query.data?.freshAdvancedProfile;
    if (fresh && fresh.rSquared >= 0.15) {
      setCommittedProfile(fresh);
    }
  }, [query.data?.freshAdvancedProfile, setCommittedProfile]);

  if (!query.data) {
    return {
      data: null,
      loading: query.isLoading,
      error: (query.error as Error | null) ?? null,
    };
  }

  const { correlations, daysWithData, ready, freshAdvancedProfile, currentRSquared } = query.data;

  // Use fresh profile if it meets the bar; fall back to committed if it doesn't
  const resolvedProfile =
    freshAdvancedProfile && freshAdvancedProfile.rSquared >= 0.15
      ? freshAdvancedProfile
      : committedProfile;

  const advancedReady = resolvedProfile !== null;

  return {
    data: {
      correlations,
      daysWithData,
      daysNeeded: MIN_DAYS_FOR_RESULTS,
      ready,
      advancedProfile: resolvedProfile,
      advancedReady,
      advancedDaysNeeded: MIN_DAYS_FOR_ADVANCED,
      phase: advancedReady ? 2 : 1,
      currentRSquared,
    },
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
