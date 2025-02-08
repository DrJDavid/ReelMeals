import { auth as firebaseAuth } from "../firebase/firebase-config";

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
      const user = firebaseAuth.currentUser;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get current user's ID token
      const idToken = await user.getIdToken();

      // Call the pre-screening API
      const response = await fetch("/api/videos/prescreen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pre-screen video");
      }

      const result = await response.json();
      return result as PreScreeningResult;
    } catch (error) {
      console.error("Error pre-screening video:", error);
      throw new Error("Failed to pre-screen video");
    }
  }
}
