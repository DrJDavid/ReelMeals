import { Timestamp } from "firebase/firestore";

export interface FirestoreVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  userId: string;
  uploadedByUserId?: string;
  createdAt: { seconds: number; nanoseconds: number };
  cuisine: string;
  difficulty: "Easy" | "Medium" | "Hard";
  cookingTime: number;
  tags: string[];
  techniques?: string[];
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
    estimatedPrice?: number;
  }>;
  instructions?: Array<{
    description: string;
    duration?: number;
    timestamp?: number;
    notes?: string;
  }>;
  servings?: number;
  analysis?: {
    aiMetadata?: {
      skillLevel?: string;
      totalTime?: number;
      prepTime?: number;
      cookTime?: number;
      detectedTechniques?: string[];
      suggestedHashtags?: string[];
      equipmentNeeded?: string[];
      estimatedCost?: {
        min: number;
        max: number;
        currency: string;
      };
    };
    ingredients?: Array<{
      name: string;
      amount: number;
      unit: string;
      notes?: string;
      estimatedPrice?: number;
    }>;
    instructions?: Array<{
      description: string;
      duration?: number;
      timestamp?: number;
      notes?: string;
    }>;
    nutrition?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      servings?: number;
    };
  };
  views?: number;
  likes?: number;
  dislikes?: number;
  status?:
    | "draft"
    | "published"
    | "archived"
    | "processing"
    | "ready"
    | "failed";
  error?: string;
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
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  collections?: string[];
  savedVideos?: string[];
  likedVideos?: string[];
  dislikedVideos?: string[];
  watchedVideos?: string[];
  preferences?: {
    dietaryRestrictions?: string[];
    cuisinePreferences?: string[];
    skillLevel?: string;
  };
}

// Helper function to convert timestamps
export function withTimestamps<T extends Record<string, any>>(
  data: T
): T & {
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
