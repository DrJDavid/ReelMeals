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

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Since this is our own API route, we can be permissive
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers to all responses
    const response = (data: any, status = 200) => {
      return NextResponse.json(data, {
        status,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      });
    };

    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return response(
        {
          error: "Unauthorized",
          details: "Missing or invalid authorization header",
        },
        401
      );
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      if (!decodedToken.uid) {
        return response(
          { error: "Unauthorized", details: "Invalid token" },
          401
        );
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return response(
        { error: "Unauthorized", details: "Token verification failed" },
        401
      );
    }

    // Get video URL from request
    const body = await request.json().catch(() => ({}));
    const { videoUrl } = body;

    if (!videoUrl) {
      return response(
        { error: "Bad Request", details: "No video URL provided" },
        400
      );
    }

    // Download video content
    const fetchResponse = await fetch(videoUrl);
    if (!fetchResponse.ok) {
      return response(
        {
          error: "Bad Request",
          details: `Failed to fetch video: ${fetchResponse.statusText}`,
        },
        400
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

    try {
      // Generate pre-screening content with Gemini
      const preScreenResult = await model.generateContent(preScreenParts);
      const preScreenResponse = await preScreenResult.response;
      const preScreenText = cleanAIResponse(preScreenResponse.text());

      // Parse the pre-screening response
      const preScreenData = JSON.parse(preScreenText);

      // If video is not valid or confidence is too low, reject it
      if (!preScreenData.isCookingVideo || preScreenData.confidence < 0.85) {
        return response({
          ...preScreenData,
          analysis: null,
        });
      }

      // If video is valid, proceed with full analysis
      const analysisPrompt = `Watch this cooking video carefully and provide a detailed, unique analysis specific to this exact video. Return ONLY a JSON response with the following structure, ensuring all details are accurate and specific to this video:

{
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
      return response({
        ...preScreenData,
        analysis: analysisData,
      });
    } catch (error) {
      console.error("Error in AI processing:", error);
      return response(
        {
          error: "AI Processing Error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  } catch (error) {
    console.error("Error processing video:", error);
    return response(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}
