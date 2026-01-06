# Camp Viewing Implementation Guide

## Overview
Added viewing capabilities for camps and participants with enterprise/clinic context from authentication token.

## Changes Made

### 1. **Updated campService.ts**
- **Added enterpriseId and clinicId** to both model interfaces:
  - `CampRegistrationModel` now includes `enterpriseId?: number` and `clinicId?: number`
  - `CampParticipantRegistrationModel` now includes `enterpriseId?: number` and `clinicId?: number`
- **Note:** API endpoints already support these parameters through authenticated request headers

### 2. **Enhanced Services.jsx**

#### New Imports
- Added `getAllCamps` and `getAllCampParticipants` from campService
- Added `getSelectedAccess` from authService to retrieve enterprise/clinic IDs from auth token

#### New State Variables
```javascript
const [showViewCampsModal, setShowViewCampsModal] = useState(false);
const [showViewParticipantsModal, setShowViewParticipantsModal] = useState(false);
const [camps, setCamps] = useState([]);
const [participants, setParticipants] = useState([]);
const [selectedCampForParticipants, setSelectedCampForParticipants] = useState(null);
const [viewLoading, setViewLoading] = useState(false);
```

#### New UI Tiles
Added two new tiles to the "Camp Software" section:
1. **View Camps** - Displays all registered camps with full details
2. **View Participants** - Shows participants for selected camp

#### Updated Form Submissions
Both `handleCampFormSubmit` and `handleParticipantFormSubmit` now:
- Retrieve selected access using `getSelectedAccess()`
- Include `enterpriseId` and `clinicId` in the submitted data
- These values are passed from the authentication token payload

#### New Handler Functions
- **handleViewCamps()** - Fetches and displays all camps
- **handleViewParticipants(campId)** - Fetches participants for a specific camp

#### New Modals

**View Camps Modal**
- Displays all camps in card grid layout
- Shows: Camp name, type, location, date, time, expected participants, services offered
- Contact person information displayed
- "View Participants" button to drill down into specific camp

**View Participants Modal**
- Displays participants in detailed card layout
- Shows three information sections per participant:
  - **Personal Info:** Name, age, gender, date of birth
  - **Contact:** Phone, email, guardian name, student/staff type
  - **Health Info:** Dental issues, medical history, allergies, consent status
- Visual indicators for consent and photo permissions

## Data Flow

```
User Login
    ↓
getSelectedAccess() retrieves {enterpriseId, clinicId, roleIds}
    ↓
User clicks "View Camps" or "Register Camp"
    ↓
For Creation: campData includes enterpriseId & clinicId
For Viewing: getAllCamps() called (filtered by headers automatically)
    ↓
Backend returns enterprise/clinic-specific data
    ↓
Modal displays results
```

## API Integration

All API calls now include enterprise/clinic context through the authenticated `request()` function:
- **Headers automatically added:**
  - `Authorization: Bearer <token>`
  - `X-Enterprise-Id: <enterpriseId>`
  - `X-Clinic-Id: <clinicId>`
  - `X-Role-Ids: <roleIds>`

## Key Features

✅ **Enterprise/Clinic Isolation** - Data filtered by login context
✅ **Responsive Design** - Grid layout adapts to screen size
✅ **Loading States** - Visual feedback while fetching data
✅ **Empty States** - User-friendly messages when no data exists
✅ **Smooth Animations** - Framer Motion transitions for modals and cards
✅ **Error Handling** - Toast notifications for failures
✅ **Toast Notifications** - Success/error messages

## Testing Checklist

- [ ] Click "View Camps" and verify all registered camps display
- [ ] Click "View Participants" from a camp and verify participant list shows
- [ ] Verify enterprise/clinic filters work correctly (data shows only for current clinic)
- [ ] Register a new camp and verify enterpriseId/clinicId are included
- [ ] Register a participant and verify enterpriseId/clinicId are included
- [ ] Test error handling with network issues
- [ ] Verify modals close properly on background click and close button

## File Modifications

1. **src/services/campService.ts** - Updated interfaces with enterpriseId/clinicId
2. **src/pages/Services.jsx** - Added view modals, handlers, and tiles
