const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

// Initialize Firebase Admin with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "reelmeals-63cc4.appspot.com",
});

async function createBucket() {
  try {
    const bucket = admin.storage().bucket();

    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (exists) {
      console.log("Bucket already exists");
      return;
    }

    // Create the bucket
    await admin.storage().bucket().create({
      location: "us-central1",
      storageClass: "STANDARD",
    });

    console.log("Storage bucket created successfully");

    // Set CORS configuration
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
        origin: ["*"],
        responseHeader: ["Content-Type", "x-goog-meta-*"],
      },
    ]);

    console.log("CORS configuration set successfully");
  } catch (error) {
    console.error("Error creating storage bucket:", error);
    throw error;
  }
}

createBucket().catch(console.error);
