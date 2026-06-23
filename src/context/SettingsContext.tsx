import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { buildTheme, Theme, ThemeMode } from '../theme/themes';
import { refreshAllWidgets } from '../widgets/refreshWidgets';

// Everything the user can customize lives here and is persisted to disk.
export interface Settings {
  themeMode: ThemeMode;
  followSystemTheme: boolean;
  accent: string;
  clockType: 'digital' | 'analog';
  use24Hour: boolean;
  showSeconds: boolean;
  showDate: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  themeMode: 'dark',
  followSystemTheme: false,
  accent: '#7C5CFF',
  clockType: 'digital',
  use24Hour: false,
  showSeconds: true,
  showDate: true,
  notificationsEnabled: false,
};

const STORAGE_KEY = '@goodforfree/settings/v1';

interface SettingsContextValue {
  settings: Settings;
  theme: Theme;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [systemScheme, setSystemScheme] = useState<ThemeMode>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
  );

  // Load persisted settings on first mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
      } catch (e) {
        // Corrupt storage just falls back to defaults.
        console.warn('Failed to load settings', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Track OS light/dark changes for "follow system" mode.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  // Persist whenever settings change (after initial load).
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((e) =>
      console.warn('Failed to save settings', e)
    );
    // Keep any home-screen widgets in sync with the chosen theme/accent.
    // No-op on iOS, web, and Expo Go.
    refreshAllWidgets();
  }, [settings, ready]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const effectiveMode: ThemeMode = settings.followSystemTheme
    ? systemScheme
    : settings.themeMode;

  const theme = useMemo(
    () => buildTheme(effectiveMode, settings.accent),
    [effectiveMode, settings.accent]
  );

  const value = useMemo(
    () => ({ settings, theme, ready, update, reset }),
    [settings, theme, ready, update, reset]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
