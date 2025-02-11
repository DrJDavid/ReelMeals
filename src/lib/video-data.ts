import { FirestoreVideo } from "./firebase/firestore-schema";

export interface ProcessedVideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  status:
    | "processing"
    | "ready"
    | "failed"
    | "draft"
    | "published"
    | "archived";
  error?: string;

  // Basic metadata
  difficulty: string;
  totalTime: number;
  prepTime: number;
  cookTime: number;
  cuisine: string;

  // Recipe details
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
  instructions: Array<{
    description: string;
    notes?: string;
  }>;

  // Equipment and techniques
  equipmentNeeded: string[];
  detectedTechniques: string[];

  // Nutrition info
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servings: number;

  // Cost estimation
  estimatedCost?: {
    min: number;
    max: number;
  };

  // Social metrics
  likes: number;
  views: number;

  // Tags and categories
  tags: string[];
  suggestedHashtags: string[];
}

/**
 * Helper function to deduplicate arrays
 */
function dedupeArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

interface VideoAnalysis {
  aiMetadata?: {
    skillLevel?: string;
    totalTime?: number;
    prepTime?: number;
    cookTime?: number;
    cuisine?: string;
    detectedTechniques?: string[];
    suggestedHashtags?: string[];
    equipmentNeeded?: string[];
    estimatedCost?: {
      min: number;
      max: number;
    };
  };
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    servings?: number;
  };
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
  instructions?: Array<{
    description: string;
    notes?: string;
  }>;
}

/**
 * Processes a FirestoreVideo to provide a consistent interface for components.
 * Merges base video data with AI metadata, providing defaults where needed.
 */
export function processVideoMetadata(
  video: FirestoreVideo
): ProcessedVideoMetadata {
  if (!video) {
    throw new Error("No video data provided");
  }

  // Handle missing video URL more gracefully
  if (!video.videoUrl) {
    console.warn("Video URL is missing in video data:", video.id);
    return {
      id: video.id,
      title: "Video Unavailable",
      description: "This video is currently unavailable",
      thumbnailUrl: "",
      videoUrl: "",
      status: "failed",
      error: "Video URL is missing",
      difficulty: "Beginner",
      totalTime: 0,
      prepTime: 0,
      cookTime: 0,
      cuisine: "Unknown",
      ingredients: [],
      instructions: [],
      equipmentNeeded: [],
      detectedTechniques: [],
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      servings: 1,
      likes: 0,
      views: 0,
      tags: [],
      suggestedHashtags: [],
    };
  }

  const analysis = (video.analysis || {}) as VideoAnalysis;
  const aiMetadata = analysis.aiMetadata || {};
  const nutrition = analysis.nutrition || {};

  // Ensure the video URL is valid
  let processedVideoUrl = video.videoUrl;
  if (
    !processedVideoUrl.startsWith("http://") &&
    !processedVideoUrl.startsWith("https://") &&
    !processedVideoUrl.startsWith("gs://")
  ) {
    // If it's a storage path without protocol, assume it's a Firebase Storage path
    processedVideoUrl = `gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${processedVideoUrl}`;
  }

  return {
    id: video.id,
    title: video.title || "Untitled Recipe",
    description: video.description || "No description available",
    thumbnailUrl: video.thumbnailUrl || "",
    videoUrl: processedVideoUrl,
    status: video.status || "processing",
    error: video.error,

    // Basic metadata
    difficulty: aiMetadata.skillLevel || video.difficulty || "Beginner",
    totalTime: aiMetadata.totalTime || video.cookingTime || 0,
    prepTime: aiMetadata.prepTime || 0,
    cookTime: aiMetadata.cookTime || video.cookingTime || 0,
    cuisine: aiMetadata.cuisine || video.cuisine || "Unknown",

    // Recipe details
    ingredients: (analysis.ingredients || []).map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount || 0,
      unit: ingredient.unit || "",
      notes: ingredient.notes,
    })),
    instructions: (analysis.instructions || []).map((instruction) => ({
      description: instruction.description,
      notes: instruction.notes,
    })),

    // Equipment and techniques
    equipmentNeeded: aiMetadata.equipmentNeeded || [],
    detectedTechniques: aiMetadata.detectedTechniques || [],

    // Nutrition info
    calories: nutrition.calories || 0,
    protein: nutrition.protein || 0,
    carbs: nutrition.carbs || 0,
    fat: nutrition.fat || 0,
    fiber: nutrition.fiber || 0,
    servings: nutrition.servings || 1,

    // Cost estimation
    estimatedCost: aiMetadata.estimatedCost,

    // Social metrics
    likes: video.likes || 0,
    views: video.views || 0,

    // Tags and categories
    tags: dedupeArray([
      ...(video.tags || []),
      ...(aiMetadata.suggestedHashtags || []),
    ]),
    suggestedHashtags: aiMetadata.suggestedHashtags || [],
  };
}

// Test data for development
export const TEST_VIDEOS: FirestoreVideo[] = [
  {
    id: "1",
    videoUrl: "https://example.com/video1.mp4",
    thumbnailUrl: "https://example.com/thumb1.jpg",
    title: "Carbonara",
    description: "Classic Roman pasta dish",
    cuisine: "Italian",
    difficulty: "Medium",
    cookingTime: 30,
    likes: 1200,
    views: 5000,
    status: "ready",
    uploadedByUserId: "user1",
    userId: "user1",
    createdAt: { seconds: 0, nanoseconds: 0 },
    techniques: ["boiling", "mixing", "emulsifying"],
    tags: ["pasta", "italian", "classic"],
    ingredients: [
      { name: "Spaghetti", amount: 500, unit: "g" },
      { name: "Eggs", amount: 3, unit: "whole" },
      { name: "Pecorino Romano", amount: 100, unit: "g" },
      { name: "Guanciale", amount: 150, unit: "g" },
      { name: "Black Pepper", amount: 2, unit: "tsp" },
    ],
    instructions: [
      { description: "Boil pasta in salted water", duration: 600 },
      { description: "Crisp guanciale", duration: 300 },
      { description: "Mix eggs and cheese", duration: 180 },
      { description: "Combine all ingredients", duration: 120 },
    ],
  },
];
