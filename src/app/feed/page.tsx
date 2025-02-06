"use client";

import { NavBar } from "@/components/NavBar";
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900 pb-20">
      {isGuestMode && <GuestBanner />}

      {/* Logo/Title Section */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-transparent z-40 pt-4 pb-8">
        <div className="max-w-md mx-auto px-4">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              ReelMeals
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Discover delicious recipes
            </p>
          </div>
        </div>
      </div>

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
                <span>Swipe right to {isGuestMode ? "skip" : "like"}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">No more videos!</h2>
            <p className="text-gray-400 mb-6">
              You've reached the end of your feed.
            </p>
            <button
              onClick={resetFeed}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Start Over
            </button>
            {stats && (
              <div className="mt-8 text-gray-400">
                <p>Videos watched: {stats.watched}</p>
                <p>Videos liked: {stats.liked}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <NavBar />
    </main>
  );
}
