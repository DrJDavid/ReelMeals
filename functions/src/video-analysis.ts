import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request } from "express";
import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

// Define config parameters
const geminiKey = defineString("GEMINI_KEY");

// Initialize Firebase Admin
initializeApp();

// Initialize services with required permissions:
// - Storage Object Viewer: for reading video files
// - Storage Object Creator: for writing signed URLs
// - Service Account Token Creator: for generating signed URLs
const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

// Initialize CORS middleware with specific origins
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void
  ) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://reelmeals-63cc4.web.app",
      "https://reelmeals-63cc4.firebaseapp.com",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".web.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

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
    amount: number | null;
    unit: string | null;
    notes?: string | null;
  }>;
  instructions: Array<{
    step: number;
    description: string;
    timestamp?: number;
    duration?: number;
  }>;
  nutrition: {
    servings: number | null;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
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

interface AuthenticatedRequest extends Request {
  auth?: {
    uid: string;
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
  videoBuffer: ArrayBufferLike
): Promise<VideoAnalysis> {
  // Convert ArrayBufferLike to ArrayBuffer if needed
  const buffer =
    videoBuffer instanceof ArrayBuffer
      ? videoBuffer
      : new ArrayBuffer(videoBuffer.byteLength);
  const totalSize = buffer.byteLength;

  if (totalSize <= MAX_CHUNK_SIZE) {
    // If video is small enough, process it in one go
    const videoBase64 = Buffer.from(buffer).toString("base64");
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
    const chunk = Buffer.from(buffer.slice(start, end));

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

    const prompt = `${contextPrefix}Analyze this video and determine if it's a cooking/recipe video. A video should be considered a cooking video if it shows ANY of the following:
1. Food preparation or cooking process
2. Recipe instructions or steps
3. Cooking techniques being demonstrated
4. Ingredients being used or shown
5. Final cooked dish being presented

Return ONLY a JSON response with the following structure, ensuring all details are accurate and specific to this video:

{
  "title": "Recipe name",
  "description": "Detailed description",
  "cuisine": "Specific cuisine type",
  "difficulty": "Easy/Medium/Hard",
  "cookingTime": minutes,
  "ingredients": [
    {
      "name": "ingredient name exactly as shown in video",
      "amount": number or null if not shown,
      "unit": "exact unit mentioned or shown, or null",
      "notes": "specific preparation notes from video or null"
    }
  ],
  "instructions": [
    {
      "step": number,
      "description": "detailed step exactly as demonstrated in video",
      "timestamp": seconds when step starts in video or null,
      "duration": step duration in seconds or null
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
  "tags": ["tag1", "tag2"],
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

Be generous in classification - if there's any food preparation or cooking content at all, classify it as a cooking video.
If you're unsure, err on the side of classifying it as a cooking video with lower confidence rather than rejecting it.`;

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

// Add CORS headers helper
const addCorsHeaders = (req: any, res: any) => {
  const origin = req.headers.origin;

  // If origin matches our allowed origins, set it
  if (origin) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://reelmeals-63cc4.web.app",
      "https://reelmeals-63cc4.firebaseapp.com",
    ];

    if (allowedOrigins.includes(origin) || origin.endsWith(".web.app")) {
      res.set("Access-Control-Allow-Origin", origin);
    }
  }

  res.set("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
  res.set(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders.join(", ")
  );
  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Max-Age", corsOptions.maxAge.toString());

  // For preflight requests
  if (req.method === "OPTIONS") {
    res.set("Vary", "Origin");
  }

  return res;
};

// Update the main function to use CORS and handle signed URLs
export const analyzeVideo = onRequest(
  {
    region: "us-central1",
    memory: "4GiB",
    timeoutSeconds: 540,
    cors: true,
  },
  async (req: AuthenticatedRequest, res) => {
    console.log("Received analyze request:", {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      console.log("Handling CORS preflight request");
      addCorsHeaders(req, res);
      res.status(204).send("");
      return;
    }

    // Add CORS headers to all responses
    addCorsHeaders(req, res);

    // Only allow POST requests
    if (req.method !== "POST") {
      console.error("Invalid method:", req.method);
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      res.status(401).json({
        error: "Unauthorized",
        details: "Missing or invalid authorization header",
      });
      return;
    }

    // Verify token
    const token = authHeader.split("Bearer ")[1];
    try {
      console.log("Verifying auth token");
      const decodedToken = await auth.verifyIdToken(token);
      if (!decodedToken.uid) {
        console.error("Invalid token - no uid");
        res.status(401).json({
          error: "Unauthorized",
          details: "Invalid token",
        });
        return;
      }
      console.log("Token verified for user:", decodedToken.uid);
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({
        error: "Unauthorized",
        details: "Token verification failed",
      });
      return;
    }

    const { videoId, videoUrl } = req.body;
    if (!videoId || !videoUrl) {
      console.error("Missing required fields:", { videoId, videoUrl });
      res
        .status(400)
        .json({ error: "Missing videoId or videoUrl in request body" });
      return;
    }

    try {
      console.log(`Starting analysis for video ${videoId}`);

      // Create or verify document first
      const docRef = db.collection("videos").doc(videoId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        console.log(`Creating initial document for video ${videoId}`);
        await docRef.set({
          id: videoId,
          status: "processing",
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          title: "",
          description: "",
          cuisine: "",
          difficulty: "Medium",
          cookingTime: 0,
          ingredients: [],
          instructions: [],
          nutrition: {
            servings: null,
            calories: null,
            protein: null,
            carbs: null,
            fat: null,
            fiber: null,
          },
          tags: [],
          aiMetadata: {
            detectedIngredients: [],
            detectedTechniques: [],
            confidenceScore: 0,
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
          videoUrl: "",
          error: null,
        });
      }

      // Download video data
      console.log("Downloading video...", { videoUrl });
      // Extract the file path from the Firebase Storage URL
      let videoPath;
      let videoBuffer;
      try {
        if (videoUrl.includes("firebasestorage.googleapis.com")) {
          const urlParts = videoUrl.split("/o/");
          if (urlParts.length < 2) {
            throw new Error("Invalid storage URL format");
          }
          videoPath = decodeURIComponent(urlParts[1].split("?")[0]);
        } else {
          videoPath = videoUrl;
        }
        console.log("Resolved video path:", videoPath);

        // Get the file directly from storage
        const file = storage.bucket().file(videoPath);
        const [exists] = await file.exists();

        if (!exists) {
          console.error(`Video file not found: ${videoPath}`);
          throw new Error(`Video file not found in storage: ${videoPath}`);
        }

        console.log("Found video file, downloading...");
        // Get a read stream for the file
        const [fileBuffer] = await file.download();
        videoBuffer = fileBuffer.buffer;

        console.log(
          "Successfully downloaded video, size:",
          videoBuffer.byteLength
        );
      } catch (error) {
        console.error("Error downloading video:", error);
        throw error;
      }

      console.log("Processing video in chunks...");
      const analysis = await processVideoInChunks(videoBuffer);
      console.log("Video analysis complete:", analysis);

      // Check if it's a cooking video based on analysis
      let validationScore = 0;
      const REQUIRED_SCORE = 3;

      // Check ingredients (must have at least 2 with amounts/units)
      const ingredientsWithMeasurements = analysis.ingredients.filter(
        (ing) => ing.amount !== null || ing.unit !== null
      );
      if (ingredientsWithMeasurements.length >= 2) validationScore++;

      // Check instructions (must have ordered steps)
      if (analysis.instructions.length >= 2) validationScore++;

      // Check cooking techniques (must demonstrate actual cooking)
      const validTechniques = analysis.aiMetadata.detectedTechniques.filter(
        (technique) =>
          technique.toLowerCase().includes("cook") ||
          technique.toLowerCase().includes("bake") ||
          technique.toLowerCase().includes("fry") ||
          technique.toLowerCase().includes("chop") ||
          technique.toLowerCase().includes("mix") ||
          technique.toLowerCase().includes("prep")
      );
      if (validTechniques.length >= 1) validationScore++;

      // Check equipment (must use cooking tools)
      const validEquipment = analysis.aiMetadata.equipmentNeeded.filter(
        (equipment) =>
          equipment.toLowerCase().includes("pan") ||
          equipment.toLowerCase().includes("pot") ||
          equipment.toLowerCase().includes("knife") ||
          equipment.toLowerCase().includes("oven") ||
          equipment.toLowerCase().includes("stove") ||
          equipment.toLowerCase().includes("bowl") ||
          equipment.toLowerCase().includes("utensil")
      );
      if (validEquipment.length >= 1) validationScore++;

      // Check recipe structure
      if (
        analysis.title &&
        analysis.cookingTime > 0 &&
        analysis.difficulty &&
        analysis.cuisine
      )
        validationScore++;

      const isCookingVideo = validationScore >= REQUIRED_SCORE;
      const confidence = analysis.aiMetadata.confidenceScore || 0;

      console.log("Validation results:", {
        isCookingVideo,
        validationScore,
        confidence,
        details: {
          hasValidIngredients: ingredientsWithMeasurements.length >= 2,
          hasValidInstructions: analysis.instructions.length >= 2,
          hasValidTechniques: validTechniques.length >= 1,
          hasValidEquipment: validEquipment.length >= 1,
          hasValidStructure:
            analysis.title &&
            analysis.cookingTime > 0 &&
            analysis.difficulty &&
            analysis.cuisine,
        },
      });

      if (!isCookingVideo || confidence < 0.7) {
        console.log(
          `Video ${videoId} is not a valid cooking video (score: ${validationScore}/${REQUIRED_SCORE}, confidence: ${confidence}). Deleting...`
        );

        // Delete the video from storage
        try {
          const file = storage.bucket().file(videoPath);
          await file.delete();
          console.log(`Deleted video ${videoId} from storage`);
        } catch (error) {
          console.error(`Error deleting video ${videoId}:`, error);
        }

        // Update document with error status
        await docRef.update({
          status: "failed",
          error: `Not a valid cooking video. Missing required elements (score: ${validationScore}/${REQUIRED_SCORE})`,
          validationDetails: {
            score: validationScore,
            requiredScore: REQUIRED_SCORE,
            confidence,
            hasValidIngredients: ingredientsWithMeasurements.length >= 2,
            hasValidInstructions: analysis.instructions.length >= 2,
            hasValidTechniques: validTechniques.length >= 1,
            hasValidEquipment: validEquipment.length >= 1,
          },
          updatedAt: admin.firestore.Timestamp.now(),
        });

        res.status(200).json({
          success: false,
          videoId,
          reason: `Not a valid cooking video. Missing required elements (score: ${validationScore}/${REQUIRED_SCORE})`,
          confidence,
          details: {
            hasValidIngredients: ingredientsWithMeasurements.length >= 2,
            hasValidInstructions: analysis.instructions.length >= 2,
            hasValidTechniques: validTechniques.length >= 1,
            hasValidEquipment: validEquipment.length >= 1,
            hasValidStructure: validationScore >= REQUIRED_SCORE,
          },
        });
        return;
      }

      // Update document with analysis results
      const [downloadUrl] = await storage
        .bucket()
        .file(videoPath)
        .getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        });

      // Update the document with the signed URL that will work in the browser
      await docRef.update({
        ...analysis,
        status: "active",
        videoUrl: downloadUrl,
        updatedAt: admin.firestore.Timestamp.now(),
        validationDetails: {
          score: validationScore,
          requiredScore: REQUIRED_SCORE,
          confidence,
          hasValidIngredients: ingredientsWithMeasurements.length >= 2,
          hasValidInstructions: analysis.instructions.length >= 2,
          hasValidTechniques: validTechniques.length >= 1,
          hasValidEquipment: validEquipment.length >= 1,
        },
        error: null, // Clear any previous errors
      });

      console.log(
        `✅ Successfully analyzed video ${videoId} and updated Firestore`
      );
      res.status(200).json({
        success: true,
        videoId,
        analysis,
      });
    } catch (error) {
      console.error(`❌ Error processing video ${videoId}:`, error);

      // Delete the video from storage on error
      try {
        const file = storage.bucket().file(`videos/${videoId}`);
        await file.delete();
        console.log(`Deleted video ${videoId} from storage after error`);
      } catch (deleteError) {
        console.error(`Error deleting video ${videoId}:`, deleteError);
      }

      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
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
      const videoPath = `videos/${videoId}`;
      const file = storage.bucket().file(videoPath);
      const [exists] = await file.exists();

      if (!exists) {
        throw new Error(`Video file not found in storage: ${videoPath}`);
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
