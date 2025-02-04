# ReelMeals State Management Architecture

## Introduction

State management in ReelMeals follows a predictable, unidirectional flow pattern optimized for video playback and swipe interactions. This document outlines how we manage application state across different layers of the application, from user interactions to data persistence.

## Global State Architecture

Our application uses a combination of React Context and local component state, carefully balanced to maintain performance while ensuring data consistency. Think of this like a restaurant where different stations need to coordinate but also maintain some independence.

### Core State Structure

```typescript
// The root state interface that defines our entire application state
interface ApplicationState {
  // User-related state
  user: {
    profile: UserProfile | null;
    preferences: UserPreferences;
    collections: Collection[];
    viewHistory: VideoInteraction[];
    isAuthenticated: boolean;
  };

  // Video playback state
  player: {
    currentVideo: VideoResource | null;
    nextVideo: VideoResource | null;
    playbackStatus: 'loading' | 'playing' | 'paused' | 'error';
    progress: number;
    isMuted: boolean;
  };

  // Discovery queue state
  discovery: {
    videoQueue: VideoResource[];
    lastFetchedAt: Date;
    hasMore: boolean;
    filters: VideoFilters;
  };

  // UI state
  ui: {
    isLoading: boolean;
    activeModals: string[];
    toasts: Toast[];
    currentView: 'feed' | 'collections' | 'profile';
  };
}
```

### State Management Providers

We organize our state providers hierarchically to optimize rendering and state access:

```typescript
// Root provider that wraps our entire application
function StateProvider({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <VideoProvider>
        <UIProvider>
          <CollectionsProvider>
            {children}
          </CollectionsProvider>
        </UIProvider>
      </VideoProvider>
    </AuthProvider>
  );
}

// Example of a specific provider implementation
function VideoProvider({ children }: PropsWithChildren) {
  // State for video playback and queue management
  const [playerState, dispatch] = useReducer(videoReducer, initialVideoState);
  
  // Memoized context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    state: playerState,
    dispatch
  }), [playerState]);

  return (
    <VideoContext.Provider value={contextValue}>
      {children}
    </VideoContext.Provider>
  );
}
```

## State Updates and Actions

Our state updates follow a strict action-based pattern to maintain predictability:

```typescript
// Action type definitions for video-related state changes
type VideoAction =
  | { type: 'LOAD_VIDEO'; payload: VideoResource }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'TOGGLE_PLAYBACK' }
  | { type: 'SAVE_VIDEO'; payload: VideoResource }
  | { type: 'SKIP_VIDEO' };

// Example reducer implementation for video state
function videoReducer(state: VideoState, action: VideoAction): VideoState {
  switch (action.type) {
    case 'LOAD_VIDEO':
      return {
        ...state,
        currentVideo: action.payload,
        playbackStatus: 'loading',
        progress: 0
      };
      
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.payload,
        // Trigger next video preload at 80% progress
        shouldPreloadNext: action.payload > 0.8
      };
      
    // Additional cases for other actions...
    
    default:
      return state;
  }
}
```

## State Persistence Strategy

We implement a sophisticated persistence strategy to maintain state across sessions:

```typescript
class StatePersistenceManager {
  // Configuration for what state to persist and how
  private config: PersistenceConfig = {
    user: {
      persist: true,
      storage: 'local',
      encryption: false
    },
    collections: {
      persist: true,
      storage: 'indexed-db',
      encryption: true
    },
    player: {
      persist: false
    }
  };

  // Persist specific state slices
  async persistState(state: Partial<ApplicationState>): Promise<void> {
    for (const [key, value] of Object.entries(state)) {
      if (this.config[key]?.persist) {
        await this.persistSlice(key, value);
      }
    }
  }

  // Restore state on application startup
  async hydrateState(): Promise<Partial<ApplicationState>> {
    const hydratedState = {};
    
    for (const [key, config] of Object.entries(this.config)) {
      if (config.persist) {
        hydratedState[key] = await this.retrieveSlice(key);
      }
    }
    
    return hydratedState;
  }
}
```

## Performance Optimizations

We implement several strategies to maintain smooth performance while managing state:

### 1. Selective Updates

```typescript
// Custom hook for accessing specific state slices
function useVideoState<K extends keyof VideoState>(
  selector: K
): VideoState[K] {
  const context = useContext(VideoContext);
  
  return useMemo(
    () => context.state[selector],
    [context.state[selector]]
  );
}

// Example usage in a component
function VideoProgress() {
  // Only re-renders when progress changes
  const progress = useVideoState('progress');
  
  return <ProgressBar value={progress} />;
}
```

### 2. State Batching

```typescript
// Batch related state updates together
function handleVideoComplete() {
  batchUpdates(() => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: 1 });
    dispatch({ type: 'PREPARE_NEXT_VIDEO' });
    dispatch({ type: 'UPDATE_HISTORY' });
  });
}
```

## Error Handling

We implement comprehensive error handling in our state management:

```typescript
interface StateError {
  code: string;
  message: string;
  context: any;
  timestamp: Date;
}

class StateErrorHandler {
  private handleStateError(error: StateError): void {
    // Log error
    logger.error('State update failed', {
      code: error.code,
      context: error.context
    });

    // Attempt recovery
    this.attemptRecovery(error);

    // Notify user if necessary
    if (this.shouldNotifyUser(error)) {
      this.showUserNotification(error);
    }
  }
}
```

## Development Tools

To assist with development and debugging, we implement several developer tools:

```typescript
const STATE_DEBUGGER = {
  enabled: process.env.NODE_ENV === 'development',
  
  logStateChange(
    prevState: ApplicationState,
    nextState: ApplicationState,
    action: any
  ): void {
    if (!this.enabled) return;
    
    console.group('State Change');
    console.log('Previous State:', prevState);
    console.log('Action:', action);
    console.log('Next State:', nextState);
    console.groupEnd();
  }
};
```

This state management architecture ensures our application remains performant and maintainable while handling complex video playback and user interactions. The system is designed to be both robust for current needs and extensible for future features.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*