# 🚀 Prescription Integration - Quick Start Guide

## What's Ready

✅ **Prescription Save Workflow** - Saves medications with success modal and auto-redirect
✅ **View Prescriptions** - Fetches from `GetPrescriptionsByVisit` API  
✅ **Edit Prescriptions** - Edit mode with editable table cells and save functionality
✅ **Patient Medical Context** - Shows chronic diseases and allergies
✅ **Success Feedback** - Animated modal with auto-redirect to diagnosis page

---

## 🔧 One-Time Setup

### Step 1: Replace API Base URL
Find and replace `YOUR_API_BASE_URL` in [src/pages/Doctors.jsx](src/pages/Doctors.jsx):

**Lines to update:**
- Line 1927 (AddPrescription - save)
- Line 2373 (GetPrescriptionsByVisit - fetch)
- Line 2406 (AddPrescription - update)

**Example:**
```javascript
// Before
fetch('YOUR_API_BASE_URL/Appointments/AddPrescription', ...)

// After
fetch('https://your-api-domain.com/api/Appointments/AddPrescription', ...)
```

### Step 2: Verify Backend APIs Ready
Ensure these endpoints are running:
- `POST /Appointments/AddPrescription` - Save/Update prescriptions
- `GET /Appointments/GetPrescriptionsByVisit?visitId=123` - Fetch prescriptions

---

## 📱 How It Works

### Saving Prescriptions
1. Doctor opens appointment
2. Clicks "Add Prescription" → Prescription modal opens
3. Adds medications (name, dosage, frequency, duration, instructions)
4. Clicks "Save Prescription"
5. ✅ Success modal appears
6. 🔄 Auto-redirects to diagnosis page

### Viewing/Editing Prescriptions
1. Doctor clicks "View Prescription" in diagnosis page
2. ViewPrescriptionModal opens
3. Fetches prescriptions from backend
4. Shows table with all medications
5. Click "Edit" → Cells become editable
6. Modify values → Click "Save Changes"
7. ✅ Changes saved to backend

---

## 🧪 Quick Test

### Test Save (1 min)
```
1. Open any appointment
2. Click "Prescription" button
3. Add: Medicine "Aspirin", Dosage "500mg"
4. Click "Save Prescription"
5. Should see green success modal
6. Should redirect to diagnosis page
```

### Test View/Edit (2 min)
```
1. Stay in diagnosis page
2. Click "View Prescription"
3. Should see table with saved prescriptions
4. Click "Edit" button
5. Change dosage to "600mg"
6. Click "Save Changes"
7. Should see success alert
```

---

## 📊 API Contract

### AddPrescription Request
```javascript
POST /Appointments/AddPrescription
{
  "medicationId": 0,
  "enterpriseId": 1,
  "clinicId": 1,
  "appointmentId": 123,
  "visitId": 456,
  "doctorId": 5,
  "patientId": 10,
  "medicineName": "Aspirin",
  "dosage": "500mg",
  "frequency": "Twice Daily",
  "duration": "7 days",
  "specialInstructions": "After meals",
  "generalPrescriptionNotes": "Take with food",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "Dr. Smith"
}
```

### GetPrescriptionsByVisit Request
```javascript
GET /Prescription/GetPrescriptionsByVisit?visitId=456

// Response should be array of prescription objects:
[
  {
    "medicationId": 1,
    "visitId": 456,
    "medicineName": "Aspirin",
    "dosage": "500mg",
    ...
  },
  ...
]
```

---

## ⚠️ Important Requirements

Before testing, verify:
- ✅ `localStorage.authToken` contains valid JWT
- ✅ `selectedAppointmentForVisit` has: enterpriseId, clinicId, appointmentId, visitId, patientId, doctorId
- ✅ Backend APIs are running and accessible
- ✅ CORS enabled if frontend and backend on different domains
- ✅ API returns 200 OK for successful requests

---

## 🐛 Debugging Tips

### Check Network Tab
Open DevTools → Network tab → Save prescription
Should see:
1. GET request to `GetPrescriptionsByVisit` (if viewing)
2. POST request to `AddPrescription` (if saving)
3. Status: 200 OK

### Check Console
Look for any error messages:
```javascript
// Should NOT see these errors:
Failed to save prescription: [error message]
Failed to fetch prescriptions
Visit ID not found
```

### Check localStorage
Open DevTools → Application → localStorage
Verify:
- `authToken` exists and not expired
- `userData` contains doctorId and username

---

## 📋 Checklist Before Production

- [ ] Replace `YOUR_API_BASE_URL` with real endpoint
- [ ] Test save prescription workflow
- [ ] Test view prescription workflow
- [ ] Test edit prescription workflow
- [ ] Verify chronic diseases display correctly
- [ ] Verify allergies display correctly
- [ ] Test on mobile devices
- [ ] Check error handling (try with invalid API key)
- [ ] Monitor API performance (check response times)
- [ ] Enable loading spinners for slow networks

---

## 🎨 UI Components Location

| Component | File | Lines |
|-----------|------|-------|
| PrescriptionModal | src/pages/Doctors.jsx | 1200-2340 |
| ViewPrescriptionModal | src/pages/Doctors.jsx | 2344-2603 |
| PrescriptionSuccessModal | src/pages/Doctors.jsx | 3280-3330 |
| handleSavePrescription | src/pages/Doctors.jsx | 1893-1960 |

---

## 📞 Support

If something isn't working:
1. Check API endpoint is accessible
2. Verify request/response in network tab
3. Check browser console for errors
4. Confirm authorization token is valid
5. Ensure all required fields in payload

---

**Ready to test? Replace API URL and start saving prescriptions! 🎉**
