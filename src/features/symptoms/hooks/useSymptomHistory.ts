import { useQuery } from '@tanstack/react-query';
import { getSymptomLogs } from '@/services/database';
import type { SymptomLog } from '../types';

function rowToSymptomLog(row: {
  id: string;
  logged_at: string;
  severity: number;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  symptoms: string[];
}): SymptomLog {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    severity: row.severity,
    symptoms: row.symptoms as SymptomLog['symptoms'],
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
  };
}

export function useSymptomHistory(days: number = 30) {
  return useQuery({
    queryKey: ['symptom-history', days],
    queryFn: async () => {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const rows = await getSymptomLogs(from, to);
      return rows.map(rowToSymptomLog);
    },
    staleTime: 0, // always re-read after invalidation
  });
}
