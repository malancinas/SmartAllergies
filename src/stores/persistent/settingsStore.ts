import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlertThreshold = 'medium' | 'high';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  alertThreshold: AlertThreshold;
  morningAlertEnabled: boolean;
  /** Hour of day (0–23) to send the morning allergy alert */
  morningAlertHour: number;
  eveningAlertEnabled: boolean;
  /** Hour of day (0–23) to send the evening (next-day forecast) alert */
  eveningAlertHour: number;
  /** Days of week to send alerts: 0=Sun, 1=Mon, …, 6=Sat */
  alertDays: number[];
  /** Allergen types the user is sensitive to: 'tree' | 'grass' | 'weed' */
  allergenProfile: string[];
  /** ISO date (YYYY-MM-DD) of the last time Pro auto-updated the allergen profile, or null if never */
  allergenProfileLastAutoUpdated: string | null;
  /** Whether the user has completed the first-run onboarding flow */
  hasOnboarded: boolean;
}

interface SettingsActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAlertThreshold: (threshold: AlertThreshold) => void;
  setMorningAlertEnabled: (enabled: boolean) => void;
  setMorningAlertHour: (hour: number) => void;
  setEveningAlertEnabled: (enabled: boolean) => void;
  setEveningAlertHour: (hour: number) => void;
  setAlertDays: (days: number[]) => void;
  setAllergenProfile: (profile: string[]) => void;
  setAllergenProfileLastAutoUpdated: (date: string | null) => void;
  setHasOnboarded: (done: boolean) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      notificationsEnabled: true,
      alertThreshold: 'medium',
      morningAlertEnabled: true,
      morningAlertHour: 7,
      eveningAlertEnabled: false,
      eveningAlertHour: 21,
      alertDays: [0, 1, 2, 3, 4, 5, 6],
      allergenProfile: ['tree', 'grass', 'weed'],
      allergenProfileLastAutoUpdated: null,
      hasOnboarded: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setAlertThreshold: (alertThreshold) => set({ alertThreshold }),
      setMorningAlertEnabled: (morningAlertEnabled) => set({ morningAlertEnabled }),
      setMorningAlertHour: (morningAlertHour) => set({ morningAlertHour }),
      setEveningAlertEnabled: (eveningAlertEnabled) => set({ eveningAlertEnabled }),
      setEveningAlertHour: (eveningAlertHour) => set({ eveningAlertHour }),
      setAlertDays: (alertDays) => set({ alertDays }),
      setAllergenProfile: (allergenProfile) => set({ allergenProfile }),
      setAllergenProfileLastAutoUpdated: (allergenProfileLastAutoUpdated) => set({ allergenProfileLastAutoUpdated }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
