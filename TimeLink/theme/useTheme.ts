import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from './colors';

export function useTheme() {
  const scheme = useColorScheme(); // 'light' | 'dark'
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  return { colors, scheme };
}