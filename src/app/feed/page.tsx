"use client";

import FeedPageContent from "@/components/feed/FeedPageContent";
import { Suspense } from "react";

export default function FeedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FeedPageContent />
    </Suspense>
  );
}
