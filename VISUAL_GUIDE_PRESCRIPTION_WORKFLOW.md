# Prescription Workflow - Visual Reference Guide

## 🎨 Button Color Scheme

```
┌─────────────────────────────────────────────────────────────┐
│         PRESCRIPTION WORKFLOW BUTTON COLORS                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🖨️  PRINT PREVIEW                                          │
│  ├─ Color: Orange → Amber gradient                          │
│  ├─ Code: from-orange-600 to-amber-600                      │
│  ├─ Used in:                                                │
│  │  - PrescriptionModal footer                              │
│  │  - ViewPrescriptionModal footer                          │
│  │  - PrintPreviewModal (Print Now)                         │
│  └─ Purpose: Print prescriptions                            │
│                                                              │
│  ✓ APPLY TO DIAGNOSIS                                       │
│  ├─ Color: Blue → Indigo gradient  [NEW]                    │
│  ├─ Code: from-blue-600 to-indigo-600                       │
│  ├─ Used in:                                                │
│  │  - PrescriptionModal footer (center)                     │
│  └─ Purpose: Transfer prescription to diagnosis form        │
│                                                              │
│  💾 SAVE PRESCRIPTION                                       │
│  ├─ Color: Rose → Pink → Purple gradient                    │
│  ├─ Code: from-rose-600 via-pink-600 to-purple-600          │
│  ├─ Used in:                                                │
│  │  - PrescriptionModal footer (right)                      │
│  │  - SaveMedicationModal                                   │
│  └─ Purpose: Save prescription to database                  │
│                                                              │
│  ✏️  EDIT PRESCRIPTION                                      │
│  ├─ Color: Cyan → Blue gradient  [NEW]                      │
│  ├─ Code: from-cyan-600 to-blue-600                         │
│  ├─ Used in:                                                │
│  │  - ViewPrescriptionModal footer                          │
│  └─ Purpose: Edit existing prescription                     │
│                                                              │
│  👁️  VIEW PRESCRIPTION                                      │
│  ├─ Color: Indigo → Purple gradient  [NEW]                  │
│  ├─ Code: from-indigo-600 to-purple-600                     │
│  ├─ Used in:                                                │
│  │  - VisitInfoModal prescriptions field (right)            │
│  ├─ Visibility: Conditional (only when prescriptions exist) │
│  └─ Purpose: View prescription details                      │
│                                                              │
│  ✕ CLOSE MODAL                                              │
│  ├─ Color: White with border                                │
│  ├─ Code: bg-white border-2 border-stone-300                │
│  ├─ Used in: All modals (top-right or footer-left)          │
│  └─ Purpose: Close modal                                    │
│                                                              │
│  ➕ ADD TO INVENTORY                                        │
│  ├─ Color: Green gradient  [Secondary button]               │
│  ├─ Code: from-green-600 to-emerald-600                     │
│  ├─ Used in:                                                │
│  │  - Medication dropdown (when no match found)             │
│  └─ Purpose: Add medication to inventory                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Button Locations in Each Modal

### PRESCRIPTION MODAL (Top)
```
┌──────────────────────────────────────────────────────────────┐
│  ✏️ Write Prescription                            ✕ Close     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Medication List:                                            │
│  1. Medication Name | Dosage | Frequency | Duration | Delete │
│  2. Medication Name | Dosage | Frequency | Duration | Delete │
│  [+ Add Medication]                                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer:                                                      │
│  [✕ Close]  [🖨️ Print Preview] [✓ Apply] [💾 Save]         │
│             [Orange Gradient]  [Blue]     [Rose]             │
└──────────────────────────────────────────────────────────────┘
```

### DIAGNOSIS MODAL (Middle Left)
```
┌──────────────────────────────────────────────────────────────┐
│  🩺 Diagnosis & Patient Visit                    ✕ Close     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Left Column:                                                │
│  ├─ Patient Info Card                                        │
│  ├─ Chronic Diseases Card                                    │
│  └─ Allergies Card                                           │
│                                                              │
│  Right Column:                                               │
│  ├─ Visit Details:                                           │
│  │  ├─ Visit Date input                                      │
│  │  ├─ Chief Complaint textarea                              │
│  │  ├─ Diagnosis textarea                                    │
│  │  ├─ Treatment textarea                                    │
│  │                                                           │
│  │  ├─ Prescriptions: [👁️ View] (conditional)                │
│  │  │  └─ Text area with formatted prescription              │
│  │  │                                                        │
│  │  ├─ Additional Notes textarea                             │
│  │  └─ Follow-up Date input                                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer:                                                      │
│  [✕ Close]  [💊 Prescribe] [💾 Save Visit]                  │
│                [Purple]        [Green]                       │
└──────────────────────────────────────────────────────────────┘
```

### VIEW PRESCRIPTION MODAL [NEW] (Middle Center)
```
┌──────────────────────────────────────────────────────────────┐
│  📋 Prescription Details                         ✕ Close     │
│     Saved on 15/01/2024                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Patient Information (Blue background)                       │
│  ├─ Name: John Doe                                           │
│  ├─ ID: P123                                                 │
│  ├─ Contact: 9876543210                                      │
│  └─ Date: 15/01/2024                                         │
│                                                              │
│  Clinic Information (Green background)                       │
│  ├─ Clinic: Dental Care Center                               │
│  ├─ Address: 123 Main St                                     │
│  └─ Contact: 040-12345678                                    │
│                                                              │
│  Medications (Animated list)                                 │
│  │ 1. Amoxicillin 500mg - 2x daily for 10 days              │
│  │    (Take with water)                                      │
│  │ 2. Ibuprofen 400mg - 1x daily for 5 days                 │
│  │    (After meals)                                          │
│                                                              │
│  Additional Notes (Amber background)                         │
│  └─ Take with food. Avoid dairy products.                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer:                                                      │
│  [✕ Close] [✏️ Edit] [🖨️ Print]                            │
│             [Cyan]    [Orange]                               │
└──────────────────────────────────────────────────────────────┘
```

### PRINT PREVIEW MODAL (Bottom)
```
┌──────────────────────────────────────────────────────────────┐
│  🖨️ Prescription Print Preview                  ✕ Close    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ═══════════════════════════════════════════════════════     │
│           DENTAL CARE CENTER                                 │
│       Professional Dental Clinic                             │
│       123 Main Street, City, State 12345                     │
│       Phone: 040-12345678 | Email: info@clinic.com           │
│  ═══════════════════════════════════════════════════════     │
│                                                              │
│  ┌─────────────────────┬──────────────────────┐              │
│  │ Dr. Dr. Smith       │ Patient Information  │              │
│  │ Reg: MH-12345       │ Name: John Doe       │              │
│  │ Specialization:     │ ID: P123             │              │
│  │   Dentistry         │ Date: 15/01/2024     │              │
│  └─────────────────────┴──────────────────────┘              │
│                                                              │
│  PRESCRIBED MEDICATIONS                                      │
│  ┌──────────────┬─────────┬───────────┬──────────┐           │
│  │ Medicine     │ Dosage  │ Frequency │ Duration │           │
│  ├──────────────┼─────────┼───────────┼──────────┤           │
│  │ Amoxicillin  │ 500mg   │ 2x daily  │ 10 days  │           │
│  │ Ibuprofen    │ 400mg   │ 1x daily  │ 5 days   │           │
│  └──────────────┴─────────┴───────────┴──────────┘           │
│                                                              │
│  SPECIAL INSTRUCTIONS:                                       │
│  • Amoxicillin: Take with water                              │
│  • Ibuprofen: Take after meals                               │
│                                                              │
│  ADDITIONAL NOTES:                                           │
│  Take with food. Avoid dairy products.                       │
│                                                              │
│  ─────────────────────────────────────────────               │
│                    Dr. Smith                                 │
│            Signature & Stamp                                 │
│                                                              │
│  This is a computer-generated prescription. Signature valid. │
│                   Dental Care Center • 9AM-6PM              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer:                                                      │
│  [✕ Close] [🖨️ Print Now] [📧 Email] [💬 WhatsApp]        │
│             [Orange]       [Blue]     [Green]                │
└──────────────────────────────────────────────────────────────┘
```

### ADD MEDICATION MODAL (Right Side)
```
┌──────────────────────────────────────────────────────────────┐
│  ➕ Add Medication to Inventory                 ✕ Close     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Medication Name*:     [Amoxicillin__________] (required)    │
│                                                              │
│  Item Code:            [auto-generated if empty]             │
│  Category:             [Medication ▼]                       │
│  Sub-category:         [Antibiotics_______]                  │
│  Dosage Forms:         [Capsules___________]                  │
│  Manufacturer:         [Generic____________]                  │
│  Generic Name:         [Amoxicillin trihydrate]              │
│  Unit of Measure:      [mg ▼]                                │
│  Reorder Level:        [100]                                 │
│  ☑ Active             (Checked = Available)                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Footer:                                                      │
│  [✕ Cancel]  [💾 Save Medication]                          │
│               [Rose/Pink gradient]                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 User Interactions Flow

### Scenario 1: Apply Prescription to Diagnosis
```
[PRESCRIPTION MODAL OPEN]
        ↓
[Add medication 1]
        ↓
[Add medication 2]
        ↓
Click [✓ Apply to Diagnosis] (BLUE BUTTON)
        ↓
✅ "Prescription applied successfully!"
        ↓
[MODAL CLOSES]
        ↓
[DIAGNOSIS MODAL]
Prescriptions field now contains:
"Amoxicillin 500mg - 2x daily for 10 days (Take with water)
Ibuprofen 400mg - 1x daily for 5 days"
        ↓
👁️ [View] button now appears in PURPLE
```

### Scenario 2: View Existing Prescription
```
[DIAGNOSIS MODAL with populated prescriptions]
        ↓
Click [👁️ View] (PURPLE BUTTON)
        ↓
[VIEW PRESCRIPTION MODAL OPENS]
Shows all details:
- Patient Info
- Clinic Info
- All medications
- Notes
        ↓
Option A: Click [✏️ Edit] (CYAN)
  └→ Returns to PrescriptionModal to modify
        ↓
Option B: Click [🖨️ Print] (ORANGE)
  └→ Opens PrintPreviewModal
        ↓
Option C: Click [✕ Close]
  └→ Returns to DiagnosisModal
```

### Scenario 3: Print Prescription
```
[VIEW PRESCRIPTION MODAL] OR [PRESCRIPTION MODAL]
        ↓
Click [🖨️ Print Preview] (ORANGE BUTTON)
        ↓
[PRINT PREVIEW MODAL OPENS]
Shows professional prescription layout
        ↓
Option A: Click [🖨️ Print Now]
  └→ System Print Dialog
  └→ Print to printer or PDF
        ↓
Option B: Click [📧 Email]
  └→ Opens email client with prescription
        ↓
Option C: Click [💬 WhatsApp]
  └→ Opens WhatsApp with prescription
        ↓
Option D: Click [✕ Close]
  └→ Close print modal
```

### Scenario 4: Add New Medication to Inventory
```
[PRESCRIPTION MODAL]
Medication dropdown
        ↓
Search for non-existent medication
        ↓
No results
        ↓
[➕ Add to Inventory] button appears (GREEN)
        ↓
Click [➕ Add to Inventory]
        ↓
[ADD MEDICATION MODAL OPENS]
Medication Name auto-filled with search term
        ↓
Fill in remaining fields:
- Item Code (auto-generated if empty)
- Category
- Sub-category
- Dosage Forms
- Manufacturer
- Generic Name
- Unit of Measure
- Reorder Level
- Active checkbox
        ↓
Click [💾 Save Medication] (ROSE/PINK)
        ↓
✅ "Medication added successfully!"
        ↓
[MODAL CLOSES]
        ↓
[Back to PRESCRIPTION MODAL]
Medication now available in dropdown
```

---

## 🎨 Animation Timelines

### Modal Appearance (All Modals)
```
Time 0ms:    Scale: 0.9   Opacity: 0    Y: +30px
             ↓ (Spring physics)
Time 300ms:  Scale: 1.0   Opacity: 1    Y: 0px    ✓ Complete
```

### Medication List in View Modal
```
Medication 1: Appears at 0ms   (delay: 0 × 0.1s)
Medication 2: Appears at 100ms (delay: 1 × 0.1s)
Medication 3: Appears at 200ms (delay: 2 × 0.1s)
Medication 4: Appears at 300ms (delay: 3 × 0.1s)
```

### Button Animations
```
Hover:  Scale 1.0 → 1.05, Y: 0 → -2px
Tap:    Scale 1.0 → 0.95
Click:  Immediate action
Disabled: Opacity 0.5, Cursor: not-allowed
```

---

## ✨ Visual Effects

### Backdrop
```css
/* Semi-transparent with blur */
background: rgba(0, 0, 0, 0.6);
backdrop-filter: blur(4px);
```

### Gradient Buttons
```css
/* Example: Apply Button */
background: linear-gradient(to right, #2563eb, #4f46e5);
```

### Text Styling
```css
/* Headings */
font-size: 20-32px
font-weight: 700
color: #1f2937 (dark)

/* Labels */
font-size: 12-14px
font-weight: 600
color: #6b7280 (medium)

/* Input Text */
font-size: 14-16px
font-weight: 400
color: #374151 (regular)
```

### Border Styling
```css
/* Form Inputs */
border: 2px solid #e5e7eb
border-radius: 8-12px

/* Focus State */
border: 2px solid color
ring: 2px color
```

---

## 📐 Sizing Guide

### Modal Widths
```
Desktop:   max-w-6xl (1152px)
Tablet:    max-w-2xl (672px)
Mobile:    100% - 32px padding
```

### Modal Heights
```
Desktop:   95vh (95% of viewport)
Mobile:    95vh (95% of viewport)
Scrollable when content exceeds height
```

### Button Sizes
```
Large buttons: px-8 py-2.5 (32px × 40px)
Icon size:     w-6 h-6 (24px × 24px)
Close button:  w-12 h-12 (48px × 48px)
```

---

## 🎯 Accessibility Features

✅ **Keyboard Navigation**: All buttons accessible via Tab key
✅ **ARIA Labels**: Screen reader friendly
✅ **Focus States**: Clear visual focus indicators
✅ **Color Contrast**: WCAG AA compliant
✅ **Button Disabled State**: Clear visual indicator
✅ **Error Messages**: Clear and actionable
✅ **Required Fields**: Marked with asterisk (*)
✅ **Modal Backdrop**: Prevents background interaction

---

## 📱 Responsive Breakpoints

| Device | Width | Layout | Columns |
|--------|-------|--------|---------|
| Mobile | <640px | Single column | 1 |
| Tablet | 640-1024px | Two columns | 2 |
| Desktop | >1024px | Three columns | 3 |
| Large Desktop | >1536px | Full width | Full |

---

## 🔄 State Indicator Colors

```
✅ Success: Green (#10b981)
❌ Error:   Red (#ef4444)
⚠️  Warning: Amber (#f59e0b)
ℹ️  Info:    Blue (#3b82f6)
```

---

**Version**: 1.0
**Complete**: ✅
**Status**: Ready for Production

