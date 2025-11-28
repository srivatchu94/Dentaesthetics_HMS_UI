# Access Control Integration Guide

## Overview
This document explains the Access Control feature integration with the backend role mapping system.

## Database Schema

### AccessControl Table Structure
```sql
AccessControlId   INT (Primary Key, Auto-increment)
UserId            INT (Foreign Key → Users table)
ClinicId          INT (Foreign Key → Clinics table)
RoleId            INT (Foreign Key → Roles table)
IsActive          BIT (1 = Active, 0 = Inactive)
CreatedAt         DATETIME2
UpdatedAt         DATETIME2
```

### Example Record
```
AccessControlId: 1
UserId: 1006
ClinicId: 1005
RoleId: 2
IsActive: 1
CreatedAt: 2025-11-25 15:02:14.4200190
UpdatedAt: 2025-11-25 15:02:14.4200190
```

## Frontend Implementation

### 1. Interface Models (`AccessControlModel.ts`)
```typescript
interface AccessControlModel {
  accessControlId: number;
  userId: number;
  clinicId: number;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BulkAssignRolesDto {
  userId: number;
  clinicId: number;
  roleIds: number[];  // Array of role IDs
  isActive?: boolean;
}
```

### 2. API Service (`accessControlService.ts`)
All API functions are available:
- `listAccessControl(params?)` - Get all access control entries with optional filters
- `getAccessControl(id)` - Get single entry
- `createAccessControl(dto)` - Create single entry
- `bulkAssignRoles(dto)` - **Primary method for multi-role assignment**
- `updateAccessControl(id, dto)` - Update entry (activate/deactivate)
- `deleteAccessControl(id)` - Hard delete entry
- `revokeAllRoles(userId, clinicId)` - Deactivate all roles for user in clinic
- `replaceUserRoles(dto)` - Remove old roles and assign new ones

### 3. UI Integration (`TeamHub.jsx`)

#### Data Flow
1. **User searches for staff** → Filters mockStaffData
2. **User selects staff member** → Opens role manager modal
3. **User selects roles** using one of 4 modes:
   - Multi-Select Cards
   - Drag & Drop
   - Toggle Switches
   - Permission Builder
4. **User clicks "Apply Roles"** → Shows confirmation modal
5. **User confirms** → Calls `handleConfirmAssignment()`

#### API Call in `handleConfirmAssignment()`
```javascript
const payload = {
  userId: selectedStaff.id,           // User ID from staff object
  clinicId: parseInt(selectedStaff.clinicId.replace('C', '')),  // Convert "C001" → 1
  roleIds: selectedRoles.map(r => r.id),  // [1, 2, 5, 7, etc.]
  isActive: true
};

const result = await bulkAssignRoles(payload);
// Result is an array of AccessControlModel objects created
```

## Backend Requirements

### Expected API Endpoint
```
POST /api/accesscontrol/bulk-assign
Content-Type: application/json

{
  "userId": 1006,
  "clinicId": 1005,
  "roleIds": [1, 2, 5, 7],
  "isActive": true
}
```

### Expected Response
```json
[
  {
    "accessControlId": 1,
    "userId": 1006,
    "clinicId": 1005,
    "roleId": 1,
    "isActive": true,
    "createdAt": "2025-11-28T10:30:00Z",
    "updatedAt": "2025-11-28T10:30:00Z"
  },
  {
    "accessControlId": 2,
    "userId": 1006,
    "clinicId": 1005,
    "roleId": 2,
    "isActive": true,
    "createdAt": "2025-11-28T10:30:00Z",
    "updatedAt": "2025-11-28T10:30:00Z"
  }
  // ... one record for each roleId
]
```

### Backend Implementation (C# Example)
```csharp
[HttpPost("bulk-assign")]
public async Task<ActionResult<List<AccessControlModel>>> BulkAssignRoles(
    [FromBody] BulkAssignRolesDto dto)
{
    var results = new List<AccessControlModel>();
    
    foreach (var roleId in dto.RoleIds)
    {
        // Check if assignment already exists
        var existing = await _context.AccessControl
            .FirstOrDefaultAsync(ac => 
                ac.UserId == dto.UserId && 
                ac.ClinicId == dto.ClinicId && 
                ac.RoleId == roleId);
        
        if (existing != null)
        {
            // Reactivate if inactive
            existing.IsActive = dto.IsActive ?? true;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new entry
            var newEntry = new AccessControlModel
            {
                UserId = dto.UserId,
                ClinicId = dto.ClinicId,
                RoleId = roleId,
                IsActive = dto.IsActive ?? true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AccessControl.Add(newEntry);
            results.Add(newEntry);
        }
    }
    
    await _context.SaveChangesAsync();
    return Ok(results);
}
```

## Role Selection Modes

### 1. Multi-Select Cards
- Click cards to toggle selection
- Yellow checkmark and border indicate selected roles
- Best for: Visual selection of 2-5 roles

### 2. Drag & Drop
- Drag roles from left panel to right panel
- Click assigned roles to remove them
- Best for: Interactive, visual role management

### 3. Toggle Switches
- List view with on/off switches
- Full role details visible
- Best for: Quick scanning and toggling many roles

### 4. Permission Builder
- Select individual permissions
- Roles auto-selected based on permissions
- Best for: Custom access control, advanced users

## Data Mapping Notes

### Important Field Mappings
```javascript
// Frontend mock data uses string IDs
clinicId: "C001" → Backend needs: 1

// Convert using:
parseInt(selectedStaff.clinicId.replace('C', ''))

// Role IDs from availableRoles array
availableRoles = [
  { id: 1, name: "Super Admin", ... },
  { id: 2, name: "Clinic Admin", ... },
  // etc.
]

// Selected roles array maps to roleIds
selectedRoles.map(r => r.id) → [1, 2, 5]
```

### User ID Clarification
The `userId` field should map to your actual user/staff ID in the database:
- If using `selectedStaff.id` → Make sure this matches the Users table primary key
- If using `selectedStaff.staffId` → Ensure this is the correct user identifier
- Adjust the payload mapping in `handleConfirmAssignment()` as needed

## Testing

### Test Scenario 1: Assign Single Role
1. Search for staff member
2. Select staff (e.g., "Rajesh Kumar")
3. Choose "Multi-Select Cards" mode
4. Click one role (e.g., "Doctor")
5. Click "Apply Roles"
6. Confirm assignment
7. Verify API call creates 1 AccessControl record

### Test Scenario 2: Assign Multiple Roles
1. Search for staff member
2. Select staff (e.g., "Priya Sharma")
3. Choose any mode
4. Select 4 roles (e.g., "Receptionist", "Nurse", "Financial Manager", "HR Manager")
5. Confirm assignment
6. Verify API call creates 4 AccessControl records

### Test Scenario 3: Permission Builder
1. Select "Permission Builder" mode
2. Check permissions: "Patient Records", "Appointments", "Billing"
3. Roles auto-select based on permissions
4. Confirm assignment
5. Verify correct roles assigned

## Error Handling

### Frontend Error Handling
```javascript
try {
  const result = await bulkAssignRoles(payload);
  // Success
} catch (error) {
  console.error('Error:', error);
  alert(`Failed: ${error.message}`);
}
```

### Common Errors
- **401 Unauthorized**: User not logged in → Redirect to login
- **403 Forbidden**: User lacks permission → Show error message
- **400 Bad Request**: Invalid payload → Check userId, clinicId, roleIds
- **404 Not Found**: Endpoint doesn't exist → Verify API URL
- **500 Server Error**: Backend issue → Check server logs

## API Base URL Configuration

The API base URL is configured in `src/services/apiClient.ts`:
```typescript
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7104/api";
```

To change the API URL, set the environment variable:
```
VITE_API_BASE_URL=https://your-api-server.com/api
```

## Next Steps

1. **Implement Backend Endpoint**: Create the `/api/accesscontrol/bulk-assign` endpoint
2. **Test Connection**: Use browser dev tools to verify API calls
3. **Add Loading State**: Show spinner while API call is in progress
4. **Add Success Toast**: Replace alert() with toast notification
5. **Implement Role Revocation**: Add UI to remove/deactivate roles
6. **Add Audit Log**: Track who assigned which roles and when

## Additional Features

### Future Enhancements
- **Role History**: View past role assignments
- **Bulk Edit**: Assign roles to multiple staff at once
- **Role Templates**: Save common role combinations
- **Expiry Dates**: Time-limited role assignments
- **Approval Workflow**: Require manager approval for role changes
- **Role Conflicts**: Prevent incompatible role combinations

## Support
For issues or questions, check:
1. Browser console for error messages
2. Network tab for API call details
3. Backend logs for server-side errors
