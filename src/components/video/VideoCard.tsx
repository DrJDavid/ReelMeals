import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { formatDuration } from "@/lib/utils/format";
import { ClockIcon, HeartIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface VideoCardProps {
  video: FirestoreVideo;
  onLike?: () => void;
}

export function VideoCard({ video, onLike }: VideoCardProps) {
  const isProcessing = video.status === "processing";
  const hasFailed = video.status === "failed";

  return (
    <div className="relative w-full aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Thumbnail */}
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-gray-400 text-center p-4">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                <p>Processing video...</p>
              </>
            ) : hasFailed ? (
              <>
                <p className="text-red-500 mb-2">Processing failed</p>
                <p className="text-sm">{video.error}</p>
              </>
            ) : (
              "Thumbnail not available"
            )}
          </div>
        </div>
      )}

      {/* Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Title and Description */}
          <h3 className="text-lg font-semibold mb-1">
            {video.title || "Processing recipe..."}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">
            {video.description || "Analyzing video content..."}
          </p>

          {/* Recipe Details */}
          {!isProcessing && !hasFailed && (
            <div className="space-y-2">
              {/* Time and Difficulty */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>{formatDuration(video.cookingTime)}</span>
                </div>
                <span className="px-2 py-1 rounded-full bg-gray-700 text-xs">
                  {video.difficulty}
                </span>
              </div>

              {/* Cuisine and Tags */}
              <div className="flex flex-wrap gap-2">
                {video.cuisine && (
                  <span className="px-2 py-1 rounded-full bg-purple-900/50 text-xs">
                    {video.cuisine}
                  </span>
                )}
                {video.aiMetadata.suggestedHashtags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-gray-700/50 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <button
                  onClick={onLike}
                  className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
                >
                  <HeartIcon className="h-4 w-4" />
                  <span>{video.likes}</span>
                </button>
                <span>{video.views} views</span>
              </div>
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
    </div>
  );
}
