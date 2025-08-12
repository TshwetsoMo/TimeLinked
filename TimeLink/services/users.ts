// src/services/users.ts
// This service file handles all interactions with the 'users' collection,
// managing profiles, connections, and the friend request system.

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
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
 * GET SUGGESTIONS: Get a list of suggested users to display on the search screen.
 * @param count The number of suggestions to fetch.
 */
export async function getSuggestedUsers(count: number): Promise<UserProfile[]> {
  // This query gets the latest users who signed up.
  const q = query(usersCol, orderBy('createdAt', 'desc'), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
}

// --- Friend Request System Functions ---

/**
 * SEND REQUEST: Creates a pending friend request.
 * Creates an outgoing request for the sender and an incoming request for the recipient.
 * @param senderId The current user's ID.
 * @param recipientId The ID of the user to send the request to.
 */
export async function sendFriendRequest(senderId: string, recipientId: string) {
  // A batch write ensures both documents are created successfully, or neither is.
  const batch = writeBatch(db);
  const outgoingRef = doc(db, 'users', senderId, 'outgoingFriendRequests', recipientId);
  const incomingRef = doc(db, 'users', recipientId, 'incomingFriendRequests', senderId);

  batch.set(outgoingRef, { createdAt: Timestamp.now() });
  batch.set(incomingRef, { createdAt: Timestamp.now() });

  return batch.commit();
}

/**
 * ACCEPT REQUEST: Accepts an incoming friend request.
 * This function creates the mutual connection and deletes the pending requests.
 * @param currentUserId The ID of the user accepting the request.
 * @param senderId The ID of the user who sent the request.
 */
export async function acceptFriendRequest(currentUserId: string, senderId: string) {
  const batch = writeBatch(db);

  // 1. Create the mutual connection documents in the 'connections' sub-collection.
  const currentUserConnectionRef = doc(db, 'users', currentUserId, 'connections', senderId);
  batch.set(currentUserConnectionRef, { connectedAt: Timestamp.now() });
  const senderConnectionRef = doc(db, 'users', senderId, 'connections', currentUserId);
  batch.set(senderConnectionRef, { connectedAt: Timestamp.now() });

  // 2. Atomically delete the request documents from both users.
  const incomingRef = doc(db, 'users', currentUserId, 'incomingFriendRequests', senderId);
  batch.delete(incomingRef);
  const outgoingRef = doc(db, 'users', senderId, 'outgoingFriendRequests', currentUserId);
  batch.delete(outgoingRef);

  return batch.commit();
}

/**
 * REJECT/CANCEL REQUEST: Rejects an incoming request or cancels an outgoing one.
 * @param currentUserId The ID of the current user.
 * @param otherUserId The ID of the other user involved in the request.
 */
export async function rejectFriendRequest(currentUserId: string, otherUserId: string) {
  const batch = writeBatch(db);

  // Delete the incoming request (if it exists on your end).
  const incomingRef = doc(db, 'users', currentUserId, 'incomingFriendRequests', otherUserId);
  batch.delete(incomingRef);

  // Delete the outgoing request (if it exists on their end).
  const outgoingRef = doc(db, 'users', otherUserId, 'outgoingFriendRequests', currentUserId);
  batch.delete(outgoingRef);

  return batch.commit();
}

// --- Real-time Listeners (Subscriptions) ---

/**
 * READ (CONNECTIONS): Real-time subscription to a user's list of established friends.
 * @param userId The current user's ID.
 * @param callback The function to call with the array of friend profiles.
 */
export function subscribeToConnections(userId: string, callback: (connections: UserProfile[]) => void) {
  const connectionsCol = collection(db, 'users', userId, 'connections');
  return onSnapshot(connectionsCol, async (snapshot) => {
    const profilePromises = snapshot.docs.map(d => getUserProfile(d.id));
    const profiles = (await Promise.all(profilePromises)).filter(p => p !== null) as UserProfile[];
    callback(profiles);
  });
}

/**
 * READ (INCOMING REQUESTS): Real-time subscription to a user's incoming friend requests.
 * @param userId The current user's ID.
 * @param callback The function to call with the profiles of users who sent requests.
 */
export function subscribeToIncomingFriendRequests(userId: string, callback: (profiles: UserProfile[]) => void) {
  const requestsCol = collection(db, 'users', userId, 'incomingFriendRequests');
  return onSnapshot(requestsCol, async (snapshot) => {
    const profilePromises = snapshot.docs.map(d => getUserProfile(d.id));
    const profiles = (await Promise.all(profilePromises)).filter(p => p !== null) as UserProfile[];
    callback(profiles);
});
}

/**
 * READ (OUTGOING REQUESTS): Real-time subscription to a user's sent friend requests.
 * @param userId The current user's ID.
 * @param callback The function to call with the profiles of users you have sent requests to.
 */
export function subscribeToOutgoingFriendRequests(userId: string, callback: (profiles: UserProfile[]) => void) {
  const requestsCol = collection(db, 'users', userId, 'outgoingFriendRequests');
  return onSnapshot(requestsCol, async (snapshot) => {
    const profilePromises = snapshot.docs.map(d => getUserProfile(d.id));
    const profiles = (await Promise.all(profilePromises)).filter(p => p !== null) as UserProfile[];
    callback(profiles);
  });
}

// --- Connection Management ---

/**
 * DELETE (CONNECTION): Removes a mutual connection between two users.
 * @param currentUserId The ID of the user initiating the removal.
 * @param friendId The ID of the user to unfriend.
 */
export async function removeConnection(currentUserId: string, friendId: string) {
  const batch = writeBatch(db);
  const currentUserConnectionRef = doc(db, 'users', currentUserId, 'connections', friendId);
  const friendConnectionRef = doc(db, 'users', friendId, 'connections', currentUserId);

  batch.delete(currentUserConnectionRef);
  batch.delete(friendConnectionRef);

  return batch.commit();
}