Create Collection Components:

- [ ] Create src/components/collections/CollectionList.tsx
  - [ ] Add basic list structure
  - [ ] Style collection items
  - [ ] Add loading state
  - [ ] Handle empty state
  - [ ] Add error state

Implement Collection Data Fetching:

- [ ] Create src/hooks/useUserCollections.tsx
  - [ ] Import Firestore functions
  - [ ] Add userId parameter
  - [ ] Implement Firestore query
  - [ ] Add error handling
  - [ ] Add loading state
  - [ ] Add type safety

Create Collections Page:

- [ ] Create src/app/collections/page.tsx
  - [ ] Import useUserCollections hook
  - [ ] Import CollectionList component
  - [ ] Add page layout
  - [ ] Handle loading state
  - [ ] Handle error state
  - [ ] Add empty state message

Collection Item Features:

- [ ] Display collection name
- [ ] Show video count
- [ ] Add thumbnail preview
- [ ] Add last updated date
- [ ] Add edit/delete options

Testing:

- [ ] Test collections page loads
- [ ] Verify collections display correctly
- [ ] Test with multiple collections
- [ ] Check loading states
- [ ] Verify error handling
- [ ] Test empty state
- [ ] Check responsive design
- [ ] Verify data accuracy with Firestore
