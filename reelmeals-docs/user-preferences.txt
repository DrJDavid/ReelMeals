# User Preferences System Documentation

## Overview

The User Preferences System manages personalization settings and user-specific configurations in ReelMeals. This system ensures a customized experience by handling preferences like cuisine types, dietary restrictions, cooking skill levels, and interface settings.

## Core Architecture

### 1. Preference Data Model

```typescript
interface UserPreferences {
  // Cooking Preferences
  cooking: {
    cuisineTypes: string[];
    dietaryRestrictions: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    maxCookingTime: number; // in minutes
    servingSizes: number;
    preferredMeasurementSystem: 'metric' | 'imperial';
  };

  // Content Preferences
  content: {
    autoplay: boolean;
    videoQuality: 'auto' | 'low' | 'medium' | 'high';
    captionsEnabled: boolean;
    language: string;
    contentFilters: string[];
  };

  // Interface Preferences
  interface: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    reduceMotion: boolean;
    notificationsEnabled: boolean;
  };

  // Learning Preferences
  learning: {
    difficulty: 'easy' | 'medium' | 'hard';
    recipeComplexity: number;
    ingredientFamiliarity: 'basic' | 'intermediate' | 'advanced';
    techniqueComfort: string[];
  };
}

interface PreferenceMetadata {
  lastUpdated: Timestamp;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}
```

### 2. Preferences Manager

The core class managing preference operations:

```typescript
class PreferencesManager {
  private readonly storage: Storage;
  private readonly firestore: Firestore;
  private readonly userId: string;
  private cachedPreferences: UserPreferences | null = null;

  constructor(storage: Storage, firestore: Firestore, userId: string) {
    this.storage = storage;
    this.firestore = firestore;
    this.userId = userId;
  }

  async getPreferences(): Promise<UserPreferences> {
    if (this.cachedPreferences) {
      return this.cachedPreferences;
    }

    // Try local storage first
    const localPrefs = await this.storage.get('userPreferences');
    if (localPrefs) {
      this.cachedPreferences = localPrefs;
      return localPrefs;
    }

    // Fall back to remote preferences
    const remotePrefs = await this.fetchRemotePreferences();
    if (remotePrefs) {
      await this.storage.set('userPreferences', remotePrefs);
      this.cachedPreferences = remotePrefs;
      return remotePrefs;
    }

    // Return defaults if nothing exists
    return this.getDefaultPreferences();
  }

  async updatePreferences(
    updates: Partial<UserPreferences>
  ): Promise<void> {
    const current = await this.getPreferences();
    const updated = this.mergePreferences(current, updates);

    // Update local storage
    await this.storage.set('userPreferences', updated);
    this.cachedPreferences = updated;

    // Queue remote update
    await this.queuePreferenceSync(updated);
  }

  private mergePreferences(
    current: UserPreferences,
    updates: Partial<UserPreferences>
  ): UserPreferences {
    return deepMerge(current, updates);
  }

  private async queuePreferenceSync(
    preferences: UserPreferences
  ): Promise<void> {
    await this.syncQueue.add({
      type: 'preferences',
      action: 'update',
      data: preferences,
      timestamp: Date.now()
    });
  }
}
```

### 3. Preference Validation

We implement strict validation for preferences:

```typescript
class PreferenceValidator {
  private readonly schema: Record<string, ValidationRule>;

  validate(preferences: Partial<UserPreferences>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [key, value] of Object.entries(preferences)) {
      const rule = this.schema[key];
      if (rule && !rule.validate(value)) {
        errors.push({
          field: key,
          message: rule.message,
          value
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private readonly schema = {
    'cooking.skillLevel': {
      validate: (value: any) => 
        ['beginner', 'intermediate', 'advanced'].includes(value),
      message: 'Invalid skill level'
    },
    'cooking.maxCookingTime': {
      validate: (value: any) => 
        typeof value === 'number' && value >= 0 && value <= 360,
      message: 'Cooking time must be between 0 and 360 minutes'
    }
    // Additional validation rules...
  };
}
```

### 4. Preference Sync System

Handles synchronization between local and remote preferences:

```typescript
class PreferenceSyncManager {
  private readonly conflictResolver: ConflictResolver;
  private readonly storage: Storage;
  private readonly api: PreferenceAPI;

  async sync(): Promise<void> {
    const localPrefs = await this.storage.get('userPreferences');
    const remotePrefs = await this.api.fetchPreferences();

    if (this.needsSync(localPrefs, remotePrefs)) {
      const resolved = await this.resolveConflicts(localPrefs, remotePrefs);
      await this.applyResolution(resolved);
    }
  }

  private needsSync(
    local: UserPreferences,
    remote: UserPreferences
  ): boolean {
    return local.version !== remote.version;
  }

  private async resolveConflicts(
    local: UserPreferences,
    remote: UserPreferences
  ): Promise<UserPreferences> {
    return this.conflictResolver.resolve(local, remote);
  }

  private async applyResolution(
    resolved: UserPreferences
  ): Promise<void> {
    // Update local storage
    await this.storage.set('userPreferences', resolved);

    // Update remote storage
    await this.api.updatePreferences(resolved);

    // Notify system of changes
    this.notifyPreferenceChange(resolved);
  }
}
```

### 5. Preference-based Personalization

System for applying preferences to content discovery:

```typescript
class PersonalizationEngine {
  private readonly preferences: PreferencesManager;
  private readonly contentFilter: ContentFilter;

  async personalizeContent(
    content: VideoResource[]
  ): Promise<VideoResource[]> {
    const prefs = await this.preferences.getPreferences();
    
    return content
      .filter(video => this.matchesCuisinePreferences(video, prefs))
      .filter(video => this.matchesDietaryRestrictions(video, prefs))
      .filter(video => this.matchesSkillLevel(video, prefs))
      .sort((a, b) => this.calculateRelevanceScore(b, prefs) - 
                      this.calculateRelevanceScore(a, prefs));
  }

  private calculateRelevanceScore(
    video: VideoResource,
    prefs: UserPreferences
  ): number {
    let score = 0;

    // Calculate based on cuisine match
    score += this.calculateCuisineScore(video, prefs);

    // Adjust for skill level match
    score += this.calculateSkillScore(video, prefs);

    // Consider cooking time preference
    score += this.calculateTimeScore(video, prefs);

    return score;
  }
}
```

### 6. Settings UI Components

React components for preference management:

```typescript
interface PreferencesSectionProps {
  title: string;
  description: string;
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  title,
  description,
  preferences,
  onUpdate
}) => {
  return (
    <section className="preferences-section">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-gray-600">{description}</p>

      <div className="preferences-grid">
        {/* Preference controls */}
        <PreferenceControls
          preferences={preferences}
          onUpdate={onUpdate}
        />
      </div>
    </section>
  );
};

const PreferenceControls: React.FC<PreferenceControlsProps> = ({
  preferences,
  onUpdate
}) => {
  const handleChange = async (key: string, value: any) => {
    await onUpdate({ [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Cuisine Preferences */}
      <MultiSelect
        label="Cuisine Types"
        value={preferences.cooking.cuisineTypes}
        options={CUISINE_OPTIONS}
        onChange={value => handleChange('cooking.cuisineTypes', value)}
      />

      {/* Dietary Restrictions */}
      <MultiSelect
        label="Dietary Restrictions"
        value={preferences.cooking.dietaryRestrictions}
        options={DIETARY_OPTIONS}
        onChange={value => 
          handleChange('cooking.dietaryRestrictions', value)}
      />

      {/* Skill Level */}
      <Select
        label="Skill Level"
        value={preferences.cooking.skillLevel}
        options={SKILL_LEVELS}
        onChange={value => handleChange('cooking.skillLevel', value)}
      />
    </div>
  );
};
```

## Performance Optimization

We implement several optimizations for preference handling:

```typescript
class PreferenceOptimizer {
  private readonly cache: LRUCache<string, any>;

  constructor() {
    this.cache = new LRUCache({
      max: 100,
      maxAge: 1000 * 60 * 5 // 5 minutes
    });
  }

  async optimizePreferenceAccess(): Promise<void> {
    // Implement caching strategy
    await this.cacheFrequentPreferences();

    // Optimize storage
    await this.optimizeStorage();

    // Batch updates
    await this.batchPendingUpdates();
  }
}
```

## Error Handling

Comprehensive error handling for preference operations:

```typescript
class PreferenceErrorHandler {
  handle(error: Error): void {
    if (error instanceof ValidationError) {
      this.handleValidationError(error);
    } else if (error instanceof SyncError) {
      this.handleSyncError(error);
    } else if (error instanceof StorageError) {
      this.handleStorageError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private handleValidationError(error: ValidationError): void {
    // Show validation feedback
    // Reset invalid values
    // Suggest corrections
  }

  private handleSyncError(error: SyncError): void {
    // Queue for retry
    // Use local preferences
    // Show sync status
  }
}
```

This comprehensive preference system ensures a personalized, consistent experience across devices while maintaining high performance and reliability.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*