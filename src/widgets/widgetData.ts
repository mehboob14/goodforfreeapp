// Helpers shared by the home-screen widgets. These run inside the widget's
// headless JS task (a separate context from the app UI), so they only touch
// AsyncStorage and the network — no React Native UI APIs.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPosts, Article } from '../api/wordpress';

const SETTINGS_KEY = '@goodforfree/settings/v1';

export interface WidgetSettings {
  accent: string;
  use24Hour: boolean;
  dark: boolean;
}

/** Reads the same settings the in-app UI saves, so widgets match the user's theme. */
export async function getWidgetSettings(): Promise<WidgetSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const s = raw ? JSON.parse(raw) : {};
    return {
      accent: typeof s.accent === 'string' ? s.accent : '#7C5CFF',
      use24Hour: !!s.use24Hour,
      // Settings stores themeMode 'dark' | 'light'; default to dark.
      dark: s.themeMode !== 'light',
    };
  } catch {
    return { accent: '#7C5CFF', use24Hour: false, dark: true };
  }
}

/** Latest published article, used by the article/advertising widgets. */
export async function getLatestArticle(): Promise<Article | null> {
  try {
    const { articles } = await fetchPosts({ perPage: 1, page: 1 });
    return articles[0] ?? null;
  } catch {
    return null;
  }
}

/** Current time + date formatted for the widget. */
export function formatWidgetTime(use24Hour: boolean): { time: string; date: string } {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  }).format(now);
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
  return { time, date };
}

// Shared palette so all widgets look consistent.
export function widgetColors(dark: boolean) {
  return {
    bg: dark ? '#0B0B12' : '#FFFFFF',
    surface: dark ? '#15151F' : '#FFFFFF',
    surfaceAlt: dark ? '#1E1E2C' : '#EFEFF6',
    text: dark ? '#F5F5FA' : '#15151F',
    muted: dark ? '#9A9AB0' : '#6A6A80',
  } as const;
}
