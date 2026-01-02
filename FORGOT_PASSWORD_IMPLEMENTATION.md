# Forgot Password Feature - Implementation Guide

## Overview
A complete forgot password feature has been implemented with three main components:

1. **Forgot Password Modal** - Collects email and DOB
2. **Email Sending** - Triggers API to send reset link to email
3. **Reset Password Page** - Secure page for users to set new password

---

## Components Created

### 1. ForgotPasswordModal Component
**File:** `src/components/ForgotPasswordModal.jsx`

**Features:**
- Modal that appears when "Forgot Password" link is clicked
- Collects email address and date of birth
- Validates form data before submission
- Calls `/api/Authentication/forgotPassword` endpoint
- Shows success message with instructions
- Aesthetic design matching app theme with teal/cyan gradient

**Form Fields:**
- 📧 Email Address (required, must be valid)
- 📅 Date of Birth (required, must match registered DOB)

**API Call:**
```javascript
POST https://localhost:7104/api/Authentication/forgotPassword
Body: {
  email: "user@example.com",
  dateOfBirth: "1990-01-15"
}
```

---

### 2. ResetPassword Page Component
**File:** `src/pages/ResetPassword.jsx`

**Features:**
- Full-page component accessible via `/reset-password?token=xyz&email=user@example.com`
- Validates reset token before allowing password entry
- Enforces strong password requirements
- Password strength validation with real-time feedback
- Shows all password requirements as user types
- Redirects to login on successful reset

**Password Requirements:**
✓ Minimum 8 characters
✓ At least one uppercase letter (A-Z)
✓ At least one lowercase letter (a-z)
✓ At least one number (0-9)
✓ At least one special character (!@#$%^&*)

**URL Format:**
```
https://yourdomain.com/reset-password?token=RESET_TOKEN&email=user@example.com
```

**API Calls:**
```javascript
// 1. Validate token
POST https://localhost:7104/api/Authentication/ValidateResetToken
Body: {
  token: "RESET_TOKEN",
  email: "user@example.com"
}

// 2. Reset password
POST https://localhost:7104/api/Authentication/ResetPasswordWithToken
Body: {
  email: "user@example.com",
  newPassword: "NewPassword123!",
  token: "RESET_TOKEN"
}
```

---

## User Flow

### Step 1: User Initiates Password Reset
1. User clicks "🔐 Forgot Password?" link on the login form
2. ForgotPasswordModal appears
3. User enters:
   - Email address
   - Date of birth (must match registered value)

### Step 2: Backend Sends Reset Link
1. Application sends request to `POST /api/Authentication/forgotPassword`
2. Backend verifies user exists and DOB matches
3. Backend generates reset token with expiration
4. Email is sent to user with reset link:
   ```
   https://yourdomain.com/reset-password?token=xyz&email=user@example.com
   ```

### Step 3: User Resets Password
1. User clicks reset link in email
2. ResetPassword page loads and validates token
3. If token is valid:
   - User can enter new password with strength validation
   - Real-time feedback on password requirements
   - Submit to reset password
4. If token is invalid or expired:
   - Shows error message
   - Link to return to login page

### Step 4: Password Successfully Reset
1. New password is saved
2. Success message displayed
3. Automatically redirects to login after 3 seconds
4. User can log in with new credentials

---

## Styling & Theme

Both components use the existing application's color scheme:

**Primary Colors:**
- Teal: `from-teal-600 to-cyan-600` (main buttons/accents)
- Blue: `from-blue-600 to-blue-600` (text, borders)
- Gradient backgrounds: `from-white via-slate-50 to-blue-50`

**Design Elements:**
- Smooth animations with Framer Motion
- Gradient backgrounds and buttons
- Icons for visual clarity (🔐 🔑 📧 📅)
- Responsive design (works on all screen sizes)
- Error handling with red borders and shake animations
- Success messages with green styling
- Password visibility toggle buttons

---

## Integration Points

### 1. Updated LoginModal Component
- Imports `ForgotPasswordModal`
- New state: `showForgotPasswordEmailDOB`
- "Forgot Password?" button now opens new modal
- Location: Below password input field

### 2. Updated App.jsx
- Added route: `/reset-password`
- Component: `ResetPassword`
- Import: `import ResetPassword from "./pages/ResetPassword";`

---

## Backend API Requirements

### Endpoint 1: Forgot Password Request
**Method:** POST  
**URL:** `/api/Authentication/forgotPassword`

**Request Body:**
```json
{
  "email": "user@example.com",
  "dateOfBirth": "1990-01-15"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email"
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "message": "User not found or date of birth does not match"
}
```

**What Backend Should Do:**
1. Find user by email
2. Verify date of birth matches registered value
3. Generate reset token (valid for 1 hour recommended)
4. Save token with expiration in database
5. Send email with reset link containing token and email
6. Return success response

---

### Endpoint 2: Validate Reset Token
**Method:** POST  
**URL:** `/api/Authentication/ValidateResetToken`

**Request Body:**
```json
{
  "token": "RESET_TOKEN_STRING",
  "email": "user@example.com"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Token is valid"
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "message": "Reset link is invalid or has expired"
}
```

**What Backend Should Do:**
1. Find reset token record
2. Verify token matches email
3. Check if token has expired
4. Return validation result

---

### Endpoint 3: Reset Password with Token
**Method:** POST  
**URL:** `/api/Authentication/ResetPasswordWithToken`

**Request Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "NewPassword123!",
  "token": "RESET_TOKEN_STRING"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "message": "Failed to reset password. Token may have expired."
}
```

**What Backend Should Do:**
1. Validate token (same as Endpoint 2)
2. Hash new password
3. Update user's password in database
4. Delete/invalidate reset token
5. Return success response

---

## Important Notes

### Security Considerations
✓ Reset links contain token and email (no sensitive data)
✓ Tokens have expiration (recommend 1 hour)
✓ Password strength enforced on frontend with backend validation
✓ Reset link can only be used once
✓ DOB requirement prevents unauthorized password resets
✓ Email verification required before reset

### Email Content Requirements
The email sent to users should include:
```
Subject: Password Reset Request - DentAesthetics HMS

Body:
Hello [User Name],

You requested a password reset for your DentAesthetics HMS account.

Click the link below to reset your password:
https://yourdomain.com/reset-password?token=RESET_TOKEN&email=user@example.com

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Security Note: Never share this link with anyone.

Best regards,
DentAesthetics HMS Team
```

### Testing the Feature
1. **Frontend Testing:**
   - Click "Forgot Password?" on login page
   - Modal appears correctly
   - Form validation works
   - Submit button disabled when form incomplete

2. **Integration Testing:**
   - Submit form with valid email/DOB
   - Verify API call is made
   - Check API response handling
   - Click reset link from email
   - Verify token validation
   - Reset password and verify it works on login

---

## File Structure
```
src/
├── components/
│   ├── LoginModal.jsx          (Updated - imports ForgotPasswordModal)
│   └── ForgotPasswordModal.jsx  (New)
├── pages/
│   └── ResetPassword.jsx        (New)
└── App.jsx                      (Updated - added /reset-password route)
```

---

## Error Handling

The implementation handles the following scenarios:

1. **Invalid Email Format**
   - Error: "Please enter a valid email address"

2. **Missing DOB**
   - Error: "Date of birth is required"

3. **User Not Found**
   - API returns error message
   - Modal shows: "Failed to process request. Please check your email and date of birth."

4. **DOB Doesn't Match**
   - API returns error message
   - Modal shows appropriate error

5. **Invalid/Expired Reset Token**
   - ResetPassword page shows error
   - Displays: "Invalid reset link. Please request a new password reset."
   - Provides link to return to login

6. **Password Doesn't Meet Requirements**
   - Real-time validation shows what's missing
   - Submit button remains disabled

7. **Passwords Don't Match**
   - Error: "Passwords do not match"

---

## Customization Options

### To Change Colors:
Edit the Tailwind classes in components:
- `from-teal-600 to-cyan-600` - Change primary color
- `from-white via-slate-50 to-blue-50` - Change background gradient
- `border-teal-200` - Change border color

### To Add Custom Logo/Branding:
In ResetPassword.jsx header section, replace the lock emoji (🔐) with your logo.

### To Change Button Text:
Search for hardcoded text in both component files and update strings.

### To Modify Token Expiry Message:
In ResetPassword.jsx, update the token validation error message.

---

## Troubleshooting

**Issue:** Modal doesn't appear when clicking "Forgot Password?"
- Check: Is `showForgotPasswordEmailDOB` state initialized in LoginModal?
- Check: Is ForgotPasswordModal imported?
- Check: Is onClick handler correctly bound?

**Issue:** API call fails
- Check: Is API URL correct? (https://localhost:7104/api/...)
- Check: Are headers set to 'Content-Type': 'application/json'?
- Check: Is request body formatted correctly?

**Issue:** Reset link in email doesn't work
- Check: Is `/reset-password` route added to App.jsx?
- Check: URL format is exactly: `/reset-password?token=xyz&email=user@example.com`
- Check: Is query parameter extraction working? (useSearchParams)

**Issue:** Password requirements not showing
- Check: ResetPassword.jsx password field is rendering correctly
- Check: Regex patterns match expected password format

---

## Success Criteria Checklist

✓ Modal appears when "Forgot Password" link is clicked
✓ Modal collects email and DOB
✓ Form validates before submission
✓ API call is made with correct format
✓ Success message shows in modal
✓ Reset link contains token and email
✓ Reset page loads when clicking email link
✓ Token validation works
✓ Password strength requirements display
✓ Password requirements update in real-time
✓ Submit button disabled until all requirements met
✓ Password reset API call successful
✓ Success message shows before redirect
✓ Redirect to login page occurs
✓ User can log in with new password

---

## Contact for Support
For any issues or questions about this implementation, refer to the component files for inline comments or check the backend API implementation.
