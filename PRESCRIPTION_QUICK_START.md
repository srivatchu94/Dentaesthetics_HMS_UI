# Quick Start Guide - Prescription Features

## Where to Find the Features

### Navigation Path
```
Doctor Dashboard → Appointments → Select Appointment → 🏥 Diagnosis & Treatment Modal
```

## Step-by-Step Usage

### 1️⃣ Open Diagnosis Modal
- Navigate to your Doctor Schedule
- Click on an appointment to view details
- Click the "🏥 Diagnosis & Treatment" button
- Modal opens showing diagnosis form

### 2️⃣ Fill in Prescription Details

```
┌─ Diagnosis Modal ────────────────────┐
│                                      │
│ 🔍 Diagnosis                         │
│  [Text Area]                         │
│                                      │
│ 💊 Treatment Plan                    │
│  [Text Area]                         │
│                                      │
│ 💉 Medications                       │
│  [Text Area]                         │
│                                      │
│ 📋 Prescription Details (JSON)       │
│  [Text Area]                         │
│                                      │
│ 📝 Additional Notes                  │
│  [Text Area]                         │
│                                      │
│ ┌─ 💊 Prescription Actions ─────┐   │
│ │  [🖨️ Print] [📧 Email] [💬 WhatsApp] │
│ └───────────────────────────────┘   │
│                                      │
│ [✕ Close]  [💾 Save Diagnosis]     │
└──────────────────────────────────────┘
```

### 3️⃣ Use Prescription Actions

#### Option A: 🖨️ Print Prescription
```
1. Click the "🖨️ Print" button
2. Print Preview Modal Opens (showing full prescription)
3. Review the layout and formatting
4. Click "🖨️ Print Now" button
5. Browser print dialog opens (Ctrl+P)
6. Select printer and settings
7. Click Print to generate PDF or print to physical printer
```

#### Option B: 📧 Email Prescription
```
1. Click the "📧 Email" button
2. Email Modal Opens
3. Verify/update recipient email (pre-filled from patient data)
4. Review what will be included:
   ✓ Clinic name & address
   ✓ Doctor information
   ✓ Patient details
   ✓ Medications table
   ✓ Professional formatting
5. Click "📤 Send Email"
6. Confirmation message appears
```

#### Option C: 💬 Send via WhatsApp
```
1. Click the "💬 WhatsApp" button
2. WhatsApp Web opens in new tab
3. Pre-populated message shows:
   - Prescription header
   - Medicines list
   - Doctor instructions
   - Clinic contact details
4. Select contact or enter phone number
5. Review message and send
```

## Input Formats

### Plain Text Medications
```
Amoxicillin 500mg - 3 times daily for 7 days
Metronidazole 400mg - 2 times daily for 5 days
Ibuprofen 400mg - As needed for pain
```

### JSON Format (Recommended)
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

## Features at a Glance

### 🖨️ Print Prescription
| Feature | Details |
|---------|---------|
| **Preview** | Full prescription layout before printing |
| **Content** | Clinic details, Doctor info, Patient details, Medications, Instructions |
| **Format** | Professional, printer-friendly layout |
| **Customization** | Browser print settings (margins, scaling, etc.) |
| **Export Options** | Print to physical printer or save as PDF |

### 📧 Email Prescription
| Feature | Details |
|---------|---------|
| **Recipients** | Auto-populated from patient email, can be edited |
| **Template** | Professional HTML email with gradient styling |
| **Delivery** | Backend SMTP service |
| **Tracking** | Confirmation message after sending |
| **Content** | All prescription details with instructions |

### 💬 WhatsApp Prescription
| Feature | Details |
|---------|---------|
| **Platform** | WhatsApp Web (browser-based) |
| **Message** | Pre-populated with prescription details |
| **Format** | Formatted text with emojis and sections |
| **Recipients** | Patient phone number from database |
| **Delivery** | Direct WhatsApp message |

## Data Included in Each Format

### All Three Formats Include:
✅ Clinic name and address  
✅ Phone and email  
✅ Doctor name and credentials  
✅ Prescription date  
✅ Patient name  
✅ Medications list  
✅ Dosage and frequency  
✅ Duration and instructions  
✅ Special dosing instructions  
✅ Professional formatting  

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Print Dialog | Ctrl+P (after clicking Print) |
| Close Modal | Esc |
| Save Diagnosis | Alt+S |

## Troubleshooting

### "Patient email not found"
- Verify patient has email registered in system
- Email modal will show input field to enter email manually

### "Print opens blank page"
- Ensure popup blockers are disabled
- Try print preview button again
- Check browser console for errors

### "WhatsApp not opening"
- Must have WhatsApp Web logged in
- Phone number must include country code (e.g., +91)
- Browser must allow popup windows

### "Email not sending"
- Check network connection
- Verify medical email is correct
- Check backend email service status
- Review browser console for error details

## Tips & Tricks

💡 **Save First**: Always click "💾 Save Diagnosis" before using action buttons  
💡 **Use JSON**: Structured JSON format produces better formatted output  
💡 **Review Before Print**: Use preview modal to check formatting  
💡 **Update Email**: Edit email address in email modal if patient email changed  
💡 **Check Permissions**: WhatsApp requires browser to allow popups  

## Video Tutorial

[Would be embedded here in actual deployment]
- Duration: 3 minutes
- Covers: Basic usage and all three features
- Format: Screen recording with voice-over

## Support & Feedback

For issues or feature requests:
1. Check the troubleshooting section above
2. Contact your system administrator
3. Report bugs with screenshots and error messages

---

**Version**: 1.0  
**Last Updated**: February 16, 2026  
**Status**: ✅ Ready for Use
