# Production Deployment - Master Inventory API URLs

## Base Configuration

**Production Base URL (from .env.production):**
```
https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api
```

---

## Master Inventory Save Endpoints

### 1. Save Clinic Inventory Batch
**Endpoint:** `SaveClinicInventoryBatch`
```
POST https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api/inventory/SaveClinicInventoryBatch?enterpriseId={enterpriseId}&clinicId={clinicId}
```

**Usage Location:** `src/pages/Clinics.jsx` (Lines 1169, 1389)

**Query Parameters:**
- `enterpriseId` - Enterprise ID from selected access
- `clinicId` - Clinic ID from selected access

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Body:** Request payload with inventory batch data

---

### 2. Add Inventory Master Items in Bulk
**Endpoint:** `AddInventoryMasterItemsBulk`
```
POST https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api/inventory/AddInventoryMasterItemsBulk
```

**Usage Location:** `src/pages/Clinics.jsx` (Line 1270)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Body:** JSON array of master inventory items
```json
[
  {
    "itemName": "string",
    "itemCode": "string",
    "category": "string",
    "unit": "string",
    ...
  }
]
```

---

### 3. Reload Master Inventory Items (GET)
**Endpoint:** `GetAllInventoryMasterItems`
```
GET https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api/inventory/GetAllInventoryMasterItems
```

**Usage Location:** `src/pages/Clinics.jsx` (Line 1282)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

---

## Environment Configuration

### Development Environment
```
VITE_API_BASE_URL=https://localhost:7104/api
```

### Production Environment
```
VITE_API_BASE_URL=https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api
```

The environment variable is automatically loaded based on the build type:
- **Development:** `npm run dev` → `.env.development`
- **Production:** `npm run build` → `.env.production`

---

## Troubleshooting

If you encounter errors when adding master inventory data:

1. **Verify Base URL is set correctly:**
   - Check `.env.production` has the correct Azure endpoint
   - Current Production URL: `https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api`

2. **Common Issues:**
   - ❌ Missing authorization header → Add Bearer token
   - ❌ Invalid enterpriseId/clinicId → Verify selected access
   - ❌ Empty/invalid form data → Validate all required fields
   - ❌ CORS errors → Ensure API endpoint is properly configured
   - ❌ Wrong base URL → Check `.env.production` file

3. **Verify Endpoints:**
   - Clinic Inventory Save: `/inventory/SaveClinicInventoryBatch`
   - Master Items Bulk Add: `/inventory/AddInventoryMasterItemsBulk`
   - Master Items Get All: `/inventory/GetAllInventoryMasterItems`

---

**Last Updated:** February 13, 2026
**Build Status:** ✅ Production build successful (770 modules transformed)
