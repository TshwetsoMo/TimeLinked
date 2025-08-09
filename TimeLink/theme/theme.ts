import { LightColors, DarkColors } from './colors';
import { spacing } from './spacing';

export const LightTheme = {
  colors: LightColors,
  spacing,
  mode: 'light' as const,
};

export const DarkTheme = {
  colors: DarkColors,
  spacing,
  mode: 'dark' as const,
};

export type ThemeType = typeof LightTheme;