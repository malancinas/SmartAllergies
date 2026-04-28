import * as Notifications from 'expo-notifications';
import { ENV } from '@/config/env';
import { logger } from './logger';
import type { RiskLevel } from '@/features/forecasting/types';
import type { AlertThreshold } from '@/stores/persistent/settingsStore';

const MORNING_PREFIX = 'morning-alert-';
const EVENING_PREFIX = 'evening-alert-';

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

// ─── Allergy-specific notifications ─────────────────────────────────────────

const MORNING_COPY: Record<RiskLevel, { title: string; body: string }> = {
  low: {
    title: 'Low pollen today',
    body: "It's a good day to go outside. Pollen levels are low.",
  },
  medium: {
    title: 'Medium pollen risk',
    body: "Consider taking antihistamines before heading out today.",
  },
  high: {
    title: '⚠️ High pollen risk',
    body: "Pollen is high today. Stay indoors if possible and keep windows closed.",
  },
};

const EVENING_COPY: Record<RiskLevel, { title: string; body: string }> = {
  low: {
    title: 'Tomorrow looks clear',
    body: "Pollen levels tomorrow are low. Good day to plan outdoor activities.",
  },
  medium: {
    title: 'Tomorrow: medium pollen',
    body: "Pollen will be moderate tomorrow. Consider taking antihistamines in the morning.",
  },
  high: {
    title: '⚠️ High pollen tomorrow',
    body: "Pollen will be high tomorrow. Prepare your medication and plan accordingly.",
  },
};

export async function cancelAllergyAlerts(): Promise<void> {
  for (let day = 0; day <= 6; day++) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`${MORNING_PREFIX}${day}`);
    } catch {}
    try {
      await Notifications.cancelScheduledNotificationAsync(`${EVENING_PREFIX}${day}`);
    } catch {}
  }
}

function meetsThreshold(level: RiskLevel, threshold: AlertThreshold): boolean {
  const MEETS: Record<AlertThreshold, RiskLevel[]> = {
    medium: ['medium', 'high'],
    high: ['high'],
  };
  return MEETS[threshold].includes(level);
}

/**
 * Called after each forecast refresh. Cancels all existing allergy alerts then
 * reschedules morning and/or evening alerts on the selected days of the week.
 * Silently skips if alerts are disabled or no days are selected.
 */
export async function rescheduleIfNeeded(params: {
  todayRiskLevel: RiskLevel;
  tomorrowRiskLevel: RiskLevel | null;
  threshold: AlertThreshold;
  morningAlertEnabled: boolean;
  morningAlertHour: number;
  eveningAlertEnabled: boolean;
  eveningAlertHour: number;
  /** JS day convention: 0=Sun, 1=Mon, …, 6=Sat */
  alertDays: number[];
}): Promise<void> {
  await cancelAllergyAlerts();

  if (params.alertDays.length === 0) return;
  if (!params.morningAlertEnabled && !params.eveningAlertEnabled) return;

  // Morning alert — uses today's risk level
  if (
    params.morningAlertEnabled &&
    meetsThreshold(params.todayRiskLevel, params.threshold)
  ) {
    const copy = MORNING_COPY[params.todayRiskLevel];
    for (const day of params.alertDays) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${MORNING_PREFIX}${day}`,
        content: { title: copy.title, body: copy.body, data: { type: 'morning_alert' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo: 1=Sun … 7=Sat
          hour: params.morningAlertHour,
          minute: 0,
        },
      });
    }
    logger.debug('Morning alerts scheduled', {
      days: params.alertDays,
      hour: params.morningAlertHour,
      riskLevel: params.todayRiskLevel,
    });
  }

  // Evening alert — uses tomorrow's risk level
  if (
    params.eveningAlertEnabled &&
    params.tomorrowRiskLevel &&
    meetsThreshold(params.tomorrowRiskLevel, params.threshold)
  ) {
    const copy = EVENING_COPY[params.tomorrowRiskLevel];
    for (const day of params.alertDays) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${EVENING_PREFIX}${day}`,
        content: { title: copy.title, body: copy.body, data: { type: 'evening_alert' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1,
          hour: params.eveningAlertHour,
          minute: 0,
        },
      });
    }
    logger.debug('Evening alerts scheduled', {
      days: params.alertDays,
      hour: params.eveningAlertHour,
      riskLevel: params.tomorrowRiskLevel,
    });
  }
}
