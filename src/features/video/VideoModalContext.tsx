"use client";

import { VideoModal } from "@/components/video/VideoModal";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { createContext, ReactNode, useContext, useState } from "react";

interface VideoModalContextType {
  openVideo: (video: FirestoreVideo) => void;
  closeVideo: () => void;
}

const VideoModalContext = createContext<VideoModalContextType | undefined>(
  undefined
);

export function VideoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoData, setVideoData] = useState<FirestoreVideo | null>(null);

  const openVideo = (video: FirestoreVideo) => {
    setVideoData(video);
    setIsOpen(true);
  };

  const closeVideo = () => {
    setIsOpen(false);
    // Clear video data after animation completes
    setTimeout(() => setVideoData(null), 200);
  };

  return (
    <VideoModalContext.Provider value={{ openVideo, closeVideo }}>
      {children}
      {videoData && (
        <VideoModal
          isOpen={isOpen}
          onClose={closeVideo}
          videoUrl={videoData.videoUrl}
          video={videoData}
        />
      )}
    </VideoModalContext.Provider>
  );
}

export function useVideoModal() {
  const context = useContext(VideoModalContext);
  if (context === undefined) {
    throw new Error("useVideoModal must be used within a VideoModalProvider");
  }
  return context;
}
