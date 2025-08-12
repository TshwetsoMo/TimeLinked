// src/navigation/AppNavigation.tsx
import React from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import the hooks that will control the navigator's state.
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../services/authContext';
import type { UserProfile } from '../types';

// Import all screen components.
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

// This is the single source of truth for ALL possible screens and their parameters in the entire app.
// Both the authenticated and unauthenticated stacks will use this type definition.
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

// This functional component defines the stack of screens accessible ONLY when the user is logged OUT.
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// This functional component defines the stack of screens accessible ONLY when the user is logged IN.
function AppStack({ navTheme }: { navTheme: any }) {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
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
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
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
  );
}

// This is the main navigator component. It is now the single source of truth for routing logic.
export default function AppNavigator() {
  // Get the current theme and the current user from their respective global contexts.
  const { colors, mode } = useTheme();
  const { user } = useAuth();

  // Dynamically create the navigation theme based on the current app theme mode (light/dark).
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
      {/* 
        This is the most important part of the fix.
        We conditionally render the correct stack based on the user's login state.
        If a `user` object exists, the entire <AppStack /> is rendered.
        If `user` is null, the entire <AuthStack /> is rendered.
        This completely prevents the "stuck on logout" bug by ensuring the Dashboard is
        fully unmounted the instant a user logs out.
      */}
      {user ? <AppStack navTheme={navTheme} /> : <AuthStack />}
    </NavigationContainer>
  );
}

