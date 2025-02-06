import { VideoPageContent } from "@/components/video/VideoPageContent";
import { getVideos } from "@/lib/firebase/firestore-service";

export async function generateStaticParams() {
  try {
    const videos = await getVideos();
    return videos.map((video) => ({
      id: video.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default function VideoPage() {
  return <VideoPageContent />;
}
