# Swipe Interaction System Documentation

## Overview

The swipe interaction system forms the core of our cooking video discovery experience. Similar to how a chef might flip through a cookbook to find inspiration, our users swipe through videos to discover recipes that interest them. This document details how we implement smooth, intuitive swipe interactions that feel natural on both mobile and desktop devices.

## Core Architecture

Our swipe system is built using a combination of React components and custom hooks that work together to create a seamless experience. The system handles touch events, mouse interactions, and keyboard navigation, making it accessible across all devices.

### Base Swipe Container

The SwipeContainer serves as the foundation of our swipe interaction system. Think of it as the stage where all our swipe interactions play out:

```typescript
interface SwipeProps {
  // Called when user swipes right (likes) a video
  onSwipeRight: () => Promise<void>;
  
  // Called when user swipes left (skips) a video
  onSwipeLeft: () => Promise<void>;
  
  // Current video being shown
  currentVideo: VideoResource;
  
  // Next video in queue (for preloading)
  nextVideo?: VideoResource;
  
  // Whether we're currently processing a swipe
  isProcessing?: boolean;
}

interface SwipeState {
  // Current position of the swipe
  offset: number;
  
  // Direction of current swipe (-1 for left, 1 for right)
  direction: number;
  
  // Whether we're currently in a swipe motion
  isAnimating: boolean;
  
  // Start position of the swipe
  startX: number;
  startY: number;
}

const SwipeContainer: React.FC<SwipeProps> = ({
  onSwipeRight,
  onSwipeLeft,
  currentVideo,
  nextVideo,
  isProcessing = false
}) => {
  // Track the current state of our swipe interaction
  const [swipeState, setSwipeState] = useState<SwipeState>({
    offset: 0,
    direction: 0,
    isAnimating: false,
    startX: 0,
    startY: 0
  });

  // Ref to track the container element for animations
  const containerRef = useRef<HTMLDivElement>(null);

  // Configure swipe sensitivity and thresholds
  const config = {
    // How far user needs to swipe to trigger action
    threshold: window.innerWidth * 0.4,
    
    // Maximum rotation during swipe
    maxRotation: 15,
    
    // Spring animation configuration
    spring: {
      tension: 180,
      friction: 20
    }
  };

  // Handle the start of a swipe interaction
  const handleSwipeStart = useCallback((clientX: number, clientY: number) => {
    if (isProcessing) return;

    setSwipeState(prev => ({
      ...prev,
      startX: clientX,
      startY: clientY,
      isAnimating: true
    }));
  }, [isProcessing]);

  // Handle the swipe motion
  const handleSwipeMove = useCallback((clientX: number, clientY: number) => {
    if (!swipeState.isAnimating) return;

    const deltaX = clientX - swipeState.startX;
    const deltaY = clientY - swipeState.startY;

    // Check if swipe is more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeState(prev => ({
        ...prev,
        offset: deltaX,
        direction: Math.sign(deltaX)
      }));
    }
  }, [swipeState.isAnimating, swipeState.startX, swipeState.startY]);

  // Handle the end of a swipe interaction
  const handleSwipeEnd = useCallback(async () => {
    if (!swipeState.isAnimating) return;

    const shouldTriggerAction = Math.abs(swipeState.offset) > config.threshold;
    
    if (shouldTriggerAction) {
      // Trigger the appropriate action based on swipe direction
      if (swipeState.direction > 0) {
        await onSwipeRight();
      } else {
        await onSwipeLeft();
      }
    }

    // Reset the swipe state
    setSwipeState(prev => ({
      ...prev,
      offset: 0,
      direction: 0,
      isAnimating: false
    }));
  }, [swipeState.isAnimating, swipeState.offset, swipeState.direction, config.threshold, onSwipeRight, onSwipeLeft]);

  return (
    <div
      ref={containerRef}
      className="swipe-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <SwipeCard
        video={currentVideo}
        offset={swipeState.offset}
        rotation={calculateRotation(swipeState.offset, config.maxRotation)}
        onSwipeStart={handleSwipeStart}
        onSwipeMove={handleSwipeMove}
        onSwipeEnd={handleSwipeEnd}
      />
      
      {/* Preload next video if available */}
      {nextVideo && (
        <div style={{ display: 'none' }}>
          <VideoPreloader video={nextVideo} />
        </div>
      )}
      
      {/* Visual feedback indicators */}
      <SwipeIndicators
        direction={swipeState.direction}
        offset={swipeState.offset}
        threshold={config.threshold}
      />
    </div>
  );
};

// Helper function to calculate rotation based on swipe offset
function calculateRotation(offset: number, maxRotation: number): number {
  // Convert offset to a value between -1 and 1
  const normalizedOffset = Math.min(Math.abs(offset) / window.innerWidth, 1);
  
  // Calculate rotation with easing
  return (Math.sign(offset) * normalizedOffset * maxRotation);
}
```

This implementation provides the foundation for our swipe interactions. Let's break down the key aspects that make it work smoothly:

1. **State Management**: We track the current state of swipe interactions, including position, direction, and animation status. This helps us provide smooth, responsive feedback to user actions.

2. **Configuration**: The system is highly configurable, allowing us to fine-tune the feel of swipe interactions. We can adjust thresholds, rotation amounts, and animation parameters to create the perfect feel.

3. **Event Handling**: We handle both touch and mouse events, making the interface work seamlessly across devices. The system also includes checks to prevent unwanted interactions during processing.

4. **Visual Feedback**: We provide immediate visual feedback through transforms and rotations, helping users understand how their interactions affect the interface.

The SwipeContainer component serves as the foundation for our swipe-based interface, but it's just one part of a larger system. Would you like me to create documentation for the other key components next, such as:

1. The SwipeCard component that handles individual video cards
2. The animation system that makes transitions smooth
3. The gesture recognition system
4. The feedback indicator system

Each of these components builds on this foundation to create our complete swipe interaction experience. Which would you like me to document next?