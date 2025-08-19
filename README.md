# TimeLink — Stay connected, across time and memory

TimeLink is a cross-platform (iOS & Android) React Native app built with Expo and TypeScript. It helps you preserve connection across time through Daily Journals and Scheduled Time Capsules (messages set to arrive at meaningful future moments). The UI is landscape-first and the backend uses Firebase (Auth, Firestore, Storage).

## ✨ Features

Welcome / Onboarding — clean first-run experience with quick access to Register and Login

Authentication — Email/Password via Firebase Auth with persistent sessions

Dashboard (Landscape-first) — split-pane timeline: left list, right details & quick actions

Daily Journal — private entries (CRUD) with timestamps

Time Capsules — compose messages (optionally to a friend), choose future delivery date/time

Smart Flow — after scheduling a capsule, the app replaces the stack to Dashboard

Profile — update display name and photo (Storage upload via expo-image-picker)

Micro-interactions — Reanimated + Moti

Accessibility — sensible contrast, large touch targets, readable typography

## 🧱 Tech Stack

Runtime: Expo SDK 53, React Native 0.79, TypeScript

Navigation: @react-navigation/native + Native Stack

Backend: Firebase (Authentication, Firestore, Storage)

Animations: react-native-reanimated, moti

Media: expo-image-picker

## 📦 Requirements

Node.js LTS recommended (v18 or v20)

Expo Go installed on your device (Android/iOS)

A Firebase project with Auth, Firestore, and Storage enabled

## 🚀 Quick Start

## install dependencies

npm install

## start the dev server (tunnel is most reliable)

npx expo start --tunnel

Scan the QR in Expo Go.

If LAN fails (VPN, firewall), keep using --tunnel.

If you previously installed the legacy global CLI, remove it:

npm uninstall -g expo-cli

## Project Structure 🗂️

/src
/config
firebaseConfig.ts
/context
AuthContext.tsx # or /services/authContext.tsx if you prefer
/navigation
AppNavigation.tsx # exports RootStackParamList + Stack
/screens
WelcomeScreen.tsx
LoginScreen.tsx
RegisterScreen.tsx
DashboardScreen.tsx
JournalScreen.tsx
CreateCapsuleScreen.tsx
Profile.tsx
FriendsList.tsx # (optional)
/services
capsules.ts # createCapsule, updateCapsule, getCapsule...
users.ts # getUserProfile, update user doc...
/theme
ThemeContext.tsx
useTheme.ts
spacing.ts
App.tsx
babel.config.js
package.json

## Firebase Setup 🔐

Create a Firebase project → Add Web App → copy the config → enable Email/Password auth → create a Firestore database (test mode for dev) → enable Storage.

/src/config/firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
apiKey: 'YOUR_API_KEY',
authDomain: 'YOUR_PROJECT.firebaseapp.com',
projectId: 'YOUR_PROJECT',
storageBucket: 'YOUR_PROJECT.appspot.com',
messagingSenderId: '...',
appId: '...'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

In client apps, Firebase config keys are public by design. Keep rules strict.

## 🧭 Navigation Types

/src/navigation/AppNavigation.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import JournalScreen from '../screens/JournalScreen';
import CreateCapsuleScreen from '../screens/CreateCapsuleScreen';
import Profile from '../screens/Profile';
import { NavigationContainer } from '@react-navigation/native';

export type RootStackParamList = {
Welcome: undefined;
Register: undefined;
Login: undefined;
Dashboard: undefined;
Journal: undefined;
CreateCapsule:
| { capsuleId?: string; selectedRecipient?: any }
| undefined;
FriendsList: { asPicker?: boolean } | undefined;
Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
return (
<NavigationContainer>
<Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
<Stack.Screen name="Welcome" component={WelcomeScreen} />
<Stack.Screen name="Register" component={RegisterScreen} />
<Stack.Screen name="Login" component={LoginScreen} />
<Stack.Screen name="Dashboard" component={DashboardScreen} />
<Stack.Screen name="Journal" component={JournalScreen} />
<Stack.Screen name="CreateCapsule" component={CreateCapsuleScreen} />
<Stack.Screen name="Profile" component={Profile} />
</Stack.Navigator>
</NavigationContainer>
);
}

Navigate (typed) examples

// From Welcome → Register
navigation.navigate({ name: 'Register' });

// From Login → Dashboard
navigation.navigate('Dashboard');

// From CreateCapsule → Dashboard (replace so back does not return)
navigation.replace('Dashboard');

## 🗃️ Firestore Data Model

Collections

/users/{uid}
displayName: string
email: string
photoURL?: string
createdAt: Timestamp

/journalEntries/{entryId}
userId: string
content: string
createdAt: Timestamp
mood?: string

/timeCapsules/{capsuleId}
userId: string # sender uid
recipientId: string # recipient uid (or email-derived ID)
title?: string
message: string
deliveryDate: Timestamp
createdAt: Timestamp
status: 'scheduled' | 'delivered'

Delivery timing (MVP): client shows capsules as “available” when deliveryDate <= now.
Production idea: use Cloud Scheduler + Cloud Functions to mark final delivery server-side.

## 🔒 Example Security Rules (Development)

Firestore (lenient for dev — lock down for prod)

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /journalEntries/{id} {
      allow read, write: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
    }

    match /timeCapsules/{id} {
      allow create, update, delete: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;

      allow get, list: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
    }

}
}

Storage (profile photos)

rules_version = '2';
service firebase.storage {
match /b/{bucket}/o {
match /profiles/{uid}.jpg {
allow read: if true; // or restrict by auth
allow write: if request.auth != null && request.auth.uid == uid;
}
}
}

## 🧩 Babel & Reanimated

babel.config.js

module.exports = function (api) {
api.cache(true);
return {
presets: ['babel-preset-expo'],
plugins: [
'react-native-reanimated/plugin', // keep this last
],
};
};

Restart with cache clear after changing Babel:

npx expo start -c

## 🧰 Useful Scripts

package.json

{
"scripts": {
"start": "expo start",
"android": "expo start --android",
"ios": "expo start --ios",
"web": "expo start --web"
}
}

Common commands

# Install matching Expo modules if needed

npx expo install react-native-screens react-native-safe-area-context react-native-reanimated expo-image-picker

# Clear Metro cache

npx expo start -c

# Use tunnel if LAN fails

npx expo start --tunnel

📱 Expo Go Tips

If QR scan doesn’t load the app:

Use tunnel mode.

Ensure phone and computer are on the same Wi-Fi (if using LAN).

Disable VPN/firewall or keep using --tunnel.

Android USB dev:

npx expo start --localhost
adb reverse tcp:8081 tcp:8081

## 🧭 Roadmap (Suggested)

Friends list & invitations

Push notifications for capsule delivery

Voice notes & media attachments (update Storage rules)

Offline-first caching & optimistic UI

Backend scheduled delivery (Cloud Scheduler + Functions)

## 🐛 Troubleshooting

TypeScript “Cannot find module …” → check relative paths and ensure files exist (/navigation/AppNavigation.tsx, /theme/useTheme.ts, etc.)

Reanimated errors/blank screen → confirm Babel plugin and clear cache

Auth “network request failed” → verify Firebase config, device connectivity, and emulator/device network

Expo Go fails to connect → use --tunnel or disable VPN/firewall; remove legacy global CLI

## 📄 License

© 2025 TimeLink. Coursework and personal portfolio use.
