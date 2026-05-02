import { useQuery } from '@tanstack/react-query';
import { getSymptomLogsForExport } from '@/services/database';
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

  const dayMap = new Map<string, number>();
  for (const log of logs) {
    const date = log.loggedAt.slice(0, 10);
    dayMap.set(date, Math.max(dayMap.get(date) ?? 0, log.severity));
  }
  const worstDays = Array.from(dayMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([date, maxSeverity]) => ({ date, maxSeverity }));

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

  const rows = await getSymptomLogsForExport(fromDate, toDate);

  const exportLogs: ExportSymptomLog[] = rows.map((row) => ({
    id: row.id,
    loggedAt: row.logged_at,
    severity: row.severity,
    symptoms: row.symptoms as SymptomType[],
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    medications: row.medications,
    grassPollen: row.grass_pollen,
    treePollen: row.tree_pollen,
    weedPollen: row.weed_pollen,
    alderPollen: row.alder_pollen,
    birchPollen: row.birch_pollen,
    olivePollen: row.olive_pollen,
    mugwortPollen: row.mugwort_pollen,
    ragweedPollen: row.ragweed_pollen,
    pm25: row.pm25,
    pm10: row.pm10,
    ozone: row.ozone,
    no2: row.no2,
    so2: row.so2,
    uvIndex: row.uv_index,
    dust: row.dust,
    temperature: row.temperature,
    humidity: row.humidity,
    windSpeed: row.wind_speed,
    precipitationProbability: row.precipitation_probability,
  }));

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
