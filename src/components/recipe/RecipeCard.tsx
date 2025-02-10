"use client";

import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { formatDuration } from "@/lib/utils/format";
import { processVideoMetadata } from "@/lib/video-data";
import {
  ClockIcon,
  InformationCircleIcon,
  ScaleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

interface RecipeCardProps {
  recipe: FirestoreVideo;
  onLike?: () => void;
  href: string;
}

export interface RecipeInfoModalProps {
  recipe: FirestoreVideo;
  isOpen: boolean;
  onClose: () => void;
}

// Split into a separate client component
const RecipeInfoModalContent = ({
  recipe,
  isOpen,
  onClose,
}: RecipeInfoModalProps) => {
  if (!isOpen) return null;

  const metadata = processVideoMetadata(recipe);

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
                  {metadata.title}
                </h3>
                <div className="mt-4 space-y-4">
                  {/* AI Metadata */}
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Skill Level:</span>
                        <span className="ml-2 text-white">
                          {metadata.difficulty}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Time:</span>
                        <span className="ml-2 text-white">
                          {metadata.totalTime} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Prep Time:</span>
                        <span className="ml-2 text-white">
                          {metadata.prepTime} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cook Time:</span>
                        <span className="ml-2 text-white">
                          {metadata.cookTime} min
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
                      {metadata.equipmentNeeded?.map((equipment, index) => (
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
                      {metadata.ingredients.map((ingredient, index) => (
                        <li key={index} className="text-sm text-gray-400">
                          • {ingredient.amount} {ingredient.unit}{" "}
                          {ingredient.name}
                          {ingredient.notes && (
                            <span className="text-gray-500">
                              {" "}
                              ({ingredient.notes})
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
                      {metadata.instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-400">
                          {index + 1}. {instruction.description}
                          {instruction.notes && (
                            <span className="text-gray-500 ml-2">
                              ({instruction.notes})
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
                          {metadata.calories}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Protein</div>
                        <div className="text-sm text-white">
                          {metadata.protein}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Carbs</div>
                        <div className="text-sm text-white">
                          {metadata.carbs}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Fat</div>
                        <div className="text-sm text-white">
                          {metadata.fat}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Fiber</div>
                        <div className="text-sm text-white">
                          {metadata.fiber}g
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-700 rounded">
                        <div className="text-xs text-gray-400">Servings</div>
                        <div className="text-sm text-white">
                          {metadata.servings}
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
                      {metadata.detectedTechniques?.map((technique, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-900/50 rounded-full text-xs text-primary-200"
                        >
                          {technique}
                        </span>
                      ))}
                      {metadata.suggestedHashtags?.map((tag, index) => (
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
                  {metadata.estimatedCost && (
                    <div className="mt-4 text-sm">
                      <span className="text-gray-400">Estimated Cost: </span>
                      <span className="text-white">
                        ${(metadata.estimatedCost.min / 100).toFixed(2)} - $
                        {(metadata.estimatedCost.max / 100).toFixed(2)}
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
};

// Main component
export function RecipeInfoModal(props: RecipeInfoModalProps) {
  return <RecipeInfoModalContent {...props} />;
}

export function RecipeCard({ recipe, onLike, href }: RecipeCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const metadata = processVideoMetadata(recipe);

  return (
    <div className="relative">
      <Link
        href={href}
        className="block bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <img
            src={metadata.thumbnailUrl}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Duration */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-white text-sm">
            {formatDuration(metadata.totalTime)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title and Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {metadata.title}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">
              {metadata.description}
            </p>
          </div>

          {/* Recipe Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Difficulty */}
            <div className="flex items-center text-gray-300">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>{metadata.difficulty}</span>
            </div>

            {/* Time */}
            <div className="flex items-center text-gray-300">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>{metadata.totalTime} min</span>
            </div>

            {/* Cost */}
            {metadata.estimatedCost && (
              <div className="flex items-center text-gray-300">
                <ScaleIcon className="h-4 w-4 mr-2" />
                <span>
                  ${(metadata.estimatedCost.min / 100).toFixed(2)} - $
                  {(metadata.estimatedCost.max / 100).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {metadata.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
              >
                #{tag}
              </span>
            ))}
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
