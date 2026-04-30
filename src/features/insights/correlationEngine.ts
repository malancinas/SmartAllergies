import type { CorrelationDataRow } from '@/services/database';
import type { CorrelationResult } from './types';
export type { CorrelationResult } from './types';

type FactorKey = keyof Omit<CorrelationDataRow, 'date' | 'maxSeverity'>;

const FACTORS: Array<{ key: FactorKey; label: string; category: 'pollen' | 'air_quality' }> = [
  { key: 'grassPollen', label: 'Grass pollen', category: 'pollen' },
  { key: 'treePollen', label: 'Tree pollen', category: 'pollen' },
  { key: 'weedPollen', label: 'Weed pollen', category: 'pollen' },
  { key: 'pm25', label: 'PM2.5 (fine particles)', category: 'air_quality' },
  { key: 'pm10', label: 'PM10 (coarse particles)', category: 'air_quality' },
  { key: 'ozone', label: 'Ozone', category: 'air_quality' },
  { key: 'no2', label: 'Nitrogen dioxide', category: 'air_quality' },
  { key: 'so2', label: 'Sulphur dioxide', category: 'air_quality' },
  { key: 'dust', label: 'Dust', category: 'air_quality' },
];

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const denX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0));
  const denY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0));
  if (denX === 0 || denY === 0) return 0;
  return num / (denX * denY);
}

export const MIN_DAYS_FOR_RESULTS = 7;

export function computeCorrelations(rows: CorrelationDataRow[]): CorrelationResult[] {
  if (rows.length < MIN_DAYS_FOR_RESULTS) return [];

  return FACTORS.map(({ key, label, category }) => {
    const paired = rows
      .map((r) => ({ env: r[key] as number | null, sev: r.maxSeverity }))
      .filter((p): p is { env: number; sev: number } => p.env !== null);

    if (paired.length < MIN_DAYS_FOR_RESULTS) {
      return { key, label, category, correlation: 0, dataPoints: paired.length };
    }

    return {
      key,
      label,
      category,
      correlation: pearson(
        paired.map((p) => p.env),
        paired.map((p) => p.sev),
      ),
      dataPoints: paired.length,
    };
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

export function correlationStrength(r: number): { label: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.7) return { label: 'Strong', color: '#ef4444' };
  if (abs >= 0.4) return { label: 'Moderate', color: '#f97316' };
  if (abs >= 0.2) return { label: 'Weak', color: '#eab308' };
  return { label: 'Little to none', color: '#94a3b8' };
}
