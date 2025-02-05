"use client";

import SwipeableView from "@/components/swipe/SwipeableView";
import SwipeCard from "@/components/swipe/SwipeCard";
import { useVideoFeed } from "@/hooks/useVideoFeed";

export default function Home() {
  const {
    currentVideo,
    isLastVideo,
    handleLike,
    handleSkip,
    resetFeed,
    stats,
  } = useVideoFeed();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-md">
        {!isLastVideo && currentVideo ? (
          <>
            <SwipeableView onSwipeLeft={handleSkip} onSwipeRight={handleLike}>
              <SwipeCard
                video={currentVideo}
                onError={(error) => console.error("Video error:", error)}
              />
            </SwipeableView>

            {/* Swipe Instructions */}
            <div className="mt-6 flex justify-between text-gray-400 text-sm px-4">
              <div className="flex flex-col items-center">
                <span className="text-red-500 text-lg mb-1">←</span>
                <span>Swipe left to skip</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-green-500 text-lg mb-1">→</span>
                <span>Swipe right to like</span>
              </div>
            </div>

            {/* Debug Buttons */}
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Skip (←)
              </button>
              <button
                onClick={handleLike}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Like (→)
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 text-center text-gray-400">
              <p>
                Viewed: {stats.totalViewed} • Liked: {stats.totalLikes} •
                Skipped: {stats.totalSkips}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center text-white p-8 bg-gray-800 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">No More Videos!</h2>
            <p className="mb-4">You've seen all available videos.</p>
            <div className="space-y-2">
              <p>Total Viewed: {stats.totalViewed}</p>
              <p>Liked: {stats.totalLikes} videos</p>
              <p>Skipped: {stats.totalSkips} videos</p>
            </div>
            <button
              onClick={resetFeed}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
