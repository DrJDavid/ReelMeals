"use client";

import { GuestBanner } from "@/components/GuestBanner";
import { Logo } from "@/components/Logo";
import { NavBar } from "@/components/NavBar";
import VideoThumbnail from "@/components/video/VideoThumbnail";
import { useAuth } from "@/features/auth/AuthContext";
import { useVideoModal } from "@/features/video/VideoModalContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import {
  getSavedVideoIds,
  getVideos,
  removeVideoFromUserCollection,
  saveVideoToCollection,
} from "@/lib/firebase/firestore-service";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage() {
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
        const allVideos = await getVideos();
        const filteredVideos = allVideos.filter((video) => {
          const searchTerms = query.toLowerCase().split(" ");
          const videoText = `${video.title} ${video.description} ${
            video.cuisine
          } ${video.tags.join(" ")}`.toLowerCase();
          return searchTerms.every((term) => videoText.includes(term));
        });
        setVideos(filteredVideos);

        // If user is logged in, fetch their saved videos
        if (user) {
          // TODO: Implement getSavedVideoIds function in firestore-service
          const savedVideoIds = await getSavedVideoIds(user.uid);
          setSavedVideos(new Set(savedVideoIds));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [query, user]);

  const handleLikeVideo = async (videoId: string) => {
    if (!user) return;
    try {
      setSavingVideo(videoId);
      if (savedVideos.has(videoId)) {
        await removeVideoFromUserCollection(user.uid, "Liked Videos", videoId);
        setSavedVideos((prev) => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      } else {
        await saveVideoToCollection(user.uid, "Liked Videos", videoId);
        setSavedVideos((prev) => new Set([...prev, videoId]));
      }
    } catch (err) {
      console.error("Error saving video:", err);
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
              <div key={video.id} className="relative group">
                <button
                  onClick={() => openVideo(video)}
                  className="w-full group relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-200"
                >
                  <VideoThumbnail
                    thumbnailUrl={video.thumbnailUrl}
                    videoUrl={video.videoUrl}
                    title={video.title}
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

                {user && (
                  <button
                    onClick={() => handleLikeVideo(video.id)}
                    disabled={savingVideo === video.id}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
                  >
                    {savedVideos.has(video.id) ? (
                      <HeartIconSolid className="w-6 h-6 text-primary-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}
