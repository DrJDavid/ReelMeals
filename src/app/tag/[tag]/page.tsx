"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getVideosByTag } from "@/lib/firebase/firestore-service";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TagPage() {
  const { tag } = useParams();
  const { user } = useAuth();
  const [videos, setVideos] = useState<FirestoreVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        const decodedTag = decodeURIComponent(tag as string);
        const taggedVideos = await getVideosByTag(decodedTag);
        setVideos(taggedVideos);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (tag) {
      fetchVideos();
    }
  }, [tag]);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm text-white py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            ReelMeals
          </Link>
          <div className="flex items-center space-x-6">
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

      {/* Main Content */}
      <div className="pt-20 px-4 pb-8 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/collections"
              className="text-gray-400 hover:text-white"
            >
              ← Back to Collections
            </Link>
            <h1 className="text-3xl font-bold">
              #{decodeURIComponent(tag as string)}
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading videos...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              Error loading videos: {error.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                >
                  {/* Video Preview */}
                  <div className="aspect-video relative">
                    <img
                      src={video.thumbnailUrl || "/placeholder-thumbnail.jpg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button className="bg-white text-black px-4 py-2 rounded-lg">
                        Play
                      </button>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>{video.cuisine}</span>
                      <span>•</span>
                      <span>{video.difficulty}</span>
                      <span>•</span>
                      <span>{video.cookingTime}min</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {video.tags.map((videoTag) => (
                        <Link
                          key={videoTag}
                          href={`/tag/${encodeURIComponent(videoTag)}`}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            videoTag === decodeURIComponent(tag as string)
                              ? "bg-primary-500 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                          }`}
                        >
                          #{videoTag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && videos.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No videos found with tag #{decodeURIComponent(tag as string)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
