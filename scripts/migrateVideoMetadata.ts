/**
 * This migration script connects to Firestore using the Firebase Admin SDK,
 * reads all documents from the "videos" collection, and updates the metadata
 * field if legacy (lightweight) metadata is found. It uses the mapping function
 * to transform legacy metadata into the unified EnrichedVideoMetadata schema.
 */

import * as admin from "firebase-admin";
import {
  EnrichedVideoMetadata,
  LightweightMetadata,
  mapLightweightToEnriched,
} from "../src/lib/utils/mapMetadata";

// Initialize Firebase Admin SDK (ensure your service account JSON is provided)
import * as serviceAccount from "../service-account.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: "https://your-project-id.firebaseio.com", // update with your project settings
});

const db = admin.firestore();

async function migrateVideoMetadata() {
  try {
    const videosRef = db.collection("videos");
    const snapshot = await videosRef.get();

    console.log(`Found ${snapshot.size} video documents for migration.`);

    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Assume legacy metadata is stored under "metadata" field
      const legacyMetadata = data.metadata as
        | LightweightMetadata
        | EnrichedVideoMetadata
        | undefined;

      // Check for legacy metadata (i.e. legacy metadata might have the lightweight field "isCookingVideo")
      if (
        legacyMetadata &&
        (legacyMetadata as LightweightMetadata).isCookingVideo !== undefined
      ) {
        console.log(`Migrating document ${doc.id}...`);

        // Mapping legacy data to enriched schema (merging or replacing as needed)
        const updatedMetadata: Partial<EnrichedVideoMetadata> =
          mapLightweightToEnriched(legacyMetadata as LightweightMetadata);

        // Update the document metadata (you can merge the new metadata with existing if needed)
        const newMetadata = { ...legacyMetadata, ...updatedMetadata };
        batch.update(doc.ref, { metadata: newMetadata });
      }
    });

    // Commit batch update
    await batch.commit();
    console.log("Metadata migration complete.");
  } catch (error) {
    console.error("Error during metadata migration:", error);
  }
}

migrateVideoMetadata();
