// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock Firebase for tests
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  connectAuthEmulator: jest.fn(),
  signInAnonymously: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  connectStorageEmulator: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));
