# Access Control API Payload Reference

## Quick Reference: What Gets Sent to Backend

### Scenario: User selects 3 roles for Rajesh Kumar in Clinic C001

```javascript
// Frontend State
selectedStaff = {
  id: 1,
  staffId: "S001",
  firstName: "Rajesh",
  lastName: "Kumar",
  clinicId: "C001",
  currentRole: "Doctor",
  email: "rajesh.kumar@dentaesthetics.com"
}

selectedRoles = [
  { id: 2, name: "Clinic Admin", ... },
  { id: 5, name: "Dental Hygienist", ... },
  { id: 9, name: "Financial Manager", ... }
]
```

### Payload Sent to Backend
```json
POST /api/accesscontrol/bulk-assign
Content-Type: application/json

{
  "userId": 1,
  "clinicId": 1,
  "roleIds": [2, 5, 9],
  "isActive": true
}
```

### Backend Creates 3 Records
```
AccessControl Table:
+---+--------+----------+--------+----------+----------------------------+
| ID| UserId | ClinicId | RoleId | IsActive | CreatedAt                  |
+---+--------+----------+--------+----------+----------------------------+
| 1 | 1      | 1        | 2      | 1        | 2025-11-28 10:30:00        |
| 2 | 1      | 1        | 5      | 1        | 2025-11-28 10:30:00        |
| 3 | 1      | 1        | 9      | 1        | 2025-11-28 10:30:00        |
+---+--------+----------+--------+----------+----------------------------+
```

---

## Field Mapping Reference

### Frontend → Backend Mapping

| Frontend Field | Example Value | Backend Field | Backend Type | Conversion |
|---------------|---------------|---------------|--------------|------------|
| `selectedStaff.id` | `1` | `UserId` | `int` | Direct (number) |
| `selectedStaff.clinicId` | `"C001"` | `ClinicId` | `int` | `parseInt(val.replace('C', ''))` → `1` |
| `selectedRoles[0].id` | `2` | `RoleId` | `int` | Direct (number) |
| Always `true` | `true` | `IsActive` | `bit` | Direct (boolean → 1/0) |

---

## Real Example from Code

### In TeamHub.jsx `handleConfirmAssignment()`
```javascript
const payload = {
  userId: selectedStaff.id,                               // 1
  clinicId: parseInt(selectedStaff.clinicId.replace('C', '')), // "C001" → 1
  roleIds: selectedRoles.map(r => r.id),                  // [2, 5, 9]
  isActive: true                                          // true
};

const result = await bulkAssignRoles(payload);
```

### API Call Details
```
Request URL: https://localhost:7104/api/accesscontrol/bulk-assign
Request Method: POST
Request Headers:
  Content-Type: application/json
  
Request Body:
{
  "userId": 1,
  "clinicId": 1,
  "roleIds": [2, 5, 9],
  "isActive": true
}
```

### Expected Response
```json
HTTP 200 OK
Content-Type: application/json

[
  {
    "accessControlId": 1,
    "userId": 1,
    "clinicId": 1,
    "roleId": 2,
    "isActive": true,
    "createdAt": "2025-11-28T10:30:00.000Z",
    "updatedAt": "2025-11-28T10:30:00.000Z"
  },
  {
    "accessControlId": 2,
    "userId": 1,
    "clinicId": 1,
    "roleId": 5,
    "isActive": true,
    "createdAt": "2025-11-28T10:30:00.000Z",
    "updatedAt": "2025-11-28T10:30:00.000Z"
  },
  {
    "accessControlId": 3,
    "userId": 1,
    "clinicId": 1,
    "roleId": 9,
    "isActive": true,
    "createdAt": "2025-11-28T10:30:00.000Z",
    "updatedAt": "2025-11-28T10:30:00.000Z"
  }
]
```

---

## Available Role IDs (from availableRoles array)

| Role ID | Role Name | Icon | Description |
|---------|-----------|------|-------------|
| 1 | Super Admin | 👑 | Full system access |
| 2 | Clinic Admin | 🏥 | Manage clinic operations |
| 3 | Senior Doctor | 👨‍⚕️ | Lead clinical decisions |
| 4 | Doctor | 🩺 | Patient treatment |
| 5 | Dental Hygienist | 🦷 | Cleanings & preventive |
| 6 | Nurse | 👩‍⚕️ | Patient care support |
| 7 | Receptionist | 📞 | Front desk & scheduling |
| 8 | Practice Manager | 💼 | Operations management |
| 9 | Financial Manager | 💰 | Billing & finance |
| 10 | Accountant | 📊 | Financial records |
| 11 | Lab Technician | 🔬 | Lab work |
| 12 | Pharmacist | 💊 | Medications |
| 13 | Radiologist | 📷 | X-rays & imaging |
| 14 | IT Support | 💻 | Technical support |
| 15 | Marketing | 📢 | Marketing & outreach |
| 16 | HR Manager | 👥 | Human resources |

---

## Testing Checklist

### ✅ Pre-flight Checks
- [ ] Backend API is running
- [ ] Database has `AccessControl` table with correct schema
- [ ] `Roles` table has role entries with IDs 1-16
- [ ] `Users` table has user with ID matching `selectedStaff.id`
- [ ] `Clinics` table has clinic with ID matching converted `clinicId`
- [ ] CORS is configured to allow requests from frontend

### ✅ Test Cases
1. **Single Role Assignment**
   - Select 1 role → Verify 1 record created
   
2. **Multiple Role Assignment**
   - Select 3 roles → Verify 3 records created
   
3. **All Modes Work**
   - Test Multi-Select mode ✓
   - Test Drag & Drop mode ✓
   - Test Toggle Switches mode ✓
   - Test Permission Builder mode ✓
   
4. **Error Handling**
   - Test with invalid userId → Should show error
   - Test with invalid roleId → Should show error
   - Test with offline backend → Should show connection error

---

## Common Issues & Solutions

### Issue 1: "Failed to assign roles: 404 Not Found"
**Cause**: Backend endpoint doesn't exist
**Solution**: Implement `/api/accesscontrol/bulk-assign` endpoint

### Issue 2: "Failed to assign roles: 400 Bad Request"
**Cause**: Invalid payload format
**Solution**: Check that roleIds is an array of numbers, not strings

### Issue 3: "Failed to assign roles: 500 Internal Server Error"
**Cause**: Database constraint violation (foreign key)
**Solution**: 
- Verify userId exists in Users table
- Verify clinicId exists in Clinics table
- Verify all roleIds exist in Roles table

### Issue 4: Duplicate records created
**Cause**: Bulk assign creates new records even if already exists
**Solution**: Backend should check for existing records and update instead

### Issue 5: ClinicId conversion error
**Cause**: Mock data uses "C001" format but backend expects integer
**Solution**: Use `parseInt(clinicId.replace('C', ''))`

---

## Production Considerations

### Security
- ✅ Add authentication token to API headers
- ✅ Validate user has permission to assign roles
- ✅ Log all role assignment changes for audit
- ✅ Implement role hierarchy (can't assign roles higher than own)

### Performance
- ✅ Use transaction for bulk insert
- ✅ Return only IDs instead of full objects
- ✅ Add database indexes on userId, clinicId, roleId

### Data Integrity
- ✅ Prevent duplicate assignments (unique constraint)
- ✅ Cascade delete when user is deleted
- ✅ Archive instead of hard delete for audit trail

---

## Quick Copy-Paste for Backend Developer

### C# Model Class
```csharp
public class AccessControl
{
    [Key]
    public int AccessControlId { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [Required]
    public int ClinicId { get; set; }
    
    [Required]
    public int RoleId { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BulkAssignRolesDto
{
    [Required]
    public int UserId { get; set; }
    
    [Required]
    public int ClinicId { get; set; }
    
    [Required]
    public List<int> RoleIds { get; set; }
    
    public bool IsActive { get; set; } = true;
}
```

### SQL Table Creation
```sql
CREATE TABLE AccessControl (
    AccessControlId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL FOREIGN KEY REFERENCES Users(UserId),
    ClinicId INT NOT NULL FOREIGN KEY REFERENCES Clinics(ClinicId),
    RoleId INT NOT NULL FOREIGN KEY REFERENCES Roles(RoleId),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_UserClinicRole UNIQUE (UserId, ClinicId, RoleId)
);

CREATE INDEX IX_AccessControl_UserId ON AccessControl(UserId);
CREATE INDEX IX_AccessControl_ClinicId ON AccessControl(ClinicId);
CREATE INDEX IX_AccessControl_IsActive ON AccessControl(IsActive);
```
