# Backend API Requirements for Prescription Management System

## Prescription Controller Endpoints

### 1. Create Prescription
**Endpoint:** `POST /Prescriptions/Create`

**Request Body:**
```json
{
  "visitId": 0,
  "patientId": 123,
  "appointmentId": 456,
  "doctorId": 789,
  "doctorName": "Dr. John Doe",
  "doctorRegistrationNumber": "DEN/2023/00123",
  "prescriptionDate": "2025-12-16",
  "prescriptionContent": "Amoxicillin - 500mg twice daily for 5 days\nIbuprofen - 400mg after meals for 7 days",
  "notes": "Take with food"
}
```

**Response:**
```json
{
  "prescriptionId": 1,
  "visitId": 0,
  "patientId": 123,
  "appointmentId": 456,
  "doctorId": 789,
  "doctorName": "Dr. John Doe",
  "doctorRegistrationNumber": "DEN/2023/00123",
  "prescriptionDate": "2025-12-16",
  "prescriptionContent": "Amoxicillin - 500mg twice daily for 5 days\nIbuprofen - 400mg after meals for 7 days",
  "notes": "Take with food",
  "createdAt": "2025-12-16T10:30:00Z"
}
```

---

### 2. Get Prescription by ID
**Endpoint:** `GET /Prescriptions/Get?id={prescriptionId}`

**Response:**
```json
{
  "prescriptionId": 1,
  "visitId": 0,
  "patientId": 123,
  "appointmentId": 456,
  "doctorId": 789,
  "doctorName": "Dr. John Doe",
  "doctorRegistrationNumber": "DEN/2023/00123",
  "prescriptionDate": "2025-12-16",
  "prescriptionContent": "Amoxicillin - 500mg twice daily for 5 days",
  "notes": "Take with food",
  "createdAt": "2025-12-16T10:30:00Z",
  "updatedAt": "2025-12-16T10:35:00Z"
}
```

---

### 3. Get Prescriptions by Appointment
**Endpoint:** `GET /Prescriptions/GetByAppointment?appointmentId={appointmentId}`

**Response:**
```json
[
  {
    "prescriptionId": 1,
    "visitId": 0,
    "patientId": 123,
    "appointmentId": 456,
    "doctorId": 789,
    "doctorName": "Dr. John Doe",
    "doctorRegistrationNumber": "DEN/2023/00123",
    "prescriptionDate": "2025-12-16",
    "prescriptionContent": "Amoxicillin - 500mg twice daily for 5 days",
    "notes": "Take with food",
    "createdAt": "2025-12-16T10:30:00Z"
  }
]
```

---

### 4. Update Prescription
**Endpoint:** `PUT /Prescriptions/Update?id={prescriptionId}`

**Request Body:**
```json
{
  "prescriptionId": 1,
  "visitId": 0,
  "patientId": 123,
  "appointmentId": 456,
  "doctorId": 789,
  "doctorName": "Dr. John Doe",
  "doctorRegistrationNumber": "DEN/2023/00123",
  "prescriptionDate": "2025-12-16",
  "prescriptionContent": "Amoxicillin - 500mg three times daily for 7 days",
  "notes": "Take with food, avoid dairy products"
}
```

**Response:**
```json
{
  "prescriptionId": 1,
  "visitId": 0,
  "patientId": 123,
  "appointmentId": 456,
  "doctorId": 789,
  "doctorName": "Dr. John Doe",
  "doctorRegistrationNumber": "DEN/2023/00123",
  "prescriptionDate": "2025-12-16",
  "prescriptionContent": "Amoxicillin - 500mg three times daily for 7 days",
  "notes": "Take with food, avoid dairy products",
  "updatedAt": "2025-12-16T10:45:00Z"
}
```

---

### 5. Delete Prescription
**Endpoint:** `DELETE /Prescriptions/Delete?id={prescriptionId}`

**Response:** HTTP 204 No Content

---

## Data Model

### Prescription Entity (C#)
```csharp
public class Prescription
{
    public int PrescriptionId { get; set; }
    public int VisitId { get; set; }
    public int PatientId { get; set; }
    public int AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; }
    public string DoctorRegistrationNumber { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public string PrescriptionContent { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

### CreatePrescriptionDto (C#)
```csharp
public class CreatePrescriptionDto
{
    public int VisitId { get; set; }
    public int PatientId { get; set; }
    public int AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; }
    public string DoctorRegistrationNumber { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public string PrescriptionContent { get; set; }
    public string Notes { get; set; }
}
```

### UpdatePrescriptionDto (C#)
```csharp
public class UpdatePrescriptionDto
{
    public int PrescriptionId { get; set; }
    public int VisitId { get; set; }
    public int PatientId { get; set; }
    public int AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; }
    public string DoctorRegistrationNumber { get; set; }
    public DateTime PrescriptionDate { get; set; }
    public string PrescriptionContent { get; set; }
    public string Notes { get; set; }
}
```

---

## Database Schema

### SQL Create Table
```sql
CREATE TABLE Prescriptions (
    PrescriptionId INT PRIMARY KEY IDENTITY(1,1),
    VisitId INT,
    PatientId INT NOT NULL,
    AppointmentId INT,
    DoctorId INT NOT NULL,
    DoctorName NVARCHAR(255) NOT NULL,
    DoctorRegistrationNumber NVARCHAR(50),
    PrescriptionDate DATETIME NOT NULL,
    PrescriptionContent NVARCHAR(MAX) NOT NULL,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT FK_Prescriptions_Patients FOREIGN KEY (PatientId) REFERENCES Patients(PatientId),
    CONSTRAINT FK_Prescriptions_Appointments FOREIGN KEY (AppointmentId) REFERENCES Appointments(AppointmentId),
    CONSTRAINT FK_Prescriptions_Doctors FOREIGN KEY (DoctorId) REFERENCES StaffDetails(StaffId)
);

CREATE INDEX IX_Prescriptions_PatientId ON Prescriptions(PatientId);
CREATE INDEX IX_Prescriptions_AppointmentId ON Prescriptions(AppointmentId);
CREATE INDEX IX_Prescriptions_DoctorId ON Prescriptions(DoctorId);
CREATE INDEX IX_Prescriptions_PrescriptionDate ON Prescriptions(PrescriptionDate);
```

---

## Appointments Controller Enhancement

### Get Appointments by Doctor ID
**Endpoint:** `GET /Appointments/GetAppointmentsByDoctorID?clinicId={clinicId}&UserName={username}&appointmentDate={date}`

**Query Parameters:**
- `clinicId` (int) - Clinic ID
- `UserName` (string) - Doctor's username
- `appointmentDate` (DateTime) - Appointment date filter

**Response:**
```json
[
  {
    "appointmentId": 456,
    "patientId": 123,
    "clinicId": 1,
    "doctorId": 789,
    "firstName": "John",
    "lastName": "Smith",
    "phoneNumber": "+1-555-0123",
    "email": "john.smith@email.com",
    "appointmentDate": "2025-12-16",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "appointmentType": "Regular Checkup",
    "reasonForVisit": "Dental cleaning and checkup",
    "status": "Scheduled",
    "isConfirmed": true,
    "createdAt": "2025-12-15T14:30:00Z"
  }
]
```

---

## Inventory Master Endpoints (Existing - Required)

### Create Inventory Master Item
**Endpoint:** `POST /InventoryMaster/Create`

**Request Body:**
```json
{
  "itemName": "Amoxicillin 500mg",
  "categoryId": 1,
  "unitOfMeasure": "tablet",
  "reorderLevel": 50,
  "description": "Antibiotic medication for dental infections"
}
```

**Response:**
```json
{
  "id": 101,
  "itemName": "Amoxicillin 500mg",
  "categoryId": 1,
  "unitOfMeasure": "tablet",
  "reorderLevel": 50,
  "description": "Antibiotic medication for dental infections",
  "createdAt": "2025-12-16T10:30:00Z"
}
```

---

## Required Dependencies

### NuGet Packages
- `EntityFrameworkCore`
- `EntityFrameworkCore.SqlServer`
- `AutoMapper` (for DTO mapping)

### Middleware Configuration
```csharp
services.AddControllers();
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
services.AddAutoMapper(typeof(MappingProfile));
```

---

## Example Controller Implementation

```csharp
[ApiController]
[Route("api/[controller]")]
public class PrescriptionsController : ControllerBase
{
    private readonly ILogger<PrescriptionsController> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public PrescriptionsController(
        ILogger<PrescriptionsController> logger,
        ApplicationDbContext context,
        IMapper mapper)
    {
        _logger = logger;
        _context = context;
        _mapper = mapper;
    }

    [HttpPost("Create")]
    public async Task<ActionResult<PrescriptionDto>> CreatePrescription(
        CreatePrescriptionDto dto)
    {
        try
        {
            var prescription = _mapper.Map<Prescription>(dto);
            _context.Prescriptions.Add(prescription);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPrescription), new { id = prescription.PrescriptionId }, 
                _mapper.Map<PrescriptionDto>(prescription));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating prescription");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("Get")]
    public async Task<ActionResult<PrescriptionDto>> GetPrescription(int id)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
            return NotFound();
        return _mapper.Map<PrescriptionDto>(prescription);
    }

    [HttpGet("GetByAppointment")]
    public async Task<ActionResult<IEnumerable<PrescriptionDto>>> GetByAppointment(int appointmentId)
    {
        var prescriptions = await _context.Prescriptions
            .Where(p => p.AppointmentId == appointmentId)
            .ToListAsync();
        return _mapper.Map<List<PrescriptionDto>>(prescriptions);
    }

    [HttpPut("Update")]
    public async Task<ActionResult<PrescriptionDto>> UpdatePrescription(
        int id,
        UpdatePrescriptionDto dto)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
            return NotFound();

        _mapper.Map(dto, prescription);
        prescription.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return _mapper.Map<PrescriptionDto>(prescription);
    }

    [HttpDelete("Delete")]
    public async Task<IActionResult> DeletePrescription(int id)
    {
        var prescription = await _context.Prescriptions.FindAsync(id);
        if (prescription == null)
            return NotFound();

        _context.Prescriptions.Remove(prescription);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid request parameters",
  "message": "AppointmentId is required"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "User must be logged in"
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Prescription with ID 999 not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An error occurred while processing your request"
}
```

---

## Testing the Endpoints

### Using cURL

**Create Prescription:**
```bash
curl -X POST http://localhost:5000/api/prescriptions/create \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": 0,
    "patientId": 123,
    "appointmentId": 456,
    "doctorId": 789,
    "doctorName": "Dr. John Doe",
    "doctorRegistrationNumber": "DEN/2023/00123",
    "prescriptionDate": "2025-12-16",
    "prescriptionContent": "Amoxicillin - 500mg twice daily for 5 days",
    "notes": "Take with food"
  }'
```

**Get by Appointment:**
```bash
curl http://localhost:5000/api/prescriptions/GetByAppointment?appointmentId=456
```

**Get Appointments by Doctor:**
```bash
curl "http://localhost:5000/api/appointments/GetAppointmentsByDoctorID?clinicId=1&UserName=johndoe&appointmentDate=2025-12-16"
```

---

## Notes for Backend Developer

1. **Validation:** Ensure all required fields are validated before saving
2. **Authorization:** Add doctor authorization checks - doctors should only see their own appointments
3. **Timestamps:** Always set CreatedAt on create and UpdatedAt on update
4. **Soft Delete:** Consider implementing soft delete for prescriptions (add IsDeleted flag)
5. **Audit Trail:** Log all prescription operations for compliance
6. **Concurrency:** Handle concurrent prescription updates gracefully
7. **Pagination:** Consider adding pagination for GetByAppointment if there are many prescriptions
8. **Search:** Consider adding advanced search by patient name, date range, etc.

---

## Frontend Frontend Integration Points

The frontend expects these endpoints to be available:
- ✅ `/Appointments/GetAppointmentsByDoctorID`
- ✅ `/Prescriptions/Create`
- ✅ `/Prescriptions/Get`
- ✅ `/Prescriptions/GetByAppointment`
- ✅ `/Prescriptions/Update`
- ✅ `/Prescriptions/Delete`
- ✅ `/InventoryMaster/Create`
- ✅ `/Patient/GetPatientFullProfile`

All of these are now fully integrated in the frontend and ready for your backend implementation!
