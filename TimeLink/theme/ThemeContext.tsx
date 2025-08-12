// src/theme/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme, ThemeType } from './index';

// The shape of the data stored in the actual context provider
interface ThemeContextValue {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemColorScheme || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme);
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
 * ✅ THE FIX IS HERE.
 * This is the custom hook that all your components will use.
 * It returns a "flattened" object for easier use.
 */
export const useTheme = (): ThemeType & { toggleTheme: () => void } => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  // This takes the `theme` object (which contains colors, spacing, mode)
  // and spreads its properties onto the top level of the return value,
  // then adds the `toggleTheme` function.
  // The result is an object like: { colors, spacing, mode, toggleTheme }
  return {
    ...context.theme,
    toggleTheme: context.toggleTheme,
  };
};