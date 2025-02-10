"use client";

import { VideoPageContent } from "@/components/video/VideoPageContent";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import React, { createContext, useContext, useState } from "react";

interface VideoModalContextType {
  openVideo: (video: FirestoreVideo) => void;
  closeVideo: () => void;
}

const VideoModalContext = createContext<VideoModalContextType | undefined>(
  undefined
);

export function VideoModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentVideo, setCurrentVideo] = useState<FirestoreVideo | null>(null);

  const openVideo = (video: FirestoreVideo) => {
    setCurrentVideo(video);
  };

  const closeVideo = () => {
    setCurrentVideo(null);
  };

  return (
    <VideoModalContext.Provider value={{ openVideo, closeVideo }}>
      {children}
      {currentVideo && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <VideoPageContent
            video={currentVideo}
            uploaderName="ReelMeals"
            onLike={() => {}}
          />
        </div>
      )}
    </VideoModalContext.Provider>
  );
}

export function useVideoModal() {
  const context = useContext(VideoModalContext);
  if (!context) {
    throw new Error("useVideoModal must be used within a VideoModalProvider");
  }
  return context;
}
