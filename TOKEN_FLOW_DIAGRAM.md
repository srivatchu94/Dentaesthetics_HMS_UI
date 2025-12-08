# 🔄 Token Flow Visualization

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER LOGS IN                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Frontend: Header.jsx        │
                    │   loginUser({ username, pw }) │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   authService.ts              │
                    │   POST /Authentication/login  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────────┐
                    │   Backend API (C#)                        │
                    │   ✓ Verify credentials                    │
                    │   ✓ Generate JWT token                    │
                    │   ✓ Return response:                      │
                    │   {                                       │
                    │     token: "eyJhbGc...",                  │
                    │     username: "john",                     │
                    │     enterpriseId: 1,                      │
                    │     clinicId: 2,                          │
                    │     roleIds: [1, 2]                       │
                    │   }                                       │
                    └───────────────┬───────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │         authService.ts - saveAuthToken()              │
        │                                                       │
        │   Step 1: Save to Memory Cache                       │
        │   tokenCache = "eyJhbGc..."                          │
        │   ✅ FAST ACCESS                                     │
        │                                                       │
        │   Step 2: Save to localStorage                       │
        │   localStorage.setItem('dentaesthetics_auth_token',  │
        │                        'eyJhbGc...')                 │
        │   ✅ PERSISTENT & SHARED ACROSS TABS                 │
        │                                                       │
        │   Step 3: Save User Data                            │
        │   localStorage.setItem('dentaesthetics_user_data',   │
        │                        JSON.stringify({...}))        │
        │                                                       │
        │   Step 4: Log to Console (for debugging)            │
        │   console.log('✅ Token saved successfully')         │
        │   console.log('🔑 Token:', token)                    │
        │   console.log('👤 User Data:', userData)             │
        └───────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   USER IS LOGGED IN ✅        │
                    └───────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    USER MAKES API CALL                                  │
│                    (e.g., View Patients)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Any Service (e.g.,          │
                    │   patientService.listAll())   │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────────┐
                    │   apiClient.ts - request()                │
                    │                                           │
                    │   Step 1: Get Token                       │
                    │   const token = getAuthToken()            │
                    └───────────────┬───────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │         authService.ts - getAuthToken()               │
        │                                                       │
        │   Step 1: Check Memory Cache First                   │
        │   if (tokenCache) return tokenCache;                 │
        │   ⚡ FASTEST PATH                                     │
        │                                                       │
        │   Step 2: Fallback to localStorage                   │
        │   const token = localStorage.getItem(...)            │
        │   tokenCache = token; // Update cache                │
        │   return token;                                      │
        │   🔄 RESTORE FROM PERSISTENT STORAGE                 │
        └───────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────────┐
                    │   apiClient.ts                            │
                    │                                           │
                    │   Step 2: Build Headers                   │
                    │   headers: {                              │
                    │     "Content-Type": "application/json",   │
                    │     "Authorization": "Bearer eyJhbGc..."  │
                    │   }                                       │
                    │   🔐 TOKEN AUTOMATICALLY ADDED!           │
                    │                                           │
                    │   Step 3: Send Request                    │
                    │   fetch(url, { headers, ...options })     │
                    └───────────────┬───────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Backend API                 │
                    │   ✓ Validate JWT token        │
                    │   ✓ Check expiration          │
                    │   ✓ Verify signature          │
                    │   ✓ Return data              │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Frontend receives data ✅   │
                    └───────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TAB SCENARIO                                   │
└─────────────────────────────────────────────────────────────────────────┘

Tab 1: Login                     Tab 2: Auto Login                Tab 3: Auto Login
─────────────────                ─────────────────                ─────────────────
User submits form                User opens app                   User opens app
↓                                ↓                                ↓
Token saved to:                  getAuthToken() called            getAuthToken() called
├─ Memory: "eyJhbGc..."         ├─ Memory: null (new tab)        ├─ Memory: null (new tab)
└─ localStorage: "eyJhbGc..."   └─ localStorage: "eyJhbGc..." ✅ └─ localStorage: "eyJhbGc..." ✅
                                 ↓                                ↓
                                 Token found!                     Token found!
                                 ↓                                ↓
                                 Update memory cache              Update memory cache
                                 ↓                                ↓
                                 User logged in ✅                User logged in ✅

🎉 ALL TABS SHARE THE SAME TOKEN FROM localStorage! 🎉


┌─────────────────────────────────────────────────────────────────────────┐
│                    USER LOGS OUT                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   User clicks Logout button   │
                    │   Header.jsx                  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │         authService.ts - clearAuthToken()             │
        │                                                       │
        │   Step 1: Clear Memory Cache                         │
        │   tokenCache = null;                                 │
        │                                                       │
        │   Step 2: Clear localStorage                         │
        │   localStorage.removeItem('dentaesthetics_auth_token')│
        │   localStorage.removeItem('dentaesthetics_user_data') │
        │                                                       │
        │   Step 3: Log to Console                            │
        │   console.log('✅ Token cleared successfully')        │
        └───────────────────────────────────────────────────────┘
                                    │
                                    ▼
        Tab 1                       Tab 2                       Tab 3
        ─────────────────          ─────────────────          ─────────────────
        Logout clicked             Still logged in UI          Still logged in UI
        ↓                          ↓                          ↓
        localStorage cleared       getAuthToken() returns null getAuthToken() returns null
        ↓                          ↓                          ↓
        ❌ No token                ❌ No token                ❌ No token
        
        🚨 NOTE: UI state in other tabs won't auto-update
        User needs to refresh or make API call to trigger redirect


┌─────────────────────────────────────────────────────────────────────────┐
│                    PAGE REFRESH SCENARIO                                │
└─────────────────────────────────────────────────────────────────────────┘

Before Refresh                   After Refresh (F5)
─────────────────                ─────────────────
Memory: "eyJhbGc..."            Memory: null ❌ (cleared)
localStorage: "eyJhbGc..."      localStorage: "eyJhbGc..." ✅ (persistent)
                                 ↓
                                 getAuthToken() called
                                 ↓
                                 Memory is null → Check localStorage
                                 ↓
                                 Token found in localStorage! ✅
                                 ↓
                                 Restore to memory: tokenCache = token
                                 ↓
                                 User stays logged in! 🎉
```

## Storage Keys Used

```javascript
// Token Storage
KEY: 'dentaesthetics_auth_token'
VALUE: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// User Data Storage
KEY: 'dentaesthetics_user_data'
VALUE: {
  "username": "john_doe",
  "enterpriseId": 1,
  "clinicId": 2,
  "roleIds": [1, 2, 3]
}
```

## Console Logs You'll See

```
🎉 Login successful!
📦 Backend Response: { token: "eyJ...", username: "john", ... }
✅ Token saved successfully
🔑 Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
👤 User Data: { username: "john", enterpriseId: 1, ... }
💾 Token stored in localStorage + memory
🔄 Token will be shared across all tabs
🔐 Request with auth token: /Patient/list
```

## Security Flow

```
XSS Attack Scenario:
━━━━━━━━━━━━━━━━━━━
Malicious Script Injected
↓
<script>
  // Attacker tries to steal token
  const token = localStorage.getItem('dentaesthetics_auth_token');
  sendToAttacker(token); // ⚠️ WORKS - localStorage is accessible!
</script>

Mitigation:
1. Sanitize all user inputs (prevent XSS injection)
2. Use Content Security Policy (CSP)
3. Validate token on every backend request
4. Use short token expiration (15-30 min)
5. Implement refresh token mechanism
6. Consider httpOnly cookies for production (requires backend changes)
```
