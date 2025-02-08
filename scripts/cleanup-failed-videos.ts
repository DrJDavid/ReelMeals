import { config } from "dotenv";
import * as admin from "firebase-admin";

// Load environment variables
config({ path: ".env.local" });

// Initialize Firebase Admin with service account
const serviceAccount = require("../service-account.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

async function cleanupFailedVideos() {
  try {
    console.log("🧹 Starting cleanup of failed videos...");

    // Get all videos with failed status
    const videosRef = db.collection("videos");
    const snapshot = await videosRef.where("status", "==", "failed").get();

    console.log(`Found ${snapshot.size} failed videos to clean up`);

    // Delete each failed video document
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      console.log(`Queuing deletion of video ${doc.id}`);
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
    console.log("✅ Successfully cleaned up all failed videos");

    // Show remaining videos
    const remainingSnapshot = await videosRef.get();
    console.log("\nRemaining videos in database:");
    const remainingVideos = remainingSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status || "no status",
        hasAnalysis: data.analysis ? "yes" : "no",
      };
    });
    console.table(remainingVideos);
  } catch (error) {
    console.error("Error cleaning up videos:", error);
  } finally {
    process.exit();
  }
}

// Run the script
cleanupFailedVideos();
