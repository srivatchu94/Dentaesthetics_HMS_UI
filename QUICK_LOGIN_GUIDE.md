# Quick Access Guide - Twin Login

## 🚀 Quick Start

### Open Application
```
http://localhost:5174/
```

### Click Login Button
Look for **"🔐 Login as Doctor/Admin"** button in the Hero Section

### Select Your Role
- **👨‍⚕️ Doctor Login** (Blue) - For healthcare practitioners
- **👔 Admin Login** (Orange) - For system administrators

### Choose Authentication Method
- **📝 Username & Password** - Traditional credentials
- **📱 Mobile OTP** - SMS-based one-time password

### Complete Login
- Enter your details
- Get success message
- Redirected to dashboard

---

## 📍 Where to Click

### On Home Page (/):
The page has a Hero Section with these buttons:
- Left: "Access Doctor's Space" 👨‍⚕️
- **Right: "Login as Doctor/Admin" 🔐** ← **CLICK THIS**

### In Header:
Top-right corner has a "Login" button
- Redirects to the full login page

---

## 🎯 Login Flow

```
Home Page
    ↓
Click "Login as Doctor/Admin"
    ↓
Select Doctor or Admin
    ↓
Select Credentials or OTP
    ↓
Enter Details
    ↓
Login Success!
```

---

## 💡 Key Info

| Feature | Details |
|---------|---------|
| **Doctor Login** | Blue theme, access patient records |
| **Admin Login** | Orange theme, manage operations |
| **Credentials** | Username + Password method |
| **OTP** | Mobile number + 6-digit SMS code |
| **Mobile Number** | Must be exactly 10 digits |
| **OTP Code** | Must be exactly 6 digits |
| **Back Button** | Available at each step |
| **Success Redirect** | Auto-redirect in 1.5 seconds |

---

## ✨ What You'll See

### Step 1: User Type Selection
Two beautiful animated cards:
- Doctor card (Blue gradient)
- Admin card (Orange gradient)
- Click either card to proceed

### Step 2: Authentication Method
Two method cards:
- Username & Password card
- Mobile OTP card
- Click your preferred method

### Step 3: Login Form
- For Credentials: Username & Password fields
- For OTP: Mobile number field, then OTP field

### Step 4: Success
- Animated success message
- Auto-redirect to dashboard

---

## 🔄 Navigation

You can go back at any step:
- At method selection → Back to user type selection
- At login form → Back to method selection
- Full reset of the form each time

---

## 🧪 Test It Now!

1. Start the dev server: `npm run dev`
2. Open http://localhost:5174/
3. Click **"🔐 Login as Doctor/Admin"**
4. Try both routes:
   - Doctor + Credentials
   - Admin + OTP
5. Enjoy the smooth animations!

---

## 📞 Contact

If you need any modifications to the login flow, just let me know!
