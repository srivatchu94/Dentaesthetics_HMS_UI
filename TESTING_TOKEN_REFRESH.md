# Testing Token Refresh - Quick Guide ✅

## What Changed
✅ Added protection flag to prevent page redirect during token refresh
✅ Enhanced logging to show exact API URL being hit
✅ Fixed race condition between two token validation systems

**Commits:**
- `c7dc62d` - Prevent page redirect during token refresh
- `d712bea` - Enhance timer logging with exact API URL

---

## Quick Test (2 minutes)

### 1. Clear Storage & Login
```powershell
# In browser Dev Tools → Application → Clear Site Data
# Then login normally
```

### 2. Open Console & Wait
- Open **DevTools** (F12)
- Go to **Console** tab
- **Scroll to top** so you can see when timer fires

### 3. Wait For 2-Minute Timer (Watch Console)
You'll see:
```
🔔 🔔 🔔  ⏰ TIMER FIRED - TOKEN REFRESH TRIGGERED  🔔 🔔 🔔

🌐 API ENDPOINT ABOUT TO BE CALLED:
   URL: https://localhost:7104/api/Authentication/refresh-token
   Method: POST
   Full URL: https://localhost:7104/api/Authentication/refresh-token

📋 ACTION:
   🔒 Setting isTokenRefreshInProgress = true
   ✅ Calling refreshAccessToken()
   ⏳ This will make the API call
   ✅ Wait for response from backend
```

### ✅ Expected Result
You should see these steps AFTER timer fires:

**Stage 1 - Request Sent:**
```
🔄 TOKEN REFRESH INITIATED
📋 STEP 0: RETRIEVING TOKENS FROM STORAGE
📋 STEP 1: API ENDPOINT DETAILS
   API URL: https://localhost:7104/api/Authentication/refresh-token
📋 STEP 2: REQUEST PARAMETERS
📋 STEP 3: SENDING REQUEST
   ⏱️ Request started at: [time]
```

**Stage 2 - Response Received:**
```
📋 STEP 4: RESPONSE RECEIVED
   ⏱️ Duration: XXXms
   📊 HTTP Status: 200 OK
   Raw Response Body: {...newAccessToken...}
```

**Stage 3 - Token Updated:**
```
✅ RESPONSE VALIDATION PASSED
📋 STEP 5: UPDATING LOCAL STORAGE
📋 STEP 6: RESTARTING REFRESH TIMER
✅ TOKEN REFRESH COMPLETED SUCCESSFULLY
✅ TOKEN REFRESH SUCCESSFUL - SESSION EXTENDED
   ✓ New access token received from /api/Authentication/refresh-token
   ✓ Token stored in memory and sessionStorage
   ✓ Next refresh timer scheduled
   ✓ User session extended for another 15 minutes
```

**Flag Management:**
```
🔒 REFRESH IN PROGRESS FLAG SET - apiClient will NOT redirect to /login
[... API call happens ...]
🔒 REFRESH IN PROGRESS FLAG CLEARED - apiClient can now redirect if needed
```

### ❌ If Something Goes Wrong

**Symptom 1: Page redirects to /login at 2-minute mark**
- Look for: `window.location.href = '/login'` in console
- This means the flag wasn't working
- Check: Is `isRefreshInProgress()` being called?

**Symptom 2: API call fails**
- Look for: `❌ FAILED` message
- Status code will be shown (401, 403, 500, etc.)
- Check: Backend API is running on `localhost:7104`

**Symptom 3: Response has no access token**
- Look for: `Missing required field: accessToken`
- Check: Backend is returning correct response format

**Symptom 4: Logs disappear after 2 minutes**
- This was the MAIN ISSUE we fixed
- If still happening: Check that `isTokenRefreshInProgress` flag is being respected
- Call: `viewDebugLogs()` - these survive page refresh

---

## Manual Trigger Test (30 seconds)

While logged in, trigger refresh immediately:

```javascript
// In browser console
triggerRefresh()
```

You should see the same sequence but faster:
```
🔒 REFRESH IN PROGRESS FLAG SET - apiClient will NOT redirect to /login
🔄 TOKEN REFRESH INITIATED
📋 STEP 0-6: ...all the logging...
✅ TOKEN REFRESH COMPLETED SUCCESSFULLY
🔒 REFRESH IN PROGRESS FLAG CLEARED - apiClient can now redirect if needed
```

---

## Debug Commands (All Available Post-Login)

### View Persistent Logs
```javascript
viewDebugLogs()
```
Shows all logs from this session (survives page refresh)

### Get Current Token Status
```javascript
getRefreshStatus()
```
Shows:
- Access token exists? (yes/no)
- Refresh token exists? (yes/no)
- Token expiry time
- Time remaining to expiry

### Trigger Manual Refresh
```javascript
triggerRefresh()
```
Forces token refresh immediately (doesn't wait for timer)

---

## Before vs After

### BEFORE (Issue)
```
2 min → Timer fires → API starts
       ↓
apiClient validates token
       ↓
Token looks expired (false positive)
       ↓
window.location.href = '/login'  ← PAGE REDIRECTS, logs lost ❌
       ↓
(API response never received)
```

### AFTER (Fixed)
```
2 min → Timer fires → isTokenRefreshInProgress = true
       ↓
API starts
       ↓
apiClient validates token, sees flag
       ↓
Skips redirect, waits for refresh ✅
       ↓
API returns new token
       ↓
Token updated ✅
       ↓
isTokenRefreshInProgress = false
       ↓
Page stays on current route ✅
```

---

## What To Report

If you see an issue, please save the console output starting from:
```
🔔 🔔 🔔  ⏰ TIMER FIRED - TOKEN REFRESH TRIGGERED  🔔 🔔 🔔
```

Until either:
```
✅ TOKEN REFRESH SUCCESSFUL - SESSION EXTENDED
```
OR
```
❌ REFRESH API CALL FAILED - AUTO LOGOUT TRIGGERED
```

Screenshot or copy-paste this entire section to show what happened.

---

## Key API Details (What You Asked For)

**Exact URL Being Hit:**
```
POST https://localhost:7104/api/Authentication/refresh-token
```

**Visible in Console When Timer Fires:**
```
🌐 API ENDPOINT ABOUT TO BE CALLED:
   URL: https://localhost:7104/api/Authentication/refresh-token
   Method: POST
   Full URL: https://localhost:7104/api/Authentication/refresh-token
   Protocol: HTTPS
   Host: localhost
   Port: 7104
   Endpoint: /api/Authentication/refresh-token
```

**Request Components:**
- Headers: Authorization + Content-Type
- Body: accessToken + refreshToken (both required)
- Credentials: includes HttpOnly cookie

**Expected Response:**
- Status: 200 OK  
- Body: `{ "accessToken": "new...", "accessTokenExpiresAt": "..." }`

---

## Timeline

**At T=0 (Login):**
- Access token: 15-minute lifetime
- Tokens stored to memory + sessionStorage
- First refresh timer set to 2 minutes (TEST MODE)

**At T=2 minutes:**
- Timer fires
- Fetch call to API made
- (~100-500ms for API to respond)
- New token received
- Next timer set for 2 minutes again

**At T=4 minutes:**
- Timer fires again
- Process repeats

**This continues until:**
- Refresh token expires (8 hours)
- User logs out manually
- Session expires (idle timeout)

---

## Quick Checklist

- [ ] Pulled latest code (commit d712bea)
- [ ] Npm run build passed
- [ ] Logged in successfully
- [ ] Waited for 2-minute timer to fire
- [ ] Saw detailed console output with API URL
- [ ] Page DID NOT redirect to /login
- [ ] Saw "TOKEN REFRESH COMPLETED SUCCESSFULLY" message
- [ ] Can continue using app without being logged out
- [ ] Called `viewDebugLogs()` to verify logs persisted

If all checks pass ✅, the fix is working!

---

## Next Steps

1. **Test the 2-minute timer** using steps above
2. **Report back** with console output
3. **Test longer scenarios** (keep app open for 10+ minutes)
4. **Verify refresh happens silently** without user seeing "Please login again"
