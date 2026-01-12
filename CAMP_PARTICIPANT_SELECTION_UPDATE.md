# Camp Participant Selection & Toast Notification Update

## Overview
Updated the "Add Participants" flow to fetch camps from database filtered by clinic ID, and repositioned success/error messages to center of screen.

## Changes Made

### 1. **campService.ts**
Added new API function:
```typescript
export async function getCampsByClinicId(clinicId: number): Promise<CampRegistrationModel[]> {
  return request<CampRegistrationModel[]>(`/Camp/GetAllCampsbyClinicID?ClinicID=${clinicId}`, {
    method: 'GET',
  });
}
```
- Calls the backend endpoint: `/Camp/GetAllCampsbyClinicID`
- Passes `ClinicID` parameter from login token payload
- Returns list of camps for the specific clinic

### 2. **Services.jsx Updates**

#### New State Variable
```javascript
const [showSelectCampModal, setShowSelectCampModal] = useState(false);
```

#### New Handler Function
```javascript
const handleSelectCampForParticipants = async () => {
  // Fetches camps by clinic ID
  // Shows camp selection modal
  // Sets campId when user selects a camp
}
```

#### Updated "Add Participants" Action
- Now calls `handleSelectCampForParticipants()` instead of checking if campId exists
- Fetches camps from database filtered by clinic ID
- Shows camp selection modal before participant form

#### Toast Notification Repositioning
Changed from **top-right corner** to **center of page**:
- Success messages: Green toast centered with scale animation
- Error messages: Red toast centered with scale animation
- Uses Tailwind classes: `top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`
- Smoother animation with scale instead of y-translate

### 3. **New Select Camp Modal**
When user clicks "Add Participants":
1. Modal displays all camps for the clinic
2. Each camp shows:
   - Camp name with type badge
   - Location (institution, city)
   - Date and time
   - Expected participants
3. User clicks camp card to proceed to participant form
4. CampId is automatically set
5. Modal closes and participant form opens

## User Flow

```
User clicks "Add Participants"
    ↓
Frontend calls getCampsByClinicId(clinicId from login token)
    ↓
Backend filters camps by clinic ID
    ↓
Select Camp Modal displays all clinic camps
    ↓
User clicks on a camp
    ↓
Modal closes, campId is set
    ↓
Add Participants form opens (pre-populated with selected campId)
    ↓
User fills participant details and submits
    ↓
Success/Error toast appears at center of screen
```

## API Endpoint
**Backend Endpoint Used:**
```
[HttpGet("GetAllCampsbyClinicID", Name = "GetAllCampsbyClinicID")]
public IActionResult GetAllCampsbyClinicID(int ClinicID)
```

Parameters:
- `ClinicID`: Integer from `getSelectedAccess().clinicId` (login token payload)

## Benefits

✅ **Clinic-Specific Data** - Users only see camps from their clinic
✅ **Better UX** - Users can select camp before entering participant details
✅ **Central Notifications** - Success messages are more visible at center
✅ **Automatic CampId** - No need to remember camp selection
✅ **Database-Driven** - Camps loaded from backend, not hardcoded

## Testing Checklist

- [ ] Click "Add Participants" and verify camps from database display
- [ ] Verify only camps from current clinic show up
- [ ] Click on a camp and verify participant form opens
- [ ] Register a participant and verify success message appears at center
- [ ] Test error case and verify error message appears at center
- [ ] Verify campId is correctly set when form is submitted
- [ ] Test on mobile to ensure centered positioning works

## Files Modified

1. **src/services/campService.ts** - Added `getCampsByClinicId()` function
2. **src/pages/Services.jsx** - Added select camp modal, updated handlers, repositioned toasts
