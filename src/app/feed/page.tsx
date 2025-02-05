"use client";

import SwipeableView from "@/components/swipe/SwipeableView";
import SwipeCard from "@/components/swipe/SwipeCard";
import { useAuth } from "@/features/auth/AuthContext";
import { useVideoFeed } from "@/hooks/useVideoFeed";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function FeedPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isGuestMode = searchParams.get("mode") === "guest";

  // Redirect if not authenticated and not in guest mode
  useEffect(() => {
    if (!user && !isGuestMode) {
      router.push("/auth/login");
    }
  }, [user, isGuestMode, router]);

  const {
    currentVideo,
    isLastVideo,
    handleLike,
    handleSkip,
    resetFeed,
    stats,
  } = useVideoFeed();

  // Show guest mode banner if in guest mode
  const GuestBanner = () => (
    <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 px-4 z-50">
      <p className="text-sm">
        You're browsing as a guest.{" "}
        <Link href="/auth/signup" className="underline font-medium">
          Sign up
        </Link>{" "}
        to save videos and create collections!
      </p>
    </div>
  );

  // Show navigation bar for authenticated users
  const NavBar = () => (
    <nav className="fixed top-0 left-0 right-0 bg-gray-800 text-white py-3 px-4 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          ReelMeals
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/feed" className="hover:text-gray-300">
            Feed
          </Link>
          <Link href="/collections" className="hover:text-gray-300">
            Collections
          </Link>
          <Link href="/profile" className="hover:text-gray-300">
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      {isGuestMode ? <GuestBanner /> : <NavBar />}

      <div className="w-full max-w-md mt-16">
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
                <span>Swipe right to {isGuestMode ? "skip" : "like"}</span>
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
                {isGuestMode ? "Next" : "Like"} (→)
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 text-center text-gray-400">
              <p>
                Viewed: {stats.totalViewed} •
                {!isGuestMode && `Liked: ${stats.totalLikes} •`}
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
              {!isGuestMode && <p>Liked: {stats.totalLikes} videos</p>}
              <p>Skipped: {stats.totalSkips} videos</p>
            </div>
            <div className="space-y-4 mt-6">
              <button
                onClick={resetFeed}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
              >
                Start Over
              </button>
              {isGuestMode && (
                <Link
                  href="/auth/signup"
                  className="block w-full px-4 py-2 bg-white text-black rounded hover:bg-gray-100"
                >
                  Sign Up to Save Videos
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
