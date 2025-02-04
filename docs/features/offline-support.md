# Offline Support System Documentation

## Overview

ReelMeals implements comprehensive offline support to ensure users can access their saved recipes and collections without an internet connection. This document details our offline-first architecture, which uses Service Workers, IndexedDB, and a sophisticated sync system to provide a seamless experience regardless of network status.

## Core Architecture

### 1. Service Worker Implementation

Our Service Worker manages caching and offline access:

```typescript
interface CacheConfig {
  version: string;
  caches: {
    static: string[];    // Static assets like images and JS
    dynamic: string[];   // Dynamic content like video thumbnails
    api: string[];       // API responses
  };
  maxAge: {
    static: number;      // Cache duration for static assets
    dynamic: number;     // Cache duration for dynamic content
    api: number;         // Cache duration for API responses
  };
}

class ServiceWorkerManager {
  private readonly config: CacheConfig = {
    version: '1.0.0',
    caches: {
      static: ['/styles', '/scripts', '/images'],
      dynamic: ['/thumbnails', '/previews'],
      api: ['/api/recipes', '/api/collections']
    },
    maxAge: {
      static: 7 * 24 * 60 * 60 * 1000,  // 1 week
      dynamic: 24 * 60 * 60 * 1000,     // 1 day
      api: 60 * 60 * 1000               // 1 hour
    }
  };

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          '/service-worker.js',
          { scope: '/' }
        );
        
        console.log('ServiceWorker registered:', registration);
        
        await this.setupCaches();
        await this.precacheStaticAssets();
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    }
  }

  private async setupCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    
    // Clean up old caches
    await Promise.all(
      cacheNames
        .filter(name => !Object.values(this.config.caches).includes(name))
        .map(name => caches.delete(name))
    );
  }

  private async precacheStaticAssets(): Promise<void> {
    const cache = await caches.open(this.config.caches.static);
    await cache.addAll(this.config.static);
  }
}
```

### 2. Data Persistence Layer

We use IndexedDB for offline data storage:

```typescript
interface StorageSchema {
  recipes: {
    id: string;
    data: VideoResource;
    timestamp: number;
  };
  collections: {
    id: string;
    data: Collection;
    timestamp: number;
  };
  syncQueue: {
    id: string;
    action: 'create' | 'update' | 'delete';
    entity: 'recipe' | 'collection';
    data: any;
    timestamp: number;
  };
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ReelMealsOffline';
  private readonly version = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        db.createObjectStore('recipes', { keyPath: 'id' });
        db.createObjectStore('collections', { keyPath: 'id' });
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      };
    });
  }

  async saveRecipe(recipe: VideoResource): Promise<void> {
    await this.save('recipes', {
      id: recipe.id,
      data: recipe,
      timestamp: Date.now()
    });
  }

  async getRecipe(id: string): Promise<VideoResource | null> {
    const record = await this.get('recipes', id);
    return record?.data || null;
  }

  private async save(
    storeName: keyof StorageSchema,
    data: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
```

### 3. Sync Manager

Handles synchronization when connection is restored:

```typescript
interface SyncTask {
  id: string;
  type: 'recipe' | 'collection';
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
}

class SyncManager {
  private readonly maxRetries = 3;
  private readonly storage: OfflineStorage;
  private issyncing = false;

  constructor(storage: OfflineStorage) {
    this.storage = storage;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Register for online/offline events
    window.addEventListener('online', this.onConnectionRestored);
    window.addEventListener('offline', this.onConnectionLost);

    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in registration) {
      await registration.sync.register('sync-pending-changes');
    }
  }

  async queueSync(task: Omit<SyncTask, 'id' | 'retryCount'>): Promise<void> {
    const syncTask: SyncTask = {
      ...task,
      id: uuid(),
      retryCount: 0
    };

    await this.storage.save('syncQueue', syncTask);

    if (navigator.onLine) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.issyncing) return;
    this.issyncing = true;

    try {
      const tasks = await this.storage.getAllFromStore('syncQueue');
      
      for (const task of tasks) {
        try {
          await this.processTask(task);
          await this.storage.deleteFromStore('syncQueue', task.id);
        } catch (error) {
          await this.handleSyncError(task, error);
        }
      }
    } finally {
      this.issyncing = false;
    }
  }

  private async processTask(task: SyncTask): Promise<void> {
    switch (task.type) {
      case 'recipe':
        await this.syncRecipe(task);
        break;
      case 'collection':
        await this.syncCollection(task);
        break;
    }
  }
}
```

### 4. Network Status Manager

Monitors and responds to network status changes:

```typescript
class NetworkManager {
  private isOnline = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  }

  addStatusListener(listener: (online: boolean) => void): void {
    this.listeners.add(listener);
    listener(this.isOnline);
  }

  removeStatusListener(listener: (online: boolean) => void): void {
    this.listeners.delete(listener);
  }

  private updateStatus(online: boolean): void {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
  }
}
```

## Offline Video Support

We implement smart video caching for offline viewing:

```typescript
interface VideoCacheConfig {
  maxSize: number;        // Maximum cache size in bytes
  maxVideos: number;      // Maximum number of videos to cache
  quality: 'low' | 'medium' | 'high';
}

class VideoCache {
  private readonly config: VideoCacheConfig;
  private readonly storage: OfflineStorage;

  constructor(config: VideoCacheConfig, storage: OfflineStorage) {
    this.config = config;
    this.storage = storage;
  }

  async cacheVideo(videoId: string): Promise<void> {
    const videoUrl = await this.getVideoUrl(videoId, this.config.quality);
    const response = await fetch(videoUrl);
    const blob = await response.blob();

    // Check cache size limits
    await this.ensureCacheSpace(blob.size);

    // Store video blob
    await this.storage.saveVideo(videoId, blob);
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = await this.getCurrentCacheSize();
    
    if (currentSize + requiredSize > this.config.maxSize) {
      await this.evictVideos(requiredSize);
    }
  }

  private async evictVideos(requiredSize: number): Promise<void> {
    const videos = await this.storage.getVideosOrderByLastAccess();
    let freedSpace = 0;

    for (const video of videos) {
      if (freedSpace >= requiredSize) break;
      
      await this.storage.deleteVideo(video.id);
      freedSpace += video.size;
    }
  }
}
```

## Error Handling

We implement comprehensive error handling for offline scenarios:

```typescript
class OfflineErrorHandler {
  private readonly networkManager: NetworkManager;

  handleError(error: Error): void {
    if (this.isNetworkError(error)) {
      this.handleNetworkError(error);
    } else if (this.isStorageError(error)) {
      this.handleStorageError(error);
    } else if (this.isSyncError(error)) {
      this.handleSyncError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private handleNetworkError(error: Error): void {
    // Show offline notification
    // Enable offline mode
    // Queue pending changes
  }

  private handleStorageError(error: Error): void {
    // Handle storage quota exceeded
    // Clean up unnecessary data
    // Show storage warning
  }

  private handleSyncError(error: Error): void {
    // Retry sync with backoff
    // Show sync status
    // Queue for later retry
  }
}
```

## Performance Optimization

We implement several strategies to optimize offline performance:

1. Progressive Loading
2. Smart Caching
3. Background Sync
4. Compression

```typescript
class PerformanceOptimizer {
  private readonly metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    syncLatency: [],
    storageUsage: 0
  };

  async optimize(): Promise<void> {
    await this.optimizeCache();
    await this.optimizeStorage();
    await this.optimizeSync();
  }

  private async optimizeCache(): Promise<void> {
    // Implement cache optimization logic
  }

  private async optimizeStorage(): Promise<void> {
    // Implement storage optimization logic
  }

  private async optimizeSync(): Promise<void> {
    // Implement sync optimization logic
  }
}
```

This comprehensive offline support system ensures that ReelMeals provides a reliable and performant experience regardless of network connectivity.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*