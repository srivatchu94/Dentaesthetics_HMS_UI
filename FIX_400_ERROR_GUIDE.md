# 400 Bad Request Error - Diagnosis Guide

## What's Causing the 400 Error?

A **400 Bad Request** error means the backend received your request but rejected it because the **payload structure/data is invalid**.

### Error Location
```
Endpoint: POST /api/Appointments/AddPrescription
Status: 400 Bad Request
```

---

## Root Causes (Most to Least Common)

### 1. **Field Type Mismatch** ⚠️ (Most Common)
**Problem:** Sending wrong data types
```javascript
// ❌ WRONG
{ 
  enterpriseId: "123",  // String instead of Number
  medicationId: null     // Null instead of 0
}

// ✅ CORRECT
{ 
  enterpriseId: 123,     // Number
  medicationId: 0        // Number (0 for new)
}
```

**Fix Applied:** Now explicitly converting to `Number()` type.

---

### 2. **Field Name Case Sensitivity**
**Problem:** Backend expects PascalCase but we're sending camelCase
```javascript
// ❌ WRONG
{ medicineName: "Amoxicillin" }

// ✅ CORRECT (if backend expects PascalCase)
{ MedicineName: "Amoxicillin" }
```

**Current Status:** Using camelCase matching your curl example.

---

### 3. **Missing or Null Required Fields**
**Problem:** Required fields are empty or null
```javascript
// ❌ WRONG
{ 
  medicineName: null,     // Required but empty
  dosage: undefined,      // Required but empty
  patientId: 0            // If 0 means "no patient"
}

// ✅ CORRECT
{ 
  medicineName: "Aspirin",
  dosage: "500mg",
  patientId: 123          // Real patient ID
}
```

**Current Status:** Added `String().trim()` validation and proper null checks.

---

### 4. **Date Format Issues**
**Problem:** Date format doesn't match backend expectation
```javascript
// Possible issues:
createdAt: "2025-12-18T10:00:02.492Z"  // Your format
createdAt: new Date()                  // Wrong - should be string
createdAt: "12/18/2025"                // Wrong format
```

**Current Status:** Using ISO 8601 format: `new Date().toISOString()`

---

## How to Diagnose

### Step 1: Check Browser Console
Open DevTools (F12) and look for logs like:

```
📤 Sending prescription payload: {
  medicationId: 0,
  enterpriseId: 123,
  clinicId: 45,
  appointmentId: 0,
  visitId: 0,
  doctorId: 78,
  patientId: 91,
  medicineName: "Amoxicillin",
  dosage: "500mg",
  frequency: "Twice daily",
  duration: "5 days",
  specialInstructions: "Take with food",
  generalPrescriptionNotes: "",
  createdAt: "2025-12-18T10:30:45.123Z",
  createdBy: "Dr. Smith",
  updatedAt: "2025-12-18T10:30:45.123Z",
  updatedBy: "Dr. Smith"
}
```

### Step 2: Compare with Backend Spec
Compare the payload above with what your backend expects:

```csharp
// Example C# model
public class AddPrescriptionRequest {
    public int MedicationId { get; set; }
    public int EnterpriseId { get; set; }
    public int ClinicId { get; set; }
    public int AppointmentId { get; set; }
    public int VisitId { get; set; }
    public int DoctorId { get; set; }
    public int PatientId { get; set; }
    public string MedicineName { get; set; }
    public string Dosage { get; set; }
    public string Frequency { get; set; }
    public string Duration { get; set; }
    public string SpecialInstructions { get; set; }
    public string GeneralPrescriptionNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string UpdatedBy { get; set; }
}
```

### Step 3: Check for Differences

```
PAYLOAD STRUCTURE vs BACKEND EXPECTATIONS:

✅ Field Names Match?
✅ Field Types Match? (int vs string, etc.)
✅ Required Fields Present?
✅ Date Format Correct?
✅ All Values Non-null?
```

---

## Quick Fixes to Try

### Fix #1: Check userData in localStorage
```javascript
// Open browser console and run:
console.log(JSON.parse(localStorage.getItem('userData')))
console.log(JSON.parse(localStorage.getItem('selectedAccess')))

// You should see:
{
  username: "doctor_name",
  doctorId: 123,
  registrationNumber: "ABC123",
  // ... other fields
}
```

### Fix #2: Verify IDs are Numbers
The payload now includes explicit type conversion:
```javascript
enterpriseId: Number(selectedAccess.enterpriseId) || 0,
doctorId: Number(userData.doctorId ?? doctorInfo.doctorId ?? 0),
```

### Fix #3: Check for Empty Strings
The payload now trims all strings:
```javascript
medicineName: String(med.name).trim(),
dosage: String(med.dosage).trim(),
```

---

## Backend Response Analysis

When the API returns 400, the backend should include an error message. Look in the network tab:

### Network Tab (F12 > Network)
1. Find the POST request to `AddPrescription`
2. Click on it
3. Go to "Response" tab
4. You'll see something like:

```json
{
  "statusCode": 400,
  "message": "PatientId is required and cannot be 0",
  "errors": {
    "PatientId": ["Must be greater than 0"]
  }
}
```

**This tells you exactly what's wrong!**

---

## Common Backend Error Messages

### "PatientId is required"
```javascript
// Fix: Make sure patient is selected
patientId: Number(patientInfo.patientId || 0)
// Should be: patientInfo.patientId (must be real ID, not 0)
```

### "EnterpriseId is required"
```javascript
// Fix: Verify selectedAccess is in localStorage
const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
console.log(selectedAccess); // Should show enterpriseId
```

### "MedicineName cannot be empty"
```javascript
// The payload now validates:
medicineName: String(med.name).trim()
// But make sure med.name is not empty before sending
```

### "Invalid date format"
```javascript
// Fix: Ensure ISO 8601 format
createdAt: new Date().toISOString()
// Format: "2025-12-18T10:30:45.123Z"
```

---

## What We've Changed to Fix This

### ✅ Better Type Handling
- Explicit `Number()` conversion for numeric fields
- Explicit `String()` conversion and `.trim()` for text fields

### ✅ Better Data Validation
- Added fallback values
- Ensured no null/undefined values
- Trimmed whitespace

### ✅ Better Error Logging
- Console logs show exact payload sent
- Console shows detailed error information
- Network tab shows backend response

### ✅ Better User Feedback
- Error alerts show specific issues
- Suggests common causes
- Tells you to check console

---

## Next Steps

1. **Try saving a prescription again**
2. **Open Browser Console (F12)**
3. **Look for the "📤 Sending prescription payload:" log**
4. **Compare payload with backend expectations**
5. **Check "Network" tab for actual error response**
6. **Share the error message from Network tab**

---

## If Still Getting 400 Error

You'll need to share with me:

1. **The exact error message from the Network tab Response**
2. **The payload being sent (from console logs)**
3. **Your backend C# model definition**
4. **Any validation attributes on the backend**

This will help pinpoint the exact mismatch!

