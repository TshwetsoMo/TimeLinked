// src/services/users.ts
// This service file handles all interactions with the 'users' collection
// and the 'connections' sub-collection for managing friendships.

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp,
  limit, 
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types';

const usersCol = collection(db, 'users');

/**
 * READ (SINGLE): Get a user's profile from Firestore.
 * This is useful for displaying user info like names and profile pictures.
 * @param userId The ID of the user to fetch.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.warn("User profile not found for ID:", userId);
    return null;
  }
  
  const data = docSnap.data();
  // We need to convert the Firestore Timestamp back to a JS Date object for use in the app.
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();

  return {
    id: docSnap.id,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: createdAt,
  };
}

/**
 * SEARCH: Find users by their exact email address.
 * @param email The email to search for.
 * @param currentUserId The ID of the user performing the search, to exclude them from results.
 */
export async function searchUsersByEmail(email: string, currentUserId: string): Promise<UserProfile[]> {
  const q = query(usersCol, where('email', '==', email.toLowerCase()));
  
  const querySnapshot = await getDocs(q);
  
  const users = querySnapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as UserProfile))
    // Ensure users cannot find themselves in a search.
    .filter(user => user.id !== currentUserId);

  return users;
}

/**
 * ✅ NEW: Get a list of suggested users to display.
 * This fetches a limited number of the most recently created user profiles.
 * @param count The number of suggestions to fetch.
 */
export async function getSuggestedUsers(count: number): Promise<UserProfile[]> {
  // This query gets the latest users who signed up.
  // It requires a single-field index on 'createdAt', which Firestore creates automatically.
  const q = query(usersCol, orderBy('createdAt', 'desc'), limit(count));
  
  const querySnapshot = await getDocs(q);
  
  const users = querySnapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as UserProfile));

  return users;
}

/**
 * READ (CONNECTIONS): Real-time subscription to a user's list of friends.
 * @param userId The current user's ID.
 * @param callback The function to be called with the array of connection UserProfiles.
 */
export function subscribeToConnections(userId: string, callback: (connections: UserProfile[]) => void) {
  const connectionsCol = collection(db, 'users', userId, 'connections');
  
  return onSnapshot(connectionsCol, async (snapshot) => {
    // The snapshot gives us a list of connection documents (which only contain IDs).
    // We need to fetch the full profile for each connection.
    const profilePromises = snapshot.docs.map(d => getUserProfile(d.id));
    const profiles = (await Promise.all(profilePromises)).filter(p => p !== null) as UserProfile[];
    callback(profiles);
  });
}

/**
 * CREATE (CONNECTION): Create a mutual connection between two users.
 * This uses a batch write to ensure the action is atomic (all or nothing).
 * @param currentUserId The ID of the user initiating the request.
 * @param friendId The ID of the user to become friends with.
 */
export async function addConnection(currentUserId: string, friendId: string) {
  const batch = writeBatch(db);

  // Path for the current user's connection sub-collection.
  const currentUserConnectionRef = doc(db, 'users', currentUserId, 'connections', friendId);
  // Path for the friend's connection sub-collection.
  const friendConnectionRef = doc(db, 'users', friendId, 'connections', currentUserId);

  // Add the friend to the current user's list.
  batch.set(currentUserConnectionRef, { connectedAt: Timestamp.now() });
  // Add the current user to the friend's list (making it mutual).
  batch.set(friendConnectionRef, { connectedAt: Timestamp.now() });

  return batch.commit();
}

/**
 * DELETE (CONNECTION): Remove a mutual connection between two users.
 * @param currentUserId The ID of the user initiating the removal.
 * @param friendId The ID of the user to unfriend.
 */
export async function removeConnection(currentUserId: string, friendId: string) {
  const batch = writeBatch(db);

  const currentUserConnectionRef = doc(db, 'users', currentUserId, 'connections', friendId);
  const friendConnectionRef = doc(db, 'users', friendId, 'connections', currentUserId);

  // Remove the friend from the current user's list.
  batch.delete(currentUserConnectionRef);
  // Remove the current user from the friend's list.
  batch.delete(friendConnectionRef);

  return batch.commit();
}