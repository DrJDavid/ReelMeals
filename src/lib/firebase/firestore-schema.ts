import * as admin from "firebase-admin";
import { Timestamp } from "firebase/firestore";

export interface FirestoreVideo {
  id?: string;
  videoUrl: string;
  title: string;
  description: string;
  cuisine: string;
  cookingTime: number; // in minutes
  difficulty: "Easy" | "Medium" | "Hard";
  thumbnailUrl: string;
  uploadedByUserId: string;
  chef: string;
  ingredients: string[];
  tags: string[];
  likes: number;
  views: number;
  createdAt: admin.firestore.Timestamp | Timestamp;
  updatedAt: admin.firestore.Timestamp | Timestamp;
}

export interface FirestoreCollection {
  id?: string;
  userId: string;
  name: string;
  description: string;
  videoIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUser {
  id?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  favoriteRecipes?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper function to convert timestamps
export function withTimestamps<T>(data: Omit<T, "createdAt" | "updatedAt">) {
  const now = Timestamp.now();
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
  } as T;
}

// Helper function to update timestamp
export function withUpdatedTimestamp<T extends { updatedAt: Timestamp }>(
  data: T
) {
  return {
    ...data,
    updatedAt: Timestamp.now(),
  };
}
