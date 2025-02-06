import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Initialize Firebase Admin with service account
const serviceAccount = require("../../service-account.json");

// Define the storage bucket name
const STORAGE_BUCKET = "reelmeals-63cc4.firebasestorage.app";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});

// Initialize Firestore and Storage
const db = admin.firestore();
const bucket = admin.storage().bucket();

async function generateThumbnail(
  videoPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["00:00:01"], // Take screenshot at 1 second
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "640x360", // 16:9 aspect ratio
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}

async function processVideo(video: FirestoreVideo & { id: string }) {
  try {
    console.log(`Processing video: ${video.title}`);

    // Download video from Firebase Storage
    const videoFileName = path.basename(
      video.videoUrl.replace("gs://" + STORAGE_BUCKET + "/", "")
    );
    const localVideoPath = path.join(os.tmpdir(), videoFileName);
    const thumbnailFileName =
      videoFileName.replace(/\.[^/.]+$/, "") + "_thumb.jpg";
    const localThumbnailPath = path.join(os.tmpdir(), thumbnailFileName);

    // Download video file
    await bucket.file(videoFileName).download({ destination: localVideoPath });
    console.log("Downloaded video file");

    // Generate thumbnail
    await generateThumbnail(localVideoPath, localThumbnailPath);
    console.log("Generated thumbnail");

    // Upload thumbnail to Firebase Storage
    await bucket.upload(localThumbnailPath, {
      destination: thumbnailFileName,
      metadata: {
        contentType: "image/jpeg",
      },
    });
    console.log("Uploaded thumbnail");

    // Update video document with thumbnail URL
    const thumbnailUrl = `gs://${STORAGE_BUCKET}/${thumbnailFileName}`;
    await db.collection("videos").doc(video.id).update({
      thumbnailUrl,
      updatedAt: Timestamp.now(),
    });
    console.log("Updated video document");

    // Clean up local files
    fs.unlinkSync(localVideoPath);
    fs.unlinkSync(localThumbnailPath);

    console.log(`✅ Successfully processed ${video.title}`);
  } catch (error) {
    console.error(`❌ Error processing ${video.title}:`, error);
    throw error;
  }
}

async function generateAllThumbnails() {
  try {
    console.log("Starting thumbnail generation...");

    // Get all videos without thumbnails
    const videosSnapshot = await db
      .collection("videos")
      .where("thumbnailUrl", "==", "")
      .get();

    if (videosSnapshot.empty) {
      console.log("No videos found needing thumbnails");
      return;
    }

    console.log(`Found ${videosSnapshot.size} videos needing thumbnails`);

    // Process videos in sequence to avoid memory issues
    for (const doc of videosSnapshot.docs) {
      const video = { id: doc.id, ...doc.data() } as FirestoreVideo & {
        id: string;
      };
      await processVideo(video);
    }

    console.log("✅ Thumbnail generation complete!");
  } catch (error) {
    console.error("❌ Error generating thumbnails:", error);
  }
}

// Run the script
generateAllThumbnails();
