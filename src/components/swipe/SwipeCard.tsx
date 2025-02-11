"use client";

import { VideoPlayer } from "@/components/video/VideoPlayer";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getUserDisplayName } from "@/lib/firebase/firestore-service";
import { processVideoMetadata } from "@/lib/video-data";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { RecipeViewer } from "../recipe/RecipeViewer";
import { HashTag } from "../video/HashTag";

interface SwipeCardProps {
  video: FirestoreVideo;
  onError?: (error: any) => void;
}

export default function SwipeCard({ video, onError }: SwipeCardProps) {
  const [showDescription, setShowDescription] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [uploaderName, setUploaderName] = useState("ReelMeals");

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

  // Process video metadata once
  const metadata = processVideoMetadata(video);

  return (
    <>
      <div className="relative w-full h-full">
        <VideoPlayer
          videoUrl={metadata.videoUrl}
          autoPlay={true}
          loop={true}
          onError={onError}
        />

        <div className="absolute inset-0 flex flex-col">
          {/* Top Gradient */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent">
            {/* Info Button */}
            <button
              onClick={() => setShowInfo(true)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-20"
              aria-label="Show recipe information"
            >
              <InformationCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Bottom Gradient and Content */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 ease-in-out ${
              showDescription ? "h-64" : "h-24"
            }`}
          >
            {/* Toggle Button */}
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full p-1.5 pointer-events-auto hover:bg-black/70 transition-colors z-10"
            >
              {showDescription ? (
                <ChevronDownIcon className="w-5 h-5 text-white" />
              ) : (
                <ChevronUpIcon className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Video Metadata */}
            <div
              className={`absolute inset-x-0 bottom-16 px-4 space-y-2 transition-opacity duration-300 ${
                showDescription
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Title and Chef */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {metadata.title}
                  </h2>
                  <p className="text-sm text-white/90">by {uploaderName}</p>
                </div>
                <div className="flex items-center space-x-2 bg-black/50 px-2 py-1 rounded">
                  <span className="text-sm text-white">
                    {metadata.difficulty}
                  </span>
                  <span className="text-white">•</span>
                  <span className="text-sm text-white">
                    {metadata.totalTime}min
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-white/90 line-clamp-2">
                {metadata.description}
              </p>

              {/* Cuisine and Stats */}
              <div className="flex items-center justify-between">
                <span className="text-sm bg-black/50 px-2 py-1 rounded text-white">
                  {metadata.cuisine}
                </span>
                <div className="flex items-center space-x-4 text-sm text-white">
                  <span className="flex items-center">
                    👍 {metadata.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    👁️ {metadata.views.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pb-2">
                {metadata.tags.slice(0, 3).map((tag) => (
                  <HashTag key={tag} tag={tag} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Info Modal */}
      <RecipeViewer
        video={video}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        uploaderName={uploaderName}
      />
    </>
  );
}
