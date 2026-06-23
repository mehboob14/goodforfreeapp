import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPosts } from '../api/wordpress';

const LAST_SEEN_KEY = '@goodforfree/lastSeenArticleId';

// How notifications behave when one arrives while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // shouldShowAlert is required by older type defs; banner/list are the newer
    // (SDK 52+) replacements. Including all keeps it correct across versions.
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask the OS for notification permission. Returns true if granted.
 * Safe to call repeatedly — it won't re-prompt once decided.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    // Notifications don't work on simulators/emulators in a meaningful way,
    // but we don't want to hard-fail the UI.
    console.warn('Notifications require a physical device.');
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'GoodForFree',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C5CFF',
    });
  }

  return status === 'granted';
}

/**
 * Get the Expo push token for THIS device. Send this to your server to deliver
 * remote push notifications via Expo's push service. Returns null if unavailable.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      // @ts-ignore - older config shape
      Constants?.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return token.data;
  } catch (e) {
    console.warn('Could not get push token', e);
    return null;
  }
}

/** Fire a local notification immediately — handy for testing the pipeline. */
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'GoodForFree',
      body: 'Notifications are working 🎉',
      data: { type: 'test' },
    },
    trigger: null, // null = deliver now
  });
}

/**
 * Polls the WP API for the newest article and, if it's newer than the last one
 * we told the user about, fires a local notification. Call this on app launch
 * or from a background task. Returns the article id if it notified.
 */
export async function checkForNewArticlesAndNotify(): Promise<number | null> {
  try {
    const { articles } = await fetchPosts({ perPage: 1, page: 1 });
    const latest = articles[0];
    if (!latest) return null;

    const lastSeenRaw = await AsyncStorage.getItem(LAST_SEEN_KEY);
    const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : 0;

    if (latest.id > lastSeen) {
      await AsyncStorage.setItem(LAST_SEEN_KEY, String(latest.id));
      // Don't notify on the very first run (no baseline yet).
      if (lastSeen !== 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'New on GoodForFree',
            body: latest.title,
            data: { type: 'article', articleId: latest.id },
          },
          trigger: null,
        });
        return latest.id;
      }
    }
    return null;
  } catch (e) {
    console.warn('checkForNewArticlesAndNotify failed', e);
    return null;
  }
}
