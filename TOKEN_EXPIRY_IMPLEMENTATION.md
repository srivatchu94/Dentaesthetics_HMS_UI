# Token Expiry Handling Implementation

## Overview
This document describes the token expiry handling feature that provides a user-friendly way to manage authentication timeouts.

## Features
✅ Automatic token expiry detection (401 HTTP responses)
✅ User-friendly popup modal explaining the session expiration
✅ Secure login redirect
✅ Session restoration - user returns to their previous location after login
✅ Clear communication in simple, understandable language

## Architecture

### 1. **TokenExpiryContext** (`src/context/TokenExpiryContext.tsx`)
Global context provider for managing token expiry state:
- `showTokenExpiryModal`: Boolean flag to show/hide the modal
- `setShowTokenExpiryModal`: Function to update modal visibility
- `previousLocation`: Stores the location where token expired
- `setPreviousLocation`: Updates the previous location

### 2. **TokenExpiryModal** (`src/components/TokenExpiryModal.jsx`)
User-facing modal component:
- Displays when token expires
- Shows user-friendly message explaining the timeout
- Provides "Log In Again" button
- Accessible design with proper ARIA attributes
- Close button for dismissing (optional)

### 3. **API Client Enhancement** (`src/services/apiClient.ts`)
Detects 401 responses and triggers token expiry flow:
- **tokenExpiryEmitter**: Event emitter for communicating token expiry to React components
- Decodes JWT to check expiration time
- Stores current location in sessionStorage for restoration
- Triggers modal via event emitter

### 4. **App Component Updates** (`src/App.jsx`)
- Subscribes to token expiry events
- Manages modal visibility state
- Handles login redirect with return location
- Displays TokenExpiryModal component

### 5. **Login Page Enhancement** (`src/pages/Login.jsx`)
- Checks for return location in route state
- Falls back to sessionStorage for stored location
- Navigates to return location after successful login
- Clears stored location after use

## How It Works

### Flow Diagram
```
1. User makes API request → Token is expired (401 response)
   ↓
2. apiClient.ts detects 401 response
   ↓
3. JWT decoded to verify token is actually expired
   ↓
4. Current location stored in sessionStorage
   ↓
5. tokenExpiryEmitter.emit() called with location
   ↓
6. App.jsx receives event and shows TokenExpiryModal
   ↓
7. User clicks "Log In Again"
   ↓
8. Navigate to /login with returnTo location
   ↓
9. User logs in via LoginModal
   ↓
10. Login successful → handleLoginSuccess called
    ↓
11. User redirected to previous location (restored)
```

### Step-by-Step Details

**Step 1: API Call Fails with 401**
```typescript
// In apiClient.ts request() function
if (res.status === 401 || res.status === 403) {
  // JWT decoding and expiry check happens here
  if (isExpired) {
    const currentLocation = window.location.pathname;
    sessionStorage.setItem('tokenExpiryLocation', currentLocation);
    tokenExpiryEmitter.emit(currentLocation);
  }
}
```

**Step 2: Modal Appears**
```jsx
// In App.jsx useEffect
const unsubscribe = tokenExpiryEmitter.subscribe((location) => {
  setShowTokenExpiryModal(true);
});
```

**Step 3: Login Redirect**
```jsx
// In App.jsx handleLoginRedirect
const handleLoginRedirect = () => {
  setShowTokenExpiryModal(false);
  navigate('/login', { 
    state: { returnTo: sessionStorage.getItem('tokenExpiryLocation') || '/' } 
  });
};
```

**Step 4: Return After Login**
```jsx
// In Login.jsx handleLoginSuccess
const handleLoginSuccess = () => {
  const returnTo = location.state?.returnTo || sessionStorage.getItem('tokenExpiryLocation') || '/';
  sessionStorage.removeItem('tokenExpiryLocation');
  navigate(returnTo);
};
```

## Files Modified/Created

| File | Type | Change |
|------|------|--------|
| `src/context/TokenExpiryContext.tsx` | Created | Context provider for token expiry state |
| `src/components/TokenExpiryModal.jsx` | Created | User-facing modal component |
| `src/services/apiClient.ts` | Modified | Added token expiry detection and event emitter |
| `src/App.jsx` | Modified | Added modal subscription and display logic |
| `src/pages/Login.jsx` | Modified | Added location restoration after login |
| `src/main.jsx` | Modified | Wrapped app with TokenExpiryProvider |

## UI/UX Design

### TokenExpiryModal
- **Title**: "Session Expired"
- **Icon**: Alert circle (red)
- **Message**: "Your login session has expired due to inactivity or your session timed out. For security purposes, you need to log in again to continue working."
- **Reassurance**: "Good news: Your data is safe and you'll be returned to where you left off after logging in."
- **Action Button**: "Log In Again" (green gradient, with icon)
- **Close Option**: × button in header

### Colors & Styling
- Header: Red/Orange gradient background
- Modal: White background with shadow
- Button: Teal gradient (consistent with app theme)
- Accessibility: ARIA attributes, proper role and descriptions

## Error Handling

The implementation gracefully handles:
- **Invalid JWT**: Catches JSON parse errors and logs them
- **No token stored**: Only processes 401 if token exists
- **Missing location**: Falls back to '/' (home page) if no location stored
- **Session storage cleared**: Falls back to route state location

## Security Considerations

✅ Uses HttpOnly cookies for token storage (handled by backend)
✅ Clears sessionStorage after restoration
✅ Validates token expiry via JWT decode
✅ Stores location only in sessionStorage (not localStorage)
✅ Provides clear communication about the need to re-authenticate

## Testing Checklist

- [ ] Token expires while user is on a page
- [ ] Modal appears with proper styling
- [ ] User can click "Log In Again"
- [ ] Login page appears
- [ ] User successfully logs in
- [ ] Redirected back to previous location
- [ ] User can continue work seamlessly
- [ ] Close button works (optional dismiss)
- [ ] Works from any page in the application
- [ ] Multiple tabs handle token expiry correctly
- [ ] Form data/state is preserved (if applicable)

## Future Enhancements

- [ ] Add retry button to automatically retry the failed request after re-login
- [ ] Store form data in sessionStorage to restore form state
- [ ] Add countdown timer showing when session will expire (proactive warning)
- [ ] Implement token refresh with sliding window expiry
- [ ] Sync token expiry across multiple browser tabs
- [ ] Add analytics to track how often tokens expire

## Troubleshooting

**Modal not appearing?**
- Ensure TokenExpiryProvider wraps the app in main.jsx
- Check browser console for token expiry emit logs
- Verify API call actually returns 401

**Not redirecting to login?**
- Check if `/login` route exists in App.jsx
- Verify navigate() is working properly
- Check browser console for routing errors

**Not returning to previous location?**
- Verify sessionStorage contains 'tokenExpiryLocation'
- Check if location path is valid
- Ensure handleLoginSuccess is called after login

**Modal styling issues?**
- Verify Tailwind CSS is properly configured
- Check if Framer Motion is installed
- Check browser dev tools for CSS conflicts
