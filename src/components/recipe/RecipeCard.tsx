"use client";

import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { formatDuration } from "@/lib/utils/format";
import {
  ClockIcon,
  HeartIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface RecipeCardProps {
  recipe: FirestoreVideo;
  onLike?: () => void;
}

function RecipeInfoModal({
  recipe,
  isOpen,
  onClose,
}: {
  recipe: FirestoreVideo;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const analysis = recipe.analysis || {};
  const {
    ingredients = [],
    instructions = [],
    nutrition = {},
    aiMetadata = {},
  } = analysis;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-white"
                  id="modal-title"
                >
                  {recipe.title}
                </h3>
                <div className="mt-4 space-y-4">
                  {/* AI Metadata */}
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Skill Level:</span>
                        <span className="ml-2 text-white">
                          {aiMetadata.skillLevel}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Time:</span>
                        <span className="ml-2 text-white">
                          {aiMetadata.totalTime} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Prep Time:</span>
                        <span className="ml-2 text-white">
                          {aiMetadata.prepTime} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cook Time:</span>
                        <span className="ml-2 text-white">
                          {aiMetadata.cookTime} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Needed */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300">
                      Equipment Needed
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {aiMetadata.equipmentNeeded?.map((equipment, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
                        >
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300">
                      Ingredients
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {ingredients.map((ingredient, index) => (
                        <li key={index} className="text-sm text-gray-400">
                          • {ingredient.amount} {ingredient.unit}{" "}
                          {ingredient.name}
                          {ingredient.notes && (
                            <span className="text-gray-500">
                              {" "}
                              ({ingredient.notes})
                            </span>
                          )}
                          {ingredient.estimatedPrice && (
                            <span className="text-gray-500 ml-2">
                              (~${(ingredient.estimatedPrice / 100).toFixed(2)})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300">
                      Instructions
                    </h4>
                    <ol className="mt-2 space-y-2">
                      {instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-400">
                          {index + 1}. {instruction.description}
                          {instruction.duration && (
                            <span className="text-gray-500 ml-2">
                              ({instruction.duration}s)
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Nutrition */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300">
                      Nutrition (per serving)
                    </h4>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Calories</div>
                        <div className="text-sm text-white">
                          {nutrition.calories}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Protein</div>
                        <div className="text-sm text-white">
                          {nutrition.protein}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Carbs</div>
                        <div className="text-sm text-white">
                          {nutrition.carbs}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Fat</div>
                        <div className="text-sm text-white">
                          {nutrition.fat}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Fiber</div>
                        <div className="text-sm text-white">
                          {nutrition.fiber}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Servings</div>
                        <div className="text-sm text-white">
                          {nutrition.servings}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Techniques & Tags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300">
                      Techniques & Tags
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {aiMetadata.detectedTechniques?.map(
                        (technique, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-900/50 rounded-full text-xs text-primary-200"
                          >
                            {technique}
                          </span>
                        )
                      )}
                      {aiMetadata.suggestedHashtags?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Cost */}
                  {aiMetadata.estimatedCost && (
                    <div className="mt-4 text-sm">
                      <span className="text-gray-400">Estimated Cost: </span>
                      <span className="text-white">
                        ${(aiMetadata.estimatedCost.min / 100).toFixed(2)} - $
                        {(aiMetadata.estimatedCost.max / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeCard({ recipe, onLike }: RecipeCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const isProcessing = recipe.status === "processing";
  const hasFailed = recipe.status === "failed";
  const analysis = recipe.analysis || {};
  const { aiMetadata = {} } = analysis;

  return (
    <div className="relative">
      <Link href={`/recipe/${recipe.id}`}>
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:ring-2 hover:ring-primary-500 transition-all">
          {/* Thumbnail */}
          <div className="relative aspect-video">
            {recipe.thumbnailUrl ? (
              <Image
                src={recipe.thumbnailUrl}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="text-gray-400 text-center p-4">
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                      <p>Processing recipe...</p>
                    </>
                  ) : hasFailed ? (
                    <>
                      <p className="text-red-500 mb-2">Processing failed</p>
                      <p className="text-sm">{recipe.error}</p>
                    </>
                  ) : (
                    "Thumbnail not available"
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              {recipe.title || "Processing recipe..."}
            </h3>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {recipe.description || "Analyzing recipe content..."}
            </p>

            {/* Recipe Details */}
            {!isProcessing && !hasFailed && (
              <div className="space-y-3">
                {/* Time and Difficulty */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-300">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>
                      {aiMetadata.totalTime
                        ? `${aiMetadata.totalTime} min`
                        : formatDuration(recipe.cookingTime)}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-gray-700 text-xs text-gray-300">
                    {aiMetadata.skillLevel || recipe.difficulty}
                  </span>
                </div>

                {/* Cuisine and Tags */}
                <div className="flex flex-wrap gap-2">
                  {recipe.cuisine && (
                    <span className="px-2 py-1 rounded-full bg-primary-900/50 text-primary-200 text-xs">
                      {recipe.cuisine}
                    </span>
                  )}
                  {aiMetadata.suggestedHashtags
                    ?.slice(0, 2)
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full bg-gray-700 text-gray-300 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onLike?.();
                    }}
                    className="flex items-center space-x-1 hover:text-primary-400 transition-colors"
                  >
                    <HeartIcon className="h-4 w-4" />
                    <span>{recipe.likes}</span>
                  </button>
                  <span>{recipe.views} views</span>
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-2">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full w-1/3 animate-[progress_1s_ease-in-out_infinite]" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Analyzing recipe details...
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Info Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowInfo(true);
        }}
        className="absolute top-2 right-2 p-1 rounded-full bg-gray-900/80 text-white hover:bg-gray-800 transition-colors z-10"
        aria-label="Show recipe information"
      >
        <InformationCircleIcon className="h-5 w-5" />
      </button>

      {/* Info Modal */}
      <RecipeInfoModal
        recipe={recipe}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
