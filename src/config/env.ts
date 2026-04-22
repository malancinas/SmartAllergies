import {
  API_BASE_URL,
  GOOGLE_CLIENT_ID,
  POSTHOG_API_KEY,
  APP_ENV,
  GOOGLE_POLLEN_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REVENUECAT_IOS_KEY,
  REVENUECAT_ANDROID_KEY,
} from '@env';

const REQUIRED_KEYS = ['API_BASE_URL', 'GOOGLE_CLIENT_ID', 'APP_ENV'] as const;

const rawValues: Record<string, string | undefined> = {
  API_BASE_URL,
  GOOGLE_CLIENT_ID,
  POSTHOG_API_KEY,
  APP_ENV,
  GOOGLE_POLLEN_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REVENUECAT_IOS_KEY,
  REVENUECAT_ANDROID_KEY,
};

for (const key of REQUIRED_KEYS) {
  const value = rawValues[key];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Ensure it is defined in your .env.development or .env.production file.`
    );
  }
}

export const ENV: {
  API_BASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  POSTHOG_API_KEY?: string;
  APP_ENV: 'development' | 'production' | 'staging';
  GOOGLE_POLLEN_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  REVENUECAT_IOS_KEY?: string;
  REVENUECAT_ANDROID_KEY?: string;
} = {
  API_BASE_URL: rawValues.API_BASE_URL as string,
  GOOGLE_CLIENT_ID: rawValues.GOOGLE_CLIENT_ID as string,
  POSTHOG_API_KEY: rawValues.POSTHOG_API_KEY || undefined,
  APP_ENV: rawValues.APP_ENV as 'development' | 'production' | 'staging',
  GOOGLE_POLLEN_API_KEY: rawValues.GOOGLE_POLLEN_API_KEY || undefined,
  SUPABASE_URL: rawValues.SUPABASE_URL || undefined,
  SUPABASE_ANON_KEY: rawValues.SUPABASE_ANON_KEY || undefined,
  REVENUECAT_IOS_KEY: rawValues.REVENUECAT_IOS_KEY || undefined,
  REVENUECAT_ANDROID_KEY: rawValues.REVENUECAT_ANDROID_KEY || undefined,
};
