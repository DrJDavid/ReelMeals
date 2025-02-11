const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function deleteOldIndexes() {
  try {
    console.log("🧹 Starting cleanup of old indexes...");

    const firestore = admin.firestore();
    const settings = await firestore
      .collection("_default_")
      .doc("_settings_")
      .get();

    // Get all indexes
    const indexes = await firestore._getIndexes();

    // Find the old index
    const oldIndex = indexes.find(
      (index) =>
        index.fields.length === 3 &&
        index.fields[0].fieldPath === "status" &&
        index.fields[1].fieldPath === "videoUrl" &&
        index.fields[2].fieldPath === "createdAt"
    );

    if (oldIndex) {
      console.log("Found old index, deleting...");
      await oldIndex.delete();
      console.log("✅ Successfully deleted old index");
    } else {
      console.log("Old index not found");
    }
  } catch (error) {
    console.error("Error cleaning up indexes:", error);
  } finally {
    process.exit();
  }
}

deleteOldIndexes();
