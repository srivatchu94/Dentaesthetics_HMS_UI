# 🚀 Quick Start Guide - Token Refresh Diagnostics

## What Changed?

Your token refresh mechanism now has **production-grade resilience** for Azure:
- ✅ Automatic retries for transient failures
- ✅ Connection health monitoring
- ✅ Easy diagnostics from browser console
- ✅ No impact on locally working code

---

## First Steps

### **1. Build & Deploy**
```bash
npm run build    # Verify build works (already tested ✅)
# Then deploy to Azure using your normal process
```

### **2. Test in Production**
After deployment, open your production app and run in browser console:

```javascript
window.__HMS_DIAGNOSTICS__.printDiagnostics()
```

You'll see a detailed report showing:
- Environment (should be: 🔴 PRODUCTION (Azure))
- Connection Health
- Refresh Statistics
- Recent attempts

---

## Diagnostic Commands (Browser Console)

### **Quick Report**
```javascript
window.__HMS_DIAGNOSTICS__.printDiagnostics()
```
Shows: Environment, Auth status, Refresh stats, Connection health, Recent attempts

### **Get Raw Data**
```javascript
const data = window.__HMS_DIAGNOSTICS__.getDiagnostics()
console.table(data)
```
Returns JSON object for analysis

### **Table View**
```javascript
window.__HMS_DIAGNOSTICS__.showTable()
```
Pretty table of key metrics

### **Download Report**
```javascript
window.__HMS_DIAGNOSTICS__.download()
```
Downloads as JSON file (useful for analysis/sharing)

### **Check Auth State**
```javascript
window.__HMS_DIAGNOSTICS__.checkAuthState()
```
Shows current tokens, user data, access rights

### **Refresh Now**
```javascript
window.__HMS_DIAGNOSTICS__.refreshNow()
```
Manually trigger token refresh with retries

### **Export Logs**
```javascript
window.__HMS_DIAGNOSTICS__.exportLogs()
```
Export debug logs to file

---

## What to Look For

### ✅ **Healthy Production Session**
```
Environment: 🔴 PRODUCTION (Azure)
Is Authenticated: ✅ YES
Token Expired: ✅ NO
Connection Health: ✅ HEALTHY
Consecutive Failures: 0/3
Success Rate: 95%+ 
Recent Attempts: Mostly ✅ (successful)
```

### ⚠️ **Degraded but Working**
```
Consecutive Failures: 1-2/3
Success Rate: 85-95%
Recent Attempts: Some ❌ but recovering
→ Action: Monitor, should recover
```

### 🔴 **Connection Issues**
```
Consecutive Failures: 3/3
Success Rate: < 80%
Recent Attempts: Many ❌
→ Action: Check backend, increase retries if needed
```

---

## Troubleshooting

### **"Session expired" errors appearing**

1. Open browser console
2. Run: `window.__HMS_DIAGNOSTICS__.printDiagnostics()`
3. Check:
   - Is environment showing "PRODUCTION (Azure)"? If not, environment detection failed
   - Is connection health "HEALTHY"? If not, backend issues
   - Is success rate > 80%? If not, connection problems

4. Check backend:
   - Is API running?
   - Database connection issues?
   - Connection pool exhausted?

### **Success rate suddenly drops**

1. Get diagnostics: `window.__HMS_DIAGNOSTICS__.download()`
2. Check pattern of failures:
   - Every 5th attempt fails? Could be connection pool cycling
   - Random failures? Could be transient network issues
   - All fail? Backend might be down

3. Can retry configuration help?
   - Edit `src/services/azureTokenRefreshManager.ts`
   - Increase `maxRetries` from 5 to 7
   - Increase `maxRetryDelayMs` from 10000 to 15000

### **Still having issues?**

1. Collect full report: `window.__HMS_DIAGNOSTICS__.download()`
2. Share with backend team
3. Include:
   - The downloaded JSON file
   - How long session ran before failing
   - Any error patterns noticed
   - Browser and OS

---

## Testing Checklist

### **Before Production Deploy**
- [ ] Run locally: `npm run dev`
- [ ] Test for 10+ minutes
- [ ] Check: `window.__HMS_DIAGNOSTICS__.printDiagnostics()`
- [ ] Should show ~100% success rate locally
- [ ] Build: `npm run build`

### **After Production Deploy**
- [ ] Log into production
- [ ] Check: `window.__HMS_DIAGNOSTICS__.printDiagnostics()`
- [ ] Should show: Environment = 🔴 PRODUCTION
- [ ] Keep app open for 30+ minutes
- [ ] No "Session expired" errors during normal use
- [ ] Success rate should be 90%+
- [ ] Check diagnostics at 15 min mark, 30 min mark, etc.

---

## Configuration (If Needed)

**File:** `src/services/azureTokenRefreshManager.ts`

### Default Configuration
```typescript
maxRetries: 5                          // Retry 5 times
initialRetryDelayMs: 500               // Wait 500ms then retry
maxRetryDelayMs: 10000                 // Max wait is 10 seconds
backoffMultiplier: 1.5                 // Delays: 500ms, 750ms, 1125ms, 1688ms...
```

### For Better Resilience (Slower network)
```typescript
maxRetries: 7
maxRetryDelayMs: 15000
backoffMultiplier: 2.0
```

### For Faster Recovery (Good network)
```typescript
maxRetries: 3
maxRetryDelayMs: 3000
backoffMultiplier: 1.2
```

---

## Real-World Example

**Session Starts:**
- User logs in
- Token set to expire in 15 minutes
- Refresh scheduled for 13-minute mark

**At 13-minute mark:**
- Timer fires automatically
- System calls refresh API
- ✅ Success → New token saved, session extends another 15 minutes
- ❌ Timeout → Retries with exponential backoff
  - Retry #1: Wait 500ms → Try again
  - Retry #2: Wait 750ms → Try again
  - Retry #3: Wait 1125ms → Try again
  - If still fails but token valid: Schedule retry for 60s later
  - If token expired: Show logout modal

**User keeps working:**
- Session extends every 13 minutes automatically
- Can work for hours without re-login
- Transient network glitches handled gracefully

---

## Performance Impact

- **Successful refresh:** No overhead (same as before)
- **Failed refresh (with retry):** 1-3 seconds delay (vs immediate logout)
- **Memory usage:** ~5-10KB for tracking
- **Network:** Only on failed requests, succeeds retried 0-5 times

---

## Next Steps

1. **Deploy** the code to Azure
2. **Test** in production with diagnostic commands
3. **Monitor** for a few days
4. **Adjust** configuration if needed based on diagnostics
5. **Document** any learnings for future reference

---

## Questions?

If something doesn't work as expected:

1. Run full diagnostics: `window.__HMS_DIAGNOSTICS__.download()`
2. Share the JSON file
3. Include:
   - When it started failing (after X minutes? After X refresh cycles?)
   - Error messages seen
   - Browser/OS info
   - Azure region (if known)

---

**Implementation Status:** ✅ Complete and Ready  
**Build Status:** ✅ Successful  
**Deployment Status:** Ready for Azure  

