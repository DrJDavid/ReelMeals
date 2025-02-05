Define Data Models:

- [ ] Create/update src/lib/firebase/firestore-schema.ts
- [ ] Define Video interface

  - [ ] Add videoUrl field
  - [ ] Add title field
  - [ ] Add description field
  - [ ] Add cuisine field
  - [ ] Add cookingTime field
  - [ ] Add difficulty field
  - [ ] Add thumbnailUrl field
  - [ ] Add uploadedByUserId field
  - [ ] Add timestamps (createdAt, updatedAt)

- [ ] Define Collection interface
  - [ ] Add userId field
  - [ ] Add name field
  - [ ] Add description field
  - [ ] Add videoIds array
  - [ ] Add timestamps (createdAt, updatedAt)

Seed Initial Data:

- [ ] Access Firestore Database in Firebase Console
- [ ] Create 'videos' collection
- [ ] Add sample video documents (minimum 5-10)
  - [ ] Add all required fields
  - [ ] Use real video URLs or Firebase Storage URLs
  - [ ] Add varied cuisines and difficulties
  - [ ] Add realistic cooking times
  - [ ] Add appropriate tags

Update Video Feed:

- [ ] Modify src/hooks/useVideoFeed.ts
  - [ ] Import Firestore functions (collection, query, getDocs)
  - [ ] Replace static TEST_VIDEOS with Firestore query
  - [ ] Implement error handling
  - [ ] Add loading state
  - [ ] Map Firestore documents to VideoCard interface

Testing:

- [ ] Verify data model matches PRD v3.0
- [ ] Test Firestore read operations
- [ ] Verify video feed displays Firestore data
- [ ] Check data types and formatting
- [ ] Test error scenarios
- [ ] Verify loading states work correctly
