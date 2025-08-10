// src/types.ts

/**
 * Represents a user's profile information stored in the 'users' collection
 * in Firestore.
 */
export interface UserProfile {
  id: string; // The user's UID from Firebase Auth
  email: string;
  displayName?: string; // Optional display name
  photoURL?: string;    // Optional URL for a profile picture
  createdAt: Date;
}


/**
 * Represents a single journal entry. The new 'visibility' field is crucial
 * for sharing functionality.
 */
export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  mood?: number;
  /** Determines who can see this journal entry. */
  visibility: 'private' | 'friends' | 'public';
}


/**
 * Represents a time capsule message sent from one user to another.
 * It is now designed for in-app delivery.
 */
export interface Capsule {
  id: string;
  /** The user ID of the person who created the capsule. */
  userId: string;
  /** The user ID of the person who will receive the capsule. */
  recipientId: string;
  title?: string;
  message: string;
  /** The future date when the capsule can be opened by the recipient. */
  deliveryDate: Date;
  /**
   * Represents whether the capsule has been opened/read by the recipient.
   * Can also be interpreted as "unlocked".
   */
  isDelivered: boolean;
  /** When the capsule was originally created. */
  createdAt: Date;
}
