import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlertThreshold = 'medium' | 'high';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  allergyAlertEnabled: boolean;
  alertThreshold: AlertThreshold;
  /** Hour of day (0–23) to send the morning allergy alert */
  alertHour: number;
  /** Allergen types the user is sensitive to: 'tree' | 'grass' | 'weed' */
  allergenProfile: string[];
  /** Whether the user has completed the first-run onboarding flow */
  hasOnboarded: boolean;
}

interface SettingsActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAllergyAlertEnabled: (enabled: boolean) => void;
  setAlertThreshold: (threshold: AlertThreshold) => void;
  setAlertHour: (hour: number) => void;
  setAllergenProfile: (profile: string[]) => void;
  setHasOnboarded: (done: boolean) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      notificationsEnabled: true,
      allergyAlertEnabled: true,
      alertThreshold: 'medium',
      alertHour: 7,
      allergenProfile: ['tree', 'grass', 'weed'],
      hasOnboarded: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setAllergyAlertEnabled: (allergyAlertEnabled) => set({ allergyAlertEnabled }),
      setAlertThreshold: (alertThreshold) => set({ alertThreshold }),
      setAlertHour: (alertHour) => set({ alertHour }),
      setAllergenProfile: (allergenProfile) => set({ allergenProfile }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
