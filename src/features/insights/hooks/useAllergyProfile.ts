import { useQuery } from '@tanstack/react-query';
import { getCorrelationData } from '@/services/database';
import { computeCorrelations, MIN_DAYS_FOR_RESULTS, type CorrelationResult } from '../correlationEngine';

export interface AllergyProfileData {
  correlations: CorrelationResult[];
  daysWithData: number;
  daysNeeded: number;
  ready: boolean;
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
      return {
        correlations,
        daysWithData,
        daysNeeded: MIN_DAYS_FOR_RESULTS,
        ready,
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
