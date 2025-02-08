import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import * as admin from "firebase-admin";
import * as fs from "fs";
import fetch from "node-fetch";
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
  console.log(`\nProcessing video ${videoId}...`);

  // List all files in the bucket to find our video
  console.log("Listing all files in bucket...");
  const [files] = await storage.bucket().getFiles();
  const videoFiles = files.filter((file) => file.name.endsWith(".mp4"));

  console.log("Found video files:");
  videoFiles.forEach((file) => console.log(`- ${file.name}`));

  // Get all processed videos to know which storage files have been handled
  const processedSnapshot = await db
    .collection("videos")
    .where("status", "in", ["active", "processing"])
    .get();

  const processedVideoUrls = new Set<string>();
  processedSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.videoUrl) {
      processedVideoUrls.add(data.videoUrl);
    }
  });

  // Get the current video document
  const docRef = db.collection("videos").doc(videoId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error(`Video document ${videoId} not found in Firestore`);
  }

  const videoData = doc.data();
  if (!videoData) {
    throw new Error(`Video document ${videoId} has no data`);
  }

  // If the document already has a videoUrl, try to use that
  let videoFile;
  if (videoData.videoUrl) {
    const urlPath = new URL(videoData.videoUrl).pathname;
    const fileName = urlPath.split("/").pop();
    if (fileName) {
      const matchingFile = videoFiles.find((f) => f.name.endsWith(fileName));
      if (matchingFile) {
        console.log(`✅ Found video using existing URL: ${matchingFile.name}`);
        videoFile = storage.bucket().file(matchingFile.name);
      }
    }
  }

  // If no match found, try to find an unprocessed video
  if (!videoFile) {
    console.log("Looking for an unprocessed video file...");
    const unprocessedFile = videoFiles.find((file) => {
      const fileUrl = `https://storage.googleapis.com/${
        storage.bucket().name
      }/${file.name}`;
      return !processedVideoUrls.has(fileUrl);
    });

    if (unprocessedFile) {
      console.log(`✅ Found unprocessed video: ${unprocessedFile.name}`);
      videoFile = unprocessedFile;

      // Update the document with the video URL
      const videoUrl = `https://storage.googleapis.com/${
        storage.bucket().name
      }/${unprocessedFile.name}`;
      await docRef.update({
        videoUrl,
        originalFilename: path.basename(unprocessedFile.name),
        lastUpdated: new Date(),
      });
      console.log(`Updated document with video URL: ${videoUrl}`);
    }
  }

  if (!videoFile) {
    throw new Error(
      `No unprocessed videos found in storage for ID: ${videoId}`
    );
  }

  // Generate a signed URL for downloading
  console.log("Generating signed URL...");
  const [signedUrl] = await videoFile.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
  });
  console.log("✅ Got signed URL");

  // Download the video
  console.log("Downloading video...");
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const tempDir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const outputPath = path.join(tempDir, `${videoId}.mp4`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`✅ Downloaded video to ${outputPath}`);

  return outputPath;
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
    const prompt = `Watch this cooking video carefully and provide a detailed, unique analysis specific to this exact video. Return ONLY a JSON response with the following structure, ensuring all details are accurate and specific to this video:

{
  "title": "Recipe name exactly as shown or mentioned",
  "description": "Detailed description of what's actually demonstrated",
  "cuisine": "Specific cuisine type based on ingredients and techniques shown",
  "difficulty": "Easy/Medium/Hard based on techniques demonstrated",
  "cookingTime": total minutes shown or estimated from video,
  "ingredients": [
    {
      "name": "ingredient name exactly as shown in video",
      "amount": precise number or null if not shown,
      "unit": "exact unit mentioned or shown, or null",
      "notes": "specific preparation notes from video or null"
    }
  ],
  "instructions": [
    {
      "step": number,
      "description": "detailed step exactly as demonstrated in video",
      "timestamp": exact seconds when step starts in video or null,
      "duration": exact duration of step in seconds or null
    }
  ],
  "nutrition": {
    "servings": number based on recipe shown or null,
    "calories": calculated per serving or null,
    "protein": grams per serving or null,
    "carbs": grams per serving or null,
    "fat": grams per serving or null,
    "fiber": grams per serving or null
  },
  "tags": ["relevant tags based on actual video content"],
  "aiMetadata": {
    "detectedIngredients": ["list every ingredient shown or mentioned"],
    "detectedTechniques": ["list all cooking techniques demonstrated"],
    "confidenceScore": accuracy of analysis between 0 and 1,
    "suggestedHashtags": ["relevant hashtags based on actual video content"],
    "equipmentNeeded": ["all cooking equipment shown being used"],
    "skillLevel": "beginner/intermediate/advanced based on techniques shown",
    "totalTime": total minutes shown or estimated from video,
    "prepTime": preparation minutes shown or estimated,
    "cookTime": cooking minutes shown or estimated,
    "estimatedCost": {
      "min": minimum cost in cents based on ingredients shown,
      "max": maximum cost in cents based on ingredients shown,
      "currency": "USD"
    }
  }
}

Important:
1. Only include ingredients and steps actually shown in this specific video
2. Be precise with measurements and timings seen in the video
3. Base difficulty and times on what's demonstrated
4. List equipment that's actually used in this video
5. Ensure all details are unique to this particular recipe`;

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

        // Add a delay between videos to avoid rate limiting
        await delay(2000);
      } catch (error) {
        console.error(`Failed to analyze video ${video.id}:`, error);
        await videosRef.doc(video.id).update({
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          lastUpdated: new Date(),
        });
      }
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
  } finally {
    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }
}

// Run the script
console.log("🚀 Starting analysis of all videos...");
analyzeExistingVideos();
