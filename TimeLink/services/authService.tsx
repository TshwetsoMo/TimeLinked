// src/services/auth.ts
// This service handles all authentication and user profile management logic.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * ✅ LOGIN: Signs in an existing user with their email and password.
 */
export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user.uid);
    return userCredential;
  } catch (error: any) {
    console.error("Error logging in:", error.code, error.message);
    throw error;
  }
};

/**
 * ✅ REGISTER: Creates a new user with email and password, and sets up their profile.
 */
export async function registerUser(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      displayName: displayName,
      createdAt: Timestamp.now(),
      photoURL: null,
    });

    console.log("User registered and saved to Firestore:", user.uid);
    return userCredential;
  } catch (error: any) {
    console.error("Error registering:", error.code, error.message);
    throw error;
  }
};

/**
 * ✅ LOGOUT: Signs out the currently authenticated user.
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log("User logged out successfully");
  } catch (error: any) {
    console.error("Error logging out:", error);
    throw error;
  }
};

/**
 * ✅ UPDATE PROFILE: Updates a user's profile information in both Auth and Firestore.
 * This version is robust and prevents 'undefined' values from being sent to Firestore.
 * @param userId The UID of the user to update.
 * @param data An object with the data to update.
 */
export async function updateUserProfile(userId: string, data: { displayName?: string; photoURL?: string | null }) {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
        throw new Error("You can only update your own profile.");
    }

    try {
        // Step 1: Update the Firebase Auth profile.
        // The `updateProfile` function correctly handles `undefined` for fields that aren't being changed.
        await updateProfile(currentUser, {
            displayName: data.displayName,
            photoURL: data.photoURL || undefined, // Auth needs undefined if photoURL is null
        });

        // ✅ FIX IS HERE: Create a "clean" payload for Firestore that excludes 'undefined'.
        const firestorePayload: { [key: string]: any } = {};

        // Only add displayName to the payload if it's actually provided.
        if (data.displayName !== undefined) {
            firestorePayload.displayName = data.displayName;
        }

        // Only add photoURL to the payload if it's provided.
        // Firestore can handle `null` perfectly fine, so we pass it through.
        if (data.photoURL !== undefined) {
            firestorePayload.photoURL = data.photoURL;
        }

        // Step 2: Update the Firestore user document with the clean payload.
        const userDocRef = doc(db, "users", userId);
        
        // This check ensures we don't send an empty update if the data object was malformed.
        if (Object.keys(firestorePayload).length > 0) {
            await updateDoc(userDocRef, firestorePayload);
        }

        console.log("User profile updated successfully for:", userId);
    } catch (error: any) {
        console.error("Error updating profile:", error);
        throw error;
    }
}