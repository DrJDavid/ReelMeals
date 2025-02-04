# Deployment Procedures

## Introduction

This document outlines our deployment procedures for ReelMeals. We use a staged deployment approach with multiple environments to ensure reliability and minimize risks when pushing updates to production. Our application uses Firebase Hosting for static content and Cloud Functions for server-side functionality, while leveraging Next.js for the application framework.

## Environment Configuration

We maintain three distinct environments to support our deployment pipeline. Each environment has its own Firebase project and configuration:

### Development Environment
```typescript
// .env.development
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reelmeals-dev
NEXT_PUBLIC_API_URL=https://api-dev.reelmeals.app
NEXT_PUBLIC_STORAGE_BUCKET=reelmeals-dev.appspot.com
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Staging Environment
```typescript
// .env.staging
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reelmeals-staging
NEXT_PUBLIC_API_URL=https://api-staging.reelmeals.app
NEXT_PUBLIC_STORAGE_BUCKET=reelmeals-staging.appspot.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Production Environment
```typescript
// .env.production
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reelmeals-prod
NEXT_PUBLIC_API_URL=https://api.reelmeals.app
NEXT_PUBLIC_STORAGE_BUCKET=reelmeals-prod.appspot.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Build Configuration

Our build process is configured to optimize for production performance:

```javascript
// next.config.js
module.exports = {
  // Enable production source maps for better error tracking
  productionBrowserSourceMaps: true,
  
  // Configure image optimization
  images: {
    domains: [
      'storage.googleapis.com',
      'firebasestorage.googleapis.com'
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60
  },
  
  // Configure build output
  output: 'standalone',
  
  // Configure webpack for optimal bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add build-time optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /[\\/]node_modules[\\/]/,
            priority: 40,
            enforce: true
          },
          lib: {
            test(module) {
              return (
                module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true
          }
        }
      };
    }
    return config;
  }
};
```

## Deployment Scripts

We use custom deployment scripts to automate our deployment process:

```bash
#!/bin/bash
# deploy.sh

# Validate environment argument
ENV=$1
if [[ ! $ENV =~ ^(staging|production)$ ]]; then
  echo "Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

# Load environment variables
source .env.$ENV

# Build application
echo "Building for $ENV environment..."
npm run build

# Run pre-deployment tests
echo "Running pre-deployment tests..."
npm run test:e2e

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase use $NEXT_PUBLIC_FIREBASE_PROJECT_ID
firebase deploy --only hosting,functions

# Run post-deployment checks
echo "Running post-deployment checks..."
./scripts/post-deploy-checks.sh $ENV

# Notify team
./scripts/notify-deployment.sh $ENV
```

## Deployment Pipeline

Our deployment pipeline follows these steps:

### 1. Pre-deployment Checks

```typescript
// scripts/pre-deploy-checks.ts
async function runPreDeploymentChecks() {
  const checks = [
    checkDependencies(),
    validateEnvironmentVariables(),
    runSecurityChecks(),
    checkDatabaseMigrations()
  ];

  const results = await Promise.all(checks);
  return results.every(result => result.passed);
}

async function checkDependencies() {
  // Verify all dependencies are correctly installed
  const output = await exec('npm audit');
  return {
    passed: !output.includes('high') && !output.includes('critical'),
    details: output
  };
}

async function validateEnvironmentVariables() {
  // Verify all required environment variables are set
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_STORAGE_BUCKET'
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );

  return {
    passed: missingVars.length === 0,
    details: missingVars
  };
}
```

### 2. Build Process

```typescript
// scripts/build.ts
async function buildApplication() {
  try {
    // Clean previous build
    await exec('rm -rf .next out');

    // Install dependencies
    await exec('npm ci');

    // Run type checks
    await exec('tsc --noEmit');

    // Build application
    await exec('next build');

    // Run post-build optimizations
    await optimizeBuild();

    return true;
  } catch (error) {
    console.error('Build failed:', error);
    return false;
  }
}

async function optimizeBuild() {
  // Optimize images
  await exec('next-image-optimize');

  // Analyze bundle size
  await exec('next-bundle-analyzer');
}
```

### 3. Deployment Process

```typescript
// scripts/deploy.ts
async function deploy(environment: 'staging' | 'production') {
  try {
    // Switch Firebase project
    await exec(`firebase use ${environment}`);

    // Deploy hosting
    await exec('firebase deploy --only hosting');

    // Deploy functions
    await exec('firebase deploy --only functions');

    // Deploy Firestore rules
    await exec('firebase deploy --only firestore:rules');

    // Deploy Storage rules
    await exec('firebase deploy --only storage:rules');

    return true;
  } catch (error) {
    console.error('Deployment failed:', error);
    return false;
  }
}
```

### 4. Post-deployment Verification

```typescript
// scripts/verify-deployment.ts
async function verifyDeployment(environment: string) {
  const checks = [
    checkApplicationHealth(),
    checkDatabaseConnectivity(),
    checkStorageAccess(),
    checkAuthenticationFlow(),
    checkVideoPlayback()
  ];

  const results = await Promise.allSettled(checks);
  return results.every(result => result.status === 'fulfilled');
}

async function checkApplicationHealth() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
  return response.status === 200;
}

async function checkVideoPlayback() {
  // Verify video streaming functionality
  const testVideoId = 'test-video-id';
  const result = await testVideoStream(testVideoId);
  return result.success;
}
```

## Rollback Procedures

In case of deployment issues, we have automated rollback procedures:

```typescript
// scripts/rollback.ts
async function rollback(environment: string) {
  try {
    // Get previous successful deployment
    const previousDeployment = await getPreviousDeployment(environment);

    // Revert to previous version
    await exec(
      `firebase hosting:clone ${previousDeployment.version} ${environment}`
    );

    // Revert functions
    await exec(
      `firebase functions:rollback ${previousDeployment.functionsVersion}`
    );

    // Verify rollback
    const verified = await verifyDeployment(environment);
    if (!verified) {
      throw new Error('Rollback verification failed');
    }

    return true;
  } catch (error) {
    console.error('Rollback failed:', error);
    return false;
  }
}
```

## Monitoring and Alerts

We use Firebase Performance Monitoring to track deployment health:

```typescript
// src/config/monitoring.ts
import { getPerformance } from 'firebase/performance';

const performance = getPerformance(app);

// Configure custom traces
const deploymentTraces = {
  pageLoad: performance.trace('page_load'),
  videoLoad: performance.trace('video_load'),
  apiLatency: performance.trace('api_latency')
};

// Monitor deployment health
export const monitorDeployment = () => {
  deploymentTraces.pageLoad.start();
  
  // Set custom attributes
  deploymentTraces.pageLoad.putAttribute(
    'deployment_version',
    process.env.NEXT_PUBLIC_BUILD_ID
  );
  
  // Record metrics
  window.addEventListener('load', () => {
    deploymentTraces.pageLoad.stop();
  });
};
```

## Security Considerations

During deployment, we implement several security measures:

1. Validate all environment variables
2. Deploy updated security rules
3. Rotate service account keys
4. Update API keys if necessary
5. Verify CORS configurations

## Continuous Integration

Our CI pipeline automates many deployment tasks:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches:
      - main
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Firebase
        uses: firebase/firebase-tools-action@v1
        with:
          args: deploy --only hosting,functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Remember to follow these deployment procedures carefully and always verify each step before proceeding to the next. This ensures a smooth and reliable deployment process while maintaining application stability.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*