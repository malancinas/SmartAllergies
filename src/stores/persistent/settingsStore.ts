import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlertThreshold = 'medium' | 'high';
export type AlertScheduleType = 'threshold' | 'custom';

export interface AlertSchedule {
  id: string;
  enabled: boolean;
  /** 0=Sun … 6=Sat */
  days: number[];
  hour: number;
  minute: number;
  type: AlertScheduleType;
  /** Used when type='threshold' */
  threshold: AlertThreshold;
  /** Used when type='custom' (Pro). Empty = all three allergens. */
  allergens: string[];
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  alertSchedules: AlertSchedule[];
  /** Allergen types the user is sensitive to: 'tree' | 'grass' | 'weed' */
  allergenProfile: string[];
  /** ISO date (YYYY-MM-DD) of the last time Pro auto-updated the allergen profile, or null if never */
  allergenProfileLastAutoUpdated: string | null;
  /** Pro: whether to derive active allergens from the ML model ('model') or the manual toggles ('manual') */
  allergenSource: 'model' | 'manual';
  /** Whether the user has completed the first-run onboarding flow */
  hasOnboarded: boolean;
}

interface SettingsActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAlertSchedules: (schedules: AlertSchedule[]) => void;
  addAlertSchedule: (schedule: AlertSchedule) => void;
  updateAlertSchedule: (id: string, update: Partial<AlertSchedule>) => void;
  removeAlertSchedule: (id: string) => void;
  setAllergenProfile: (profile: string[]) => void;
  setAllergenProfileLastAutoUpdated: (date: string | null) => void;
  setAllergenSource: (source: 'model' | 'manual') => void;
  setHasOnboarded: (done: boolean) => void;
}

const DEFAULT_SCHEDULES: AlertSchedule[] = [
  {
    id: 'default-morning',
    enabled: true,
    days: [0, 1, 2, 3, 4, 5, 6],
    hour: 7,
    minute: 0,
    type: 'threshold',
    threshold: 'medium',
    allergens: [],
  },
];

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      notificationsEnabled: true,
      alertSchedules: DEFAULT_SCHEDULES,
      allergenProfile: ['tree', 'grass', 'weed'],
      allergenProfileLastAutoUpdated: null,
      allergenSource: 'manual',
      hasOnboarded: false,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setAlertSchedules: (alertSchedules) => set({ alertSchedules }),
      addAlertSchedule: (schedule) =>
        set((s) => ({ alertSchedules: [...s.alertSchedules, schedule] })),
      updateAlertSchedule: (id, update) =>
        set((s) => ({
          alertSchedules: s.alertSchedules.map((sch) =>
            sch.id === id ? { ...sch, ...update } : sch,
          ),
        })),
      removeAlertSchedule: (id) =>
        set((s) => ({ alertSchedules: s.alertSchedules.filter((sch) => sch.id !== id) })),
      setAllergenProfile: (allergenProfile) => set({ allergenProfile }),
      setAllergenProfileLastAutoUpdated: (allergenProfileLastAutoUpdated) =>
        set({ allergenProfileLastAutoUpdated }),
      setAllergenSource: (allergenSource) => set({ allergenSource }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<SettingsState & SettingsActions>;
        const result = { ...current, ...p };
        if (!p.alertSchedules || p.alertSchedules.length === 0) {
          result.alertSchedules = DEFAULT_SCHEDULES;
        }
        // Upgrade old 'system' installs to explicit dark mode for the new dark design
        if (!p.theme || p.theme === 'system') {
          result.theme = 'dark';
        }
        return result;
      },
    },
  ),
);
