"use client";

import { VideoPageContent } from "@/components/video/VideoPageContent";
import { FirestoreVideo } from "@/lib/firebase/firestore-schema";
import { getUserDisplayName, getVideo } from "@/lib/firebase/firestore-service";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VideoPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<FirestoreVideo | null>(null);
  const [uploaderName, setUploaderName] = useState("ReelMeals");
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

        // Get uploader name
        if (videoData.uploadedByUserId) {
          const name = await getUserDisplayName(videoData.uploadedByUserId);
          setUploaderName(name);
        }
      } catch (err) {
        console.error("Error loading video:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load video")
        );
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!video) {
    return <div>Video not found</div>;
  }

  return <VideoPageContent video={video} uploaderName={uploaderName} />;
}
