# Diagnosis Feature Implementation - Auto-Fill from APIs

## Overview
When a doctor clicks on the **🩺 Diagnosis** button in the appointment details modal, the system now automatically calls two APIs to fetch and pre-fill the diagnosis form with relevant patient information.

## Implementation Details

### 1. **New API Functions Added** (`src/api/hmsApi.ts`)

Two new TypeScript functions have been added to handle the API calls:

#### a) `getPatientVisit(appointmentId: number)`
- **Purpose**: Fetches visit details for a specific appointment
- **Endpoint**: `POST /Visit/GetPatientVisit?AppointmentID={appointmentId}`
- **Returns**: Visit data including `patientId`
- **Used to**: Extract the patient ID needed for the second API call

#### b) `getMedicalInfoSummary(patientId: number)`
- **Purpose**: Fetches the patient's medical information summary
- **Endpoint**: `GET /Patient/GetMedicalInfoSummary?patientId={patientId}`
- **Returns**: Medical information including diagnosis, treatment, medications, and notes
- **Used to**: Pre-fill the diagnosis form with existing medical data

### 2. **Updated DiagnosisModal Component** (`src/components/DiagnosisModal.jsx`)

#### Changes Made:
- **Imported new API functions**: Added imports for `getPatientVisit` and `getMedicalInfoSummary`
- **Enhanced useEffect Hook**: Modified the data-fetching logic to:
  1. Call `getPatientVisit()` to get visit details and extract `patientId`
  2. Call `getMedicalInfoSummary()` with the extracted `patientId`
  3. Auto-fill the form fields with fetched medical information
  4. Fall back gracefully if APIs are unavailable (form remains empty for manual entry)

#### Data Flow:
```
User clicks "🩺 Diagnosis" button
    ↓
DiagnosisModal opens with appointmentId
    ↓
useEffect triggers:
    ├─ Call 1: getPatientVisit(appointmentId)
    │   └─ Extract patientId from response
    │
    ├─ Call 2: getMedicalInfoSummary(patientId)
    │   └─ If available, auto-fill form fields:
    │       ├─ diagnosis
    │       ├─ treatment
    │       ├─ medications
    │       └─ notes
    │
    └─ Call 3: Get existing diagnosis (if any)
        └─ If exists, override auto-filled data with saved diagnosis
```

### 3. **Form Behavior**

#### If Medical Info is Available:
- Form fields are **pre-populated** with data from `getMedicalInfoSummary()`
- Doctor can review and edit the information
- Existing diagnosis data (if saved) takes precedence over medical info summary

#### If Medical Info is NOT Available:
- Form fields appear **empty**
- Doctor can manually enter diagnosis details
- Full editing capability is maintained

#### Error Handling:
- If either API call fails, the component logs a warning but continues loading
- The modal still opens with an empty form for manual entry
- No user-facing error messages (graceful degradation)

## API Response Handling

### getPatientVisit Response Example:
```json
{
  "visitId": 4,
  "patientId": 1015,
  "appointmentId": 123,
  "visitDate": "2026-02-05",
  "reason": "Tooth Ache",
  ...
}
```

### getMedicalInfoSummary Response Example:
```json
{
  "diagnosis": "Cavity in tooth #16",
  "treatment": "Root canal treatment",
  "medications": "Amoxicillin 500mg, Ibuprofen 400mg",
  "notes": "Patient has history of sensitivity",
  ...
}
```

## Console Logging

The implementation includes detailed console logs for debugging:
- `📋 Visit Data:` - Logged when visit data is fetched
- `🏥 Medical Info Summary:` - Logged when medical info is fetched
- `📞 API CALL:` - Logged at the start of each API call
- `✅ FETCHED:` - Logged on successful API call
- `❌ FAILED TO FETCH:` - Logged if API call fails
- `⚠️ Could not fetch:` - Logged when gracefully handling errors

## Testing Checklist

- [ ] Click diagnosis button on an appointment with existing medical info
- [ ] Verify form fields are auto-populated with correct data
- [ ] Click diagnosis button on an appointment without medical info
- [ ] Verify form remains empty and can be manually filled
- [ ] Edit pre-filled information and save
- [ ] Verify saved diagnosis persists on modal reopen
- [ ] Check browser console for correct API calls and logging
- [ ] Test error scenarios (network failures, missing data)

## Files Modified

1. **src/api/hmsApi.ts**
   - Added `getPatientVisit()` function
   - Added `getMedicalInfoSummary()` function

2. **src/components/DiagnosisModal.jsx**
   - Updated imports to include new API functions
   - Enhanced useEffect to call both APIs
   - Implemented auto-fill logic with prioritization

## Notes

- The implementation uses async/await for clean error handling
- Previous diagnosis data (if exists) takes precedence over medical info summary
- The loading spinner is shown while APIs are being called
- All API calls include proper error boundaries and logging
- The feature is backward compatible with existing functionality
