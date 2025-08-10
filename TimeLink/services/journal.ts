// src/services/journal.ts
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { JournalEntry } from '../types';

const journalCol = collection(db, 'journalEntries');

/** Helper function to convert a Firestore doc to a JournalEntry object */
const toJournalEntry = (docSnap: QueryDocumentSnapshot<DocumentData>): JournalEntry => {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    userId: d.userId,
    content: d.content,
    mood: d.mood ?? null,
    visibility: d.visibility ?? 'private', // Default to private if not set
    createdAt: (d.createdAt as Timestamp).toDate(),
  };
};

/**
 * ✅ CREATE: Create a new journal entry with a specific visibility.
 * @param userId The ID of the user creating the entry.
 * @param content The text content of the journal.
 * @param visibility The privacy setting for the entry.
 * @param mood An optional mood score.
 */
export function createJournalEntry(
  userId: string,
  content: string,
  visibility: 'private' | 'friends' | 'public',
  mood?: number
) {
  return addDoc(journalCol, {
    userId,
    content,
    visibility,
    mood: mood ?? null,
    createdAt: Timestamp.now(),
  });
}

/**
 * ✅ UPDATE: Update an existing journal entry's content, mood, or visibility.
 * @param id The ID of the journal entry to update.
 * @param data The partial data to update.
 */
export function updateJournalEntry(
  id: string,
  data: Partial<Pick<JournalEntry, 'content' | 'mood' | 'visibility'>>
) {
  const docRef = doc(db, 'journalEntries', id);
  return updateDoc(docRef, data);
}

/**
 * ✅ DELETE: Delete a journal entry.
 * @param id The ID of the journal entry to delete.
 */
export function deleteJournalEntry(id: string) {
  const docRef = doc(db, 'journalEntries', id);
  return deleteDoc(docRef);
}

/**
 * ✅ READ (SINGLE): Get a single journal entry by its ID.
 * @param entryId The ID of the entry to fetch.
 */
export async function getJournalEntry(entryId: string): Promise<JournalEntry | null> {
  const docRef = doc(db, 'journalEntries', entryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const d = docSnap.data();
  return {
    id: docSnap.id,
    userId: d.userId,
    content: d.content,
    mood: d.mood ?? null,
    visibility: d.visibility ?? 'private',
    createdAt: (d.createdAt as Timestamp).toDate(),
  };
}

/**
 * ✅ READ (PERSONAL): Real-time subscription to the current user's OWN journal entries.
 * @param userId The current user's ID.
 * @param callback The function to call with the array of entries.
 */
export function subscribeToMyJournalEntries(
  userId: string,
  callback: (entries: JournalEntry[]) => void
) {
  const q = query(
    journalCol,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(toJournalEntry);
    callback(data);
  });
}

/**
 * ✅ READ (PUBLIC FEED): Real-time subscription to all PUBLIC journal entries.
 * For the "Explore" or public feed screen.
 * @param callback The function to call with the array of public entries.
 */
export function subscribeToPublicFeed(
  callback: (entries: JournalEntry[]) => void
) {
  const q = query(
    journalCol,
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(50) // IMPORTANT: Always limit public queries to prevent high costs.
  );
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(toJournalEntry);
    callback(data);
  });
}

/**
 * ✅ READ (FRIENDS FEED): Real-time subscription to entries from a list of friends.
 * @param friendIds An array of user IDs corresponding to the current user's friends.
 * @param callback The function to call with the array of friends' entries.
 */
export function subscribeToFriendsFeed(
  friendIds: string[],
  callback: (entries: JournalEntry[]) => void
) {
  // Firestore 'in' queries are limited to 10 items in the array.
  // If a user has more than 10 friends, you would need to run multiple queries.
  // This implementation is for users with 10 or fewer friends.
  if (friendIds.length === 0) {
    callback([]);
    return () => {}; // Return an empty unsubscribe function
  }

  const q = query(
    journalCol,
    where('userId', 'in', friendIds),
    where('visibility', '==', 'friends'),
    orderBy('createdAt', 'desc'),
    limit(50) // Also a good idea to limit this query
  );

  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(toJournalEntry);
    callback(data);
  });
}


/**
 * ✅ READ (PAGINATED): Paginated fetch of the current user's OWN journal entries.
 * @param userId The current user's ID.
 * @param limitCount The number of entries to fetch per page.
 * @param lastDoc The last document from the previous page.
 */
export async function fetchMyJournalEntriesPaginated(
  userId: string,
  limitCount: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  entries: JournalEntry[];
  lastVisible?: QueryDocumentSnapshot<DocumentData>;
}> {
  let q = query(
    journalCol,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const entries: JournalEntry[] = snapshot.docs.map(toJournalEntry);
  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

  return { entries, lastVisible };
}