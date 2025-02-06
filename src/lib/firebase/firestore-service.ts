import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  FirestoreCollection,
  FirestoreUser,
  FirestoreVideo,
  withTimestamps,
  withUpdatedTimestamp,
} from "./firestore-schema";
import { db } from "./initFirebase";

// Video Operations
export async function getVideos(limitCount = 10) {
  if (!db) throw new Error("Firestore not initialized");
  const videosRef = collection(db, "videos");
  const q = query(videosRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as FirestoreVideo)
  );
}

export async function getVideo(videoId: string) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "videos", videoId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreVideo;
}

export async function addVideo(
  video: Omit<FirestoreVideo, "id" | "createdAt" | "updatedAt">
) {
  if (!db) throw new Error("Firestore not initialized");
  const videosRef = collection(db, "videos");
  const videoWithTimestamps = withTimestamps<Omit<FirestoreVideo, "id">>(video);
  const docRef = await addDoc(videosRef, videoWithTimestamps);
  return { id: docRef.id, ...videoWithTimestamps };
}

export async function getVideosByTag(tag: string) {
  if (!db) throw new Error("Firestore not initialized");
  const videosRef = collection(db, "videos");
  const q = query(
    videosRef,
    where("tags", "array-contains", tag),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as FirestoreVideo)
  );
}

// Collection Operations
export async function getUserCollections(userId: string) {
  if (!db) throw new Error("Firestore not initialized");
  const collectionsRef = collection(db, "collections");
  const q = query(
    collectionsRef,
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as FirestoreCollection)
  );
}

export async function getCollection(collectionId: string) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "collections", collectionId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreCollection;
}

export async function createCollection(
  collectionData: Omit<FirestoreCollection, "id" | "createdAt" | "updatedAt">
) {
  if (!db) throw new Error("Firestore not initialized");
  const collectionsRef = collection(db, "collections");
  const collectionWithTimestamps =
    withTimestamps<Omit<FirestoreCollection, "id">>(collectionData);
  const docRef = await addDoc(collectionsRef, collectionWithTimestamps);
  return { id: docRef.id, ...collectionWithTimestamps };
}

export async function addVideoToCollection(
  collectionId: string,
  videoId: string
) {
  if (!db) throw new Error("Firestore not initialized");
  const collectionRef = doc(db, "collections", collectionId);
  await updateDoc(collectionRef, {
    videoIds: arrayUnion(videoId),
    updatedAt: withUpdatedTimestamp,
  });
}

export async function removeVideoFromLegacyCollection(
  collectionId: string,
  videoId: string
) {
  if (!db) throw new Error("Firestore not initialized");
  const collectionRef = doc(db, "collections", collectionId);
  await updateDoc(collectionRef, {
    videoIds: arrayRemove(videoId),
    updatedAt: withUpdatedTimestamp,
  });
}

export async function saveVideoToCollection(
  userId: string,
  collectionName: string,
  videoId: string
) {
  if (!db) throw new Error("Firestore not initialized");
  const collectionRef = doc(db, "users", userId, "collections", collectionName);
  const collectionDoc = await getDoc(collectionRef);

  if (!collectionDoc.exists()) {
    // Create the collection if it doesn't exist
    await setDoc(collectionRef, {
      name: collectionName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      videoIds: [videoId],
    });
  } else {
    // Add video to existing collection
    await updateDoc(collectionRef, {
      videoIds: arrayUnion(videoId),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function removeVideoFromUserCollection(
  userId: string,
  collectionName: string,
  videoId: string
) {
  if (!db) throw new Error("Firestore not initialized");
  const collectionRef = doc(db, "users", userId, "collections", collectionName);
  await updateDoc(collectionRef, {
    videoIds: arrayRemove(videoId),
    updatedAt: serverTimestamp(),
  });
}

export async function getSavedVideoIds(userId: string): Promise<string[]> {
  if (!db) throw new Error("Firestore not initialized");
  const collectionsRef = collection(db, "users", userId, "collections");
  const collectionsSnap = await getDocs(collectionsRef);

  const videoIds = new Set<string>();
  collectionsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.videoIds) {
      data.videoIds.forEach((id: string) => videoIds.add(id));
    }
  });

  return Array.from(videoIds);
}

// User Operations
export async function getUser(userId: string) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreUser;
}

export async function createUser(
  user: Omit<FirestoreUser, "id" | "createdAt" | "updatedAt">
) {
  if (!db) throw new Error("Firestore not initialized");
  const usersRef = collection(db, "users");
  const userWithTimestamps = withTimestamps<FirestoreUser>(user);
  const docRef = await addDoc(usersRef, userWithTimestamps);
  return { id: docRef.id, ...userWithTimestamps };
}

export async function updateUser(
  userId: string,
  data: Partial<Omit<FirestoreUser, "id" | "createdAt" | "updatedAt">>
) {
  if (!db) throw new Error("Firestore not initialized");
  const userRef = doc(db, "users", userId);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(userRef, updateData);
  return updateData;
}
