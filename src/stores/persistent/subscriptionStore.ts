import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'pro';

interface SubscriptionState {
  tier: SubscriptionTier;
  rcCustomerId: string | null;
}

interface SubscriptionActions {
  setTier: (tier: SubscriptionTier) => void;
  setRcCustomerId: (id: string) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>()(
  persist(
    (set) => ({
      tier: 'free',
      rcCustomerId: null,

      setTier: (tier) => set({ tier }),
      setRcCustomerId: (id) => set({ rcCustomerId: id }),
      reset: () => set({ tier: 'free', rcCustomerId: null }),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
