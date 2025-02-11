"use client";

import { firebaseStorage } from "@/lib/firebase/initFirebase";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: (error: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

// Add this at the top of the file, outside the component
let globalMuted = true;

export function VideoPlayer({
  videoUrl,
  autoPlay = true,
  muted = true,
  loop = true,
  onError,
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(globalMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Get video URL from Firebase Storage if needed
  useEffect(() => {
    async function getVideoUrl() {
      if (!videoUrl) {
        console.error("No video URL provided");
        onError?.(new Error("No video URL provided"));
        return;
      }

      try {
        if (videoUrl.startsWith("gs://")) {
          // Get the full path after gs://bucket-name/
          const fullPath = videoUrl.replace(/^gs:\/\/[^\/]+\//, "");

          if (!firebaseStorage) {
            throw new Error("Firebase Storage not initialized");
          }

          const videoRef = ref(firebaseStorage, fullPath);
          const url = await getDownloadURL(videoRef);
          setDownloadUrl(url);
        } else if (
          videoUrl.startsWith("http://") ||
          videoUrl.startsWith("https://")
        ) {
          // If it's already a valid HTTP URL, use it directly
          setDownloadUrl(videoUrl);
        } else {
          // Assume it's a storage path without the gs:// prefix
          if (!firebaseStorage) {
            throw new Error("Firebase Storage not initialized");
          }
          const videoRef = ref(firebaseStorage, videoUrl);
          const url = await getDownloadURL(videoRef);
          setDownloadUrl(url);
        }
      } catch (error) {
        console.error("Error getting video URL:", error);
        onError?.(error);
      }
    }

    getVideoUrl();
  }, [videoUrl, onError]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onPause?.();
      } else {
        videoRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  };

  // Handle progress bar interactions
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (progressRef.current && videoRef.current) {
        const rect = progressRef.current.getBoundingClientRect();
        const pos = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width)
        );
        videoRef.current.currentTime = pos * duration;
        setCurrentTime(pos * duration);
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Initial position update
    handleMouseMove(e.nativeEvent);
  };

  // Toggle mute with persistence
  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      globalMuted = newMutedState;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time helper
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        if (videoRef.current) {
          videoRef.current.currentTime -= 5;
        }
      } else if (e.code === "ArrowRight") {
        if (videoRef.current) {
          videoRef.current.currentTime += 5;
        }
      } else if (e.code === "KeyM") {
        toggleMute();
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  // Initial setup with mute persistence
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial mute state from global state
    video.muted = globalMuted;

    const attemptPlay = async () => {
      try {
        if (autoPlay) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log("Autoplay prevented:", error);
              setIsPlaying(false);
            });
          }
        }
      } catch (error) {
        console.error("Video playback error:", error);
        onError?.(error);
      }
    };

    video.addEventListener("loadeddata", attemptPlay);

    return () => {
      video.removeEventListener("loadeddata", attemptPlay);
      video.pause();
    };
  }, [downloadUrl, autoPlay, onError]);

  return (
    <div
      className="relative w-full aspect-[9/16] bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-scrubbing={isScrubbing}
    >
      {downloadUrl ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            src={downloadUrl}
            playsInline
            loop={loop}
            muted={isMuted}
            autoPlay={autoPlay}
            onClick={togglePlay}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onEnded}
            onError={(e) => {
              console.error("Video element error:", e);
              onError?.(e);
            }}
          />

          {/* Play/Pause Overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200 cursor-pointer play-pause-overlay"
            style={{
              opacity: isPlaying ? 0 : 1,
              pointerEvents: isPlaying ? "none" : "auto",
            }}
            onClick={togglePlay}
          >
            <div className="bg-black/50 rounded-full p-4 transform transition-transform hover:scale-110">
              {isPlaying ? (
                <PauseIcon className="w-12 h-12 text-white" />
              ) : (
                <PlayIcon className="w-12 h-12 text-white" />
              )}
            </div>
          </div>

          {/* Video Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-200 ${
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="relative h-1.5 w-full bg-white/30 cursor-pointer"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              <div
                className="absolute h-full bg-white shadow-md"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-200 p-1.5"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-200 p-1.5"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-6 h-6" />
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6" />
                  )}
                </button>

                <div className="text-white font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-200 p-1.5"
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="w-6 h-6" />
                ) : (
                  <ArrowsPointingOutIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Loading video...
        </div>
      )}
    </div>
  );
}
