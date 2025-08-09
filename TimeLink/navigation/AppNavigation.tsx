// src/navigation/AppNavigator.tsx
import React from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors, Colors } from '../theme/colors';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import JournalScreen from '../screens/JournalScreen';
import CreateJournalScreen from '../screens/CreateJournalScreen';
import CreateCapsuleScreen from '../screens/CreateCapsuleScreen';
import ReadJournalScreen from '../screens/ReadJournalScreen';
import CapsulesTimelineScreen from '../screens/CapsulesTimelineScreen';
import OpenCapsuleScreen from '../screens/OpenCapsuleScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  Journal: undefined;
  CreateJournal: { entryId?: string };
  ReadJournal: { entryId: string };
  CreateCapsule: { capsuleId?: string };
  CapsulesTimeline: undefined;
  OpenCapsule: { capsuleId: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useTheme(); // 'light' | 'dark'
  const colors: Colors = theme === 'dark' ? DarkColors : LightColors;

  // Pick the base nav theme then override colors
  const baseNavTheme = theme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  const navTheme = {
    ...baseNavTheme,
    colors: {
      ...baseNavTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="CreateJournal" component={CreateJournalScreen} />
        <Stack.Screen name="CreateCapsule" component={CreateCapsuleScreen} />
        <Stack.Screen name="ReadJournal" component={ReadJournalScreen} />
        <Stack.Screen name="CapsulesTimeline" component={CapsulesTimelineScreen} />
        <Stack.Screen name="OpenCapsule" component={OpenCapsuleScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}