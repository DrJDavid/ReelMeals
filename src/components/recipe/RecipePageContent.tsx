"use client";

import { NavBar } from "@/components/NavBar";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getVideo } from "@/lib/firebase/firestore-service";
import { formatDuration } from "@/lib/utils/format";
import { ClockIcon, HeartIcon, ShareIcon } from "@heroicons/react/24/outline";
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
            <h1 className="text-3xl font-bold text-white mb-4">
              {recipe.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-gray-300">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>{formatDuration(recipe.cookingTime)}</span>
              </div>
              <div className="flex items-center">
                <HeartIcon className="h-5 w-5 mr-2" />
                <span>{recipe.likes} likes</span>
              </div>
              <button className="flex items-center text-gray-300 hover:text-white transition-colors">
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Recipe Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ingredients
              </h2>
              <ul className="space-y-2 text-gray-300">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-gray-400">
                          {" "}
                          ({ingredient.notes})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Instructions
              </h2>
              <ol className="space-y-4 text-gray-300">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex">
                    <span className="font-semibold mr-4">{index + 1}.</span>
                    <span>{instruction.description}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Nutrition Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Servings</div>
                <div className="text-xl text-white">
                  {recipe.nutrition.servings}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Calories</div>
                <div className="text-xl text-white">
                  {recipe.nutrition.calories}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Protein</div>
                <div className="text-xl text-white">
                  {recipe.nutrition.protein}g
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Carbs</div>
                <div className="text-xl text-white">
                  {recipe.nutrition.carbs}g
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Fat</div>
                <div className="text-xl text-white">
                  {recipe.nutrition.fat}g
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Fiber</div>
                <div className="text-xl text-white">
                  {recipe.nutrition.fiber}g
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
