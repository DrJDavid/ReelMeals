import { Timestamp } from "firebase/firestore";

export interface FirestoreVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  cuisine: string;
  cookingTime: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  uploadedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  videoIds: string[];
  createdAt: Date;
  updatedAt: Date;
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
