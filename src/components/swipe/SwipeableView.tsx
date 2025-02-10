"use client";

import { useEffect, useRef, useState } from "react";

interface SwipeableViewProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface Emoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function SwipeableView({
  children,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [emojis, setEmojis] = useState<Emoji[]>([]);

  // Minimum swipe distance to trigger action (in pixels)
  const minSwipeDistance = 100;

  // Create emoji burst effect
  const createEmojiBurst = (direction: "left" | "right") => {
    const newEmojis: Emoji[] = [];
    const videoPlayer = containerRef.current?.querySelector("video");
    if (!videoPlayer) return;

    const videoRect = videoPlayer.getBoundingClientRect();
    const count = 15; // Number of emojis

    // Calculate the bounds for the respective side
    const sideWidth = videoRect.width / 2;
    const startX =
      direction === "left" ? videoRect.left : videoRect.left + sideWidth;
    const maxDistance = sideWidth * 0.3; // 30% of half width for better spread

    for (let i = 0; i < count; i++) {
      // Create a spread pattern that stays within the respective half
      const angle = (Math.random() * Math.PI - Math.PI / 2) * 0.8; // Spread in a 144-degree arc
      const distance = 20 + Math.random() * maxDistance;

      // Calculate base position
      const x =
        startX +
        (direction === "left"
          ? distance * Math.cos(angle)
          : sideWidth - distance * Math.cos(angle));
      const y = videoRect.top + videoRect.height * (0.3 + Math.random() * 0.4); // Keep in middle 40% vertically

      // Ensure emojis stay within their colored areas
      const clampedX = Math.max(
        direction === "left"
          ? videoRect.left + 20
          : videoRect.left + sideWidth + 20,
        Math.min(
          direction === "left"
            ? videoRect.left + sideWidth - 20
            : videoRect.right - 20,
          x
        )
      );
      const clampedY = Math.max(
        videoRect.top + 20,
        Math.min(videoRect.bottom - 20, y)
      );

      const rotation = Math.random() * 180 - 90; // -90 to 90 degrees
      const scale = 1.2 + Math.random() * 0.6; // 1.2 to 1.8

      newEmojis.push({
        id: Date.now() + i,
        emoji: direction === "right" ? "👨‍🍳" : "🥡",
        x: clampedX,
        y: clampedY,
        rotation,
        scale,
      });
    }

    setEmojis(newEmojis);

    // Clear emojis after animation
    setTimeout(() => {
      setEmojis([]);
    }, 1500);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Don't start swipe if we're scrubbing the video
    const target = e.target as HTMLElement;
    const videoPlayer = target.closest('[data-scrubbing="true"]');
    if (videoPlayer) return;

    // Also check if the click/touch is on the video controls or video element
    const controls = target.closest(".video-controls");
    const video = target.closest("video");
    const playPauseOverlay = target.closest(".play-pause-overlay");
    if (controls || video || playPauseOverlay) return;

    if (isExiting) return;
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
    setTouchEnd(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isExiting) return;

    // Don't swipe if we're interacting with video
    const target = e.target as HTMLElement;
    const videoPlayer = target.closest('[data-scrubbing="true"]');
    const video = target.closest("video");
    const playPauseOverlay = target.closest(".play-pause-overlay");
    if (videoPlayer || video || playPauseOverlay) {
      handleTouchEnd();
      return;
    }

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setTouchEnd(clientX);

    if (touchStart !== null) {
      const distance = clientX - touchStart;
      setTranslateX(distance);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isExiting) return;

    const distance = touchEnd - touchStart;
    const isLeftSwipe = distance < -minSwipeDistance;
    const isRightSwipe = distance > minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      setIsExiting(true);
      setExitDirection(isLeftSwipe ? "left" : "right");

      // Set final translation
      const screenWidth = window.innerWidth;
      setTranslateX(isLeftSwipe ? -screenWidth : screenWidth);

      // Create emoji burst effect
      createEmojiBurst(isLeftSwipe ? "left" : "right");

      // Call the appropriate handler after animation
      setTimeout(() => {
        if (isLeftSwipe) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
        // Reset states
        setIsExiting(false);
        setExitDirection(null);
        setTranslateX(0);
      }, 300); // Match the transition duration
    } else {
      // Reset position if swipe wasn't far enough
      setTranslateX(0);
    }

    // Reset drag states
    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Clean up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      if (isDragging) {
        handleTouchEnd();
      }
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        handleTouchEnd();
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isDragging, touchStart, touchEnd]);

  // Calculate rotation based on swipe distance
  const rotation = translateX * 0.1; // Adjust this value to control rotation intensity

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
    >
      <div
        className="transition-all duration-300 ease-out"
        style={{
          transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
          opacity: Math.max(0, 1 - Math.abs(translateX) / 500),
        }}
      >
        {children}
      </div>

      {/* Swipe Indicators */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-y-0 left-0 w-1/2 bg-red-500 transition-opacity duration-200"
          style={{
            opacity:
              translateX < 0 ? Math.min(0.5, Math.abs(translateX) / 500) : 0,
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 bg-green-500 transition-opacity duration-200"
          style={{
            opacity:
              translateX > 0 ? Math.min(0.5, Math.abs(translateX) / 500) : 0,
          }}
        />
      </div>

      {/* Emoji Animation Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {emojis.map((emoji) => (
          <div
            key={emoji.id}
            className="absolute transition-all duration-1500"
            style={{
              left: emoji.x,
              top: emoji.y,
              transform: `rotate(${emoji.rotation}deg) scale(${emoji.scale})`,
              opacity: 0,
              animation: "emoji-burst 1.5s ease-out forwards",
              fontSize: "1.75rem", // Slightly smaller base font size
            }}
          >
            {emoji.emoji}
          </div>
        ))}
      </div>

      {/* Add keyframes for emoji animation */}
      <style jsx global>{`
        @keyframes emoji-burst {
          0% {
            opacity: 0;
            transform: rotate(0deg) scale(0);
          }
          20% {
            opacity: 1;
            transform: rotate(${Math.random() * 90 - 45}deg) scale(1);
          }
          80% {
            opacity: 1;
            transform: rotate(${Math.random() * 90 - 45}deg)
              scale(${1.2 + Math.random() * 0.3});
          }
          100% {
            opacity: 0;
            transform: rotate(${Math.random() * 90 - 45}deg) scale(0);
          }
        }
      `}</style>
    </div>
  );
}
