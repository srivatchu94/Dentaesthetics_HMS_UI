# Quick Reference: Adding Camp Participants

## Step-by-Step User Flow

### 1. Click "Add Participants" Tile
- Frontend fetches camps from: `GET /Camp/GetAllCampsbyClinicID?ClinicID={clinicId}`
- Only shows camps for the user's clinic
- Add Participants form opens with camp dropdown

### 2. Select Camp
- Click dropdown → Choose camp
- Format: `Camp Name (Type) - Date`
- Example: `Dental Health Awareness Camp 2025 (Dental) - 1/6/2025`
- CampID is automatically set

### 3. Fill Participant Details

**Required Fields (marked with *):**
- Participant Name
- Age (must be > 0)
- Gender
- Phone Number
- Consent checkbox

**Optional Fields:**
- Date of Birth
- Email
- Parent/Guardian Name
- Student/Staff type
- Class/Standard
- Roll Number
- Department
- Dental Issues (checkboxes)
- Medical History
- Current Medications
- Allergies
- Photo Consent

### 4. Click "Add Participant" Button

**What Happens:**
1. Frontend validates all required fields
2. If validation fails → Error message shown, form stays open
3. If validation passes → Data is converted and sent to backend

### 5. Backend Processes Request

**Endpoint:** `POST /Camp/AddCampParticipant`

**Receives:**
```json
{
  "campId": 5,
  "enterpriseId": 1,
  "clinicId": 2,
  "participantName": "John Doe",
  "age": 15,
  "gender": "Male",
  "phoneNumber": "9876543210",
  "dateOfBirth": "2010-05-20",
  "email": "john@example.com",
  "parentGuardianName": "Jane Doe",
  "studentOrStaff": "Student",
  "classStandard": "10th Grade",
  "gradeYear": "10",
  "rollNumber": "A-101",
  "department": "",
  "existingDentalIssues": "Toothache, Sensitivity",
  "medicalHistory": "None",
  "currentMedications": "None",
  "allergies": "Penicillin",
  "consentGiven": true,
  "photoConsent": false
}
```

### 6. Success Response

**Backend Returns:**
```json
{
  "participantId": 42
}
```

**Frontend Shows:**
- Green success message: "✅ Participant added successfully! ID: 42"
- Modal closes automatically
- Form resets
- Ready to add next participant

## Data Validation

| Field | Validation | Error Message |
|-------|-----------|--------------|
| Camp | Must select one | "Please select a camp first" |
| Name | Required | "Participant name is required!" |
| Age | Number > 0 | "Age must be a valid number greater than 0!" |
| Gender | Must select | "Gender is required!" |
| Phone | Required | "Phone number is required!" |
| Consent | Must check | "Consent for examination/treatment is required!" |

## Data Conversions

Before sending to API:

```
Age: "15" → 15 (String to Integer)
Dental Issues: ["Toothache", "Sensitivity"] → "Toothache, Sensitivity" (Array to CSV)
All text: Trimmed of whitespace
Optional fields: Default to empty string if not filled
```

## Debugging

### Check Browser Console
```
🔐 Selected Access: {clinicId: 2, ...}
👥 Participant Data being sent: {...}
📞 API CALL: POST /Camp/AddCampParticipant
✅ Response from backend: {participantId: 42}
```

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Add Participant"
4. Find POST request to `/Camp/AddCampParticipant`
5. Check:
   - Status: 200 OK (success) or 400+ (error)
   - Request body: All fields present
   - Response: `{"participantId": number}`

## Common Issues

**"Camp ID is missing"**
→ Select a camp from dropdown

**"Participant name is required"**
→ Enter participant's name

**"Age must be valid"**
→ Enter age as number > 0

**"Consent for examination required"**
→ Check the consent checkbox

**"Network error"**
→ Backend not running, start: `dotnet run`

## Success Indicators

✅ Green toast message appears
✅ Shows participant ID in message
✅ Modal closes automatically
✅ Form resets to empty state
✅ Network tab shows Status 200
✅ Console shows "Response from backend: {participantId: X}"

## Next Steps After Adding Participant

- Add more participants to same camp
- View camp participants in "View Participants" tile
- Track services provided to participant
- View camp reports
