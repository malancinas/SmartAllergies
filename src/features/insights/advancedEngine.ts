import type { CorrelationDataRow } from '@/services/database';
import type { AdvancedAllergyProfile, AggravatorResult, MedicationEffect, TriggerResult } from './types';

export const MIN_DAYS_FOR_ADVANCED = 14;

// ─── Internal types ───────────────────────────────────────────────────────────

type PollenKey = 'grassPollen' | 'treePollen' | 'weedPollen';
type AQKey = 'pm25' | 'pm10' | 'ozone' | 'no2' | 'so2' | 'uvIndex' | 'dust';

const POLLEN_FACTORS: Array<{ key: PollenKey; label: string }> = [
  { key: 'grassPollen', label: 'Grass pollen' },
  { key: 'treePollen', label: 'Tree pollen' },
  { key: 'weedPollen', label: 'Weed pollen' },
];

const AQ_FACTORS: Array<{ key: AQKey; label: string }> = [
  { key: 'pm25', label: 'PM2.5 (fine particles)' },
  { key: 'pm10', label: 'PM10 (coarse particles)' },
  { key: 'ozone', label: 'Ozone' },
  { key: 'no2', label: 'Nitrogen dioxide' },
  { key: 'so2', label: 'Sulphur dioxide' },
  { key: 'uvIndex', label: 'UV index' },
  { key: 'dust', label: 'Dust' },
];

// ─── Math utilities ───────────────────────────────────────────────────────────

function pearsonR(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const dx = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
  const dy = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
  return dx === 0 || dy === 0 ? 0 : num / (dx * dy);
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[], m = mean(xs)): number {
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
}

function zScore(xs: number[]): { normalised: number[]; mean: number; std: number } {
  const m = mean(xs);
  const s = stddev(xs, m);
  return { normalised: s === 0 ? xs.map(() => 0) : xs.map((x) => (x - m) / s), mean: m, std: s };
}

/** 3×3 matrix determinant */
function det3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

/** 3×3 matrix inverse via Cramer's rule. Returns null if singular. */
function invert3(m: number[][]): number[][] | null {
  const d = det3(m);
  if (Math.abs(d) < 1e-10) return null;

  const cofactor = (r: number, c: number): number => {
    const rows = [0, 1, 2].filter((i) => i !== r);
    const cols = [0, 1, 2].filter((j) => j !== c);
    const sign = (r + c) % 2 === 0 ? 1 : -1;
    return sign * (m[rows[0]][cols[0]] * m[rows[1]][cols[1]] - m[rows[0]][cols[1]] * m[rows[1]][cols[0]]);
  };

  const adj = [0, 1, 2].map((r) => [0, 1, 2].map((c) => cofactor(c, r)));
  return adj.map((row) => row.map((v) => v / d));
}

function matMul3xN(A: number[][], B: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * B[j], 0));
}

// ─── OLS helpers ──────────────────────────────────────────────────────────────

/**
 * Solve OLS β for a 3-predictor model using Cramer's rule.
 * X: [n × 3] (already z-scored), y: [n] (already z-scored).
 * Returns { betas, stable } where stable=false means matrix was near-singular.
 */
function ols3(X: number[][], y: number[]): { betas: number[]; stable: boolean } {
  // XᵀX (3×3)
  const XtX: number[][] = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)),
  );
  // Xᵀy (3×1)
  const Xty: number[] = Array.from({ length: 3 }, (_, i) =>
    X.reduce((s, row, n) => s + row[i] * y[n], 0),
  );

  const inv = invert3(XtX);
  if (!inv) return { betas: [0, 0, 0], stable: false };

  return { betas: matMul3xN(inv, Xty), stable: true };
}

// ─── Main export ──────────────────────────────────────────────────────────────

// ─── Domain thresholds (grains/m³, clinical allergy guidelines) ───────────────

const POLLEN_DOMAIN_THRESHOLDS: Record<PollenKey, number> = {
  grassPollen: 30,
  treePollen: 30,
  weedPollen: 10,
};

const MIN_GROUP_DAYS = 3; // minimum days in each group to report medication effect

// ─── Medication effect analysis ───────────────────────────────────────────────
//
// POST-V1 NOTE: MedicationEffect is computed but not surfaced in the UI.
//
// Why deferred: the comparison requires ≥3 medicated AND ≥3 unmedicated days
// above the clinical pollen threshold (grass/tree ≥30, weed ≥10 grains/m³).
// Most users will always medicate on bad days or never log medication at all,
// so the card almost always shows a "log more unmedicated days" nudge — which
// is unhelpful advice for allergy sufferers. There is also a causality risk:
// users tend to medicate when they *expect* a bad day, so medicated days may
// appear worse in the data even when medication helps.
//
// To revisit: validate sample sizes across a real user cohort, add a
// propensity-score or lag-correction approach, and only surface the card when
// the reduction is statistically meaningful (e.g. t-test p < 0.05).

type LagPair = { pollen: number; severity: number; medicated: boolean };

function buildLagPairs(rows: CorrelationDataRow[], key: PollenKey, lag: 0 | 1): LagPair[] {
  if (lag === 0) {
    return rows
      .filter((r) => r[key] !== null)
      .map((r) => ({ pollen: r[key] as number, severity: r.maxSeverity, medicated: r.medicated }));
  }

  // lag 1: today's pollen → tomorrow's severity + tomorrow's medication status
  const pairs: LagPair[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    if (rows[i][key] === null) continue;
    const daysDiff =
      (new Date(rows[i + 1].date).getTime() - new Date(rows[i].date).getTime()) /
      86_400_000;
    if (daysDiff !== 1) continue;
    pairs.push({
      pollen: rows[i][key] as number,
      severity: rows[i + 1].maxSeverity,
      medicated: rows[i + 1].medicated,
    });
  }
  return pairs;
}

function analyseMedicationAtLag(
  pairs: LagPair[],
  threshold: number,
): { medDays: number; unmedDays: number; meanMed: number; meanUnmed: number } | null {
  const highPollen = pairs.filter((p) => p.pollen >= threshold);
  const med = highPollen.filter((p) => p.medicated);
  const unmed = highPollen.filter((p) => !p.medicated);

  if (med.length < MIN_GROUP_DAYS || unmed.length < MIN_GROUP_DAYS) return null;

  const meanMed = med.reduce((s, p) => s + p.severity, 0) / med.length;
  const meanUnmed = unmed.reduce((s, p) => s + p.severity, 0) / unmed.length;

  return { medDays: med.length, unmedDays: unmed.length, meanMed, meanUnmed };
}

export function computeMedicationEffect(
  rows: CorrelationDataRow[],
  primaryTriggerKey: PollenKey,
  primaryTriggerLabel: string,
): MedicationEffect {
  const threshold = POLLEN_DOMAIN_THRESHOLDS[primaryTriggerKey];

  const pairs0 = buildLagPairs(rows, primaryTriggerKey, 0);
  const pairs1 = buildLagPairs(rows, primaryTriggerKey, 1);

  const result0 = analyseMedicationAtLag(pairs0, threshold);
  const result1 = analyseMedicationAtLag(pairs1, threshold);

  // Pick the lag with the stronger medication signal (larger reduction)
  const reduction = (r: typeof result0) =>
    r ? Math.max(0, r.meanUnmed - r.meanMed) : -1;

  let chosen: typeof result0 = null;
  let lagDays: 0 | 1 = 0;

  if (reduction(result0) >= reduction(result1)) {
    chosen = result0;
    lagDays = 0;
  } else {
    chosen = result1;
    lagDays = 1;
  }

  if (!chosen) {
    // Check if there are any medicated high-pollen days at all to shape the nudge
    const highPollenDays0 = pairs0.filter((p) => p.pollen >= threshold);
    const unmedicatedCount = highPollenDays0.filter((p) => !p.medicated).length;
    const needed = MIN_GROUP_DAYS - unmedicatedCount;
    const nudge =
      needed > 0
        ? `Log ${needed} more unmedicated day${needed === 1 ? '' : 's'} during high ${primaryTriggerLabel.toLowerCase()} to see how well your medication works.`
        : `We need a few more unmedicated days during high ${primaryTriggerLabel.toLowerCase()} to measure how well your medication works.`;

    return {
      primaryTriggerKey,
      primaryTriggerLabel,
      pollenThreshold: threshold,
      lagDays,
      medicatedDays: 0,
      unmedicatedDays: unmedicatedCount,
      meanSeverityMedicated: 0,
      meanSeverityUnmedicated: 0,
      reductionPoints: 0,
      reductionPercent: 0,
      hasEnoughData: false,
      nudgeMessage: nudge,
    };
  }

  const reductionPoints = Math.max(0, chosen.meanUnmed - chosen.meanMed);
  const reductionPercent =
    chosen.meanUnmed > 0 ? Math.round((reductionPoints / chosen.meanUnmed) * 100) : 0;

  return {
    primaryTriggerKey,
    primaryTriggerLabel,
    pollenThreshold: threshold,
    lagDays,
    medicatedDays: chosen.medDays,
    unmedicatedDays: chosen.unmedDays,
    meanSeverityMedicated: Math.round(chosen.meanMed * 10) / 10,
    meanSeverityUnmedicated: Math.round(chosen.meanUnmed * 10) / 10,
    reductionPoints: Math.round(reductionPoints * 10) / 10,
    reductionPercent,
    hasEnoughData: true,
    nudgeMessage: null,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function computeAdvancedProfile(rows: CorrelationDataRow[]): AdvancedAllergyProfile {
  // Only use rows where all three pollen values are present
  const complete = rows.filter(
    (r) => r.grassPollen !== null && r.treePollen !== null && r.weedPollen !== null,
  ) as Array<CorrelationDataRow & { grassPollen: number; treePollen: number; weedPollen: number }>;

  const n = complete.length;

  // ── Pass A: OLS on pollen sub-matrix ──────────────────────────────────────

  const rawGrass = complete.map((r) => r.grassPollen);
  const rawTree = complete.map((r) => r.treePollen);
  const rawWeed = complete.map((r) => r.weedPollen);
  const rawSev = complete.map((r) => r.maxSeverity);

  const { normalised: zGrass } = zScore(rawGrass);
  const { normalised: zTree } = zScore(rawTree);
  const { normalised: zWeed } = zScore(rawWeed);
  const { normalised: zSev, mean: sevMean, std: sevStd } = zScore(rawSev);

  const X: number[][] = complete.map((_, i) => [zGrass[i], zTree[i], zWeed[i]]);

  // Compute Pearson r values as fallback betas
  const pearsonGrass = pearsonR(rawGrass, rawSev);
  const pearsonTree = pearsonR(rawTree, rawSev);
  const pearsonWeed = pearsonR(rawWeed, rawSev);

  const { betas, stable } = ols3(X, zSev);
  const [betaGrass, betaTree, betaWeed] = stable
    ? betas
    : [pearsonGrass, pearsonTree, pearsonWeed];

  // R² from Pass A
  const predicted = complete.map((_, i) =>
    betaGrass * zGrass[i] + betaTree * zTree[i] + betaWeed * zWeed[i],
  );
  const ssTot = zSev.reduce((s, v) => s + v ** 2, 0);
  const ssRes = zSev.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  // Residuals in original severity scale
  const residuals = complete.map((_, i) => rawSev[i] - (predicted[i] * sevStd + sevMean));

  // Build TriggerResult[]
  const triggerData = ([
    { key: 'grassPollen', label: 'Grass pollen', beta: betaGrass, pearsonR: pearsonGrass },
    { key: 'treePollen', label: 'Tree pollen', beta: betaTree, pearsonR: pearsonTree },
    { key: 'weedPollen', label: 'Weed pollen', beta: betaWeed, pearsonR: pearsonWeed },
  ] as Array<{ key: PollenKey; label: string; beta: number; pearsonR: number }>).sort(
    (a, b) => Math.abs(b.beta) - Math.abs(a.beta),
  );

  const triggers: TriggerResult[] = triggerData.map((t, idx) => ({
    key: t.key,
    label: t.label,
    partialBeta: t.beta,
    pearsonR: t.pearsonR,
    isPrimary: idx === 0 && Math.abs(t.beta) > 0.05,
  }));

  const primaryTrigger = triggers.find((t) => t.isPrimary) ?? null;

  // ── Pass B: residual correlation for aggravators ───────────────────────────

  const aggravators: AggravatorResult[] = AQ_FACTORS.map(({ key, label }) => {
    const paired = complete
      .map((r, i) => ({ aq: r[key] as number | null, residual: residuals[i], sev: r.maxSeverity }))
      .filter((p): p is { aq: number; residual: number; sev: number } => p.aq !== null);

    if (paired.length < 7) {
      return {
        key, label, category: 'air_quality' as const,
        residualCorrelation: 0, aggravatorMagnitude: 0, isSignificant: false,
      };
    }

    const rc = pearsonR(paired.map((p) => p.aq), paired.map((p) => p.residual));
    const isSignificant = Math.abs(rc) >= 0.3;

    // Magnitude: mean severity difference when AQ is above vs below its median
    let magnitude = 0;
    if (isSignificant) {
      const aqVals = paired.map((p) => p.aq).sort((a, b) => a - b);
      const medianAQ = aqVals[Math.floor(aqVals.length / 2)];
      const highDays = paired.filter((p) => p.residual > 0.5 && p.aq > medianAQ).map((p) => p.sev);
      const lowDays = paired.filter((p) => p.residual > 0.5 && p.aq <= medianAQ).map((p) => p.sev);
      if (highDays.length > 0 && lowDays.length > 0) {
        magnitude = Math.round(Math.abs(mean(highDays) - mean(lowDays)) * 10) / 10;
      }
    }

    return {
      key, label, category: 'air_quality' as const,
      residualCorrelation: rc, aggravatorMagnitude: magnitude, isSignificant,
    };
  }).sort((a, b) => Math.abs(b.residualCorrelation) - Math.abs(a.residualCorrelation));

  const topAggravator = aggravators.find((a) => a.isSignificant) ?? null;

  // ── Insight sentence ───────────────────────────────────────────────────────

  let insightSentence = '';
  if (primaryTrigger) {
    if (topAggravator && topAggravator.aggravatorMagnitude > 0) {
      insightSentence = `Your main trigger is ${primaryTrigger.label.toLowerCase()}. On days when ${topAggravator.label} is also elevated, your symptoms are typically ${topAggravator.aggravatorMagnitude} point${topAggravator.aggravatorMagnitude === 1 ? '' : 's'} worse.`;
    } else if (topAggravator) {
      insightSentence = `Your main trigger is ${primaryTrigger.label.toLowerCase()}. Elevated ${topAggravator.label} tends to amplify your reaction.`;
    } else {
      insightSentence = `Your main trigger is ${primaryTrigger.label.toLowerCase()}. Air quality does not appear to significantly affect your symptoms.`;
    }
  }

  // ── Medication effect ──────────────────────────────────────────────────────

  const medicationEffect = primaryTrigger
    ? computeMedicationEffect(rows, primaryTrigger.key as PollenKey, primaryTrigger.label)
    : null;

  return {
    triggers,
    aggravators,
    primaryTrigger,
    topAggravator,
    rSquared,
    regressionStable: stable,
    dataPoints: n,
    insightSentence,
    medicationEffect,
  };
}
