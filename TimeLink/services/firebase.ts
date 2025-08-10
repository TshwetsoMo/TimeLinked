// src/services/firebase.ts (or config/firebaseConfig.ts)
// This file is the central point for initializing your connection to Firebase.
// It sets up all the core services that the rest of your app will use.

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase project configuration object.
// IMPORTANT: For a production app, it is a strong security best practice
// to store these keys in environment variables rather than hardcoding them.
const firebaseConfig = {
  apiKey: "AIzaSyC5kF5MuO9QLr-fJSELasl8WrMoYElw_9I",
  authDomain: "dv300-classproj2025.firebaseapp.com",
  projectId: "dv300-classproj2025",
  storageBucket: "dv300-classproj2025.appspot.com",
  messagingSenderId: "430663122571",
  appId: "1:430663122571:web:9b57139c29511b317f1e8e",
  measurementId: "G-YFW8CFBN5D"
};


// --- Firebase Initialization ---
// This logic prevents re-initializing the app on hot reloads, which is a
// common issue in development environments like Expo and React Native.
let app;

if (!getApps().length) {
  // If no app is initialized, create the primary instance.
  app = initializeApp(firebaseConfig);
} else {
  // If an app is already initialized, retrieve it to avoid errors.
  app = getApp();
}


// Initialize and export the Firebase services you need.
// These are the singleton instances that will be used throughout your entire application.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);