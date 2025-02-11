import { db, firebaseAuth, firebaseStorage } from "@/lib/firebase/initFirebase";
import { doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, FirebaseStorage, ref } from "firebase/storage";

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
  success: boolean;
  reason: string;
  confidence: number;
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
  private static getStoragePath(videoId: string): string {
    return `videos/${videoId}`;
  }

  /**
   * Pre-screen a video to determine if it's a cooking video
   */
  public static async preScreenVideo(
    videoUrl: string,
    videoId: string
  ): Promise<PreScreeningResult> {
    console.log("Starting pre-screening for video:", { videoId, videoUrl });
    let storagePath = videoId + ".mp4";
    try {
      // Get current user
      const user = firebaseAuth?.currentUser;

      if (!user) {
        console.error("No authenticated user found");
        throw new Error("User not authenticated");
      }
      console.log("Got authenticated user:", user.uid);

      // Get current user's ID token
      const idToken = await user.getIdToken();
      console.log("Got ID token");

      // Get the API URL
      const apiUrl = getApiBaseUrl();
      console.log("Using API URL:", apiUrl);

      // Extract the file path from the Firebase Storage URL
      if (videoUrl.includes("firebasestorage.googleapis.com")) {
        const urlParts = videoUrl.split("/o/");
        if (urlParts.length >= 2) {
          storagePath = decodeURIComponent(urlParts[1].split("?")[0]);
        }
      }

      // Call the pre-screening API
      console.log("Calling pre-screening API with:", { videoId, storagePath });
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
        body: JSON.stringify({ videoId, videoUrl: storagePath }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pre-screening API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl,
        });

        // Update document status to failed
        const docRef = doc(db as Firestore, "videos", videoId);
        await updateDoc(docRef, {
          status: "failed",
          error: errorText,
          updatedAt: serverTimestamp(),
        });

        return {
          success: false,
          reason:
            "Unable to process video. Please try uploading a cooking video.",
          confidence: 0,
        };
      }

      const result = await response.json();
      console.log("Got pre-screening result:", result);

      // If the video was rejected by the Cloud Function
      if (!result.success) {
        console.log("Video was rejected by Cloud Function:", result.reason);

        // Update document status to failed
        const docRef = doc(db as Firestore, "videos", videoId);
        await updateDoc(docRef, {
          status: "failed",
          error: result.reason,
          updatedAt: serverTimestamp(),
        });

        return {
          success: false,
          reason:
            result.reason || "Video does not appear to be a cooking video",
          confidence: result.confidence || 0,
        };
      }

      // If we get here, the video was accepted and analyzed
      console.log("Video was accepted and analyzed");
      const docRef = doc(db as Firestore, "videos", videoId);
      const updateData = {
        ...result.analysis,
        status: "active", // Video is now active since analysis is complete
        videoUrl: videoUrl, // Use the original download URL from the upload
        updatedAt: serverTimestamp(),
      };
      console.log("Updating document with analysis data:", updateData);
      await updateDoc(docRef, updateData);
      console.log("Firestore document updated successfully");

      return {
        success: true,
        reason: "Video accepted and ready to view",
        confidence: result.confidence || 0,
        analysis: result.analysis,
      };
    } catch (error) {
      console.error("Error pre-screening video:", error);

      // Delete the video from storage on error
      try {
        console.log("Attempting to delete video after error:", videoId);
        const videoRef = ref(firebaseStorage as FirebaseStorage, storagePath);
        await deleteObject(videoRef);
        console.log("Video deleted from storage after error:", videoId);
      } catch (deleteError) {
        console.error("Error deleting video after error:", deleteError);
      }

      return {
        success: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unable to process video. Please try uploading a cooking video.",
        confidence: 0,
      };
    }
  }
}
