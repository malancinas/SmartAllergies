import { useEffect } from 'react';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { syncEntitlement } from '../service';
import { ENV } from '@/config/env';

export function useSubscription() {
  const tier = useSubscriptionStore((s) => s.tier);

  useEffect(() => {
    // Only sync if RevenueCat is configured
    if (!ENV.REVENUECAT_IOS_KEY && !ENV.REVENUECAT_ANDROID_KEY) return;
    syncEntitlement().catch(() => {});
  }, []);

  return {
    tier,
    isPro: tier === 'pro',
  };
}
