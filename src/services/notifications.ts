import * as Notifications from 'expo-notifications';
import { ENV } from '@/config/env';
import { logger } from './logger';

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
