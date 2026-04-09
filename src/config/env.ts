import {
  API_BASE_URL,
  GOOGLE_CLIENT_ID,
  POSTHOG_API_KEY,
  APP_ENV,
} from '@env';

const REQUIRED_KEYS = ['API_BASE_URL', 'GOOGLE_CLIENT_ID', 'APP_ENV'] as const;

const rawValues: Record<string, string | undefined> = {
  API_BASE_URL,
  GOOGLE_CLIENT_ID,
  POSTHOG_API_KEY,
  APP_ENV,
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
} = {
  API_BASE_URL: rawValues.API_BASE_URL as string,
  GOOGLE_CLIENT_ID: rawValues.GOOGLE_CLIENT_ID as string,
  POSTHOG_API_KEY: rawValues.POSTHOG_API_KEY || undefined,
  APP_ENV: rawValues.APP_ENV as 'development' | 'production' | 'staging',
};
