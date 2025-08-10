// src/navigation/AppNavigation.tsx
import React from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/useTheme'; // Make sure this path is correct
import { LightColors, DarkColors, Colors } from '../theme/colors';

// Import all your screens, including the new one
import WelcomeScreen from '../screens/Welcome';
import LoginScreen from '../screens/Login';
import SignUpScreen from '../screens/SignUp';
import DashboardScreen from '../screens/Dashboard';
import JournalScreen from '../screens/Journal';
import CreateJournalScreen from '../screens/CreateJournal';
import CreateCapsuleScreen from '../screens/CreateCapsule';
import ReadJournalScreen from '../screens/ReadJournal';
import CapsulesTimelineScreen from '../screens/CapsulesTimeline';
import OpenCapsuleScreen from '../screens/OpenCapsule';
import ProfileScreen from '../screens/Profile';
import SearchUsersScreen from '../screens/SearchUsersScreen'; // ✅ 1. Import the new screen
import FriendsListScreen from '../screens/FriendsList';
import InboxScreen from '../screens/Inbox';
import FriendsFeedScreen from '../screens/FriendsFeed';
import PublicFeedScreen from '../screens/PublicFeed';

// This is the "map" that TypeScript is checking. We must add our new route here.
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  Journal: undefined;
  CreateJournal: { entryId?: string };
  ReadJournal: { entryId: string };
  CreateCapsule: { capsuleId?: string; selectedRecipient?: UserProfile }; // Make sure to add selectedRecipient here too!
  CapsulesTimeline: undefined;
  OpenCapsule: { capsuleId: string };
  Profile: undefined;
  SearchUsers: undefined; // ✅ 2. Add the new route to the type definition
  FriendsList: { asPicker?: boolean };
  Inbox: undefined;
  FriendsFeed: undefined;
  PublicFeed: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { colors, mode } = useTheme(); // Use `mode` as we defined in the new ThemeContext

  const baseNavTheme = mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
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
        {/* ✅ 3. Add the screen component to the navigator stack */}
        <Stack.Screen name="SearchUsers" component={SearchUsersScreen} /> 
        <Stack.Screen name="FriendsList" component={FriendsListScreen} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="FriendsFeed" component={FriendsFeedScreen} />
        <Stack.Screen name="PublicFeed" component={PublicFeedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

