"use client";

import VideoPlayer from "@/components/video/VideoPlayer";
import { db, firebaseAuth, firebaseStorage } from "@/lib/firebase/initFirebase";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { useState } from "react";

// For testing, you can use a public video URL or upload one to Firebase Storage
const TEST_VIDEO_URL =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export default function Home() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const testAuth = async () => {
    try {
      setIsLoading(true);
      const result = await signInAnonymously(firebaseAuth);
      setTestResult(`Auth Success! User ID: ${result.user.uid}`);
    } catch (error) {
      setTestResult(`Auth Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirestore = async () => {
    try {
      setIsLoading(true);
      // Write a test document
      const docRef = await addDoc(collection(db, "test"), {
        message: "Hello from emulator!",
        timestamp: new Date().toISOString(),
      });

      // Read all test documents
      const querySnapshot = await getDocs(collection(db, "test"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTestResult(
        `Firestore Success! Written doc ID: ${docRef.id}, Total docs: ${docs.length}`
      );
    } catch (error) {
      setTestResult(`Firestore Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStorage = async () => {
    try {
      setIsLoading(true);
      const testBlob = new Blob(["Hello, Storage!"], { type: "text/plain" });
      const storageRef = ref(firebaseStorage, "test/hello.txt");
      await uploadBytes(storageRef, testBlob);
      setTestResult("Storage Success! File uploaded");
    } catch (error) {
      setTestResult(`Storage Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-md">
        <VideoPlayer
          videoUrl={TEST_VIDEO_URL}
          autoPlay={true}
          muted={true}
          loop={true}
          onError={(error) => console.error("Video error:", error)}
        />
      </div>
    </main>
  );
}
