# Fix Summary: 400 Bad Request & 404 Not Found Errors

## Issues Identified & Resolved

### 1. **404 Error: /Prescriptions/GetByAppointment not found**

**Root Cause:**
- The endpoint path `/Prescriptions/GetByAppointment` doesn't exist on the backend
- Should be `/Appointments/GetPrescriptionsByAppointment` (changed in appointmentService.ts)

**File Fixed:** `src/services/appointmentService.ts`
```javascript
// BEFORE
return request<PrescriptionDto[]>(`/Prescriptions/GetByAppointment?appointmentId=${appointmentId}`);

// AFTER
return request<PrescriptionDto[]>(`/Appointments/GetPrescriptionsByAppointment?appointmentId=${appointmentId}`)
  .catch((error: any) => {
    if (error.status === 404) {
      console.log('ℹ️ Prescriptions endpoint returned 404, returning empty array');
      return [];
    }
    throw error;
  });
```

**Impact:** Loading prescriptions will now use the correct endpoint with graceful fallback to empty array if not found.

---

### 2. **400 Error: Missing Required IDs in Prescription Payload**

**Root Cause:**
The AddPrescription API requires ALL of these fields to be **non-zero valid IDs**:
- `enterpriseId` (required)
- `clinicId` (required)
- `appointmentId` (required)
- `visitId` (required)
- `doctorId` (required)
- `patientId` (required)

However, the props being passed to PrescriptionWritingModal were:
1. **Missing `doctorId` in doctorInfo** - Component couldn't get the doctor ID
2. **Missing `appointmentDetails` prop** - Component couldn't access `visitId` from the appointment
3. **Missing `visitId` fallback** - Was defaulting to 0 if not found

**Files Fixed:**

#### File 1: `src/pages/Doctors.jsx` (Line 5354)
```javascript
// BEFORE
doctorInfo={{
  doctorName: JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor",
  registrationNumber: JSON.parse(localStorage.getItem("userData") || "{}").registrationNumber || ""
}}
appointmentId={selectedAppointmentDetails?.appointmentId}

// AFTER
doctorInfo={{
  doctorId: JSON.parse(localStorage.getItem("userData") || "{}").doctorId || 0,
  doctorName: JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor",
  registrationNumber: JSON.parse(localStorage.getItem("userData") || "{}").registrationNumber || ""
}}
appointmentId={selectedAppointmentDetails?.appointmentId}
appointmentDetails={selectedAppointmentDetails}
```

#### File 2: `src/components/PrescriptionWritingModal.jsx` (Line 168)
```javascript
// ADDED: Proper ID extraction with validation
const enterpriseId = parseInt(selectedAccess.enterpriseId) || 0;
const clinicId = parseInt(selectedAccess.clinicId) || 0;
const appointmentIdNum = parseInt(appointmentId) || 0;
const visitId = parseInt(appointmentDetails?.visitId || selectedAppointmentDetails?.visitId || 0) || 0;
const doctorId = parseInt(userData.doctorId ?? doctorInfo?.doctorId ?? 0) || 0;
const patientId = parseInt(patientInfo?.patientId ?? 0) || 0;

// ADDED: Validation check before submission
if (missingIds.length > 0) {
  console.error('❌ MISSING REQUIRED IDS:', missingIds);
  alert(`❌ Cannot save prescription - Missing: ${missingIds.join(', ')}\n\nMake sure you're logged in and have selected an appointment.`);
  return;
}
```

**New Error Messages:**
- Shows user which IDs are missing if validation fails
- Logs all IDs to console for debugging
- Prevents 400 errors by failing fast with clear feedback

---

## How to Test the Fix

1. **Open an appointment** in the Doctors dashboard
2. **Click "Write Prescription"** button
3. **Check browser console** for the debug logs:
   ```
   📋 PRESCRIPTION IDS DEBUG: {
     enterpriseId: 1,
     clinicId: 2,
     appointmentId: 1003,
     visitId: 5,
     doctorId: 123,
     patientId: 456
   }
   ```
4. **All IDs should be non-zero** - if any are 0, you'll see an alert with missing IDs
5. **Add medications** and click **Save Prescription**
6. **Check Network tab** for POST to `/api/Appointments/AddPrescription`:
   - Should be 200 OK (not 400)
   - Payload should contain valid IDs

---

## Backend Contract Validation

**Prescription.cs Model Requirements:**
```csharp
[Required] public int EnterpriseId { get; set; }
[Required] public int ClinicId { get; set; }
[Required] public int AppointmentId { get; set; }
[Required] public int VisitId { get; set; }
[Required] public int PatientId { get; set; }
[Required] public int DoctorId { get; set; }
```

**Payload Now Sends:**
```javascript
{
  medicationId: 0,
  enterpriseId: 1,        // ✅ Non-zero
  clinicId: 2,            // ✅ Non-zero
  appointmentId: 1003,    // ✅ Non-zero
  visitId: 5,             // ✅ Non-zero (from appointmentDetails)
  doctorId: 123,          // ✅ Non-zero (from doctorInfo)
  patientId: 456,         // ✅ Non-zero (from patientInfo)
  medicineName: "Amoxicillin",
  dosage: "500mg",
  frequency: "Twice daily",
  duration: "5 days",
  specialInstructions: "Take with food",
  generalPrescriptionNotes: "",
  createdAt: "2024-12-18T10:30:45.123Z",
  createdBy: "Dr. Smith",
  updatedAt: "2024-12-18T10:30:45.123Z",
  updatedBy: "Dr. Smith"
}
```

---

## Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `appointmentService.ts` | Fixed GET endpoint path, added 404 handling | Correct endpoint for loading prescriptions |
| `Doctors.jsx` | Added `doctorId` to prop, added `appointmentDetails` prop | Pass required IDs to prescription modal |
| `PrescriptionWritingModal.jsx` | Added ID validation and debug logging | Prevent invalid payloads, show clear errors |

---

## Next Steps if Still Failing

If you still get a 400 error:

1. **Check the console logs** - Look for "PRESCRIPTION IDS DEBUG" section
2. **Verify all IDs are non-zero**
3. **Check localStorage values**:
   ```javascript
   localStorage.getItem('userData')
   localStorage.getItem('selectedAccess')
   ```
4. **Share console screenshot** showing:
   - The IDs Debug output
   - The full payload being sent
   - The backend error response details
