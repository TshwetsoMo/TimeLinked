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
 * @param email The user's email address.
 * @param password The user's password.
 */
export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user.uid);
    return userCredential;
  } catch (error: any) {
    console.error("Error logging in:", error.code, error.message);
    // Re-throw the error so the UI layer can handle it (e.g., show an alert)
    throw error;
  }
};

/**
 * ✅ REGISTER: Creates a new user with email and password, and sets up their profile.
 * @param email The new user's email address.
 * @param password The new user's chosen password.
 * @param displayName The new user's chosen display name.
 */
export async function registerUser(email: string, password: string, displayName: string) {
  try {
    // Step 1: Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Update the new user's Auth profile with their display name
    await updateProfile(user, { displayName });

    // Step 3: Create a corresponding user document in Firestore
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      displayName: displayName,
      createdAt: Timestamp.now(), // Use Firestore's timestamp for consistency
      photoURL: null, // Initialize photoURL as null
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
 * @param userId The UID of the user to update.
 * @param data An object with the data to update (e.g., { displayName: 'New Name' }).
 */
export async function updateUserProfile(userId: string, data: { displayName?: string; photoURL?: string }) {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
        throw new Error("You can only update your own profile.");
    }

    try {
        // Update the Firebase Auth profile
        await updateProfile(currentUser, data);

        // Update the Firestore user document
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDoc.ref, data);

        console.log("User profile updated successfully for:", userId);
    } catch (error: any) {
        console.error("Error updating profile:", error);
        throw error;
    }
}