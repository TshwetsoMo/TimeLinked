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
} from 'firebase/firestore';
import { db } from './firebase';
import type { JournalEntry } from '../types';

const journalCol = collection(db, 'journalEntries');

// ✅ CREATE
export function createJournalEntry(userId: string, content: string, mood: number) {
  return addDoc(journalCol, {
    userId,
    content,
    mood,
    createdAt: new Date(),
  });
}

// ✅ UPDATE
export function updateJournalEntry(id: string, content: string, mood: number) {
  const docRef = doc(db, 'journalEntries', id);
  return updateDoc(docRef, { content, mood });
}

// ✅ DELETE
export function deleteJournalEntry(id: string) {
  const docRef = doc(db, 'journalEntries', id);
  return deleteDoc(docRef);
}

// ✅ GET SINGLE ENTRY
export async function getJournalEntry(entryId: string): Promise<JournalEntry | null> {
  const docRef = doc(db, 'journalEntries', entryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    content: data.content,
    mood: data.mood,
    userId: data.userId,
    createdAt: data.createdAt.toDate?.() ?? new Date(data.createdAt),
  };
}

export function subscribeToJournalEntries(
  userId: string,
  callback: (entries: JournalEntry[]) => void
) {
  const q = query(
    journalCol,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<JournalEntry, 'id'>),
      createdAt: (docSnap.data().createdAt as any).toDate(),
    }));
    callback(data);
  });
}

// ✅ NEW: Paginated fetch of journal entries
export async function fetchJournalEntriesPaginated(
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
    q = query(
      journalCol,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(limitCount)
    );
  }

  const snapshot = await getDocs(q);

  const entries: JournalEntry[] = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<JournalEntry, 'id'>),
    createdAt: (docSnap.data().createdAt as any).toDate(),
  }));

  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { entries, lastVisible };
}