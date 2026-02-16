# Prescription Features Implementation Guide

## Overview
This document outlines the newly implemented prescription management features in the Diagnosis Modal for the Doctor's appointment workflow.

## Features Implemented

### 1. **Enhanced Diagnosis Modal** 
   - Location: `src/components/DiagnosisModal.jsx`
   - Added new section for prescription management
   - Integrated with three action buttons: Print, Email, and WhatsApp
   - Added new field: Prescription Details (JSON format)

### 2. **Print Prescriptions** 🖨️
   - **Feature**: Print preview modal showing how prescriptions would look when printed
   - **Integration**: Uses `PrescriptionPrint` component
   - **Layout Includes**:
     - Clinic header with details (name, address, phone, email)
     - Doctor information (name, registration number)
     - Patient information (name, age, gender, patient ID)
     - Medications in grid format (medicine name, dosage, frequency, duration)
     - Special instructions for each medication
     - Professional footer with prescription validity message

   - **How to Use**:
     1. Click the "🖨️ Print" button in the Prescription Actions section
     2. Preview modal opens showing full prescription layout
     3. Click "🖨️ Print Now" to trigger browser print dialog (Ctrl+P)
     4. Select printer and customize settings as needed
     5. Print generates a beautiful, clinic-branded prescription

### 3. **Email Prescriptions** 📧
   - **Feature**: Send prescription via email with professional template
   - **Integration**: Uses existing `emailService` with `sendEmail` function
   - **Email Template Includes**:
     - Clinic name and branding at the top
     - Doctor information
     - Patient greeting
     - Prescription date
     - Medications table with all details
     - Important instructions section
     - Professional footer with clinic contact details

   - **How to Use**:
     1. Click the "📧 Email" button in the Prescription Actions section
     2. Email modal opens with recipient email pre-filled (from patient data)
     3. Verify/update recipient email address
     4. Click "📤 Send Email" to send the prescription
     5. Confirmation message appears when email is sent successfully

### 4. **WhatsApp Message** 💬
   - **Feature**: Send prescription details via WhatsApp
   - **Integration**: Opens WhatsApp Web with pre-populated prescription message
   - **Message Includes**:
     - Prescription header with doctor name
     - Medicines list
     - Doctor instructions
     - Clinic name and phone number
     - Instructions to contact clinic

   - **How to Use**:
     1. Click the "💬 WhatsApp" button in the Prescription Actions section
     2. Requires valid patient phone number
     3. Opens WhatsApp Web in new browser tab
     4. Message is pre-populated with prescription details
     5. Select contact or enter patient number and send

## UI/UX Design

### Button Layout
- **Equispaced and horizontally arranged** in a grid layout
- **Three buttons in equal columns**: 
  - 🖨️ Print (Blue theme)
  - 📧 Email (Green theme)  
  - 💬 WhatsApp (Green theme)
- **Compact design** with icons and minimal text labels
- **Visual feedback** with hover effects and animations
- **Space-efficient** - only appears when medications are present

### Color Scheme
- Print Button: Blue gradient (`from-blue-600 to-blue-700`)
- Email Button: Green gradient (`from-green-600 to-green-700`)
- WhatsApp Button: Green accent style
- All buttons have clean borders and smooth transitions

### Prescription Fields Added
1. **Prescription Content** (JSON format)
   - Allows structured medication data
   - Format: `[{"medicineName":"","dosage":"","frequency":"","duration":"","specialInstructions":""}]`
   - Falls back to plain text if JSON parsing fails
   - Optional but recommended for better formatting

## Data Flow

### Doctor → Patient Flow
1. Doctor opens appointment from Doctor Schedule page
2. Clicks on appointment to open Diagnosis Modal
3. Fills in: Diagnosis, Treatment Plan, Medications, and optionally Prescription Details (JSON)
4. Saves the diagnosis
5. Uses prescription action buttons to:
   - **Print**: Preview and print the prescription
   - **Email**: Send to patient's registered email
   - **WhatsApp**: Send WhatsApp message to patient's phone

### Data Retrieval
- Patient Info: Fetched from appointment/visit data
- Doctor Info: Fetched from appointment details
- Clinic Info: Combined from appointment and user localStorage data
- Prescription Data: From form inputs in modal

## Technical Details

### Components Modified
- **DiagnosisModal.jsx**: Main component with new sub-components
  - `PrintPreviewModal`: Handles print preview functionality
  - `EmailModal`: Handles email sending with validation
  - `DiagnosisContent`: Content area with all form fields

### Services Used
- **emailService.ts**: `sendEmail()` function for sending emails
- **hmsApi.ts**: `getPatientVisit()` and `getMedicalInfoSummary()`
- **PrescriptionPrint.jsx**: Renders print-friendly prescription
- **PrescriptionEmailTemplate.jsx**: Generates email HTML template

### API Endpoints Called
1. `/Appointment/{appointmentId}` - Get appointment details
2. `/Diagnosis/GetDiagnosisByAppointmentId` - Get existing diagnosis
3. `/Email/sendemail` - Send prescription email

## Forms and Validation

### Email Modal Validation
- Checks for valid email address format
- Pre-fills with patient email from database
- Allows manual email entry/override
- Shows confirmation message on successful send

### Print Modal
- No validation needed
- Displays preview before printing
- Allows browser print customization
- Works with all modern printers via print dialog

### WhatsApp Modal
- Validates phone number availability
- Escapes special characters in message
- Opens WhatsApp Web in new tab
- Message is pre-populated and ready to send

## JSON Prescription Format
For better structured data in print and email, use this format in the Prescription Content field:

```json
[
  {
    "medicineName": "Amoxicillin",
    "dosage": "500mg",
    "frequency": "3 times daily",
    "duration": "7 days",
    "specialInstructions": "Take with water after food"
  },
  {
    "medicineName": "Metronidazole",
    "dosage": "400mg",
    "frequency": "2 times daily",
    "duration": "5 days",
    "specialInstructions": "Avoid alcohol during treatment"
  }
]
```

## Fallback Behavior
- If JSON parsing fails, the component falls back to plain text display
- Simple text format: One medication per line
- Works seamlessly with both JSON and plain text formats

## Browser Compatibility
- **Print**: Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- **Email**: Requires backend email service configured
- **WhatsApp**: Requires WhatsApp Web to be available and user to be logged in

## Future Enhancements
1. SMS prescription delivery option
2. Patient acknowledgment/confirmation
3. Prescription expiry tracking
4. Refill reminders
5. Digital signature support
6. QR code for prescription verification
7. Prescription history tracking

## Troubleshooting

### Print not working
- Ensure popup blocker is disabled
- Check browser print settings
- Verify CSS styles for print media queries

### Email not sending
- Check internet connection
- Verify patient email address is valid
- Ensure backend email service is configured
- Check browser console for error messages

### WhatsApp not opening
- Ensure patient phone number is correct with country code
- WhatsApp Web must be logged in on the browser
- Required format: Country code + Phone number (e.g., +911234567890)

## Security Considerations
- Patient data is not stored on external servers
- Email service uses backend SMTP configuration
- WhatsApp messages are client-side only
- Print functionality is local browser operation only

---

**Last Updated**: February 16, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
