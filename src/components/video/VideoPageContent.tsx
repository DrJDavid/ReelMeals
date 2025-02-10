"use client";

import { RecipeViewer } from "@/components/recipe/RecipeViewer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { formatDuration } from "@/lib/utils/format";
import { processVideoMetadata } from "@/lib/video-data";
import {
  ClockIcon,
  HeartIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface VideoPageContentProps {
  video: FirestoreVideo;
  onLike?: () => void;
  uploaderName: string;
}

export function VideoPageContent({
  video,
  onLike,
  uploaderName,
}: VideoPageContentProps) {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [showRecipeInfo, setShowRecipeInfo] = useState(false);
  const metadata = processVideoMetadata(video);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Video Player */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
        <VideoPlayer
          videoUrl={metadata.videoUrl}
          autoPlay={false}
          loop={false}
        />
      </div>

      {/* Video Info */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {metadata.title}
            </h1>
            <p className="text-gray-400">by {uploaderName}</p>
          </div>
          <button
            onClick={() => setShowRecipeInfo(true)}
            className="flex items-center px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Recipe Details
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-gray-300">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            <span>{formatDuration(metadata.totalTime)}</span>
          </div>
          <div className="flex items-center">
            <HeartIcon className="h-5 w-5 mr-2" />
            <span>{metadata.likes} likes</span>
          </div>
        </div>

        <p className="mt-4 text-gray-300">{metadata.description}</p>
      </div>

      {/* Recipe Info Modal */}
      <RecipeViewer
        video={video}
        isOpen={showRecipeInfo}
        onClose={() => setShowRecipeInfo(false)}
        uploaderName={uploaderName}
      />
    </div>
  );
}
