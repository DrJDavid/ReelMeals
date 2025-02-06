import { Firestore } from "firebase/firestore";

// Mock Firestore instance
export const db = {} as Firestore;

// Mock Firebase config
export const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};
