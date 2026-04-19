import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Notifications work only on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6200ee',
    });
  }

  return true;
};

export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
};

export const loadNotificationSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return null;
  }
};

export const scheduleReminderNotification = async (hour, minute, repeatType = 'daily') => {
  try {
    await cancelAllNotifications();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Music Catalog',
        body: 'Время добавить новый альбом или трек в каталог!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log('Notification scheduled with ID:', id);
    return id;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
};

export const scheduleWeeklyNotification = async (dayOfWeek, hour, minute) => {
  try {
    await cancelAllNotifications();

    const validDay = typeof dayOfWeek === 'number' && dayOfWeek >= 1 && dayOfWeek <= 7 ? dayOfWeek : 1;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Music Catalog',
        body: 'Еженедельное напоминание: добавьте новую музыку!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: validDay,
        hour,
        minute,
      },
    });

    return id;
  } catch (error) {
    console.error('Failed to schedule weekly notification:', error.message, error);
    return null;
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
};

export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
};

export const enableNotifications = async (enabled, hour = 12, minute = 0, repeatType = 'daily') => {
  if (!enabled) {
    await cancelAllNotifications();
    await saveNotificationSettings({ enabled: false });
    return { success: true };
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    return { success: false, error: 'No permission' };
  }

  await cancelAllNotifications();

  let notificationId;
  if (repeatType === 'weekly') {
    notificationId = await scheduleWeeklyNotification(1, hour, minute);
  } else {
    notificationId = await scheduleReminderNotification(hour, minute);
  }

  console.log('Scheduled notification, ID:', notificationId);

  await saveNotificationSettings({
    enabled: true,
    hour,
    minute,
    repeatType,
    notificationId: notificationId || null,
  });

  return { success: !!notificationId, notificationId };
};

export default {
  requestPermissions,
  saveNotificationSettings,
  loadNotificationSettings,
  scheduleReminderNotification,
  scheduleWeeklyNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  enableNotifications,
};