import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { ENV } from '@/config/env';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { PRO_ENTITLEMENT } from './types';
import type { SubscriptionTier } from './types';

export function initRevenueCat(userId?: string): void {
  const apiKey =
    Platform.OS === 'ios'
      ? ENV.REVENUECAT_IOS_KEY
      : ENV.REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    // RevenueCat not configured — all users remain on free tier
    return;
  }

  if (ENV.APP_ENV !== 'production') {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey, appUserID: userId ?? null });
}

export async function loginRevenueCat(userId: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    const tier = customerInfo.entitlements.active[PRO_ENTITLEMENT] ? 'pro' : 'free';
    useSubscriptionStore.getState().setTier(tier);
    useSubscriptionStore.getState().setRcCustomerId(customerInfo.originalAppUserId);
  } catch {
    // Non-fatal — user stays on current tier
  }
}

export async function syncEntitlement(): Promise<SubscriptionTier> {
  try {
    const info = await Purchases.getCustomerInfo();
    const tier: SubscriptionTier = info.entitlements.active[PRO_ENTITLEMENT] ? 'pro' : 'free';
    useSubscriptionStore.getState().setTier(tier);
    return tier;
  } catch {
    return useSubscriptionStore.getState().tier;
  }
}
