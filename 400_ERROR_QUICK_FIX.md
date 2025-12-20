# 400 Error - Quick Fix Checklist

## Immediate Action Items

### 1. Test Again & Check Console
```
1. Open Browser DevTools (F12 → Console tab)
2. Try saving a prescription
3. Look for "📡 ADDPRESCRIPTION API CALL" message
4. Copy the entire payload shown in console
5. Verify all types and values
```

### 2. Check Network Tab Response
```
1. DevTools → Network tab
2. Find the failed POST to AddPrescription
3. Click on Response tab
4. Note exact error message from backend
5. Share this error message with details
```

---

## Most Likely Issues (Fix These First)

### Issue A: Invalid Patient ID
**Check if:**
```javascript
// In console, check if patientId is valid:
JSON.parse(localStorage.getItem('userData'))
// Should show: { patientId: 123, ... }
// NOT: { patientId: undefined, ... }
```

**If broken:**
- Make sure you selected a patient before opening prescription modal
- Verify patient ID is visible in your appointment details

### Issue B: Missing Enterprise/Clinic Context
**Check if:**
```javascript
// In console, run this:
JSON.parse(localStorage.getItem('selectedAccess'))
// Should show: { 
//   enterpriseId: 123, 
//   clinicId: 456, 
//   ...
// }
```

**If broken:**
- You need to properly log in and select clinic/enterprise
- Ensure you stayed logged in

### Issue C: Empty Medicine Fields
**Check if:**
```javascript
// These should NOT be empty:
- Medicine Name: "Amoxicillin" (not "")
- Dosage: "500mg" (not "")
- Frequency: "Twice daily" (not "")
- Duration: "5 days" (not "")
```

**If broken:**
- Fill in all required medicine fields before saving
- Red asterisk (*) marks required fields

---

## Testing Steps

### Step 1: Fill Prescription Form
```
✅ Select medicine name (use search)
✅ Enter dosage: 500mg
✅ Select frequency: Twice daily
✅ Enter duration: 5 days
✅ Optional: Add instructions
```

### Step 2: Open DevTools
```
F12 → Console tab
(Keep it open while testing)
```

### Step 3: Save Prescription
```
Click "💊 Save Prescription" button
```

### Step 4: Check Logs
```
Look for:
📡 ADDPRESCRIPTION API CALL
└─ Shows all payload details
```

### Step 5: If Error Occurs
```
Look for:
❌ ADDPRESCRIPTION API ERROR
└─ Shows what went wrong
```

### Step 6: Check Network Tab
```
DevTools → Network tab
Find POST to AddPrescription
Click on it → Response tab
Copy error message exactly
```

---

## What Each Field Should Contain

```
medicationId       → 0 (always 0 for new)
enterpriseId       → Number like: 123
clinicId           → Number like: 456  
appointmentId      → Number (can be 0)
visitId            → 0 (always 0)
doctorId           → Number like: 789
patientId          → Number like: 991 (MUST be valid!)
medicineName       → Text like: "Amoxicillin"
dosage             → Text like: "500mg"
frequency          → Text like: "Twice daily"
duration           → Text like: "5 days"
specialInstructions→ Text like: "Take with food" (optional)
generalPrescriptionNotes → "" (empty string)
createdAt          → ISO date: "2025-12-18T10:30:45.123Z"
createdBy          → Doctor name: "Dr. Smith"
updatedAt          → ISO date: "2025-12-18T10:30:45.123Z"
updatedBy          → Doctor name: "Dr. Smith"
```

---

## Common 400 Errors & Fixes

### Error: "PatientId cannot be 0"
**Fix:** Select a valid patient before opening prescription modal

### Error: "EnterpriseId required"
**Fix:** Check localStorage has `selectedAccess` with enterpriseId

### Error: "MedicineName cannot be empty"
**Fix:** Select or type a medicine name before saving

### Error: "Invalid date format"
**Fix:** Already fixed - we use ISO 8601 format automatically

### Error: "DoctorId is required"
**Fix:** Make sure you're logged in as a doctor with doctorId in userData

---

## Backend Validation Checklist

The backend likely validates these rules. Make sure:

```
✅ patientId > 0 (not 0, not null)
✅ enterpriseId >= 0 (can be 0)
✅ clinicId >= 0 (can be 0)
✅ doctorId >= 0 (can be 0)
✅ medicineName is not empty
✅ dosage is not empty
✅ frequency is not empty
✅ duration is not empty
✅ createdAt is valid ISO date
✅ createdBy is not empty
✅ updatedAt is valid ISO date
✅ updatedBy is not empty
```

---

## If Still Getting 400

Please share with me:

1. **Screenshot of console payload** (the 📡 ADDPRESCRIPTION API CALL section)
2. **Screenshot of Network tab Response** (the error message)
3. **Your backend endpoint definition** (C# model or similar)
4. **Any validation attributes** on backend fields

This will let me pinpoint exactly what's mismatched!

---

## Quick Reference: Field Types

```typescript
// NUMBERS (not strings)
medicationId: 0                  // type: number
enterpriseId: 123                // type: number
clinicId: 456                    // type: number
appointmentId: 0                 // type: number
visitId: 0                        // type: number
doctorId: 789                     // type: number
patientId: 991                    // type: number

// STRINGS (not numbers)
medicineName: "Amoxicillin"      // type: string
dosage: "500mg"                  // type: string
frequency: "Twice daily"         // type: string
duration: "5 days"               // type: string
specialInstructions: "With food" // type: string
generalPrescriptionNotes: ""     // type: string
createdBy: "Dr. Smith"           // type: string
updatedBy: "Dr. Smith"           // type: string

// DATE STRINGS (ISO 8601 format)
createdAt: "2025-12-18T10:30:45.123Z"  // type: string
updatedAt: "2025-12-18T10:30:45.123Z"  // type: string
```

---

## 💡 Pro Tip

If the error message isn't showing in the Network tab Response, check:
1. **Console tab** for logged error
2. **Application tab** → Check localStorage
3. **Elements tab** → Check if modal is still open/has data

All data is logged to console now!

