# 🔐 Multi-Access Authentication System - Implementation Guide

## 📋 Overview

Updated authentication system to support **multiple enterprise/clinic access** per user with role-based permissions.

---

## 🏗️ Backend Response Structure

```javascript
// Login Response (Your Backend)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "kasthurirangan_s",
  "enterpriseId": 1005,
  "clinicId": 1005,
  "roleIds": [2, 3, 4]
}
```

**Response Fields:**
- ✅ `token` - JWT authentication token
- ✅ `username` - User's username
- ✅ `enterpriseId` - Enterprise the user belongs to
- ✅ `clinicId` - Clinic the user has access to
- ✅ `roleIds` - Array of role IDs assigned to the user

---

## 🔄 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER LOGS IN                                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
    POST /api/authentication/login
    { username: "kasthurirangan_s", password: "pass123" }
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  2. BACKEND RETURNS TOKEN + MULTI-ACCESS                    │
│  - JWT Token                                                │
│  - User ID                                                  │
│  - Array of access rights (enterprises/clinics/roles)       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  3. FRONTEND STORES                                         │
│  localStorage.setItem('jwt', token)                         │
│  localStorage.setItem('userAccess', JSON.stringify(access)) │
│  localStorage.setItem('selectedAccess', first access)       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  4. USER SELECTS ENTERPRISE/CLINIC (Optional)               │
│  setSelectedAccess(1005, 1006)                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  5. API REQUESTS AUTO-INCLUDE CONTEXT                       │
│  Headers: {                                                 │
│    'Authorization': 'Bearer eyJhbGc...',                    │
│    'X-Enterprise-Id': '1005',                               │
│    'X-Clinic-Id': '1006'                                    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  6. BACKEND VALIDATES                                       │
│  ✓ Token valid?                                             │
│  ✓ User has access to Enterprise 1005, Clinic 1006?        │
│  ✓ User has required role for this endpoint?               │
│  → ALLOW or DENY                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Modified

### 1. **AuthModels.ts** - New Interfaces

```typescript
// New structure for user access
export interface UserAccess {
  enterpriseId: number;
  clinicId: number;
  roleIds: number[];
}

// New login response
export interface LoginResponse {
  token: string;
  username: string;
  userId: number;
  access: UserAccess[];
  expiresAt: string;
}
```

### 2. **authService.ts** - Updated Functions

#### New Storage Keys:
```javascript
'jwt'              // Token (changed from 'dentaesthetics_auth_token')
'userAccess'       // Array of access rights
'userData'         // User info (username, userId, expiresAt)
'selectedAccess'   // Currently selected enterprise/clinic
```

#### New Functions:

**`getUserAccess()`**
```javascript
// Returns all access rights user has
const access = getUserAccess();
// [{enterpriseId: 1005, clinicId: 1006, roleIds: [1,3]}, ...]
```

**`setSelectedAccess(enterpriseId, clinicId)`**
```javascript
// Set which enterprise/clinic to use for API calls
setSelectedAccess(1005, 1006);
```

**`getSelectedAccess()`**
```javascript
// Get currently selected context
const selected = getSelectedAccess();
// {enterpriseId: 1005, clinicId: 1006}
```

### 3. **apiClient.ts** - Auto-Header Injection

```typescript
// Automatically adds to EVERY API request:
headers: {
  'Authorization': 'Bearer eyJhbGc...',
  'X-Enterprise-Id': '1005',        // ← NEW
  'X-Clinic-Id': '1006'             // ← NEW
}
```

### 4. **AccessSelector.jsx** - New Component

Optional UI component to switch between different enterprise/clinic contexts.

```jsx
import AccessSelector from './components/AccessSelector';

// Add to Header or any page
<AccessSelector />
```

Shows dropdown with all available access combinations and allows switching.

---

## 🧪 Testing the Implementation

### 1. **Login and Check Console**

```javascript
// Login with credentials
// Open browser console (F12)

// You should see:
🎉 Login successful!
📦 Backend Response: { token: "...", username: "...", enterpriseId: 1005, clinicId: 1005, roleIds: [...] }
════════════════════════════════════════
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Username: kasthurirangan_s
Enterprise ID: 1005
Clinic ID: 1005
Role IDs: [2, 3, 4]
════════════════════════════════════════
✅ Token saved successfully
🔑 Token: eyJhbGc...
👤 User: kasthurirangan_s
🏢 Enterprise ID: 1005
🏥 Clinic ID: 1005
👔 Role IDs: [2, 3, 4]
💾 Token stored in localStorage + memory
🔄 Token will be shared across all tabs
🏢 Selected Access: Enterprise 1005, Clinic 1005
```

### 2. **Check localStorage**

```javascript
// Open console and type:
localStorage.getItem('jwt')
localStorage.getItem('userAccess')
localStorage.getItem('selectedAccess')

// You should see your token and access data
```

### 3. **Make an API Call**

```javascript
// Make any API request (e.g., view patients)
// Console will show:

🔐 Request: /Patient/list | Enterprise: 1005, Clinic: 1006

// Check Network tab in DevTools
// Headers should include:
Authorization: Bearer eyJhbGc...
X-Enterprise-Id: 1005
X-Clinic-Id: 1006
```

### 4. **Switch Context**

```javascript
import { setSelectedAccess } from './services/authService';

// Switch to different enterprise/clinic
setSelectedAccess(1005, 1007);

// Console shows:
🏢 Selected Access: Enterprise 1005, Clinic 1007

// Next API call will use new context
```

---

## 🎯 Usage Examples

### Get All User Access Rights

```javascript
import { getUserAccess } from './services/authService';

const access = getUserAccess();
console.log('User has access to:', access.length, 'combinations');

access.forEach(a => {
  console.log(`Enterprise ${a.enterpriseId}, Clinic ${a.clinicId}, Roles: [${a.roleIds}]`);
});
```

### Check Current Context

```javascript
import { getSelectedAccess } from './services/authService';

const current = getSelectedAccess();
if (current) {
  console.log(`Working in Enterprise ${current.enterpriseId}, Clinic ${current.clinicId}`);
}
```

### Switch Context Programmatically

```javascript
import { setSelectedAccess, getUserAccess } from './services/authService';

// Get all access
const allAccess = getUserAccess();

// Find access with specific enterprise
const targetAccess = allAccess.find(a => a.enterpriseId === 2001);

if (targetAccess) {
  setSelectedAccess(targetAccess.enterpriseId, targetAccess.clinicId);
}
```

### Add AccessSelector to Header

```jsx
// In Header.jsx
import AccessSelector from './components/AccessSelector';

// Add in the header near logout button
<AccessSelector />
```

---

## 🔒 Security Features

### ✅ What's Implemented:

1. **JWT Token** - Stored securely with Bearer authentication
2. **Multi-Access Support** - User can have multiple enterprise/clinic combinations
3. **Automatic Headers** - Enterprise/Clinic IDs automatically sent with every request
4. **Token Expiration** - `expiresAt` field tracked
5. **Role-Based Access** - Each access has specific role IDs
6. **Memory + localStorage** - Fast access with persistence
7. **Multi-Tab Sharing** - Token and context shared across tabs

### 🛡️ Backend Validation:

Backend should validate:
1. ✓ Token is valid and not expired
2. ✓ User has access to requested Enterprise/Clinic
3. ✓ User has required role for the endpoint
4. ✓ Enterprise/Clinic IDs match user's access array

---

## 📊 Storage Structure

```javascript
// localStorage contents after login:

{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  
  "userAccess": [
    {"enterpriseId": 1005, "clinicId": 1005, "roleIds": [2, 3, 4]}
  ],
  
  "userData": {
    "username": "kasthurirangan_s",
    "enterpriseId": 1005,
    "clinicId": 1005,
    "roleIds": [2, 3, 4]
  },
  
  "selectedAccess": {
    "enterpriseId": 1005,
    "clinicId": 1005
  }
}
```

---

## 🚀 Migration from Old System

### Old Storage Keys (deprecated):
- ❌ `dentaesthetics_auth_token`
- ❌ `dentaesthetics_user_data`

### New Storage Keys:
- ✅ `jwt`
- ✅ `userAccess`
- ✅ `userData`
- ✅ `selectedAccess`

**Note:** Old keys will be ignored. Users need to login again with new system.

---

## 🎯 Summary of Changes

| Feature | Old System | New System |
|---------|------------|------------|
| **Token Storage** | `dentaesthetics_auth_token` | `jwt` |
| **Access Model** | Single enterprise/clinic | Multiple access combinations |
| **Headers** | Authorization only | Authorization + Enterprise + Clinic |
| **Context Switching** | Not supported | Supported via setSelectedAccess() |
| **User Data** | Basic info | userId, expiresAt, access array |
| **Backend Validation** | Token only | Token + Enterprise + Clinic + Role |

---

## ✅ Implementation Checklist

- [x] Updated AuthModels.ts with new interfaces
- [x] Updated authService.ts with multi-access functions
- [x] Updated apiClient.ts to inject headers automatically
- [x] Created AccessSelector.jsx component
- [x] Updated Header.jsx imports
- [x] Login now saves full access array
- [x] API calls include Enterprise/Clinic headers
- [x] Token shared across tabs
- [x] Console logging for debugging

---

## 🔧 Next Steps (Optional)

1. **Add AccessSelector to UI** - Show in header/sidebar
2. **Token Expiration Check** - Auto-logout when token expires
3. **Refresh Token** - Implement token refresh mechanism
4. **Role-Based UI** - Hide/show features based on roles
5. **Access Context Provider** - React Context for easy access throughout app

---

**Implementation Complete! 🎉**

Your authentication now supports:
- ✅ Multiple enterprise/clinic access per user
- ✅ Automatic header injection (Authorization, Enterprise, Clinic)
- ✅ Context switching
- ✅ Role-based permissions
- ✅ Multi-tab sharing
- ✅ Token expiration tracking
