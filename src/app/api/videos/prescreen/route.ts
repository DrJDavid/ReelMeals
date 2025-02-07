"use server";

import { auth } from "@/lib/firebase/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

function cleanAIResponse(text: string): string {
  // Remove markdown code block indicators and any surrounding whitespace
  return text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get video URL from request
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL provided" },
        { status: 400 }
      );
    }

    // Download video content
    const fetchResponse = await fetch(videoUrl);
    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await fetchResponse.arrayBuffer());
    const videoBase64 = buffer.toString("base64");

    // First, check if it's a valid cooking video
    const preScreenPrompt = `Analyze this video and determine if it's a cooking/recipe video. Return ONLY a JSON object with no additional text or formatting, following this exact structure:
{
  "isCookingVideo": boolean,
  "confidence": number between 0 and 1,
  "reason": "detailed explanation",
  "detectedContent": {
    "hasCookingInstructions": boolean,
    "hasIngredients": boolean,
    "hasRecipeSteps": boolean,
    "identifiedDish": "name if identified",
    "cookingTechniquesShown": ["technique1", "technique2"]
  }
}

Requirements for a valid cooking video (confidence should be at least 0.85):
1. Must show food preparation or cooking process
2. Should have clear steps or instructions
3. Should show ingredients being used
4. Must demonstrate cooking techniques`;

    // Create parts array with the prompt and video data
    const preScreenParts = [
      { text: preScreenPrompt },
      {
        inlineData: {
          mimeType: "video/mp4",
          data: videoBase64,
        },
      },
    ];

    // Generate pre-screening content with Gemini
    const preScreenResult = await model.generateContent(preScreenParts);
    const preScreenResponse = await preScreenResult.response;
    const preScreenText = cleanAIResponse(preScreenResponse.text());

    // Parse the pre-screening response
    const preScreenData = JSON.parse(preScreenText);

    // If video is not valid or confidence is too low, reject it
    if (!preScreenData.isCookingVideo || preScreenData.confidence < 0.85) {
      return NextResponse.json({
        ...preScreenData,
        analysis: null,
      });
    }

    // If video is valid, proceed with full analysis
    const analysisPrompt = `Analyze this cooking video and provide a JSON response with the following structure. Return ONLY the JSON, no other text:

{
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": number or null,
      "unit": "unit" or null,
      "notes": "preparation notes" or null
    }
  ],
  "instructions": [
    {
      "step": number,
      "description": "instruction",
      "timestamp": seconds_in_video or null,
      "duration": step_duration or null
    }
  ],
  "nutrition": {
    "servings": number or null,
    "calories": number or null,
    "protein": number or null,
    "carbs": number or null,
    "fat": number or null,
    "fiber": number or null
  },
  "aiMetadata": {
    "detectedIngredients": ["ingredient1"],
    "detectedTechniques": ["technique1"],
    "confidenceScore": number between 0 and 1,
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

    // Create parts array for full analysis
    const analysisParts = [
      { text: analysisPrompt },
      {
        inlineData: {
          mimeType: "video/mp4",
          data: videoBase64,
        },
      },
    ];

    // Generate analysis content with Gemini
    const analysisResult = await model.generateContent(analysisParts);
    const analysisResponse = await analysisResult.response;
    const analysisText = cleanAIResponse(analysisResponse.text());

    // Parse the analysis response
    const analysisData = JSON.parse(analysisText);

    // Return both pre-screening and analysis results
    return NextResponse.json({
      ...preScreenData,
      analysis: analysisData,
    });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 }
    );
  }
}
