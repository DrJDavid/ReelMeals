Setup Firebase Auth:

- [ ] Verify Firebase Auth SDK is installed
- [ ] Check firebase package version is 9 or higher

Create Authentication Context:

- [ ] Create src/features/auth/AuthContext.tsx
- [ ] Implement AuthProvider component
- [ ] Add user state management
- [ ] Implement onAuthStateChanged listener
- [ ] Add signup function (email/password)
- [ ] Add login function (email/password)
- [ ] Add Google login function
- [ ] Add logout function
- [ ] Add user context value provider

Integrate Auth Provider:

- [ ] Wrap \_app.tsx with AuthProvider
- [ ] Test auth context is accessible in child components

Create Auth UI Components:

- [ ] Create src/app/auth/signup.tsx
  - [ ] Add email/password form
  - [ ] Add Google signup button
  - [ ] Implement form validation
  - [ ] Add error handling
  - [ ] Add loading states
- [ ] Create src/app/auth/login.tsx
  - [ ] Add email/password form
  - [ ] Add Google login button
  - [ ] Implement form validation
  - [ ] Add error handling
  - [ ] Add loading states

Implement Session Management:

- [ ] Test session persistence
- [ ] Verify user stays logged in after refresh
- [ ] Implement protected routes/components
- [ ] Add loading state for initial auth check

Testing:

- [ ] Test signup flow with email/password
- [ ] Test login flow with email/password
- [ ] Test Google authentication
- [ ] Test logout functionality
- [ ] Verify user appears in Firebase Console
- [ ] Test error handling
- [ ] Test form validation
- [ ] Test protected routes
