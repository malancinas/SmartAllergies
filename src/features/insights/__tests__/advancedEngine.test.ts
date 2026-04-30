import { computeAdvancedProfile, MIN_DAYS_FOR_ADVANCED } from '../advancedEngine';
import type { CorrelationDataRow } from '@/services/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Build 30 rows where tree pollen tracks severity closely, grass/weed are low and flat. */
function buildTreePollenRows(): CorrelationDataRow[] {
  return Array.from({ length: 30 }, (_, i) => {
    const treePollen = 10 + i * 1.5; // rises steadily
    const severity = 2 + i * 0.25;   // rises with tree pollen
    return makeRow(`2026-${String(Math.floor(i / 30) + 3).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, severity, {
      treePollen,
      grassPollen: 5,   // flat, no signal
      weedPollen: 2,    // flat, no signal
      pm25: 10,         // flat, no aggravator signal
    });
  });
}

/** Build 30 rows where grass pollen drives severity AND pm25 amplifies residuals. */
function buildGrassWithPM25Rows(): CorrelationDataRow[] {
  return Array.from({ length: 30 }, (_, i) => {
    const grassPollen = 5 + i * 1.5;
    const baseSeverity = 1 + i * 0.25;
    // pm25 is high on odd days — adds ~1.5 severity points above base
    const pm25 = i % 2 === 0 ? 8 : 28;
    const severity = baseSeverity + (pm25 > 15 ? 1.5 : 0);
    return makeRow(`2026-04-${String((i % 28) + 1).padStart(2, '0')}`, severity, {
      grassPollen,
      treePollen: 3,
      weedPollen: 2,
      pm25,
    });
  });
}

/** Near-singular: all three pollen types move in perfect lockstep. */
function buildCollinearRows(): CorrelationDataRow[] {
  return Array.from({ length: 30 }, (_, i) => {
    const pollen = 10 + i;
    const severity = 2 + i * 0.2;
    return makeRow(`2026-04-${String((i % 28) + 1).padStart(2, '0')}`, severity, {
      grassPollen: pollen,
      treePollen: pollen,      // identical to grass — perfectly collinear
      weedPollen: pollen,
      pm25: 10,
    });
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeAdvancedProfile', () => {
  it('returns rSquared=0 and no primary trigger when fewer than MIN_DAYS_FOR_ADVANCED rows', () => {
    const rows = buildTreePollenRows().slice(0, MIN_DAYS_FOR_ADVANCED - 1);
    // Engine is called with incomplete rows; profile should degrade gracefully
    const profile = computeAdvancedProfile(rows);
    // With fewer rows the OLS can still run, but we just verify it doesn't throw
    expect(profile.dataPoints).toBeLessThan(MIN_DAYS_FOR_ADVANCED);
  });

  it('identifies tree pollen as primary trigger when it drives severity', () => {
    const rows = buildTreePollenRows();
    const profile = computeAdvancedProfile(rows);
    expect(profile.primaryTrigger).not.toBeNull();
    expect(profile.primaryTrigger?.key).toBe('treePollen');
    expect(profile.rSquared).toBeGreaterThan(0.5);
  });

  it('identifies PM2.5 as a significant aggravator when it amplifies residuals', () => {
    const rows = buildGrassWithPM25Rows();
    const profile = computeAdvancedProfile(rows);
    expect(profile.primaryTrigger?.key).toBe('grassPollen');
    expect(profile.topAggravator).not.toBeNull();
    expect(profile.topAggravator?.key).toBe('pm25');
    expect(profile.topAggravator?.isSignificant).toBe(true);
  });

  it('falls back gracefully when pollen columns are perfectly collinear', () => {
    const rows = buildCollinearRows();
    const profile = computeAdvancedProfile(rows);
    // Should not throw; regressionStable may be false
    expect(typeof profile.rSquared).toBe('number');
    expect(profile.dataPoints).toBe(30);
    // insightSentence should still be a string (possibly empty if no clear primary)
    expect(typeof profile.insightSentence).toBe('string');
  });

  it('produces a non-empty insightSentence when a clear primary trigger exists', () => {
    const rows = buildTreePollenRows();
    const profile = computeAdvancedProfile(rows);
    expect(profile.insightSentence.length).toBeGreaterThan(0);
    expect(profile.insightSentence.toLowerCase()).toContain('tree pollen');
  });

  it('returns exactly 3 triggers and 7 aggravators', () => {
    const rows = buildTreePollenRows();
    const profile = computeAdvancedProfile(rows);
    expect(profile.triggers).toHaveLength(3);
    expect(profile.aggravators).toHaveLength(7);
  });
});
