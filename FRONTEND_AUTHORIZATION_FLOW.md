# 🔐 Frontend Code: Authorization Header Flow for SearchPatients

## Complete Frontend Code Flow

Here's exactly how your frontend sends the Authorization header to the SearchPatients endpoint:

---

## 1. **ViewPatients Component** (`src/pages/ViewPatients.jsx`)

```jsx
// ViewPatients.jsx - Search handler
const handleSearchClick = async () => {
  setIsLoading(true);
  try {
    const params = {
      firstName: filterData.firstName || undefined,
      lastName: filterData.lastName || undefined,
      dob: filterData.dateOfBirth || undefined,
      patientId: filterData.patientId ? parseInt(filterData.patientId) : undefined,
      clinicId: filterData.clinicId ? parseInt(filterData.clinicId) : undefined
    };

    // Remove undefined values
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    console.log('🔍 PATIENT SEARCH INITIATED with filters:', filterData);
    console.log('📝 Cleaned params:', params);
    
    // ✅ Call searchPatients API
    const results = await searchPatients(params);
    console.log('📋 API SEARCH RESULTS:', results);
    setSearchResults(results || []);
  } catch (error) {
    console.error("Search failed:", error);
    setSearchResults([]);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 2. **API Layer** (`src/api/hmsApi.ts`)

```typescript
// hmsApi.ts - searchPatients function
export function searchPatients(params: {
  firstName?: string;
  lastName?: string;
  dob?: string;
  patientId?: number;
  clinicId?: number;
}): Promise<any[]> {
  console.log('📞 API CALL: searchPatients with params:', params);
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (params.patientId) queryParams.append('patientId', params.patientId.toString());
  if (params.clinicId) queryParams.append('clinicId', params.clinicId.toString());
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  if (params.dob) queryParams.append('dob', params.dob);
  
  const endpoint = `/Patient/Patientsearch?${queryParams.toString()}`;
  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log('🔗 FULL PATIENT SEARCH URL:', fullUrl);
  
  // ✅ Call generic request function with Authorization header
  return request<any[]>(endpoint)
    .then(data => {
      console.log('✅ PATIENTS FETCHED SUCCESSFULLY:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ FAILED TO FETCH PATIENTS:', error);
      throw error;
    });
}
```

---

## 3. **HTTP Client Layer** (`src/services/apiClient.ts`)

```typescript
// apiClient.ts - request function (Core HTTP handler)
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // ✅ GET TOKEN FROM STORAGE
  let token = getAuthToken();
  const selectedAccess = getSelectedAccess();
  
  console.log('🔍 Token Validation Starting...');
  console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');
  
  // ... Token validation logic ...
  
  // ✅ BUILD HEADERS WITH AUTHORIZATION
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };
  
  // ✅ **THIS IS THE CRITICAL PART**
  // Add Authorization header with Bearer token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('📌 Authorization header added: Bearer [token present]');
  } else {
    console.warn('⚠️ NO TOKEN - Authorization header will NOT be sent');
  }
  
  // Add custom headers for Enterprise/Clinic/Roles
  if (selectedAccess) {
    headers['X-Enterprise-Id'] = selectedAccess.enterpriseId.toString();
    headers['X-Clinic-Id'] = selectedAccess.clinicId.toString();
    
    if (selectedAccess.roleIds && selectedAccess.roleIds.length > 0) {
      headers['X-Role-Ids'] = selectedAccess.roleIds.join(',');
    }
  }
  
  const fullUrl = `${BASE_URL}${path}`;
  console.log(`📞 API CALL: ${options.method || 'GET'} ${fullUrl}`);
  console.log(`📋 REQUEST HEADERS:`, {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers['Authorization'] ? 'Bearer [present]' : '[missing]',
    'X-Enterprise-Id': headers['X-Enterprise-Id'] || '[missing]',
    'X-Clinic-Id': headers['X-Clinic-Id'] || '[missing]',
    'X-Role-Ids': headers['X-Role-Ids'] || '[NO ROLES]'
  });
  
  // ✅ MAKE HTTP REQUEST WITH ALL HEADERS
  let res;
  try {
    res = await fetch(fullUrl, {
      headers,        // ← All headers included here
      ...options      // Method, body, etc.
    });
    console.log(`✅ API RESPONSE: ${res.status} ${res.statusText}`);
  } catch (fetchError) {
    console.error(`❌ API FAILED: Network error - ${fetchError}`);
    throw fetchError;
  }
  
  // ... Error handling ...
}
```

---

## 4. **Token Storage** (`src/services/tokenManager.ts`)

```typescript
// tokenManager.ts - getAccessToken function
export const getAccessToken = (): string | null => {
  try {
    // Primary: Check memory
    if (memoryAccessToken) {
      console.log('✅ Token retrieved from MEMORY');
      console.log('   Token (first 50 chars):', memoryAccessToken.substring(0, 50) + '...');
      return memoryAccessToken;
    }
    
    // Fallback: Check sessionStorage
    const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_SS_KEY);
    if (sessionToken) {
      memoryAccessToken = sessionToken;
      console.log('🔄 Token retrieved from SESSIONSSTORAGE and restored to memory');
      return sessionToken;
    }
    
    // No token found
    console.warn('❌ NO TOKEN FOUND - User is not authenticated');
    return null;
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    return null;
  }
};
```

---

## 5. **Complete Request Flow Diagram**

```
User clicks "Search" in ViewPatients
         ↓
handleSearchClick() called
         ↓
searchPatients(params) → hmsApi.ts
         ↓
request(endpoint) → apiClient.ts
         ↓
getAuthToken() → tokenManager.ts
         ↓
Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
         ↓
Build headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOi..."  ← ✅ TOKEN SENT HERE
  "X-Enterprise-Id": "10007",
  "X-Clinic-Id": "5011",
  "X-Role-Ids": "2"
}
         ↓
fetch(url, { headers })
         ↓
Backend receives request with Authorization header
         ↓
Backend validates token in Authorization header
         ↓
IF valid → Returns 200 + patient data
ELSE → Returns 401 Unauthorized
```

---

## 6. **What Gets Sent to Backend**

When you call `searchPatients()`, here's exactly what your frontend sends:

```
GET /api/Patient/Patientsearch?clinicId=5011 HTTP/1.1
Host: cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2Z...
X-Enterprise-Id: 10007
X-Clinic-Id: 5011
X-Role-Ids: 2
```

---

## 7. **Current Console Output** (From Your Logs)

```
📞 API CALL: GET https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api/Patient/Patientsearch?clinicId=5011

📋 REQUEST HEADERS: {
  Content-Type: 'application/json',
  Authorization: 'Bearer [present]',        ← ✅ Token IS being sent
  X-Enterprise-Id: '10007',
  X-Clinic-Id: '5011',
  X-Role-Ids: '2'
}

GET https://...Patientsearch?clinicId=5011 401 (Unauthorized)
```

---

## ⚠️ The Problem

Even though the frontend is sending:
```
✅ Authorization header with Bearer token
✅ Valid token (835 seconds remaining)
✅ Correct role ID (2 - which is in the allowed list [1,2,7,8])
```

The backend is returning **401 Unauthorized**.

This means **the backend's authorization logic is failing**, not the frontend.

---

## 🔧 Questions for Your Backend Team

1. **Is the ValidateAccess attribute reading the X-Role-Ids header?**
   - Or is it reading roles from the JWT token claims?
   - Or is it reading from a database?

2. **What's in the JWT token claims?**
   - Does it have a "roles" or "roleIds" claim?
   - What are the actual values?

3. **Why is the token valid on the frontend but invalid on the backend?**
   - Is there a secret key mismatch?
   - Is the token signed with a different algorithm?

4. **Can you enable detailed logging in ValidateAccess?**
   ```csharp
   [HttpGet("Patientsearch")]
   [ValidateAccess(1,2,7,8)]
   public IActionResult SearchPatients([FromQuery] int? patientId = null, ...)
   {
       var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
       var roleHeader = HttpContext.Request.Headers["X-Role-Ids"].ToString();
       
       Console.WriteLine($"Authorization header: {authHeader}");
       Console.WriteLine($"Role header: {roleHeader}");
       // Log what ValidateAccess is checking
   }
   ```

---

## 📋 Summary

**Frontend is doing everything correctly:**
- ✅ Token is being sent in Authorization header
- ✅ Token is valid (not expired)
- ✅ Bearer prefix is correct
- ✅ Role ID matches allowed list
- ✅ Enterprise/Clinic headers are set

**The 401 error is coming from the backend.**

The backend needs to verify:
1. Is it reading the Authorization header correctly?
2. Is it validating the token signature correctly?
3. Is the ValidateAccess attribute reading roles from the right place?
4. Are there any other validation steps that might be failing?

