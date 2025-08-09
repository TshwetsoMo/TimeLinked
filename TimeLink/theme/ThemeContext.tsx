// src/theme/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
}

// 1) Create context with a default; we'll never actually use the default value.
const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

// 2) ThemeProvider is typed as FC so TS knows it returns JSX
export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  // Start from system preference
  const sysScheme = Appearance.getColorScheme() as ThemeType | null;
  const [theme, setTheme] = useState<ThemeType>(sysScheme === 'dark' ? 'dark' : 'light');

  // Listen for system changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      if (colorScheme === 'dark' || colorScheme === 'light') {
        setTheme(colorScheme);
      }
    });
    return () => {
      // @ts-ignore: remove() exists on the subscription
      sub.remove();
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3) Custom hook for consuming the theme
export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};