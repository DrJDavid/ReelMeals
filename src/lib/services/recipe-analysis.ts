import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import * as fs from "fs";
import { db } from "../firebase/firebase-config";
import { FirestoreVideo } from "../firebase/firestore-schema";

// Initialize Firebase Functions
const functions = getFunctions();

// Connect to emulator in development
if (process.env.NODE_ENV === "development") {
  const { connectFunctionsEmulator } = require("firebase/functions");
  connectFunctionsEmulator(functions, "localhost", 5002);
}

export interface RecipeAnalysisResult {
  ingredients: FirestoreVideo["ingredients"];
  instructions: FirestoreVideo["instructions"];
  nutrition: FirestoreVideo["nutrition"];
  aiMetadata: NonNullable<FirestoreVideo["aiMetadata"]>;
}

export class RecipeAnalysisService {
  private static async analyzeVideoContent(
    videoPath: string
  ): Promise<RecipeAnalysisResult> {
    try {
      // Read the video file as a buffer
      const videoBuffer = fs.readFileSync(videoPath);

      // Convert buffer to base64
      const videoBase64 = videoBuffer.toString("base64");

      // Enhanced prompt for Gemini 2.0 Pro's improved reasoning capabilities
      const prompt = `As a culinary expert, analyze this cooking video in detail. Please provide:

1. Ingredients List:
   - List each ingredient with precise quantities and units
   - Note any possible substitutions
   - Identify key ingredients that significantly impact the dish

2. Step-by-Step Instructions:
   - Provide detailed steps with video timestamps
   - Include cooking temperatures and times
   - Note specific techniques used at each step
   - Highlight critical steps that affect the outcome

3. Nutritional Analysis:
   - Calculate per-serving nutritional values
   - Estimate portion sizes
   - Include macronutrients and key micronutrients

4. Technical Details:
   - Identify all cooking techniques used
   - Note specialized equipment needed
   - Suggest skill level required
   - Provide estimated total preparation and cooking time

Please structure your response in a clear, detailed format that can be parsed programmatically.`;

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
      const response = await result.response;
      const text = response.text();

      // Process the AI response into structured data
      return this.processAIResponse(text);
    } catch (error) {
      console.error("Error analyzing video content:", error);
      throw new Error("Failed to analyze video content");
    }
  }

  private static processAIResponse(aiResponse: string): RecipeAnalysisResult {
    try {
      // TODO: Implement proper parsing of the structured AI response
      // For now, returning mock data until we implement parsing
      return {
        ingredients: [
          {
            name: "Example Ingredient",
            amount: 1,
            unit: "cup",
            estimatedPrice: 299,
          },
        ],
        instructions: [
          {
            step: 1,
            description: "Example step",
            timestamp: 0,
            duration: 60,
          },
        ],
        nutrition: {
          servings: 4,
          calories: 300,
          protein: 20,
          carbs: 30,
          fat: 10,
          fiber: 5,
        },
        aiMetadata: {
          detectedIngredients: ["ingredient1"],
          detectedTechniques: ["technique1"],
          confidenceScore: 0.95,
          suggestedHashtags: ["#recipe", "#cooking"],
          equipmentNeeded: ["pan", "stove"],
          skillLevel: "beginner",
          totalTime: 30,
          prepTime: 10,
          cookTime: 20,
          estimatedCost: {
            min: 1000, // $10.00
            max: 2000, // $20.00
            currency: "USD",
          },
          lastProcessed: Timestamp.now(),
        },
      };
    } catch (error) {
      console.error("Error processing AI response:", error);
      throw new Error("Failed to process AI response");
    }
  }

  /**
   * Process a new video that's being uploaded
   */
  public static async processNewVideo(
    videoId: string,
    videoPath: string
  ): Promise<void> {
    const videoRef = doc(db, "videos", videoId);

    try {
      // Update status to processing
      await updateDoc(videoRef, { status: "processing" });

      // Call the cloud function
      const analyzeVideo = httpsCallable(functions, "analyzeVideo");
      const result = await analyzeVideo({ videoId });

      console.log("Video analysis result:", result.data);
    } catch (error) {
      console.error("Error processing video:", error);
      await updateDoc(videoRef, {
        status: "failed",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  }

  /**
   * Analyze an existing video that's already in Firestore
   */
  public static async analyzeExistingVideo(videoId: string): Promise<void> {
    const videoRef = doc(db, "videos", videoId);

    try {
      // Update status to processing
      await updateDoc(videoRef, { status: "processing" });

      // Call the cloud function
      const analyzeExistingVideo = httpsCallable(
        functions,
        "analyzeExistingVideo"
      );
      const result = await analyzeExistingVideo({ videoId });

      console.log("Video analysis result:", result.data);
    } catch (error) {
      console.error("Error analyzing existing video:", error);
      await updateDoc(videoRef, {
        status: "failed",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  }

  /**
   * Estimate prices for ingredients
   */
  public static async estimateIngredientPrices(
    ingredients: FirestoreVideo["ingredients"]
  ): Promise<FirestoreVideo["ingredients"]> {
    try {
      // Here we would integrate with a price estimation API
      // For now, returning mock prices
      return ingredients.map((ingredient) => ({
        ...ingredient,
        estimatedPrice: Math.floor(Math.random() * 1000), // Random price between $0-$10
      }));
    } catch (error) {
      console.error("Error estimating ingredient prices:", error);
      return ingredients;
    }
  }
}
