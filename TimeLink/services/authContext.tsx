// src/services/authContext.tsx
// This context is the single source of truth for the current user's session.
// It manages the auth state, the user's Firestore profile, and a global loading state.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// We need the `Unsubscribe` type for our cleanup function.
import { onAuthStateChanged, User, Unsubscribe } from 'firebase/auth';
// Import `onSnapshot` and `doc` to create a real-time listener for the user's profile.
import { doc, onSnapshot } from 'firebase/firestore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
// Import both `auth` and `db` from our firebase config.
import { auth, db } from './firebase';
import type { UserProfile } from '../types';

// The shape of the data that our `useAuth` hook will provide.
interface AuthContextProps {
  user: User | null;          // The raw user object from Firebase Auth.
  userProfile: UserProfile | null; // The user's profile data from Firestore.
  loading: boolean;          // True while checking the initial auth state.
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // This is the main effect that manages the user's session.
  useEffect(() => {
    // This variable will hold the cleanup function for our Firestore profile listener.
    let unsubscribeFromProfile: Unsubscribe | undefined;

    // This is the primary listener for Firebase's authentication state (login/logout).
    const unsubscribeFromAuth = onAuthStateChanged(auth, (authUser) => {
      // If a profile listener from a previous user is active, clean it up first.
      if (unsubscribeFromProfile) {
        unsubscribeFromProfile();
      }

      if (authUser) {
        // If a user is logged in, set the basic auth user object immediately.
        setUser(authUser);
        
        // ✅ THE FIX IS HERE: We set up a REAL-TIME listener on the user's profile document.
        // This solves the race condition during registration.
        unsubscribeFromProfile = onSnapshot(doc(db, "users", authUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            // When the document is created or updated, this fires and updates the profile state.
            setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            // This case can happen for a brief moment during registration before the
            // `setDoc` call in `registerUser` completes.
            console.warn(`User profile document not found for ID: ${authUser.uid}`);
            setUserProfile(null);
          }
          // The app is ready to render once we get the first result from our profile listener.
          setLoading(false);
        });
      } else {
        // If the user is logged out, clear all state and stop loading.
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    // This is the main cleanup function. It's called when the app is closed.
    // It ensures we don't have any lingering listeners causing memory leaks.
    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromProfile) {
        unsubscribeFromProfile();
      }
    };
  }, []); // The empty dependency array means this effect runs only once on app startup.

  // While loading, we show a full-screen spinner. This is crucial to prevent the app
  // from navigating or rendering screens before we know if a user is logged in.
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// This custom hook provides easy, type-safe access to the auth context from any component.
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});