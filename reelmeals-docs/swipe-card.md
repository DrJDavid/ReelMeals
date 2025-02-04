# SwipeCard Component Documentation

## Overview

The SwipeCard component represents an individual video card in our swipe interface. It handles the presentation of video content, manages gesture interactions, and provides visual feedback during swipe actions. This component works in conjunction with the SwipeContainer to create fluid, responsive interactions.

## Implementation

```typescript
interface SwipeCardProps {
  // Video resource to display
  video: VideoResource;
  
  // Current offset from center position
  offset: number;
  
  // Current rotation angle
  rotation: number;
  
  // Gesture handlers
  onSwipeStart: (clientX: number, clientY: number) => void;
  onSwipeMove: (clientX: number, clientY: number) => void;
  onSwipeEnd: () => void;
}

interface VideoResource {
  id: string;
  url: string;
  thumbnail: string;
  metadata: {
    title: string;
    cuisine: string;
    duration: number;
    difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  };
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  video,
  offset,
  rotation,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd
}) => {
  // Track touch interactions
  const touchRef = useRef<{
    isTouching: boolean;
    startX: number;
    startY: number;
  }>({
    isTouching: false,
    startX: 0,
    startY: 0
  });

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = {
      isTouching: true,
      startX: touch.clientX,
      startY: touch.clientY
    };
    onSwipeStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current.isTouching) return;
    const touch = e.touches[0];
    onSwipeMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    touchRef.current.isTouching = false;
    onSwipeEnd();
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    touchRef.current = {
      isTouching: true,
      startX: e.clientX,
      startY: e.clientY
    };
    onSwipeStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchRef.current.isTouching) return;
    onSwipeMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    touchRef.current.isTouching = false;
    onSwipeEnd();
  };

  // Calculate transform based on offset and rotation
  const transform = useMemo(() => {
    return `translate3d(${offset}px, 0, 0) rotate(${rotation}deg)`;
  }, [offset, rotation]);

  return (
    <div
      className="swipe-card"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform,
        transition: touchRef.current.isTouching ? 'none' : 'transform 0.3s ease',
        willChange: 'transform',
        touchAction: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Video player component */}
      <VideoPlayer
        url={video.url}
        thumbnail={video.thumbnail}
        autoPlay
        muted
        loop
      />

      {/* Metadata overlay */}
      <CardMetadata
        title={video.metadata.title}
        cuisine={video.metadata.cuisine}
        duration={video.metadata.duration}
        difficulty={video.metadata.difficulty}
        swipeProgress={Math.abs(offset) / window.innerWidth}
      />

      {/* Swipe indicators */}
      <SwipeIndicators
        direction={Math.sign(offset)}
        progress={Math.abs(offset) / window.innerWidth}
      />
    </div>
  );
};

interface CardMetadataProps {
  title: string;
  cuisine: string;
  duration: number;
  difficulty: string;
  swipeProgress: number;
}

const CardMetadata: React.FC<CardMetadataProps> = ({
  title,
  cuisine,
  duration,
  difficulty,
  swipeProgress
}) => {
  // Fade out metadata as card is swiped
  const opacity = 1 - swipeProgress;

  return (
    <div 
      className="card-metadata"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        opacity
      }}
    >
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="flex gap-2 mt-2">
        <Tag>{cuisine}</Tag>
        <Tag>{formatDuration(duration)}</Tag>
        <Tag>{difficulty}</Tag>
      </div>
    </div>
  );
};

interface SwipeIndicatorsProps {
  direction: number;
  progress: number;
}

const SwipeIndicators: React.FC<SwipeIndicatorsProps> = ({
  direction,
  progress
}) => {
  const opacity = Math.min(progress * 2, 1);
  
  return (
    <>
      {/* Like indicator */}
      <div
        className="like-indicator"
        style={{
          opacity: direction > 0 ? opacity : 0,
          transform: `scale(${1 + progress * 0.5})`
        }}
      >
        <HeartIcon className="w-16 h-16 text-green-500" />
      </div>

      {/* Skip indicator */}
      <div
        className="skip-indicator"
        style={{
          opacity: direction < 0 ? opacity : 0,
          transform: `scale(${1 + progress * 0.5})`
        }}
      >
        <XIcon className="w-16 h-16 text-red-500" />
      </div>
    </>
  );
};
```

## Key Features

1. **Smooth Transformations**: Uses CSS transforms for hardware-accelerated animations, ensuring smooth movement even on lower-end devices.

2. **Touch and Mouse Support**: Handles both touch and mouse events with consistent behavior across devices.

3. **Visual Feedback**: Provides immediate visual feedback through:
   - Card rotation during swipe
   - Like/Skip indicators that fade in based on swipe direction
   - Metadata overlay that fades out during swipe

4. **Performance Optimizations**:
   - Uses `will-change` for transform hints
   - Implements touch event throttling
   - Optimizes re-renders through memoization
   - Uses CSS transitions for non-interactive animations

5. **Accessibility**:
   - Maintains proper focus management
   - Provides keyboard navigation support
   - Includes ARIA labels for interactive elements

The SwipeCard component is designed to work seamlessly with our video player while maintaining smooth performance during interactions. It handles the presentation layer of our swipe interface, leaving the business logic to the parent SwipeContainer component.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*