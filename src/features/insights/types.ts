export interface CorrelationResult {
  key: string;
  label: string;
  category: 'pollen' | 'air_quality';
  correlation: number;
  dataPoints: number;
}

export interface TriggerResult {
  key: string;
  label: string;
  /** OLS partial coefficient (z-scored, comparable across factors) */
  partialBeta: number;
  pearsonR: number;
  isPrimary: boolean;
  isSecondary: boolean;
}

export interface AggravatorResult {
  key: string;
  label: string;
  category: 'air_quality';
  /** Pearson r between this factor and the OLS residuals from Pass A */
  residualCorrelation: number;
  /** Mean severity-point difference when this factor is elevated (original scale) */
  aggravatorMagnitude: number;
  isSignificant: boolean;
}

export interface MedicationEffect {
  primaryTriggerKey: string;
  primaryTriggerLabel: string;
  /** Pollen domain threshold used (grains/m³) */
  pollenThreshold: number;
  /** Which lag showed the stronger medication signal */
  lagDays: 0 | 1;
  medicatedDays: number;
  unmedicatedDays: number;
  meanSeverityMedicated: number;
  meanSeverityUnmedicated: number;
  /** Absolute severity-point improvement with medication */
  reductionPoints: number;
  /** Percentage improvement relative to unmedicated severity */
  reductionPercent: number;
  hasEnoughData: boolean;
  /** Shown instead of results when data is insufficient */
  nudgeMessage: string | null;
}

export interface AdvancedAllergyProfile {
  triggers: TriggerResult[];
  aggravators: AggravatorResult[];
  primaryTrigger: TriggerResult | null;
  topAggravator: AggravatorResult | null;
  rSquared: number;
  regressionStable: boolean;
  dataPoints: number;
  insightSentence: string;
  medicationEffect: MedicationEffect | null;
}
