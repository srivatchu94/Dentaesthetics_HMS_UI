# Login Modal - API Contract & Integration Guide

## 📡 API Endpoints Required

### 1. Username & Password Login
**Endpoint:** `POST /Authentication/login`
**Status:** Already integrated ✅

**Request Format:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response Format (Success 200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "john_doe",
  "userId": "user-12345",
  "access": [
    {
      "enterpriseId": 1,
      "clinicId": 101,
      "roleIds": [1, 2]
    }
  ],
  "accessTokenExpiresAt": "2024-12-11T20:30:00Z",
  "refreshTokenExpiresAt": "2024-12-12T10:15:00Z",
  "inactivityTimeoutMinutes": 30,
  "maxSessionDurationHours": 8
}
```

**Error Response (400/401):**
```json
{
  "error": "Invalid credentials",
  "message": "Username or password is incorrect"
}
```

---

### 2. Send OTP to Email
**Endpoint:** `POST /Authentication/SendOtp`
**Status:** Newly integrated ✅

**Request Format:**
```json
{
  "email": "user@example.com"
}
```

**Response Format (Success 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

**Error Response (400/404):**
```json
{
  "success": false,
  "error": "Email not found",
  "message": "User with this email does not exist"
}
```

**Alternative Error:**
```json
{
  "success": false,
  "error": "Email service error",
  "message": "Failed to send OTP email"
}
```

---

### 3. Verify OTP Code
**Endpoint:** `POST /Authentication/VerifyOtp`
**Status:** Newly integrated ✅

**Request Format:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response Format (Success 200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "user@example.com",
  "userId": "user-12345",
  "access": [
    {
      "enterpriseId": 1,
      "clinicId": 101,
      "roleIds": [1]
    }
  ],
  "accessTokenExpiresAt": "2024-12-11T20:30:00Z",
  "refreshTokenExpiresAt": "2024-12-12T10:15:00Z",
  "inactivityTimeoutMinutes": 30,
  "maxSessionDurationHours": 8
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "error": "Invalid OTP",
  "message": "OTP code is incorrect or expired"
}
```

**Alternative Error:**
```json
{
  "success": false,
  "error": "OTP expired",
  "message": "OTP code has expired. Please request a new one."
}
```

---

## 🔄 User Flows

### Flow 1: Username & Password
```
User Input
    ↓
loginUser('/Authentication/login', { username, password })
    ↓
Backend validates credentials
    ↓
Returns: { accessToken, refreshToken, user, access, ... }
    ↓
saveAuthToken(response)
    ↓
Redirect to home page ✅
```

### Flow 2: Email OTP
```
User Input (Email)
    ↓
request('/Authentication/SendOtp', { email })
    ↓
Backend sends OTP to email
    ↓
Returns: { success: true, expiresIn: 300 }
    ↓
Show "OTP sent to..." message ✅
    ↓
User Input (OTP Code)
    ↓
request('/Authentication/VerifyOtp', { email, otp })
    ↓
Backend validates OTP
    ↓
Returns: { accessToken, refreshToken, user, access, ... }
    ↓
saveAuthToken(response)
    ↓
Redirect to home page ✅
```

---

## 🛠️ Implementation Details

### Code Example: Send OTP
```javascript
const handleRequestOtp = async (e) => {
  e.preventDefault();
  
  if (!otpState.email || !otpState.email.includes('@')) {
    setError('Please enter a valid email address');
    return;
  }

  setLoading(true);
  try {
    const response = await request(`/Authentication/SendOtp`, {
      method: 'POST',
      body: JSON.stringify({ email: otpState.email })
    });
    
    setOtpState(prev => ({ ...prev, step: 'otp' }));
    setSuccessMessage(`OTP sent to ${otpState.email.slice(0, 3)}***...`);
    setTimeout(() => setSuccessMessage(''), 3000);
  } catch (err) {
    setError(err.message || 'Failed to send OTP. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Code Example: Verify OTP
```javascript
const handleVerifyOtp = async (e) => {
  e.preventDefault();
  
  if (!otpState.otp || otpState.otp.length !== 6) {
    setError('Please enter a valid 6-digit OTP');
    return;
  }

  setLoading(true);
  try {
    const response = await request(`/Authentication/VerifyOtp`, {
      method: 'POST',
      body: JSON.stringify({ 
        email: otpState.email, 
        otp: otpState.otp 
      })
    });
    
    saveAuthToken(response);
    localStorage.setItem('userType', userType);
    localStorage.setItem('email', otpState.email);
    
    setSuccessMessage(`Welcome ${userType === 'doctor' ? 'Doctor' : 'Administrator'}! 🎉`);
    
    setTimeout(() => {
      resetForm();
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    }, 1500);
  } catch (err) {
    setError(err.message || 'Invalid OTP. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## 📝 Notes for Backend Developer

### SendOtp Implementation
- Email format validation: `email@domain.com`
- OTP generation: 6-digit random code
- OTP expiration: Recommend 5-10 minutes (300-600 seconds)
- Email service: Must be configured and working
- Rate limiting: Consider implementing to prevent abuse
- Idempotency: Same email within 5 minutes = same OTP

### VerifyOtp Implementation
- OTP validation: Case-insensitive, numeric, exactly 6 digits
- Email validation: Match with SendOtp request
- Expiration check: Reject if OTP is expired
- Attempt limiting: Consider limiting failed attempts (e.g., max 3 tries)
- One-time use: OTP should be invalidated after successful verification
- Return format: Must match LoginResponse structure

### Important
- Both endpoints must support CORS (browser requests)
- Content-Type must accept `application/json`
- Response status codes must be accurate (200, 400, 404, 401)
- Error messages should be descriptive but not reveal sensitive info

---

## 🧪 Manual Testing Commands

### Using cURL to Test SendOtp
```bash
curl -X POST http://localhost:5000/api/Authentication/SendOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Using cURL to Test VerifyOtp
```bash
curl -X POST http://localhost:5000/api/Authentication/VerifyOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### Using JavaScript/Fetch
```javascript
// Test SendOtp
fetch('/api/Authentication/SendOtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
})
.then(r => r.json())
.then(console.log);

// Test VerifyOtp
fetch('/api/Authentication/VerifyOtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', otp: '123456' })
})
.then(r => r.json())
.then(console.log);
```

---

## ✅ Verification Checklist

- [ ] SendOtp endpoint exists and responds
- [ ] VerifyOtp endpoint exists and responds
- [ ] Email is actually being sent to users
- [ ] OTP code format is 6 digits
- [ ] OTP expires after configured time
- [ ] VerifyOtp returns proper auth tokens
- [ ] Response format matches specified structure
- [ ] Error responses are descriptive
- [ ] CORS is properly configured
- [ ] Rate limiting is in place (optional but recommended)

---

## 🚀 Deployment Notes

1. **Backend must be running** before testing
2. **Email service must be configured** for OTP delivery
3. **CORS headers must allow** frontend origin
4. **API base URL must match** in apiClient.ts
5. **SSL/HTTPS recommended** for production

---

**API Contract Version:** 1.0
**Last Updated:** December 11, 2024
**Status:** Ready for Backend Implementation
