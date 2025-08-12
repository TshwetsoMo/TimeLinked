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
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.warn("User profile not found for ID:", userId);
    return null;
  }
  const data = docSnap.data();
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
 */
export async function searchUsersByEmail(email: string, currentUserId: string): Promise<UserProfile[]> {
  const q = query(usersCol, where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as UserProfile))
    .filter(user => user.id !== currentUserId);
}

/**
 * GET SUGGESTIONS: Get a list of suggested users to display.
 */
export async function getSuggestedUsers(count: number): Promise<UserProfile[]> {
  const q = query(usersCol, orderBy('createdAt', 'desc'), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
}

// --- NEW FRIEND REQUEST SYSTEM FUNCTIONS ---

/**
 * SEND REQUEST: Creates a pending friend request.
 */
export async function sendFriendRequest(senderId: string, recipientId: string) {
  const batch = writeBatch(db);
  const outgoingRef = doc(db, 'users', senderId, 'outgoingFriendRequests', recipientId);
  batch.set(outgoingRef, { createdAt: Timestamp.now() });
  const incomingRef = doc(db, 'users', recipientId, 'incomingFriendRequests', senderId);
  batch.set(incomingRef, { createdAt: Timestamp.now() });
  return batch.commit();
}

/**
 * ACCEPT REQUEST: Accepts an incoming friend request.
 */
export async function acceptFriendRequest(currentUserId: string, senderId: string) {
  const batch = writeBatch(db);
  const currentUserConnectionRef = doc(db, 'users', currentUserId, 'connections', senderId);
  batch.set(currentUserConnectionRef, { connectedAt: Timestamp.now() });
  const senderConnectionRef = doc(db, 'users', senderId, 'connections', currentUserId);
  batch.set(senderConnectionRef, { connectedAt: Timestamp.now() });
  const incomingRef = doc(db, 'users', currentUserId, 'incomingFriendRequests', senderId);
  batch.delete(incomingRef);
  const outgoingRef = doc(db, 'users', senderId, 'outgoingFriendRequests', currentUserId);
  batch.delete(outgoingRef);
  return batch.commit();
}

/**
 * REJECT/CANCEL REQUEST: Rejects an incoming request or cancels an outgoing one.
 */
export async function rejectFriendRequest(currentUserId: string, otherUserId: string) {
  const batch = writeBatch(db);
  const incomingRef = doc(db, 'users', currentUserId, 'incomingFriendRequests', otherUserId);
  batch.delete(incomingRef);
  const outgoingRef = doc(db, 'users', otherUserId, 'outgoingFriendRequests', currentUserId);
  batch.delete(outgoingRef);
  return batch.commit();
}

// --- REAL-TIME LISTENERS (SUBSCRIPTIONS) ---

/**
 * READ (CONNECTIONS): Real-time subscription to a user's list of established friends.
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
 */
export async function removeConnection(currentUserId: string, friendId: string) {
  const batch = writeBatch(db);
  const currentUserConnectionRef = doc(db, 'users', currentUserId, 'connections', friendId);
  const friendConnectionRef = doc(db, 'users', friendId, 'connections', currentUserId);
  batch.delete(currentUserConnectionRef);
  batch.delete(friendConnectionRef);
  return batch.commit();
}