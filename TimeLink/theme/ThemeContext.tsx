// src/theme/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme, ThemeType } from './theme';

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemColorScheme || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme as 'light' | 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newThemeMode);
    await AsyncStorage.setItem('themeMode', newThemeMode);
  };

  const theme = themeMode === 'light' ? LightTheme : DarkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * ✅ This is the corrected custom hook.
 * It provides access to the full theme object (including `mode`) AND `toggleTheme`.
 */
export const useTheme = (): ThemeType & { toggleTheme: () => void } => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  // This correctly spreads the theme object properties (`colors`, `spacing`, `mode`)
  // and adds the `toggleTheme` function to the return value.
  return { ...context.theme, toggleTheme: context.toggleTheme };
};