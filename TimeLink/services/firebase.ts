// src/services/firebase.ts (Guaranteed Fallback Version - SECURE)

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ✅ The firebaseConfig object now reads its values from your private .env file.
// It contains no hardcoded secrets and is safe to commit to GitHub.
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Firebase Initialization (Unchanged) ---
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// ✅ This basic initialization will work with any version of the Firebase package.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);