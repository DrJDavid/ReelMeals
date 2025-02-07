import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, firebaseStorage } from "../firebase/firebase-config";
import { FirestoreVideo, withTimestamps } from "../firebase/firestore-schema";

export async function uploadVideo(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Create a unique ID for the video
    const videoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Create storage references
    const videoRef = ref(firebaseStorage, `videos/${videoId}.mp4`);
    const thumbnailRef = ref(firebaseStorage, `thumbnails/${videoId}.jpg`);

    // Upload video
    const uploadTask = uploadBytesResumable(videoRef, file);

    // Create a promise that resolves when the upload is complete
    const uploadPromise = new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            // Get video URL
            const videoUrl = await getDownloadURL(videoRef);

            // Initialize video document
            const videoData: Omit<FirestoreVideo, "id"> = {
              videoUrl,
              thumbnailUrl: "", // Will be updated once thumbnail is generated
              title: "", // Will be updated by AI analysis
              description: "", // Will be updated by AI analysis
              cuisine: "", // Will be updated by AI analysis
              difficulty: "Medium", // Will be updated by AI analysis
              cookingTime: 0, // Will be updated by AI analysis
              ingredients: [], // Will be updated by AI analysis
              instructions: [], // Will be updated by AI analysis
              nutrition: {
                servings: 0,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
              },
              tags: [],
              likes: 0,
              views: 0,
              uploadedByUserId: userId,
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
                lastProcessed: Timestamp.now(),
              },
              status: "processing",
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            };

            // Create the video document with timestamps
            const videoWithTimestamps = withTimestamps(videoData);
            await setDoc(doc(db, "videos", videoId), videoWithTimestamps);

            resolve(videoId);
          } catch (error) {
            reject(error);
          }
        }
      );
    });

    return await uploadPromise;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
}
