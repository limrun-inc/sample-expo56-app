import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logActivity } from './db';

export function configureNotificationHandling() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

export async function scheduleEngagementReminder(seconds: number): Promise<string | null> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your feed misses you',
      body: 'New posts from aurora.dev and 6 others are waiting.',
      data: { url: '/' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  await logActivity('notification', `Scheduled reminder in ${seconds}s (${id})`);
  return id;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await logActivity('notification', 'Cancelled all scheduled notifications');
}

export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
