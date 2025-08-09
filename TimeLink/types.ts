// src/types.ts

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  mood?: number;
}

export interface Capsule {
  id: string;
  userId: string;
  title?: string;
  recipient?: string;      // optional recipient email
  message: string;
  deliveryDate: Date;
  isDelivered: boolean;
  createdAt: Date;         // when it was originally scheduled
}
