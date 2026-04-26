import type { PollenLevel, SpeciesData } from '@/features/pollen/types';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface CorrelationWeights {
  tree: number;  // 0–1, user-specific sensitivity
  grass: number;
  weed: number;
  /** True when we have enough data to personalise (≥ 7 paired days) */
  personalised: boolean;
}

export interface DailyRiskScore {
  date: string; // YYYY-MM-DD
  score: number; // 0–1
  level: RiskLevel;
  pollenLevels?: { tree: PollenLevel; grass: PollenLevel; weed: PollenLevel };
  species?: SpeciesData[];
}

export interface AllergyForecast {
  today: DailyRiskScore | null;
  upcoming: DailyRiskScore[]; // next 1–4 days
  weights: CorrelationWeights;
}
