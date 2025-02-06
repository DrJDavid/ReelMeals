"use client";

import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Check if we should use emulators
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

function initFirebase() {
  if (!firebaseApp && typeof window !== "undefined") {
    firebaseApp = !getApps().length
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);

    // Connect to emulators only if explicitly enabled
    if (useEmulator) {
      console.log("Using Firebase Emulators");
      if (auth)
        connectAuthEmulator(auth, "http://localhost:9098", {
          disableWarnings: true,
        });
      if (firestore) connectFirestoreEmulator(firestore, "localhost", 8081);
      if (storage) connectStorageEmulator(storage, "localhost", 9198);
    }
  }

  return { app: firebaseApp, auth, firestore, storage };
}

// Initialize Firebase
const {
  app,
  auth: firebaseAuth,
  firestore: db,
  storage: firebaseStorage,
} = initFirebase();

// Export initialized instances
export { app, db, firebaseAuth, firebaseStorage };
