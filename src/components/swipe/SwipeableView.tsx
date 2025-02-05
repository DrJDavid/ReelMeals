"use client";

import { useEffect, useRef, useState } from "react";

interface SwipeableViewProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
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

  // Minimum swipe distance to trigger action (in pixels)
  const minSwipeDistance = 100;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isExiting) return;
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
    setTouchEnd(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isExiting) return;

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
    </div>
  );
}
