import { computeCorrelations, correlationStrength, MIN_DAYS_FOR_RESULTS } from '../correlationEngine';
import type { CorrelationDataRow } from '@/services/database';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRow(
  date: string,
  maxSeverity: number,
  overrides: Partial<Omit<CorrelationDataRow, 'date' | 'maxSeverity'>> = {},
): CorrelationDataRow {
  return {
    date,
    maxSeverity,
    grassPollen: null,
    treePollen: null,
    weedPollen: null,
    pm25: null,
    pm10: null,
    ozone: null,
    no2: null,
    so2: null,
    uvIndex: null,
    dust: null,
    ...overrides,
  };
}

/** Build N rows where each factor value and severity follow the supplied arrays. */
function buildRows(
  severities: number[],
  factors: Partial<Omit<CorrelationDataRow, 'date' | 'maxSeverity'>>[],
): CorrelationDataRow[] {
  return severities.map((sev, i) =>
    makeRow(`2026-01-${String(i + 1).padStart(2, '0')}`, sev, factors[i] ?? {}),
  );
}

// ─── Pearson math ─────────────────────────────────────────────────────────────

describe('pearson correlation math via computeCorrelations', () => {
  it('returns r ≈ 1.0 when a factor perfectly tracks severity', () => {
    // grass pollen and severity increase together in lockstep
    const rows = buildRows(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Array.from({ length: 10 }, (_, i) => ({ grassPollen: (i + 1) * 10 })),
    );
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.correlation).toBeCloseTo(1.0, 5);
  });

  it('returns r ≈ -1.0 when a factor perfectly inverts severity', () => {
    // grass pollen drops as severity rises (unlikely IRL but tests the math)
    const rows = buildRows(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Array.from({ length: 10 }, (_, i) => ({ grassPollen: (10 - i) * 10 })),
    );
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.correlation).toBeCloseTo(-1.0, 5);
  });

  it('returns r = 0 when a factor is constant (no information)', () => {
    // constant pollen while severity varies → zero correlation
    const rows = buildRows(
      [2, 8, 1, 9, 3, 7, 4, 6, 5, 5],
      Array.from({ length: 10 }, () => ({ grassPollen: 50 })),
    );
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.correlation).toBe(0);
  });

  it('returns r = 0 when severity is constant (no information)', () => {
    const rows = buildRows(
      Array(10).fill(5),
      Array.from({ length: 10 }, (_, i) => ({ grassPollen: i * 15 })),
    );
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.correlation).toBe(0);
  });
});

// ─── Minimum data gate ────────────────────────────────────────────────────────

describe('minimum data requirement', () => {
  it('returns empty array when fewer than MIN_DAYS_FOR_RESULTS rows', () => {
    const rows = buildRows(
      [3, 7, 5, 8, 4, 6],
      Array.from({ length: 6 }, (_, i) => ({ grassPollen: i * 10 })),
    );
    expect(rows.length).toBe(6);
    expect(rows.length).toBeLessThan(MIN_DAYS_FOR_RESULTS);
    expect(computeCorrelations(rows)).toEqual([]);
  });

  it('returns results once exactly MIN_DAYS_FOR_RESULTS rows are present', () => {
    const rows = buildRows(
      [1, 2, 3, 4, 5, 6, 7],
      Array.from({ length: 7 }, (_, i) => ({ grassPollen: i * 10 })),
    );
    expect(computeCorrelations(rows).length).toBeGreaterThan(0);
  });
});

// ─── Null / missing data ──────────────────────────────────────────────────────

describe('null handling', () => {
  it('skips a factor when all its values are null', () => {
    // 10 days, grass pollen null throughout — factor should have dataPoints = 0
    const rows = buildRows(
      [1, 3, 5, 7, 9, 2, 4, 6, 8, 10],
      Array(10).fill({}), // no grassPollen set
    );
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.dataPoints).toBe(0);
    expect(grass.correlation).toBe(0);
  });

  it('uses only the days where a factor has data', () => {
    // 10 rows, grass pollen only present for 8 of them
    const factors = Array.from({ length: 10 }, (_, i) => ({
      grassPollen: i < 8 ? (i + 1) * 10 : null,
    }));
    const rows = buildRows(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      factors as Partial<Omit<CorrelationDataRow, 'date' | 'maxSeverity'>>[],
    );
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.dataPoints).toBe(8);
  });
});

// ─── Ranking ──────────────────────────────────────────────────────────────────

describe('result ranking', () => {
  it('sorts results by absolute correlation strength descending', () => {
    // grass tracks severity perfectly (r=1), tree is weakly correlated
    const rows = buildRows(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Array.from({ length: 10 }, (_, i) => ({
        grassPollen: (i + 1) * 10,       // perfect correlation
        treePollen: Math.sin(i) * 50 + 50, // noisy/weak
      })),
    );
    const results = computeCorrelations(rows);
    const grassIdx = results.findIndex((r) => r.key === 'grassPollen');
    const treeIdx = results.findIndex((r) => r.key === 'treePollen');
    expect(grassIdx).toBeLessThan(treeIdx);
  });

  it('ranks strong negative correlations above weak positive ones', () => {
    // ozone strongly negatively correlated; pm25 weakly positive
    const rows = buildRows(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Array.from({ length: 10 }, (_, i) => ({
        ozone: (10 - i) * 12,   // strong negative: r ≈ -1
        pm25: i % 3 === 0 ? 5 : i % 2 === 0 ? 20 : 12, // weak/noisy
      })),
    );
    const results = computeCorrelations(rows);
    const ozoneIdx = results.findIndex((r) => r.key === 'ozone');
    const pm25Idx = results.findIndex((r) => r.key === 'pm25');
    expect(ozoneIdx).toBeLessThan(pm25Idx);
  });
});

// ─── correlationStrength labels ───────────────────────────────────────────────

describe('correlationStrength', () => {
  it.each([
    [0.9, 'Strong'],
    [-0.8, 'Strong'],
    [0.55, 'Moderate'],
    [-0.42, 'Moderate'],
    [0.3, 'Weak'],
    [-0.25, 'Weak'],
    [0.1, 'Little to none'],
    [0, 'Little to none'],
  ])('r = %s → "%s"', (r, expected) => {
    expect(correlationStrength(r).label).toBe(expected);
  });
});

// ─── Simulation scenarios ─────────────────────────────────────────────────────
//
// These are the "does it do what I expect?" sanity checks.
// Each scenario describes a realistic user situation.

describe('simulation: grass pollen spring season', () => {
  // User has a rough spring: grass rises from 5 → 120 grains/m³ over 2 weeks,
  // their severity tracks it closely. Tree and weed barely move.
  // Expected: grass ranks #1 at r > 0.9, tree and weed much lower.
  const grassValues = [5, 10, 15, 25, 40, 60, 80, 95, 110, 120, 115, 100, 75, 50];
  const severities  = [2,  2,  3,  4,  5,  7,  8,  8,   9,  10,   9,   7,  6,  4];
  const treeValues  = Array(14).fill(30); // flat
  const weedValues  = Array(14).fill(5);  // flat

  const rows = buildRows(
    severities,
    Array.from({ length: 14 }, (_, i) => ({
      grassPollen: grassValues[i],
      treePollen: treeValues[i],
      weedPollen: weedValues[i],
    })),
  );

  it('grass pollen is the top-ranked factor', () => {
    const results = computeCorrelations(rows);
    expect(results[0].key).toBe('grassPollen');
  });

  it('grass pollen has strong positive correlation (r > 0.9)', () => {
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    expect(grass.correlation).toBeGreaterThan(0.9);
    expect(correlationStrength(grass.correlation).label).toBe('Strong');
  });

  it('flat tree pollen produces near-zero correlation', () => {
    const results = computeCorrelations(rows);
    const tree = results.find((r) => r.key === 'treePollen')!;
    expect(Math.abs(tree.correlation)).toBeLessThan(0.1);
  });
});

describe('simulation: air quality driver (urban pollution episode)', () => {
  // 14-day episode where PM2.5 spikes (industrial event), pollen is low and flat,
  // user severity follows the PM2.5 curve.
  const pm25Values  = [8, 8, 12, 18, 30, 45, 60, 70, 65, 50, 35, 20, 10, 8];
  const severities  = [2, 2,  3,  4,  5,  7,  8,  9,  9,  7,  6,  4,  2, 2];
  const grassValues = Array(14).fill(3); // very low pollen season

  const rows = buildRows(
    severities,
    Array.from({ length: 14 }, (_, i) => ({
      pm25: pm25Values[i],
      grassPollen: grassValues[i],
      treePollen: grassValues[i],
      weedPollen: grassValues[i],
    })),
  );

  it('PM2.5 is the top-ranked factor when pollen is flat', () => {
    const results = computeCorrelations(rows);
    expect(results[0].key).toBe('pm25');
  });

  it('PM2.5 has strong positive correlation (r > 0.9)', () => {
    const results = computeCorrelations(rows);
    const pm25 = results.find((r) => r.key === 'pm25')!;
    expect(pm25.correlation).toBeGreaterThan(0.9);
  });

  it('all pollen types show near-zero correlation when flat', () => {
    const results = computeCorrelations(rows);
    for (const key of ['grassPollen', 'treePollen', 'weedPollen']) {
      const r = results.find((f) => f.key === key)!;
      expect(Math.abs(r.correlation)).toBeLessThan(0.15);
    }
  });
});

describe('simulation: multiple drivers (grass + ozone)', () => {
  // Grass and ozone both rise together during a heatwave, severity follows both.
  // Both should have high r, but they should still both appear in top results.
  const grassValues = [10, 20, 35, 55, 70, 90, 100, 95, 80, 60, 40, 20, 10, 10];
  const ozoneValues = [40, 45, 55, 65, 80, 90,  95, 90, 80, 70, 55, 45, 40, 38];
  const severities  = [ 2,  3,  4,  5,  7,  8,   9,  9,  8,  6,  5,  3,  2,  2];

  const rows = buildRows(
    severities,
    Array.from({ length: 14 }, (_, i) => ({
      grassPollen: grassValues[i],
      ozone: ozoneValues[i],
    })),
  );

  it('both grass and ozone have strong correlations (r > 0.9)', () => {
    const results = computeCorrelations(rows);
    const grass = results.find((r) => r.key === 'grassPollen')!;
    const ozone = results.find((r) => r.key === 'ozone')!;
    expect(grass.correlation).toBeGreaterThan(0.9);
    expect(ozone.correlation).toBeGreaterThan(0.9);
  });

  it('both grass and ozone appear in the top 2', () => {
    const results = computeCorrelations(rows);
    const topKeys = results.slice(0, 2).map((r) => r.key);
    expect(topKeys).toContain('grassPollen');
    expect(topKeys).toContain('ozone');
  });
});

describe('simulation: no clear driver (noisy / no pattern)', () => {
  // Random-ish data — no single factor should dominate.
  const rows = buildRows(
    [5, 3, 8, 2, 7, 4, 6, 9, 1, 5, 6, 3, 7, 4],
    [
      { grassPollen: 40, treePollen: 20 },
      { grassPollen: 10, treePollen: 80 },
      { grassPollen: 70, treePollen: 30 },
      { grassPollen: 30, treePollen: 60 },
      { grassPollen: 50, treePollen: 10 },
      { grassPollen: 20, treePollen: 90 },
      { grassPollen: 60, treePollen: 40 },
      { grassPollen: 15, treePollen: 55 },
      { grassPollen: 80, treePollen: 25 },
      { grassPollen: 35, treePollen: 70 },
      { grassPollen: 55, treePollen: 15 },
      { grassPollen: 25, treePollen: 85 },
      { grassPollen: 45, treePollen: 35 },
      { grassPollen: 65, treePollen: 50 },
    ],
  );

  it('no factor exceeds moderate strength when data is noisy', () => {
    const results = computeCorrelations(rows);
    const topCorrelation = Math.abs(results[0]?.correlation ?? 0);
    // With genuinely random data no factor should dominate strongly
    expect(topCorrelation).toBeLessThan(0.7);
  });
});
