# 🔐 Token Authentication & Expiry Debugging Guide

## Problem Summary

You're experiencing token expiry issues in the production/Azure deployment, while the API and UI work fine locally. This is a common issue that typically stems from:

1. **System Time Sync Issues** - Server and client clocks are out of sync
2. **Token Expiry Configuration** - Backend setting tokens to expire immediately
3. **Timezone Issues** - Client and server in different timezones
4. **Token Not Being Properly Stored** - Token lost on page refresh
5. **Token Validation Logic** - Over-aggressive expiry checking

---

## 🔍 What We've Added: Comprehensive Logging

We've added **extensive logging** at every step of the token lifecycle:

### 1. **Token Saving** (`src/services/tokenManager.ts` - `saveAccessToken`)
```
✅ ACCESS TOKEN SAVED SUCCESSFULLY:
   Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Storage locations:
      🧠 Memory: Active (fast access)
      📋 SessionStorage: Backup (persists on page refresh)
   ⏰ Expiration Details:
      Expires at: 2026-01-30T12:30:45.000Z
      Unix timestamp: 1743412245
      Time remaining: 3600 seconds (60 minutes)
   🔒 Security: Protected from XSS via memory storage
```

### 2. **Token Retrieval** (`src/services/tokenManager.ts` - `getAccessToken`)
```
✅ Token retrieved from MEMORY
   Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

OR

🔄 Token retrieved from SESSIONSSTORAGE and restored to memory
   Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Expiry time: 2026-01-30T12:30:45.000Z

OR

❌ NO TOKEN FOUND - neither in memory nor in sessionStorage
   User needs to login again
```

### 3. **Token Validation in API Requests** (`src/services/apiClient.ts`)
```
🔍 Token Validation Starting...
   Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ Token Decoded Successfully
   Token Payload: {
     "iss": "...",
     "aud": "...",
     "exp": 1743412245,
     ...
   }

⏰ TOKEN EXPIRY DETAILS:
   Token expires at: 2026-01-30T12:30:45.000Z
   Current server time: 2026-01-30T11:30:10.500Z
   Token exp (unix): 1743412245
   Current now (unix): 1743408610
   Time remaining: 3635 seconds (60 minutes)
   Time difference: 3635 seconds

✅ TOKEN IS VALID - 3635 seconds remaining
```

### 4. **Request Headers** (API calls)
```
📞 API CALL: GET https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api/Patient
📋 Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer [present]',
  'X-Enterprise-Id': '1',
  'X-Clinic-Id': '5',
  'X-Role-Ids': '1,2,3'
}
```

### 5. **Token Expiry Checks** (`src/services/tokenManager.ts` - `isTokenExpired`)
```
🕐 TOKEN EXPIRY CHECK:
   Expiry time: 2026-01-30T12:30:45.000Z
   Current time: 2026-01-30T11:30:10.500Z
   Time remaining: 3635 seconds
   Status: ✅ VALID

OR

   Status: ❌ EXPIRED
```

### 6. **Login/Authentication** (`src/services/authService.ts`)
```
🔐 ==================== SAVING AUTHENTICATION TOKENS ====================
📝 Login Response Keys: ['accessToken', 'refreshToken', 'username', 'userId', 'access', ...]
👤 User: john_doe (ID: 123)
🏢 Access Count: 2
💾 Saving access token...
✅ Refresh Token set as HttpOnly Cookie (Backend managed, XSS protected)
   Refresh Token expires at: 2026-02-01T11:30:10.500Z
🎯 Auto-selecting first access: Enterprise 1 Clinic 5
✅ SESSION STARTED SUCCESSFULLY (HYBRID STORAGE)
⏱️ Inactivity timeout: 30 minutes
⏰ Max session duration: 8 hours
🔐 ======================================================================
```

---

## 🛠️ How to Debug Token Issues

### Step 1: Open Browser Developer Tools
- Press `F12` or right-click → Inspect
- Go to **Console** tab

### Step 2: Look for These Log Patterns

**When Logging In:**
```
✅ SAVING AUTHENTICATION TOKENS
✅ ACCESS TOKEN SAVED SUCCESSFULLY
✅ SESSION STARTED SUCCESSFULLY
```

**When Making API Calls:**
```
🔍 Token Validation Starting...
✅ TOKEN IS VALID - X seconds remaining
📞 API CALL: GET https://...
✅ API RESPONSE: 200 OK
```

**When Token Expires:**
```
❌ TOKEN IS EXPIRED!
   Expired 123 seconds ago
⚠️ Token is EXPIRED - User needs to login again
🚫 UNAUTHORIZED/FORBIDDEN - Token may be expired or invalid
```

### Step 3: Check the Specific Times

Look for this section in logs:
```
⏰ TOKEN EXPIRY DETAILS:
   Token expires at: [EXPIRY_TIME]
   Current server time: [CURRENT_TIME]
   Time remaining: [SECONDS] seconds
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Token Expired Immediately After Login

**Symptom:**
```
⏰ Token expires at: 2026-01-30T11:30:10.500Z
⏰ Current server time: 2026-01-30T11:30:15.000Z
❌ Time remaining: -5 seconds (EXPIRED!)
```

**Causes:**
1. **Server clock is ahead** - Backend server time is in the future
2. **Token expiry is too short** - Backend issuing 0-second or negative TTL tokens
3. **Timezone mismatch** - Server in UTC, client in PST

**Solutions:**
- Check Azure VM system time: `date` command in server
- Verify token expiry configuration in backend auth service
- Check if token includes correct timezone information

### Issue 2: Token Valid Locally, Expired in Azure

**Causes:**
1. **System time drift** - Azure servers' clocks are out of sync
2. **Load balancer time skew** - Different servers have different times
3. **Time zone in token** - Backend using different timezone

**Solutions:**
- Enable NTP on Azure VMs to sync system time
- Check all server instances have synchronized clocks
- Verify backend uses consistent timezone (always UTC)

### Issue 3: Token Disappears After Page Refresh

**Symptom:**
```
❌ NO TOKEN FOUND - neither in memory nor in sessionStorage
   User needs to login again
```

**Causes:**
1. SessionStorage not working (browser privacy mode)
2. localStorage being cleared
3. Memory token lost on page refresh (expected, but sessionStorage should restore it)

**Solutions:**
- Check browser allows sessionStorage (not in private/incognito mode)
- Verify logout code isn't clearing sessionStorage unintentionally
- Check for browser extensions blocking storage

### Issue 4: Token Says Valid But API Returns 401/403

**Symptom:**
```
✅ TOKEN IS VALID - 3600 seconds remaining
📞 API CALL: GET https://...
❌ API RESPONSE: 401 Unauthorized

🚫 UNAUTHORIZED/FORBIDDEN - Token may be expired or invalid
🔓 Token Expiration: [time]
⚠️ Token is EXPIRED - Triggering token expiry modal
```

**Causes:**
1. **Token invalid on server** - Backend validation failed
2. **Refresh token expired** - Auto-refresh mechanism failed
3. **Token issued to different user** - Session hijack
4. **Enterprise/Clinic ID mismatch** - Headers not matching token claims

**Solutions:**
- Check if `X-Enterprise-Id` and `X-Clinic-Id` headers match token
- Verify refresh token is valid in httpOnly cookie
- Check backend token validation logic
- Compare token claims with request headers in logs

---

## 📊 Log Flow Diagram

```
User Logs In
    ↓
Login API Call → Backend validates credentials
    ↓
✅ SAVING AUTHENTICATION TOKENS (authService.ts)
    ↓
saveAccessToken() (tokenManager.ts)
    ↓
✅ ACCESS TOKEN SAVED SUCCESSFULLY
    ├─ Memory storage
    ├─ SessionStorage backup
    └─ Expiry time stored
    ↓
User Makes API Call
    ↓
request() function (apiClient.ts)
    ↓
getAuthToken() → getAccessToken() (tokenManager.ts)
    ↓
🔍 Token Validation Starting...
    ↓
Decode JWT payload → Check exp claim
    ↓
⏰ TOKEN EXPIRY DETAILS (times compared)
    ↓
IF expired:
    ❌ TOKEN IS EXPIRED
    └─ Clear storage and redirect to login
ELSE:
    ✅ TOKEN IS VALID
    └─ Add Authorization header and make request
    ↓
📞 API CALL with headers
    ↓
Backend validates token
    ↓
IF valid:
    ✅ API RESPONSE: 200 OK
ELSE:
    ❌ API RESPONSE: 401 Unauthorized
    └─ 🚫 UNAUTHORIZED/FORBIDDEN
```

---

## 🚀 Production Checklist

Before deploying to Azure, ensure:

- [ ] Backend API returns correct `accessTokenExpiresAt` (not already expired)
- [ ] Azure VM system clock is synchronized with NTP
- [ ] All Azure instances have the same system time
- [ ] Backend token validation uses UTC timestamps
- [ ] Refresh token mechanism is working (check logs for refresh attempts)
- [ ] Browser allows sessionStorage (not in private mode)
- [ ] Enterprise/Clinic headers match token claims
- [ ] Test token expiry behavior with extended timeout
- [ ] Monitor logs for "TOKEN IS EXPIRED" immediately after login

---

## 📝 Example: Tracking a Failing Request

**Full log sequence when something fails:**

```
🔐 ==================== SAVING AUTHENTICATION TOKENS ====================
👤 User: john_doe (ID: 123)
✅ ACCESS TOKEN SAVED SUCCESSFULLY:
   Expires at: 2026-01-30T12:30:45.000Z

[User clicks a button that triggers API call]

🔍 Token Validation Starting...
✅ Token Decoded Successfully
⏰ TOKEN EXPIRY DETAILS:
   Token expires at: 2026-01-30T12:30:45.000Z
   Current server time: 2026-01-30T12:35:00.000Z
   Time remaining: -255 seconds
❌ TOKEN IS EXPIRED!
   Expired 255 seconds ago

⚠️ Token is EXPIRED - User needs to login again
[User redirected to login]
```

From this log, we can see:
- Token was saved correctly
- But 5 minutes later (12:35 vs 12:30), backend says it's expired
- This indicates either: token TTL too short, or server time is ahead

---

## 🆘 What to Collect When Reporting Issues

When debugging token issues, collect:

1. **Browser console logs** - Copy entire console output
2. **Network tab** - Check 401/403 response headers
3. **Request headers** - Especially `Authorization` header
4. **Timestamps from logs** - Server time vs client time
5. **Browser/OS info** - Check for timezone
6. **Steps to reproduce** - What action triggers the issue
7. **Environment** - Local vs Azure, which Azure region

---

## 📞 Key Log Entries to Watch

| Log Pattern | Meaning | Status |
|---|---|---|
| `✅ ACCESS TOKEN SAVED` | Token properly stored | Good ✅ |
| `✅ TOKEN IS VALID` | Token not expired | Good ✅ |
| `🧠 Token retrieved from MEMORY` | Token still in RAM | Good ✅ |
| `🔄 Token restored from SESSIONSSTORAGE` | Token recovered after page refresh | Good ✅ |
| `❌ TOKEN IS EXPIRED` | Token's exp claim is in the past | Bad ❌ |
| `❌ NO TOKEN FOUND` | User not logged in or session lost | Bad ❌ |
| `🚫 UNAUTHORIZED/FORBIDDEN` | API rejected the token | Bad ❌ |
| `⚠️ No token found in getAuthToken()` | Memory and sessionStorage both empty | Bad ❌ |

---

## 🎯 Next Steps

1. **Redeploy to Azure** with this new logging
2. **Reproduce the issue** in Azure
3. **Copy browser console logs** completely
4. **Check Azure VM system time** - compare with local machine
5. **Review backend auth service** - check token TTL configuration
6. **Look for "TOKEN IS EXPIRED" logs immediately after login** - if found, issue is in backend token generation
7. **Compare timestamps in logs** - identify time skew between client and server

