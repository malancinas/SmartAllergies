import { useEffect, useRef } from 'react';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { syncEntitlement } from '../service';
import { PRO_ENTITLEMENT } from '../types';

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  onUpgraded?: () => void;
  subtitle?: string;
}

export function PaywallSheet({ visible, onClose, onUpgraded }: PaywallSheetProps) {
  const isShowing = useRef(false);

  useEffect(() => {
    if (!visible || isShowing.current) return;
    isShowing.current = true;

    RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT,
    })
      .then(async (result) => {
        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          await syncEntitlement();
          onUpgraded?.();
        }
      })
      .catch(() => {})
      .finally(() => {
        isShowing.current = false;
        onClose();
      });
  }, [visible]);

  return null;
}
