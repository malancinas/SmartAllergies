import { useQuery } from '@tanstack/react-query';
import { fetchAggregate } from '../api';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import type { CommunityAggregate } from '../types';

interface UseCommunitySignalResult {
  aggregate: CommunityAggregate | null;
  loading: boolean;
  error: Error | null;
}

export function useCommunitySignal(
  lat: number | null,
  lon: number | null,
): UseCommunitySignalResult {
  const enabled = lat !== null && lon !== null;

  const query = useQuery({
    queryKey: ['community-signal', lat?.toFixed(1), lon?.toFixed(1)],
    queryFn: () => fetchAggregate(lat!, lon!),
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });

  return {
    aggregate: query.data ?? null,
    loading: query.isFetching,
    error: query.error as Error | null,
  };
}
