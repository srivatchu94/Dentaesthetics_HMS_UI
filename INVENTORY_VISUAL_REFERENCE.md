# Inventory Bulk Operations - Visual Reference Guide

## UI Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│            SELECT ENTERPRISE & CLINIC                        │
│  (Loads master inventory and statistics)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  MAIN OPTIONS   │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
  SEARCH      ADD ITEM    VIEW ITEMS
    │            │            │
    │            └─┐          └─► Display Cards
    │              │              (Edit/Delete options)
    │         ┌────▼────────────┐
    │         │  ADD MODAL       │
    │         │  (Multi-row)     │
    │         └────┬────────────┘
    │              │
    │         ┌────▼──────────────────────┐
    │         │ TABLE WITH ROWS            │
    │         │ • Item Dropdown            │
    │         │ • Quantity                 │
    │         │ • Reorder Level            │
    │         │ • Min Stock                │
    │         │ • Location                 │
    │         │ • Status                   │
    │         └────┬──────────────────────┘
    │              │
    │         ┌────┴───────────────────────────┐
    │         │                                │
    │         ▼                                ▼
    │    ADD ROW (➕)          ADD TO MASTER (📦)
    │         │                                │
    │         │                         ┌──────▼─────────┐
    │         │                         │ MASTER MODAL   │
    │         │                         │ (Multi-row)    │
    │         │                         │ • Item Name    │
    │         │                         │ • Code/SKU     │
    │         │                         │ • Category     │
    │         │                         │ • Unit         │
    │         │                         │ • Active       │
    │         │                         └──────┬─────────┘
    │         │                                │
    │         │                           ADD TO MASTER (💾)
    │         │                                │
    │         │                         ┌──────▼────────────┐
    │         │                         │ SUCCESS MESSAGE ✨ │
    │         │                         │ Master Items      │
    │         │                         │ Reload            │
    │         │                         └──────────────────┘
    │         │
    │    SAVE ALL (💾)
    │         │
    │    ┌────▼──────────────────────────┐
    │    │  BATCH API CALL                │
    │    │ saveClinicInventoryBatch()     │
    │    │ (enterpriseId, clinicId, items)│
    │    └────┬──────────────────────────┘
    │         │
    │    ┌────▼──────────────────┐
    │    │  SUCCESS MESSAGE 🎉   │
    │    │ (Random funny message) │
    │    │ Auto-dismiss (3 sec)   │
    │    └────┬──────────────────┘
    │         │
    │    RELOAD INVENTORY ↻
    │         │
    └─────────┘

EDIT FLOW:
┌──────────────────────┐
│ Click ✏️ EDIT Button  │
└──────────┬───────────┘
           │
    ┌──────▼─────────────┐
    │  EDIT MODAL        │
    │ • Qty (editable)   │
    │ • Reorder (edit)   │
    │ • Min Stock (edit) │
    │ • Location (edit)  │
    │ • Status (edit)    │
    │ • Item (read-only) │
    └──────┬─────────────┘
           │
        UPDATE (💾)
           │
    ┌──────▼──────────────────────────┐
    │  BATCH API CALL                  │
    │ saveClinicInventoryBatch()       │
    │ (For consistency with bulk ops)  │
    └──────┬──────────────────────────┘
           │
        ┌──▼──────────────────┐
        │ SUCCESS MESSAGE ✨  │
        │ Reload Inventory    │
        └─────────────────────┘

DELETE FLOW:
┌──────────────────────┐
│ Click 🗑️ DELETE Btn  │
└──────────┬───────────┘
           │
    ┌──────▼──────────────────┐
    │  CONFIRM MODAL          │
    │ "Delete {ItemName}?"     │
    │ [Cancel] [Delete]        │
    └──────┬──────────────────┘
           │
        DELETE CONFIRMED
           │
    ┌──────▼────────────────────────────┐
    │  DELETE API CALL                   │
    │ deleteClinicInventoryWithParams()  │
    │ (enterpriseId, clinicId, invId)    │
    └──────┬────────────────────────────┘
           │
        ┌──▼──────────────────┐
        │ SUCCESS MESSAGE 🎉  │
        │ Reload Inventory    │
        └─────────────────────┘
```

---

## Modal Structure Map

```
┌─────────────────────────────────────────────────────────────┐
│                    ADD INVENTORY MODAL                       │
│                   (showAddModal === true)                    │
├─────────────────────────────────────────────────────────────┤
│ HEADER: Green Gradient                                      │
│ ➕ Add Inventory Items (Bulk Entry)                         │
│ "Add multiple inventory items at once"                      │
├─────────────────────────────────────────────────────────────┤
│ CONTENT:                                                     │
│                                                              │
│ TABLE (Scrollable):                                         │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Item │ Unit │ Qty │ Reorder │ Min │ Location │ Status │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │[Dropdown] │[Auto]│[Input]│[Input] │[Input]│[Input]│[Sel]│  │
│ ├──────────────────────────────────────────────────────┤  │
│ │[Dropdown] │[Auto]│[Input]│[Input] │[Input]│[Input]│[Sel]│  │
│ ├──────────────────────────────────────────────────────┤  │
│ │[Dropdown] │[Auto]│[Input]│[Input] │[Input]│[Input]│[Sel]│  │
│ └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ACTION BUTTONS:                                             │
│ ┌─────────────────────┬─────────────────────────────────┐  │
│ │ ➕ Add Row (Blue)   │ 📦 Add to Master (Purple)       │  │
│ └─────────────────────┴─────────────────────────────────┘  │
│                                                              │
│ FORM BUTTONS:                                              │
│ ┌──────────────────────────┬──────────────────────────────┐  │
│ │ Cancel (Gray)            │ 💾 Save All Items (Green)    │  │
│ └──────────────────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              MASTER INVENTORY MODAL                          │
│            (showAddMasterModal === true)                     │
├─────────────────────────────────────────────────────────────┤
│ HEADER: Purple Gradient                                     │
│ 📦 Add Items to Master Inventory                            │
│ "Create new inventory items for your clinic"               │
├─────────────────────────────────────────────────────────────┤
│ CONTENT:                                                     │
│                                                              │
│ TABLE (Scrollable):                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Item Name │ Code │ Category │ SubCat │ Unit │ Active │   │
│ ├─────────────────────────────────────────────────────────┤ │
│ │[Input]    │[Input]│[Dropdown]│[Dropdown]│[Select]│[Check]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │[Input]    │[Input]│[Dropdown]│[Dropdown]│[Select]│[Check]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ACTION BUTTONS:                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ➕ Add Row (Blue)                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ FORM BUTTONS:                                              │
│ ┌──────────────────────────┬──────────────────────────────┐ │
│ │ Cancel (Gray)            │ 💾 Add to Master (Purple)    │ │
│ └──────────────────────────┴──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                  EDIT MODAL                                  │
│            (showEditModal && selectedItem)                   │
├─────────────────────────────────────────────────────────────┤
│ HEADER: Orange Gradient                                     │
│ ✏️ Edit Clinic Inventory                                    │
├─────────────────────────────────────────────────────────────┤
│ CONTENT:                                                     │
│                                                              │
│ Item: [Read-Only: "Surgical Mask"] (Cannot change)         │
│                                                              │
│ Grid Form (2 columns):                                      │
│ ┌─────────────────────────┬─────────────────────────────┐  │
│ │ Quantity Available *    │ Reorder Level *             │  │
│ │ [Input: 450]            │ [Input: 100]                │  │
│ ├─────────────────────────┼─────────────────────────────┤  │
│ │ Minimum Stock *         │ Status *                    │  │
│ │ [Input: 50]             │ [Dropdown: Available]       │  │
│ ├─────────────────────────┼─────────────────────────────┤  │
│ │ Storage Location * (2-wide)                           │  │
│ │ [Input: Shelf A-2]                                    │  │
│ └─────────────────────────┴─────────────────────────────┘  │
│                                                              │
│ FORM BUTTONS:                                              │
│ ┌──────────────────────────┬──────────────────────────────┐  │
│ │ Cancel (Gray)            │ 💾 Update (Green)            │  │
│ └──────────────────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│               DELETE CONFIRM MODAL                           │
│          (showDeleteModal && selectedItem)                   │
├─────────────────────────────────────────────────────────────┤
│ HEADER: Red Gradient                                        │
│ ⚠️ Confirm Delete                                           │
├─────────────────────────────────────────────────────────────┤
│ CONTENT:                                                     │
│                                                              │
│ Are you sure you want to delete                            │
│ "Surgical Mask"                                             │
│ from this clinic's inventory?                               │
│                                                              │
│ BUTTONS:                                                    │
│ ┌──────────────────────────┬──────────────────────────────┐  │
│ │ Cancel (Gray)            │ 🗑️ Delete (Red)             │  │
│ └──────────────────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              SUCCESS MESSAGE MODAL                           │
│           (showSuccessModal === true)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        ✨                                    │
│                                                              │
│  "🎉 Boom! Your inventory is now legendary! 🚀"             │
│                                                              │
│  (One of 9 random funny messages)                           │
│  (Auto-dismisses after 3 seconds)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
USER INPUT LAYER:
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Enterprise Select│  │  Clinic Select   │  │  Add Item Click  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         └─────────────────────┴──────────────────────┘
                          │
                    MODAL OPENS
                          │
                 ┌────────▼────────┐
                 │  Form State     │
                 │  inventoryRows[]│
                 │  masterRows[]   │
                 └────────┬────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
         Add Rows   Remove Rows  Update Fields
              │           │           │
              │           │      └─ Auto-populate unit
              │           │      └─ Set item name
              │           │
              └───────────┼───────────┘
                          │
                  VALIDATION LAYER
                          │
         ┌────────────────┼────────────────┐
         │ Check required │ Warn if empty  │
         │ fields filled  │ Prevent submit │
         └────────┬───────┴────────────────┘
                  │
             SUBMIT BUTTON
                  │
          ┌───────▼────────┐
          │ Format Data    │
          │ Map to DTO     │
          │ Set Enterprise │
          │ Set Clinic     │
          └───────┬────────┘
                  │
            API LAYER
                  │
        ┌─────────▼──────────┐
        │ POST Request       │
        │ saveClinicInventory│
        │ Batch()            │
        └─────────┬──────────┘
                  │
          ┌───────▼────────────┐
          │ Response Handler   │
          │ Success? 200 OK    │
          │ Error? Show message│
          └───────┬────────────┘
                  │
          ┌───────▼─────────────┐
          │ UPDATE UI STATE     │
          │ Show success modal  │
          │ Random funny message│
          │ Auto-dismiss (3s)   │
          └───────┬─────────────┘
                  │
          ┌───────▼──────────────┐
          │ REFRESH DATA         │
          │ loadClinicInventory()│
          │ Reload grid display  │
          └──────────────────────┘
```

---

## Component State Tree

```
ClinicInventory Component
│
├─ Selection State
│  ├─ selectedEnterprise: number | null
│  ├─ selectedClinic: number | null
│  ├─ selectedItem: ClinicInventory | null
│  └─ searchTerm: string
│
├─ Data State
│  ├─ inventoryItems: ClinicInventory[]
│  ├─ masterItems: InventoryMaster[]
│  ├─ enterprises: EnterpriseModel[]
│  ├─ clinics: ClinicModel[]
│  └─ stats: InventoryStats
│
├─ Modal Visibility State
│  ├─ showAddModal: boolean
│  ├─ showEditModal: boolean
│  ├─ showDeleteModal: boolean
│  ├─ showAddMasterModal: boolean
│  ├─ showSuccessModal: boolean
│  └─ showInventoryDetailModal: boolean
│
├─ Form State - Inventory Rows
│  ├─ inventoryRows: InventoryAddRow[]
│  │  ├─ itemId: number
│  │  ├─ itemName: string
│  │  ├─ quantityAvailable: number
│  │  ├─ reorderLevel: number
│  │  ├─ minimumStock: number
│  │  ├─ storageLocation: string
│  │  ├─ unit: string
│  │  ├─ description: string
│  │  └─ status: string
│
├─ Form State - Master Rows
│  ├─ masterRows: MasterInventoryAddRow[]
│  │  ├─ itemName: string
│  │  ├─ itemCode: string
│  │  ├─ category: string
│  │  ├─ subCategory: string
│  │  ├─ unit: string
│  │  └─ isActive: boolean
│
├─ Edit State
│  ├─ editingInventory: Partial<ClinicInventory>
│  │  ├─ quantityAvailable?: number
│  │  ├─ reorderLevel?: number
│  │  ├─ minimumStock?: number
│  │  ├─ storageLocation?: string
│  │  └─ status?: string
│
├─ UI State
│  ├─ loading: boolean
│  ├─ successMessage: string
│  └─ inventoryStatuses: string[]
│
└─ Constants
   ├─ unitOptions: string[]
   ├─ categoryOptions: string[]
   ├─ subCategoryOptions: string[]
   └─ funnyMessages: string[]
```

---

## API Contract Reference

### GET: Load Master Inventory Items
```
GET /inventory/GetAllInventoryMasterItems

Response:
[
  {
    itemId: 1,
    itemName: "Surgical Mask",
    itemCode: "SKU-001",
    category: "Consumables",
    subCategory: "PPE",
    unit: "Box",
    isActive: true
  }
]
```

### POST: Bulk Add to Master Inventory
```
POST /inventory/AddInventoryMasterItemsBulk

Payload:
[
  {
    itemName: "N95 Mask",
    itemCode: "SKU-045",
    category: "Consumables",
    subCategory: "PPE",
    unit: "Box",
    isActive: true
  }
]

Response: [InventoryMaster[]]
```

### POST: Batch Save Clinic Inventory
```
POST /inventory/SaveClinicInventoryBatch?enterpriseId=1&clinicId=5

Payload:
[
  {
    inventoryId: 0, // For new items
    itemId: 1,
    enterpriseId: 1,
    clinicId: 5,
    quantityAvailable: 500,
    reorderLevel: 100,
    minimumStock: 50,
    storageLocation: "Shelf A-1",
    status: "Available",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
]

Response: [ClinicInventory[]]
```

### DELETE: Delete Clinic Inventory Item
```
DELETE /inventory/DeleteClinicInventory?EnterpriseID=1&ClinicID=5&InventoryID=10

Parameters Required:
- EnterpriseID: number
- ClinicID: number
- InventoryID: number

Response: Success (204) or Error
```

---

## Funny Message Rotation

```
funnyMessages = [
  "🎉 Boom! Your inventory is now legendary! 🚀",           // [0]
  "💎 Holy moly! You just became an inventory wizard! 🧙‍♂️",  // [1]
  "🌟 Your inventory is so organized, Marie Kondo just called! 👀", // [2]
  "🎊 Bazinga! Your items are perfectly stocked! 🎯",       // [3]
  "🏆 You deserve a medal! Your inventory is immaculate! 👑", // [4]
  "🚀 Houston, we have perfect inventory! 🌌",              // [5]
  "💫 Your inventory is chef's kiss! 👨‍🍳",                 // [6]
  "🎯 Nailed it! Your inventory is on point! 💯",           // [7]
  "✨ Abracadabra! Magic inventory levels detected! 🎩"     // [8]
]

Selection: Math.floor(Math.random() * 9)
Display Duration: 3000ms (3 seconds)
Auto-dismiss: Yes
```

---

## Color Scheme Reference

```
ADD MODAL:       Green   (from-green-600 to-emerald-600)
EDIT MODAL:      Orange  (from-amber-500 to-orange-500)
DELETE MODAL:    Red     (from-red-600 to-rose-600)
MASTER MODAL:    Purple  (from-purple-600 to-pink-600)

ACTION BUTTONS:
  Add Row:       Blue    (from-blue-500 to-cyan-500)
  Add Master:    Purple  (from-purple-500 to-pink-500)
  Save:          Green   (from-green-600 to-emerald-600)
  Cancel:        Gray    (bg-gray-500)

ICONS:
  Add:           ➕
  Remove:        ✕
  Edit:          ✏️
  Delete:        🗑️
  Master:        📦
  Save:          💾
  Success:       ✨
  Confirm:       ⚠️
```

---

This visual reference guide covers all UI elements, data flows, modals, and API contracts for the inventory bulk operations system.

