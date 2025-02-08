import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Verify API key is loaded
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

// Maximum size for video payload (20MB in bytes)
const MAX_CHUNK_SIZE = 19 * 1024 * 1024; // Leave some room for the prompt

async function analyzeVideoChunk(
  chunk: Buffer,
  isFirstChunk: boolean,
  isLastChunk: boolean
): Promise<string> {
  // Convert chunk to base64
  const videoBase64 = chunk.toString("base64");

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

  // Enhanced prompt for detailed analysis
  const prompt = `${contextPrefix}Analyze this cooking video segment and provide a COMPLETE and DETAILED analysis. You MUST include ALL of the following sections with specific details:

1. Title and Brief Description:
   - Recipe name (be specific)
   - Detailed description of the dish
   - Type of cuisine (be specific about region/style)
   - Difficulty level (Easy/Medium/Hard)
   - Total cooking time

2. Ingredients List:
   - List EVERY ingredient seen with EXACT quantities
   - Include preparation notes for each ingredient
   - Identify key ingredients that are essential
   - Estimate cost for each ingredient

3. Step-by-Step Instructions:
   - Number each step
   - Include EXACT timing for each step
   - List specific temperatures when applicable
   - Describe techniques in detail
   - Note any special equipment needed per step

4. Nutritional Information (per serving):
   - Number of servings this recipe makes
   - Calories
   - Protein (g)
   - Carbohydrates (g)
   - Fat (g)
   - Fiber (g)
   - Sodium (mg)
   - Other relevant nutrients

5. Equipment and Preparation:
   - List ALL required kitchen tools
   - Note any optional but helpful equipment
   - Specify size/capacity of pots/pans needed

6. Time Breakdown:
   - Prep time
   - Active cooking time
   - Total time
   - Any wait/rest periods

7. Cost Analysis:
   - Estimated total cost
   - Cost per serving
   - Cost-saving suggestions
   - Where to find specialty ingredients

8. Tips and Variations:
   - Common mistakes to avoid
   - Substitution options
   - Storage instructions
   - Reheating instructions

9. Social Media and Search:
   - Relevant hashtags
   - Search keywords
   - Diet categories (e.g., gluten-free, vegan)
   - Occasion suggestions

Remember to be SPECIFIC and DETAILED in your analysis. Include exact measurements, times, and temperatures whenever possible.`;

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
  return response.text();
}

async function analyzeVideo(videoPath: string): Promise<string> {
  try {
    // Read the video file as a buffer
    const videoBuffer = fs.readFileSync(videoPath);
    const totalSize = videoBuffer.length;

    if (totalSize <= MAX_CHUNK_SIZE) {
      // If video is small enough, analyze it in one go
      return await analyzeVideoChunk(videoBuffer, true, true);
    }

    console.log(
      `⚠️ Video size (${(totalSize / 1024 / 1024).toFixed(
        2
      )}MB) exceeds limit. Analyzing in chunks...`
    );

    // Calculate number of chunks needed
    const numChunks = Math.ceil(totalSize / MAX_CHUNK_SIZE);
    const analyses: string[] = [];

    // Process video in chunks
    for (let i = 0; i < numChunks; i++) {
      const start = i * MAX_CHUNK_SIZE;
      const end = Math.min(start + MAX_CHUNK_SIZE, totalSize);
      const chunk = videoBuffer.subarray(start, end);

      console.log(
        `Processing chunk ${i + 1}/${numChunks} (${(
          (end - start) /
          1024 /
          1024
        ).toFixed(2)}MB)...`
      );

      const analysis = await analyzeVideoChunk(
        chunk,
        i === 0,
        i === numChunks - 1
      );
      analyses.push(analysis);
    }

    // Combine analyses with clear separation
    return analyses.join("\n\n=== NEXT VIDEO SEGMENT ===\n\n");
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
}

async function testVideoAnalysis() {
  try {
    // Get all MP4 files from the videos directory
    const videosDir = path.join(__dirname, "..", "videos");
    const videoFiles = fs
      .readdirSync(videosDir)
      .filter((file) => file.endsWith(".mp4"));

    console.log(`Found ${videoFiles.length} videos to analyze\n`);

    // Create output directory for results
    const outputDir = path.join(__dirname, "..", "analysis-results");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Process each video
    for (const videoFile of videoFiles) {
      console.log(`\n=== Analyzing ${videoFile} ===`);
      const videoPath = path.join(videosDir, videoFile);

      try {
        // Analyze video
        const analysis = await analyzeVideo(videoPath);

        // Save results to file
        const outputPath = path.join(
          outputDir,
          `${videoFile.replace(".mp4", "")}.txt`
        );
        fs.writeFileSync(outputPath, analysis);

        console.log(`✅ Analysis completed and saved to ${outputPath}`);

        // Print the full analysis during testing
        console.log("\nFull Analysis:");
        console.log("=============");
        console.log(analysis);
        console.log("\n=============");
      } catch (error) {
        console.error(`❌ Failed to analyze ${videoFile}:`, error);
        // Continue with next video
        continue;
      }
    }

    console.log("\n🎉 All videos processed!");
  } catch (error) {
    console.error("\n❌ Error during video analysis:", error);
    process.exit(1);
  }
}

// Run the test
console.log("🚀 Starting video analysis...");
testVideoAnalysis();
