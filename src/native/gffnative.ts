import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// JS wrapper around the local `gffnative` Android module (widget pinning +
// launcher helpers). Guarded so it's a safe no-op on iOS, web, and Expo Go,
// where the native module doesn't exist.
const isAvailable =
  Platform.OS === 'android' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export const gffNativeAvailable = isAvailable;

let cached: any | null | undefined;
function mod(): any | null {
  if (!isAvailable) return null;
  if (cached !== undefined) return cached;
  try {
    // Lazy require so the native module is only touched in a real Android build.
    cached = require('../../modules/gffnative/src/GffnativeModule').default;
  } catch {
    cached = null;
  }
  return cached;
}

export interface InstalledApp {
  packageName: string;
  label: string;
  icon: string | null;
}

export function isPinSupported(): boolean {
  const m = mod();
  try {
    return !!m?.isPinSupported();
  } catch {
    return false;
  }
}

export function pinWidget(name: 'Clock' | 'Featured' | 'ClockFeatured'): boolean {
  const m = mod();
  try {
    return !!m?.pinWidget(name);
  } catch {
    return false;
  }
}

export function isDefaultLauncher(): boolean {
  const m = mod();
  try {
    return !!m?.isDefaultLauncher();
  } catch {
    return false;
  }
}

export function openHomeSettings(): void {
  const m = mod();
  try {
    m?.openHomeSettings();
  } catch {
    // ignore
  }
}

export function launchApp(packageName: string): boolean {
  const m = mod();
  try {
    return !!m?.launchApp(packageName);
  } catch {
    return false;
  }
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  const m = mod();
  if (!m) return [];
  try {
    return (await m.getInstalledApps()) as InstalledApp[];
  } catch {
    return [];
  }
}
