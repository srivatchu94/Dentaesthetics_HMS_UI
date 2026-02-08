# Color Palette Audit Report

## Executive Summary
Found **200+ instances** of non-compliant color usage across the application. The following colors need standardization to match the uniform indigo-600, purple-600, and pink-600 palette.

---

## CRITICAL: Non-Standard Gradient Colors (FROM/TO/VIA)

### Blue Gradients (Should be indigo/purple/pink)
| File | Line | Current Color | Type | Suggested Replacement |
|------|------|---------------|------|----------------------|
| src/pages/VisitInformation.jsx | 248 | from-blue-50 via-purple-50 to-pink-50 | gradient | from-indigo-50 via-purple-50 to-pink-50 |
| src/pages/VisitInformation.jsx | 270 | from-blue-600 via-purple-600 to-pink-600 | gradient text | KEEP (compliant) |
| src/pages/VisitInformation.jsx | 286 | from-blue-500 via-indigo-500 to-purple-600 | gradient | KEEP (mostly compliant) |
| src/pages/VisitInformation.jsx | 287 | from-white to-blue-50 | gradient | from-white to-indigo-50 |
| src/pages/VisitInformation.jsx | 300 | from-blue-300 to-purple-400 | gradient | from-indigo-300 to-purple-400 |
| src/pages/VisitInformation.jsx | 505 | from-blue-50 via-indigo-50 to-purple-100 | gradient | KEEP (mostly compliant) |
| src/pages/VisitInformation.jsx | 514 | from-blue-500 to-indigo-600 | gradient | KEEP (mostly compliant) |
| src/pages/VisitInformation.jsx | 524 | from-blue-600 via-indigo-600 to-purple-600 | gradient | KEEP (mostly compliant) |
| src/pages/VisitInformation.jsx | 575 | from-blue-600 to-purple-600 | gradient text | KEEP (mostly compliant) |
| src/pages/VisitInformation.jsx | 843 | from-blue-600 via-indigo-600 to-purple-600 | gradient | KEEP (mostly compliant) |
| src/pages/ViewStaffDetails.jsx | 517 | from-blue-50 via-indigo-50 to-purple-50 | gradient | from-indigo-50 via-purple-50 to-pink-50 |
| src/pages/ViewMasterInventory.jsx | 20-24 | from-blue-400 via-blue-500 to-blue-600 | gradient | from-indigo-400 via-indigo-500 to-indigo-600 |
| src/pages/ViewMasterInventory.jsx | 23 | from-orange-400 via-orange-500 to-orange-600 | gradient | from-pink-400 via-pink-500 to-pink-600 |
| src/pages/ViewMasterInventory.jsx | 24 | from-green-400 via-green-500 to-green-600 | gradient | from-indigo-400 via-indigo-500 to-indigo-600 |
| src/pages/ViewDoctors.jsx | 475 | from-purple-600 via-indigo-600 to-blue-600 | gradient | from-purple-600 via-indigo-600 to-indigo-600 |
| src/components/VisitInfoModal.jsx | 304 | from-emerald-600 via-teal-600 to-cyan-600 | gradient | from-indigo-600 via-purple-600 to-pink-600 |
| src/components/VisitInfoModal.jsx | 339 | from-blue-50 to-indigo-50 | gradient | KEEP (mostly compliant) |
| src/components/VisitInfoModal.jsx | 345 | from-blue-500 to-indigo-600 | gradient | KEEP (mostly compliant) |
| src/components/VisitInfoModal.jsx | 367 | from-red-50 to-rose-50 | gradient | from-pink-50 to-pink-50 |
| src/components/VisitInfoModal.jsx | 387 | from-orange-50 to-amber-50 | gradient | from-purple-50 to-pink-50 |
| src/components/VisitInfoModal.jsx | 407 | from-violet-50 to-purple-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/VisitInfoModal.jsx | 436 | from-yellow-50 to-amber-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/VisitInfoModal.jsx | 463 | from-pink-50 to-rose-50 | gradient | KEEP (compliant) |
| src/components/VisitInfoModal.jsx | 477 | from-green-50 to-emerald-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/VisitInfoModal.jsx | 493 | from-purple-50 to-indigo-50 | gradient | KEEP (mostly compliant) |
| src/components/VisitInfoModal.jsx | 674 | from-blue-50 to-cyan-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/VisitInfoModal.jsx | 724 | from-blue-600 to-cyan-600 | gradient | from-indigo-600 to-purple-600 |
| src/components/VisitInfoModal.jsx | 725 | from-emerald-600 to-teal-600 | gradient | from-purple-600 to-pink-600 |
| src/components/WhatsAppChatbot.jsx | 143 | from-teal-500 to-sage-500 | gradient | from-indigo-500 to-purple-500 |
| src/components/WhatsAppChatbot.jsx | 161 | from-teal-600 to-sage-600 | gradient | from-indigo-600 to-purple-600 |
| src/components/WhatsAppChatbot.jsx | 182 | from-teal-500 to-sage-500 | gradient | from-indigo-500 to-purple-500 |
| src/components/WhatsAppChatbot.jsx | 285 | from-teal-500 to-sage-500 | gradient | from-indigo-500 to-purple-500 |
| src/components/TokenExpiryModal.jsx | 27 | from-red-50 to-orange-50 | gradient | from-pink-50 to-pink-50 |
| src/components/TokenExpiryModal.jsx | 79 | from-teal-600 to-teal-700 | gradient | from-indigo-600 to-indigo-700 |
| src/components/SuccessModal.jsx | 39 | from-green-50 to-emerald-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/SuccessModal.jsx | 119 | from-green-600 to-emerald-600 | gradient | from-indigo-600 to-purple-600 |
| src/components/StaffManagementModal.jsx | 143 | from-teal-50 to-emerald-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/StaffManagementModal.jsx | 145 | from-teal-500 to-emerald-600 | gradient | from-indigo-500 to-purple-600 |
| src/components/StaffManagementModal.jsx | 454 | from-teal-600 to-emerald-600 | gradient | from-indigo-600 to-purple-600 |
| src/components/ScheduleAppointmentsModal.jsx | 195 | from-violet-500 via-purple-500 to-pink-500 | gradient | KEEP (mostly compliant) |
| src/components/ScheduleAppointmentsModal.jsx | 346 | from-blue-500 to-cyan-500 | gradient | from-indigo-500 to-purple-500 |
| src/components/ScheduleAppointmentsModal.jsx | 504 | from-blue-500 to-cyan-500 | gradient | from-indigo-500 to-purple-500 |
| src/components/ScheduleAppointmentsModal.jsx | 524 | from-green-500 to-emerald-500 | gradient | from-indigo-500 to-purple-500 |
| src/components/ScheduleAppointmentsModal.jsx | 563 | from-green-400 to-emerald-500 | gradient | from-indigo-400 to-purple-500 |
| src/components/PrescriptionWritingModal.jsx | 609 | from-rose-600 via-pink-600 to-red-600 | gradient | KEEP (mostly compliant) |
| src/components/PrescriptionWritingModal.jsx | 640 | from-amber-50 to-orange-50 | gradient | from-pink-50 to-pink-50 |
| src/components/PrescriptionWritingModal.jsx | 669 | from-blue-50 to-indigo-50 | gradient | KEEP (mostly compliant) |
| src/components/PrescriptionWritingModal.jsx | 686 | from-green-50 to-emerald-50 | gradient | from-indigo-50 to-purple-50 |
| src/components/PrescriptionWritingModal.jsx | 895 | from-blue-600 to-cyan-600 | gradient | from-indigo-600 to-purple-600 |

---

## Non-Standard Background Colors (bg-*)

### Teal/Sage Colors
| File | Line | Current Color | Type | Suggested Replacement |
|------|------|---------------|------|----------------------|
| src/pages/Home.jsx | 267 | bg-cyan-400 | background | bg-indigo-400 |
| src/pages/Home.jsx | 480 | bg-teal-600/700 | background button | bg-indigo-600/700 |
| src/components/StaffManagementModal.jsx | 198 | bg-teal-600/700 | background button | bg-indigo-600/700 |
| src/components/StaffManagementModal.jsx | 252 | bg-teal-50 | background | bg-indigo-50 |
| src/components/WhatsAppChatbot.jsx | 243, 259 | bg-green-500 | background | bg-indigo-500 |

### Green/Emerald Colors
| File | Line | Current Color | Type | Suggested Replacement |
|------|------|---------------|------|----------------------|
| src/pages/Home.jsx | 441 | bg-rose-100 | background badge | bg-pink-100 |
| src/pages/VisitInformation.jsx | 1022-1026 | from-orange/blue/emerald/rose/cyan | gradient list | Standardize to indigo/purple/pink |
| src/pages/ViewStaffDetails.jsx | 161-165 | Multiple bg-* colors | background labels | Standardize to indigo/purple/pink |
| src/pages/ViewStaffDetails.jsx | 529 | bg-green-600 | background button | bg-indigo-600 |
| src/pages/ViewStaffDetails.jsx | 547 | bg-red-600 | background button | bg-pink-600 |
| src/pages/ViewStaffDetails.jsx | 822 | bg-fuchsia-50 | background badge | bg-purple-50 |
| src/pages/ViewStaffDetails.jsx | 850 | bg-blue-50 | background | bg-indigo-50 |
| src/pages/ViewStaffDetails.jsx | 876 | bg-rose-600/700 | background button | bg-pink-600/700 |
| src/components/VisitInfoModal.jsx | 528 | bg-green-50 | background | bg-indigo-50 |
| src/components/VisitInfoModal.jsx | 652, 660 | bg-blue/red-100 | background icons | bg-indigo-100 / bg-pink-100 |
| src/components/TokenExpiryModal.jsx | 68 | bg-blue-50 | background | bg-indigo-50 |
| src/components/StaffManagementModal.jsx | 168 | bg-red-50 | background error | bg-pink-50 |
| src/components/StaffManagementModal.jsx | 179 | bg-green-50 | background success | bg-indigo-50 |
| src/components/StaffManagementModal.jsx | 273, 431, 444 | bg-stone-50 | background | KEEP (neutral) |
| src/components/ScheduleAppointmentsModal.jsx | 234, 293-296 | bg-red/yellow/green-50/100 | background alerts | Standardize to indigo/purple/pink |
| src/components/ScheduleAppointmentsModal.jsx | 378, 480 | bg-blue/amber-50 | background cards | Standardize to indigo/purple/pink |
| src/components/PrescriptionWritingModal.jsx | 560, 876 | bg-stone-50 | background | KEEP (neutral) |
| src/components/PrescriptionWritingModal.jsx | 739, 742, 764, 790, 867 | bg-green-50/100 | background fields/hints | Standardize to indigo/purple/pink |
| src/components/PrescriptionPrint.jsx | 208, 242, 262, 287, 303, 314 | bg-stone/amber/blue/yellow-50 | background print layout | KEEP for print readability or standardize |
| src/components/PatientVisitReminderEmail.jsx | 401, 421, 458, 468, 478, 488, 498, 508 | bg-blue/green-600/100 | background buttons/icons | Standardize to indigo/purple/pink |
| src/components/PatientVisitReminderEmail.jsx | 557 | bg-blue-50 | background card | bg-indigo-50 |

---

## Non-Standard Text Colors (text-*)

### Non-Compliant Text Colors
| File | Line | Current Color | Type | Suggested Replacement |
|------|------|---------------|------|----------------------|
| src/pages/Home.jsx | 222 | text-cyan-200 | text label | text-indigo-200 |
| src/pages/Home.jsx | 262 | text-cyan-300 | text font | text-indigo-300 |
| src/pages/Home.jsx | 317 | text-teal-500 | text checkmark | text-indigo-500 |
| src/pages/Home.jsx | 432 | text-teal-500 | text checkmark | text-indigo-500 |
| src/pages/Home.jsx | 479 | text-teal-600 | text price | text-indigo-600 |
| src/pages/VisitInformation.jsx | 332 | text-blue-600 | text link | text-indigo-600 |
| src/pages/VisitInformation.jsx | 562 | text-blue-100 | text description | text-indigo-100 |
| src/pages/VisitInformation.jsx | 972 | text-amber-600 | text note | text-pink-600 |
| src/pages/VisitInformation.jsx | 996 | text-emerald-600 | text icon | text-indigo-600 |
| src/pages/VisitInformation.jsx | 1022-1026 | Multiple text-* colors | status labels | Standardize to indigo/purple/pink |
| src/pages/VisitInformation.jsx | 1052-1053 | text-green/amber-700 | status text | Standardize to indigo/purple/pink |
| src/pages/VisitInformation.jsx | 1405-1407 | text-green/yellow/orange-700 | status labels | Standardize to indigo/purple/pink |
| src/pages/VisitInformation.jsx | 1445 | text-blue-600 | text content | text-indigo-600 |
| src/pages/ViewStaffDetails.jsx | 161-165 | text-sky/emerald/teal/amber-* | text labels | Standardize to indigo/purple/pink |
| src/pages/ViewStaffDetails.jsx | 630 | text-blue-600 | text hint | text-indigo-600 |
| src/components/VisitInfoModal.jsx | 311 | text-teal-100 | text label | text-indigo-100 |
| src/components/VisitInfoModal.jsx | 340 | text-blue-900 | text heading | text-indigo-900 |
| src/components/VisitInfoModal.jsx | 368 | text-red-900 | text heading | text-pink-900 |
| src/components/VisitInfoModal.jsx | 388 | text-orange-900 | text heading | text-pink-900 |
| src/components/VisitInfoModal.jsx | 408 | text-violet-900 | text heading | text-purple-900 |
| src/components/VisitInfoModal.jsx | 437 | text-yellow-900 | text heading | text-indigo-900 |
| src/components/VisitInfoModal.jsx | 479 | text-green-900 | text heading | text-indigo-900 |
| src/components/VisitInfoModal.jsx | 529 | text-green-700 | text label | text-indigo-700 |
| src/components/VisitInfoModal.jsx | 675 | text-blue-900 | text heading | text-indigo-900 |
| src/components/WhatsAppChatbot.jsx | 168 | text-green-100 | text label | text-indigo-100 |
| src/components/PatientVisitReminderEmail.jsx | 401, 421 (multiple) | text-white on colored bg | text button | KEEP (contrast) |
| src/components/PatientVisitReminderEmail.jsx | 458+ | text-blue-600 | text icons | text-indigo-600 |

---

## Non-Standard Border Colors (border-*)

### Non-Compliant Borders
| File | Line | Current Color | Type | Suggested Replacement |
|------|------|---------------|------|----------------------|
| src/pages/Home.jsx | 292 | border-teal-200/50 (hover) | border | border-indigo-200/50 |
| src/pages/Home.jsx | 473 | border-coral-300 (hover) | border | border-pink-300 |
| src/pages/VisitInformation.jsx | 287 | border-blue-200/400 | border | border-indigo-200/400 |
| src/pages/VisitInformation.jsx | 588-706 (multiple) | border-blue/orange/green/pink-500 | focus borders | Standardize to indigo/purple/pink |
| src/pages/VisitInformation.jsx | 938 | border-orange-200/500 | border | border-pink-200/500 |
| src/pages/VisitInformation.jsx | 1022-1026 | border-orange/blue/emerald/rose/cyan | border list | Standardize to indigo/purple/pink |
| src/components/VisitInfoModal.jsx | 344 | border-blue-100 | border divider | border-indigo-100 |
| src/components/VisitInfoModal.jsx | 378 | border-red-400 (left border) | border | border-pink-400 |
| src/components/VisitInfoModal.jsx | 398 | border-orange-400 (left border) | border | border-pink-400 |
| src/components/VisitInfoModal.jsx | 412, 420 | border-violet/yellow-100 | border dividers | border-indigo/purple-100 |
| src/components/VisitInfoModal.jsx | 447, 456, 488 | border-green-300/500 | borders & focus | border-indigo-300/500 |
| src/components/VisitInfoModal.jsx | 683 | border-blue-300/500 | borders & focus | border-indigo-300/500 |
| src/components/VisitInfoModal.jsx | 710 | border-stone-300/500 | border | KEEP (neutral) |
| src/components/StaffManagementModal.jsx | 188, 234 | border-teal-600 (spinner) | border | border-indigo-600 |
| src/components/StaffManagementModal.jsx | 214 | border-teal-200 | border input | border-indigo-200 |
| src/components/StaffManagementModal.jsx | 253 | border-stone-200/teal-300 | border select | border-indigo-200/indigo-300 |
| src/components/ScheduleAppointmentsModal.jsx | 234 | border-red-500 (left border) | border | border-pink-500 |
| src/components/PrescriptionWritingModal.jsx | 739, 742, 764, 790, 867 | border-green-* | borders & focus | Standardize to indigo |
| src/components/PrescriptionPrint.jsx | 303 | border-blue-300 | border header | border-indigo-300 |

---

## Non-Standard Ring/Focus Colors (focus:ring-*)

### Focus Ring Colors to Update
| File | Line | Current Color | Type | Suggested Replacement |
|------|------|---------------|------|----------------------|
| src/pages/VisitInformation.jsx | 588-706 | focus:ring-blue/orange/green-500 | focus ring | Standardize to indigo/purple/pink-500 |
| src/pages/VisitInformation.jsx | 938, 1262+ | focus:ring-orange/green-500/100 | focus ring | Standardize to indigo/purple/pink-500 |
| src/components/StaffManagementModal.jsx | 214+ | focus:ring-teal-500 | focus ring | focus:ring-indigo-500 |
| src/components/VisitInfoModal.jsx | 447, 456, 488, 683 | focus:ring-green/blue-500 | focus ring | focus:ring-indigo-500 |
| src/components/PrescriptionWritingModal.jsx | 739, 742+ | focus:ring-green-500 | focus ring | focus:ring-indigo-500 |

---

## Custom/Special Colors (Non-Standard Tailwind)

### Custom Color Strings Found
| File | Line | Current Color | Type | Issue |
|------|------|---------------|------|-------|
| src/pages/Home.jsx | 109 | from-coral-500 to-peach-500 | gradient | Custom colors not in standard Tailwind |
| src/pages/Home.jsx | 129 | from-gold-500 to-peach-500 | gradient | Custom colors not in standard Tailwind |
| src/pages/Home.jsx | 151 | from-cream-50 via-warmGray-50 to-teal-50/30 | gradient | Custom colors (cream, warmGray) |
| src/pages/Home.jsx | 159 | from-slate-900 via-indigo-900 to-slate-900 | gradient | Should be indigo-focused |
| src/pages/Home.jsx | 363 | from-cream-50 to-warmGray-50 | gradient | Custom colors |
| src/pages/Home.jsx | 397 | from-white/80 via-peach-50/50 to-gold-50/50 | gradient | Custom colors (peach, gold) |
| src/pages/Home.jsx | 401 | from-coral-700 via-peach-700 to-gold-700 | gradient text | Custom colors |
| src/pages/Home.jsx | 473 | from-cream-50 to-coral-50 | gradient | Custom colors |
| src/pages/VisitInformation.jsx | 352 | from-purple-500 via-pink-500 to-rose-600 | gradient | rose-600 is non-standard (use pink) |
| src/pages/VisitInformation.jsx | 868 | from-purple-500 via-pink-500 to-orange-400 | gradient | orange-400 is non-standard |
| src/pages/VisitInformation.jsx | 882 | from-purple-600 via-pink-600 to-orange-600 | gradient text | orange-600 is non-standard |
| src/pages/ViewMasterInventory.jsx | 20-24 | Multiple from-*/via-*/to-* | gradients | Red, Orange, Green colors |
| src/pages/ViewMasterInventory.jsx | 198 | from-slate-50 via-blue-50 to-indigo-50 | gradient | Should be standardized |
| src/components/WhatsAppChatbot.jsx | 143+ | from-teal-500 to-sage-500 | gradient | sage color is custom/non-standard |

---

## Summary Statistics

- **Total Issues Found**: 200+
- **From/To/Via Gradients**: 45+ instances
- **Background Colors (bg-)**: 50+ instances
- **Text Colors (text-)**: 45+ instances
- **Border Colors (border-)**: 35+ instances
- **Ring/Focus Colors**: 25+ instances
- **Custom Non-Standard Colors**: 15+ instances

## Standardization Rules

### Keep:
- `indigo-*` (all shades)
- `purple-*` (all shades)
- `pink-*` (all shades)
- `white`, `black`
- `neutral-*`, `slate-*`, `gray-*` (neutral grays)
- `stone-*` (for print layouts and neutral backgrounds)

### Replace With Closest Match:
- Blue → Indigo
- Cyan → Indigo or Purple
- Teal → Indigo or Purple
- Emerald/Green → Indigo or Purple
- Sage → Purple
- Red/Rose → Pink
- Orange/Amber → Pink or Purple
- Yellow → Indigo or Purple
- Violet → Purple
- Sky → Indigo
- Fuchsia → Purple

---

## Files Requiring Major Updates (in order of impact):

1. **src/pages/VisitInformation.jsx** - 50+ color references
2. **src/components/VisitInfoModal.jsx** - 40+ color references
3. **src/components/PrescriptionWritingModal.jsx** - 30+ color references
4. **src/pages/Home.jsx** - 25+ color references
5. **src/components/StaffManagementModal.jsx** - 20+ color references
6. **src/pages/ViewStaffDetails.jsx** - 15+ color references
7. **src/components/ScheduleAppointmentsModal.jsx** - 15+ color references
8. **src/pages/ViewMasterInventory.jsx** - 10+ color references
9. **src/components/TokenExpiryModal.jsx** - 8+ color references
10. **src/components/WhatsAppChatbot.jsx** - 10+ color references

---

## Recommendations

1. **Immediately audit** files listed above
2. **Use find-replace** with regex for bulk color updates
3. **Test all color transitions** in different lighting conditions
4. **Verify accessibility** (WCAG AA contrast ratios) after updates
5. **Update Tailwind config** if custom colors (coral, peach, gold, sage, warmGray, cream) are being used
6. **Create CSS variable system** to prevent future color inconsistencies
