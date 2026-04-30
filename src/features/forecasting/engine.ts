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
import type { CorrelationResult, AdvancedAllergyProfile } from '@/features/insights/types';
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

// Maps the API's pre-computed worst-of-three pollen level directly to a risk
// level. Used for unweighted users so a single elevated category isn't diluted.
export function classifyRiskFromOverall(level: PollenLevel): RiskLevel {
  if (level === 'none' || level === 'low') return 'low';
  if (level === 'medium') return 'medium';
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

// ─── Build weights from manual allergen profile (free users) ─────────────────

/**
 * Converts the user's manually selected allergens into scoring weights.
 * Selected allergens share equal weight; unselected get 0.
 * Falls back to generic equal weights when all or none are selected.
 */
export function allergenProfileToWeights(profile: string[]): CorrelationWeights {
  const hasTree = profile.includes('tree');
  const hasGrass = profile.includes('grass');
  const hasWeed = profile.includes('weed');
  const count = [hasTree, hasGrass, hasWeed].filter(Boolean).length;

  if (count === 0 || count === 3) {
    return { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false };
  }

  const w = 1 / count;
  return {
    tree: hasTree ? w : 0,
    grass: hasGrass ? w : 0,
    weed: hasWeed ? w : 0,
    personalised: true,
  };
}

/**
 * Converts computed correlation weights back into an allergen profile string[].
 * Allergens with weight > 0.15 are included. Used to auto-populate the profile
 * for Pro users once the correlation engine has enough data.
 */
export function weightsToAllergenProfile(weights: CorrelationWeights): string[] {
  if (!weights.personalised) return ['tree', 'grass', 'weed'];
  const profile: string[] = [];
  if (weights.tree > 0.15) profile.push('tree');
  if (weights.grass > 0.15) profile.push('grass');
  if (weights.weed > 0.15) profile.push('weed');
  return profile.length > 0 ? profile : ['tree', 'grass', 'weed'];
}

// ─── Build weights from allergy profile correlations (Pro, accurate path) ────

export function correlationsToWeights(correlations: CorrelationResult[]): CorrelationWeights {
  const get = (key: string) =>
    Math.max(0, correlations.find((r) => r.key === key)?.correlation ?? 0);

  const rawGrass = get('grassPollen');
  const rawTree = get('treePollen');
  const rawWeed = get('weedPollen');

  const total = rawGrass + rawTree + rawWeed;
  if (total === 0) return { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false };

  return {
    tree: rawTree / total,
    grass: rawGrass / total,
    weed: rawWeed / total,
    personalised: true,
  };
}

export function advancedProfileToWeights(profile: AdvancedAllergyProfile): CorrelationWeights {
  const get = (key: string) => {
    const t = profile.triggers.find((r) => r.key === key);
    return Math.max(0, t?.partialBeta ?? 0);
  };

  const rawGrass = get('grassPollen');
  const rawTree = get('treePollen');
  const rawWeed = get('weedPollen');

  const total = rawGrass + rawTree + rawWeed;
  if (total === 0) return { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false };

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
  if (!weights.personalised) {
    // Generic path: use the API's worst-of-three level directly so a single
    // elevated category (e.g. medium tree) isn't diluted by two low/none values.
    const level = classifyRiskFromOverall(forecast.overallLevel);
    return { date: forecast.date, score: LEVEL_SCORES[forecast.overallLevel], level };
  }

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
