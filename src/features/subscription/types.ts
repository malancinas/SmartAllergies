export type SubscriptionTier = 'free' | 'pro';

export const PRO_ENTITLEMENT = 'pro';

export const PRO_FEATURES = [
  'Hyperlocal multi-source pollen data',
  'Unlimited symptom logging',
  'Full symptom history',
  'Allergist export (PDF)',
  'Personalised allergen profiles',
  'Push notifications with personal thresholds',
] as const;

export const FREE_LIMITS = {
  MAX_SYMPTOM_LOGS: 30,
  HISTORY_DAYS: 7,
} as const;
