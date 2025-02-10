# Firebase Configuration and Environment Setup Checklist

## 🔥 Environment Files Setup

### .env.example Setup

- [x] Create/update `.env.example` with the following structure:

  ```env
  # Firebase Config (Client-Side) - Prefix with NEXT_PUBLIC_
  NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
  NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

  # API Keys
  GEMINI_API_KEY=YOUR_GEMINI_API_KEY

  # Firebase Service Account (Server-Side)
  FIREBASE_CLIENT_EMAIL=your_service_account_email
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...YOUR_PRIVATE_KEY_HERE...\n-----END PRIVATE KEY-----\n"
  FIREBASE_PRIVATE_KEY_ID=your_private_key_id
  FIREBASE_CLIENT_ID=your_client_id

  # Firebase Emulators Control
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

  # Optional API Keys
  # NEXT_PUBLIC_VIDEO_PROCESSING_API_KEY=your_video_processing_api_key
  # NEXT_PUBLIC_ANALYTICS_KEY=your_analytics_key
  ```

### .env.local Setup

- [x] Verify all variables from `.env.example` are present in `.env.local`
- [x] Ensure all Firebase config values match Firebase Console
- [x] Properly format `FIREBASE_PRIVATE_KEY` with escaped newlines
- [x] Set appropriate emulator flag value
- [x] Double-check all service account details match downloaded JSON

## 🛠️ Code Updates

### Firebase Initialization

- [x] Update `src/lib/firebase/initFirebase.ts`:
  - [x] Use `NEXT_PUBLIC_` prefixed environment variables
  - [x] Implement correct singleton pattern
  - [x] Update emulator connection logic
  - [x] Use named imports from Firebase packages
  - [x] Export required Firebase instances

### Code Cleanup

- [x] Remove `src/config/firebase.ts`
- [x] Update all imports to use `@/lib/firebase/initFirebase`
- [x] Fix any broken references

### Next.js Configuration

- [x] Update `next.config.js`:
  - [x] Remove `output: 'export'`
  - [x] Remove `distDir: "www"`
  - [x] Set `unoptimized: false` or remove

## 🧪 Testing Checklist

### Local Development

- [ ] Start Firebase emulators successfully
- [ ] Run development server without errors
- [ ] Access localhost:3000 without console errors

### Firebase Features

- [ ] Test user authentication
- [ ] Verify Firebase Emulator UI shows user creation
- [ ] Test basic Firebase operations:
  - [ ] Authentication flows
  - [ ] Firestore read/write
  - [ ] Storage operations

### Error Checking

- [ ] Monitor browser console for Firebase-related errors
- [ ] Verify environment variables are loading correctly
- [ ] Check for any TypeScript errors
- [ ] Validate service account connectivity

## 🚨 Common Issues to Watch For

1. Environment Variables

   - [x] Typos in variable names
   - [x] Missing NEXT*PUBLIC* prefixes
   - [x] Incorrectly formatted private key
   - [x] Missing or undefined variables

2. Firebase Configuration

   - [x] Incorrect initialization pattern
   - [x] Missing emulator configurations
   - [x] Wrong service account details

3. Code Migration
   - [x] Missed import updates
   - [x] Incorrect path references
   - [x] Outdated Firebase SDK usage

## 📝 Notes

- Keep service account JSON secure and never commit to repository
- Double-check all environment variables before deployment
- Test both emulator and production configurations
- Document any deviations from standard setup

## ✅ Final Verification

- [x] All environment variables properly set
- [x] Firebase initialization working correctly
- [ ] No console errors in development
- [ ] All Firebase features functional
- [x] Code cleanup completed
- [ ] Documentation updated if needed

---

**Important:** Do not proceed to next phase until all checklist items are complete and verified.
