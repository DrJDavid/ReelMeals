UI Implementation:

- [ ] Update SwipeCard component
  - [ ] Add "Save to Collection" button/icon
  - [ ] Add loading state
  - [ ] Add success/error feedback
  - [ ] Style save button/icon
  - [ ] Add hover states

Implement Save Functionality:

- [ ] Create src/lib/firebase/firestore-service.ts
- [ ] Implement saveVideoToCollection function
  - [ ] Add userId parameter
  - [ ] Add videoId parameter
  - [ ] Add collectionName parameter
  - [ ] Handle default "Saved Recipes" collection
  - [ ] Use arrayUnion for adding videoId
  - [ ] Add error handling
  - [ ] Add success callback

Collection Management:

- [ ] Create getUserCollection function
  - [ ] Check if collection exists
  - [ ] Create default collection if needed
  - [ ] Return collection reference

Integration:

- [ ] Connect save button to saveVideoToCollection
- [ ] Get userId from AuthContext
- [ ] Pass videoId from current video
- [ ] Handle loading state
- [ ] Show success/error feedback
- [ ] Update UI after successful save

Testing:

- [ ] Test saving video to new collection
- [ ] Test saving video to existing collection
- [ ] Verify videoId added to collection in Firestore
- [ ] Test duplicate video handling
- [ ] Test error scenarios
- [ ] Verify UI feedback works
- [ ] Test with different user accounts
- [ ] Verify data consistency in Firebase Console
