export type SubscriptionTier = 'free' | 'pro';

export const PRO_ENTITLEMENT = 'pro';

export const PRO_FEATURES = [
  'Personal allergen model — learns your triggers from your daily logs',
  'Worldwide map coverage — live pollen data anywhere on the planet',
  'Full air quality metrics — PM2.5, PM10, ozone, NO₂, SO₂ and more',
  'Custom alerts tailored to your personal trigger model',
  'Peak pollen hours — know your worst windows before they hit (Europe only)',
  'Unlimited symptom logging and full history',
  'Allergist-ready PDF export',
] as const;

export const FREE_LIMITS = {
  MAX_SYMPTOM_LOGS: 30,
  HISTORY_DAYS: 7,
} as const;
