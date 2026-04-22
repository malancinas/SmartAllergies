/**
 * Correlation-based personal allergy risk engine.
 *
 * Phase 1 approach: Pearson correlation between a user's daily symptom
 * severity and each pollen type over their logged history. The resulting
 * weights drive a weighted-sum risk score for upcoming forecast days.
 *
 * When fewer than MIN_PAIRED_DAYS exist, we fall back to a generic
 * threshold-based classifier so new users still see a useful forecast.
 */

import type { DailyPollenForecast, PollenLevel } from '@/features/pollen/types';
import type { SymptomLog } from '@/features/symptoms/types';
import type { CorrelationWeights, DailyRiskScore, RiskLevel } from './types';

const MIN_PAIRED_DAYS = 7;

// ─── Pollen level → numeric (0–1) ────────────────────────────────────────────

const LEVEL_SCORES: Record<PollenLevel, number> = {
  none: 0,
  low: 0.2,
  medium: 0.5,
  high: 0.8,
  very_high: 1.0,
};

// ─── Risk classification ──────────────────────────────────────────────────────

export function classifyRisk(score: number): RiskLevel {
  if (score < 0.3) return 'low';
  if (score < 0.6) return 'medium';
  return 'high';
}

// ─── Pearson correlation (pure, unit-testable) ────────────────────────────────

export function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : num / denom;
}

// ─── Build weights from history ───────────────────────────────────────────────

export function buildCorrelationWeights(
  logs: SymptomLog[],
  pollenHistory: DailyPollenForecast[],
): CorrelationWeights {
  // Build a lookup from date → max severity logged that day
  const severityByDate = new Map<string, number>();
  for (const log of logs) {
    const date = log.loggedAt.slice(0, 10);
    const current = severityByDate.get(date) ?? 0;
    if (log.severity > current) severityByDate.set(date, log.severity);
  }

  // Pair each pollen history day with the user's severity on that day
  const pairs: { severity: number; tree: number; grass: number; weed: number }[] = [];
  for (const day of pollenHistory) {
    const severity = severityByDate.get(day.date);
    if (severity === undefined) continue;
    pairs.push({
      severity: severity / 10, // normalise to 0–1
      tree: LEVEL_SCORES[day.tree.level],
      grass: LEVEL_SCORES[day.grass.level],
      weed: LEVEL_SCORES[day.weed.level],
    });
  }

  if (pairs.length < MIN_PAIRED_DAYS) {
    // Fallback: equal weights (generic forecast, not personalised)
    return { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false };
  }

  const severities = pairs.map((p) => p.severity);
  const rawTree = Math.max(0, pearsonR(pairs.map((p) => p.tree), severities));
  const rawGrass = Math.max(0, pearsonR(pairs.map((p) => p.grass), severities));
  const rawWeed = Math.max(0, pearsonR(pairs.map((p) => p.weed), severities));

  // If all correlations are zero (e.g. outside coverage area) fall back to equal
  const total = rawTree + rawGrass + rawWeed;
  if (total === 0) {
    return { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false };
  }

  return {
    tree: rawTree / total,
    grass: rawGrass / total,
    weed: rawWeed / total,
    personalised: true,
  };
}

// ─── Compute risk score for a single forecast day ────────────────────────────

export function computeRiskScore(
  forecast: DailyPollenForecast,
  weights: CorrelationWeights,
): DailyRiskScore {
  const score =
    LEVEL_SCORES[forecast.tree.level] * weights.tree +
    LEVEL_SCORES[forecast.grass.level] * weights.grass +
    LEVEL_SCORES[forecast.weed.level] * weights.weed;

  return {
    date: forecast.date,
    score: Math.min(1, score),
    level: classifyRisk(score),
  };
}
