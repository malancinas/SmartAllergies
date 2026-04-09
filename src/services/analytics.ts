import { ENV } from '@/config/env';

interface PostHogClient {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset: () => void;
}

class Analytics {
  private client: PostHogClient | null = null;
  private enabled = false;

  constructor() {
    if (ENV.POSTHOG_API_KEY) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PostHog } = require('posthog-react-native');
        this.client = new PostHog(ENV.POSTHOG_API_KEY) as PostHogClient;
        this.enabled = true;
      } catch {
        // posthog-react-native not installed — analytics disabled
      }
    }
  }

  track(event: string, props?: Record<string, unknown>): void {
    if (!this.enabled || !this.client) return;
    this.client.capture(event, props);
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.client) return;
    this.client.identify(userId, traits);
  }

  reset(): void {
    if (!this.enabled || !this.client) return;
    this.client.reset();
  }
}

export const analytics = new Analytics();
