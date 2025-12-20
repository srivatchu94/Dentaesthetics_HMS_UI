# Debug: All IDs Coming as 0

## Problem
When saving prescription, all IDs are coming as 0:
```json
{
  "enterpriseId": 0,
  "clinicId": 0,
  "appointmentId": 0,
  "doctorId": 0,
  "patientId": 0,
  "visitId": 0
}
```

## Solution: Check Console Logs

The code now logs all available data. **Do this:**

1. **Open Developer Tools** (F12)
2. **Click on an appointment** → "Write Prescription"
3. **Look in Console tab** for logs starting with:
   - `🔓 Opening prescription modal with appointment:`
   - `🔍 ============ AVAILABLE DATA ============`
   - `📋 ============ EXTRACTED IDS ============`

## What to Check

### Log #1: Appointment Data
```
🔓 Opening prescription modal with appointment: {
  appointmentId: 1003,
  enterpriseId: 1,        // ← Check if present
  clinicId: 2,            // ← Check if present
  doctorId: 123,          // ← Check if present
  patientId: 456,         // ← Check if present
  visitId: 5,             // ← Check if present
  ...other fields
}
```

**If these are missing or undefined:**
- The backend API for loading appointments is not returning all fields
- Need to check `/api/Appointments` endpoint response

### Log #2: Available Data Sources
```
📦 Props received:
  patientInfo: {...}
  appointmentDetails: {...}
  appointmentId: 1003
  doctorInfo: {...}

📦 LocalStorage:
  selectedAccess: {enterpriseId: 1, clinicId: 2, ...}
  userData: {doctorId: 123, ...}
```

**Check if these have data:**
- `appointmentDetails` should have `appointmentId`, `doctorId`, `patientId`, `visitId`
- `selectedAccess` should have `enterpriseId`, `clinicId`
- `userData` should have `doctorId`

### Log #3: Extracted IDs
```
📋 ============ EXTRACTED IDS ============
  enterpriseId: 1  ← Check value
  clinicId: 2      ← Check value
  appointmentId: 0 ← If still 0, data source is missing
  doctorId: 0      ← If still 0, appointment doesn't have it
  patientId: 0     ← If still 0, appointment doesn't have it
  visitId: 0       ← If still 0, appointment doesn't have it
```

---

## What to Do Based on Console Logs

### Case 1: Appointment object is missing fields
**Symptom:** `appointmentDetails` shows `{appointmentId: 1003, ...}` but missing `doctorId`, `patientId`, etc.

**Fix Needed:** The backend `/api/Appointments` endpoint is not returning all fields. Need to:
- Check what the API response looks like
- Ensure it includes: `doctorId`, `patientId`, `visitId`, `enterpriseId`, `clinicId`

### Case 2: selectedAccess is missing
**Symptom:** `selectedAccess` is empty `{}`

**Fix Needed:** User is not properly logged in or login payload not saved. Check:
```javascript
// In console
localStorage.getItem('selectedAccess')
// Should return JSON with enterpriseId and clinicId
```

### Case 3: Still shows 0 values in EXTRACTED IDS
**Share with developer:**
- Screenshot of console logs
- The AVAILABLE DATA section
- The EXTRACTED IDS section
- Tell which IDs are still 0

---

## Quick Test

**Paste this in browser console:**
```javascript
console.log('==== LOCAL STORAGE ====');
console.log('selectedAccess:', localStorage.getItem('selectedAccess'));
console.log('userData:', localStorage.getItem('userData'));
```

**You should see:**
```
selectedAccess: {"enterpriseId":1,"clinicId":2,...}
userData: {"doctorId":123,...}
```

**If either is empty or null:**
- User is not logged in correctly
- Login data not being saved to localStorage

---

## Next Steps

Once you identify which data is missing:

1. **If appointment is missing fields**: Need to check backend API response
2. **If localStorage is empty**: User needs to log in again
3. **If all data is present but still failing**: Share the "EXTRACTED IDS" screenshot for further debugging

**Add comment in browser console and share screenshot for further help.**
