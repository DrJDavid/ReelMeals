Revisit Firebase Console Project:

- [ ] Go to Firebase Console project (https://console.firebase.google.com/)
- [ ] Verify correct ReelMeals project (dev project)

Enable Firebase Authentication (Real Service):

- [ ] Navigate to "Authentication" -> "Get started"
- [ ] Enable "Email/Password" sign-in method
- [ ] Enable "Google" sign-in method

Enable Firestore Database (Real Service):

- [ ] Navigate to "Firestore Database"
- [ ] Create Firestore database if not exists
- [ ] Choose "Start in production mode"
- [ ] Select appropriate database location

Enable Firebase Storage (Real Service):

- [ ] Navigate to "Storage"
- [ ] Enable Firebase Storage with default settings

Review Firebase Security Rules:
Firestore Rules:

- [ ] Navigate to "Firestore Database" -> "Rules"
- [ ] Review default security rules
- [ ] Update rules to require authentication for writes
- [ ] Allow public read access for videos

Storage Rules:

- [ ] Navigate to "Storage" -> "Rules"
- [ ] Review default Storage rules
- [ ] Implement basic security rules for testing

Update Firebase Config:

- [ ] Verify .env.local has correct Firebase project configuration
- [ ] Check NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] Check NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] Verify all other Firebase config variables

Final Steps:

- [ ] Stop Firebase emulators (firebase emulators:stop)
- [ ] Test connection to real Firebase services
