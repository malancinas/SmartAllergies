import * as Notifications from 'expo-notifications';
import { ENV } from '@/config/env';
import { logger } from './logger';
import type { RiskLevel } from '@/features/forecasting/types';
import type { AlertThreshold } from '@/stores/persistent/settingsStore';

const ALLERGY_ALERT_ID_KEY = 'allergy-alert';

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

const RISK_COPY: Record<RiskLevel, { title: string; body: string }> = {
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

/** Schedule (or reschedule) a daily allergy alert at the given hour. */
export async function scheduleAllergyAlert(
  riskLevel: RiskLevel,
  hour: number,
): Promise<void> {
  // Cancel any previously scheduled allergy alert
  await cancelAllergyAlerts();

  const copy = RISK_COPY[riskLevel];

  const id = await Notifications.scheduleNotificationAsync({
    identifier: ALLERGY_ALERT_ID_KEY,
    content: { title: copy.title, body: copy.body, data: { type: 'allergy_alert' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });

  logger.debug('Allergy alert scheduled', { id, riskLevel, hour });
}

export async function cancelAllergyAlerts(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ALLERGY_ALERT_ID_KEY);
  } catch {
    // Notification may not exist yet — ignore
  }
}

/**
 * Called after each forecast refresh. Schedules an alert only if the user's
 * risk meets or exceeds their threshold. Silently skips if permission is not
 * granted or alerts are disabled.
 */
export async function rescheduleIfNeeded(params: {
  riskLevel: RiskLevel;
  threshold: AlertThreshold;
  alertEnabled: boolean;
  hour: number;
}): Promise<void> {
  if (!params.alertEnabled) {
    await cancelAllergyAlerts();
    return;
  }

  const MEETS_THRESHOLD: Record<AlertThreshold, RiskLevel[]> = {
    medium: ['medium', 'high'],
    high: ['high'],
  };

  if (MEETS_THRESHOLD[params.threshold].includes(params.riskLevel)) {
    await scheduleAllergyAlert(params.riskLevel, params.hour);
  } else {
    await cancelAllergyAlerts();
  }
}
