import {
  pearsonR,
  buildCorrelationWeights,
  computeRiskScore,
  classifyRisk,
} from '../engine';
import type { DailyPollenForecast } from '@/features/pollen/types';
import type { SymptomLog } from '@/features/symptoms/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeLog(date: string, severity: number): SymptomLog {
  return {
    id: date,
    loggedAt: `${date}T09:00:00.000Z`,
    severity,
    symptoms: ['sneezing'],
    latitude: null,
    longitude: null,
    notes: null,
    medications: null,
  };
}

function makePollenDay(
  date: string,
  tree: DailyPollenForecast['tree']['level'],
  grass: DailyPollenForecast['grass']['level'],
  weed: DailyPollenForecast['weed']['level'],
): DailyPollenForecast {
  const overallLevels = [tree, grass, weed];
  const ORDER = ['none', 'low', 'medium', 'high', 'very_high'] as const;
  const overall = overallLevels.reduce((best, l) =>
    ORDER.indexOf(l) > ORDER.indexOf(best) ? l : best,
  );
  return {
    date,
    tree: { level: tree, rawValue: 0 },
    grass: { level: grass, rawValue: 0 },
    weed: { level: weed, rawValue: 0 },
    overallLevel: overall,
  };
}

// ─── pearsonR ────────────────────────────────────────────────────────────────

describe('pearsonR', () => {
  it('returns 1 for perfectly correlated series', () => {
    const xs = [1, 2, 3, 4, 5];
    expect(pearsonR(xs, xs)).toBeCloseTo(1, 5);
  });

  it('returns -1 for perfectly anti-correlated series', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [5, 4, 3, 2, 1];
    expect(pearsonR(xs, ys)).toBeCloseTo(-1, 5);
  });

  it('returns 0 for constant series', () => {
    expect(pearsonR([2, 2, 2], [1, 3, 5])).toBe(0);
  });

  it('returns 0 for length < 2', () => {
    expect(pearsonR([5], [5])).toBe(0);
  });
});

// ─── classifyRisk ────────────────────────────────────────────────────────────

describe('classifyRisk', () => {
  it('classifies low below 0.3', () => {
    expect(classifyRisk(0)).toBe('low');
    expect(classifyRisk(0.29)).toBe('low');
  });

  it('classifies medium between 0.3 and 0.6', () => {
    expect(classifyRisk(0.3)).toBe('medium');
    expect(classifyRisk(0.59)).toBe('medium');
  });

  it('classifies high at 0.6 and above', () => {
    expect(classifyRisk(0.6)).toBe('high');
    expect(classifyRisk(1)).toBe('high');
  });
});

// ─── buildCorrelationWeights ─────────────────────────────────────────────────

describe('buildCorrelationWeights', () => {
  it('returns unpersonalised equal weights with fewer than 7 logs', () => {
    const logs = [makeLog('2026-04-01', 8), makeLog('2026-04-02', 6)];
    const pollen = [
      makePollenDay('2026-04-01', 'high', 'low', 'none'),
      makePollenDay('2026-04-02', 'high', 'low', 'none'),
    ];
    const weights = buildCorrelationWeights(logs, pollen);
    expect(weights.personalised).toBe(false);
    expect(weights.tree).toBeCloseTo(0.33, 1);
  });

  it('returns personalised weights when tree pollen strongly correlates', () => {
    // 7 days: high tree pollen ↔ high symptoms, grass and weed stay low
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date('2026-04-01');
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const treeLevels: DailyPollenForecast['tree']['level'][] = [
      'low', 'medium', 'high', 'very_high', 'high', 'medium', 'low',
    ];
    const severities = [2, 4, 8, 10, 7, 4, 2]; // mirrors tree levels

    const logs = dates.map((date, i) => makeLog(date, severities[i]));
    const pollen = dates.map((date, i) =>
      makePollenDay(date, treeLevels[i], 'none', 'none'),
    );

    const weights = buildCorrelationWeights(logs, pollen);

    expect(weights.personalised).toBe(true);
    // Tree should dominate — its weight should be near 1
    expect(weights.tree).toBeGreaterThan(0.8);
    expect(weights.grass).toBeLessThan(0.1);
    expect(weights.weed).toBeLessThan(0.1);
  });

  it('weights sum to 1 when personalised', () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date('2026-04-01');
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const logs = dates.map((date) => makeLog(date, Math.ceil(Math.random() * 10)));
    const pollen = dates.map((date) =>
      makePollenDay(date, 'medium', 'low', 'high'),
    );
    const weights = buildCorrelationWeights(logs, pollen);
    if (weights.personalised) {
      expect(weights.tree + weights.grass + weights.weed).toBeCloseTo(1, 5);
    }
  });
});

// ─── computeRiskScore ────────────────────────────────────────────────────────

describe('computeRiskScore', () => {
  it('returns low risk score for all-none pollen', () => {
    const day = makePollenDay('2026-04-22', 'none', 'none', 'none');
    const weights = { tree: 0.33, grass: 0.33, weed: 0.33, personalised: false };
    const result = computeRiskScore(day, weights);
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
  });

  it('returns high risk score for very_high tree pollen with high tree weight', () => {
    const day = makePollenDay('2026-04-22', 'very_high', 'none', 'none');
    const weights = { tree: 1, grass: 0, weed: 0, personalised: true };
    const result = computeRiskScore(day, weights);
    expect(result.score).toBeCloseTo(1, 5);
    expect(result.level).toBe('high');
  });

  it('caps score at 1', () => {
    const day = makePollenDay('2026-04-22', 'very_high', 'very_high', 'very_high');
    const weights = { tree: 1, grass: 1, weed: 1, personalised: true };
    const result = computeRiskScore(day, weights);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
