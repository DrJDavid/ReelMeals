"use client";

import { firebaseStorage } from "@/lib/firebase/initFirebase";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useRef, useState } from "react";

interface VideoThumbnailProps {
  thumbnailUrl?: string;
  videoUrl?: string;
  title: string;
  className?: string;
}

const PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="600" fill="#1F2937"/>
  <rect x="160" y="260" width="80" height="80" rx="40" fill="#4B5563"/>
  <path d="M220 300L190 320L190 280L220 300Z" fill="#9CA3AF"/>
</svg>
`)}`;

export default function VideoThumbnail({
  thumbnailUrl,
  videoUrl,
  title,
  className = "",
}: VideoThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string>(PLACEHOLDER_IMAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function loadThumbnail() {
      try {
        setLoading(true);
        setError(null);

        // If we have a thumbnail URL, try to load it
        if (thumbnailUrl) {
          if (thumbnailUrl.startsWith("gs://")) {
            const fullPath = thumbnailUrl.replace(/^gs:\/\/[^\/]+\//, "");
            const thumbnailRef = ref(firebaseStorage, fullPath);
            const url = await getDownloadURL(thumbnailRef);
            setImageUrl(url);
          } else {
            setImageUrl(thumbnailUrl);
          }
          return;
        }

        // If we have a video URL but no thumbnail, create one
        if (videoUrl) {
          if (videoUrl.startsWith("gs://")) {
            const fullPath = videoUrl.replace(/^gs:\/\/[^\/]+\//, "");
            const videoRef = ref(firebaseStorage, fullPath);
            const url = await getDownloadURL(videoRef);
            await generateThumbnail(url);
          } else {
            await generateThumbnail(videoUrl);
          }
        }
      } catch (err) {
        console.error("Error loading thumbnail:", err);
        setError(err as Error);
        setImageUrl(PLACEHOLDER_IMAGE);
      } finally {
        setLoading(false);
      }
    }

    loadThumbnail();
  }, [thumbnailUrl, videoUrl]);

  const generateThumbnail = (videoUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.currentTime = 1; // Seek to 1 second

      video.onloadeddata = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
          setImageUrl(thumbnailUrl);
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          video.remove();
        }
      };

      video.onerror = (err) => {
        reject(err);
        video.remove();
      };
    });
  };

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt={title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      {error && !loading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-sm text-gray-400 px-4">
            <svg
              className="w-10 h-10 mx-auto mb-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Failed to load thumbnail
          </div>
        </div>
      )}
    </div>
  );
}
