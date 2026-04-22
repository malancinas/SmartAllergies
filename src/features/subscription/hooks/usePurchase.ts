import { useState } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { PRO_ENTITLEMENT } from '../types';

export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTier = useSubscriptionStore((s) => s.setTier);

  async function purchase(pkg: PurchasesPackage): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[PRO_ENTITLEMENT]) {
        setTier('pro');
        return true;
      }
      return false;
    } catch (err: unknown) {
      const rcErr = err as { userCancelled?: boolean; message?: string };
      if (!rcErr.userCancelled) {
        setError(rcErr.message ?? 'Purchase failed');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function restorePurchases(): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active[PRO_ENTITLEMENT]) {
        setTier('pro');
        return true;
      }
      return false;
    } catch (err: unknown) {
      const rcErr = err as { message?: string };
      setError(rcErr.message ?? 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { purchase, restorePurchases, isLoading, error };
}
