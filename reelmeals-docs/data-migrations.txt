# Database Migrations Documentation

## Overview

This document outlines our strategy for managing Firestore database migrations in ReelMeals. Given Firestore's schemaless nature, we implement a robust system to track and execute data structure changes while maintaining application stability.

## Migration System Architecture

### 1. Migration Registry

We track all migrations using a dedicated collection:

```typescript
interface Migration {
  id: string;               // Migration identifier
  version: number;          // Sequential version number
  description: string;      // What the migration does
  createdAt: Timestamp;     // When migration was created
  executedAt?: Timestamp;   // When migration was run
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;          // Error details if failed
  stats?: {
    documentsProcessed: number;
    documentsUpdated: number;
    errors: number;
  };
}

class MigrationRegistry {
  private readonly db: Firestore;
  private readonly collection = 'migrations';

  async registerMigration(migration: Omit<Migration, 'id'>): Promise<string> {
    const ref = this.db.collection(this.collection).doc();
    await ref.set({
      ...migration,
      id: ref.id,
      status: 'pending',
      createdAt: Timestamp.now()
    });
    return ref.id;
  }

  async updateMigrationStatus(
    id: string,
    status: Migration['status'],
    stats?: Migration['stats']
  ): Promise<void> {
    await this.db.collection(this.collection).doc(id).update({
      status,
      executedAt: Timestamp.now(),
      ...(stats && { stats })
    });
  }
}
```

### 2. Migration Manager

Handles the execution and tracking of migrations:

```typescript
class MigrationManager {
  private readonly registry: MigrationRegistry;
  private readonly batchSize = 500;
  private readonly parallelBatches = 3;

  constructor(registry: MigrationRegistry) {
    this.registry = registry;
  }

  async executeMigration(
    migrationId: string,
    migrationFn: (batch: WriteBatch) => Promise<void>
  ): Promise<void> {
    try {
      await this.registry.updateMigrationStatus(migrationId, 'running');

      const stats = {
        documentsProcessed: 0,
        documentsUpdated: 0,
        errors: 0
      };

      // Execute migration in batches
      await this.executeBatchedMigration(migrationFn, stats);

      await this.registry.updateMigrationStatus(
        migrationId,
        'completed',
        stats
      );
    } catch (error) {
      await this.registry.updateMigrationStatus(
        migrationId,
        'failed',
        { error: error.message }
      );
      throw error;
    }
  }

  private async executeBatchedMigration(
    migrationFn: (batch: WriteBatch) => Promise<void>,
    stats: Migration['stats']
  ): Promise<void> {
    // Implementation of batched execution
  }
}
```

## Migration Patterns

### 1. Schema Version Tracking

We track schema versions at both collection and document levels:

```typescript
interface SchemaVersion {
  collection: string;
  version: number;
  updatedAt: Timestamp;
}

interface VersionedDocument {
  _meta: {
    version: number;
    lastMigration: string;
    migratedAt: Timestamp;
  };
  // ... rest of document data
}

class SchemaVersionManager {
  private readonly versionsCollection = 'schemaVersions';

  async updateSchemaVersion(
    collection: string,
    version: number
  ): Promise<void> {
    await this.db
      .collection(this.versionsCollection)
      .doc(collection)
      .set({
        version,
        updatedAt: Timestamp.now()
      });
  }

  async getSchemaVersion(collection: string): Promise<number> {
    const doc = await this.db
      .collection(this.versionsCollection)
      .doc(collection)
      .get();
    return doc.exists ? doc.data()?.version : 0;
  }
}
```

### 2. Progressive Migrations

We implement migrations that can run progressively on large datasets:

```typescript
class ProgressiveMigration {
  private readonly checkpointCollection = 'migrationCheckpoints';

  async executeLargeMigration(
    migrationId: string,
    query: Query,
    transformFn: (doc: DocumentData) => DocumentData
  ): Promise<void> {
    let lastDocumentId = await this.getCheckpoint(migrationId);
    let hasMore = true;

    while (hasMore) {
      const batch = this.db.batch();
      let batchCount = 0;

      // Query next batch
      let batchQuery = query.orderBy('__name__').limit(this.batchSize);
      if (lastDocumentId) {
        const lastDoc = await this.db.doc(lastDocumentId).get();
        batchQuery = batchQuery.startAfter(lastDoc);
      }

      const snapshot = await batchQuery.get();

      // Process documents
      snapshot.forEach(doc => {
        const transformed = transformFn(doc.data());
        batch.update(doc.ref, transformed);
        lastDocumentId = doc.ref.path;
        batchCount++;
      });

      if (batchCount > 0) {
        await batch.commit();
        await this.saveCheckpoint(migrationId, lastDocumentId);
      }

      hasMore = batchCount === this.batchSize;
    }
  }

  private async getCheckpoint(
    migrationId: string
  ): Promise<string | null> {
    const doc = await this.db
      .collection(this.checkpointCollection)
      .doc(migrationId)
      .get();
    return doc.exists ? doc.data()?.lastDocumentId : null;
  }

  private async saveCheckpoint(
    migrationId: string,
    lastDocumentId: string
  ): Promise<void> {
    await this.db
      .collection(this.checkpointCollection)
      .doc(migrationId)
      .set({
        lastDocumentId,
        updatedAt: Timestamp.now()
      });
  }
}
```

### 3. Fallback Mechanisms

We implement fallback handling for partial migrations:

```typescript
class MigrationFallbackHandler {
  async handleMigrationFailure(
    migrationId: string,
    error: Error
  ): Promise<void> {
    // Log failure
    await this.logMigrationFailure(migrationId, error);

    // Attempt rollback if possible
    await this.attemptRollback(migrationId);

    // Update application state
    await this.updateApplicationState(migrationId);
  }

  private async attemptRollback(migrationId: string): Promise<void> {
    // Implementation of rollback logic
  }
}
```

## Migration Examples

### 1. Adding New Fields

```typescript
const addCookingTimeMigration = async () => {
  const migration: Migration = {
    version: 1,
    description: 'Add cookingTime field to recipes',
    status: 'pending',
    createdAt: Timestamp.now()
  };

  const migrationId = await registry.registerMigration(migration);

  await migrationManager.executeMigration(migrationId, async (batch) => {
    const recipes = await db.collection('recipes')
      .where('_meta.version', '<', 1)
      .limit(batchSize)
      .get();

    recipes.forEach(doc => {
      const data = doc.data();
      batch.update(doc.ref, {
        cookingTime: calculateCookingTime(data),
        '_meta.version': 1,
        '_meta.lastMigration': migrationId,
        '_meta.migratedAt': Timestamp.now()
      });
    });
  });
};
```

### 2. Restructuring Data

```typescript
const restructureUserPreferencesMigration = async () => {
  const migration: Migration = {
    version: 2,
    description: 'Restructure user preferences',
    status: 'pending',
    createdAt: Timestamp.now()
  };

  const migrationId = await registry.registerMigration(migration);

  await migrationManager.executeMigration(migrationId, async (batch) => {
    const users = await db.collection('users')
      .where('_meta.version', '<', 2)
      .limit(batchSize)
      .get();

    users.forEach(doc => {
      const data = doc.data();
      const newPreferences = restructurePreferences(data.preferences);
      
      batch.update(doc.ref, {
        preferences: newPreferences,
        '_meta.version': 2,
        '_meta.lastMigration': migrationId,
        '_meta.migratedAt': Timestamp.now()
      });
    });
  });
};
```

## Testing Migrations

We implement comprehensive testing for migrations:

```typescript
class MigrationTester {
  async testMigration(
    migrationFn: () => Promise<void>,
    testData: any[]
  ): Promise<TestResult> {
    // Set up test environment
    const testDb = await this.createTestDatabase();
    await this.seedTestData(testDb, testData);

    // Execute migration
    await migrationFn();

    // Verify results
    return await this.verifyMigrationResults(testDb);
  }

  private async verifyMigrationResults(
    testDb: Firestore
  ): Promise<TestResult> {
    // Implementation of verification logic
  }
}
```

This documentation outlines our comprehensive approach to managing Firestore migrations while maintaining data integrity and application stability.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*