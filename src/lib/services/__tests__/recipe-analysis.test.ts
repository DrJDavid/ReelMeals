import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import { RecipeAnalysisService } from "../recipe-analysis";

// Mock the dependencies
jest.mock("@google/generative-ai");
jest.mock("@google/generative-ai/server");
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe("RecipeAnalysisService", () => {
  const mockVideoUrl = "https://storage.googleapis.com/test-video.mp4";
  const mockVideoId = "test-video-id";

  // Sample AI response that matches our expected format
  const mockAIResponse = `
1. Ingredients List:
   - 2 cups all-purpose flour
   - 1 teaspoon salt
   - 3 large eggs
   - Key ingredients: flour, eggs

2. Step-by-Step Instructions:
   - Step 1: Mix flour and salt [00:15]
   - Step 2: Add eggs and whisk [01:30]
   Temperature: 350°F
   Duration: 5 minutes

3. Nutritional Analysis:
   Servings: 4
   Per serving:
   - Calories: 250
   - Protein: 8g
   - Carbs: 45g
   - Fat: 4g
   - Fiber: 2g

4. Technical Details:
   Techniques: whisking, folding
   Equipment: mixing bowl, whisk
   Skill Level: beginner
   Total Time: 15 minutes
  `;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock Gemini client setup
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => mockAIResponse,
          },
        }),
      }),
    }));

    // Mock file manager
    (GoogleAIFileManager as jest.Mock).mockImplementation(() => ({
      uploadFile: jest.fn().mockResolvedValue({
        file: {
          name: "test-file",
          uri: "test-uri",
          mimeType: "video/mp4",
        },
      }),
      getFile: jest.fn().mockResolvedValue({
        state: FileState.SUCCEEDED,
      }),
    }));
  });

  describe("processVideo", () => {
    it("should process a video successfully", async () => {
      const result = await RecipeAnalysisService.processVideo(
        mockVideoId,
        mockVideoUrl
      );

      // Verify the video was processed and status was updated
      expect(result).toBeUndefined();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: "active" })
      );
    });

    it("should handle video processing failure", async () => {
      // Mock file manager to simulate processing failure
      (GoogleAIFileManager as jest.Mock).mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({
          file: {
            name: "test-file",
            uri: "test-uri",
            mimeType: "video/mp4",
          },
        }),
        getFile: jest.fn().mockResolvedValue({
          state: FileState.FAILED,
        }),
      }));

      await expect(
        RecipeAnalysisService.processVideo(mockVideoId, mockVideoUrl)
      ).rejects.toThrow("Failed to analyze video content");

      // Verify status was updated to failed
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: "failed" })
      );
    });
  });

  describe("processAIResponse", () => {
    it("should parse AI response correctly", async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: { text: () => mockAIResponse },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await RecipeAnalysisService.processVideo(
        mockVideoId,
        mockVideoUrl
      );

      // Verify the parsed response contains expected data structure
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              amount: expect.any(Number),
              unit: expect.any(String),
            }),
          ]),
          instructions: expect.arrayContaining([
            expect.objectContaining({
              step: expect.any(Number),
              description: expect.any(String),
              timestamp: expect.any(Number),
            }),
          ]),
          nutrition: expect.objectContaining({
            servings: expect.any(Number),
            calories: expect.any(Number),
            protein: expect.any(Number),
            carbs: expect.any(Number),
            fat: expect.any(Number),
            fiber: expect.any(Number),
          }),
          aiMetadata: expect.objectContaining({
            detectedIngredients: expect.any(Array),
            detectedTechniques: expect.any(Array),
            confidenceScore: expect.any(Number),
            lastProcessed: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("estimateIngredientPrices", () => {
    it("should estimate prices for all ingredients", async () => {
      const ingredients = [
        { name: "flour", amount: 2, unit: "cups" },
        { name: "eggs", amount: 3, unit: "large" },
      ];

      const result = await RecipeAnalysisService.estimateIngredientPrices(
        ingredients
      );

      expect(result).toHaveLength(ingredients.length);
      result.forEach((ingredient) => {
        expect(ingredient).toHaveProperty("estimatedPrice");
        expect(typeof ingredient.estimatedPrice).toBe("number");
        expect(ingredient.estimatedPrice).toBeLessThan(1000);
      });
    });
  });
});
