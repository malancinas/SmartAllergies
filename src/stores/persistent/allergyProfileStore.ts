import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdvancedAllergyProfile } from '@/features/insights/types';

interface AllergyProfileStoreState {
  committedProfile: AdvancedAllergyProfile | null;
  committedRSquared: number;
  setCommittedProfile: (profile: AdvancedAllergyProfile) => void;
  clearCommittedProfile: () => void;
}

export const useAllergyProfileStore = create<AllergyProfileStoreState>()(
  persist(
    (set) => ({
      committedProfile: null,
      committedRSquared: 0,
      setCommittedProfile: (profile) =>
        set({ committedProfile: profile, committedRSquared: profile.rSquared }),
      clearCommittedProfile: () => set({ committedProfile: null, committedRSquared: 0 }),
    }),
    {
      name: 'allergy-profile-committed',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
