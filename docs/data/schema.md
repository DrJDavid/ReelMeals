# Database Schema Documentation

## Overview

ReelMeals uses Firebase Firestore as its primary database, with Cloud Storage for media assets. This document outlines our database schema, collection structures, and indexing strategies.

## Collection Schemas

### Users Collection

```typescript
interface User {
  id: string;                    // Firestore Document ID
  uid: string;                   // Firebase Auth UID
  email: string;                 // User's email
  displayName: string;           // Display name
  photoURL?: string;            // Profile photo URL
  createdAt: Timestamp;         // Account creation date
  lastLogin: Timestamp;         // Last login timestamp
  preferences: {
    cuisineTypes: string[];     // Preferred cuisine types
    dietaryRestrictions: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    maxCookingTime?: number;    // Maximum cooking time in minutes
  };
  stats: {
    totalSaved: number;         // Total saved recipes
    completedRecipes: number;   // Recipes marked as cooked
    avgRating: number;          // Average rating given
  };
  settings: {
    notifications: boolean;     // Notification preferences
    language: string;          // Preferred language
    theme: 'light' | 'dark' | 'system';
  };
}

// Indexing strategy
// Single-field indexes:
// - email (ASC)
// - createdAt (DESC)
// - lastLogin (DESC)
// Composite indexes:
// - [cuisineTypes, skillLevel]
// - [lastLogin, totalSaved]
```

### Videos Collection

```typescript
interface Video {
  id: string;                   // Firestore Document ID
  title: string;                // Recipe title
  description: string;          // Recipe description
  uploaderId: string;           // Reference to users collection
  createdAt: Timestamp;         // Upload timestamp
  duration: number;             // Video duration in seconds
  metadata: {
    cuisine: string;            // Cuisine type
    difficulty: 'easy' | 'medium' | 'hard';
    prepTime: number;           // Preparation time in minutes
    cookingTime: number;        // Cooking time in minutes
    servings: number;           // Number of servings
    calories: number;           // Calories per serving
  };
  ingredients: {
    name: string;              // Ingredient name
    amount: number;            // Amount
    unit: string;              // Measurement unit
    notes?: string;            // Optional notes
  }[];
  steps: {
    order: number;             // Step order
    description: string;       // Step description
    timestamp: number;         // Video timestamp for step
    duration: number;          // Duration of step in seconds
  }[];
  assets: {
    videoUrl: string;          // Cloud Storage URL
    thumbnailUrl: string;      // Thumbnail image URL
    previewGif?: string;       // Preview GIF URL
  };
  engagement: {
    views: number;             // View count
    saves: number;             // Save count
    completions: number;       // Recipe completion count
    rating: number;            // Average rating
  };
  status: 'processing' | 'active' | 'disabled';
}

// Indexing strategy
// Single-field indexes:
// - createdAt (DESC)
// - cuisine (ASC)
// - difficulty (ASC)
// - views (DESC)
// Composite indexes:
// - [cuisine, difficulty, views]
// - [createdAt, engagement.rating]
```

### Collections Collection

```typescript
interface Collection {
  id: string;                   // Firestore Document ID
  userId: string;               // Reference to users collection
  name: string;                 // Collection name
  description?: string;         // Optional description
  createdAt: Timestamp;         // Creation timestamp
  updatedAt: Timestamp;         // Last update timestamp
  videos: {
    videoId: string;           // Reference to videos collection
    addedAt: Timestamp;        // When video was added
    notes?: string;            // Optional user notes
    order: number;             // Display order
  }[];
  isDefault: boolean;          // Whether this is a default collection
  privacy: 'private' | 'public' | 'shared';
  shareableLink?: string;      // Shareable link if public/shared
  collaborators?: string[];    // User IDs of collaborators
}

// Indexing strategy
// Single-field indexes:
// - userId (ASC)
// - createdAt (DESC)
// - updatedAt (DESC)
// Composite indexes:
// - [userId, updatedAt]
// - [privacy, createdAt]
```

### Interactions Collection

```typescript
interface Interaction {
  id: string;                   // Firestore Document ID
  userId: string;               // Reference to users collection
  videoId: string;              // Reference to videos collection
  type: 'view' | 'save' | 'complete' | 'rate';
  timestamp: Timestamp;         // Interaction timestamp
  data?: {
    rating?: number;           // Rating value if type is 'rate'
    watchDuration?: number;    // Watch duration if type is 'view'
    completionStatus?: 'success' | 'abandoned';
  };
  deviceInfo: {
    platform: string;          // Device platform
    os: string;                // Operating system
    browser: string;           // Browser information
  };
}

// Indexing strategy
// Single-field indexes:
// - userId (ASC)
// - videoId (ASC)
// - timestamp (DESC)
// Composite indexes:
// - [userId, type, timestamp]
// - [videoId, type, timestamp]
```

## Subcollections

### Comments Subcollection (on Videos)

```typescript
interface Comment {
  id: string;                   // Firestore Document ID
  userId: string;               // Reference to users collection
  content: string;              // Comment content
  createdAt: Timestamp;         // Creation timestamp
  editedAt?: Timestamp;         // Last edit timestamp
  likes: number;                // Like count
  replies: {
    userId: string;            // User who replied
    content: string;           // Reply content
    createdAt: Timestamp;      // Reply timestamp
  }[];
  timestamp?: number;          // Video timestamp if timestamp-specific
}

// Indexing strategy
// Single-field indexes:
// - createdAt (DESC)
// - likes (DESC)
```

## Security Rules

```typescript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User document rules
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Video document rules
    match /videos/{videoId} {
      allow read: if true;  // Public read access
      allow write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'creator';
    }

    // Collection document rules
    match /collections/{collectionId} {
      allow read: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
            || resource.data.privacy == 'public'
            || request.auth.uid in resource.data.collaborators);
      allow write: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
            || request.auth.uid in resource.data.collaborators);
    }
  }
}
```

## Data Validation

We implement comprehensive data validation using TypeScript and Firebase Functions:

```typescript
// Server-side validation functions
export function validateVideo(video: Video): ValidationResult {
  const errors: ValidationError[] = [];

  // Title validation
  if (!video.title || video.title.length < 3) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 3 characters long'
    });
  }

  // Duration validation
  if (video.duration <= 0) {
    errors.push({
      field: 'duration',
      message: 'Duration must be greater than 0'
    });
  }

  // Metadata validation
  if (!VALID_CUISINES.includes(video.metadata.cuisine)) {
    errors.push({
      field: 'metadata.cuisine',
      message: 'Invalid cuisine type'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Migration Strategies

For schema updates and data migrations, we follow these patterns:

```typescript
interface MigrationJob {
  id: string;
  version: number;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Timestamp;
  endTime?: Timestamp;
  progress: number;
  error?: string;
}

class DataMigrator {
  async migrate(version: number): Promise<void> {
    const job = await this.createMigrationJob(version);
    
    try {
      await this.executeMigration(job);
      await this.updateMigrationStatus(job.id, 'completed');
    } catch (error) {
      await this.handleMigrationError(job.id, error);
      throw error;
    }
  }

  private async executeMigration(job: MigrationJob): Promise<void> {
    // Implementation specific to migration version
  }
}
```

This schema documentation provides a comprehensive overview of our database structure, ensuring consistency and maintainability across the application.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*