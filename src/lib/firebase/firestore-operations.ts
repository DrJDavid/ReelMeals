import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "./firebase-config";

export async function incrementVideoViews(videoId: string) {
  try {
    const videoRef = doc(db, "videos", videoId);
    await updateDoc(videoRef, {
      views: increment(1),
      lastViewedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error incrementing video views:", error);
  }
}
