import { Timestamp } from "firebase/firestore";

export interface FirestoreVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  cuisine: string;
  cookingTime: number; // in minutes
  difficulty: "Easy" | "Medium" | "Hard";
  chef: string;
  ingredients: string[];
  tags: string[];
  likes: number;
  views: number;
  uploadedByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreCollection {
  id: string;
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
export function withTimestamps<T extends Record<string, any>>(
  data: Omit<T, "createdAt" | "updatedAt">
): Omit<T, "createdAt" | "updatedAt"> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
} {
  const now = Timestamp.now();
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
}

// Helper function to update timestamp
export function withUpdatedTimestamp<T extends { updatedAt: Timestamp }>(
  data: T
): T {
  return {
    ...data,
    updatedAt: Timestamp.now(),
  };
}
