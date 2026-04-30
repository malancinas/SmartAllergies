import * as Notifications from 'expo-notifications';
import { ENV } from '@/config/env';
import { logger } from './logger';
import type { RiskLevel } from '@/features/forecasting/types';
import type { DailyRiskScore } from '@/features/forecasting/types';
import type { PollenLevel } from '@/features/pollen/types';
import type { AlertSchedule, AlertThreshold } from '@/stores/persistent/settingsStore';

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleLocal(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger,
  });

  if (ENV.APP_ENV === 'development') {
    logger.debug('Scheduled local notification', { id, title, body, trigger });
  }

  return id;
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Hours >= 18 or < 5 are "night" — alert content uses tomorrow's forecast */
function isNightHour(hour: number): boolean {
  return hour >= 18 || hour < 5;
}

function meetsThreshold(level: RiskLevel, threshold: AlertThreshold): boolean {
  return threshold === 'medium' ? level !== 'low' : level === 'high';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pollenLevelLabel(level: PollenLevel): string {
  return level === 'very_high' ? 'very high' : level;
}

// ─── Message templates ───────────────────────────────────────────────────────

const MORNING_COPY: Record<RiskLevel, { title: string; body: string }> = {
  low: {
    title: 'Low pollen today',
    body: "It's a good day to go outside. Pollen levels are low.",
  },
  medium: {
    title: 'Medium pollen risk today',
    body: 'Consider taking antihistamines before heading out.',
  },
  high: {
    title: '⚠️ High pollen risk today',
    body: 'Pollen is high. Stay indoors if possible and keep windows closed.',
  },
};

const NIGHT_COPY: Record<RiskLevel, { title: string; body: string }> = {
  low: {
    title: 'Tomorrow looks clear',
    body: "Pollen forecast for tomorrow is low. Good day to plan outdoor activities.",
  },
  medium: {
    title: 'Tomorrow: medium pollen',
    body: 'Moderate pollen expected tomorrow. Consider antihistamines in the morning.',
  },
  high: {
    title: '⚠️ High pollen tomorrow',
    body: 'High pollen expected tomorrow. Prepare your medication and plan accordingly.',
  },
};

function buildThresholdContent(
  level: RiskLevel,
  isNight: boolean,
): { title: string; body: string } {
  return isNight ? NIGHT_COPY[level] : MORNING_COPY[level];
}

function buildCustomContent(
  allergens: string[],
  pollenLevels: { tree: PollenLevel; grass: PollenLevel; weed: PollenLevel },
  isNight: boolean,
): { title: string; body: string } {
  const when = isNight ? 'tomorrow' : 'today';
  const targets = allergens.length > 0 ? allergens : ['tree', 'grass', 'weed'];
  const parts = targets.map((a) => {
    const level = pollenLevels[a as 'tree' | 'grass' | 'weed'];
    return `${capitalize(a)}: ${pollenLevelLabel(level)}`;
  });
  return {
    title: `Your allergen forecast (${when})`,
    body: parts.join(' · '),
  };
}

function buildPersonalisedContent(
  level: RiskLevel,
  isNight: boolean,
  primaryTrigger: string,
  topAggravator?: string,
): { title: string; body: string } {
  const when = isNight ? 'tomorrow' : 'today';
  const Tomorrow = isNight ? 'Tomorrow' : 'Today';

  if (level === 'low') {
    return {
      title: `Low risk for you ${when}`,
      body: `Your main trigger (${primaryTrigger.toLowerCase()}) is low ${when}. A good day to go outside.`,
    };
  }

  if (level === 'medium') {
    if (topAggravator && !isNight) {
      return {
        title: `Moderate risk for you today`,
        body: `${primaryTrigger} is at moderate levels. ${topAggravator} is also elevated today, which can amplify your reaction.`,
      };
    }
    return {
      title: `Moderate risk for you ${when}`,
      body: `${primaryTrigger} is at moderate levels ${when} — your main trigger. You may want to take precautions.`,
    };
  }

  // high
  if (topAggravator) {
    return isNight
      ? {
          title: `⚠️ Tomorrow could be a bad day for you`,
          body: `${primaryTrigger} will be high — and ${topAggravator} is also elevated, which tends to make your symptoms worse. Consider preparing tonight.`,
        }
      : {
          title: `⚠️ Tough allergy conditions for you today`,
          body: `${primaryTrigger} is elevated. ${topAggravator} is also high today, which can amplify your reaction — take your medication early.`,
        };
  }

  return isNight
    ? {
        title: `⚠️ ${Tomorrow} looks tough for you`,
        body: `${primaryTrigger} will be high tomorrow. Prepare your medication tonight.`,
      }
    : {
        title: `⚠️ High risk for you today`,
        body: `${primaryTrigger} is elevated — your main trigger. Consider taking antihistamines before going out.`,
      };
}

// ─── Smart alert scheduling ──────────────────────────────────────────────────

/**
 * Cancels all scheduled allergy alerts then reschedules based on the user's
 * smart alert schedules. Each schedule fires at a fixed time on selected days.
 *
 * Night schedules (hour >= 18 or < 5) show tomorrow's predicted forecast.
 * Morning/day schedules (5–17) show today's real-time pollen levels.
 * Pro custom schedules show per-allergen breakdown instead of threshold logic.
 * Pro users with an allergy profile get personalised copy naming their trigger.
 */
export async function rescheduleAlertSchedules(params: {
  schedules: AlertSchedule[];
  notificationsEnabled: boolean;
  todayData: DailyRiskScore | null;
  tomorrowData: DailyRiskScore | null;
  isPro: boolean;
  allergyProfile?: {
    phase: 1 | 2;
    primaryTrigger?: string;
    topAggravator?: string;
  };
}): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!params.notificationsEnabled) return;

  const enabled = params.schedules.filter((s) => s.enabled && s.days.length > 0);
  if (enabled.length === 0) return;

  for (const schedule of enabled) {
    const night = isNightHour(schedule.hour);
    const data = night ? params.tomorrowData : params.todayData;

    if (!data) continue;

    let content: { title: string; body: string };

    if (schedule.type === 'custom' && params.isPro) {
      if (!data.pollenLevels) continue;
      content = buildCustomContent(schedule.allergens, data.pollenLevels, night);
    } else if (params.isPro && params.allergyProfile?.primaryTrigger) {
      if (!meetsThreshold(data.level, schedule.threshold)) continue;
      content = buildPersonalisedContent(
        data.level,
        night,
        params.allergyProfile.primaryTrigger,
        params.allergyProfile.topAggravator,
      );
    } else {
      if (!meetsThreshold(data.level, schedule.threshold)) continue;
      content = buildThresholdContent(data.level, night);
    }

    for (const day of schedule.days) {
      await Notifications.scheduleNotificationAsync({
        identifier: `smart-alert-${schedule.id}-${day}`,
        content: {
          title: content.title,
          body: content.body,
          data: { type: 'smart_alert', scheduleId: schedule.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo: 1=Sun … 7=Sat
          hour: schedule.hour,
          minute: schedule.minute,
        },
      });
    }
  }

  if (ENV.APP_ENV === 'development') {
    logger.debug('Smart alerts rescheduled', { count: enabled.length });
  }
}
