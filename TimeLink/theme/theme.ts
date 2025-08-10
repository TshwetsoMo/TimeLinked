// src/theme/index.ts

import { LightColors, DarkColors } from './colors';
import { spacing } from './spacing';

export const LightTheme = {
  colors: LightColors,
  spacing,
  mode: 'light' as const, // 'as const' tells TS this value is literally 'light', not just any string
};

export const DarkTheme = {
  colors: DarkColors,
  spacing,
  mode: 'dark' as const, // 'as const' tells TS this value is literally 'dark'
};

// ✅ FIX: The ThemeType must represent BOTH possible theme structures.
// This allows TypeScript to understand that `mode` can be 'light' OR 'dark'.
export type ThemeType = typeof LightTheme | typeof DarkTheme;