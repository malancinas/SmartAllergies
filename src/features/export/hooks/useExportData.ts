import { useQuery } from '@tanstack/react-query';
import { getSymptomLogs, getPollenCache } from '@/services/database';
import type { ExportSymptomLog, ExportSummary } from '../pdfTemplate';
import type { SymptomType } from '@/features/symptoms/types';

interface UseExportDataResult {
  exportLogs: ExportSymptomLog[];
  summary: ExportSummary;
  isLoading: boolean;
  error: Error | null;
}

function buildSummary(
  logs: ExportSymptomLog[],
  fromDate: string,
  toDate: string,
): ExportSummary {
  if (logs.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      fromDate,
      toDate,
      totalLogs: 0,
      worstDays: [],
      mostCommonSymptoms: [],
    };
  }

  // Worst days: group by date, take top 3 by max severity
  const dayMap = new Map<string, number>();
  for (const log of logs) {
    const date = log.loggedAt.slice(0, 10);
    dayMap.set(date, Math.max(dayMap.get(date) ?? 0, log.severity));
  }
  const worstDays = Array.from(dayMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([date, maxSeverity]) => ({ date, maxSeverity }));

  // Most common symptoms
  const symptomCount = new Map<SymptomType, number>();
  for (const log of logs) {
    for (const s of log.symptoms) {
      symptomCount.set(s, (symptomCount.get(s) ?? 0) + 1);
    }
  }
  const mostCommonSymptoms = Array.from(symptomCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  return {
    generatedAt: new Date().toISOString(),
    fromDate,
    toDate,
    totalLogs: logs.length,
    worstDays,
    mostCommonSymptoms,
  };
}

async function fetchExportData(days: number): Promise<{ logs: ExportSymptomLog[]; summary: ExportSummary }> {
  const toDate = new Date().toISOString();
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const rows = await getSymptomLogs(fromDate, toDate);

  // For each log, try to find a matching pollen cache entry
  const exportLogs: ExportSymptomLog[] = await Promise.all(
    rows.map(async (row) => {
      const datePrefix = row.logged_at.slice(0, 10);
      const latKey = row.latitude != null ? Number(row.latitude).toFixed(2) : null;
      const lonKey = row.longitude != null ? Number(row.longitude).toFixed(2) : null;

      let pollenLevel: ExportSymptomLog['pollenLevel'];
      if (latKey && lonKey) {
        const hourKey = row.logged_at.slice(0, 13);
        const cached = await getPollenCache<{ daily: Array<{ date: string; overallLevel: string }> }>(
          `pollen_${latKey}_${lonKey}_${hourKey.slice(0, 13)}`,
        );
        const dayEntry = cached?.daily?.find((d) => d.date === datePrefix);
        pollenLevel = dayEntry?.overallLevel as ExportSymptomLog['pollenLevel'];
      }

      return {
        id: row.id,
        loggedAt: row.logged_at,
        severity: row.severity,
        symptoms: row.symptoms as SymptomType[],
        latitude: row.latitude,
        longitude: row.longitude,
        notes: row.notes,
        medications: row.medications,
        pollenLevel,
      };
    }),
  );

  const summary = buildSummary(exportLogs, fromDate.slice(0, 10), toDate.slice(0, 10));
  return { logs: exportLogs, summary };
}

export function useExportData(days: number): UseExportDataResult {
  const query = useQuery({
    queryKey: ['export-data', days],
    queryFn: () => fetchExportData(days),
    staleTime: 5 * 60 * 1000,
  });

  return {
    exportLogs: query.data?.logs ?? [],
    summary: query.data?.summary ?? {
      generatedAt: new Date().toISOString(),
      fromDate: '',
      toDate: '',
      totalLogs: 0,
      worstDays: [],
      mostCommonSymptoms: [],
    },
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
