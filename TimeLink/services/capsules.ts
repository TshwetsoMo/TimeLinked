// src/services/capsules.ts
import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  startAfter,
  limit,
  getDocs,
  Timestamp,
  DocumentData,
  doc,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Capsule } from '../types';

const capsulesCol = collection(db, 'timeCapsules');

/** Helper function to consistently convert a Firestore doc to a Capsule object */
const toCapsule = (docSnap: QueryDocumentSnapshot<DocumentData>): Capsule => {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    userId: d.userId,
    recipientId: d.recipientId,
    message: d.message,
    title: d.title ?? null,
    deliveryDate: (d.deliveryDate as Timestamp).toDate(),
    isDelivered: d.isDelivered, // Represents if the capsule is unlocked and read
    createdAt: (d.createdAt as Timestamp).toDate(),
  };
};

/**
 * ✅ CREATE: Create a new time capsule to be sent to another user.
 * @param userId The ID of the user sending the capsule.
 * @param recipientId The ID of the user who will receive the capsule.
 * @param message The content of the capsule.
 * @param deliveryDate The future date when the capsule becomes visible.
 * @param title An optional title for the capsule.
 */
export function createCapsule(
  userId: string,
  recipientId: string,
  message: string,
  deliveryDate: Date,
  title?: string
) {
  return addDoc(capsulesCol, {
    userId,
    recipientId,
    message,
    deliveryDate: Timestamp.fromDate(deliveryDate),
    title: title ?? null,
    isDelivered: false,
    createdAt: Timestamp.now(),
  });
}

/**
 * ✅ READ (SENT): Real-time subscription to capsules a user has SENT.
 * This is for a user's "Timeline" or "Sent Items" screen.
 * @param userId The current user's ID.
 * @param callback The function to call with the array of sent capsules.
 */
export function subscribeToSentCapsules(
  userId: string,
  callback: (capsules: Capsule[]) => void
) {
  const q = query(
    capsulesCol,
    where('userId', '==', userId),
    orderBy('deliveryDate', 'asc')
  );
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(toCapsule);
    callback(data);
  });
}

/**
 * ✅ READ (RECEIVED): Real-time subscription to capsules a user has RECEIVED that are ready to be opened.
 * This is for the user's "Inbox" screen.
 * @param recipientId The current user's ID.
 * @param callback The function to call with the array of unlocked, received capsules.
 */
export function subscribeToReceivedCapsules(
  recipientId: string,
  callback: (capsules: Capsule[]) => void
) {
  const q = query(
    capsulesCol,
    where('recipientId', '==', recipientId),
    // OPTIMIZATION: Filter by date in Firestore to only download unlocked capsules.
    where('deliveryDate', '<=', new Date()),
    orderBy('deliveryDate', 'desc') // Show most recent unlocked capsules first
  );

  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(toCapsule);
    callback(data);
  });
}


/**
 * ✅ READ (SINGLE): Fetch a single capsule by its ID.
 * @param id The document ID of the capsule.
 */
export async function getCapsule(id: string): Promise<Capsule | null> {
  const ref = doc(db, 'timeCapsules', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    id: snap.id,
    userId: d.userId,
    recipientId: d.recipientId,
    message: d.message,
    title: d.title ?? null,
    deliveryDate: (d.deliveryDate as Timestamp).toDate(),
    isDelivered: d.isDelivered,
    createdAt: (d.createdAt as Timestamp).toDate(),
  };
}

/**
 * ✅ UPDATE: Update fields on an existing capsule.
 * Should only be allowed by the sender before the delivery date. (Enforce with security rules).
 * @param capsuleId The ID of the capsule to update.
 * @param data The fields to update.
 */
export function updateCapsule(
  capsuleId: string,
  data: Partial<
    Pick<Capsule, 'title' | 'recipientId' | 'message' | 'deliveryDate'>
  >
) {
  const ref = doc(db, 'timeCapsules', capsuleId);
  const payload: any = { ...data };
  if (data.deliveryDate) {
      payload.deliveryDate = Timestamp.fromDate(data.deliveryDate);
  }
  return updateDoc(ref, payload);
}

/**
 * ✅ DELETE: Delete a capsule.
 * Should only be allowed by the sender. (Enforce with security rules).
 * @param capsuleId The ID of the capsule to delete.
 */
export function deleteCapsule(capsuleId: string) {
  const ref = doc(db, 'timeCapsules', capsuleId);
  return deleteDoc(ref);
}

/**
 * ✅ UPDATE (STATE): Mark a capsule as read/opened by the recipient.
 * @param capsuleId The ID of the capsule to mark as read.
 */
export function markCapsuleAsRead(capsuleId: string) {
  const ref = doc(db, 'timeCapsules', capsuleId);
  return updateDoc(ref, { isDelivered: true });
}

/**
 * ✅ READ (PAGINATED): Paginated fetch of SENT capsules.
 * Useful for long timelines to improve performance.
 * @param userId The current user's ID.
 * @param pageSize The number of capsules to fetch per page.
 * @param startAfterDoc The last document from the previous page.
 */
export async function fetchSentCapsulesPaginated(
  userId: string,
  pageSize: number,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  capsules: Capsule[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
}> {
  let q = query(
    capsulesCol,
    where('userId', '==', userId),
    orderBy('deliveryDate', 'asc'),
    limit(pageSize)
  );

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  const snap = await getDocs(q);
  const capsules: Capsule[] = snap.docs.map(toCapsule);
  // BUG FIX: The last line was incomplete. This is the corrected version.
  const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { capsules, lastVisible };
}