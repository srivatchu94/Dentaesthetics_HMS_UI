# Quick Reference: Complete Prescription Workflow

## Components & Features

### 1️⃣ **PrescriptionModal** - Write Prescriptions
**Location**: Click medication → fills in details
**Footer Buttons**:
- 🖨️ Print Preview (Orange) - Preview for printing
- ✓ Apply to Diagnosis (Blue) - Transfer to diagnosis form
- 💾 Save Prescription (Rose) - Save to database

**Key Function**: `handleApplyPrescription()`
```javascript
// Formats medications and applies to diagnosis form
Amoxicillin 500mg - 2x daily for 10 days (Take with water)
```

---

### 2️⃣ **VisitInfoModal** (Diagnosis Modal) - Record Visit
**Features**:
- Chief Complaint textarea
- Diagnosis textarea
- Treatment Provided textarea
- **Prescriptions field** with conditional View button
- Additional Notes textarea

**Condition**: View button appears when `visitForm.prescriptions` is not empty

---

### 3️⃣ **ViewPrescriptionModal** [NEW] - View & Edit
**Opens from**: "View Prescription" button in diagnosis modal
**Shows**:
- Patient Info (Name, ID, Contact, Date)
- Clinic Info (Name, Address, Phone)
- Medications with Dosage/Frequency/Duration
- Additional Notes (if any)

**Footer Buttons**:
- ✕ Close (White)
- ✏️ Edit Prescription (Cyan) - Opens PrescriptionModal with data
- 🖨️ Print Prescription (Orange) - Opens PrintPreviewModal

---

### 4️⃣ **PrintPreviewModal** - Professional Printing
**Shows**:
- Clinic header with logo space
- Doctor name & registration
- Patient name, ID, date
- **Medications Table**:
  | Medicine | Dosage | Frequency | Duration |
  |----------|--------|-----------|----------|
  | Name | Dose | Freq | Days |

- Special Instructions section
- Additional Notes section
- Signature area
- Print Footer

**Actions**:
- 🖨️ Print Now - Opens system print dialog
- 📧 Email - Sends to patient email
- 💬 WhatsApp - Sends prescription via WhatsApp

---

### 5️⃣ **AddMedicationModal** - Inventory Management
**Opens from**: "Add to Inventory" button in prescription medication dropdown
**Form Fields**:
- Medication Name (required)
- Item Code (auto-generated)
- Category dropdown
- Sub-category
- Dosage Forms
- Manufacturer
- Generic Name
- Unit of Measure
- Reorder Level
- Active checkbox

**Saves to**: Inventory Master (`/Inventory/CreateInventoryMaster`)

---

## Complete User Flow

```
Doctor opens Appointment
    ↓
Clicks "Add Visit" → VisitInfoModal opens
    ↓
Fills in Chief Complaint, Diagnosis, Treatment
    ↓
Clicks "Prescribe" button → PrescriptionModal opens
    ↓
Searches & selects medication from dropdown
    ↓
Fills Dosage, Frequency, Duration, Instructions
    ↓
Clicks "+ Add Medication" → adds to list
    ↓
Repeats for other medications
    ↓
Clicks "✓ Apply to Diagnosis"
    ↓
Prescription transfers to diagnosis form (formatted text)
    ↓
Modal closes, prescription appears in textbox
    ↓
In diagnosis modal, clicks "👁️ View" (when prescriptions exist)
    ↓
ViewPrescriptionModal opens with all details
    ↓
Doctor can:
  - Click "✏️ Edit" → returns to PrescriptionModal to modify
  - Click "🖨️ Print" → opens professional printable layout
  - Click "✕ Close" → closes modal
    ↓
Clicks "💾 Save Visit" in diagnosis modal
    ↓
Visit saved to /Patient/AddPatientVisit endpoint
```

---

## API Endpoints Used

| Operation | Endpoint | Payload |
|-----------|----------|---------|
| Save Visit/Prescription | `/Patient/AddPatientVisit` | PatientVisitInformation |
| Add Medication | `/Inventory/CreateInventoryMaster` | InventoryMaster |
| Get Medications | `/Inventory/GetInventoryMasters` | (GET) |

---

## Animations

All modals use:
- **Initial**: Scale 0.9, Opacity 0
- **Animate**: Scale 1, Opacity 1
- **Exit**: Scale 0.9, Opacity 0
- **Physics**: Spring with stiffness 300, damping 30

Medication lists have staggered animations with 0.1s delays between items.

---

## State Management

```javascript
// Top-level (Doctors.jsx)
const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);
const [prescriptionForm, setPrescriptionForm] = useState({...});
const [savedPrescription, setSavedPrescription] = useState(null);
const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);

// Inside PrescriptionModal
const [localPrescriptionForm, setLocalPrescriptionForm] = useState(prescriptionForm);
// (syncs to parent on save/apply)

// Inside VisitInfoModal  
const [visitForm, setVisitForm] = useState({
  prescriptions: '', // Shows View button when populated
  ...
});
```

---

## Key Features

✅ **Focus Loss Fixed**: No blinking when typing - uses local state in modals
✅ **Smart Formatting**: Medications → readable prescription text
✅ **Professional Print**: All patient/clinic/medication details included
✅ **Edit Capability**: Modify prescriptions from view modal
✅ **Inventory Integration**: Add new medications on-the-fly
✅ **Smooth Animations**: Spring physics for professional appearance
✅ **Mobile Responsive**: Adapts to all screen sizes
✅ **Error Validation**: Alerts for missing required fields
✅ **Loading States**: Disabled buttons during save operations

---

## Testing Commands

**In Browser Console**:
```javascript
// Check prescription data
console.log(localStorage.getItem('prescriptionData'));

// Check saved prescription
console.log(localStorage.getItem('savedPrescription'));

// Clear prescriptions (reset)
localStorage.removeItem('prescriptionData');
localStorage.removeItem('savedPrescription');
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "View Prescription" button not showing | Check if prescriptions field has content |
| Prescription not applying | Ensure at least one medication with name & dosage |
| Modal appears abruptly | Check Framer Motion import (should be installed) |
| Print shows blank | Check if medications are properly populated |
| Medication not saving | Verify inventory endpoint returns success |
| Focus loss while typing | Should be fixed with localPrescriptionForm state |

---

## File Locations

| Component | Lines | File |
|-----------|-------|------|
| PrescriptionModal | 1787-2323 | Doctors.jsx |
| ViewPrescriptionModal [NEW] | 2325-2421 | Doctors.jsx |
| VisitInfoModal | 1137-1521 | Doctors.jsx |
| PrintPreviewModal | 2773-2870 | Doctors.jsx |
| AddMedicationModal | 2424-2771 | Doctors.jsx |
| handleApplyPrescription | 1873-1890 | Doctors.jsx |

---

## Next Steps (Optional Enhancements)

1. **Prescription History**: Store & retrieve past prescriptions per patient
2. **Drug Interactions**: Check for medication conflicts
3. **Refill Management**: Track refill requests
4. **Expiration Dates**: Auto-expire old prescriptions
5. **Insurance Integration**: Check drug coverage
6. **Patient Portal**: Let patients view their prescriptions
7. **Barcode Scanning**: Scan medications during dispensing
8. **Audit Trail**: Log all prescription changes

---

**Version**: 1.0 - Complete ✅
**Last Updated**: 2024
**Status**: Ready for Production

