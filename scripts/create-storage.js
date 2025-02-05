const admin = require("firebase-admin");

// Initialize Firebase Admin with your project credentials
const serviceAccount = require("../service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "reelmeals-63cc4.appspot.com",
});

async function createBucket() {
  try {
    const bucket = admin.storage().bucket();

    // Create the bucket if it doesn't exist
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log("Creating new storage bucket...");
      await bucket.create({
        location: "us-central1",
        storageClass: "STANDARD",
      });
      console.log("Storage bucket created successfully!");
    } else {
      console.log("Storage bucket already exists.");
    }

    // Set CORS configuration
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
        origin: ["*"],
        responseHeader: ["Content-Type", "x-goog-meta-*"],
      },
    ]);
    console.log("CORS configuration set successfully!");
  } catch (error) {
    console.error("Error creating storage bucket:", error);
    process.exit(1);
  }
}

createBucket();
