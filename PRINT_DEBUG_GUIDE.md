# 🖨️ Prescription Print Debugging Guide

## Overview
This guide helps diagnose and fix prescription printing issues. Comprehensive logging has been added to help identify exactly what's going wrong.

---

## 📋 Step 1: Open DevTools and Console
1. **Open DevTools**: Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. **Go to Console Tab**: Click on the "Console" tab at the top
3. **Keep it open** while you test the print feature

---

## 🔍 Step 2: Test the Print Feature

### What to do:
1. Navigate to a prescription in the Doctors dashboard
2. Click the **Print** button
3. Watch the Console for detailed logging output

### What you'll see:
The console will show **color-coded logs** in this order:

```
🎨 PrescriptionPrint: Adding print styles [GREEN]
✅ Print styles injected [GREEN]
📋 PrescriptionPrint mounted with ref: [BLUE]
📋 PrescriptionPrint Debug Info [GROUPED]
  💊 Prescription Data: [BLUE]
  💊 Medications Extracted: [GREEN]
  👤 Patient Info: [ORANGE]
  👨‍⚕️ Doctor Info: [PURPLE]
  🏥 Clinic Info: [PINK]
  📦 Container Status: [CYAN]
✅ Prescription container DOM assigned to ref [GREEN]

🖨️ PRINT BUTTON CLICKED [RED - LARGE]
📋 Current prescription:
📦 Container Check: [BLUE]
```

---

## 🐛 Common Issues & Solutions

### Issue 1: ❌ "Prescription is NULL/UNDEFINED"
**What it means**: No prescription data was passed to the component

**Check in Console**:
```
💊 Prescription Data: [BLUE]
  ⚠️ Prescription is NULL/UNDEFINED
```

**Solution**:
1. Go to line ~914 in Doctors.jsx: `handlePrintPrescription()`
2. Verify `currentPrescription` has data
3. Check that `setPrescriptionToPrint(currentPrescription)` is called

---

### Issue 2: 📦 Container not found
**What it means**: The prescription HTML element wasn't created

**Check in Console**:
```
📦 Container Status: [BLUE]
  - Found: false
```

**Solution**:
1. Ensure `PrescriptionPrint` component is rendering
2. Check that the modal `{showPrescriptionPrintModal && prescriptionToPrint && (` is true
3. Look for React errors in the console above the logs

---

### Issue 3: 🖨️ Print dialog appears but shows blank page
**What it means**: Print styles are hiding the content incorrectly

**Check in Console**:
```
🎨 PrescriptionPrint: Adding print styles [GREEN]
✅ Print styles injected [GREEN]
```

**Check in Print Preview**:
1. When print dialog opens, look at the preview
2. **The prescription should be visible in preview**

**Solution**:
1. Open DevTools print emulation:
   - F12 → More Tools → Rendering (or search in Command Palette)
   - "Emulate CSS media type" → select **"print"**
2. Now you can see what the page looks like when printed
3. Look for hidden elements, check:
   - Is `.prescription-print-container` visible?
   - Are all child elements visible?
   - Is the background white?

---

### Issue 4: 💳 Payment status buttons are not showing
**Check in Console**:
```
💊 Medications Extracted: [GREEN] 0 items
```

**Solution**:
1. Check if `prescriptionContent` is empty
2. Verify the prescription data includes medications
3. Look at `prescriptionContent` in the logs - should have JSON or text

---

### Issue 5: 👤 Patient name showing "Patient Name" (placeholder)
**Check in Console**:
```
👤 Patient Info: [ORANGE]
  - Name: Missing
```

**Solution**:
1. Check `selectedAppointmentDetails` passed to `PrescriptionPrint`
2. Verify `patientInfo.firstName` and `patientInfo.lastName` exist
3. Or check `patientInfo.patientName`

---

## 📊 Key Data Points to Check

### In Console, look for these exact fields:

#### Prescription Object:
```javascript
{
  prescriptionContent: "..." // Should have medication details
  prescriptionDate: "2025-01-10" // Should have a date
}
```

#### Patient Info:
```javascript
{
  firstName: "John"
  lastName: "Doe"
  age: 35
  gender: "Male"
  patientId: 123
}
```

#### Medications Extracted:
```javascript
// Should be an array with items:
[
  "Medicine 1 - Dosage 2x",
  "Medicine 2 - Dosage 1x",
  ...
]
```

#### Container Status:
```javascript
{
  Found: true,
  ID: "prescription-print-main",
  Classes: "prescription-print-container bg-white p-8...",
  HTML length: 15000 // chars
}
```

---

## 🎯 Print Media Query Testing

### Method: Use Chrome DevTools Print Emulation

1. **Open DevTools**: F12
2. **Rendering Panel**: 
   - Click ⋯ (three dots) in DevTools
   - Select "More tools" → "Rendering"
3. **Emulate CSS Media Type**: Scroll down and find "Emulate CSS media type"
4. **Select "print"**

Now you can see exactly how the page will look when printed.

### What to look for:
- ✅ Background should be **white**
- ✅ Text should be **black or dark gray**
- ✅ Medications table should be **fully visible**
- ✅ No overlays or buttons visible
- ❌ Dark backgrounds should be avoided (use white)
- ❌ No semi-transparent overlays

---

## 🔧 Advanced Debugging

### Check if Print Styles are Applied:

In Console, run:
```javascript
// Check if print stylesheet exists
const style = document.getElementById('prescription-print-styles');
console.log('Print styles found:', !!style);
console.log('Print styles content length:', style?.textContent.length);
```

### Check Container Element:

```javascript
// Find the prescription container
const container = document.querySelector('.prescription-print-container');
console.log('Container:', container);
console.log('Container content:', container?.innerText.substring(0, 200));
console.log('Container computed styles:', window.getComputedStyle(container));
```

### Check Modal Visibility:

```javascript
// Check if modal is visible
const modal = document.querySelector('[class*="modal"]');
console.log('Modal visible:', modal?.style.visibility !== 'hidden');
console.log('Modal display:', window.getComputedStyle(modal).display);
```

---

## 📝 Log Output Locations

### When Prescription Modal Opens:
- **File**: `src/pages/Doctors.jsx`
- **Function**: `handlePrintPrescription()`
- **Line**: ~914
- **Logs**:
  - ✅ Current prescription found
  - 📝 Prescription content length
  - Full prescription object

### When Print Component Mounts:
- **File**: `src/components/PrescriptionPrint.jsx`
- **Lines**: ~4-15 (styles), ~20-25 (mount log)
- **Logs**:
  - 🎨 Print styles injected
  - 📋 Component mounted with ref

### When Print Button Clicked:
- **File**: `src/pages/Doctors.jsx`
- **Line**: ~7220 (Print Now button)
- **Logs**:
  - 🖨️ PRINT BUTTON CLICKED [RED]
  - 📦 Container checks
  - 🎯 Print command executing

### When Component Renders:
- **File**: `src/components/PrescriptionPrint.jsx`
- **Lines**: ~86-123 (detailed debug log)
- **Logs**:
  - 💊 Prescription Data
  - 💊 Medications Extracted
  - 👤 Patient Info
  - 📦 Container Status

---

## ✅ Testing Checklist

- [ ] Console shows no errors (red text)
- [ ] 🎨 Print styles injected [GREEN]
- [ ] 📋 Component mounted successfully
- [ ] 💊 Prescription data is NOT null
- [ ] 💊 Medications extracted > 0 items
- [ ] 👤 Patient info has firstName/lastName
- [ ] 📦 Container found: true
- [ ] Print preview shows prescription content
- [ ] Colors print correctly (use Print Emulation)
- [ ] No blank pages in preview

---

## 🚀 Quick Fix Steps

If print is blank:

1. **Check Console** - Look for errors or "Container: false"
2. **Check Print Emulation** - F12 → Rendering → Emulate print media
3. **Check Prescription Data** - Should not be NULL
4. **Check Container** - Run `document.querySelector('.prescription-print-container')` in console
5. **Verify CSS** - Look at `@media print` styles in DevTools Elements panel

---

## 📞 Reference Commands

### View Prescription Data:
```javascript
const modal = document.querySelector('[class*="motion"]');
const prescription = document.querySelector('.prescription-print-container');
console.log(prescription?.innerText);
```

### Force Print Dialog:
```javascript
window.print();
```

### Check All Active Styles:
```javascript
const container = document.querySelector('.prescription-print-container');
console.log(window.getComputedStyle(container));
```

---

## 🎓 What Each Log Tells You

| Log | Meaning | Action if Missing |
|-----|---------|-------------------|
| 🎨 Adding print styles | CSS styles are being created | Check PrescriptionPrint.jsx line 5 |
| ✅ Print styles injected | CSS successfully added to page | Verify document.head was updated |
| 📋 Mounted with ref | Component rendered & ref assigned | Check if modal is showing |
| 💊 Prescription Data | Prescription object received | Verify currentPrescription in Doctors.jsx |
| 💊 Medications Extracted | Medications parsed from content | Check prescriptionContent format |
| 👤 Patient Info | Patient details received | Verify selectedAppointmentDetails |
| 📦 Container found | DOM element created | Check React error in console |
| ✅ Container DOM assigned | Ref correctly linked to element | Re-render might be needed |
| 🖨️ PRINT CLICKED | Print button was pressed | Click the Print button! |

---

## 🔗 Related Files

- **Main Print Component**: `src/components/PrescriptionPrint.jsx`
- **Doctor Dashboard**: `src/pages/Doctors.jsx` (lines ~914, ~7220)
- **Print Styles**: Inside `PrescriptionPrint.jsx` useEffect (~10-50)

---

## 💡 Pro Tips

1. **Take Screenshots** of console logs if you need to share them
2. **Copy Logs**: Right-click console → Save as file
3. **Use Breakpoints**: Set breakpoint in print button handler to step through code
4. **Check Network Tab**: No API errors while printing?
5. **Test in Different Browsers**: Chrome, Firefox have different print engines

---

**Last Updated**: December 2024
**Version**: 1.0 with Comprehensive Logging
