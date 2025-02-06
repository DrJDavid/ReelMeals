"use client";

interface VideoThumbnailProps {
  title: string;
  cuisine: string;
  difficulty: string;
  className?: string;
}

function getBackgroundColor(cuisine: string): string {
  // Map cuisines to consistent colors
  const cuisineColors: Record<string, string> = {
    Italian: "#FF6B6B",
    Mexican: "#4ECDC4",
    American: "#45B7D1",
    Japanese: "#96CEB4",
    Chinese: "#FFAD60",
    Korean: "#9B5DE5",
    French: "#F15BB5",
    Cajun: "#FEE440",
    European: "#00BBF9",
    default: "#4F46E5",
  };

  return cuisineColors[cuisine] || cuisineColors.default;
}

export default function VideoThumbnail({
  title,
  cuisine,
  difficulty,
  className = "",
}: VideoThumbnailProps) {
  const bgColor = getBackgroundColor(cuisine);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{
        background: `linear-gradient(45deg, ${bgColor}, ${bgColor}dd)`,
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center">
        <div className="bg-black/20 p-4 rounded-lg backdrop-blur-sm w-full">
          <h3 className="text-xl font-bold mb-2 text-white line-clamp-3">
            {title}
          </h3>
          <div className="flex items-center justify-center space-x-2 text-sm text-white/90">
            <span>{cuisine}</span>
            <span>•</span>
            <span className="capitalize">{difficulty}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
