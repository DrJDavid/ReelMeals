import { db, firebaseStorage } from "@/lib/firebase/initFirebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  FirebaseStorage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { VideoPreScreeningService } from "./video-prescreening";

// Constants for validation
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const MIN_CONFIDENCE_THRESHOLD = 0.6;
const VIDEO_ANALYSIS_ENDPOINT =
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + "/analyzeVideo";

export interface UploadResult {
  videoId: string;
  preScreeningResult?: {
    isValid: boolean;
    reason: string;
    confidence: number;
  };
}

export class VideoUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "VideoUploadError";
  }
}

async function triggerVideoAnalysis(
  videoId: string,
  videoUrl: string
): Promise<void> {
  try {
    const response = await fetch(VIDEO_ANALYSIS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoId, videoUrl }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to trigger video analysis: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("Error triggering video analysis:", error);
    // We don't throw here to avoid failing the upload
    // The analysis can be retried later if needed
  }
}

export async function uploadVideo(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Input validation
  if (!file) {
    throw new VideoUploadError("No file provided", "NO_FILE");
  }

  if (!userId) {
    throw new VideoUploadError("No user ID provided", "NO_USER_ID");
  }

  // File validation
  if (file.size > MAX_FILE_SIZE) {
    throw new VideoUploadError(
      `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
      "FILE_TOO_LARGE"
    );
  }

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new VideoUploadError(
      `Invalid file type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(", ")}`,
      "INVALID_FILE_TYPE"
    );
  }

  // Verify Firebase instances are initialized
  if (!firebaseStorage || !db) {
    throw new VideoUploadError(
      "Firebase services not initialized",
      "FIREBASE_NOT_INITIALIZED"
    );
  }

  // Create a unique ID for the video that will be used throughout the process
  const videoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const videoRef = ref(firebaseStorage as FirebaseStorage, `${videoId}.mp4`);

  try {
    // Create initial document with "uploading" status
    const initialDocRef = doc(db, "videos", videoId);
    await setDoc(initialDocRef, {
      id: videoId,
      status: "uploading",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      uploadedByUserId: userId,
      title: "",
      description: "",
      cuisine: "",
      difficulty: "Medium",
      cookingTime: 0,
      ingredients: [],
      instructions: [],
      nutrition: {
        servings: null,
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
      },
      tags: [],
      aiMetadata: {
        detectedIngredients: [],
        detectedTechniques: [],
        confidenceScore: 0,
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
      },
      videoUrl: "",
      error: null,
    });

    // Start upload with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const uploadTask = uploadBytesResumable(videoRef, file);

        // Wait for upload to complete
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress?.(Math.min(progress, 99)); // Cap at 99% until fully processed
            },
            (error) => {
              if (error.code === "storage/canceled") {
                reject(
                  new VideoUploadError("Upload canceled", "UPLOAD_CANCELED")
                );
              } else if (error.code === "storage/unauthorized") {
                reject(
                  new VideoUploadError(
                    "Unauthorized to upload video",
                    "UNAUTHORIZED"
                  )
                );
              } else {
                reject(error);
              }
            },
            resolve
          );
        });

        break; // Upload successful, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw new VideoUploadError(
            "Failed to upload video after multiple attempts",
            "UPLOAD_FAILED"
          );
        }
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
      }
    }

    // Get the video URL
    const videoUrl = await getDownloadURL(videoRef);

    // Add a small delay to ensure the file is accessible
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Pre-screen the video
      const result = await VideoPreScreeningService.preScreenVideo(
        videoUrl,
        videoId
      );

      // If the video was rejected
      if (!result.success) {
        // The Cloud Function will handle deletion
        onProgress?.(100); // Complete the progress

        return {
          videoId: "",
          preScreeningResult: {
            isValid: false,
            reason: result.reason || "Not a valid cooking video",
            confidence: result.confidence,
          },
        };
      }

      onProgress?.(100); // Upload and processing complete

      return {
        videoId,
        preScreeningResult: {
          isValid: true,
          reason: "Video accepted and being processed",
          confidence: result.confidence,
        },
      };
    } catch (error) {
      // The Cloud Function will handle cleanup if there's an error
      throw error;
    }
  } catch (error) {
    console.error("Error uploading video:", error);
    if (error instanceof VideoUploadError) {
      throw error;
    }
    throw new VideoUploadError(
      error instanceof Error ? error.message : "Unknown error occurred",
      "UNKNOWN_ERROR"
    );
  }
}
