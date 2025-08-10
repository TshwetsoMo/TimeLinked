// App.tsx
import React from 'react';
import { AuthProvider } from './services/authContext';
import { ThemeProvider } from './theme/ThemeContext'; // ✅ Import the new provider
import AppNavigator from './navigation/AppNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider> 
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}


