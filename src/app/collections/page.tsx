"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Logo } from "@/components/Logo";
import { NavBar } from "@/components/NavBar";
import VideoThumbnail from "@/components/video/VideoThumbnail";
import { useAuth } from "@/features/auth/AuthContext";
import { useVideoModal } from "@/features/video/VideoModalContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import {
  getSavedVideoIds,
  getUserCollections,
  getVideo,
  removeVideoFromUserCollection,
} from "@/lib/firebase/firestore-service";
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

type SortOption = "date" | "cookingTime" | "difficulty";
type FilterOption = {
  cuisine?: string;
  difficulty?: "easy" | "medium" | "hard";
  maxTime?: number;
  search?: string;
};

export default function CollectionsPage() {
  const { user } = useAuth();
  const { openVideo } = useVideoModal();
  const [collections, setCollections] = useState<any[]>([]);
  const [videos, setVideos] = useState<FirestoreVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filters, setFilters] = useState<FilterOption>({});
  const [showFilters, setShowFilters] = useState(false);
  const [removingVideo, setRemovingVideo] = useState<string | null>(null);

  // Fetch user's collections and videos
  useEffect(() => {
    async function fetchCollections() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get all saved video IDs first
        const savedVideoIds = await getSavedVideoIds(user.uid);

        if (savedVideoIds.length === 0) {
          setVideos([]);
          setCollections([]);
          setLoading(false);
          return;
        }

        // Fetch all videos that are saved
        const videoPromises = savedVideoIds.map((id) => getVideo(id));
        const videos = (await Promise.all(videoPromises)).filter(
          (v): v is FirestoreVideo => v !== null
        );

        setVideos(videos);

        // Get collections for organization
        const userCollections = await getUserCollections(user.uid);
        setCollections(userCollections);
      } catch (err) {
        console.error("Error fetching collections:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load your collections. Please try again.")
        );
        // Clear videos and collections on error
        setVideos([]);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, [user]);

  // Filter and sort videos
  const filteredAndSortedVideos = videos
    .filter((video) => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = video.title.toLowerCase().includes(searchTerm);
        const matchesDescription = video.description
          .toLowerCase()
          .includes(searchTerm);
        const matchesTags = video.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm)
        );
        const matchesCuisine = video.cuisine.toLowerCase().includes(searchTerm);
        if (
          !matchesTitle &&
          !matchesDescription &&
          !matchesTags &&
          !matchesCuisine
        ) {
          return false;
        }
      }

      if (filters.cuisine && video.cuisine !== filters.cuisine) return false;
      if (filters.difficulty && video.difficulty !== filters.difficulty)
        return false;
      if (filters.maxTime && video.cookingTime > filters.maxTime) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (b.createdAt as any).seconds - (a.createdAt as any).seconds;
        case "cookingTime":
          return a.cookingTime - b.cookingTime;
        case "difficulty": {
          const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
          return (
            difficultyOrder[a.difficulty as keyof typeof difficultyOrder] -
            difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
          );
        }
        default:
          return 0;
      }
    });

  // Get unique cuisines for filter options
  const cuisines = Array.from(new Set(videos.map((v) => v.cuisine)));

  const handleRemoveVideo = async (videoId: string) => {
    if (!user) return;
    try {
      setRemovingVideo(videoId);
      // Remove from all collections for now - can be made more specific later
      await removeVideoFromUserCollection(user.uid, "Liked Videos", videoId);
      // Update local state
      setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoId));
      // Also update collections state if needed
      setCollections((prevCollections) =>
        prevCollections.map((collection) => ({
          ...collection,
          videoIds: collection.videoIds.filter((id) => id !== videoId),
        }))
      );
    } catch (err) {
      console.error("Error removing video:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to remove video. Please try again.")
      );
    } finally {
      setRemovingVideo(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Header with Logo */}
          <div className="mb-6">
            <Logo className="mb-4" />
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Your Collections</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sort Options */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 appearance-none"
                  >
                    <option value="date">Date Added</option>
                    <option value="cookingTime">Cooking Time</option>
                    <option value="difficulty">Difficulty</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-9 w-5 h-5 pointer-events-none" />
                </div>

                {/* Cuisine Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">
                    Cuisine
                  </label>
                  <select
                    value={filters.cuisine || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        cuisine: e.target.value || undefined,
                      })
                    }
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 appearance-none"
                  >
                    <option value="">All Cuisines</option>
                    {cuisines.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-9 w-5 h-5 pointer-events-none" />
                </div>

                {/* Difficulty Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        difficulty: (e.target.value || undefined) as
                          | "easy"
                          | "medium"
                          | "hard"
                          | undefined,
                      })
                    }
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 appearance-none"
                  >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-9 w-5 h-5 pointer-events-none" />
                </div>

                {/* Max Time Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={filters.maxTime || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxTime: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full bg-gray-700 rounded-lg px-4 py-2"
                    min="0"
                    step="5"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({})}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading your collections...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              Error loading collections: {error.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedVideos.map((video, index) => (
                <div key={video.id} className="relative group">
                  <button
                    onClick={() => openVideo(video)}
                    className="w-full group relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-200"
                  >
                    <VideoThumbnail
                      title={video.title}
                      cuisine={video.cuisine}
                      difficulty={video.difficulty}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold truncate">
                          {video.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <span>{video.cuisine}</span>
                          <span>•</span>
                          <span className="capitalize">{video.difficulty}</span>
                          <span>•</span>
                          <span>{video.cookingTime}min</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    disabled={removingVideo === video.id}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 hover:text-red-500 transition-colors z-10"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredAndSortedVideos.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {videos.length === 0
                ? "No saved videos yet. Start swiping to save some recipes!"
                : "No videos match your current filters."}
            </div>
          )}
        </div>

        <NavBar />
      </div>
    </ProtectedRoute>
  );
}
