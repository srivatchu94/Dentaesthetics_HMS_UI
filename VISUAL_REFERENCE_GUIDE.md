# 🎨 Visual Reference: Enhanced OTP Modal Screens

## Screen 1: Email Input Screen

```
┌─────────────────────────────────────────────────────────┐
│  [X close]                                              │
│                                                         │
│  📧 Email Address                                       │
│  We'll send a 6-digit verification code to this email  │
│                                                         │
│  ╔─────────────────────────────────────────────────╗  │
│  │ your.email@example.com                          │  │
│  ╚─────────────────────────────────────────────────╝  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📤 Send Verification Code                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 💡 Check your email (including spam folder)     │  │
│  │    for the verification code                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [← Back] [Home]                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 2: OTP Verification Screen - Timer Active

```
┌─────────────────────────────────────────────────────────┐
│  [X close]                           [← Change email]   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📧 OTP sent to                                  │  │
│  │ user@example.com                                │  │
│  │ Check your email for the verification code     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Enter Verification Code                               │
│                                                         │
│  ╔─────────────────────────────────────────────────╗  │
│  │ 1 2 3 4 5 6                                    │  │
│  │ (large, spaced-out display)                   │  │
│  ╚─────────────────────────────────────────────────╝  │
│  6/6 digits   ✅ Ready to verify                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Can request new OTP in                          │  │
│  │              25                                 │  │
│  │              s                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ✓ Verify & Login                               │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 3: OTP Verification Screen - Timer Expired

```
┌─────────────────────────────────────────────────────────┐
│  [X close]                           [← Change email]   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📧 OTP sent to                                  │  │
│  │ user@example.com                                │  │
│  │ Check your email for the verification code     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Enter Verification Code                               │
│                                                         │
│  ╔─────────────────────────────────────────────────╗  │
│  │ 1 2 3 4 5 6                                    │  │
│  │ (large, spaced-out display)                   │  │
│  ╚─────────────────────────────────────────────────╝  │
│  6/6 digits   ✅ Ready to verify                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔄 Resend OTP                                   │  │
│  │ (slides in with animation)                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ✓ Verify & Login                               │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 4: Verify Button States

### Disabled State (< 6 digits)
```
OTP Field: [ 1 2 3 4 5 _ ]  (4/6 digits)

Button:
┌──────────────────────────┐
│ ✓ Verify & Login         │  ← 50% opacity, not clickable
└──────────────────────────┘

Text: (nothing, button disabled)
```

### Enabled State (= 6 digits)
```
OTP Field: [ 1 2 3 4 5 6 ]  (6/6 digits)
                ✅ Ready to verify

Button:
┌──────────────────────────┐
│ ✓ Verify & Login         │  ← 100% opacity, clickable
└──────────────────────────┘
(with glow/shadow on hover)
```

### Loading State
```
Button:
┌──────────────────────────┐
│ ⏳ (spinning icon)       │  ← Spinning animation
└──────────────────────────┘
```

---

## Color Palette

### Doctor Login Theme
```
Primary Blue:     #3B82F6 (rgb(59, 130, 246))
Accent Cyan:      #06B6D4 (rgb(6, 182, 212))
Button Gradient:  blue-600 → cyan-600
Border:           Blue-400/blue-500
```

### Admin Login Theme
```
Primary Orange:   #EA580C (rgb(234, 88, 12))
Accent Red:       #DC2626 (rgb(220, 38, 38))
Button Gradient:  orange-600 → red-600
Border:           Orange-400/red-500
```

### Info Boxes
```
Email Confirmation: Blue background (#EFF6FF)
Timer Display:      Amber background (#FFFBEB)
Error Messages:     Red background (#FEE2E2)
Success Messages:   Green background (#F0FDF4)
```

---

## Typography

```
Header (h2):       text-2xl, font-bold
Labels:            text-sm, font-semibold
Body:              text-sm, regular
Timer Number:      text-2xl, font-bold
OTP Input:         text-3xl, font-bold, tracking-widest
Digits Counter:    text-xs, text-gray-500
```

---

## Spacing Reference

```
Between major sections:    space-y-6 (24px)
Between labels/fields:     space-y-4 (16px)
Padding in boxes:          p-4 (16px)
Border radius:             rounded-lg (8px)
Box shadows:               shadow-lg for cards
```

---

## Button Styles

### Primary Button (Send/Verify)
```
Background:    Gradient (doctor: blue→cyan, admin: orange→red)
Padding:       py-3 (12px vertical)
Border Radius: rounded-lg
Text Color:    White, font-bold
Hover:         Lighter gradient shade
Disabled:      opacity-60, cursor-not-allowed
Width:         w-full (100%)
```

### Secondary Button (Resend)
```
Background:    Gradient (purple-500 → pink-500)
Padding:       py-3
Border Radius: rounded-lg
Text Color:    White, font-semibold
Hover:         Lighter gradient
Animation:     Slides in from below
```

### Text Button (Change Email)
```
Background:    transparent
Text Color:    gray-600
Padding:       py-2
Hover:         gray-800
Font:          text-sm, font-medium
```

---

## Animations

### Confirmation Message
```
Enter: opacity 0 → 1, y: -10 → 0 (200ms)
Exit:  opacity 1 → 0, y: 0 → -10 (200ms)
```

### Timer Number
```
Each second: scale 1.2 → 1 (100ms)
Effect: Bouncy countdown feel
```

### Resend Button
```
Enter: opacity 0 → 1, y: 10 → 0 (300ms)
Timing: Staggered after timer completes
```

### "Ready to Verify" Message
```
Enter: opacity 0 → 1 (300ms)
Trigger: When OTP length = 6
```

---

## Responsive Design

### Desktop (> 1024px)
```
Modal width:     max-w-md (448px)
Input padding:   px-4 py-3
Font sizes:      As defined above
```

### Tablet (768px - 1024px)
```
Modal width:     90vw (responsive)
Input padding:   px-4 py-3
Font sizes:      Slightly smaller
Touch targets:   Minimum 44px
```

### Mobile (< 768px)
```
Modal width:     95vw (full width with margins)
Input padding:   px-4 py-4 (more vertical)
Font sizes:      Smaller but readable
Touch targets:   Minimum 48px
Buttons:         Full width
Spacing:         Increased for readability
```

---

## Accessibility Features

### Color Contrast
```
Text on white:      Gray-800 (7.5:1 ratio) ✅
Button on gradient: White on color (8:1+ ratio) ✅
Info boxes:         Colored border + background ✅
```

### Focus States
```
Inputs:    border-blue-500 (2px) + shadow
Buttons:   ring-2 ring-offset-2 ring-color
Links:     underline on focus + color change
```

### Labels
```
<label htmlFor="email">Email Address</label>
<input id="email" ... />
All inputs have associated labels
```

---

## State Indicators

### Email Validation
```
Invalid:  border-red-500 + error message
Valid:    border-green-500 (after interaction)
```

### OTP Input Progress
```
0/6:  Text "0/6 digits" in gray
1-5:  Text "X/6 digits" in gray
6:    "✅ Ready to verify" in green
```

### Timer Status
```
30-1s:  "Can request new OTP in XXs" (amber)
0s:     "🔄 Resend OTP" button (purple-pink)
```

---

## Error States

```
Error Box:
┌─────────────────────────┐
│ ⚠️ Error message        │
│ (red background)        │
│ (animation in)          │
└─────────────────────────┘

Auto-clear:  After 5 seconds or user action
Animation:   Fade out smoothly
```

---

## Success States

```
Success Box:
┌─────────────────────────┐
│ ✅ OTP sent to [email]  │
│ (green background)      │
│ (animation in)          │
└─────────────────────────┘

Auto-clear:  After 5 seconds
Animation:   Fade out smoothly
```

---

## Mobile Optimization

### Touch Targets
```
All buttons:   Minimum 48px × 48px
All inputs:    Minimum 44px height
Spacing:       18px between elements
```

### Readability
```
Line height:   1.5
Letter spacing: Normal
Font size:     Minimum 16px on mobile
Color contrast: 7:1 ratio minimum
```

### Scrolling
```
Modal fits:    90vh on screen
No overflow:   Vertical only if needed
Keyboard gap:  Account for mobile keyboard
```

---

## Browser Compatibility

```
Chrome:    ✅ Full support
Firefox:   ✅ Full support
Safari:    ✅ Full support (iOS 12+)
Edge:      ✅ Full support
Mobile:    ✅ All modern browsers
```

---

## Performance Notes

```
Timer:      setInterval cleared on unmount
Animations: Hardware-accelerated (transform)
Renders:    Optimized with proper deps
Memory:     No leaks from timers
Bundle:     No additional dependencies
```

---

**Version:** 2.1
**Last Updated:** December 11, 2025
**Status:** 🟢 READY FOR IMPLEMENTATION
