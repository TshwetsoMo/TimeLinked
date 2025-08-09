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

/** Create a new time capsule */
export function createCapsule(
  userId: string,
  message: string,
  deliveryDate: Date,
  title?: string,
  recipient?: string
) {
  return addDoc(capsulesCol, {
    userId,
    message,
    deliveryDate,
    title: title ?? null,
    recipient: recipient ?? null,
    isDelivered: false,
    createdAt: new Date(),
  });
}

/** Real-time subscribe to a user’s capsules */
export function subscribeToCapsules(
  userId: string,
  callback: (capsules: Capsule[]) => void
) {
  const q = query(
    capsulesCol,
    where('userId', '==', userId),
    orderBy('deliveryDate', 'asc')
  );
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(docSnap => {
      const d = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        userId: d.userId,
        message: d.message,
        title: d.title ?? null,
        recipient: d.recipient ?? null,
        deliveryDate: (d.deliveryDate as Timestamp).toDate(),
        isDelivered: d.isDelivered,
        createdAt: (d.createdAt as Timestamp).toDate(),
      } as Capsule;
    });
    callback(data);
  });
}

/** Fetch a single capsule by ID */
export async function getCapsule(id: string): Promise<Capsule | null> {
  const ref = doc(db, 'timeCapsules', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() as DocumentData;
  return {
    id: snap.id,
    userId: d.userId,
    message: d.message,
    title: d.title ?? null,
    recipient: d.recipient ?? null,
    deliveryDate: (d.deliveryDate as Timestamp).toDate(),
    isDelivered: d.isDelivered,
    createdAt: (d.createdAt as Timestamp).toDate(),
  };
}

/** Update fields on an existing capsule */
export function updateCapsule(
  capsuleId: string,
  data: Partial<
    Pick<Capsule, 'title' | 'recipient' | 'message' | 'deliveryDate'>
  >
) {
  const ref = doc(db, 'timeCapsules', capsuleId);
  const payload: any = { ...data };
  if (data.deliveryDate) payload.deliveryDate = data.deliveryDate;
  return updateDoc(ref, payload);
}

/** Delete a capsule */
export function deleteCapsule(capsuleId: string) {
  const ref = doc(db, 'timeCapsules', capsuleId);
  return deleteDoc(ref);
}

/** Mark as delivered */
export function markDelivered(capsuleId: string) {
  const ref = doc(db, 'timeCapsules', capsuleId);
  return updateDoc(ref, { isDelivered: true });
}

/**
 * Paginated fetch of capsules:
 * - pageSize: number of docs
 * - startAfterDoc: optional last visible snapshot
 */
export async function fetchCapsulesPaginated(
  userId: string,
  pageSize: number,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  capsules: Capsule[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
}> {
  // Base query
  let q = query(
    capsulesCol,
    where('userId', '==', userId),
    orderBy('deliveryDate', 'asc'),
    limit(pageSize)
  );

  // If continuation, add startAfter
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  // Execute
  const snap = await getDocs(q);
  const docs = snap.docs;

  const data: Capsule[] = docs.map(
    (docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        userId: d.userId,
        message: d.message,
        title: d.title ?? null,
        recipient: d.recipient ?? null,
        deliveryDate: (d.deliveryDate as Timestamp).toDate(),
        isDelivered: d.isDelivered,
        createdAt: (d.createdAt as Timestamp).toDate(),
      };
    }
  );

  const lastVisible =
    docs.length > 0 ? docs[docs.length - 1] : null;

  return { capsules: data, lastVisible };
}