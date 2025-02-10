"use client";

import { NavBar } from "@/components/NavBar";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getVideo } from "@/lib/firebase/firestore-service";
import { formatDuration } from "@/lib/utils/format";
import { processVideoMetadata } from "@/lib/video-data";
import { ScaleIcon } from "@heroicons/react/24/outline";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RecipePageContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<FirestoreVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      if (!id || typeof id !== "string") {
        setError(new Error("Invalid recipe ID"));
        setLoading(false);
        return;
      }

      try {
        const recipeData = await getVideo(id);
        if (!recipeData) {
          throw new Error("Recipe not found");
        }
        setRecipe(recipeData);
      } catch (err) {
        console.error("Error loading recipe:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-800 rounded-lg mb-8" />
            <div className="h-8 bg-gray-800 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            <h2 className="text-xl font-semibold mb-2">Error Loading Recipe</h2>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  const metadata = processVideoMetadata(recipe);

  return (
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Video Section */}
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-8">
            <VideoPlayer videoUrl={recipe.videoUrl} />
          </div>

          {/* Recipe Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {metadata.title}
            </h1>
            <p className="text-gray-400">by {user?.displayName}</p>
            {metadata.description && (
              <p className="mt-4 text-gray-300">{metadata.description}</p>
            )}
          </div>

          {/* Recipe Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              {/* Basic Details */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Recipe Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="ml-2 text-white">
                      {metadata.difficulty}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Time:</span>
                    <span className="ml-2 text-white">
                      {formatDuration(metadata.totalTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Prep Time:</span>
                    <span className="ml-2 text-white">
                      {formatDuration(metadata.prepTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cook Time:</span>
                    <span className="ml-2 text-white">
                      {formatDuration(metadata.cookTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Servings:</span>
                    <span className="ml-2 text-white">{metadata.servings}</span>
                  </div>
                  {metadata.cuisine && (
                    <div>
                      <span className="text-gray-400">Cuisine:</span>
                      <span className="ml-2 text-white">
                        {metadata.cuisine}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nutrition Info */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Nutrition Information
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Servings</div>
                    <div className="text-lg font-medium text-white">
                      {metadata.servings}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Calories</div>
                    <div className="text-lg font-medium text-white">
                      {metadata.calories}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Protein</div>
                    <div className="text-lg font-medium text-white">
                      {metadata.protein}g
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Carbs</div>
                    <div className="text-lg font-medium text-white">
                      {metadata.carbs}g
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Fat</div>
                    <div className="text-lg font-medium text-white">
                      {metadata.fat}g
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-400">Fiber</div>
                    <div className="text-lg font-medium text-white">
                      {metadata.fiber}g
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              {metadata.equipmentNeeded.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Equipment Needed
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {metadata.equipmentNeeded.map((equipment, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Ingredients & Instructions */}
            <div className="space-y-6">
              {/* Ingredients */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Ingredients
                </h2>
                <ul className="space-y-2">
                  {metadata.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <span className="mr-2">•</span>
                      <span>
                        {ingredient.amount && (
                          <span className="font-medium">
                            {ingredient.amount}{" "}
                          </span>
                        )}
                        {ingredient.unit && (
                          <span className="text-gray-400">
                            {ingredient.unit}{" "}
                          </span>
                        )}
                        {ingredient.name}
                        {ingredient.notes && (
                          <span className="text-gray-500 ml-1">
                            ({ingredient.notes})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Instructions
                </h2>
                <ol className="space-y-4">
                  {metadata.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full mr-3 text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p>{instruction.description}</p>
                        {instruction.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Note: {instruction.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Cost Estimation */}
              {metadata.estimatedCost && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <ScaleIcon className="h-6 w-6 mr-2" />
                    Estimated Cost
                  </h2>
                  <div className="text-gray-300">
                    <span className="text-lg">
                      ${(metadata.estimatedCost.min / 100).toFixed(2)} - $
                      {(metadata.estimatedCost.max / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags and Techniques */}
          <div className="space-y-6">
            {/* Techniques */}
            {metadata.detectedTechniques.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Cooking Techniques
                </h2>
                <div className="flex flex-wrap gap-2">
                  {metadata.detectedTechniques.map((technique, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-900/50 rounded-full text-sm text-primary-200"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {metadata.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
