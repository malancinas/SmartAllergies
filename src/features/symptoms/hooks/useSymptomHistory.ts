import { useQuery } from '@tanstack/react-query';
import { getSymptomLogs } from '@/services/database';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { FREE_LIMITS } from '@/features/subscription/types';
import type { SymptomLog } from '../types';

function rowToSymptomLog(row: {
  id: string;
  logged_at: string;
  created_at: string;
  severity: number;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  medications: string | null;
  symptoms: string[];
}): SymptomLog {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    createdAt: row.created_at,
    severity: row.severity,
    symptoms: row.symptoms as SymptomLog['symptoms'],
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    medications: row.medications,
  };
}

export function useSymptomHistory(days: number = 30) {
  const tier = useSubscriptionStore((s) => s.tier);
  const effectiveDays = tier === 'free' ? Math.min(days, FREE_LIMITS.HISTORY_DAYS) : days;

  return useQuery({
    queryKey: ['symptom-history', effectiveDays],
    queryFn: async () => {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - effectiveDays * 24 * 60 * 60 * 1000).toISOString();
      const rows = await getSymptomLogs(from, to);
      return rows.map(rowToSymptomLog);
    },
    staleTime: 0,
  });
}
