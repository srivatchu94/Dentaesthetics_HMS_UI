# 🖨️ Prescription Printing - Debugging Guide

## Quick Checklist for Blank Page Issues

### Before Reporting an Issue

- [ ] Browser console is open (F12 → Console tab)
- [ ] You clicked the print button
- [ ] Console shows log entries starting with `🖨️ PRINT BUTTON CLICKED`
- [ ] You can see the logs below

---

## Step-by-Step Debugging

### 1. **Copy Console Logs**

After clicking the print button:
1. Right-click in the console
2. Select **"Save as"** or **"Copy All Logs"**
3. Paste the logs into a text file or share them

### 2. **What to Look For**

**Check these values in the logs:**

```
✅ GOOD SIGNS:
  Window opened: true
  Medications count: > 0 (or = 0 if no meds added)
  Content has patient name: true
  Content has medications: true (if medications exist)
  Total HTML length: > 1000
  Print dialog executed: ✅
```

```
❌ PROBLEMS:
  Window opened: false → Popup blocker issue
  Medications count: 0 → No medications added (might be OK)
  Content has patient name: false → Patient data not selected
  Total HTML length: < 500 → Content not being generated
  Modal found: 0 → Interface issue
```

---

## Common Issues & Solutions

### Issue 1: "Window opened: false"
**Problem**: Browser popup blocker is preventing the print window

**Solution**:
1. Check your browser's popup blocker settings
2. Whitelist this website: `https://localhost:7104`
3. Or disable popup blocker temporarily for testing

**Chrome**: Settings → Privacy and security → Site settings → Pop-ups and redirects
**Firefox**: Preferences → Privacy → Permissions → Pop-ups → Add exception

---

### Issue 2: "Content has patient name: false"
**Problem**: Patient data is not being passed to the print function

**Solution**:
1. Verify you have selected a patient
2. Check that the patient has a first and last name
3. Look at the "Patient:" object in the logs
4. Ensure appointment/visit is selected before printing

**Logs to check**:
```
Medications count: (should be > 0)
Patient: {patientFirstName: "...", patientLastName: "..."}
Prescription text length: (should be > 0)
```

---

### Issue 3: "Total HTML length: < 500"
**Problem**: HTML content is too small, meaning content wasn't generated properly

**Solution**:
1. Check if medications exist (Medications count)
2. Check if patient data exists (Patient object)
3. Verify prescription text is not empty
4. Try adding a medication and prescription text before printing

---

### Issue 4: "Medications count: 0 but should have medications"
**Problem**: Medications were added but aren't in the logs

**Solution**:
1. Scroll up in the visit form to the medications section
2. Add at least one medication
3. Verify it appears in the medications list
4. Then try printing again

---

## Console Log Examples

### ✅ Good Output (Should Print Successfully)

```javascript
🖨️ PRINT BUTTON CLICKED (Patients Page)
📋 Print Preparation Data:
  Medications count: 2
  Medications: Array(2)
    0: {name: "Amoxicillin", dosage: "500mg", frequency: "TDS", duration: "7 days", ...}
    1: {name: "Ibuprofen", dosage: "400mg", frequency: "BID", duration: "5 days", ...}
  Patient: {patientFirstName: "John", patientLastName: "Doe", patientId: 123, ...}
  Prescription text length: 450

📦 Content Preparation:
  medsTable HTML length: 2500
  combinedPrescription length: 450

🪟 Print Window Status:
  Window opened: true

📄 HTML Content:
  Total HTML length: 5234
  Content has patient name: true
  Content has medications: true

🎯 Calling printWindow.focus() and printWindow.print()...
📋 Executing print dialog...
  Window document ready: complete
  Window document title: Prescription - John Doe
✅ Print dialog executed
```

### ❌ Bad Output (Will Show Blank Page)

```javascript
🖨️ PRINT BUTTON CLICKED (Patients Page)
📋 Print Preparation Data:
  Medications count: 0  ⚠️ NO MEDICATIONS
  Patient: {}  ⚠️ EMPTY OBJECT
  Prescription text length: 0  ⚠️ NO TEXT

📦 Content Preparation:
  medsTable HTML length: 0
  combinedPrescription length: 0

🪟 Print Window Status:
  Window opened: false  ❌ POPUP BLOCKED!

📄 HTML Content:
  Total HTML length: 1200  ⚠️ TOO SMALL
  Content has patient name: false  ❌ MISSING DATA
  Content has medications: false  ❌ MISSING MEDS
```

---

## Information to Share When Reporting Issues

When you encounter a blank page issue, please share:

1. **Browser & OS**
   ```
   - Browser: Chrome/Firefox/Safari
   - OS: Windows/Mac/Linux
   - Browser Version: XX.X
   ```

2. **Exact Steps to Reproduce**
   ```
   1. Login to application
   2. Navigate to [Doctor's Space / Patient's Space]
   3. Select appointment/visit
   4. [Any other steps]
   5. Click Print button
   6. See blank page
   ```

3. **Console Logs**
   - Copy the entire console output starting with `🖨️ PRINT BUTTON CLICKED`
   - Include 5-10 lines before and after if possible

4. **What You Expect**
   - Description of what should print

5. **What You See**
   - Description of the blank page or error

---

## Testing Checklist

Before printing:

- [ ] Patient/Appointment is selected
- [ ] Patient has first and last name
- [ ] At least one medication has been added (optional)
- [ ] Prescription details have been entered (optional)
- [ ] Browser console is open
- [ ] Popup blocker is disabled for this site

---

## Advanced Debugging

### Check Medications Array
```javascript
// In browser console, paste this:
const testEl = document.querySelector('[name="medications"]');
console.log('Medications:', testEl?.value);
```

### Check Patient Data
```javascript
// In browser console, paste this:
const patientName = document.querySelector('[data-testid="patient-name"]');
console.log('Patient Name:', patientName?.textContent);
```

### Manually Trigger Print
```javascript
// In browser console, paste this:
window.print();
```

---

## Performance Tips

- ✅ Close unnecessary browser tabs (improves print performance)
- ✅ Clear browser cache if you see old data
- ✅ Disable browser extensions that might interfere with printing
- ✅ Use a modern browser (Chrome, Firefox, Safari latest versions)

---

## Contact Support

If you continue to experience issues:

1. **Gather Information**
   - Console logs (as detailed above)
   - Browser type and version
   - Steps to reproduce
   - Expected vs actual behavior

2. **Share with Development Team**
   - Attach the debug logs
   - Screenshot of the blank page (if applicable)
   - Description of the issue

3. **Provide Access**
   - Share test patient/appointment details if possible

---

**Last Updated**: December 25, 2025
**Debug Version**: 1.0
