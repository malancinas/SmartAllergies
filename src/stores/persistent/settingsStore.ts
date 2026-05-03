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

interface LocationSlots {
  /** YYYY-MM-DD — slots reset when this changes */
  date: string;
  /** Rounded to 0 decimal places, max 3 entries */
  cells: Array<{ lat: number; lon: number }>;
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
  /** Daily location slots for non-Europe Pro users (max 3 unique 1° cells per day) */
  locationSlots: LocationSlots;
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
  /** Check if a location cell (rounded to 0dp) is available and add it if so. GPS locations never call this. */
  checkAndAddSlot: (lat: number, lon: number) => 'allowed' | 'existing' | 'limit_reached';
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
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      notificationsEnabled: true,
      alertSchedules: DEFAULT_SCHEDULES,
      allergenProfile: ['tree', 'grass', 'weed'],
      allergenProfileLastAutoUpdated: null,
      allergenSource: 'manual',
      hasOnboarded: false,
      locationSlots: { date: '', cells: [] },

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

      checkAndAddSlot: (lat, lon) => {
        const today = new Date().toISOString().slice(0, 10);
        const roundedLat = Math.round(lat);
        const roundedLon = Math.round(lon);
        const current = get().locationSlots;
        const prevCells = current.date === today ? current.cells : [];

        if (prevCells.some((c) => c.lat === roundedLat && c.lon === roundedLon)) {
          return 'existing';
        }
        if (prevCells.length < 3) {
          set({ locationSlots: { date: today, cells: [...prevCells, { lat: roundedLat, lon: roundedLon }] } });
          return 'allowed';
        }
        return 'limit_reached';
      },
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
