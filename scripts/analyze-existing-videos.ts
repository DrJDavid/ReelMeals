import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
config({ path: ".env.local" });

// Initialize Firebase Admin with service account
const serviceAccount = require("../service-account.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "reelmeals-63cc4.firebasestorage.app",
});

const db = admin.firestore();
const storage = admin.storage();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

// Create temp directory for video downloads
const TEMP_DIR = path.join(__dirname, "..", "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Helper function to delay execution (for rate limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadVideo(videoId: string): Promise<string> {
  const videoPath = path.join(TEMP_DIR, `${videoId}.mp4`);

  try {
    // Get the file from Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(`burgers.mp4`);
    const [exists] = await file.exists();

    if (!exists) {
      throw new Error(`Video file not found in storage: burgers.mp4`);
    }

    // Download to temp directory
    await file.download({
      destination: videoPath,
    });

    return videoPath;
  } catch (error) {
    console.error(`Error downloading video ${videoId}:`, error);
    throw error;
  }
}

async function cleanupVideo(videoPath: string) {
  try {
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  } catch (error) {
    console.error(`Error cleaning up video ${videoPath}:`, error);
  }
}

interface VideoAnalysis {
  title: string;
  description: string;
  cuisine: string;
  difficulty: "Easy" | "Medium" | "Hard";
  cookingTime: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    estimatedPrice?: number;
    notes?: string;
  }>;
  instructions: Array<{
    step: number;
    description: string;
    timestamp?: number;
    duration?: number;
  }>;
  nutrition: {
    servings: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  tags: string[];
  aiMetadata: {
    detectedIngredients: string[];
    detectedTechniques: string[];
    confidenceScore: number;
    suggestedHashtags: string[];
    equipmentNeeded: string[];
    skillLevel: string;
    totalTime: number;
    prepTime: number;
    cookTime: number;
    estimatedCost: {
      min: number;
      max: number;
      currency: string;
    };
  };
}

async function parseAIResponse(text: string): Promise<VideoAnalysis> {
  try {
    // First try direct JSON parsing
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = text.slice(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.log(
        "Direct JSON parsing failed, falling back to structured parsing"
      );
    }

    // Fallback: Parse structured text
    const sections = text.split("\n\n");
    const analysis: Partial<VideoAnalysis> = {
      ingredients: [],
      instructions: [],
      tags: [],
      aiMetadata: {
        detectedIngredients: [],
        detectedTechniques: [],
        confidenceScore: 0.8,
        suggestedHashtags: [],
        equipmentNeeded: [],
        skillLevel: "beginner",
        totalTime: 0,
        prepTime: 0,
        cookTime: 0,
        estimatedCost: {
          min: 0,
          max: 0,
          currency: "USD",
        },
      },
    };

    for (const section of sections) {
      if (section.includes("Title and Brief Description")) {
        const lines = section.split("\n");
        for (const line of lines) {
          if (line.includes("Recipe name:"))
            analysis.title = line.split(":")[1].trim();
          if (line.includes("Brief description:"))
            analysis.description = line.split(":")[1].trim();
          if (line.includes("Type of cuisine:"))
            analysis.cuisine = line.split(":")[1].trim();
          if (line.includes("Difficulty level:")) {
            const diff = line.split(":")[1].trim();
            analysis.difficulty = diff as "Easy" | "Medium" | "Hard";
          }
          if (line.includes("Total cooking time:")) {
            analysis.cookingTime = parseInt(line.split(":")[1].trim());
          }
        }
      }
      // Add more section parsing as needed
    }

    return analysis as VideoAnalysis;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Failed to parse AI response");
  }
}

async function analyzeVideo(videoPath: string): Promise<VideoAnalysis> {
  try {
    // Read the video file
    const videoBuffer = fs.readFileSync(videoPath);
    const videoBase64 = videoBuffer.toString("base64");

    // Enhanced prompt for detailed analysis
    const prompt = `Analyze this cooking video and provide a JSON response with the following structure. Return ONLY the JSON, no other text:

{
  "title": "Recipe name",
  "description": "Detailed description",
  "cuisine": "Specific cuisine type",
  "difficulty": "Easy/Medium/Hard",
  "cookingTime": minutes,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": number,
      "unit": "unit",
      "notes": "preparation notes"
    }
  ],
  "instructions": [
    {
      "step": number,
      "description": "instruction",
      "timestamp": seconds_in_video,
      "duration": step_duration
    }
  ],
  "nutrition": {
    "servings": number,
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "tags": ["tag1", "tag2"],
  "aiMetadata": {
    "detectedIngredients": ["ingredient1"],
    "detectedTechniques": ["technique1"],
    "confidenceScore": 0.0_to_1.0,
    "suggestedHashtags": ["#tag1"],
    "equipmentNeeded": ["tool1"],
    "skillLevel": "beginner/intermediate/advanced",
    "totalTime": minutes,
    "prepTime": minutes,
    "cookTime": minutes,
    "estimatedCost": {
      "min": cents,
      "max": cents,
      "currency": "USD"
    }
  }
}`;

    // Create parts array with the prompt and video data
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "video/mp4",
          data: videoBase64,
        },
      },
    ];

    // Generate content with Gemini
    const result = await model.generateContent(parts);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    // Parse the response
    return parseAIResponse(text);
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
}

interface VideoData {
  id: string;
  status?: string;
  analysis?: any;
  [key: string]: any;
}

async function analyzeExistingVideos() {
  try {
    // Get ALL videos from Firestore
    const videosRef = db.collection("videos");
    const snapshot = await videosRef.get();
    const videos = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as VideoData)
    );

    console.log(`Found ${videos.length} total videos in database`);
    console.log("Current status of videos:");
    console.table(
      videos.map((v) => ({
        id: v.id,
        status: v.status || "no status",
        hasAnalysis: v.analysis ? "yes" : "no",
      }))
    );

    for (const video of videos) {
      try {
        console.log(`\nProcessing video ${video.id}...`);
        console.log(`Current status: ${video.status || "no status"}`);

        // Update status to processing
        await videosRef.doc(video.id).update({
          status: "processing",
          lastUpdated: new Date(),
        });

        // Download the video
        const videoPath = await downloadVideo(video.id);
        console.log(`Downloaded video to ${videoPath}`);

        // Analyze the video
        console.log("Starting analysis...");
        const analysis = await analyzeVideo(videoPath);
        console.log("Analysis complete");

        // Update Firestore with the results
        await videosRef.doc(video.id).update({
          status: "active",
          analysis,
          lastUpdated: new Date(),
        });

        console.log(`Successfully analyzed video ${video.id}`);

        // Cleanup
        await cleanupVideo(videoPath);
      } catch (error) {
        console.error(`Failed to analyze video ${video.id}:`, error);
        await videosRef.doc(video.id).update({
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          lastUpdated: new Date(),
        });
      }

      // Add a delay between videos to avoid rate limiting
      await delay(2000);
    }

    console.log("\nAnalysis complete. Final status:");
    const finalSnapshot = await videosRef.get();
    const finalStatus = finalSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status || "no status",
        hasAnalysis: data.analysis ? "yes" : "no",
      };
    });
    console.table(finalStatus);
  } catch (error) {
    console.error("Error analyzing videos:", error);
  }
}

// Run the script
console.log("🚀 Starting analysis of all videos...");
analyzeExistingVideos();
