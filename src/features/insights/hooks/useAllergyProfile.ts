import { useQuery } from '@tanstack/react-query';
import { getCorrelationData } from '@/services/database';
import { computeCorrelations, MIN_DAYS_FOR_RESULTS } from '../correlationEngine';
import { computeAdvancedProfile, MIN_DAYS_FOR_ADVANCED } from '../advancedEngine';
import type { CorrelationResult, AdvancedAllergyProfile } from '../types';

export interface AllergyProfileData {
  // Phase 1
  correlations: CorrelationResult[];
  daysWithData: number;
  daysNeeded: number;
  ready: boolean;

  // Phase 2
  advancedProfile: AdvancedAllergyProfile | null;
  advancedReady: boolean;
  advancedDaysNeeded: number;
  phase: 1 | 2;
}

export function useAllergyProfile(): {
  data: AllergyProfileData | null;
  loading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: ['allergy-profile'],
    queryFn: async (): Promise<AllergyProfileData> => {
      const rows = await getCorrelationData();
      const daysWithData = rows.length;
      const ready = daysWithData >= MIN_DAYS_FOR_RESULTS;
      const correlations = ready ? computeCorrelations(rows) : [];

      let advancedProfile: AdvancedAllergyProfile | null = null;
      let advancedReady = false;

      if (daysWithData >= MIN_DAYS_FOR_ADVANCED) {
        advancedProfile = computeAdvancedProfile(rows);
        advancedReady = advancedProfile.rSquared >= 0.15;
      }

      return {
        correlations,
        daysWithData,
        daysNeeded: MIN_DAYS_FOR_RESULTS,
        ready,
        advancedProfile,
        advancedReady,
        advancedDaysNeeded: MIN_DAYS_FOR_ADVANCED,
        phase: advancedReady ? 2 : 1,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
