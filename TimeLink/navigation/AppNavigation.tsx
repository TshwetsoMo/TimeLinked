// src/navigation/AppNavigation.tsx
import React from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✅ FIX 2: Ensure the useTheme hook is imported from our custom context file.
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

// ✅ FIX 1: Import the UserProfile type so the navigator knows what it is.
import type { UserProfile } from '../types';

// Import all your screen components
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
import SearchUsersScreen from '../screens/SearchUsersScreen';
import FriendsListScreen from '../screens/FriendsList';
import InboxScreen from '../screens/Inbox';
import FriendsFeedScreen from '../screens/FriendsFeed';
import PublicFeedScreen from '../screens/PublicFeed';


// The complete "map" of all screens and their possible navigation parameters.
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  Journal: undefined;
  CreateJournal: { entryId?: string };
  ReadJournal: { entryId: string };
  CreateCapsule: { capsuleId?: string; selectedRecipient?: UserProfile };
  CapsulesTimeline: undefined;
  OpenCapsule: { capsuleId: string };
  Profile: undefined;
  SearchUsers: undefined;
  FriendsList: { asPicker?: boolean };
  Inbox: undefined;
  FriendsFeed: undefined;
  PublicFeed: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { colors, mode } = useTheme();

  // Dynamically create the navigation theme based on the current app theme mode
  const navTheme = {
    ...(mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
    colors: {
      ...(mode === 'dark' ? NavigationDarkTheme.colors : NavigationDefaultTheme.colors),
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
        // Set up default header styles for a consistent look
        screenOptions={{
          headerStyle: {
            backgroundColor: navTheme.colors.card,
          },
          headerTintColor: navTheme.colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: '',
        }}
      >
        {/* Screens without a visible header */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />

        {/* Screens that will get the default styled header */}
        <Stack.Screen name="Journal" component={JournalScreen} />
        <Stack.Screen name="CreateJournal" component={CreateJournalScreen} options={{ title: 'Journal Entry' }} />
        <Stack.Screen name="ReadJournal" component={ReadJournalScreen} options={{ title: 'Journal Entry' }} />
        <Stack.Screen name="CreateCapsule" component={CreateCapsuleScreen} options={{ title: 'Time Capsule' }} />
        <Stack.Screen name="CapsulesTimeline" component={CapsulesTimelineScreen} options={{ title: 'Sent Capsules' }} />
        <Stack.Screen name="OpenCapsule" component={OpenCapsuleScreen} options={{ title: 'Capsule' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="SearchUsers" component={SearchUsersScreen} options={{ title: 'Find Friends' }} />
        <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Connections' }} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="FriendsFeed" component={FriendsFeedScreen} options={{ title: 'Friends Feed' }} />
        <Stack.Screen name="PublicFeed" component={PublicFeedScreen} options={{ title: 'Explore' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

