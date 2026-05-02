/**
 * Dev-only helpers for manually testing every alert scenario on device/emulator.
 * Each function fires an immediate notification (after a short delay so you can
 * navigate away and see it land). Never import this in production code.
 */

import * as Notifications from 'expo-notifications';
import {
  buildThresholdContent,
  buildCustomContent,
  buildPersonalisedContent,
} from '@/services/notifications';
import type { RiskLevel } from '@/features/forecasting/types';
import type { PollenLevel } from '@/features/pollen/types';

const FIRE_DELAY_SECONDS = 3;

async function fireIn(title: string, body: string, label: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `dev-alert-${label}-${Date.now()}`,
    content: { title, body, data: { type: 'dev_test', label } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: FIRE_DELAY_SECONDS, repeats: false },
  });
}

// ─── Free threshold scenarios ──────────────────────────────────────────────────

export async function fireFreeDayLow(): Promise<void> {
  const c = buildThresholdContent('low', false);
  await fireIn(c.title, c.body, 'free-day-low');
}

export async function fireFreeDayMedium(): Promise<void> {
  const c = buildThresholdContent('medium', false);
  await fireIn(c.title, c.body, 'free-day-medium');
}

export async function fireFreeDayHigh(): Promise<void> {
  const c = buildThresholdContent('high', false);
  await fireIn(c.title, c.body, 'free-day-high');
}

export async function fireFreeNightLow(): Promise<void> {
  const c = buildThresholdContent('low', true);
  await fireIn(c.title, c.body, 'free-night-low');
}

export async function fireFreeNightMedium(): Promise<void> {
  const c = buildThresholdContent('medium', true);
  await fireIn(c.title, c.body, 'free-night-medium');
}

export async function fireFreeNightHigh(): Promise<void> {
  const c = buildThresholdContent('high', true);
  await fireIn(c.title, c.body, 'free-night-high');
}

// ─── Pro custom allergen scenarios ─────────────────────────────────────────────

const SAMPLE_LEVELS: { tree: PollenLevel; grass: PollenLevel; weed: PollenLevel } = {
  tree: 'high',
  grass: 'medium',
  weed: 'low',
};

export async function fireProCustomDay(): Promise<void> {
  const c = buildCustomContent(['tree', 'grass', 'weed'], SAMPLE_LEVELS, false);
  await fireIn(c.title, c.body, 'pro-custom-day');
}

export async function fireProCustomNight(): Promise<void> {
  const c = buildCustomContent(['tree', 'grass', 'weed'], SAMPLE_LEVELS, true);
  await fireIn(c.title, c.body, 'pro-custom-night');
}

// ─── Pro personalised scenarios ────────────────────────────────────────────────

export async function fireProPersonalisedLowDay(): Promise<void> {
  const c = buildPersonalisedContent('low', false, 'Grass pollen');
  await fireIn(c.title, c.body, 'pro-pers-low-day');
}

export async function fireProPersonalisedLowNight(): Promise<void> {
  const c = buildPersonalisedContent('low', true, 'Grass pollen');
  await fireIn(c.title, c.body, 'pro-pers-low-night');
}

export async function fireProPersonalisedMediumDayNoAQ(): Promise<void> {
  const c = buildPersonalisedContent('medium', false, 'Tree pollen');
  await fireIn(c.title, c.body, 'pro-pers-med-day-noaq');
}

export async function fireProPersonalisedMediumDayWithAQ(): Promise<void> {
  const c = buildPersonalisedContent('medium', false, 'Tree pollen', 'PM2.5');
  await fireIn(c.title, c.body, 'pro-pers-med-day-aq');
}

export async function fireProPersonalisedMediumNight(): Promise<void> {
  const c = buildPersonalisedContent('medium', true, 'Grass pollen');
  await fireIn(c.title, c.body, 'pro-pers-med-night');
}

export async function fireProPersonalisedHighDayNoAQ(): Promise<void> {
  const c = buildPersonalisedContent('high', false, 'Weed pollen');
  await fireIn(c.title, c.body, 'pro-pers-high-day-noaq');
}

export async function fireProPersonalisedHighDayWithAQ(): Promise<void> {
  const c = buildPersonalisedContent('high', false, 'Grass pollen', 'Ozone');
  await fireIn(c.title, c.body, 'pro-pers-high-day-aq');
}

export async function fireProPersonalisedHighNightNoAQ(): Promise<void> {
  const c = buildPersonalisedContent('high', true, 'Tree pollen');
  await fireIn(c.title, c.body, 'pro-pers-high-night-noaq');
}

export async function fireProPersonalisedHighNightWithAQ(): Promise<void> {
  const c = buildPersonalisedContent('high', true, 'Grass pollen', 'PM2.5');
  await fireIn(c.title, c.body, 'pro-pers-high-night-aq');
}

// ─── Named scenario registry ───────────────────────────────────────────────────

export type AlertScenario =
  | 'free-day-low'
  | 'free-day-medium'
  | 'free-day-high'
  | 'free-night-low'
  | 'free-night-medium'
  | 'free-night-high'
  | 'pro-custom-day'
  | 'pro-custom-night'
  | 'pro-pers-low-day'
  | 'pro-pers-low-night'
  | 'pro-pers-med-day-noaq'
  | 'pro-pers-med-day-aq'
  | 'pro-pers-med-night'
  | 'pro-pers-high-day-noaq'
  | 'pro-pers-high-day-aq'
  | 'pro-pers-high-night-noaq'
  | 'pro-pers-high-night-aq';

const SCENARIO_MAP: Record<AlertScenario, () => Promise<void>> = {
  'free-day-low': fireFreeDayLow,
  'free-day-medium': fireFreeDayMedium,
  'free-day-high': fireFreeDayHigh,
  'free-night-low': fireFreeNightLow,
  'free-night-medium': fireFreeNightMedium,
  'free-night-high': fireFreeNightHigh,
  'pro-custom-day': fireProCustomDay,
  'pro-custom-night': fireProCustomNight,
  'pro-pers-low-day': fireProPersonalisedLowDay,
  'pro-pers-low-night': fireProPersonalisedLowNight,
  'pro-pers-med-day-noaq': fireProPersonalisedMediumDayNoAQ,
  'pro-pers-med-day-aq': fireProPersonalisedMediumDayWithAQ,
  'pro-pers-med-night': fireProPersonalisedMediumNight,
  'pro-pers-high-day-noaq': fireProPersonalisedHighDayNoAQ,
  'pro-pers-high-day-aq': fireProPersonalisedHighDayWithAQ,
  'pro-pers-high-night-noaq': fireProPersonalisedHighNightNoAQ,
  'pro-pers-high-night-aq': fireProPersonalisedHighNightWithAQ,
};

export async function fireScenario(scenario: AlertScenario): Promise<void> {
  await SCENARIO_MAP[scenario]();
}

export const ALL_SCENARIOS: AlertScenario[] = Object.keys(SCENARIO_MAP) as AlertScenario[];
