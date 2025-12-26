# Dentaesthetics HMS - New Features User Guide

## 📋 Table of Contents
1. [Manage Clinic Settings](#manage-clinic-settings)
2. [Staff Management](#staff-management)
3. [Prescription Printing with Debugging](#prescription-printing)

---

## 🏥 Manage Clinic Settings

### Access the Feature
1. **Login** to the HMS application
2. Navigate to **Doctor's Space**
3. Click on **Manage Clinic** (in the sidebar or navigation)
4. Select the **Clinic Settings** tab
5. Click the **⚙️ Manage Clinic** button

### What You Can Do
Edit the following clinic information:
- **Clinic Name** - The official name of your dental clinic
- **City** - The city where the clinic is located
- **Address** - Complete street address
- **Phone Number** - Clinic contact phone
- **Email** - Clinic contact email
- **Operating Hours** - Days and hours of operation (e.g., "Mon-Fri 9:00 AM - 6:00 PM")

### Step-by-Step Guide

#### Step 1: Open the Modal
```
Doctor's Space 
  → Manage Clinic 
  → Clinic Settings tab 
  → Click "⚙️ Manage Clinic" button
```

#### Step 2: If Multiple Clinics
If your account is tagged to multiple clinics:
1. A **dropdown selector** will appear at the top
2. Select the clinic you want to edit from the list
3. The clinic details will load automatically

**Example:**
```
Select Clinic:
  ▼ Dentaesthetics Central - 123 Dental Street
  ○ Dentaesthetics West - 456 Clinic Avenue
  ○ Dentaesthetics East - 789 Hospital Plaza
```

#### Step 3: Edit Information
1. Click on any field to edit it
2. Update the information as needed
3. All fields show the current data
4. Fields are clearly labeled with what to enter

#### Step 4: Save Changes
1. Click the **"Save Changes"** button at the bottom right
2. A **success message** will appear: ✅ Clinic information updated successfully!
3. The message will disappear after 3 seconds automatically

#### Step 5: Close the Modal
- Click the **"Close"** button, or
- Click the **✕** button in the top-right corner

### Tips & Best Practices
- ✅ Update operating hours if you change your clinic timings
- ✅ Keep contact information current for patient inquiries
- ✅ Use consistent naming conventions across your clinic chain
- ✅ Make sure email is monitored for automated notifications
- ✅ Add emergency contact if different from main phone

### Troubleshooting

**Issue**: Modal won't open
- **Solution**: Ensure you're logged in and in the Doctor's Space

**Issue**: Can't see your clinic in the dropdown
- **Solution**: Contact admin to ensure your account is linked to the clinic

**Issue**: Changes didn't save
- **Solution**: 
  1. Check your internet connection
  2. Look for error message on screen
  3. Verify all required fields are filled
  4. Try again after a moment

---

## 👥 Staff Management

### Access the Feature
1. **Login** to the HMS application
2. Navigate to **Doctor's Space**
3. Click on **Manage Clinic**
4. Select the **Staff Management** tab
5. Click the **👥 Manage Staff** button

### What You Can Do
- **View** staff member profiles
- **Edit** staff information
- **Manage** multiple staff members per clinic
- **Handle** staff tagged to multiple clinics

### Step-by-Step Guide

#### Step 1: Open Staff Management
```
Doctor's Space 
  → Manage Clinic 
  → Staff Management tab 
  → Click "👥 Manage Staff" button
```

#### Step 2: Select a Clinic (If Multiple)
If your account manages multiple clinics:
1. A **dropdown selector** will appear
2. Select the clinic whose staff you want to manage
3. All staff members for that clinic will load automatically

**Example:**
```
Select Clinic:
  ▼ Dentaesthetics Central - Mumbai
  ○ Dentaesthetics West - Delhi
  ○ Dentaesthetics North - Bangalore
```

#### Step 3: Choose a Staff Member
The left panel shows all staff members for the selected clinic:
1. Click on any staff member's name
2. Their profile will appear in the right panel
3. The selected staff member is highlighted in blue

#### Step 4: View/Edit Information
Once a staff member is selected, you can view and edit:

**Personal Information:**
- First Name
- Last Name
- Email
- Phone
- Date of Birth
- Gender

**Professional Information:**
- License Number
- License Expiry Date
- Years of Experience
- Employment Status

**Contact & Address:**
- Address
- Emergency Contact
- Phone Number

#### Step 5: Save Changes
1. Make any necessary changes to the fields
2. Click **"Save Changes"** button (bottom-right)
3. A **success message** will appear
4. The message automatically disappears after 3 seconds

#### Step 6: Close the Modal
- Click **"Close"** button, or
- Click the **✕** button in the top-right corner

### Staff List Features
- **Scroll** through the staff list if there are many members
- **Selected highlight** shows which staff is currently being edited
- **Real-time updates** when you save changes

### Tips & Best Practices
- ✅ Keep license expiry dates updated
- ✅ Update contact information when staff moves
- ✅ Mark employment status correctly (Active/Inactive/On Leave)
- ✅ Record years of experience for credential verification
- ✅ Keep emergency contact information current

### Troubleshooting

**Issue**: Staff list is empty
- **Solution**: 
  1. Verify the clinic is selected
  2. Ensure staff are assigned to this clinic
  3. Contact admin if staff should be visible

**Issue**: Can't edit a field
- **Solution**: Some fields like Staff ID are read-only for security

**Issue**: Changes not saving
- **Solution**:
  1. Check for error messages
  2. Verify all required fields are filled
  3. Check your internet connection
  4. Try saving again

---

## 🖨️ Prescription Printing with Debugging

### How to Print a Prescription

#### In Doctor's Space:
1. Navigate to **Appointments** section
2. Select an appointment
3. Add medications and prescription details
4. Click **🖨️ Print** button
5. Print dialog will open

#### In Patient's Space:
1. Navigate to **Visit Management**
2. Select a patient and their visit
3. Add medications and prescription details
4. Click **🖨️ Print** button
5. Print dialog will open

### What Gets Printed
- ✅ Patient name and ID
- ✅ Clinic name and contact info
- ✅ Doctor name and registration number
- ✅ Prescription date
- ✅ List of medications with:
  - Medicine name
  - Dosage
  - Frequency
  - Duration
  - Special instructions
- ✅ Any additional prescription notes
- ✅ Doctor's signature line

### If Print Shows Blank Page

#### Quick Fix Checklist:
1. ☐ **Have you added a patient?** - Select a patient before printing
2. ☐ **Have you added medications?** - At least the patient needs to be selected
3. ☐ **Is popup blocker blocking it?** - Check browser popup settings
4. ☐ **Is the print window opening?** - Look for a new window

#### Detailed Debugging Steps:

**Step 1: Open Browser Console**
- Press **F12** on keyboard
- Go to **Console** tab

**Step 2: Click Print Button**
- The console will show detailed logs

**Step 3: Check for These Messages:**

```
✅ GOOD SIGNS (Will print successfully):
- "Window opened: true"
- "Content has patient name: true"
- "Print dialog executed"

❌ PROBLEMS (Won't print):
- "Window opened: false" → Popup blocked
- "Content has patient name: false" → Patient not selected
- "HTML length: < 500" → Data not generated
```

### Browser-Specific Instructions

#### Google Chrome:
1. Settings → Privacy and security → Site settings
2. Pop-ups and redirects
3. Add `https://localhost:7104` to the allowed list

#### Firefox:
1. Preferences → Privacy & Security
2. Scroll to "Permissions"
3. Find "Pop-ups" and click "Exceptions"
4. Add `https://localhost:7104`

#### Safari:
1. Preferences → Websites
2. Select "Pop-ups" from the sidebar
3. Set to "Allow" for this website

### Before Printing

Ensure the following are filled:
- ☐ **Patient Selected** - Choose a patient from the list
- ☐ **Medications (Optional)** - Add at least one medication or just use text
- ☐ **Prescription Text (Optional)** - Add notes if needed
- ☐ **Popup Blocker Disabled** - For this website

### Print Settings (In Browser Print Dialog)

Recommended Settings:
- **Destination**: Save as PDF or Physical Printer
- **Page Size**: A4 or Letter (standard)
- **Orientation**: Portrait (default)
- **Margins**: Default or Minimal
- **Scale**: 100% (don't scale)
- **Background**: Enable background graphics (for colors)

### Tips for Better Printing

1. **Print to PDF** - Save for records and email to patients
2. **Two Copies** - Print one for clinic records, one for patient
3. **Use Clinic Letterhead** - If using physical printer with letterhead
4. **Before Submitting** - Always preview before printing

### Troubleshooting Print Issues

#### Blank Page Prints
- **Cause**: Patient data not selected
- **Fix**: Select patient again and try printing

#### Some Medications Missing
- **Cause**: Medications not saved properly
- **Fix**: Check medications list, add missing ones, print again

#### Wrong Date Showing
- **Cause**: System clock incorrect
- **Fix**: Check computer date/time settings

#### Image Quality Poor
- **Cause**: Browser scaling
- **Fix**: Set browser scale to 100% (Ctrl+0 or Cmd+0)

#### Popup Not Opening
- **Cause**: Popup blocker is ON
- **Fix**: Disable popup blocker for this site (see browser instructions above)

---

## 📱 Mobile Printing

### Using Mobile Devices
- ✅ Supported on tablets (iPad, Android tablets)
- ⚠️ Limited support on phones (small screen)

### Steps for Mobile:
1. Open the application on mobile browser
2. Navigate to prescription
3. Click print button
4. Follow browser's print dialog
5. Select "Print to PDF" or "Save as PDF"
6. Save to your device or email

---

## 🔍 Console Debugging (For Tech Support)

### How to Share Debug Information

If printing isn't working and you need to contact support:

1. **Open Console** (F12 → Console tab)
2. **Click Print Button**
3. **Right-click in console** → "Save as" or "Copy All"
4. **Share the entire log** with support team

This helps developers quickly identify the issue!

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Console | F12 |
| Open Developer Tools | Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac) |
| Save Page | Ctrl+S |
| Print Page | Ctrl+P |
| Refresh Page | F5 or Ctrl+R |
| Close Tab | Ctrl+W |

---

## 🆘 Getting Help

### If Something Doesn't Work:

1. **Check Browser Console**
   - Press F12
   - Look for red error messages
   - Take note of what it says

2. **Check Internet Connection**
   - Ensure you're connected to internet
   - Test by visiting another website

3. **Try These Steps:**
   - Refresh the page (F5)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try a different browser
   - Try incognito/private window

4. **Contact IT Support** with:
   - What you were trying to do
   - What error appeared (screenshot or text)
   - Console logs (if applicable)
   - Your browser and OS version

---

## 📝 Feature Request / Bug Report

Have an idea for improvement or found a bug? Share it with:

- **What**: Description of the feature or bug
- **Where**: Location in the application
- **How**: Steps to reproduce (if bug)
- **When**: When did you first notice it
- **Browser**: Chrome/Firefox/Safari + version
- **Attachment**: Console logs (for bugs)

---

**Last Updated**: December 25, 2025
**Version**: 1.0
**Status**: ✅ Ready for Use
