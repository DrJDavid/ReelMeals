import { TEST_VIDEOS, VideoMetadata } from "@/lib/video-data";
import { useState } from "react";

interface UseVideoFeedReturn {
  currentVideo: VideoMetadata | null;
  isLastVideo: boolean;
  likedVideos: VideoMetadata[];
  skippedVideos: VideoMetadata[];
  handleLike: () => void;
  handleSkip: () => void;
  resetFeed: () => void;
  stats: {
    totalViewed: number;
    totalLikes: number;
    totalSkips: number;
  };
}

export function useVideoFeed(): UseVideoFeedReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<VideoMetadata[]>([]);
  const [skippedVideos, setSkippedVideos] = useState<VideoMetadata[]>([]);

  const currentVideo =
    currentIndex < TEST_VIDEOS.length ? TEST_VIDEOS[currentIndex] : null;
  const isLastVideo = currentIndex >= TEST_VIDEOS.length - 1;

  const handleLike = () => {
    if (currentVideo) {
      setLikedVideos([...likedVideos, currentVideo]);
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
    totalLikes: likedVideos.length,
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
    stats,
  };
}
