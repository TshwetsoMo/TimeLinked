// src/services/authContext.tsx
// This context is the single source of truth for the current user's session.
// It manages the auth state, the user's Firestore profile, and a global loading state.

import React, { createContext, useContext, useEffect, useState, ReactNode, FC } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // For the loading spinner
import { auth } from './firebase';
import { getUserProfile } from './users'; // Import the function to get profile data
import type { UserProfile } from '../types'; // Import the UserProfile type

// The new shape of the data provided by our context
interface AuthContextProps {
  user: User | null; // The raw user object from Firebase Auth
  userProfile: UserProfile | null; // The user's profile data from Firestore
  loading: boolean; // True while checking auth state and fetching the profile
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // User is signed in.
        setUser(authUser);
        // Now, fetch their profile from Firestore.
        const profile = await getUserProfile(authUser.uid);
        setUserProfile(profile);
      } else {
        // User is signed out.
        setUser(null);
        setUserProfile(null);
      }
      // Finished checking auth and fetching profile, no longer loading.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // While loading, we can show a full-screen spinner to prevent the app
  // from rendering a "logged out" state before the check is complete.
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

// Custom hook to easily access the auth context
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