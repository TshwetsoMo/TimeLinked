// App.tsx
import React from 'react';
import { AuthProvider } from './services/authContext';
//import { ThemeProvider } from './theme/ThemeContext';
import AppNavigator from './navigation/AppNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <AuthProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
    </AuthProvider>
  );
}


