"use client";

import VideoPlayer from "@/components/video/VideoPlayer";
import { VideoMetadata } from "@/lib/video-data";

interface SwipeCardProps {
  video: VideoMetadata;
  onError?: (error: any) => void;
}

export default function SwipeCard({ video, onError }: SwipeCardProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="relative">
        <VideoPlayer
          videoUrl={video.videoUrl}
          autoPlay={true}
          muted={true}
          loop={true}
          onError={onError}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

        {/* Top Metadata */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">{video.title}</h2>
            <p className="text-sm opacity-90">by {video.chef}</p>
          </div>
          <div className="flex items-center space-x-2 bg-black/50 px-2 py-1 rounded">
            <span className="text-sm">{video.difficulty}</span>
            <span>•</span>
            <span className="text-sm">{video.cookingTime}min</span>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm bg-black/50 px-2 py-1 rounded">
              {video.cuisine}
            </span>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                👍 {video.likes.toLocaleString()}
              </span>
              <span className="flex items-center">
                👁️ {video.views.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-sm line-clamp-2 mb-2">{video.description}</p>

          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white/20 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
