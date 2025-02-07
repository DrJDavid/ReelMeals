"use client";

import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getVideo } from "@/lib/firebase/firestore-service";
import { formatDuration } from "@/lib/utils/format";
import { ClockIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RecipeInfoModal } from "./VideoCard";

export function VideoPageContent() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<FirestoreVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showRecipeInfo, setShowRecipeInfo] = useState(false);

  useEffect(() => {
    async function loadVideo() {
      if (!id || typeof id !== "string") {
        setError(new Error("Invalid video ID"));
        setLoading(false);
        return;
      }

      try {
        const videoData = await getVideo(id);
        if (!videoData) {
          throw new Error("Video not found");
        }
        setVideo(videoData);
      } catch (err) {
        console.error("Error loading video:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-full max-w-md aspect-[9/16] bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200 max-w-sm mx-auto">
          <h2 className="text-xl font-semibold mb-2">Error Loading Video</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  // Handle metadata from both possible locations
  const metadata = video.aiMetadata || video.analysis?.aiMetadata;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-50 text-white bg-black/50 rounded-full p-2"
        >
          ✕
        </button>
        <div className="relative aspect-[9/16] bg-black">
          <VideoPlayer videoUrl={video.videoUrl} autoPlay={true} loop={true} />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <h3 className="text-lg font-semibold text-white mb-2">
              {video.title}
            </h3>
            <div className="flex items-center space-x-4 text-white text-sm">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>
                  {formatDuration(metadata?.totalTime || video.cookingTime)}
                </span>
              </div>
              <span className="px-2 py-1 rounded-full bg-gray-700 text-xs">
                {video.difficulty}
              </span>
              <button
                onClick={() => setShowRecipeInfo(true)}
                className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RecipeInfoModal
        video={video}
        isOpen={showRecipeInfo}
        onClose={() => setShowRecipeInfo(false)}
      />
    </div>
  );
}
