/**
 * Mapping utility to convert legacy (lightweight) metadata to our unified enriched metadata schema.
 * This ensures consistent formatting regardless of when the video was processed.
 */

export interface LightweightMetadata {
  isCookingVideo: boolean;
  confidence: number;
  reason: string;
  detectedContent: {
    hasCookingInstructions: boolean;
    hasIngredients: boolean;
    hasRecipeSteps: boolean;
    identifiedDish?: string;
    cookingTechniquesShown?: string[];
  };
}

export interface EnrichedVideoMetadata {
  title: string;
  description: string;
  cuisine: string;
  difficulty: "Easy" | "Medium" | "Hard";
  cookingTime: number;
  ingredients: Array<{
    name: string;
    amount: number | null;
    unit: string | null;
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
    estimatedCost: { min: number; max: number; currency: string };
  };
}

export function mapLightweightToEnriched(
  lightData: LightweightMetadata
): Partial<EnrichedVideoMetadata> {
  return {
    title: lightData.detectedContent.identifiedDish || "Untitled Recipe",
    description: lightData.reason,
    cuisine: "", // Source for cuisine should be defined; using empty as placeholder.
    difficulty: lightData.confidence > 0.9 ? "Easy" : "Medium",
    cookingTime: 0, // Placeholder if not present in legacy data.
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
      detectedIngredients: lightData.detectedContent.hasIngredients
        ? ["ingredient"]
        : [],
      detectedTechniques:
        lightData.detectedContent.cookingTechniquesShown || [],
      confidenceScore: lightData.confidence,
      suggestedHashtags: [],
      equipmentNeeded: [],
      skillLevel: lightData.confidence > 0.9 ? "Easy" : "Medium",
      totalTime: 0,
      prepTime: 0,
      cookTime: 0,
      estimatedCost: { min: 0, max: 0, currency: "USD" },
    },
  };
}
