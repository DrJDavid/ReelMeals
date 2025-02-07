"use client";

import { GuestBanner } from "@/components/GuestBanner";
import { Logo } from "@/components/Logo";
import { NavBar } from "@/components/NavBar";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { useAuth } from "@/features/auth/AuthContext";
import { useVideoModal } from "@/features/video/VideoModalContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import {
  getSavedVideoIds,
  getVideos,
  removeVideoFromUserCollection,
  saveVideoToCollection,
} from "@/lib/firebase/firestore-service";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPageContent() {
  const [videos, setVideos] = useState<FirestoreVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [savingVideo, setSavingVideo] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { openVideo } = useVideoModal();
  const query = searchParams.get("q") || "";

  // Fetch videos and user's saved videos
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Only fetch videos if there's a search query
        if (query.trim()) {
          const allVideos = await getVideos(50); // Limit to 50 results for performance
          const searchTerms = query
            .toLowerCase()
            .split(" ")
            .filter((term) => term.length > 0);

          const filteredVideos = allVideos.filter((video) => {
            const videoText = `${video.title} ${video.description} ${
              video.cuisine
            } ${video.tags.join(" ")}`.toLowerCase();

            // Must match all search terms
            return searchTerms.every((term) => videoText.includes(term));
          });

          setVideos(filteredVideos);
        } else {
          setVideos([]); // Clear videos if no search query
        }

        // If user is logged in, fetch their saved videos
        if (user) {
          const savedVideoIds = await getSavedVideoIds(user.uid);
          setSavedVideos(new Set(savedVideoIds));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load videos. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }

    // Debounce the search to prevent too many requests
    const timeoutId = setTimeout(fetchData, 300);
    return () => clearTimeout(timeoutId);
  }, [query, user]);

  const handleLikeVideo = async (videoId: string) => {
    if (!user) return;

    try {
      setSavingVideo(videoId);
      setError(null); // Clear any previous errors

      if (savedVideos.has(videoId)) {
        await removeVideoFromUserCollection(user.uid, "Liked Videos", videoId);
        setSavedVideos((prev) => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      } else {
        await saveVideoToCollection(user.uid, "Liked Videos", videoId);
        setSavedVideos((prev) => new Set(Array.from(prev).concat(videoId)));
      }
    } catch (err) {
      console.error("Error saving video:", err);
      // Show error in UI
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save video. Please try again."
      );
      // Revert optimistic update
      setSavedVideos((prev) => {
        const next = new Set(prev);
        if (next.has(videoId)) {
          next.delete(videoId);
        } else {
          next.add(videoId);
        }
        return next;
      });
    } finally {
      setSavingVideo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {!user && <GuestBanner />}

      {/* Logo and Search Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <Logo className="mb-3" />
          <input
            type="text"
            placeholder="Search by title, tags, cuisine, or description..."
            className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            defaultValue={query}
            onChange={(e) => {
              const newUrl = new URL(window.location.href);
              if (e.target.value) {
                newUrl.searchParams.set("q", e.target.value);
              } else {
                newUrl.searchParams.delete("q");
              }
              window.history.pushState({}, "", newUrl.toString());
            }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-8">
        {loading ? (
          <div className="text-center">Loading videos...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-400">
            {query
              ? "No videos found matching your search."
              : "Start typing to search for videos."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <RecipeCard
                key={video.id}
                recipe={video}
                onLike={() => handleLikeVideo(video.id)}
              />
            ))}
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}
