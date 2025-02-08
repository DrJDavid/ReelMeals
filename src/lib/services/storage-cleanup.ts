import { deleteObject, listAll, ref } from "firebase/storage";
import { firebaseStorage } from "../firebase/firebase-config";

export async function cleanupTempStorage() {
  try {
    const tempRef = ref(firebaseStorage, "temp");
    const { items } = await listAll(tempRef);

    // Delete all files in temp directory
    const deletePromises = items.map((item) => deleteObject(item));
    await Promise.all(deletePromises);

    console.log(`Cleaned up ${items.length} temporary files`);
  } catch (error) {
    console.error("Error cleaning up temporary storage:", error);
  }
}
