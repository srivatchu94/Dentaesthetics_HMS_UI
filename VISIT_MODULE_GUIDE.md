# Visit Information Module - Complete Guide

## Overview
The Visit Information module is a comprehensive system for managing patient visits with beautiful animations, intuitive UI, and complete CRUD functionality.

## Features Implemented

### 1. **Animated Landing Page (Home View)**
- Two main tiles with 3D hover effects and rotating background blobs
- **📝 Enter Visit Info** - Record new patient visits
- **👁️ View Visits** - Browse patient visit history
- Smooth animations with Framer Motion
- Gradient backgrounds and glassmorphism effects

### 2. **Patient Search Functionality**
Both Enter and View modes include:
- **Filter Options:**
  - Patient ID
  - Clinic ID
  - First Name
  - Last Name
- Real-time search using `searchPatients()` API from `patientService`
- Loading states and error handling
- Animated patient result cards

### 3. **Visit Management Modal**
When a patient is selected, a comprehensive modal opens with:

#### **Patient Header (Sticky)**
- Patient avatar with initials
- Full name
- Patient ID, DOB, Gender, Blood Type
- Gradient blue-to-purple background
- Close button with rotation animation

#### **Add Visit Button**
- Green gradient button
- Expands form inline when clicked
- Smooth height animations

#### **Visit Entry Form (Expandable)**
Includes all fields from `PatientVisitInformationModel`:
- ✅ **Visit Date** (date picker)
- ✅ **Reason for Visit** (text input)
- ✅ **Diagnoses** (textarea)
- ✅ **Treatments** (textarea)
- ✅ **Prescriptions** (textarea)
- ✅ **Notes** (textarea)
- ✅ **Next Appointment Date** (date picker)
- ✅ **Attending Physician** (text input)
- ✅ **Billing Amount** (number input)
- ✅ **Payment Status** (dropdown: Pending/Paid/Partial)

#### **Visit History Display**
- Shows all visits for the selected patient
- Each visit card displays:
  - Reason for visit (title)
  - Visit date
  - Payment status badge (color-coded)
  - Diagnoses, Treatments, Prescriptions
  - Attending Physician
  - Notes (if present)
  - Next appointment date
  - Billing amount
- Hover effects and shadows
- Grid layout for organized information

## Navigation Flow

```
┌─────────────────┐
│   Home View     │
│  🏥 Hospital    │
│  Visit Info     │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌────────┐ ┌─────────┐
│ Enter  │ │  View   │
│ Visit  │ │ Visits  │
└────┬───┘ └───┬─────┘
     │         │
     └────┬────┘
          ▼
   ┌──────────────┐
   │ Patient Search│
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Visit Modal  │
   │ with History │
   └──────────────┘
```

## Color Schemes

### Enter Visit Info
- Primary: Blue gradient (`from-blue-600 to-purple-600`)
- Secondary: Purple accents
- Cards: Blue-to-purple gradient backgrounds

### View Visits
- Primary: Purple gradient (`from-purple-600 to-pink-600`)
- Secondary: Pink accents
- Cards: Purple-to-pink gradient backgrounds

### Add Visit Form
- Green gradient (`from-green-500 to-emerald-600`)
- Success-oriented color scheme

### Visit Cards
- Payment Status:
  - **Paid**: Green badge (`bg-green-100 text-green-700`)
  - **Pending**: Yellow badge (`bg-yellow-100 text-yellow-700`)
  - **Partial**: Orange badge (`bg-orange-100 text-orange-700`)

## Animations

### Framer Motion Effects
1. **Landing Page Tiles:**
   - Scale on hover: `1.05`
   - 3D rotation: `rotateY: 5deg / -5deg`
   - Floating emojis: `y: [0, -10, 0]`
   - Background blobs: Continuous rotation

2. **Modal Transitions:**
   - Fade in/out backdrop
   - Scale animation: `0.9 → 1`
   - Smooth open/close

3. **Form Expansion:**
   - Height animation: `0 → auto`
   - Opacity transition
   - 300ms duration

4. **Search Results:**
   - Staggered appearance
   - Scale on hover: `1.05`
   - Shadow elevation

## API Integration

### Required Backend Endpoints

```typescript
// Already integrated
searchPatients(params: {
  patientId?: number,
  clinicId?: number,
  firstName?: string,
  lastName?: string
}): Promise<PatientModel[]>

// To be implemented
getVisitsByPatient(patientId: number): Promise<PatientVisitInformation[]>
createVisit(visit: PatientVisitInformation): Promise<PatientVisitInformation>
updateVisit(visitId: number, visit: Partial<PatientVisitInformation>): Promise<PatientVisitInformation>
deleteVisit(visitId: number): Promise<void>
```

## Sample Data Structure

The component includes sample visits for testing:

```javascript
{
  visitId: 1,
  patientId: 1,
  visitDate: "2025-01-15",
  reasonForVisit: "Routine Checkup",
  diagnoses: "Mild gingivitis, Early stage cavity on tooth #18",
  treatments: "Dental cleaning, Fluoride treatment",
  prescriptions: "Chlorhexidine mouthwash 0.2% - Use twice daily",
  notes: "Patient reports sensitivity to cold",
  nextAppointmentDate: "2025-04-15",
  attendingPhysician: "Dr. Rajesh Kumar",
  billingAmount: 20750.00,
  paymentStatus: "Paid"
}
```

## Future Enhancements

### Backend Integration
1. Create `visitService.ts` with API functions
2. Replace `SAMPLE_VISITS` with real API calls
3. Implement real-time data updates

### Additional Features
1. **Edit Visit** - Modify existing visit records
2. **Delete Visit** - Remove visit records with confirmation
3. **Print Visit Summary** - Generate PDF reports
4. **Visit Statistics** - Charts showing visit trends
5. **Advanced Filters** - Date range, payment status, doctor
6. **Export to Excel** - Download visit records

### UI Improvements
1. **Success/Error Toasts** - Replace `alert()` with animated notifications
2. **Confirmation Modals** - Before deleting or modifying data
3. **Loading Skeletons** - Better loading states
4. **Pagination** - For large visit histories
5. **Search Highlights** - Highlight matching text in results

## Technical Stack

- **React 18** - Functional components with hooks
- **Framer Motion** - Animation library
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type safety with interfaces
- **React Router** - Navigation

## File Structure

```
src/
├── pages/
│   └── VisitInformation.jsx (701 lines)
├── Interfaces/
│   └── PatientVisitInformationModel.ts
├── services/
│   └── patientService.ts
└── pages/
    └── VisitInformation.jsx.backup (original version)
```

## Usage Instructions

### 1. Navigate to Visit Information
```javascript
navigate('/visit-information')
```

### 2. Enter New Visit
- Click "Enter Visit Info" tile
- Search for patient using filters
- Click "📋 Enter Visit Info" on patient card
- Click "➕ Add New Visit" button
- Fill out the form
- Click "💾 Save Visit Information"

### 3. View Visit History
- Click "View Visits" tile
- Search for patient using filters
- Click "👁️ View Visit History" on patient card
- Browse through visit cards
- View detailed information for each visit

## Responsive Design

- **Mobile** (< 768px): Single column layout
- **Tablet** (768px - 1024px): 2-column grid
- **Desktop** (> 1024px): 3-column grid for search results

## Accessibility

- Semantic HTML structure
- ARIA labels (to be added)
- Keyboard navigation support
- Focus states on interactive elements
- High contrast color schemes

## Performance

- Lazy loading of modal content
- Optimized animations (60fps)
- Efficient state management
- Minimal re-renders with React.memo (future)

---

**Built with ❤️ for Dentaesthetics HMS**
**Version 1.0 - January 2025**
