# Swipe Functions Documentation

## Overview

The swipe function system is a crucial component of ReelMeals, providing smooth, intuitive interactions for recipe discovery. This document outlines the implementation details of our swipe mechanics, gesture handling, and animation system.

## Core Components

### 1. Swipe Controller

The SwipeController manages the overall swipe interaction system:

```typescript
interface SwipeControllerConfig {
  threshold: number;          // Distance required for successful swipe
  velocityThreshold: number;  // Speed required for successful swipe
  rotationFactor: number;     // Controls card rotation during swipe
  resistance: number;         // Controls swipe resistance
}

class SwipeController {
  private config: SwipeControllerConfig;
  private state: SwipeState;
  private element: HTMLElement;
  
  constructor(element: HTMLElement, config: SwipeControllerConfig) {
    this.element = element;
    this.config = {
      threshold: 0.4 * window.innerWidth,
      velocityThreshold: 0.5,
      rotationFactor: 15,
      resistance: 1,
      ...config
    };
    
    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      velocity: 0
    };
    
    this.initialize();
  }
  
  private initialize(): void {
    this.setupEventListeners();
    this.setupIntersectionObserver();
  }

  private setupEventListeners(): void {
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart);
    this.element.addEventListener('touchmove', this.handleTouchMove);
    this.element.addEventListener('touchend', this.handleTouchEnd);
    
    // Mouse events
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mouseup', this.handleMouseUp);
  }
}
```

### 2. Gesture Handler

The GestureHandler processes raw touch and mouse events:

```typescript
interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: 'left' | 'right' | null;
}

class GestureHandler {
  private state: GestureState;
  private readonly velocityTracker: VelocityTracker;
  
  constructor() {
    this.velocityTracker = new VelocityTracker();
    this.state = this.getInitialState();
  }
  
  handleStart(x: number, y: number): void {
    this.state = {
      ...this.getInitialState(),
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    };
    
    this.velocityTracker.start();
  }
  
  handleMove(x: number, y: number): GestureState {
    const deltaX = x - this.state.startX;
    const deltaY = y - this.state.startY;
    
    this.state = {
      ...this.state,
      currentX: x,
      currentY: y,
      deltaX,
      deltaY,
      velocity: this.velocityTracker.update(x),
      direction: this.getDirection(deltaX)
    };
    
    return this.state;
  }
  
  private getDirection(deltaX: number): 'left' | 'right' | null {
    if (Math.abs(deltaX) < 10) return null;
    return deltaX > 0 ? 'right' : 'left';
  }
}
```

### 3. Animation Manager

The AnimationManager handles smooth transitions and visual feedback:

```typescript
interface AnimationConfig {
  duration: number;
  easing: string;
  springConfig: {
    tension: number;
    friction: number;
  };
}

class AnimationManager {
  private config: AnimationConfig;
  private animation: Animation | null = null;
  
  constructor(config: Partial<AnimationConfig> = {}) {
    this.config = {
      duration: 300,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      springConfig: {
        tension: 120,
        friction: 17
      },
      ...config
    };
  }
  
  animate(element: HTMLElement, properties: Record<string, number>): Promise<void> {
    this.cancelCurrentAnimation();
    
    this.animation = element.animate(
      this.createKeyframes(properties),
      this.createTiming()
    );
    
    return new Promise((resolve) => {
      this.animation!.onfinish = () => {
        this.applyFinalState(element, properties);
        resolve();
      };
    });
  }
  
  private createKeyframes(properties: Record<string, number>): Keyframe[] {
    const currentState = this.getCurrentState(properties);
    return [
      { ...currentState },
      { ...properties }
    ];
  }
  
  private createTiming(): KeyframeAnimationOptions {
    return {
      duration: this.config.duration,
      easing: this.config.easing,
      fill: 'forwards'
    };
  }
}
```

### 4. Velocity Tracker

The VelocityTracker calculates swipe velocity for natural-feeling interactions:

```typescript
interface VelocityFrame {
  position: number;
  timestamp: number;
}

class VelocityTracker {
  private readonly frames: VelocityFrame[] = [];
  private readonly maxFrames = 5;
  
  start(): void {
    this.frames.length = 0;
  }
  
  update(position: number): number {
    const now = performance.now();
    
    this.frames.push({ position, timestamp: now });
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
    
    return this.calculateVelocity();
  }
  
  private calculateVelocity(): number {
    if (this.frames.length < 2) return 0;
    
    const first = this.frames[0];
    const last = this.frames[this.frames.length - 1];
    
    const deltaTime = last.timestamp - first.timestamp;
    const deltaPosition = last.position - first.position;
    
    return deltaPosition / deltaTime;
  }
}
```

### 5. SwipeCard Component

The SwipeCard component combines all these systems:

```typescript
interface SwipeCardProps {
  video: VideoResource;
  onSwipe: (direction: 'left' | 'right') => Promise<void>;
  isActive: boolean;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  video,
  onSwipe,
  isActive
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const controller = useSwipeController(cardRef, {
    onSwipeLeft: () => onSwipe('left'),
    onSwipeRight: () => onSwipe('right')
  });
  
  const transform = useTransform(controller.x, controller.y, controller.rotation);
  
  return (
    <motion.div
      ref={cardRef}
      className="swipe-card"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform
      }}
      animate={controller.animate}
    >
      <VideoPlayer video={video} isActive={isActive} />
      <SwipeIndicators direction={controller.direction} />
      <CardMetadata video={video} />
    </motion.div>
  );
};
```

## Performance Optimizations

### 1. Hardware Acceleration

We optimize performance through strategic use of hardware acceleration:

```typescript
const optimizeTransforms = (element: HTMLElement) => {
  // Force hardware acceleration
  element.style.transform = 'translate3d(0,0,0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  
  // Hint upcoming animations
  element.style.willChange = 'transform';
};
```

### 2. Event Throttling

We implement event throttling to maintain smooth performance:

```typescript
class EventThrottler {
  private timestamp = 0;
  private readonly threshold = 1000 / 60; // 60fps
  
  shouldUpdate(): boolean {
    const now = performance.now();
    
    if (now - this.timestamp >= this.threshold) {
      this.timestamp = now;
      return true;
    }
    
    return false;
  }
}
```

## Error Handling

We implement comprehensive error handling:

```typescript
class SwipeErrorHandler {
  handle(error: Error): void {
    // Log error
    console.error('Swipe error:', error);
    
    // Reset state
    this.resetSwipeState();
    
    // Notify user if necessary
    this.showErrorFeedback();
  }
  
  private resetSwipeState(): void {
    // Reset animation state
    // Reset gesture state
    // Reset velocity tracking
  }
  
  private showErrorFeedback(): void {
    // Show subtle visual feedback
    // Optionally show error message
  }
}
```

## Accessibility

We ensure our swipe interactions are accessible:

```typescript
const AccessibleSwipeCard: React.FC<SwipeCardProps> = (props) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Recipe card, swipe right to save, left to skip"
      onKeyDown={handleKeyboardSwipe}
    >
      <SwipeCard {...props} />
    </div>
  );
};
```

This implementation creates a smooth, intuitive swipe interaction system that works well across devices while maintaining high performance and accessibility standards.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*