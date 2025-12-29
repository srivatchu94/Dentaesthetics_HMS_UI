# Token Expiry Testing Guide

## Manual Testing Steps

### Prerequisite
- Application is running on `http://localhost:5173`
- You are logged in as a user
- Browser console is open (F12)

### Test Scenario 1: Detect Expired Token While on a Page

**Steps:**
1. Log in to the application
2. Navigate to any page (e.g., `/doctors`, `/patients`, etc.)
3. Wait for your token to naturally expire (or manually set an expired token for testing)
4. Click any button that triggers an API call (e.g., "Load Data", search, filter, etc.)

**Expected Result:**
- ✅ Console shows: "🔐 Token expiry detected, showing modal"
- ✅ TokenExpiryModal appears with:
  - Title: "Session Expired"
  - Red alert icon
  - Clear message about session expiration
  - "Log In Again" button
  - Close (×) button
- ✅ Modal has dark overlay (semi-transparent background)
- ✅ Modal is centered and properly styled

### Test Scenario 2: Login Redirect Flow

**Prerequisites:**
- TokenExpiryModal is visible from Test 1

**Steps:**
1. Click "Log In Again" button
2. Modal should close
3. Should be redirected to `/login` page
4. LoginModal should appear

**Expected Result:**
- ✅ Modal closes smoothly
- ✅ Redirected to login page
- ✅ LoginModal appears automatically
- ✅ URL shows `/login`

### Test Scenario 3: Session Restoration After Login

**Prerequisites:**
- At login page from Test 2
- Original page was `/doctors` (for example)

**Steps:**
1. Enter valid credentials
2. Click "Login" button
3. Wait for authentication to complete

**Expected Result:**
- ✅ Login successful
- ✅ **Automatically redirected to `/doctors`** (the page where token expired)
- ✅ NOT redirected to home page
- ✅ Session storage cleared: `sessionStorage.getItem('tokenExpiryLocation')` returns `null`

### Test Scenario 4: Close Button Functionality

**Prerequisites:**
- TokenExpiryModal is visible

**Steps:**
1. Click the close (×) button in the modal header
2. Try to refresh page or trigger another API call

**Expected Result:**
- ✅ Modal closes
- ✅ User can dismiss modal if they want to stay on current page
- ✅ Can still navigate or trigger another API call

### Test Scenario 5: Multiple Page Navigation

**Steps:**
1. Log in successfully
2. Navigate to `/doctors` page
3. Then navigate to `/patients` page
4. Trigger an API call that fails with 401
5. Modal appears

**Expected Result:**
- ✅ Stored location is `/patients` (current page)
- ✅ After login, redirected to `/patients`
- ✅ Not to `/doctors`

## Browser Console Debugging

### Check token expiry detection:
```javascript
// In browser console, look for these logs:
// When API call fails with 401:
"🚫 UNAUTHORIZED/FORBIDDEN - Check token or permissions"
"⚠️ Token is EXPIRED - Triggering token expiry modal"
"🔐 Token expiry detected, showing modal"
```

### Check session storage:
```javascript
// Check before login:
sessionStorage.getItem('tokenExpiryLocation')
// Should return something like "/doctors"

// Check after login:
sessionStorage.getItem('tokenExpiryLocation')
// Should return null
```

### Monitor token expiry emitter:
```javascript
// In browser console:
import { tokenExpiryEmitter } from './services/apiClient.js'
// Count listeners:
tokenExpiryEmitter.listeners.length
// Should be 1 (App.jsx subscribed to it)
```

## Visual Indicators

### During Token Expiry Detection
- **Console Log**: "🔐 Token expiry detected, showing modal"
- **Modal Appearance**: Smooth fade-in animation (0.3s)
- **Overlay**: Dark semi-transparent background (rgba with 0.5 opacity)

### Modal Styling Verification
- **Header**: Red/Orange gradient background
- **Icon**: Alert circle (SVG) in red
- **Close Button**: × symbol, hover effect on it
- **Action Button**: 
  - Green/Teal gradient
  - Icon + text "Log In Again"
  - Hover state darkens gradient
- **Blue Info Box**: Contains reassurance message about data safety

### Accessibility
- `role="dialog"` on modal div
- `aria-modal="true"` on modal div
- `aria-labelledby="token-expiry-title"` references the title
- `aria-describedby="token-expiry-description"` references the description
- Button has proper `aria-label`

## Performance Testing

### Check that modal doesn't cause performance issues:
```javascript
// Monitor Performance in DevTools
// Time from 401 response to modal visible: < 100ms
// Animation duration: 300ms (expected)
```

## Edge Cases to Test

### ✅ Test 1: Immediate API Call After Token Expires
1. Token expires
2. Immediately make multiple API calls
3. Modal should appear once, not multiple times

### ✅ Test 2: Browser Back Button
1. Get to login page via token expiry redirect
2. Click browser back button
3. Should not navigate away (page state preserved)

### ✅ Test 3: Multiple Tabs
1. Open app in two browser tabs
2. Token expires in Tab 1
3. Modal appears in Tab 1
4. Login in Tab 1
5. Tab 2 should not show duplicate modals

### ✅ Test 4: Form Data Preservation
1. Fill out a form (e.g., patient registration)
2. Token expires
3. Modal appears
4. Login again
5. Note: Form data cleared (expected behavior unless implemented with sessionStorage)

### ✅ Test 5: Invalid/Malformed Token
1. Manually set invalid token in localStorage
2. Make API call
3. Console should show: "❌ Could not decode JWT token"
4. 401 error still handled gracefully

## Success Criteria Checklist

- [ ] Modal appears when token expires (401 response)
- [ ] Modal has proper styling and layout
- [ ] Modal is accessible (ARIA attributes present)
- [ ] "Log In Again" button redirects to login
- [ ] User successfully logs in
- [ ] After login, user is redirected to previous page (not home)
- [ ] sessionStorage is cleared after restoration
- [ ] Close button works (optional dismiss)
- [ ] Works from any page in the application
- [ ] Animation is smooth (fade in/out)
- [ ] Console logs are informative
- [ ] No JavaScript errors in console
- [ ] No duplicate modals appear
- [ ] User can complete their task after restoration

## Troubleshooting Guide

### Problem: Modal not appearing
**Solution:**
1. Check browser console for errors
2. Verify `TokenExpiryProvider` wraps the app in main.jsx
3. Check if API call actually returns 401
4. Verify token is actually expired in JWT

### Problem: Redirecting to home instead of previous page
**Solution:**
1. Check sessionStorage: `sessionStorage.getItem('tokenExpiryLocation')`
2. Verify Login.jsx is checking for both route state and sessionStorage
3. Check if location path is valid
4. Ensure `handleLoginSuccess` is being called

### Problem: Modal visible but animations janky
**Solution:**
1. Check if Framer Motion is properly installed
2. Verify CSS animations aren't conflicting
3. Check for performance issues (slow device)

### Problem: Token expiry not being detected
**Solution:**
1. Verify JWT token structure (3 parts separated by dots)
2. Check if token expiration time is in the past
3. Ensure apiClient.ts has the token expiry detection code
4. Check if isExpired check is working: `decoded.exp < now`

## Automated Testing (Future)

### Suggested Test Cases (Cypress/Playwright)
```javascript
describe('Token Expiry Flow', () => {
  it('should show modal on 401 response', () => {
    // ...
  });

  it('should redirect to login', () => {
    // ...
  });

  it('should restore previous location after login', () => {
    // ...
  });

  it('should clear sessionStorage after restoration', () => {
    // ...
  });

  it('should not show multiple modals', () => {
    // ...
  });
});
```

## Performance Metrics

### Target Metrics
- **Modal render time**: < 50ms
- **Modal animation**: 300ms (smooth)
- **API error detection**: < 10ms
- **No memory leaks**: Unsubscribe from token expiry emitter on component unmount
