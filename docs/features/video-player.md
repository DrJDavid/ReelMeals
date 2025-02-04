# Video Player Feature Documentation

## Overview

The video player is the core component of ReelMeals, providing a seamless, TikTok-style video viewing experience. Our implementation focuses on smooth playback, efficient resource management, and intuitive user interactions. Think of it as a specialized video player designed specifically for cooking content, where users need to clearly see techniques and follow along with recipes.

## Core Functionality

### Video Player Component

The main player component manages video playback and user interactions:

```typescript
interface VideoPlayerProps {
  videoUrl: string;
  metadata: VideoMetadata;
  onComplete: () => void;
  onError: (error: Error) => void;
}

interface VideoMetadata {
  duration: number;
  cuisine: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  cookingTime: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  metadata,
  onComplete,
  onError
}) => {
  // State management for video playback
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video load handling
  useEffect(() => {
    const handleLoad = () => {
      setIsLoading(false);
      // Start playback when ready
      videoRef.current?.play().catch(onError);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', handleLoad);
      return () => video.removeEventListener('loadeddata', handleLoad);
    }
  }, [videoUrl]);

  // Progress tracking for completion
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = 
        videoRef.current.currentTime / videoRef.current.duration;
      setProgress(currentProgress);
      
      if (currentProgress >= 1) {
        onComplete();
      }
    }
  };

  return (
    <div className="video-player-container">
      {/* Loading overlay */}
      {isLoading && <LoadingSpinner />}

      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="video-element"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Metadata overlay */}
      <VideoMetadataOverlay
        metadata={metadata}
        progress={progress}
      />

      {/* Playback controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
      />
    </div>
  );
};
```

### Video Loading and Buffering

We implement sophisticated video loading to ensure smooth playback:

```typescript
class VideoLoadManager {
  private loadQueue: VideoResource[] = [];
  private preloadedVideos: Map<string, HTMLVideoElement> = new Map();

  // Configure preloading behavior
  private readonly config = {
    maxPreloadedVideos: 2,
    bufferingGoal: 0.3, // Buffer 30% before starting
    maxRetries: 3
  };

  async preloadVideo(videoUrl: string): Promise<void> {
    // Create a new video element for preloading
    const videoElement = document.createElement('video');
    
    try {
      // Begin loading the video
      videoElement.src = videoUrl;
      videoElement.preload = 'auto';
      
      // Wait for enough data to be loaded
      await new Promise((resolve, reject) => {
        videoElement.addEventListener('canplay', resolve);
        videoElement.addEventListener('error', reject);
      });

      // Store the preloaded video
      this.preloadedVideos.set(videoUrl, videoElement);
      
      // Clean up old preloaded videos if needed
      this.cleanupOldPreloads();
    } catch (error) {
      // Handle loading errors
      console.error('Failed to preload video:', error);
      throw error;
    }
  }

  private cleanupOldPreloads(): void {
    if (this.preloadedVideos.size > this.config.maxPreloadedVideos) {
      const [oldestUrl] = this.preloadedVideos.keys();
      const oldVideo = this.preloadedVideos.get(oldestUrl);
      
      if (oldVideo) {
        oldVideo.src = ''; // Clear the source
        this.preloadedVideos.delete(oldestUrl);
      }
    }
  }
}
```

### Metadata Overlay Component

The metadata overlay provides context about the current video:

```typescript
interface MetadataOverlayProps {
  metadata: VideoMetadata;
  progress: number;
}

const MetadataOverlay: React.FC<MetadataOverlayProps> = ({
  metadata,
  progress
}) => {
  // Position overlay information
  const overlayPosition = useMemo(() => {
    // Calculate optimal position based on video content
    return calculateOverlayPosition(metadata);
  }, [metadata]);

  return (
    <div 
      className="metadata-overlay"
      style={{
        position: 'absolute',
        ...overlayPosition
      }}
    >
      {/* Cuisine type tag */}
      <div className="cuisine-tag">
        {metadata.cuisine}
      </div>

      {/* Cooking time indicator */}
      <div className="time-indicator">
        {formatCookingTime(metadata.cookingTime)}
      </div>

      {/* Difficulty badge */}
      <DifficultyBadge level={metadata.difficulty} />

      {/* Progress indicator */}
      <ProgressBar progress={progress} />
    </div>
  );
};
```

### Progress Tracking and Analytics

We implement comprehensive progress tracking for analytics and user experience:

```typescript
interface VideoAnalytics {
  videoId: string;
  watchDuration: number;
  completionRate: number;
  interactions: UserInteraction[];
}

class VideoAnalyticsTracker {
  private readonly analyticsBuffer: VideoAnalytics[] = [];
  private currentSession: VideoAnalytics | null = null;

  startTracking(videoId: string): void {
    this.currentSession = {
      videoId,
      watchDuration: 0,
      completionRate: 0,
      interactions: []
    };
  }

  updateProgress(progress: number): void {
    if (this.currentSession) {
      this.currentSession.completionRate = progress;
      
      // Buffer analytics data
      if (progress >= 1 || progress % 0.25 === 0) {
        this.bufferAnalytics(this.currentSession);
      }
    }
  }

  private bufferAnalytics(analytics: VideoAnalytics): void {
    this.analyticsBuffer.push({...analytics});
    
    // Flush buffer if it gets too large
    if (this.analyticsBuffer.length >= 10) {
      this.flushAnalytics();
    }
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsBuffer.length > 0) {
      try {
        await this.sendAnalytics(this.analyticsBuffer);
        this.analyticsBuffer.length = 0;
      } catch (error) {
        console.error('Failed to send analytics:', error);
      }
    }
  }
}
```

## Error Handling

We implement robust error handling to ensure a smooth user experience:

```typescript
interface VideoErrorHandler {
  type: 'network' | 'decode' | 'timeout';
  retryCount: number;
  lastError: Error | null;
}

class VideoErrorManager {
  private readonly errorHandlers: Map<string, VideoErrorHandler> = new Map();

  handleError(videoId: string, error: Error): void {
    const handler = this.getOrCreateHandler(videoId);
    
    switch (this.categorizeError(error)) {
      case 'network':
        this.handleNetworkError(handler, videoId);
        break;
      case 'decode':
        this.handleDecodeError(handler, videoId);
        break;
      case 'timeout':
        this.handleTimeoutError(handler, videoId);
        break;
      default:
        this.handleUnknownError(handler, videoId);
    }
  }

  private async handleNetworkError(
    handler: VideoErrorHandler,
    videoId: string
  ): Promise<void> {
    if (handler.retryCount < 3) {
      // Attempt retry with exponential backoff
      await this.retryWithBackoff(handler, videoId);
    } else {
      // Fall back to lower quality version
      await this.fallbackToLowerQuality(videoId);
    }
  }
}
```

## Performance Optimization

We implement several optimizations to ensure smooth playback:

```typescript
interface PerformanceConfig {
  maxConcurrentLoads: number;
  preloadThreshold: number;
  bufferingStrategy: 'eager' | 'lazy';
}

class VideoPerformanceOptimizer {
  private readonly config: PerformanceConfig = {
    maxConcurrentLoads: 2,
    preloadThreshold: 0.8,
    bufferingStrategy: 'eager'
  };

  constructor() {
    this.initializeOptimizer();
  }

  private initializeOptimizer(): void {
    // Set up performance monitoring
    this.setupPerformanceObserver();
    
    // Initialize memory management
    this.setupMemoryManagement();
  }

  private setupPerformanceObserver(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });

    observer.observe({ entryTypes: ['video'] });
  }
}
```

This documentation provides a comprehensive overview of our video player implementation, focusing on the key aspects that ensure a smooth and engaging user experience. Each component is designed to work together seamlessly while maintaining high performance and reliability.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*