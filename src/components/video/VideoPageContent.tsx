"use client";

import { GuestBanner } from "@/components/GuestBanner";
import { NavBar } from "@/components/NavBar";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getVideo } from "@/lib/firebase/firestore-service";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export function VideoPageContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<FirestoreVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadVideo() {
      if (!id || typeof id !== "string") {
        setError(new Error("Invalid video ID"));
        setLoading(false);
        return;
      }

      try {
        const videoData = await getVideo(id);
        if (!videoData) {
          throw new Error("Video not found");
        }
        setVideo(videoData);
      } catch (err) {
        console.error("Error loading video:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavBar />
        {!user && <GuestBanner />}
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="aspect-[9/16] bg-gray-800 rounded-lg mb-8" />
            <div className="h-8 bg-gray-800 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavBar />
        {!user && <GuestBanner />}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            <h2 className="text-xl font-semibold mb-2">Error Loading Video</h2>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      {!user && <GuestBanner />}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden mb-8">
            <VideoPlayer videoUrl={video.videoUrl} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-300 mb-6">
            <div>
              <span className="font-semibold">Cuisine:</span> {video.cuisine}
            </div>
            <div>
              <span className="font-semibold">Difficulty:</span>{" "}
              {video.difficulty}
            </div>
            <div>
              <span className="font-semibold">Cooking Time:</span>{" "}
              {video.cookingTime} minutes
            </div>
          </div>
          <p className="text-gray-300 mb-8">{video.description}</p>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-8 text-gray-300 mb-8">
            <div>
              <span className="font-semibold">{video.likes}</span> likes
            </div>
            <div>
              <span className="font-semibold">{video.views}</span> views
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Ingredients
            </h2>
            <ul className="list-disc list-inside text-gray-300">
              {video.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                  {ingredient.notes && ` (${ingredient.notes})`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
