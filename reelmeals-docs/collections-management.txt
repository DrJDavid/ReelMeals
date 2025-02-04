# Collections Management System Documentation

## Overview

The Collections Management System enables users to organize their saved cooking videos into meaningful groups. Similar to how a chef organizes their recipe cards into categories, our system allows users to create, manage, and organize their saved videos into collections that make sense for their cooking journey.

## Core Architecture

### Data Model

```typescript
interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  videoCount: number;
  isDefault: boolean;
  sortOrder: number;
  videos: CollectionVideo[];
}

interface CollectionVideo {
  id: string;
  videoId: string;
  addedAt: Timestamp;
  sortOrder: number;
  notes?: string;
  customTags?: string[];
}

interface CollectionMeta {
  totalVideos: number;
  lastWatched: Timestamp;
  cuisineTypes: string[];
  averageDuration: number;
  difficultyBreakdown: {
    easy: number;
    intermediate: number;
    advanced: number;
  };
}
```

### Collection Manager

The CollectionManager handles all collection-related operations:

```typescript
class CollectionManager {
  private readonly firestore: Firestore;
  private readonly userId: string;
  private readonly cache: CollectionCache;

  constructor(firestore: Firestore, userId: string) {
    this.firestore = firestore;
    this.userId = userId;
    this.cache = new CollectionCache();
  }

  async createCollection(data: Partial<Collection>): Promise<string> {
    const collection: Collection = {
      id: uuid(),
      userId: this.userId,
      name: data.name || 'New Collection',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      videoCount: 0,
      isDefault: false,
      sortOrder: await this.getNextSortOrder(),
      videos: [],
      ...data
    };

    await this.firestore
      .collection('collections')
      .doc(collection.id)
      .set(collection);

    this.cache.set(collection.id, collection);
    return collection.id;
  }

  async addVideoToCollection(
    collectionId: string,
    videoId: string,
    options?: {
      notes?: string;
      tags?: string[];
    }
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
    
    if (!collection) {
      throw new Error('Collection not found');
    }

    const collectionVideo: CollectionVideo = {
      id: uuid(),
      videoId,
      addedAt: Timestamp.now(),
      sortOrder: collection.videos.length,
      notes: options?.notes,
      customTags: options?.tags
    };

    await this.firestore
      .collection('collections')
      .doc(collectionId)
      .update({
        videos: arrayUnion(collectionVideo),
        videoCount: increment(1),
        updatedAt: Timestamp.now()
      });

    this.cache.invalidate(collectionId);
  }

  async removeVideoFromCollection(
    collectionId: string,
    videoId: string
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
    
    if (!collection) {
      throw new Error('Collection not found');
    }

    const updatedVideos = collection.videos.filter(v => v.videoId !== videoId);

    await this.firestore
      .collection('collections')
      .doc(collectionId)
      .update({
        videos: updatedVideos,
        videoCount: increment(-1),
        updatedAt: Timestamp.now()
      });

    this.cache.invalidate(collectionId);
  }

  async getCollectionMetadata(collectionId: string): Promise<CollectionMeta> {
    const collection = await this.getCollection(collectionId);
    
    if (!collection) {
      throw new Error('Collection not found');
    }

    const videos = await this.fetchCollectionVideos(collection.videos);
    
    return {
      totalVideos: videos.length,
      lastWatched: this.calculateLastWatched(videos),
      cuisineTypes: this.extractUniqueCuisines(videos),
      averageDuration: this.calculateAverageDuration(videos),
      difficultyBreakdown: this.calculateDifficultyBreakdown(videos)
    };
  }

  private async getNextSortOrder(): Promise<number> {
    const collections = await this.firestore
      .collection('collections')
      .where('userId', '==', this.userId)
      .orderBy('sortOrder', 'desc')
      .limit(1)
      .get();

    if (collections.empty) {
      return 0;
    }

    return collections.docs[0].data().sortOrder + 1;
  }
}
```

### Collection Cache

We implement an intelligent caching system to improve performance:

```typescript
class CollectionCache {
  private cache: Map<string, CacheEntry<Collection>> = new Map();
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes

  set(id: string, collection: Collection): void {
    this.cache.set(id, {
      data: collection,
      timestamp: Date.now()
    });
  }

  get(id: string): Collection | null {
    const entry = this.cache.get(id);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(id);
      return null;
    }

    return entry.data;
  }

  invalidate(id: string): void {
    this.cache.delete(id);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## User Interface Components

### Collection List Component

```typescript
interface CollectionListProps {
  collections: Collection[];
  onCollectionSelect: (id: string) => void;
  onCreateCollection: () => void;
}

const CollectionList: React.FC<CollectionListProps> = ({
  collections,
  onCollectionSelect,
  onCreateCollection
}) => {
  return (
    <div className="collection-list">
      {/* Create new collection button */}
      <button
        className="create-collection-btn"
        onClick={onCreateCollection}
      >
        <PlusIcon className="w-6 h-6" />
        <span>New Collection</span>
      </button>

      {/* Collection grid */}
      <div className="collection-grid">
        {collections.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onClick={() => onCollectionSelect(collection.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Collection Detail View

```typescript
interface CollectionDetailProps {
  collectionId: string;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collectionId
}) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [metadata, setMetadata] = useState<CollectionMeta | null>(null);

  useEffect(() => {
    loadCollectionData();
  }, [collectionId]);

  return (
    <div className="collection-detail">
      {/* Collection header */}
      <CollectionHeader
        collection={collection}
        metadata={metadata}
      />

      {/* Video grid */}
      <CollectionVideoGrid
        videos={collection?.videos || []}
        onVideoSelect={handleVideoSelect}
        onVideoRemove={handleVideoRemove}
      />

      {/* Collection settings */}
      <CollectionSettings
        collection={collection}
        onUpdate={handleCollectionUpdate}
      />
    </div>
  );
};
```

## Offline Support

We implement robust offline support for collections:

```typescript
class OfflineCollectionManager {
  private readonly db: IDBDatabase;
  private readonly syncQueue: SyncQueue;

  constructor() {
    this.initializeDatabase();
    this.syncQueue = new SyncQueue();
  }

  async saveOfflineChanges(
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    // Save change to IndexedDB
    await this.saveToLocal(action, data);

    // Add to sync queue
    this.syncQueue.add({
      action,
      data,
      timestamp: Date.now()
    });
  }

  async synchronize(): Promise<void> {
    const changes = await this.syncQueue.getAll();
    
    for (const change of changes) {
      try {
        await this.pushChangeToServer(change);
        await this.syncQueue.remove(change.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}
```

## Performance Considerations

1. **Eager Loading**: We preload collection metadata for faster navigation
2. **Lazy Loading**: Videos within collections are loaded on-demand
3. **Caching**: Frequently accessed collections are cached in memory
4. **Batch Updates**: Collection changes are batched for efficiency
5. **IndexedDB**: Offline support with efficient local storage

## Error Handling

```typescript
class CollectionErrorHandler {
  handle(error: Error): void {
    switch (error.name) {
      case 'QuotaExceededError':
        this.handleStorageQuotaError();
        break;
      case 'NetworkError':
        this.handleNetworkError();
        break;
      case 'PermissionError':
        this.handlePermissionError();
        break;
      default:
        this.handleUnknownError(error);
    }
  }

  private handleStorageQuotaError(): void {
    // Implement storage quota error handling
  }

  private handleNetworkError(): void {
    // Implement network error handling
  }

  private handlePermissionError(): void {
    // Implement permission error handling
  }

  private handleUnknownError(error: Error): void {
    // Implement unknown error handling
  }
}
```

This documentation provides a comprehensive overview of our Collections Management System, focusing on the key components that enable users to organize and manage their saved cooking videos effectively.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*