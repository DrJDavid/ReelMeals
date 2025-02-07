import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";

// Define config parameters
const geminiKey = defineString("GEMINI_KEY");

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
const storage = getStorage();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(geminiKey.value());
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

// Add constants for chunk handling
const MAX_CHUNK_SIZE = 19 * 1024 * 1024; // 19MB to leave room for the prompt
const CHUNK_OVERLAP = 5 * 1024 * 1024; // 5MB overlap to ensure we don't miss anything
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

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

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;

    console.log(
      `Operation failed, retrying in ${
        delay / 1000
      } seconds... (${retries} retries left)`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));

    return retryWithExponentialBackoff(operation, retries - 1, delay * 2);
  }
}

async function processVideoInChunks(
  videoBuffer: ArrayBuffer
): Promise<VideoAnalysis> {
  const totalSize = videoBuffer.byteLength;

  if (totalSize <= MAX_CHUNK_SIZE) {
    // If video is small enough, process it in one go
    const videoBase64 = Buffer.from(videoBuffer).toString("base64");
    return analyzeVideoChunk(videoBase64, true, true);
  }

  console.log(
    `Video size (${(totalSize / 1024 / 1024).toFixed(
      2
    )}MB) exceeds limit. Processing in chunks...`
  );

  // Calculate number of chunks needed
  const numChunks = Math.ceil(totalSize / (MAX_CHUNK_SIZE - CHUNK_OVERLAP));
  const analyses: Partial<VideoAnalysis>[] = [];

  // Process video in chunks
  for (let i = 0; i < numChunks; i++) {
    const start = i * (MAX_CHUNK_SIZE - CHUNK_OVERLAP);
    const end = Math.min(start + MAX_CHUNK_SIZE, totalSize);
    const chunk = Buffer.from(videoBuffer.slice(start, end));

    console.log(
      `Processing chunk ${i + 1}/${numChunks} (${(
        (end - start) /
        1024 /
        1024
      ).toFixed(2)}MB)...`
    );

    const analysis = await analyzeVideoChunk(
      chunk.toString("base64"),
      i === 0,
      i === numChunks - 1
    );
    analyses.push(analysis);

    // Free up memory
    global.gc?.();
  }

  // Merge analyses
  return mergeAnalyses(analyses);
}

async function analyzeVideoChunk(
  videoBase64: string,
  isFirstChunk: boolean,
  isLastChunk: boolean
): Promise<VideoAnalysis> {
  return retryWithExponentialBackoff(async () => {
    // Adjust prompt based on which chunk we're processing
    let contextPrefix = "";
    if (!isFirstChunk) {
      contextPrefix =
        "This is a continuation of the previous video segment. Continue the analysis, focusing on: ";
    }
    if (!isLastChunk) {
      contextPrefix +=
        "This is not the complete video. Analyze what you can see in this segment. ";
    }

    const prompt = `${contextPrefix}Analyze this cooking video segment and provide a JSON response with the following structure. Return ONLY the JSON, no other text:

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

    try {
      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "video/mp4",
            data: videoBase64,
          },
        },
      ];

      const result = await model.generateContent(parts);
      const aiResponse = await result.response;
      const text = aiResponse.text();

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from Gemini API");
      }

      return parseAIResponse(text);
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      if (error instanceof Error) {
        // Add context to the error
        error.message = `Gemini API error: ${error.message}`;
      }
      throw error;
    }
  });
}

function mergeAnalyses(analyses: Partial<VideoAnalysis>[]): VideoAnalysis {
  // Start with the first analysis as base
  const merged = { ...analyses[0] } as VideoAnalysis;

  // Merge subsequent analyses
  for (let i = 1; i < analyses.length; i++) {
    const current = analyses[i];

    // Merge ingredients (deduplicate by name)
    const ingredientMap = new Map(
      merged.ingredients.map((ing) => [ing.name, ing])
    );
    current.ingredients?.forEach((ing) => {
      if (!ingredientMap.has(ing.name)) {
        merged.ingredients.push(ing);
      }
    });

    // Merge instructions (ensure proper step ordering)
    current.instructions?.forEach((inst) => {
      const lastStep =
        merged.instructions[merged.instructions.length - 1]?.step || 0;
      merged.instructions.push({
        ...inst,
        step: lastStep + 1,
      });
    });

    // Merge tags (deduplicate)
    merged.tags = [...new Set([...merged.tags, ...(current.tags || [])])];

    // Merge AI metadata
    if (current.aiMetadata) {
      merged.aiMetadata = {
        ...merged.aiMetadata,
        detectedIngredients: [
          ...new Set([
            ...merged.aiMetadata.detectedIngredients,
            ...current.aiMetadata.detectedIngredients,
          ]),
        ],
        detectedTechniques: [
          ...new Set([
            ...merged.aiMetadata.detectedTechniques,
            ...current.aiMetadata.detectedTechniques,
          ]),
        ],
        suggestedHashtags: [
          ...new Set([
            ...merged.aiMetadata.suggestedHashtags,
            ...current.aiMetadata.suggestedHashtags,
          ]),
        ],
        equipmentNeeded: [
          ...new Set([
            ...merged.aiMetadata.equipmentNeeded,
            ...current.aiMetadata.equipmentNeeded,
          ]),
        ],
        // Take the average of confidence scores
        confidenceScore:
          (merged.aiMetadata.confidenceScore +
            current.aiMetadata.confidenceScore) /
          2,
      };
    }
  }

  return merged;
}

// Add error monitoring
function logError(error: unknown, context: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error in ${context}:`, {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

// Add a function to check the cache
async function checkCache(videoId: string): Promise<VideoAnalysis | null> {
  const cacheRef = db.collection("videoAnalysisCache").doc(videoId);
  const cacheDoc = await cacheRef.get();
  if (cacheDoc.exists) {
    console.log(`Cache hit for video ${videoId}`);
    return cacheDoc.data() as VideoAnalysis;
  }
  console.log(`Cache miss for video ${videoId}`);
  return null;
}

// Add a function to update the cache
async function updateCache(videoId: string, analysis: VideoAnalysis) {
  const cacheRef = db.collection("videoAnalysisCache").doc(videoId);
  await cacheRef.set(analysis);
  console.log(`Cache updated for video ${videoId}`);
}

// Update the main function to use caching
export const analyzeVideo = onObjectFinalized(
  {
    region: "us-central1",
    memory: "4GiB",
    timeoutSeconds: 540,
    retry: true,
  },
  async (event) => {
    const startTime = Date.now();
    try {
      // Only process videos in the videos/ directory
      if (!event.data.name?.startsWith("videos/")) {
        console.log("Not a video in videos/ directory, skipping");
        return;
      }

      // Extract video ID from the file path
      const videoId = event.data.name.split("/")[1].replace(".mp4", "");
      console.log(`Processing video ${videoId}...`);

      // Check the cache
      const cachedAnalysis = await checkCache(videoId);
      if (cachedAnalysis) {
        // Update video document with cached results
        const docRef = db.collection("videos").doc(videoId);
        await docRef.update({
          ...cachedAnalysis,
          status: "active",
          updatedAt: Timestamp.now(),
        });
        console.log(
          `✅ Successfully processed ${videoId} from cache in ${
            (Date.now() - startTime) / 1000
          }s`
        );
        return;
      }

      // Get the video document
      const docRef = db.collection("videos").doc(videoId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.log(`No document found for video ${videoId}, skipping`);
        return;
      }

      // Update status to processing
      await docRef.update({
        status: "processing",
        updatedAt: Timestamp.now(),
      });

      // Get signed URL for the video
      const [signedUrl] = await storage
        .bucket(event.data.bucket)
        .file(event.data.name)
        .getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

      // Download video data
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const videoBuffer = await response.arrayBuffer();
      const analysis = await processVideoInChunks(videoBuffer);

      // Update video document with analysis results
      await docRef.update({
        ...analysis,
        status: "active",
        updatedAt: Timestamp.now(),
      });

      // Update the cache
      await updateCache(videoId, analysis);

      console.log(
        `✅ Successfully processed ${videoId} in ${
          (Date.now() - startTime) / 1000
        }s`
      );
    } catch (error) {
      logError(error, `video processing (${event.data.name})`);
      throw error;
    }
  }
);

// Add this new function after the existing analyzeVideo function
export const analyzeExistingVideo = onRequest(
  {
    region: "us-central1",
    memory: "2GiB",
    timeoutSeconds: 540,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Get video ID from request body
    const { videoId } = req.body;
    if (!videoId) {
      res.status(400).send("Missing videoId in request body");
      return;
    }

    console.log(`Processing existing video ${videoId}...`);

    try {
      // Get the video document
      const docRef = db.collection("videos").doc(videoId);
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).send(`No document found for video ${videoId}`);
        return;
      }

      // Update status to processing
      await docRef.update({
        status: "processing",
        updatedAt: Timestamp.now(),
      });

      // Get the video file from Storage
      const file = storage.bucket().file(`videos/${videoId}.mp4`);
      const [exists] = await file.exists();

      if (!exists) {
        throw new Error(
          `Video file not found in storage: videos/${videoId}.mp4`
        );
      }

      // Get signed URL for the video
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

      // Download video data
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const videoBuffer = await response.arrayBuffer();
      const analysis = await processVideoInChunks(videoBuffer);

      // Update video document with analysis results
      await docRef.update({
        ...analysis,
        status: "active",
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Successfully processed ${videoId}`);
      res.status(200).json({ success: true, videoId });
    } catch (error) {
      console.error(`❌ Failed to process ${videoId}:`, error);

      // Update video document with error status
      const docRef = db.collection("videos").doc(videoId);
      await docRef.update({
        status: "failed",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        updatedAt: Timestamp.now(),
      });

      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);
