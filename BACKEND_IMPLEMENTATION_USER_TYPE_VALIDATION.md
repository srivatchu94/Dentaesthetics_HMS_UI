# 🔧 Backend Implementation Guide: User Type Validation

## Overview
Prevent users from logging in with credentials of a different user type.

---

## 1. Update LoginRequest DTO

**File:** `Models/AuthModels.cs` or similar

```csharp
namespace YourNamespace.Models
{
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }

        /// <summary>
        /// User type: "doctor" or "admin"
        /// Optional but recommended for validation
        /// </summary>
        [Required]
        public string UserType { get; set; }
    }
}
```

---

## 2. Update Login Controller

**File:** `Controllers/AuthenticationController.cs`

### Before (Current Implementation)
```csharp
[HttpPost("Login", Name = "Login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    try
    {
        // Validate user and get token
        var user = await ValidateUserCredentials(request.Username, request.Password);
        
        if (user == null)
            return Unauthorized("Invalid credentials");

        var loginResponse = await GenerateTokenResponse(user);
        return Ok(loginResponse);
    }
    catch (Exception ex)
    {
        return BadRequest(ex.Message);
    }
}
```

### After (With User Type Validation) ⭐ RECOMMENDED
```csharp
[HttpPost("Login", Name = "Login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    try
    {
        // Step 1: Validate username and password
        var user = await ValidateUserCredentials(request.Username, request.Password);
        
        if (user == null)
            return Unauthorized(new { error = "Invalid credentials" });

        // Step 2: NEW - Validate user type matches selected type
        if (!string.IsNullOrEmpty(request.UserType))
        {
            var actualUserType = GetUserType(user); // "doctor" or "admin"
            
            if (!actualUserType.Equals(request.UserType, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new 
                { 
                    error = $"Invalid credentials for selected user type",
                    message = $"These credentials are for a {actualUserType}, not a {request.UserType}",
                    actualType = actualUserType,
                    selectedType = request.UserType
                });
            }
        }

        // Step 3: Generate token response
        var loginResponse = await GenerateTokenResponse(user);
        return Ok(loginResponse);
    }
    catch (Exception ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}

/// <summary>
/// Helper method to determine user type
/// </summary>
private string GetUserType(User user)
{
    // Option 1: Check user role
    if (user.Role?.Equals("Doctor", StringComparison.OrdinalIgnoreCase) ?? false)
        return "doctor";
    
    if (user.Role?.Equals("Admin", StringComparison.OrdinalIgnoreCase) ?? false)
        return "admin";

    // Option 2: Check user type property if exists
    if (user is DoctorUser)
        return "doctor";
    
    if (user is AdminUser)
        return "admin";

    // Option 3: Check email domain
    if (user.Email?.EndsWith("@doctors.clinic.com") ?? false)
        return "doctor";
    
    if (user.Email?.EndsWith("@admin.clinic.com") ?? false)
        return "admin";

    // Default
    return "unknown";
}
```

---

## 3. Update LoginResponse (Optional but Recommended)

Include userType in response so frontend can confirm:

```csharp
public class LoginResponse
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public string Username { get; set; }
    public string UserId { get; set; }
    
    /// <summary>
    /// NEW: Include user type in response
    /// </summary>
    public string UserType { get; set; } // "doctor" or "admin"
    
    public List<UserAccess> Access { get; set; }
    public DateTime AccessTokenExpiresAt { get; set; }
    public DateTime RefreshTokenExpiresAt { get; set; }
    public int InactivityTimeoutMinutes { get; set; }
    public int MaxSessionDurationHours { get; set; }
}
```

Update response generation:

```csharp
private async Task<LoginResponse> GenerateTokenResponse(User user)
{
    var tokens = GenerateTokens(user);
    
    return new LoginResponse
    {
        AccessToken = tokens.AccessToken,
        RefreshToken = tokens.RefreshToken,
        Username = user.Username,
        UserId = user.Id.ToString(),
        UserType = GetUserType(user), // Add this line
        Access = await GetUserAccess(user),
        AccessTokenExpiresAt = tokens.AccessTokenExpiresAt,
        RefreshTokenExpiresAt = tokens.RefreshTokenExpiresAt,
        InactivityTimeoutMinutes = 30,
        MaxSessionDurationHours = 8
    };
}
```

---

## 4. OTP Verification Enhancement

Update VerifyOtp to also validate user type:

```csharp
[HttpPost("VerifyOtp", Name = "VerifyOtp")]
public async Task<IActionResult> VerifyOtp([FromBody] OtpVerifyRequest request)
{
    try
    {
        // Validate OTP
        var user = await ValidateOtp(request.Email, request.Otp);
        
        if (user == null)
            return Unauthorized(new { error = "Invalid or expired OTP" });

        // NEW: If userType is provided, validate it matches
        if (!string.IsNullOrEmpty(request.UserType))
        {
            var actualUserType = GetUserType(user);
            
            if (!actualUserType.Equals(request.UserType, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new 
                { 
                    error = "Invalid OTP for selected user type",
                    message = $"This email belongs to a {actualUserType}, not a {request.UserType}",
                    actualType = actualUserType
                });
            }
        }

        // Generate token response
        var loginResponse = await GenerateTokenResponse(user);
        return Ok(loginResponse);
    }
    catch (Exception ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}
```

Update OtpVerifyRequest:

```csharp
public class OtpVerifyRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; }

    /// <summary>
    /// NEW: Optional user type validation
    /// </summary>
    public string UserType { get; set; } // "doctor" or "admin"
}
```

---

## 5. Frontend Integration

Update your frontend LoginModal to send userType:

```javascript
const handleCredentialsSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await loginUser({
      username: credentials.username,
      password: credentials.password,
      userType: userType  // Send selected type ← NEW
    });
    
    // Verify response includes same userType
    if (response.userType && response.userType !== userType) {
      setError(`Account type mismatch! Please use correct login type.`);
      return;
    }
    
    // Continue with login...
  } catch (err) {
    // Error will include helpful message about wrong type
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

For OTP verification:

```javascript
const handleVerifyOtp = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await request(`${AUTH_BASE_URL}/VerifyOtp`, {
      method: 'POST',
      body: JSON.stringify({
        email: otpState.email,
        otp: otpState.otp,
        userType: userType  // Send selected type ← NEW
      })
    });
    
    // Continue with login...
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 6. Testing

### Test Case 1: Doctor tries to login with Admin credentials
```
1. Select "Doctor Login"
2. Enter admin username/password
3. Expected: Error "These credentials are for admin, not doctor"
```

### Test Case 2: Admin tries to login with Doctor credentials
```
1. Select "Admin Login"
2. Enter doctor username/password
3. Expected: Error "These credentials are for doctor, not admin"
```

### Test Case 3: Correct credentials for selected type
```
1. Select "Doctor Login"
2. Enter doctor username/password
3. Expected: Successful login
```

### Test Case 4: OTP with wrong type
```
1. Select "Admin Login"
2. Enter doctor's email for OTP
3. Expected: Error "This email belongs to doctor"
```

---

## 7. Error Messages Reference

**HTTP 400 Bad Request:**
```json
{
  "error": "Invalid credentials for selected user type",
  "message": "These credentials are for a doctor, not an admin",
  "actualType": "doctor",
  "selectedType": "admin"
}
```

**HTTP 401 Unauthorized:**
```json
{
  "error": "Invalid credentials"
}
```

---

## 8. Database Considerations

Make sure your user table has a way to distinguish user types:

```sql
-- Option 1: Role column
ALTER TABLE Users ADD COLUMN Role NVARCHAR(50);
-- Values: 'Doctor', 'Admin'

-- Option 2: Separate tables
CREATE TABLE DoctorUsers (
    Id INT PRIMARY KEY,
    UserId INT,
    LicenseNumber NVARCHAR(50),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE TABLE AdminUsers (
    Id INT PRIMARY KEY,
    UserId INT,
    AdminLevel INT,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Option 3: User type column
ALTER TABLE Users ADD COLUMN UserType NVARCHAR(50);
-- Values: 'Doctor', 'Admin'
```

---

## 9. Logging & Monitoring

Add logging for type mismatch attempts:

```csharp
private readonly ILogger<AuthenticationController> _logger;

// In Login endpoint:
if (!actualUserType.Equals(request.UserType, StringComparison.OrdinalIgnoreCase))
{
    _logger.LogWarning(
        $"Login type mismatch: Username={request.Username}, " +
        $"Attempted={request.UserType}, Actual={actualUserType}, IP={HttpContext.Connection.RemoteIpAddress}"
    );
    
    return BadRequest(new { error = "Invalid credentials for selected user type" });
}
```

This helps you:
- Track confused users
- Identify compromised accounts
- Monitor security incidents

---

## 10. Summary

| Change | Location | Priority |
|--------|----------|----------|
| Add UserType to LoginRequest | Models | High |
| Update Login controller validation | AuthenticationController | High |
| Add GetUserType helper | AuthenticationController | High |
| Add UserType to LoginResponse | Models | Medium |
| Update VerifyOtp validation | AuthenticationController | High |
| Add logging | AuthenticationController | Medium |
| Update database schema | Database | Medium |
| Frontend updates | LoginModal.jsx | High |

---

## Testing Commands

**Using cURL:**
```bash
# Test with wrong type
curl -X POST http://localhost:7104/api/Authentication/Login \
  -H "Content-Type: application/json" \
  -d '{
    "username":"doctor_user",
    "password":"password123",
    "userType":"admin"
  }'

# Expected response (400):
# {
#   "error": "Invalid credentials for selected user type",
#   "message": "These credentials are for a doctor, not an admin"
# }
```

---

**Status:** Ready for implementation
**Estimated Effort:** 2-4 hours
**Security Impact:** Very High
**Breaking Changes:** None (field is optional)
