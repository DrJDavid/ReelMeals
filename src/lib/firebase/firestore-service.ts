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
  const videosRef = collection(db, "videos");
  const q = query(videosRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as FirestoreVideo)
  );
}

export async function getVideo(videoId: string) {
  const docRef = doc(db, "videos", videoId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreVideo;
}

export async function addVideo(
  video: Omit<FirestoreVideo, "id" | "createdAt" | "updatedAt">
) {
  const videosRef = collection(db, "videos");
  const videoWithTimestamps = withTimestamps<FirestoreVideo>(video);
  const docRef = await addDoc(videosRef, videoWithTimestamps);
  return { id: docRef.id, ...videoWithTimestamps };
}

// Collection Operations
export async function getUserCollections(userId: string) {
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
  const docRef = doc(db, "collections", collectionId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreCollection;
}

export async function createCollection(
  collection: Omit<FirestoreCollection, "id" | "createdAt" | "updatedAt">
) {
  const collectionsRef = collection(db, "collections");
  const collectionWithTimestamps =
    withTimestamps<FirestoreCollection>(collection);
  const docRef = await addDoc(collectionsRef, collectionWithTimestamps);
  return { id: docRef.id, ...collectionWithTimestamps };
}

export async function addVideoToCollection(
  collectionId: string,
  videoId: string
) {
  const collectionRef = doc(db, "collections", collectionId);
  await updateDoc(collectionRef, {
    videoIds: arrayUnion(videoId),
    updatedAt: withUpdatedTimestamp,
  });
}

export async function removeVideoFromCollection(
  collectionId: string,
  videoId: string
) {
  const collectionRef = doc(db, "collections", collectionId);
  await updateDoc(collectionRef, {
    videoIds: arrayRemove(videoId),
    updatedAt: withUpdatedTimestamp,
  });
}

// User Operations
export async function getUser(userId: string) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreUser;
}

export async function createUser(
  user: Omit<FirestoreUser, "id" | "createdAt" | "updatedAt">
) {
  const usersRef = collection(db, "users");
  const userWithTimestamps = withTimestamps<FirestoreUser>(user);
  const docRef = await addDoc(usersRef, userWithTimestamps);
  return { id: docRef.id, ...userWithTimestamps };
}

export async function updateUser(
  userId: string,
  data: Partial<Omit<FirestoreUser, "id" | "createdAt" | "updatedAt">>
) {
  const userRef = doc(db, "users", userId);
  const updateData = withUpdatedTimestamp(data);
  await updateDoc(userRef, updateData);
  return updateData;
}
