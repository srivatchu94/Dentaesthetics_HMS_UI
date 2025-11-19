# Visit Information Module

## Overview
The Visit Information module provides comprehensive management of patient visits, diagnoses, treatments, and prescriptions. It features a modern, gradient-styled interface with purple/indigo theme that matches the Doctor's dashboard.

## Features

### 1. Visit Management
- **View All Visits**: Display all patient visits with complete information
- **Search & Filter**: Search by patient name, diagnosis, or reason; filter by payment status
- **Visit Details**: View comprehensive visit information including:
  - Patient demographics (name, age, gender)
  - Visit date and clinic information
  - Attending physician
  - Reason for visit
  - Diagnosis and treatments provided
  - Current prescriptions
  - Clinical notes
  - Next appointment date
  - Billing amount and payment status

### 2. Prescription Management
- **View Prescriptions**: See current prescriptions associated with each visit
- **Edit Prescriptions**: Modify prescription details with a dedicated modal
- **Doctor Information Display**: Shows doctor's name and registration number on prescriptions
- **Prescription Editor**: Large text area for detailed prescription entry
- **Save & Send**: Save prescriptions and associate them with visit information

### 3. User Interface
- **Gradient Theme**: Beautiful violet-to-purple gradients matching the Doctors dashboard
- **Responsive Design**: Works on all screen sizes
- **Animated Interactions**: Smooth transitions and hover effects
- **Status Indicators**: Color-coded payment status badges
- **Search & Filters**: Easy-to-use search and filter controls

## File Structure

```
src/
├── pages/
│   └── VisitInformation.jsx       # Main visit information page
├── Interfaces/
│   ├── PatientVisitInformationModel.ts  # Visit data model
│   └── PrescriptionModel.ts       # Prescription data model
├── services/
│   └── visitService.ts            # API service for visits & prescriptions
└── components/
    └── Header.jsx                 # Updated with Visits navigation
```

## Data Models

### PatientVisitInformation
```typescript
interface PatientVisitInformation {
  visitId: number;
  patientId: number;
  clinicId: number;
  visitDate: string;
  reasonForVisit: string;
  diagnoses: string;
  treatments: string;
  prescriptions: string;
  notes: string;
  nextAppointmentDate: string;
  attendingPhysician: string;
  billingAmount: number;
  paymentStatus: string;
}
```

### Prescription
```typescript
interface Prescription {
  prescriptionId?: number;
  visitId: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  doctorRegistrationNumber: string;
  prescriptionDate: string;
  prescriptionContent: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

## API Service

### Visit Service
- `getAllVisits()`: Get all visits
- `getVisitById(visitId)`: Get specific visit
- `getVisitsByPatientId(patientId)`: Get visits for a patient
- `getVisitsByClinicId(clinicId)`: Get visits for a clinic
- `getVisitsByDateRange(startDate, endDate)`: Get visits in date range
- `createVisit(visit)`: Create new visit
- `updateVisit(visitId, visit)`: Update existing visit
- `deleteVisit(visitId)`: Delete visit
- `searchVisits(searchTerm)`: Search visits

### Prescription Service
- `getAllPrescriptions()`: Get all prescriptions
- `getPrescriptionById(prescriptionId)`: Get specific prescription
- `getPrescriptionsByVisitId(visitId)`: Get prescriptions for a visit
- `getPrescriptionsByPatientId(patientId)`: Get prescriptions for a patient
- `getPrescriptionsByDoctorId(doctorId)`: Get prescriptions by doctor
- `createPrescription(prescription)`: Create new prescription
- `updatePrescription(prescriptionId, prescription)`: Update prescription
- `deletePrescription(prescriptionId)`: Delete prescription
- `sendPrescription(prescriptionId, method)`: Send prescription via email/SMS

## Usage

### Accessing the Module
Navigate to `/visits` in the application or click the "Visits" tab in the header navigation.

### Viewing Visits
- All visits are displayed in card format with color-coded status indicators
- Each card shows patient information, diagnosis, treatments, and prescriptions
- Use the search bar to find specific visits by patient name or diagnosis
- Filter by payment status using the dropdown

### Managing Prescriptions
1. Click "Edit Prescription" button on any visit card
2. The prescription modal opens with:
   - Doctor's name and registration number (auto-populated)
   - Patient information from the visit
   - Diagnosis details
   - Text area for prescription content
3. Enter or modify prescription details
4. Click "Save & Send Prescription" to save
5. Success message confirms the prescription was saved

### Sample Prescription Format
```
Rx

1. Amoxicillin 500mg - Take 1 capsule three times daily for 7 days
2. Ibuprofen 400mg - Take as needed for pain, every 6-8 hours
3. Chlorhexidine mouthwash 0.2% - Rinse twice daily after brushing

Instructions: Avoid hard foods, maintain oral hygiene
Follow-up: Schedule appointment in 1 week
```

## Color Scheme

The module uses a purple/indigo gradient theme to match the Doctors dashboard:

- **Background**: `from-indigo-50 via-purple-50/40 to-pink-50/30`
- **Headers**: `from-violet-500 to-purple-500`
- **Cards**: `from-violet-50 to-purple-50`
- **Buttons**: `from-violet-600 to-purple-600`
- **Status Badges**:
  - Paid: `from-emerald-500 to-teal-500`
  - Pending: `from-amber-500 to-orange-500`
  - Overdue: `from-red-500 to-rose-500`

## Integration Points

1. **Header Navigation**: Added "Visits" tab with purple gradient styling
2. **App Routing**: Route `/visits` mapped to VisitInformation component
3. **Doctor Context**: Uses doctor information (name, registration number) for prescriptions
4. **Patient Data**: Links to patient records via patientId
5. **Clinic Data**: Links to clinic records via clinicId

## Future Enhancements

- Print prescription functionality
- Email/SMS prescription delivery
- Prescription templates
- Drug interaction warnings
- Prescription history view
- Export visit records to PDF
- Appointment booking from visit details
- Integration with billing system
- Multi-language prescription support
- Electronic signature for prescriptions

## Notes

- Currently uses sample data; replace with actual API calls to backend
- Doctor information should come from authentication context
- Prescriptions are stored as text; consider structured format for medications
- Consider adding prescription validation and drug database integration
- Implement access control based on user roles (doctors can write, nurses can view)
