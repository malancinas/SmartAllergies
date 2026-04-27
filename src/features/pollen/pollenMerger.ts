import type { DailyPollenForecast, PollenLevel, PollenTypeData } from './types';
import type { MergedDailyPollenForecast, SourceMetadata } from './types';

const LEVEL_SCORE: Record<PollenLevel, number> = {
  none: 0,
  low: 0.2,
  medium: 0.5,
  high: 0.8,
  very_high: 1.0,
};

const LEVEL_ORDER: PollenLevel[] = ['none', 'low', 'medium', 'high', 'very_high'];

function scoreToLevel(score: number): PollenLevel {
  if (score <= 0.05) return 'none';
  if (score <= 0.3) return 'low';
  if (score <= 0.6) return 'medium';
  if (score <= 0.85) return 'high';
  return 'very_high';
}

function avgTypeData(a: PollenTypeData, b: PollenTypeData): PollenTypeData {
  const rawValue = (a.rawValue + b.rawValue) / 2;
  const avgScore = (LEVEL_SCORE[a.level] + LEVEL_SCORE[b.level]) / 2;
  return { level: scoreToLevel(avgScore), rawValue };
}

function maxLevel(...levels: PollenLevel[]): PollenLevel {
  return levels.reduce((best, l) =>
    LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf(best) ? l : best,
  );
}

export function mergePollenSources(
  omDaily: DailyPollenForecast[],
  googleDaily: DailyPollenForecast[],
  limitedCoverage: boolean,
  fetchedAt: string,
): MergedDailyPollenForecast[] {
  const omMap = new Map(omDaily.map((d) => [d.date, d]));
  const googleMap = new Map(googleDaily.map((d) => [d.date, d]));

  // Union of all dates from both sources
  const allDates = Array.from(new Set([...omMap.keys(), ...googleMap.keys()])).sort();

  const omSource: SourceMetadata = {
    name: 'Open-Meteo',
    lastUpdated: fetchedAt,
    coverage: limitedCoverage ? 'regional' : 'local',
  };
  const googleSource: SourceMetadata = {
    name: 'Google Pollen',
    lastUpdated: fetchedAt,
    coverage: 'local',
  };

  return allDates.map((date) => {
    const om = omMap.get(date);
    const goog = googleMap.get(date);

    if (om && goog) {
      const omScore = LEVEL_SCORE[om.overallLevel];
      const googScore = LEVEL_SCORE[goog.overallLevel];
      const diff = Math.abs(omScore - googScore);

      const confidence = diff > 0.3 ? 'low' : diff > 0.15 ? 'medium' : 'high';

      const tree = avgTypeData(om.tree, goog.tree);
      const grass = avgTypeData(om.grass, goog.grass);
      const weed = avgTypeData(om.weed, goog.weed);
      const overallLevel = maxLevel(tree.level, grass.level, weed.level);

      return {
        date,
        tree,
        grass,
        weed,
        overallLevel,
        species: om.species,
        airQuality: om.airQuality,
        confidence,
        sourceMetadata: [omSource, googleSource],
      };
    }

    // Only one source has data for this date
    const single = om ?? goog!;
    return {
      ...single,
      confidence: 'low' as const,
      sourceMetadata: [om ? omSource : googleSource],
    };
  });
}

export function deriveOverallConfidence(
  days: MergedDailyPollenForecast[],
): 'high' | 'medium' | 'low' {
  if (days.length === 0) return 'low';
  const scores = { high: 0, medium: 0, low: 0 };
  for (const d of days) scores[d.confidence]++;
  if (scores.low > 0) return 'low';
  if (scores.medium > 0) return 'medium';
  return 'high';
}

// Wrap a single-source forecast as a MergedDailyPollenForecast
export function wrapSingleSource(
  daily: DailyPollenForecast[],
  source: SourceMetadata,
): MergedDailyPollenForecast[] {
  return daily.map((d) => ({
    ...d,
    confidence: 'low' as const,
    sourceMetadata: [source],
  }));
}
