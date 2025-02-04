# Development Environment Setup

## Prerequisites

```bash
# Required versions
Node.js >= 18.0.0
npm >= 9.0.0
Firebase CLI >= 12.0.0
```

## Initial Setup

```bash
# Install global dependencies
npm install -g firebase-tools

# Clone repository
git clone https://github.com/reelmeals/reelmeals-app.git
cd reelmeals-app

# Install project dependencies
npm install
```

## Firebase Configuration

```typescript
// src/config/firebase.ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
```

## Environment Setup

Create `.env.local`:

```bash
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Keys
NEXT_PUBLIC_VIDEO_PROCESSING_API_KEY=your_api_key
NEXT_PUBLIC_ANALYTICS_KEY=your_analytics_key

# Feature Flags
NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

## Firebase Emulator Setup

```bash
# Install and configure emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

Configure emulator connection:

```typescript
// src/config/firebase.ts
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## Development Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "emulators": "firebase emulators:start",
    "dev:emulator": "concurrently \"npm run dev\" \"npm run emulators\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "cypress": "cypress open",
    "cypress:headless": "cypress run"
  }
}
```

## VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Git Configuration

Create `.gitignore`:

```bash
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/

# Environment
.env*.local
.env.development
.env.test
.env.production

# Firebase
.firebase/
*-debug.log

# IDE
.vscode/*
!.vscode/settings.json
.idea

# OS
.DS_Store
*.pem
```

## Testing Setup

Configure Jest in `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1'
  },
  testEnvironment: 'jest-environment-jsdom'
};

module.exports = createJestConfig(customJestConfig);
```

## Development Tools

Install recommended VS Code extensions:

- ESLint
- Prettier
- Firebase Explorer
- Jest Runner
- GitLens
- Tailwind CSS IntelliSense

## Local Development Workflow

1. Start development server:
```bash
npm run dev:emulator
```

2. Access development environment:
- Web app: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000
- Firestore Emulator: http://localhost:8080
- Auth Emulator: http://localhost:9099
- Storage Emulator: http://localhost:9199

## Troubleshooting

Common issues and solutions:

```bash
# Reset emulators
firebase emulators:stop
rm -rf .firebase/emulators

# Clear Next.js cache
rm -rf .next
npm run dev

# Reset Firebase cache
firebase logout
firebase login
```

## Performance Monitoring

Enable Firebase Performance Monitoring:

```typescript
// src/config/firebase.ts
import { getPerformance } from 'firebase/performance';

const performance = getPerformance(app);
export { performance };
```

## Security Best Practices

1. Use environment variables for sensitive data
2. Enable Firebase Security Rules
3. Implement proper authentication checks
4. Use TypeScript for type safety
5. Regular dependency updates

## Development Guidelines

1. Follow Git branch naming convention:
```
feature/feature-name
bugfix/bug-description
hotfix/issue-description
```

2. Commit message format:
```
type(scope): description

[optional body]
[optional footer]
```

3. Run tests before committing:
```bash
npm run test
npm run cypress:headless
```

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*