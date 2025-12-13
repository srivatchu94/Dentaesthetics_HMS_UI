# Quick Reference Guide - Inventory Management System

## 🗺️ Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER NAVBAR                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Home  Clinics  Patients  Services  📦 INVENTORY  Team Hub  │
│                                      ▼                       │
│                                  ┌─────────────────────┐     │
│                                  │ Inventory Options:  │     │
│                                  │                     │     │
│                                  │ • Inventory Master  │     │
│                                  │   (Master List)     │     │
│                                  │                     │     │
│                                  │ • Clinic Inventory  │     │
│                                  │   (Per-Clinic)      │     │
│                                  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏪 Inventory Master Page

### URL: `/inventory`

### Purpose:
Manage enterprise-wide inventory items that can be distributed across clinics.

### Layout:
```
┌──────────────────────────────────────────────────────────┐
│  📦 Inventory Master                                     │
│  Manage master inventory items for your enterprise       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Search Box [Search...] [🔍 Search] [➕ Add Item]       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Item Card  │  │  Item Card  │  │  Item Card  │     │
│  │             │  │             │  │             │     │
│  │ Name: Item  │  │ Name: Item  │  │ Name: Item  │     │
│  │ SKU: XX-001 │  │ SKU: XX-002 │  │ SKU: XX-003 │     │
│  │             │  │             │  │             │     │
│  │ Category    │  │ Category    │  │ Category    │     │
│  │ Active ✅   │  │ Active ✅   │  │ Inactive ❌ │     │
│  │             │  │             │  │             │     │
│  │ [✏️ Edit]   │  │ [✏️ Edit]   │  │ [✏️ Edit]   │     │
│  │ [🗑️ Delete] │  │ [🗑️ Delete] │  │ [🗑️ Delete] │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  (Responsive: 1-3 columns based on screen size)         │
└──────────────────────────────────────────────────────────┘
```

### Item Fields:
```
Item Card displays:
├── Item Name (Primary)
├── SKU/Item Code
├── Category (Supplies, Medication, Materials, Equipment, Consumables)
├── Sub-Category
├── Unit (Box, Tablet, Piece, Bottle, Pack, Set, Carton, Unit)
└── Status (Active ✅ / Inactive ❌)
```

### Operations:

#### Create Item:
```
Click [➕ Add Item]
    ↓
Modal opens with form:
├── Item Name *
├── Item Code (SKU) *
├── Category * (Select from list)
├── Sub Category
├── Unit * (Select from list)
├── Active (Toggle checkbox)
└── [Cancel] [✨ Create Item]
```

#### Edit Item:
```
Click [✏️ Edit] on card
    ↓
Modal opens with pre-filled fields:
├── Item ID (Read-only)
├── Item Name *
├── Item Code (SKU) *
├── Category *
├── Sub Category
├── Unit *
├── Active (Toggle checkbox)
└── [Cancel] [💾 Update Item]
```

#### Delete Item:
```
Click [🗑️ Delete] on card
    ↓
Confirmation modal:
"Are you sure you want to delete [Item Name]?"
"This action affects clinic inventories"
└── [Cancel] [🗑️ Delete]
```

#### Search Items:
```
Type in search box
    ↓
Press Enter or click [🔍 Search]
    ↓
Grid updates with filtered results
```

---

## 🏥 Clinic Inventory Page

### URL: `/inventory/clinic`

### Purpose:
Manage inventory levels for specific clinics with enterprise and clinic filtering.

### Layout:
```
┌──────────────────────────────────────────────────────────┐
│  🏥 Clinic Inventory Management                          │
│  Manage inventory for your clinics across the enterprise │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Enterprise: [▼ Select] | Clinic: [▼ Select] *Required │
│                                                          │
│  📊 Statistics Dashboard (When clinic selected):        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Total   │ │Available │ │Low Stock │ │Out Stock │   │
│  │Items: 45 │ │Items: 35 │ │Items: 8  │ │Items: 2  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  Search: [Search...] [🔍 Search] [➕ Add Item]         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────┐               │
│  │ 🟢 Composite Resin                 │               │
│  │ Location: Shelf A-1                │               │
│  │                                    │               │
│  │ Qty: 125 units                    │               │
│  │ ████████████████░░ (78% capacity) │               │
│  │                                    │               │
│  │ Reorder: 50  |  Min Stock: 20    │               │
│  │ [Available] ✅                     │               │
│  │                                    │               │
│  │  [✏️ Edit]  [🗑️ Delete]           │               │
│  └─────────────────────────────────────┘               │
│                                                          │
│  (Card colors change by status)                         │
│  🟢 Available | 🟡 Low Stock | 🔴 Out of Stock         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Clinic Inventory Fields:
```
Item Card displays:
├── Item Name (linked from master)
├── Storage Location
├── Quantity Available (large number display)
├── Progress Bar (visual quantity level)
├── Reorder Level
├── Minimum Stock
├── Status Badge (Available/LowStock/OutOfStock/Damaged/Expired)
└── Action Buttons (Edit/Delete)
```

### Status Color Coding:
```
🟢 Available    → Green gradient (from-green-400 to-emerald-500)
🟡 Low Stock    → Yellow gradient (from-yellow-400 to-amber-500)
🔴 Out of Stock → Red gradient (from-red-400 to-rose-500)
🟠 Damaged      → Orange gradient (from-orange-400 to-red-500)
⚫ Expired      → Gray gradient (from-gray-400 to-slate-500)
```

### Operations:

#### Setup (Required):
```
1. Select Enterprise from dropdown
2. Select Clinic from filtered dropdown
3. View statistics dashboard
```

#### Add Item to Clinic:
```
Click [➕ Add Item]
    ↓
Modal opens:
├── Inventory Item * (Select from master)
├── Quantity Available * (Number)
├── Reorder Level * (Number)
├── Minimum Stock * (Number)
├── Storage Location * (Text - e.g., "Shelf A-1")
├── Status * (Dropdown: Available, LowStock, OutOfStock, Damaged, Expired)
└── [Cancel] [✨ Add to Clinic]
```

#### Edit Clinic Inventory:
```
Click [✏️ Edit] on card
    ↓
Modal opens with fields:
├── Item (Read-only display)
├── Quantity Available *
├── Reorder Level *
├── Minimum Stock *
├── Storage Location *
├── Status *
└── [Cancel] [💾 Update]
```

#### Delete from Clinic:
```
Click [🗑️ Delete] on card
    ↓
Confirmation:
"Delete [Item Name] from [Clinic Name]?"
└── [Cancel] [🗑️ Delete]
```

#### Search Items:
```
Type item name in search box
    ↓
Press Enter or click [🔍 Search]
    ↓
Results filtered for current clinic
```

---

## 🎨 Color Reference

### Inventory Master Theme:
```
Emerald: #059669 (Primary)
Teal: #0d9488 (Secondary)
Blue: #3b82f6 (Action buttons)
Cyan: #06b6d4 (Hover states)
```

### Clinic Inventory Theme:
```
Blue: #3b82f6 (Primary)
Purple: #8b5cf6 (Secondary)
Pink: #ec4899 (Accent)

Status Indicators:
├── Green: #22c55e (Available)
├── Yellow: #eab308 (Low Stock)
├── Red: #ef4444 (Out of Stock)
├── Orange: #f97316 (Damaged)
└── Gray: #6b7280 (Expired)
```

---

## ⌨️ Keyboard Shortcuts

### Global:
- `/` → Open search
- `Escape` → Close modal/search

### Forms:
- `Enter` → Submit form (on last field)
- `Tab` → Move to next field
- `Shift+Tab` → Move to previous field

---

## 🔔 Status & Feedback

### Success Messages:
```
✨ Item added successfully!
✨ Item updated successfully!
💥 Item deleted successfully!
✨ Inventory added to clinic!
✨ Inventory updated!
💥 Inventory deleted!
```

### Error Handling:
- Clear error messages
- Form validation warnings
- Field highlighting on errors
- Dismissible alerts

### Loading States:
- Disabled buttons during API calls
- "Creating...", "Updating...", "Deleting..." text
- Loading spinner in background operations

---

## 📱 Responsive Behavior

### Mobile (320px - 767px):
```
Layout: Single column
Grid: 1 item per row
Cards: Full width with padding
Modals: Full screen with scroll
Buttons: Stacked vertically
```

### Tablet (768px - 1023px):
```
Layout: Two columns
Grid: 2 items per row
Cards: 50% width
Modals: 80% width
Buttons: Side by side
```

### Desktop (1024px+):
```
Layout: Three columns
Grid: 3 items per row
Cards: ~33% width
Modals: 50-70% width max
Buttons: Horizontal layout
```

---

## 🚀 Workflow Examples

### Scenario 1: Add New Item to Master
```
1. Navigate to /inventory
2. Click [➕ Add Item]
3. Fill form:
   - Name: "Dental Gloves (Box)"
   - Code: "DG-001"
   - Category: "Supplies"
   - Sub: "Protection"
   - Unit: "Box"
   - Toggle: Active ✅
4. Click [✨ Create Item]
5. Success! Item appears in grid
```

### Scenario 2: Setup Clinic Inventory
```
1. Navigate to /inventory/clinic
2. Select Enterprise: "Dentaesthetics Mumbai"
3. Select Clinic: "Downtown Clinic"
4. See statistics update
5. Click [➕ Add Item]
6. Select: "Dental Gloves (Box)" from master
7. Set Quantity: 150
8. Reorder: 50, Min: 20
9. Location: "Shelf A-1"
10. Status: "Available"
11. Click [✨ Add to Clinic]
12. Card appears in clinic inventory
```

### Scenario 3: Low Stock Alert
```
1. Open /inventory/clinic
2. Select clinic
3. View statistics: "Low Stock Items: 8"
4. Cards with 🟡 Yellow status show low stock
5. Can edit to reorder or adjust thresholds
6. Helps identify items needing reorder
```

---

## 🔗 API Integration Points

The system is ready to connect with these endpoints:

```
Inventory Master:
GET  /api/InventoryMaster/GetAll
POST /api/InventoryMaster/Create
PUT  /api/InventoryMaster/Update/{id}
DELETE /api/InventoryMaster/Delete/{id}

Clinic Inventory:
GET  /api/ClinicInventory/GetAll
GET  /api/ClinicInventory/GetByClinic
POST /api/ClinicInventory/Create
PUT  /api/ClinicInventory/Update/{id}
DELETE /api/ClinicInventory/Delete/{id}
GET  /api/ClinicInventory/Stats
```

---

## 📞 Support Information

### For Issues:
1. Check browser console for errors
2. Verify enterprise/clinic selection
3. Ensure backend API is running
4. Check network tab for failed requests

### For Features:
- All CRUD operations supported
- Search and filter ready
- Bulk operations prepared
- Real-time statistics available

---

## ✅ Quick Checklist

Before going live:
- ✅ Backend API endpoints configured
- ✅ Database tables created
- ✅ Authentication working
- ✅ Enterprise/clinic data populated
- ✅ CORS configured (if needed)
- ✅ Testing completed
- ✅ Error scenarios verified

---

**Happy Inventory Managing! 🎉**
