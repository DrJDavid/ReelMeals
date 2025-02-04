# Database Relationships Documentation

## Overview

This document outlines the relationship patterns used in ReelMeals' Firestore database. Given Firestore's NoSQL nature, we implement relationships differently than in traditional SQL databases, optimizing for query performance and scalability.

## Core Relationship Patterns

### 1. One-to-One Relationships

We handle one-to-one relationships through direct document references or nested objects:

```typescript
// Example: User Profile relationship
interface User {
  id: string;
  email: string;
  // One-to-one nested relationship
  profile: {
    displayName: string;
    photoUrl: string;
    bio: string;
    joinDate: Timestamp;
  };
}

// Access pattern
const getUserProfile = async (userId: string) => {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.data()?.profile;
};
```

### 2. One-to-Few Relationships

For relationships where the "many" side is limited and unlikely to grow significantly:

```typescript
// Example: User Preferences relationship
interface User {
  id: string;
  // One-to-few nested relationship
  preferences: {
    cuisinePreferences: string[];
    dietaryRestrictions: string[];
    skillLevel: string;
    notificationSettings: {
      email: boolean;
      push: boolean;
      frequency: 'daily' | 'weekly' | 'never';
    };
  };
}

// Access pattern
const updateUserPreferences = async (
  userId: string, 
  updates: Partial<UserPreferences>
) => {
  await db.collection('users').doc(userId).update({
    'preferences': { ...updates }
  });
};
```

### 3. One-to-Many Relationships

For one-to-many relationships, we use separate collections with references:

```typescript
// Example: User to Collections relationship
interface Collection {
  id: string;
  userId: string;  // Reference to parent user
  name: string;
  // Other collection fields
}

// Access patterns
const getUserCollections = async (userId: string) => {
  const collections = await db
    .collection('collections')
    .where('userId', '==', userId)
    .get();
  return collections.docs.map(doc => doc.data());
};

// For pagination
const getPagedUserCollections = async (
  userId: string,
  lastDoc?: QueryDocumentSnapshot,
  limit: number = 10
) => {
  let query = db
    .collection('collections')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  return await query.get();
};
```

### 4. Many-to-Many Relationships

We implement many-to-many relationships using junction collections:

```typescript
// Example: Users saving Videos relationship
interface SavedVideo {
  id: string;
  userId: string;
  videoId: string;
  savedAt: Timestamp;
  notes?: string;
  collectionIds: string[];  // Optional organization
}

// Access patterns
const saveVideo = async (
  userId: string,
  videoId: string,
  collectionId?: string
) => {
  const savedVideoRef = db.collection('savedVideos').doc();
  await savedVideoRef.set({
    userId,
    videoId,
    savedAt: Timestamp.now(),
    collectionIds: collectionId ? [collectionId] : []
  });
};

const getUserSavedVideos = async (
  userId: string,
  collectionId?: string
) => {
  let query = db
    .collection('savedVideos')
    .where('userId', '==', userId);

  if (collectionId) {
    query = query.where('collectionIds', 'array-contains', collectionId);
  }

  return await query.get();
};
```

## Relationship Querying Strategies

### 1. Denormalization for Performance

We strategically denormalize data to optimize read performance:

```typescript
// Example: Denormalized video data in collections
interface CollectionVideo {
  id: string;
  videoId: string;
  // Denormalized video data for quick access
  title: string;
  thumbnailUrl: string;
  duration: number;
  addedAt: Timestamp;
}

// Update denormalized data
const updateVideoMetadata = async (
  videoId: string,
  updates: Partial<VideoMetadata>
) => {
  // Update main video document
  await db.collection('videos').doc(videoId).update(updates);

  // Update denormalized data in collections
  const batch = db.batch();
  const collectionRefs = await db
    .collectionGroup('videos')
    .where('videoId', '==', videoId)
    .get();

  collectionRefs.forEach(doc => {
    batch.update(doc.ref, updates);
  });

  await batch.commit();
};
```

### 2. Fan-out Pattern for Popular Data

For frequently accessed relationships, we implement fan-out writes:

```typescript
// Example: Updating video metadata across all references
const fanOutVideoUpdate = async (
  videoId: string,
  updates: Partial<VideoMetadata>
) => {
  const batch = db.batch();
  
  // Update main video document
  batch.update(db.collection('videos').doc(videoId), updates);

  // Update in popular collections
  const popularCollections = await db
    .collection('collections')
    .where('videoCount', '>', 1000)
    .where('videos', 'array-contains', videoId)
    .get();

  popularCollections.forEach(collection => {
    batch.update(collection.ref, {
      [`videos.${videoId}`]: updates
    });
  });

  await batch.commit();
};
```

## Query Optimization

### 1. Composite Indexes

We maintain composite indexes for common relationship queries:

```typescript
// Example composite index configuration
{
  "indexes": [
    {
      "collectionGroup": "savedVideos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "savedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "collections",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "videoCount", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 2. Query Helpers

We implement helper functions to manage complex relationship queries:

```typescript
class RelationshipQueryHelper {
  // Get all videos in a user's collections
  async getUserCollectionVideos(
    userId: string,
    options: QueryOptions = {}
  ): Promise<Video[]> {
    const { limit = 20, lastDoc, filter } = options;

    let query = db
      .collection('collections')
      .where('userId', '==', userId);

    if (filter) {
      query = this.applyFilter(query, filter);
    }

    const collections = await query.get();
    const videoIds = new Set<string>();

    collections.forEach(doc => {
      const data = doc.data();
      data.videos.forEach((video: any) => {
        videoIds.add(video.videoId);
      });
    });

    return await this.fetchVideos(Array.from(videoIds), limit, lastDoc);
  }

  private applyFilter(query: Query, filter: QueryFilter): Query {
    // Apply filter logic
    return query;
  }

  private async fetchVideos(
    ids: string[],
    limit: number,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<Video[]> {
    // Fetch video documents
    return [];
  }
}
```

## Data Consistency

### 1. Transaction Handling

We use transactions to maintain relationship consistency:

```typescript
const addVideoToCollection = async (
  collectionId: string,
  videoId: string
) => {
  await db.runTransaction(async (transaction) => {
    // Read current collection and video
    const collectionRef = db.collection('collections').doc(collectionId);
    const videoRef = db.collection('videos').doc(videoId);
    
    const [collectionDoc, videoDoc] = await Promise.all([
      transaction.get(collectionRef),
      transaction.get(videoRef)
    ]);

    if (!collectionDoc.exists || !videoDoc.exists) {
      throw new Error('Document not found');
    }

    // Update collection
    transaction.update(collectionRef, {
      videoCount: increment(1),
      videos: arrayUnion({
        videoId,
        addedAt: Timestamp.now(),
        title: videoDoc.data()?.title,
        thumbnailUrl: videoDoc.data()?.thumbnailUrl
      })
    });

    // Update video's collection count
    transaction.update(videoRef, {
      collectionCount: increment(1)
    });
  });
};
```

### 2. Batch Updates

We use batched writes for relationship modifications:

```typescript
const removeVideoFromCollections = async (
  videoId: string,
  collectionIds: string[]
) => {
  const batch = db.batch();

  // Update each collection
  collectionIds.forEach(collectionId => {
    const collectionRef = db
      .collection('collections')
      .doc(collectionId);

    batch.update(collectionRef, {
      videoCount: increment(-1),
      videos: arrayRemove(videoId)
    });
  });

  // Update video document
  const videoRef = db.collection('videos').doc(videoId);
  batch.update(videoRef, {
    collectionCount: increment(-collectionIds.length)
  });

  await batch.commit();
};
```

This documentation outlines our approach to managing relationships in Firestore while maintaining performance and data consistency.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*