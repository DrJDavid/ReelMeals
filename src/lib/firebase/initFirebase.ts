"use client";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from "firebase/auth";
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import {
  FirebaseStorage,
  connectStorageEmulator,
  getStorage,
} from "firebase/storage";

// Firebase configuration using NEXT_PUBLIC_ prefixed environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton instances
let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Emulator configuration
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const EMULATOR_HOST = "localhost";
const AUTH_EMULATOR_PORT = 9098;
const FIRESTORE_EMULATOR_PORT = 8081;
const STORAGE_EMULATOR_PORT = 9198;

/**
 * Initialize Firebase and its services with proper singleton pattern
 * @returns Object containing initialized Firebase instances
 */
function initFirebase() {
  // Only initialize if we're in the browser and haven't already initialized
  if (!firebaseApp && typeof window !== "undefined") {
    // Implement singleton pattern
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    // Initialize Auth with persistence
    auth = getAuth(firebaseApp);
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error);
    });

    // Initialize Firestore and Storage
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);

    // Connect to emulators if enabled
    if (useEmulator) {
      console.log("🔧 Using Firebase Emulators");

      if (auth) {
        connectAuthEmulator(
          auth,
          `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`,
          {
            disableWarnings: true,
          }
        );
        console.log(`📱 Auth Emulator connected on port ${AUTH_EMULATOR_PORT}`);
      }

      if (firestore) {
        connectFirestoreEmulator(
          firestore,
          EMULATOR_HOST,
          FIRESTORE_EMULATOR_PORT
        );
        console.log(
          `📚 Firestore Emulator connected on port ${FIRESTORE_EMULATOR_PORT}`
        );
      }

      if (storage) {
        connectStorageEmulator(storage, EMULATOR_HOST, STORAGE_EMULATOR_PORT);
        console.log(
          `📦 Storage Emulator connected on port ${STORAGE_EMULATOR_PORT}`
        );
      }
    }
  }

  return { app: firebaseApp, auth, firestore, storage };
}

// Initialize Firebase and export instances
const {
  app,
  auth: firebaseAuth,
  firestore: db,
  storage: firebaseStorage,
} = initFirebase();

// Export initialized instances with clear naming
export { app, db, firebaseAuth, firebaseStorage };

// Export types for convenience
export type { Auth, FirebaseApp, FirebaseStorage, Firestore };
