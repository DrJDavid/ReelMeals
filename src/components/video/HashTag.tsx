"use client";

import { useRouter } from "next/navigation";

interface HashTagProps {
  tag: string;
  className?: string;
}

export function HashTag({ tag, className = "" }: HashTagProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to search page with the tag as query
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`text-xs bg-white/20 px-2 py-0.5 rounded-full text-white hover:bg-white/30 transition-colors ${className}`}
    >
      #{tag}
    </button>
  );
}
