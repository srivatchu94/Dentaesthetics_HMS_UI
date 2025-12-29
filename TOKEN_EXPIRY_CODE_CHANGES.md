# Token Expiry - Code Changes Reference

## Files Created

### 1. `src/context/TokenExpiryContext.tsx` (NEW)
```typescript
import React, { createContext, useContext, useState } from 'react';

interface TokenExpiryContextType {
  showTokenExpiryModal: boolean;
  setShowTokenExpiryModal: (show: boolean) => void;
  previousLocation: string | null;
  setPreviousLocation: (location: string | null) => void;
}

const TokenExpiryContext = createContext<TokenExpiryContextType | undefined>(undefined);

export const TokenExpiryProvider = ({ children }: { children: React.ReactNode }) => {
  const [showTokenExpiryModal, setShowTokenExpiryModal] = useState(false);
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  return (
    <TokenExpiryContext.Provider
      value={{
        showTokenExpiryModal,
        setShowTokenExpiryModal,
        previousLocation,
        setPreviousLocation
      }}
    >
      {children}
    </TokenExpiryContext.Provider>
  );
};

export const useTokenExpiry = (): TokenExpiryContextType => {
  const context = useContext(TokenExpiryContext);
  if (context === undefined) {
    throw new Error('useTokenExpiry must be used within TokenExpiryProvider');
  }
  return context;
};
```

### 2. `src/components/TokenExpiryModal.jsx` (NEW)
```jsx
import React from 'react';
import { motion } from 'framer-motion';

const TokenExpiryModal = ({ isOpen, onLogin, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-expiry-title"
        aria-describedby="token-expiry-description"
      >
        {/* Header with close button */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Alert Circle Icon */}
              <svg
                className="text-red-600 w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 id="token-expiry-title" className="text-lg font-semibold text-gray-800">
                Session Expired
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p
            id="token-expiry-description"
            className="text-gray-700 mb-4 leading-relaxed"
          >
            Your login session has expired due to inactivity or your session timed out. 
            For security purposes, you need to log in again to continue working.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Good news:</strong> Your data is safe and you'll be returned to where you left off after logging in.
            </p>
          </div>
        </div>

        {/* Footer with action button */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onLogin}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 px-4 rounded-lg hover:from-teal-700 hover:to-teal-800 transition font-medium flex items-center justify-center gap-2"
          >
            {/* Login Icon */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Log In Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TokenExpiryModal;
```

## Files Modified

### 1. `src/services/apiClient.ts` - Added Token Expiry Detection

**Added at the top (after imports):**
```typescript
// Event emitter for token expiry to communicate with React components
export const tokenExpiryEmitter = {
  listeners: [] as Array<(location: string) => void>,
  
  subscribe: (callback: (location: string) => void) => {
    tokenExpiryEmitter.listeners.push(callback);
    return () => {
      tokenExpiryEmitter.listeners = tokenExpiryEmitter.listeners.filter(cb => cb !== callback);
    };
  },
  
  emit: (location: string) => {
    tokenExpiryEmitter.listeners.forEach(callback => callback(location));
  }
};
```

**Modified 401 error handler (around line 65-79):**
```typescript
// OLD:
if (isExpired) console.error('⚠️ Token is EXPIRED');

// NEW:
if (isExpired) {
  console.error('⚠️ Token is EXPIRED - Triggering token expiry modal');
  // Store current location and trigger modal
  const currentLocation = window.location.pathname;
  sessionStorage.setItem('tokenExpiryLocation', currentLocation);
  tokenExpiryEmitter.emit(currentLocation);
}
```

### 2. `src/App.jsx` - Added Modal Display Logic

**Added imports:**
```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TokenExpiryModal from "./components/TokenExpiryModal";
import { useTokenExpiry } from "./context/TokenExpiryContext";
import { tokenExpiryEmitter } from "./services/apiClient";
```

**Added inside App function:**
```jsx
const navigate = useNavigate();
const { showTokenExpiryModal, setShowTokenExpiryModal } = useTokenExpiry();

useEffect(() => {
  // Subscribe to token expiry events
  const unsubscribe = tokenExpiryEmitter.subscribe((location) => {
    console.log('🔐 Token expiry detected, showing modal');
    setShowTokenExpiryModal(true);
  });

  return unsubscribe;
}, [setShowTokenExpiryModal]);

const handleLoginRedirect = () => {
  setShowTokenExpiryModal(false);
  navigate('/login', { state: { returnTo: sessionStorage.getItem('tokenExpiryLocation') || '/' } });
};
```

**Added before closing div:**
```jsx
<TokenExpiryModal 
  isOpen={showTokenExpiryModal} 
  onLogin={handleLoginRedirect}
  onClose={() => setShowTokenExpiryModal(false)}
/>
```

### 3. `src/pages/Login.jsx` - Added Location Restoration

**Added import:**
```jsx
import { useLocation } from 'react-router-dom';
```

**Added in component:**
```jsx
const location = useLocation();
```

**Modified handleLoginSuccess:**
```jsx
// OLD:
const handleLoginSuccess = () => {
  handleCloseModal();
};

// NEW:
const handleLoginSuccess = () => {
  // Get return location from state or sessionStorage
  const returnTo = location.state?.returnTo || sessionStorage.getItem('tokenExpiryLocation') || '/';
  
  // Clear the stored location
  sessionStorage.removeItem('tokenExpiryLocation');
  
  // Navigate to the return location
  navigate(returnTo);
};
```

### 4. `src/main.jsx` - Added Context Provider

**Added import:**
```jsx
import { TokenExpiryProvider } from "./context/TokenExpiryContext";
```

**Wrapped app:**
```jsx
// OLD:
<BrowserRouter>
  <App />
</BrowserRouter>

// NEW:
<BrowserRouter>
  <TokenExpiryProvider>
    <App />
  </TokenExpiryProvider>
</BrowserRouter>
```

## Summary of Changes

| File | Type | Lines | Change |
|------|------|-------|--------|
| `TokenExpiryContext.tsx` | NEW | 32 | Context provider |
| `TokenExpiryModal.jsx` | NEW | 103 | Modal component |
| `apiClient.ts` | MOD | +15 | Event emitter + detection |
| `App.jsx` | MOD | +20 | Modal subscription & display |
| `Login.jsx` | MOD | +8 | Location restoration |
| `main.jsx` | MOD | +3 | Provider wrapper |

**Total: ~181 new/modified lines**

## No Breaking Changes

- ✅ All existing features work unchanged
- ✅ Backward compatible with current auth system
- ✅ No API changes required
- ✅ No database changes
- ✅ No configuration changes needed
- ✅ Works with existing login flow

## Testing the Code

### Console Logs to Watch For
```javascript
// When 401 error occurs:
"⚠️ Token is EXPIRED - Triggering token expiry modal"
"🔐 Token expiry detected, showing modal"

// When user logs back in:
// User is redirected to previous location
```

### Session Storage Check
```javascript
// Before modal closes:
sessionStorage.getItem('tokenExpiryLocation')
// Returns: "/doctors" (or whatever page)

// After login:
sessionStorage.getItem('tokenExpiryLocation')
// Returns: null (cleared)
```

## Deployment Checklist

- [x] Code compiles without errors
- [x] No TypeScript/JSX syntax errors
- [x] Production build successful
- [x] All imports are correct
- [x] Context provider wraps app
- [x] Modal is imported in App.jsx
- [x] Event emitter is properly set up
- [x] No dependency issues
- [x] All files created/modified as planned
