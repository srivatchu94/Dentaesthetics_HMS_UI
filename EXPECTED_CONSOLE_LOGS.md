# 📋 Expected Console Logs - Complete Reference

## When Everything Works ✅

### Step 1: Page Loads (First Time)
```
🎨 PrescriptionPrint: Adding print styles
✅ Print styles injected { styleId: 'prescription-print-styles', length: 1245 }
```
**What it means**: Print styles CSS is ready

---

### Step 2: User Clicks on Appointment (To View/Edit Prescription)
```
(No specific logs - just appointment loads)
```
**What it means**: Appointment details loading

---

### Step 3: User Clicks "Print" Button
```
📋 PRINT PRESCRIPTION HANDLER
✅ Current prescription found
📝 Prescription content length: 450
📅 Prescription date: 2025-01-10
Full prescription object: {
  prescriptionId: 5,
  prescriptionContent: "[{\"medicineName\":\"Paracetamol\",\"dosage\":\"500mg\",...",
  prescriptionDate: "2025-01-10T10:00:00",
  ...
}
```
**What it means**: Prescription data retrieved successfully

Then immediately:
```
📋 PrescriptionPrint mounted with ref: {current: div.prescription-print-container}

📋 PrescriptionPrint Debug Info (grouped output):
  💊 Prescription Data:
    - prescriptionContent: Present (450 chars)
    - prescriptionDate: 2025-01-10
    - Full object: {...}
  
  💊 Medications Extracted: 3 items
    [0]: Paracetamol - 500mg - 2x daily
    [1]: Ibuprofen - 400mg - 1x daily
    [2]: Omeprazole - 20mg - 1x daily
  
  👤 Patient Info:
    - Name: John Doe
    - Full object: {firstName: "John", lastName: "Doe", age: 35, gender: "Male"}
  
  👨‍⚕️ Doctor Info: {doctorName: "Dr. Smith", registrationNumber: "REG123"}
  
  🏥 Clinic Info: Dentaesthetics Dental Clinic
  
  📦 Container Status:
    - Found: true
    - ID: prescription-print-main
    - Classes: prescription-print-container bg-white p-8 w-full max-w-4xl mx-auto
    - HTML length: 15234 chars
```
**What it means**: All prescription data loaded into component successfully

---

### Step 4: Print Modal Opens
```
✅ Prescription container DOM assigned to ref
  - Element: DIV
  - ID: prescription-print-main
  - Classes: prescription-print-container bg-white p-8 w-full max-w-4xl mx-auto
  - HTML Length: 15234 chars
```
**What it means**: Print container ready to display

---

### Step 5: User Clicks "Print Now" Button
```
🖨️ PRINT BUTTON CLICKED

📋 Current prescription: {prescriptionId: 5, prescriptionContent: "[...]", ...}
👤 Patient details: {firstName: "John", lastName: "Doe", ...}

📦 Container Check:
  - Container found: true
  - Container ID: prescription-print-main
  - Container classes: prescription-print-container bg-white...
  - Container parent: DIV
  - Container grandparent: DIV
  - Content visible: true
  - Display: block

🎯 Print command executing...
```
**What it means**: Everything ready, browser print dialog will open

**Then**: Print dialog opens (browser native)

---

## When Something's Wrong ❌

### Problem 1: No Prescription Data

**Console shows**:
```
📋 PRINT PRESCRIPTION HANDLER
❌ No prescription found

Alert popup: "❌ No prescription found to print"
```
**Fix**: 
1. Make sure you're viewing an appointment with a prescription
2. Check if `currentPrescription` is set in Doctors.jsx

---

### Problem 2: Prescription Null

**Console shows**:
```
📋 PrescriptionPrint Debug Info
  💊 Prescription Data:
    ⚠️ Prescription is NULL/UNDEFINED
```
**Fix**:
1. Verify `prescriptionToPrint` was set before modal opened
2. Check Doctors.jsx line 914: `setPrescriptionToPrint(currentPrescription)`

---

### Problem 3: Container Not Found

**Console shows**:
```
📋 PrescriptionPrint Debug Info
  ...
  📦 Container Status:
    - Found: false
```
**Fix**:
1. Check if React rendered the component (look for red JS errors)
2. Verify modal `{showPrescriptionPrintModal && prescriptionToPrint && (` condition
3. Check that PrescriptionPrint component is imported

---

### Problem 4: No Medications

**Console shows**:
```
💊 Medications Extracted: 0 items
```
**Fix**:
1. Check if `prescriptionContent` has data:
   ```
   💊 Prescription Data:
     - prescriptionContent: Missing
   ```
2. Verify prescription was saved with medications before printing

---

### Problem 5: Patient Info Missing

**Console shows**:
```
👤 Patient Info:
  - Name: Missing
  - Full object: {patientName: undefined, firstName: undefined, ...}
```
**Fix**:
1. Check if `selectedAppointmentDetails` has patient data
2. Verify appointment was loaded before printing

---

## Detailed Component Flow 🔄

### Timeline of Logs (Actual Sequence):

```
TIME 1: Page Load
├─ 🎨 Adding print styles
├─ ✅ Print styles injected
└─ 📋 PrescriptionPrint mounted with ref

TIME 2: User Clicks Print (in appointment)
├─ 📋 PRINT PRESCRIPTION HANDLER
├─ ✅ Current prescription found
└─ 📝 Prescription content length: X

TIME 3: Modal Opens & Component Renders
├─ 📋 PrescriptionPrint Debug Info (grouped)
├─ 💊 Prescription Data loaded
├─ 💊 Medications Extracted
├─ 👤 Patient Info loaded
├─ 👨‍⚕️ Doctor Info loaded
├─ 🏥 Clinic Info loaded
├─ 📦 Container Status checked
└─ ✅ Container DOM assigned to ref

TIME 4: User Clicks "Print Now"
├─ 🖨️ PRINT BUTTON CLICKED
├─ 📋 Current prescription verified
├─ 📦 Container Check performed
├─ 🎯 Print command executing
└─ [Browser print dialog opens]
```

---

## Log Interpretation Guide

### 🟢 GREEN Logs = Success
These indicate features are working:
- ✅ Print styles injected
- ✅ Component mounted
- ✅ Container DOM assigned
- ✅ Current prescription found

### 🔵 BLUE Logs = Information
These provide debug data:
- 📋 PrescriptionPrint mounted
- 📋 PRINT PRESCRIPTION HANDLER
- 📋 Current prescription
- 📦 Container Check

### 🟠 ORANGE/YELLOW = Warnings
- ⚠️ Prescription is NULL
- ⚠️ Container not found
- ⚠️ Missing patient info

### 🔴 RED = Errors
- ❌ No prescription found
- ❌ Failed to load
- ❌ Error (with stack trace)

---

## Data Format Examples

### Valid Prescription Object:
```javascript
{
  prescriptionId: 5,
  prescriptionContent: "[{\"medicineName\":\"Paracetamol\",\"dosage\":\"500mg\",\"frequency\":\"2x daily\",\"duration\":\"5 days\",\"specialInstructions\":\"After food\"}]",
  prescriptionDate: "2025-01-10T10:00:00.000Z",
  visitId: 10,
  doctorId: 1
}
```

### Valid Patient Object:
```javascript
{
  firstName: "John",
  lastName: "Doe",
  age: 35,
  gender: "Male",
  patientId: 7,
  patientName: "John Doe",
  // ... other fields
}
```

### Valid Medications Array:
```javascript
[
  "Paracetamol - 500mg - 2x daily - 5 days",
  "Ibuprofen - 400mg - 1x daily - 10 days",
  "Omeprazole - 20mg - 1x daily - 7 days"
]
```

---

## Print Dialog Behavior

### ✅ Correct Behavior:
1. User clicks "Print Now" button
2. Browser native print dialog appears
3. Print preview shows the prescription
4. User selects printer and clicks "Print"
5. Prescription prints

### ❌ Wrong Behavior #1 - Blank Preview:
1. Print dialog appears
2. Preview is completely blank
3. **Cause**: CSS `visibility: hidden` not working correctly
4. **Fix**: Check Print Emulation in DevTools

### ❌ Wrong Behavior #2 - Dialog Doesn't Appear:
1. User clicks "Print Now"
2. Nothing happens
3. **Cause**: `window.print()` blocked or `prescriptionToPrint` null
4. **Fix**: Check console for errors

### ❌ Wrong Behavior #3 - Shows Full Page:
1. Print dialog appears
2. Shows the entire page (buttons, modals, everything)
3. **Cause**: CSS `visibility: hidden` on `body *` not applied
4. **Fix**: Verify style element is in document.head

---

## Debugging Commands

Copy & paste in Console to diagnose:

```javascript
// Check if print style exists
const style = document.getElementById('prescription-print-styles');
console.log('Print style exists:', !!style);
console.log('Style content length:', style?.textContent.length);

// Check container element
const container = document.querySelector('.prescription-print-container');
console.log('Container exists:', !!container);
console.log('Container HTML:', container?.outerHTML.substring(0, 200));

// Check if modal is open
const modal = document.querySelector('[class*="motion"][class*="fixed"]');
console.log('Modal visible:', !!modal);

// Manually trigger print
window.print();
```

---

## Color Legend for This Document

| Symbol | Meaning |
|--------|---------|
| ✅ | Working/Success |
| ❌ | Error/Failure |
| ⚠️ | Warning |
| 📋 | Debug Information |
| 💊 | Prescription Data |
| 👤 | Patient Data |
| 👨‍⚕️ | Doctor Data |
| 🏥 | Clinic Data |
| 📦 | Container/DOM |
| 🖨️ | Print Action |
| 🎯 | Target/Goal |

---

**Version**: 1.0 Complete Log Reference
**Updated**: December 2024
