import { incrementVideoViews } from "@/lib/firebase/firestore-operations";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { formatDuration } from "@/lib/utils/format";
import {
  ClockIcon,
  HeartIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { VideoPlayer } from "./VideoPlayer";

interface VideoCardProps {
  video: FirestoreVideo;
  onLike?: () => void;
  isInCollection?: boolean;
}

interface RecipeInfoModalProps {
  video: FirestoreVideo;
  isOpen: boolean;
  onClose: () => void;
}

function RecipeInfoModal({ video, isOpen, onClose }: RecipeInfoModalProps) {
  if (!isOpen) return null;

  // Handle metadata from both possible locations
  const metadata = video.aiMetadata || video.analysis?.aiMetadata;
  const ingredients = video.ingredients || video.analysis?.ingredients || [];
  const instructions = video.instructions || video.analysis?.instructions || [];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="recipe-modal"
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
                <h3 className="text-lg leading-6 font-medium text-white mb-4">
                  {video.title}
                </h3>

                {/* Ingredients */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Ingredients
                  </h4>
                  <ul className="space-y-2">
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
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                {instructions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Instructions
                    </h4>
                    <ol className="space-y-2">
                      {instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-400">
                          {index + 1}. {instruction.description}
                          {instruction.duration && (
                            <span className="text-gray-500 ml-1">
                              (~{Math.round(instruction.duration / 60)} min)
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Cooking Time:</span>
                    <span className="ml-2 text-white">
                      {metadata?.totalTime || video.cookingTime} min
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="ml-2 text-white">{video.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cuisine:</span>
                    <span className="ml-2 text-white">{video.cuisine}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
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

export function VideoCard({
  video,
  onLike,
  isInCollection = false,
}: VideoCardProps) {
  const [showRecipeInfo, setShowRecipeInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const isProcessing = video.status === "processing";
  const hasFailed = video.status === "failed";

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRecipeInfo(true);
  };

  const handleVideoClick = async () => {
    if (!isProcessing && !hasFailed) {
      setIsPlaying(true);
      // Only increment view count once per session
      if (!hasIncrementedView) {
        await incrementVideoViews(video.id);
        setHasIncrementedView(true);
      }
    }
  };

  // Handle metadata from both possible locations
  const metadata = video.aiMetadata || video.analysis?.aiMetadata;
  const suggestedHashtags = metadata?.suggestedHashtags || [];

  // Generate a unique but consistent gradient for each video
  const getGradient = (title: string) => {
    // Use the title to generate consistent colors for the same video
    const hue1 =
      title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    const hue2 = (hue1 + 60) % 360; // Complementary color offset

    return `linear-gradient(135deg, 
      hsl(${hue1}, 70%, 30%) 0%,
      hsl(${hue2}, 80%, 20%) 100%
    )`;
  };

  return (
    <>
      <div onClick={handleVideoClick} className="block cursor-pointer">
        <div className="relative w-full aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
          {isPlaying ? (
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
              <div className="relative w-full max-w-md mx-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(false);
                  }}
                  className="absolute top-4 right-4 z-50 text-white bg-black/50 rounded-full p-2"
                >
                  ✕
                </button>
                <div className="relative aspect-[9/16] bg-black">
                  <VideoPlayer
                    videoUrl={video.videoUrl}
                    autoPlay={true}
                    loop={true}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-white text-sm">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>
                          {formatDuration(
                            metadata?.totalTime || video.cookingTime
                          )}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-gray-700 text-xs">
                        {video.difficulty}
                      </span>
                      <button
                        onClick={handleInfoClick}
                        className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
                      >
                        <InformationCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Title Card with Gradient */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                style={{
                  background: getGradient(video.title),
                  boxShadow: "inset 0 0 100px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 left-4 z-20 flex justify-between items-center">
                  {isInCollection && (
                    <button
                      onClick={handleActionClick}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-red-500/60 transition-colors group"
                      title="Remove from collection"
                    >
                      <XMarkIcon className="h-8 w-8 text-white group-hover:text-white" />
                    </button>
                  )}
                  <button
                    onClick={handleInfoClick}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors ml-auto"
                  >
                    <InformationCircleIcon className="h-8 w-8 text-white" />
                  </button>
                </div>

                {/* Center Title */}
                <div className="relative z-10 mb-4">
                  <h2 className="text-2xl font-bold text-white mb-2 text-shadow-lg">
                    {video.title}
                  </h2>
                  {video.cuisine && (
                    <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white">
                      {video.cuisine}
                    </div>
                  )}
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Title and Description */}
                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                    {video.description || "Analyzing video content..."}
                  </p>

                  {/* Recipe Details */}
                  {!isProcessing && !hasFailed && (
                    <div className="space-y-2">
                      {/* Time and Difficulty */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>
                              {formatDuration(
                                metadata?.totalTime || video.cookingTime
                              )}
                            </span>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs">
                            {video.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {suggestedHashtags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Like Button (only show in non-collection view) */}
                      {!isInCollection && (
                        <div className="flex items-center space-x-4 text-sm">
                          <button
                            onClick={handleActionClick}
                            className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
                          >
                            <HeartIcon className="h-4 w-4" />
                            <span>{video.likes}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing Indicator */}
                  {isProcessing && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-1/3 animate-[progress_1s_ease-in-out_infinite]" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Analyzing recipe details...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <RecipeInfoModal
        video={video}
        isOpen={showRecipeInfo}
        onClose={() => setShowRecipeInfo(false)}
      />
    </>
  );
}
