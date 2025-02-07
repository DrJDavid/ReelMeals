import { doc, setDoc, Timestamp } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, firebaseStorage } from "../firebase/firebase-config";
import { FirestoreVideo, withTimestamps } from "../firebase/firestore-schema";
import { VideoPreScreeningService } from "./video-prescreening";

export interface UploadResult {
  videoId: string;
  preScreeningResult?: {
    isValid: boolean;
    reason: string;
    confidence: number;
  };
}

export async function uploadVideo(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Create a unique ID for the video
    const videoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Upload directly to permanent location
    const videoRef = ref(firebaseStorage, `${videoId}.mp4`);
    const uploadTask = uploadBytesResumable(videoRef, file);

    // Wait for upload to complete
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        reject,
        resolve
      );
    });

    // Get the video URL
    const videoUrl = await getDownloadURL(videoRef);

    try {
      // Pre-screen and analyze the video
      const result = await VideoPreScreeningService.preScreenVideo(videoUrl);

      // If video is not valid, delete it and return
      if (!result.isCookingVideo || result.confidence < 0.85) {
        await deleteObject(videoRef);
        return {
          videoId: "",
          preScreeningResult: {
            isValid: false,
            reason: result.reason,
            confidence: result.confidence,
          },
        };
      }

      // For now, use video URL as thumbnail
      const thumbnailUrl = videoUrl; // TODO: Implement thumbnail generation

      // Initialize video document with pre-screening and analysis data
      const videoData: Omit<FirestoreVideo, "id"> = {
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        title: result.detectedContent.identifiedDish || "New Recipe",
        description: result.reason,
        cuisine: "Unknown",
        difficulty: "Medium",
        cookingTime: result.analysis?.aiMetadata?.totalTime || 0,
        ingredients: result.analysis?.ingredients || [],
        instructions: result.analysis?.instructions || [],
        nutrition: result.analysis?.nutrition || {
          servings: 0,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        },
        tags: result.detectedContent.cookingTechniquesShown || [],
        likes: 0,
        views: 0,
        uploadedByUserId: userId,
        aiMetadata: result.analysis?.aiMetadata || {
          detectedIngredients: [],
          detectedTechniques: result.detectedContent.cookingTechniquesShown,
          confidenceScore: result.confidence,
          suggestedHashtags: [],
          equipmentNeeded: [],
          skillLevel: "beginner",
          totalTime: 0,
          prepTime: 0,
          cookTime: 0,
          estimatedCost: {
            min: 0,
            max: 0,
            currency: "USD",
          },
          lastProcessed: Timestamp.now(),
        },
        status: "active", // Set to active since analysis is complete
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Create the video document with timestamps
      const videoWithTimestamps = withTimestamps(videoData);
      await setDoc(doc(db, "videos", videoId), videoWithTimestamps);

      return {
        videoId,
        preScreeningResult: {
          isValid: true,
          reason: result.reason,
          confidence: result.confidence,
        },
      };
    } catch (error) {
      // Clean up video if analysis fails
      await deleteObject(videoRef);
      throw error;
    }
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
}
