import { ENV } from '@/config/env';

const isDev = ENV.APP_ENV !== 'production';

let Sentry: { captureException: (err: unknown) => void } | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/react-native');
} catch {
  // Sentry not configured — errors will only log to console
}

class Logger {
  debug(msg: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(`[DEBUG] ${msg}`, ...args);
    }
  }

  info(msg: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(`[INFO] ${msg}`, ...args);
    }
  }

  warn(msg: string, ...args: unknown[]): void {
    if (isDev) {
      console.warn(`[WARN] ${msg}`, ...args);
    }
  }

  error(msg: string, error?: unknown): void {
    console.error(`[ERROR] ${msg}`, error);
    if (!isDev && Sentry && error) {
      try {
        Sentry.captureException(error);
      } catch {
        // Guard against Sentry itself throwing
      }
    }
  }
}

export const logger = new Logger();
