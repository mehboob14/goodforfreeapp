// Central place for colors so the whole app can be re-skinned from Settings.

export type ThemeMode = 'dark' | 'light';

export interface Theme {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string; // overridden by the user-picked accent color
}

export const ACCENT_CHOICES = [
  '#7C5CFF', // violet
  '#3DDC97', // green
  '#FF6B6B', // red
  '#22A7F0', // blue
  '#FFB020', // amber
  '#FF7AC6', // pink
];

const darkBase: Omit<Theme, 'accent'> = {
  mode: 'dark',
  background: '#0B0B12',
  surface: '#15151F',
  surfaceAlt: '#1E1E2C',
  text: '#F5F5FA',
  textMuted: '#9A9AB0',
  border: '#2A2A3A',
};

const lightBase: Omit<Theme, 'accent'> = {
  mode: 'light',
  background: '#F6F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEFF6',
  text: '#15151F',
  textMuted: '#6A6A80',
  border: '#E2E2EC',
};

export function buildTheme(mode: ThemeMode, accent: string): Theme {
  const base = mode === 'dark' ? darkBase : lightBase;
  return { ...base, accent };
}
