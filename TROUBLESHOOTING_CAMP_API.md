# Camp API Connection Error - Troubleshooting Guide

## Error: `net::ERR_CONNECTION_REFUSED` and `Failed to fetch`

This error means the frontend cannot connect to the backend API server.

## Root Cause Analysis

### Primary Issue: Backend Server Not Running
The error occurs when trying to connect to:
```
https://localhost:7104/api/Camp/GetAllCampsbyClinicID
```

But the backend server at `https://localhost:7104` is **not running or not listening**.

---

## Troubleshooting Checklist

### 1. ✅ **Check if Backend is Running**
```powershell
# Windows - Check if port 7104 is in use
netstat -ano | findstr :7104

# If you see a PID, the server is running
# If nothing appears, the backend is NOT running
```

**What to do if backend isn't running:**
- Start your .NET backend application
- Run from Visual Studio or command line:
  ```
  dotnet run
  ```
- Verify it logs: `Now listening on: https://localhost:7104`

### 2. ✅ **Verify Backend URL**
Check your `src/services/apiClient.ts`:
```typescript
export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7104/api";
```

**Confirm with your backend developer:**
- Is the server running on `https://localhost:7104`?
- Or is it running on a different port?
- Update `VITE_API_BASE_URL` in `.env` if different

### 3. ✅ **Verify Camp Controller Exists**
Your backend should have:
```csharp
[ApiController]
[Route("api/[controller]")]
public class CampController : ControllerBase
{
    [HttpGet("GetAllCampsbyClinicID", Name = "GetAllCampsbyClinicID")]
    public IActionResult GetAllCampsbyClinicID(int ClinicID)
    {
        // ... your implementation
    }
}
```

**The complete endpoint path is:**
```
GET https://localhost:7104/api/Camp/GetAllCampsbyClinicID?ClinicID=1
```

### 4. ✅ **Check CORS Configuration**
If backend is running but still getting "Connection refused", check CORS settings in your backend `Program.cs`:
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", builder =>
    {
        builder.WithOrigins("http://localhost:5173", "http://localhost:3000")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

app.UseCors("AllowLocalhost");
```

### 5. ✅ **Check Frontend Environment**
Make sure you're running React dev server:
```powershell
npm run dev
```

Frontend should be running on: `http://localhost:5173` or `http://localhost:3000`

---

## Debugging Steps

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab
Look for messages like:
```
🔐 Selected Access: { enterpriseId: 1, clinicId: 2, roleIds: [1, 2] }
📍 Fetching camps for clinicId: 2
📞 API CALL: GET /Camp/GetAllCampsbyClinicID?ClinicID=2
❌ API FAILED: Network error - TypeError: Failed to fetch
```

### Step 2: Check Network Tab
DevTools → Network tab → Try "Add Participants"
Look for the request to `/Camp/GetAllCampsbyClinicID?ClinicID=2`

Expected details:
- **Status**: Should be 200 (not error)
- **Request Headers**: Should include `Authorization: Bearer <token>`
- **Request Headers**: Should include `X-Clinic-Id: 2`
- **Response**: Should show list of camps

### Step 3: Test API Directly (Using Postman/Thunder Client)
```
GET https://localhost:7104/api/Camp/GetAllCampsbyClinicID?ClinicID=1

Headers:
- Authorization: Bearer <your-token>
- X-Clinic-Id: 1
- Content-Type: application/json
```

If this works in Postman but not in the app, the issue is frontend-specific.

---

## Common Fixes

### ❌ Issue: "Connection Refused"
**Solution:** Start the backend server
```powershell
cd YourBackendProject
dotnet run
```

### ❌ Issue: "Cannot GET /api/Camp/GetAllCampsbyClinicID"
**Solution:** Verify the endpoint exists in your Camp controller

### ❌ Issue: "401 Unauthorized"
**Solution:** Check that your token is valid and not expired
```javascript
// In DevTools Console:
localStorage.getItem('authToken')
// Should show a valid JWT token, not null or "undefined"
```

### ❌ Issue: "400 Bad Request"
**Solution:** Check ClinicID parameter
```javascript
// In DevTools Console, the error will show:
// ❌ API ERROR: 400 - The value 'undefined' is not valid for parameter 'ClinicID'
// This means getSelectedAccess() returned null or clinicId is undefined
```

Fix: Make sure you're logged in and have selected an access level

### ❌ Issue: "500 Internal Server Error"
**Solution:** Check backend logs for exception details
- Backend exception in Camp controller
- Database connection issue
- Missing implementation of GetAllCampsbyClinicID

---

## Quick Verification

Run this in browser console to verify setup:

```javascript
// 1. Check if auth token exists
console.log('Token:', localStorage.getItem('authToken') ? '✅ Present' : '❌ Missing');

// 2. Check selected access
import { getSelectedAccess } from './src/services/authService.js';
const access = getSelectedAccess();
console.log('Selected Access:', access);

// 3. Check API base URL
import { BASE_URL } from './src/services/apiClient.ts';
console.log('API Base URL:', BASE_URL);

// 4. Try API call manually
import { getCampsByClinicId } from './src/services/campService.ts';
getCampsByClinicId(access.clinicId)
  .then(camps => console.log('✅ Camps:', camps))
  .catch(err => console.error('❌ Error:', err));
```

---

## Connection Flow Diagram

```
Frontend (React)
    ↓
Makes request to: GET /Camp/GetAllCampsbyClinicID?ClinicID=2
Headers: { Authorization, X-Clinic-Id, X-Enterprise-Id }
    ↓
Browser connects to: https://localhost:7104
    ↓
❌ CONNECTION REFUSED ← Backend not running or wrong port
✅ Connected → Backend processes request
    ↓
Backend Camp Controller
    ↓
GetAllCampsbyClinicID(2) method executes
    ↓
Returns list of camps as JSON
    ↓
Frontend displays camps in modal
```

---

## Still Having Issues?

1. **Verify backend is actually running** - open `https://localhost:7104` in browser
2. **Check if you see any backend errors** in Visual Studio Output/Debug console
3. **Make sure Camp controller is deployed** to the running backend
4. **Verify ClinicID parameter is being passed correctly** (check Network tab)
5. **Check backend database** - does it have any camps for your clinic?

## Updated API Logging

Enhanced error logging has been added to help diagnose issues:

### Frontend Logging (Services.jsx):
```
🔐 Selected Access: {clinicId, enterpriseId, roleIds}
📍 Fetching camps for clinicId: X
✅ Camps received: [...]
❌ Error in handleSelectCampForParticipants: ...
```

### API Service Logging (campService.ts):
```
🏕️ getCampsByClinicId called with clinicId: X
📍 Full API URL: https://localhost:7104/api/Camp/GetAllCampsbyClinicID?ClinicID=X
✅ Camps fetched successfully: [...]
❌ Error fetching camps by clinic ID: ...
```

These logs will help identify exactly where the failure occurs.
