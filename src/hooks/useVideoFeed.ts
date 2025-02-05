"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getVideos } from "@/lib/firebase/firestore-service";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface UseVideoFeedReturn {
  currentVideo: FirestoreVideo | null;
  isLastVideo: boolean;
  likedVideos: FirestoreVideo[];
  skippedVideos: FirestoreVideo[];
  handleLike: () => void;
  handleSkip: () => void;
  resetFeed: () => void;
  loading: boolean;
  error: Error | null;
  stats: {
    totalViewed: number;
    totalLikes: number;
    totalSkips: number;
  };
}

export function useVideoFeed(): UseVideoFeedReturn {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isGuestMode = searchParams.get("mode") === "guest";

  const [videos, setVideos] = useState<FirestoreVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<FirestoreVideo[]>([]);
  const [skippedVideos, setSkippedVideos] = useState<FirestoreVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch videos from Firestore
  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        setError(null);
        const fetchedVideos = await getVideos(20); // Fetch 20 videos at a time
        setVideos(fetchedVideos);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  const currentVideo =
    currentIndex < videos.length ? videos[currentIndex] : null;
  const isLastVideo = currentIndex >= videos.length - 1;

  const handleLike = () => {
    if (currentVideo) {
      if (!isGuestMode && user) {
        // Only store liked videos for authenticated users
        setLikedVideos([...likedVideos, currentVideo]);
        // TODO: Update Firestore with liked video
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentVideo) {
      setSkippedVideos([...skippedVideos, currentVideo]);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const resetFeed = () => {
    setCurrentIndex(0);
    setLikedVideos([]);
    setSkippedVideos([]);
  };

  const stats = {
    totalViewed: currentIndex,
    totalLikes: isGuestMode ? 0 : likedVideos.length,
    totalSkips: skippedVideos.length,
  };

  return {
    currentVideo,
    isLastVideo,
    likedVideos,
    skippedVideos,
    handleLike,
    handleSkip,
    resetFeed,
    loading,
    error,
    stats,
  };
}
