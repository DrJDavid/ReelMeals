import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { formatDuration } from "@/lib/utils/format";
import { ScaleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface RecipeViewerProps {
  video: FirestoreVideo;
  isOpen: boolean;
  onClose: () => void;
  uploaderName: string;
}

const DEFAULT_METADATA = {
  skillLevel: "Not specified",
  totalTime: 0,
  prepTime: 0,
  cookTime: 0,
  detectedTechniques: [] as string[],
  suggestedHashtags: [] as string[],
  equipmentNeeded: [] as string[],
  estimatedCost: { min: 0, max: 0, currency: "USD" },
};

export function RecipeViewer({
  video,
  isOpen,
  onClose,
  uploaderName,
}: RecipeViewerProps) {
  if (!isOpen) return null;

  // Safely access nested properties
  const aiMetadata = video.analysis?.aiMetadata || DEFAULT_METADATA;
  const analysisIngredients = video.analysis?.ingredients || [];
  const analysisInstructions = video.analysis?.instructions || [];

  // Combine metadata from both sources
  const combinedMetadata = {
    skillLevel: aiMetadata.skillLevel || video.difficulty || "Not specified",
    totalTime: aiMetadata.totalTime || video.cookingTime || 0,
    prepTime: aiMetadata.prepTime || 0,
    cookTime: aiMetadata.cookTime || 0,
    cuisine: video.cuisine,
    techniques: [
      ...(aiMetadata.detectedTechniques || []),
      ...(video.techniques || []),
    ],
    hashtags: aiMetadata.suggestedHashtags || [],
    equipment: aiMetadata.equipmentNeeded || [],
    estimatedCost: aiMetadata.estimatedCost,
    ingredients:
      analysisIngredients.length > 0
        ? analysisIngredients
        : video.ingredients || [],
    instructions:
      analysisInstructions.length > 0
        ? analysisInstructions
        : video.instructions || [],
    servings: video.servings,
    description: video.description,
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm"
      aria-labelledby="recipe-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="min-h-screen px-4 text-center">
        <div className="inline-block w-full max-w-2xl my-8 text-left align-middle">
          <div
            className="relative bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-700/50 text-white hover:bg-gray-700 transition-colors z-10"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {video.title}
                </h2>
                <p className="text-gray-400">by {uploaderName}</p>
                {combinedMetadata.description && (
                  <p className="mt-4 text-gray-300">
                    {combinedMetadata.description}
                  </p>
                )}
              </div>

              {/* Recipe Overview */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="ml-2 text-white">
                      {combinedMetadata.skillLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Time:</span>
                    <span className="ml-2 text-white">
                      {formatDuration(combinedMetadata.totalTime)}
                    </span>
                  </div>
                  {combinedMetadata.prepTime > 0 && (
                    <div>
                      <span className="text-gray-400">Prep Time:</span>
                      <span className="ml-2 text-white">
                        {formatDuration(combinedMetadata.prepTime)}
                      </span>
                    </div>
                  )}
                  {combinedMetadata.cookTime > 0 && (
                    <div>
                      <span className="text-gray-400">Cook Time:</span>
                      <span className="ml-2 text-white">
                        {formatDuration(combinedMetadata.cookTime)}
                      </span>
                    </div>
                  )}
                  {combinedMetadata.servings && (
                    <div>
                      <span className="text-gray-400">Servings:</span>
                      <span className="ml-2 text-white">
                        {combinedMetadata.servings}
                      </span>
                    </div>
                  )}
                  {combinedMetadata.cuisine && (
                    <div>
                      <span className="text-gray-400">Cuisine:</span>
                      <span className="ml-2 text-white">
                        {combinedMetadata.cuisine}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipment */}
              {combinedMetadata.equipment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {combinedMetadata.equipment.map(
                      (equipment: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white"
                        >
                          {equipment}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Ingredients
                </h2>
                {combinedMetadata.ingredients &&
                combinedMetadata.ingredients.length > 0 ? (
                  <ul className="space-y-2">
                    {combinedMetadata.ingredients.map(
                      (ingredient: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-start text-gray-300"
                        >
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
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500">No ingredients listed</p>
                )}
              </div>

              {/* Instructions */}
              {combinedMetadata.instructions &&
                combinedMetadata.instructions.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Instructions
                    </h2>
                    <ol className="space-y-4">
                      {combinedMetadata.instructions.map(
                        (instruction: any, index: number) => (
                          <li
                            key={index}
                            className="flex items-start text-gray-300 group"
                          >
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
                        )
                      )}
                    </ol>
                  </div>
                )}

              {/* Techniques & Tags */}
              {(combinedMetadata.techniques.length > 0 ||
                combinedMetadata.hashtags.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Techniques & Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {combinedMetadata.techniques.map(
                      (technique: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-900/50 rounded-full text-sm text-primary-200"
                        >
                          {technique}
                        </span>
                      )
                    )}
                    {combinedMetadata.hashtags.map(
                      (tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                        >
                          #{tag}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Estimated Cost */}
              {combinedMetadata.estimatedCost && (
                <div className="flex items-center text-gray-300">
                  <ScaleIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Estimated Cost:</span>
                  <span className="ml-2">
                    ${(combinedMetadata.estimatedCost.min / 100).toFixed(2)} - $
                    {(combinedMetadata.estimatedCost.max / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
