# Login Modal - Quick Testing Guide

## 🎯 What Was Fixed

### 1. Email OTP (Instead of Mobile)
- OTP option now asks for **Email Address** instead of mobile number
- Sends OTP via email using `POST /Authentication/SendOtp`
- Verifies OTP using `POST /Authentication/VerifyOtp`

### 2. Back Button ✅
- Back button now works on all modal screens
- Properly navigates: User Type → Login Method → Forms
- State is properly reset when navigating back

### 3. Close Button ✅
- Close (X) button now works on all modal screens
- Closes the modal and resets form completely

### 4. Color Theme ✅
- Changed from dark purple/blue theme to light cream/gray/teal theme
- Matches the main page background color
- Still has good contrast for readability

### 5. API Integration ✅
- **Username & Password:** Uses existing `/Authentication/login` endpoint
- **Email OTP:** 
  - Send: `POST /Authentication/SendOtp` with `{ email }`
  - Verify: `POST /Authentication/VerifyOtp` with `{ email, otp }`

---

## 🧪 How to Test

### Test 1: Navigation (Back Buttons)
1. Click "Doctor Login" or "Admin Login"
2. Click back button (←) → Should return to user type selection ✅
3. Click a login method (e.g., Email OTP)
4. Click back button (←) → Should return to method selection ✅
5. Start from beginning and click a form
6. Click back button (←) → Should return to method selection ✅

### Test 2: Close Button
1. Open modal and click X (close button) on any screen
2. Modal should close completely ✅
3. Form should be reset (no cached data)
4. Should be able to open modal again from beginning

### Test 3: Email OTP Flow
1. Select Login Type (Doctor or Admin)
2. Select "Email OTP" option
3. Enter your email: `test@example.com`
4. Click "Send OTP"
5. ✅ Should show: "OTP sent to tes***@example.com"
6. ✅ Should show email input field disappear
7. ✅ Should show OTP code input field
8. Enter 6-digit OTP from email
9. Click "Verify & Login"
10. ✅ Should save token and redirect to home page

### Test 4: Username & Password Flow
1. Select Login Type (Doctor or Admin)
2. Select "Username & Password" option
3. Enter your username
4. Enter your password
5. Click "Login"
6. ✅ Should call existing `/Authentication/login` endpoint
7. ✅ Should save tokens and redirect on success

### Test 5: Color Theme
1. Look at main page background (light cream/gray/teal)
2. Open login modal
3. ✅ Modal background should match the main page theme
4. ✅ Text should be readable (dark text on light background)
5. ✅ Buttons should still have good contrast

### Test 6: Error Handling
1. Try to send OTP without entering email
   - ✅ Should show error: "Please enter a valid email address"
2. Try to send OTP with invalid email
   - ✅ Should show error: "Please enter a valid email address"
3. Try to verify OTP without entering code
   - ✅ Should show error: "Please enter a valid 6-digit OTP"
4. Try to verify OTP with wrong code
   - ✅ Should show API error from backend

---

## 📝 Expected API Behavior

### SendOtp Endpoint
**Request:**
```json
POST /Authentication/SendOtp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent to email"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email not found" or "Failed to send OTP"
}
```

### VerifyOtp Endpoint
**Request:**
```json
POST /Authentication/VerifyOtp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "accessToken": "eyJ0eXAi...",
  "refreshToken": "eyJ0eXAi...",
  "username": "user@example.com",
  "userId": "123",
  "access": [...],
  "accessTokenExpiresAt": "2024-12-12T...",
  "refreshTokenExpiresAt": "2024-12-13T...",
  "inactivityTimeoutMinutes": 30,
  "maxSessionDurationHours": 8
}
```

---

## 🐛 Troubleshooting

### "OTP sent to..." message doesn't appear
- Check browser console for API errors
- Verify `/Authentication/SendOtp` endpoint exists
- Check if email format is valid

### Back button doesn't work
- Check browser console for JavaScript errors
- Verify component state management
- Try hard refresh (Ctrl+F5)

### Close button doesn't work
- Check if click handler is properly attached
- Verify `onClose` prop is passed from parent
- Check z-index conflicts with other elements

### Colors look wrong
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if Tailwind CSS is properly compiled
- Verify `cream`, `warmGray`, `teal` colors are defined in Tailwind config

---

## ✅ Checklist Before Going Live

- [ ] Back buttons work on all modal screens
- [ ] Close buttons work on all modal screens
- [ ] Email OTP flow completes successfully
- [ ] Username/Password login still works
- [ ] Color theme matches main page
- [ ] All error messages are clear
- [ ] Success messages appear when appropriate
- [ ] No JavaScript console errors
- [ ] Responsive on mobile devices
- [ ] Form resets when modal closes
