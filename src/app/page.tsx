"use client";

import { useAuth } from "@/features/auth/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-screen">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            autoPlay
            muted
            loop
            playsInline
            src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              Welcome to ReelMeals
            </h1>
            <p className="text-xl sm:text-2xl mb-12 max-w-2xl mx-auto">
              Discover amazing cooking videos with just a swipe. Learn, cook,
              and share your culinary journey.
            </p>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
              {user ? (
                // Logged in user
                <Link
                  href="/feed"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-gray-100 md:text-lg"
                >
                  Go to Feed
                </Link>
              ) : (
                // Not logged in
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-gray-100 md:text-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-black md:text-lg"
                  >
                    Create Account
                  </Link>
                </>
              )}
              <Link
                href="/feed?mode=guest"
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-400 text-base font-medium rounded-md text-gray-300 bg-transparent hover:border-white hover:text-white md:text-lg"
              >
                Try as Guest
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            <div className="text-center p-6 bg-gray-800 bg-opacity-75 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p>
                Find new recipes and cooking techniques with intuitive swipes
              </p>
            </div>
            <div className="text-center p-6 bg-gray-800 bg-opacity-75 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Learn</h3>
              <p>Watch step-by-step video guides from expert chefs</p>
            </div>
            <div className="text-center p-6 bg-gray-800 bg-opacity-75 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Save</h3>
              <p>Create collections of your favorite recipes</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
