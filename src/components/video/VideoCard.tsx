import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getUserDisplayName } from "@/lib/firebase/firestore-service";
import { formatDuration } from "@/lib/utils/format";
import {
  ClockIcon,
  HeartIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { RecipeViewer } from "../recipe/RecipeViewer";
import { HashTag } from "./HashTag";
import { VideoPlayer } from "./VideoPlayer";

// Helper functions for null checks and defaults
const DEFAULT_METADATA = {
  skillLevel: "Not specified",
  totalTime: 0,
  prepTime: 0,
  cookTime: 0,
  detectedTechniques: [],
  suggestedHashtags: [],
  equipmentNeeded: [],
  estimatedCost: { min: 0, max: 0, currency: "USD" },
};

interface VideoCardProps {
  video: FirestoreVideo;
  onLike?: () => void;
  isInCollection?: boolean;
  onError?: (error: any) => void;
}

// Memoized gradient generator
const useGradient = (title: string) => {
  return useMemo(() => {
    const hue1 =
      title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    const hue2 = (hue1 + 60) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 30%) 0%, hsl(${hue2}, 80%, 20%) 100%)`;
  }, [title]);
};

function VideoPlayerModal({
  video,
  isOpen,
  onClose,
  onShowRecipeInfo,
  uploaderName,
}: {
  video: FirestoreVideo;
  isOpen: boolean;
  onClose: () => void;
  onShowRecipeInfo: () => void;
  uploaderName: string;
}) {
  if (!isOpen) return null;

  const { analysis = {} } = video;
  const aiMetadata = analysis.aiMetadata || DEFAULT_METADATA;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="video-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md mx-auto">
          {/* Top Controls */}
          <div className="absolute -top-12 left-2 right-2 z-50 flex justify-between items-center">
            {/* Recipe Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                setTimeout(onShowRecipeInfo, 100);
              }}
              className="text-white/80 hover:text-white flex items-center space-x-2 p-2 transition-colors rounded-lg bg-black/20 backdrop-blur-sm hover:bg-black/40"
            >
              <InformationCircleIcon className="h-5 w-5" />
              <span className="text-sm">Recipe Details</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl">
            <VideoPlayer
              videoUrl={video.videoUrl}
              autoPlay={true}
              loop={true}
            />

            {/* Video Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
              <div className="max-w-lg mx-auto">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-1">
                  {video.title}
                </h3>
                <div className="text-sm text-white/80 mb-2">
                  by {uploaderName}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-white text-sm">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>
                      {formatDuration(
                        aiMetadata.totalTime || video.cookingTime || 0
                      )}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-gray-700/50 text-xs">
                    {aiMetadata.skillLevel ||
                      video.difficulty ||
                      "Not specified"}
                  </span>
                </div>
              </div>
            </div>
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
  onError,
}: VideoCardProps) {
  const [showRecipeInfo, setShowRecipeInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploaderName, setUploaderName] = useState("ReelMeals");

  const isProcessing = video.status === "processing";
  const hasFailed = video.status === "failed";

  const { analysis = {} } = video;
  const aiMetadata = analysis.aiMetadata || DEFAULT_METADATA;

  // Use memoized gradient
  const gradient = useGradient(video.title);

  useEffect(() => {
    async function fetchUploaderName() {
      if (!video.uploadedByUserId) {
        setUploaderName("ReelMeals");
        return;
      }
      try {
        const name = await getUserDisplayName(video.uploadedByUserId);
        setUploaderName(name);
      } catch (error) {
        console.error("Error fetching uploader name:", error);
        setUploaderName("ReelMeals");
      }
    }
    fetchUploaderName();
  }, [video.uploadedByUserId]);

  const handleVideoClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    if (isProcessing || hasFailed) return;
    setIsPlaying(true);
  };

  return (
    <>
      <div
        onClick={handleVideoClick}
        className="block cursor-pointer transform-gpu"
      >
        <div className="relative w-full aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
          {/* Title Card with Gradient */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform-gpu"
            style={{
              background: gradient,
              boxShadow: "inset 0 0 100px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 left-4 z-20 flex justify-between items-center">
              {isInCollection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike?.();
                  }}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-red-500/60 transition-colors group"
                  title="Remove from collection"
                >
                  <XCircleIcon className="h-8 w-8 text-white group-hover:text-white" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRecipeInfo(true);
                }}
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
              <div className="text-sm text-white/80 mb-2">
                by {uploaderName}
              </div>
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
                            aiMetadata.totalTime || video.cookingTime || 0
                          )}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs">
                        {aiMetadata.skillLevel ||
                          video.difficulty ||
                          "Not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {(aiMetadata.suggestedHashtags || [])
                      .slice(0, 2)
                      .map((tag) => (
                        <HashTag key={tag} tag={tag} />
                      ))}
                  </div>

                  {/* Like Button (only show in non-collection view) */}
                  {!isInCollection && (
                    <div className="flex items-center space-x-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike?.();
                        }}
                        className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
                      >
                        <HeartIcon className="h-4 w-4" />
                        <span>{video.likes || 0}</span>
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

              {/* Error State */}
              {hasFailed && (
                <div className="mt-2 text-red-400 text-sm">
                  <p>Failed to process video</p>
                  {video.error && <p className="text-xs mt-1">{video.error}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoPlayerModal
        video={video}
        isOpen={isPlaying}
        onClose={() => setIsPlaying(false)}
        onShowRecipeInfo={() => setShowRecipeInfo(true)}
        uploaderName={uploaderName}
      />

      {/* Recipe Info Modal */}
      <RecipeViewer
        video={video}
        isOpen={showRecipeInfo}
        onClose={() => setShowRecipeInfo(false)}
        uploaderName={uploaderName}
      />
    </>
  );
}
