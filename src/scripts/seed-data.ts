import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin with service account
const serviceAccount = require("../../service-account.json");

// Define the storage bucket name once to ensure consistency
const STORAGE_BUCKET = "reelmeals-63cc4.firebasestorage.app";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});

// Initialize Firestore
const db = admin.firestore();

console.log("Initialized Firebase Admin");

// Sample video data with Firebase Storage URLs
const SEED_VIDEOS = [
  {
    filename: "chicken-thight-pasta.mp4",
    title: "Creamy Chicken Thigh Pasta",
    description:
      "Rich and creamy pasta dish with perfectly cooked chicken thighs",
    cuisine: "Italian Fusion",
    cookingTime: 30,
    difficulty: "Medium" as const,
    chef: "@foodtok",
    ingredients: ["chicken thighs", "pasta", "cream", "garlic", "parmesan"],
    tags: ["pasta", "chicken", "creamy", "comfort food"],
  },
  {
    filename: "burgers.mp4",
    title: "Ultimate Smash Burgers",
    description: "Learn how to make the perfect smash burger with crispy edges",
    cuisine: "American",
    cookingTime: 20,
    difficulty: "Easy" as const,
    chef: "@burgerlover",
    ingredients: ["ground beef", "cheese", "buns", "onions", "sauce"],
    tags: ["burger", "beef", "fast food", "grilling"],
  },
  {
    filename: "protein-burrito.mp4",
    title: "High Protein Breakfast Burrito",
    description: "Start your day with this protein-packed breakfast burrito",
    cuisine: "Mexican Fusion",
    cookingTime: 15,
    difficulty: "Easy" as const,
    chef: "@fitfoodie",
    ingredients: ["eggs", "tortilla", "cheese", "beans", "salsa"],
    tags: ["breakfast", "protein", "mexican", "healthy"],
  },
  {
    filename: "homemade-fries.mp4",
    title: "Crispy Homemade French Fries",
    description:
      "The secret to making restaurant-style crispy french fries at home",
    cuisine: "American",
    cookingTime: 40,
    difficulty: "Medium" as const,
    chef: "@crispyking",
    ingredients: ["potatoes", "oil", "salt", "seasonings"],
    tags: ["fries", "potato", "snack", "crispy"],
  },
  {
    filename: "steak.mp4",
    title: "Perfect Pan-Seared Steak",
    description: "Master the art of cooking the perfect steak every time",
    cuisine: "American",
    cookingTime: 20,
    difficulty: "Medium" as const,
    chef: "@steakmaster",
    ingredients: ["steak", "butter", "garlic", "herbs"],
    tags: ["beef", "steak", "dinner", "date night"],
  },
  {
    filename: "sushi-wrap.mp4",
    title: "Easy Sushi Wrap",
    description: "A quick and easy way to enjoy sushi flavors in wrap form",
    cuisine: "Japanese Fusion",
    cookingTime: 25,
    difficulty: "Easy" as const,
    chef: "@sushimaster",
    ingredients: ["rice", "nori", "fish", "avocado", "cucumber"],
    tags: ["sushi", "wrap", "seafood", "fusion"],
  },
  {
    filename: "souffle-omlette-and-chocolate-lava-cake.mp4",
    title: "Souffle Omelette & Chocolate Lava Cake",
    description:
      "Learn two impressive dishes: a fluffy souffle omelette and decadent lava cake",
    cuisine: "French",
    cookingTime: 35,
    difficulty: "Hard" as const,
    chef: "@dessertpro",
    ingredients: ["eggs", "chocolate", "butter", "flour", "sugar"],
    tags: ["breakfast", "dessert", "french", "fancy"],
  },
  {
    filename: "honey-butter-chicken.mp4",
    title: "Honey Butter Chicken",
    description:
      "Sweet and savory honey butter chicken that's crispy and delicious",
    cuisine: "Korean Fusion",
    cookingTime: 30,
    difficulty: "Medium" as const,
    chef: "@chickenlover",
    ingredients: ["chicken", "honey", "butter", "garlic", "soy sauce"],
    tags: ["chicken", "korean", "sweet", "crispy"],
  },
  {
    filename: "cajun-pasta.mp4",
    title: "Spicy Cajun Pasta",
    description: "Creamy and spicy cajun pasta with perfectly seasoned shrimp",
    cuisine: "Cajun",
    cookingTime: 25,
    difficulty: "Medium" as const,
    chef: "@cajuncook",
    ingredients: ["pasta", "shrimp", "cream", "cajun seasoning", "garlic"],
    tags: ["pasta", "seafood", "spicy", "creamy"],
  },
  {
    filename: "meatballs-in-sauce.mp4",
    title: "Italian Meatballs in Marinara",
    description: "Classic Italian meatballs in a rich marinara sauce",
    cuisine: "Italian",
    cookingTime: 45,
    difficulty: "Medium" as const,
    chef: "@italianfoodie",
    ingredients: ["ground meat", "breadcrumbs", "tomatoes", "herbs", "garlic"],
    tags: ["meatballs", "italian", "comfort food", "sauce"],
  },
  {
    filename: "potato-dumplings.mp4",
    title: "Homemade Potato Dumplings",
    description: "Soft and pillowy potato dumplings with a simple butter sauce",
    cuisine: "European",
    cookingTime: 40,
    difficulty: "Medium" as const,
    chef: "@dumplingmaster",
    ingredients: ["potatoes", "flour", "eggs", "butter", "nutmeg"],
    tags: ["dumplings", "potato", "comfort food", "vegetarian"],
  },
  {
    filename: "flautas.mp4",
    title: "Crispy Chicken Flautas",
    description: "Crispy rolled tacos filled with seasoned chicken and cheese",
    cuisine: "Mexican",
    cookingTime: 35,
    difficulty: "Medium" as const,
    chef: "@mexicancook",
    ingredients: ["chicken", "tortillas", "cheese", "salsa", "cream"],
    tags: ["mexican", "chicken", "crispy", "appetizer"],
  },
  {
    filename: "croque-monsieur.mp4",
    title: "Classic Croque Monsieur",
    description: "The ultimate French ham and cheese sandwich with bechamel",
    cuisine: "French",
    cookingTime: 25,
    difficulty: "Medium" as const,
    chef: "@frenchcook",
    ingredients: ["bread", "ham", "cheese", "bechamel", "butter"],
    tags: ["sandwich", "french", "cheese", "lunch"],
  },
  {
    filename: "egg-drop-soup.mp4",
    title: "Easy Egg Drop Soup",
    description: "Quick and comforting Chinese egg drop soup",
    cuisine: "Chinese",
    cookingTime: 15,
    difficulty: "Easy" as const,
    chef: "@asianfusion",
    ingredients: [
      "eggs",
      "chicken broth",
      "cornstarch",
      "green onions",
      "ginger",
    ],
    tags: ["soup", "chinese", "quick", "comfort food"],
  },
];

async function addVideoToFirestore(videoData: (typeof SEED_VIDEOS)[0]) {
  const now = Timestamp.now();

  // Use the direct storage URL format
  const videoUrl = `gs://${STORAGE_BUCKET}/${videoData.filename}`;

  // Create the video document without extra quotes
  const video: Omit<FirestoreVideo, "id"> = {
    videoUrl,
    title: videoData.title,
    description: videoData.description,
    cuisine: videoData.cuisine,
    cookingTime: videoData.cookingTime,
    difficulty: videoData.difficulty,
    chef: videoData.chef,
    ingredients: videoData.ingredients,
    tags: videoData.tags,
    thumbnailUrl: "", // You can add thumbnails later
    uploadedByUserId: "system",
    likes: 0,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection("videos").add(video);
  return { id: docRef.id, ...video };
}

async function processVideoBatch(
  videos: typeof SEED_VIDEOS,
  startIndex: number,
  batchSize: number
) {
  const endIndex = Math.min(startIndex + batchSize, videos.length);
  const batch = videos.slice(startIndex, endIndex);
  let batchSuccessCount = 0;
  let batchFailureCount = 0;

  console.log(
    `\nProcessing batch of ${batch.length} videos (${
      startIndex + 1
    } to ${endIndex} of ${videos.length})`
  );

  await Promise.all(
    batch.map(async (video, index) => {
      const globalIndex = startIndex + index;
      try {
        console.log(
          `\nProcessing video ${globalIndex + 1}/${videos.length}: ${
            video.title
          }`
        );

        // Add video document to Firestore
        const newVideo = await addVideoToFirestore(video);
        console.log(`✅ Added video to Firestore: ${newVideo.title}`);
        batchSuccessCount++;
      } catch (error) {
        batchFailureCount++;
        console.error(`❌ Error seeding video ${video.title}:`, error);
        if (error instanceof Error) {
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
        }
      }
    })
  );

  return { batchSuccessCount, batchFailureCount };
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  let totalSuccessCount = 0;
  let totalFailureCount = 0;
  const totalVideos = SEED_VIDEOS.length;
  const BATCH_SIZE = 3; // Process 3 videos at a time

  for (let i = 0; i < totalVideos; i += BATCH_SIZE) {
    try {
      const { batchSuccessCount, batchFailureCount } = await processVideoBatch(
        SEED_VIDEOS,
        i,
        BATCH_SIZE
      );

      totalSuccessCount += batchSuccessCount;
      totalFailureCount += batchFailureCount;

      // Log overall progress
      console.log(
        `\nOverall Progress: ${totalSuccessCount}/${totalVideos} videos processed successfully`
      );
      if (totalFailureCount > 0) {
        console.log(`Total Failed: ${totalFailureCount} videos`);
      }

      // Add a small delay between batches
      if (i + BATCH_SIZE < totalVideos) {
        console.log("\nWaiting 5 seconds before processing next batch...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`❌ Error processing batch starting at index ${i}:`, error);
    }
  }

  console.log("\nDatabase seeding completed!");
  console.log(
    `Successfully processed: ${totalSuccessCount}/${totalVideos} videos`
  );
  if (totalFailureCount > 0) {
    console.log(`Failed to process: ${totalFailureCount} videos`);
    process.exit(1);
  }
}

// Only run if this is the main module
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };
