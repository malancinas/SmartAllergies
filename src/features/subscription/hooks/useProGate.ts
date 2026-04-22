import { useState, useCallback } from 'react';
import { useSubscription } from './useSubscription';

interface PaywallState {
  visible: boolean;
  featureName: string;
}

export function useProGate() {
  const { isPro } = useSubscription();
  const [paywallState, setPaywallState] = useState<PaywallState>({
    visible: false,
    featureName: '',
  });

  const showPaywall = useCallback((featureName: string) => {
    setPaywallState({ visible: true, featureName });
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallState((s) => ({ ...s, visible: false }));
  }, []);

  return {
    isPro,
    showPaywall,
    paywallProps: {
      visible: paywallState.visible,
      onClose: closePaywall,
      featureName: paywallState.featureName,
    },
  };
}
