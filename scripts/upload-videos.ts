import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin with service account
const serviceAccount = require("../service-account.json");
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const storage = getStorage();
const bucket = storage.bucket();

async function uploadVideo(videoPath: string) {
  try {
    // Generate a unique ID for the video
    const videoId = path
      .basename(videoPath, ".mp4")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    console.log(`Processing ${videoPath} with ID: ${videoId}`);

    // Check if video already exists
    const docRef = db.collection("videos").doc(videoId);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`Video ${videoId} already exists, skipping...`);
      return;
    }

    // Upload video to Firebase Storage
    console.log("Uploading to Storage...");
    await bucket.upload(videoPath, {
      destination: `videos/${videoId}.mp4`,
      metadata: {
        contentType: "video/mp4",
      },
    });

    // Get the video URL
    const [url] = await bucket.file(`videos/${videoId}.mp4`).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Create Firestore document
    console.log("Creating Firestore document...");
    await docRef.set({
      videoUrl: url,
      thumbnailUrl: "", // Will be generated later
      title: "", // Will be filled by AI
      description: "", // Will be filled by AI
      cuisine: "", // Will be filled by AI
      difficulty: "Medium", // Will be updated by AI
      cookingTime: 0, // Will be filled by AI
      ingredients: [], // Will be filled by AI
      instructions: [], // Will be filled by AI
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
      uploadedByUserId: "system",
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Successfully uploaded ${videoId}`);
  } catch (error) {
    console.error(`❌ Failed to upload video:`, error);
    throw error;
  }
}

async function uploadAllVideos() {
  try {
    // Get all MP4 files from the videos directory
    const videosDir = path.join(__dirname, "..", "videos");
    const videoFiles = fs
      .readdirSync(videosDir)
      .filter((file) => file.endsWith(".mp4"));

    console.log(`Found ${videoFiles.length} videos to upload`);

    // Upload each video
    for (const videoFile of videoFiles) {
      const videoPath = path.join(videosDir, videoFile);
      try {
        await uploadVideo(videoPath);
      } catch (error) {
        console.error(`Failed to upload ${videoFile}:`, error);
        // Continue with next video
      }
    }

    console.log("\n🎉 All videos uploaded!");
  } catch (error) {
    console.error("Error uploading videos:", error);
    process.exit(1);
  }
}

// Run the script
console.log("🚀 Starting video upload...");
uploadAllVideos();
