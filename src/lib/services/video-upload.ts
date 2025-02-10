import { db, firebaseStorage } from "@/lib/firebase/initFirebase";
import { doc, Firestore, setDoc } from "firebase/firestore";
import {
  deleteObject,
  FirebaseStorage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { withTimestamps } from "../firebase/firestore-schema";
import { VideoPreScreeningService } from "./video-prescreening";

// Constants for validation
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const MIN_CONFIDENCE_THRESHOLD = 0.85;
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

  try {
    // Create a unique ID for the video
    const videoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const videoRef = ref(firebaseStorage as FirebaseStorage, `${videoId}.mp4`);

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

    try {
      // Pre-screen the video
      const result = await VideoPreScreeningService.preScreenVideo(videoUrl);

      // Validate pre-screening results
      if (
        !result.isCookingVideo ||
        result.confidence < MIN_CONFIDENCE_THRESHOLD
      ) {
        await deleteObject(videoRef);
        return {
          videoId: "",
          preScreeningResult: {
            isValid: false,
            reason: result.reason || "Not a valid cooking video",
            confidence: result.confidence,
          },
        };
      }

      // Initialize video document
      const videoData = {
        id: videoId,
        videoUrl,
        thumbnailUrl: videoUrl, // TODO: Implement thumbnail generation
        title: "Processing Recipe...",
        description: "",
        cuisine: "Unknown",
        difficulty: "Medium",
        cookingTime: 0,
        ingredients: [],
        instructions: [],
        likes: 0,
        views: 0,
        status: "processing" as const,
        uploadedByUserId: userId,
        userId: userId,
        tags: [],
        techniques: [],
      };

      // Create the video document with timestamps
      const videoWithTimestamps = withTimestamps(videoData);
      await setDoc(
        doc(db as Firestore, "videos", videoId),
        videoWithTimestamps
      ).catch((error) => {
        throw new VideoUploadError(
          "Failed to create video document",
          "DOCUMENT_CREATION_FAILED"
        );
      });

      // Trigger video analysis
      await triggerVideoAnalysis(videoId, videoUrl);

      onProgress?.(100); // Upload and processing complete

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
      await deleteObject(videoRef).catch((deleteError) => {
        console.error("Failed to delete invalid video:", deleteError);
      });
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
