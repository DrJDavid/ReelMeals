import { firebaseAuth } from "@/lib/firebase/initFirebase";

// Get the base URL for API calls
const getApiBaseUrl = () => {
  // In development, use relative path
  if (process.env.NODE_ENV === "development") {
    return "/api/videos/prescreen";
  }
  // In production, use the Firebase Functions URL
  return process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL
    ? `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/analyzeVideo`
    : "/api/videos/prescreen";
};

export interface PreScreeningResult {
  isCookingVideo: boolean;
  confidence: number;
  reason: string;
  detectedContent: {
    hasCookingInstructions: boolean;
    hasIngredients: boolean;
    hasRecipeSteps: boolean;
    identifiedDish?: string;
    cookingTechniquesShown: string[];
  };
  analysis?: {
    ingredients: Array<{
      name: string;
      amount: number | null;
      unit: string | null;
      notes: string | null;
    }>;
    instructions: Array<{
      step: number;
      description: string;
      timestamp: number | null;
      duration: number | null;
    }>;
    nutrition: {
      servings: number | null;
      calories: number | null;
      protein: number | null;
      carbs: number | null;
      fat: number | null;
      fiber: number | null;
    };
    aiMetadata: {
      detectedIngredients: string[];
      detectedTechniques: string[];
      confidenceScore: number;
      suggestedHashtags: string[];
      equipmentNeeded: string[];
      skillLevel: string;
      totalTime: number;
      prepTime: number;
      cookTime: number;
      estimatedCost: {
        min: number;
        max: number;
        currency: string;
      };
    };
  };
}

export class VideoPreScreeningService {
  /**
   * Pre-screen a video to determine if it's a cooking video
   */
  public static async preScreenVideo(
    videoUrl: string
  ): Promise<PreScreeningResult> {
    try {
      // Get current user
      const user = firebaseAuth?.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get current user's ID token
      const idToken = await user.getIdToken();

      // Generate a temporary videoId for analysis
      const videoId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      // Get the API URL
      const apiUrl = getApiBaseUrl();
      console.log("Using API URL:", apiUrl); // Debug log

      // Call the pre-screening API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials:
          process.env.NODE_ENV === "development" ? "include" : "omit",
        body: JSON.stringify({ videoId, videoUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pre-screening API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl,
        });
        throw new Error(
          `Failed to pre-screen video: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      return result as PreScreeningResult;
    } catch (error) {
      console.error("Error pre-screening video:", error);
      throw error;
    }
  }
}
