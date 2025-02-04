# ReelMeals System Architecture Overview

## Introduction

ReelMeals is a Progressive Web Application built on Next.js and Firebase, implementing a Tinder-style interface for cooking video discovery. This document outlines the complete system architecture, explaining how each component works together to create a seamless user experience.

## System Architecture Overview

Our architecture follows a client-server model implemented through Firebase services, with a Next.js frontend serving as a PWA. The system is designed to optimize video delivery while maintaining smooth user interactions and offline capabilities.

### Core Technical Stack

Frontend Layer:

- Next.js 14 (React 18)
- TypeScript 5.x
- TailwindCSS
- Framer Motion
- React Player

Backend Services (Firebase):

- Authentication
- Cloud Firestore
- Cloud Storage
- Hosting
- Analytics

### Component Architecture

The application follows a feature-based architecture pattern:

```
src/
├── components/          # Reusable UI components
│   ├── video/          # Video-related components
│   ├── swipe/          # Swipe interaction components
│   ├── collections/    # Collection management components
│   └── common/         # Shared UI elements
├── features/           # Feature-specific logic
│   ├── video-player/   # Video playback feature
│   ├── collections/    # Collections management
│   └── auth/           # Authentication feature
├── hooks/              # Custom React hooks
├── lib/               # Utility functions and Firebase setup
├── pages/             # Next.js pages and API routes
└── types/             # TypeScript type definitions
```

## Core Systems

### 1. Video Playback System

The video playback system is built around React Player with custom enhancements for mobile optimization:

```typescript
interface VideoPlayerConfig {
  preloadNext: boolean;
  bufferSize: number;
  quality: 'auto' | 'low' | 'medium' | 'high';
  cacheStrategy: 'memory' | 'persistent';
}

class VideoPlaybackManager {
  private currentVideo: VideoResource;
  private nextVideo: VideoResource | null;
  private bufferQueue: VideoResource[];

  constructor(config: VideoPlayerConfig) {
    this.bufferQueue = [];
    this.preloadStrategy = config.preloadNext ? 'eager' : 'lazy';
  }

  // Implementation details for video management
}
```

### 2. Swipe Interaction System

The swipe system uses Framer Motion for gesture handling with custom thresholds:

```typescript
interface SwipeConfig {
  threshold: number;
  velocity: number;
  direction: 'horizontal' | 'both';
  resistance: number;
}

interface SwipeHandlers {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}
```

### 3. State Management

We use a combination of React Context and local state management:

```typescript
interface AppState {
  user: UserProfile | null;
  currentVideo: VideoResource | null;
  collections: Collection[];
  preferences: UserPreferences;
}

interface StateActions {
  type: 'SAVE_VIDEO' | 'SKIP_VIDEO' | 'UPDATE_PREFERENCES';
  payload: any;
}
```

## Data Models

### Video Resource

```typescript
interface VideoResource {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  metadata: {
    title: string;
    description: string;
    cuisine: string;
    difficulty: 'Easy' | 'Intermediate' | 'Advanced';
    cookingTime: number;
    ingredients: string[];
    instructions: string[];
  };
  engagement: {
    saves: number;
    views: number;
    completionRate: number;
  };
  technical: {
    resolution: string;
    format: string;
    size: number;
  };
}
```

### User Profile

```typescript
interface UserProfile {
  id: string;
  displayName: string;
  preferences: {
    cuisineTypes: string[];
    maxCookingTime?: number;
    difficultyLevel?: string;
  };
  collections: {
    id: string;
    name: string;
    videos: string[];
  }[];
  savedVideos: string[];
  viewHistory: {
    videoId: string;
    timestamp: Date;
    completed: boolean;
  }[];
}
```

## Performance Optimization

### Video Delivery Strategy

The system implements a sophisticated video delivery pipeline:

1. Video Preloading:
   - Preload next video while current video is playing
   - Cache video metadata for quick access
   - Implement adaptive quality based on network conditions

2. Resource Management:
   - Limit video buffer size based on device memory
   - Clear cached videos when memory pressure is high
   - Implement lazy loading for collection views

```typescript
interface CacheConfig {
  maxSize: number;
  maxAge: number;
  priorityFunction: (video: VideoResource) => number;
}

class VideoCache {
  private cache: Map<string, CachedVideo>;
  private size: number;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.size = 0;
    this.config = config;
  }

  // Cache management implementation
}
```

## Security Model

### Authentication Flow

1. User Authentication:
   - Firebase Authentication for user management
   - JWT token-based session management
   - Secure token refresh mechanism

2. Authorization:
   - Role-based access control
   - Collection-level permissions
   - Video access restrictions

```typescript
interface SecurityConfig {
  allowedOrigins: string[];
  maxTokenAge: number;
  refreshThreshold: number;
}

class SecurityManager {
  private config: SecurityConfig;
  
  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // Security implementation details
}
```

## Offline Capabilities

The PWA implements comprehensive offline support:

1. Service Worker Strategy:
   - Cache video metadata and thumbnails
   - Store user preferences and collections
   - Implement background sync for saves/skips

2. Storage Strategy:
   - IndexedDB for video metadata
   - Cache API for static assets
   - Local Storage for user preferences

```typescript
interface OfflineConfig {
  cacheName: string;
  version: number;
  maxAge: number;
  resources: {
    [key: string]: CacheStrategy;
  };
}
```

## Error Handling

The system implements a comprehensive error handling strategy:

```typescript
interface ErrorConfig {
  retryAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  fallbackContent: boolean;
}

class ErrorBoundary {
  private config: ErrorConfig;
  
  constructor(config: ErrorConfig) {
    this.config = config;
  }

  // Error handling implementation
}
```

## Monitoring and Analytics

The system implements comprehensive monitoring:

1. Performance Metrics:
   - Video load times
   - Interaction latency
   - Cache hit rates
   - Error rates

2. User Analytics:
   - Engagement metrics
   - Watch time
   - Swipe patterns
   - Collection usage

## Deployment Architecture

The application follows a multi-environment deployment strategy:

```typescript
interface DeployConfig {
  environment: 'development' | 'staging' | 'production';
  features: Feature[];
  caching: CacheStrategy;
  monitoring: MonitoringConfig;
}
```

This architecture document serves as a comprehensive guide for implementing the ReelMeals application. Each component and system is designed to work together seamlessly while maintaining high performance and reliability standards.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*
