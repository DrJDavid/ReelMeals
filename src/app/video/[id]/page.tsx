import { VideoPageContent } from "@/components/video/VideoPageContent";

// This is just to satisfy Next.js static export requirement
// The actual video data will be loaded client-side
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function VideoPage() {
  return <VideoPageContent />;
}
