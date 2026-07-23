/**
 * 🔐 HYBRID TOKEN STORAGE MANAGER
 * 
 * Combines multiple storage mechanisms for maximum security:
 * - Access Token: Memory (RAM) + SessionStorage fallback
 * - Refresh Token: HttpOnly Cookie (set by backend)
 * - User Data: localStorage (non-sensitive, persists)
 * - Metadata: sessionStorage (session-specific)
 */

// ============================================
// 📦 STORAGE KEYS
// ============================================

// localStorage - NON-SENSITIVE data only (persists across sessions)
const USER_DATA_LS_KEY = 'userData';              // username, userId
const USER_ACCESS_LS_KEY = 'userAccess';          // user's enterprise/clinic access rights
const SELECTED_ACCESS_LS_KEY = 'selectedAccess';  // currently selected enterprise/clinic
const INACTIVITY_TIMEOUT_LS_KEY = 'inactivityTimeout'; // timeout in minutes

// sessionStorage - SESSION-SPECIFIC data (cleared on tab close)
const ACCESS_TOKEN_SS_KEY = 'accessToken_session';      // Fallback for access token
const REFRESH_TOKEN_SS_KEY = 'refreshToken_session';    // Refresh token for request body
const TOKEN_EXPIRY_SS_KEY = 'accessTokenExpiry';        // When access token expires
const LAST_ACTIVITY_SS_KEY = 'lastActivity';            // Last user interaction time
const SESSION_ID_SS_KEY = 'sessionId';                  // Unique session identifier

// Cookies - REFRESH TOKEN (set by backend, HttpOnly)
// Backend sets: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api;
// Browser automatically sends it with API requests
// Frontend CANNOT access it (protected from XSS)

// ============================================
// 🧠 IN-MEMORY STORAGE (RAM)
// ============================================

/**
 * In-memory token storage
 * - Cleared on page refresh (user re-authenticates or uses sessionStorage fallback)
 * - Lost when tab closes (auto-logout)
 * - Inaccessible to XSS attacks (not in DOM)
 */
let memoryAccessToken: string | null = null;
let memoryTokenExpiry: string | null = null;

// ============================================
// 💾 HYBRID TOKEN STORAGE FUNCTIONS
// ============================================

/**
 * Decode JWT token and show all claims
 */
export const decodeAndLogTokenClaims = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format - Expected 3 parts, got', parts.length);
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    
    console.log('🔓 ==================== JWT TOKEN CLAIMS ====================');
    console.log('📋 Full Claims Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🔍 KEY CLAIMS:');
    console.log(`   sub (Subject/User): ${decoded.sub || '[NOT FOUND]'}`);
    console.log(`   iss (Issuer): ${decoded.iss || '[NOT FOUND]'}`);
    console.log(`   aud (Audience): ${decoded.aud || '[NOT FOUND]'}`);
    console.log(`   exp (Expiration): ${decoded.exp || '[NOT FOUND]'}`);
    console.log(`   iat (Issued At): ${decoded.iat || '[NOT FOUND]'}`);
    console.log(`   userId: ${decoded.userId || '[NOT FOUND]'}`);
    console.log(`   username: ${decoded.username || '[NOT FOUND]'}`);
    
    // Look for role-related claims
    console.log('\n👤 ROLE-RELATED CLAIMS:');
    const roleKeys = Object.keys(decoded).filter(key => 
      key.toLowerCase().includes('role') || 
      key.toLowerCase().includes('permission') ||
      key.toLowerCase().includes('access')
    );
    
    if (roleKeys.length > 0) {
      roleKeys.forEach(key => {
        console.log(`   ${key}: ${JSON.stringify(decoded[key])}`);
      });
    } else {
      console.warn('   ⚠️ NO ROLE/PERMISSION CLAIMS FOUND IN TOKEN');
    }
    
    // Look for enterprise/clinic claims
    console.log('\n🏢 ENTERPRISE/CLINIC CLAIMS:');
    const accessKeys = Object.keys(decoded).filter(key => 
      key.toLowerCase().includes('enterprise') || 
      key.toLowerCase().includes('clinic') ||
      key.toLowerCase().includes('company')
    );
    
    if (accessKeys.length > 0) {
      accessKeys.forEach(key => {
        console.log(`   ${key}: ${JSON.stringify(decoded[key])}`);
      });
    } else {
      console.warn('   ⚠️ NO ENTERPRISE/CLINIC CLAIMS FOUND IN TOKEN');
    }
    
    console.log('🔓 ============================================================\n');
    
    return decoded;
  } catch (error) {
    console.error('❌ Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Extract token expiry from JWT token's 'exp' claim
 * This is the ground truth - the exp claim in JWT is Unix timestamp
 */
export const extractTokenExpiryFromJWT = (token: string): string | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format');
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    
    if (!decoded.exp) {
      console.error('❌ No exp claim in JWT token');
      return null;
    }
    
    // Convert Unix timestamp (seconds) to ISO date string
    const expiryDate = new Date(decoded.exp * 1000);
    const isoString = expiryDate.toISOString();
    
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = decoded.exp - now;
    
    console.log('🔑 JWT Token Expiry Extracted:');
    console.log(`   exp claim (Unix): ${decoded.exp}`);
    console.log(`   Expires at (ISO): ${isoString}`);
    console.log(`   Time remaining: ${timeRemaining} seconds (${Math.floor(timeRemaining / 60)} minutes)`);
    
    return isoString;
  } catch (error) {
    console.error('❌ Failed to extract expiry from JWT:', error);
    return null;
  }
};

/**
 * Save access token using hybrid strategy:
 * 1. Store in MEMORY first (fastest access)
 * 2. Backup in sessionStorage (survives page refresh)
 * 3. Extract expiry from JWT's exp claim (ground truth)
 */
export const saveAccessToken = (token: string, backendExpiryTime?: string): void => {
  try {
    console.log('\n📋 SAVING ACCESS TOKEN STEP-BY-STEP:');
    
    if (!token) {
      console.error('❌ CRITICAL: No token provided to saveAccessToken');
      return;
    }
    
    // CRITICAL FIX: Try to extract JWT expiry, but fall back to backend-provided expiry if JWT parsing fails
    let expiryTime: string | null = null;
    
    try {
      const jwtExpiry = extractTokenExpiryFromJWT(token);
      if (jwtExpiry) {
        expiryTime = jwtExpiry;
        console.log(`   ✓ JWT Expiry extracted: ${expiryTime}`);
      }
    } catch (jwtError) {
      console.warn('⚠️ Could not extract JWT expiry, will use backend-provided expiry', jwtError);
    }
    
    // If JWT extraction failed, use backend-provided expiry or generate default
    if (!expiryTime) {
      if (backendExpiryTime) {
        expiryTime = backendExpiryTime;
        console.log(`   ✓ Using backend-provided expiry: ${expiryTime}`);
      } else {
        // Default to 15 minutes from now if backend doesn't provide expiry
        expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        console.warn(`   ⚠️ No JWT exp claim and no backend expiry - using 15-minute default: ${expiryTime}`);
      }
    }
    
    // Store in memory (primary)
    memoryAccessToken = token;
    memoryTokenExpiry = expiryTime;
    console.log('   ✓ Saved to memory (RAM)');
    
    // Store in sessionStorage (fallback)
    sessionStorage.setItem(ACCESS_TOKEN_SS_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_SS_KEY, expiryTime);
    
    // VERIFY what was actually saved
    const verifyToken = sessionStorage.getItem(ACCESS_TOKEN_SS_KEY);
    const verifyExpiry = sessionStorage.getItem(TOKEN_EXPIRY_SS_KEY);
    
    console.log('   ✓ Saved to sessionStorage');
    console.log(`   ✅ VERIFICATION:`);
    console.log(`      - accessToken_session exists: ${verifyToken ? 'YES' : 'MISSING ❌'}`);
    console.log(`      - accessTokenExpiry exists: ${verifyExpiry ? 'YES' : 'MISSING ❌'}`);
    
    if (verifyToken && verifyExpiry) {
      console.log(`   ✅ ACCESS TOKEN SAVED SUCCESSFULLY`);
    } else {
      console.error(`   ❌ SAVE VERIFICATION FAILED`);
      if (!verifyToken) console.error(`      - accessToken_session not found after setItem!`);
      if (!verifyExpiry) console.error(`      - accessTokenExpiry not found after setItem!`);
    }
    
    // Try to decode and log claims, but don't fail if JWT is malformed
    try {
      decodeAndLogTokenClaims(token);
    } catch (decodeError) {
      console.warn('⚠️ Could not decode JWT claims:', decodeError);
    }
    
  } catch (error) {
    console.error('❌ Failed to save access token:', error);
    console.error('   Stack:', (error as Error).stack);
  }
};

/**
 * Get access token with automatic fallback:
 * 1. Check memory first (fastest)
 * 2. Fall back to sessionStorage (after page refresh)
 * 3. Return null if not found (trigger re-authentication)
 */
export const getAccessToken = (): string | null => {
  try {
    // Primary: Check memory
    if (memoryAccessToken) {
      console.log('✅ Token retrieved from MEMORY');
      console.log('   Token (first 50 chars):', memoryAccessToken.substring(0, 50) + '...');
      return memoryAccessToken;
    }
    
    // Fallback: Check sessionStorage (after page refresh)
    const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_SS_KEY);
    if (sessionToken) {
      // Restore to memory for faster subsequent access
      memoryAccessToken = sessionToken;
      console.log('🔄 Token retrieved from SESSIONSSTORAGE and restored to memory');
      console.log('   Token (first 50 chars):', sessionToken.substring(0, 50) + '...');
      
      // Also check expiry
      const expiry = sessionStorage.getItem(TOKEN_EXPIRY_SS_KEY);
      console.log('   Expiry time:', expiry);
      
      return sessionToken;
    }
    
    // No token found - provide diagnostic info
    console.warn('❌ NO TOKEN FOUND - neither in memory nor in sessionStorage');
    console.warn('   User needs to login again');
    console.warn('   🔍 Diagnostic Info:');
    console.warn('      - Memory token exists:', !!memoryAccessToken);
    console.warn('      - SessionStorage key "' + ACCESS_TOKEN_SS_KEY + '" exists:', sessionStorage.getItem(ACCESS_TOKEN_SS_KEY) !== null);
    console.warn('      - Available sessionStorage keys:', Array.from({length: sessionStorage.length}, (_, i) => sessionStorage.key(i)));
    return null;
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    return null;
  }
};

/**
 * Refresh Token Storage (HttpOnly Cookie)
 * 
 * IMPORTANT: 
 * - Backend sets this automatically in Set-Cookie header
 * - It's HttpOnly, so JavaScript CANNOT access it
 * - Browser automatically sends it with every request
 * - This is the MOST SECURE way to store refresh tokens
 * 
 * Frontend doesn't need to do anything - just let the backend handle it!
 */
/**
 * Get refresh token from sessionStorage
 * CRITICAL: Backend model requires this in request body: { accessToken, refreshToken }
 */
export const getRefreshToken = (): string | null => {
  try {
    const token = sessionStorage.getItem(REFRESH_TOKEN_SS_KEY);
    if (token) {
      console.log('✅ Refresh token retrieved from sessionStorage for API call');
      return token;
    }
    console.error('❌ Refresh token NOT found in sessionStorage - refresh will fail!');
    return null;
  } catch (error) {
    console.error('❌ Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Save refresh token to sessionStorage during login
 * CRITICAL: Backend expects this in refresh API request body
 */
export const saveRefreshToken = (token: string): void => {
  try {
    if (!token) {
      console.error('❌ CRITICAL: saveRefreshToken called with EMPTY TOKEN');
      console.error('   This means the backend did not return a refresh token!');
      console.error('   Session will not be able to refresh - user will be logged out on first 401');
      return;
    }
    
    console.log(`\n📋 SAVING REFRESH TOKEN:`);
    console.log(`   Token length: ${token.length} characters`);
    console.log(`   First 20 chars: ${token.substring(0, 20)}...`);
    
    sessionStorage.setItem(REFRESH_TOKEN_SS_KEY, token);
    console.log('   ✓ Set to sessionStorage');
    
    // Verify
    const verify = sessionStorage.getItem(REFRESH_TOKEN_SS_KEY);
    if (verify) {
      console.log('   ✅ VERIFIED: Refresh token ready for API refresh calls');
    } else {
      console.error('   ❌ CRITICAL VERIFICATION FAILED: Refresh token not in sessionStorage after setItem!');
      console.error('   This likely means sessionStorage is full or disabled');
    }
  } catch (error) {
    console.error('❌ CRITICAL: Failed to save refresh token:', error);
    if (error instanceof Error) {
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
    }
  }
};

/**
 * Save user data (NON-SENSITIVE) to localStorage
 * This persists across sessions and page refreshes
 */
export const saveUserData = (userData: {
  username: string;
  userId: number;
}): void => {
  try {
    localStorage.setItem(USER_DATA_LS_KEY, JSON.stringify(userData));
    console.log('✅ User data saved to localStorage:', userData.username);
  } catch (error) {
    console.error('❌ Failed to save user data:', error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): any | null => {
  try {
    const data = localStorage.getItem(USER_DATA_LS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Failed to get user data:', error);
    return null;
  }
};

/**
 * Save user access rights (NON-SENSITIVE) to localStorage
 * Contains enterprise/clinic/role information
 */
export const saveUserAccess = (access: any[]): void => {
  try {
    localStorage.setItem(USER_ACCESS_LS_KEY, JSON.stringify(access));
    console.log('✅ USER ACCESS RIGHTS SAVED TO LOCALSTORAGE:');
    if (access && access.length > 0) {
      console.log(`   Total access configurations: ${access.length}`);
      access.forEach((item, idx) => {
        console.log(`   Access #${idx + 1}: Enterprise=${item.enterpriseId}, Clinic=${item.clinicId}, Roles=${item.roleIds ? item.roleIds.join(',') : 'NONE'}`);
      });
    } else {
      console.warn('   ⚠️ No access configurations found');
    }
  } catch (error) {
    console.error('❌ Failed to save user access:', error);
  }
};

/**
 * Get user access rights from localStorage
 */
export const getUserAccess = (): any[] => {
  try {
    const data = localStorage.getItem(USER_ACCESS_LS_KEY);
    const access = data ? JSON.parse(data) : [];
    if (access.length > 0) {
      console.log('✅ USER ACCESS RETRIEVED FROM LOCALSTORAGE:');
      access.forEach((item, idx) => {
        console.log(`   Access #${idx + 1}: Enterprise=${item.enterpriseId}, Clinic=${item.clinicId}, Roles=${item.roleIds ? item.roleIds.join(',') : 'NONE'}`);
      });
    } else {
      console.warn('⚠️ NO USER ACCESS FOUND IN LOCALSTORAGE');
    }
    return access;
  } catch (error) {
    console.error('❌ Failed to get user access:', error);
    return [];
  }
};

/**
 * Save selected enterprise/clinic to localStorage
 */
export const saveSelectedAccess = (enterpriseId: number, clinicId: number, roleIds: number[] = []): void => {
  try {
    console.log('\n📋 SAVING SELECTED ACCESS STEP-BY-STEP:');
    console.log(`   Input Parameters:`);
    console.log(`      - enterpriseId: ${enterpriseId}`);
    console.log(`      - clinicId: ${clinicId}`);
    console.log(`      - roleIds: ${roleIds && roleIds.length > 0 ? roleIds.join(', ') : 'NONE'}`);
    
    const selectedAccess = { enterpriseId, clinicId, roleIds };
    const jsonString = JSON.stringify(selectedAccess);
    
    console.log(`   JSON to save: ${jsonString}`);
    console.log(`   Key: ${SELECTED_ACCESS_LS_KEY}`);
    
    // Save to localStorage
    localStorage.setItem(SELECTED_ACCESS_LS_KEY, jsonString);
    console.log('   ✓ Saved to localStorage');
    
    // VERIFY what was actually saved
    const verify = localStorage.getItem(SELECTED_ACCESS_LS_KEY);
    
    if (verify) {
      console.log(`   ✅ VERIFICATION SUCCESS`);
      console.log(`      Saved value: ${verify}`);
      const parsed = JSON.parse(verify);
      console.log(`      Parsed: Enterprise=${parsed.enterpriseId}, Clinic=${parsed.clinicId}, Roles=${parsed.roleIds?.join(',') || 'NONE'}`);
    } else {
      console.error(`   ❌ VERIFICATION FAILED: Key "${SELECTED_ACCESS_LS_KEY}" not found after setItem`);
      console.error(`      localStorage keys:`, Array.from({length: localStorage.length}, (_, i) => localStorage.key(i)));
    }
    
  } catch (error) {
    console.error('❌ Failed to save selected access:', error);
    console.error('   Stack:', (error as Error).stack);
  }
};

/**
 * Get selected enterprise/clinic from localStorage
 */
export const getSelectedAccess = (): { enterpriseId: number; clinicId: number; roleIds: number[] } | null => {
  try {
    const data = localStorage.getItem(SELECTED_ACCESS_LS_KEY);
    const selected = data ? JSON.parse(data) : null;
    if (selected) {
      console.log('🏢 SELECTED ACCESS RETRIEVED FROM LOCALSTORAGE:');
      console.log(`   Enterprise: ${selected.enterpriseId}`);
      console.log(`   Clinic: ${selected.clinicId}`);
      console.log(`   Roles: ${selected.roleIds && selected.roleIds.length > 0 ? selected.roleIds.join(', ') : 'NONE'}`);
      console.log(`   Number of roles: ${selected.roleIds?.length || 0}`);
    } else {
      console.warn('⚠️ NO SELECTED ACCESS FOUND IN LOCALSTORAGE - User must select access');
    }
    return selected;
  } catch (error) {
    console.error('❌ Failed to get selected access:', error);
    return null;
  }
};

/**
 * Save metadata to sessionStorage (auto-cleared on tab close)
 */
export const saveSessionMetadata = (key: string, value: any): void => {
  try {
    sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (error) {
    console.error('❌ Failed to save session metadata:', error);
  }
};

/**
 * Get metadata from sessionStorage
 */
export const getSessionMetadata = (key: string): any | null => {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    
    // Try to parse as JSON, fall back to string
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.error('❌ Failed to get session metadata:', error);
    return null;
  }
};

/**
 * Update access token expiry time
 */
export const updateTokenExpiry = (expiryTime: string): void => {
  try {
    memoryTokenExpiry = expiryTime;
    sessionStorage.setItem(TOKEN_EXPIRY_SS_KEY, expiryTime);
    console.log('⏰ Token expiry updated: ' + expiryTime);
  } catch (error) {
    console.error('❌ Failed to update token expiry:', error);
  }
};

/**
 * Get access token expiry time
 */
export const getTokenExpiry = (): string | null => {
  try {
    return memoryTokenExpiry || sessionStorage.getItem(TOKEN_EXPIRY_SS_KEY);
  } catch (error) {
    console.error('❌ Failed to get token expiry:', error);
    return null;
  }
};

/**
 * Check if access token is expired
 */
export const isTokenExpired = (): boolean => {
  try {
    const expiry = getTokenExpiry();
    if (!expiry) {
      console.warn('⏰ No token expiry time found - assuming token is expired');
      return true; // No token = expired
    }
    
    const expiryTime = new Date(expiry).getTime();
    const now = Date.now();
    const timeRemaining = expiryTime - now;
    const isExpired = now >= expiryTime;
    
    console.log('🕐 TOKEN EXPIRY CHECK:');
    console.log(`   Expiry time: ${new Date(expiryTime).toISOString()}`);
    console.log(`   Current time: ${new Date(now).toISOString()}`);
    console.log(`   Time remaining: ${Math.floor(timeRemaining / 1000)} seconds`);
    console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
    
    if (isExpired) {
      console.warn('⏰ Access token is expired - user should be logged out');
    }
    return isExpired;
  } catch (error) {
    console.error('❌ Failed to check token expiry:', error);
    return true; // Assume expired on error
  }
};

/**
 * SECURE LOGOUT - Clear all tokens but PRESERVE user roles/access for re-login
 * 
 * CLEAR (sensitive data):
 * - Access tokens (both memory and sessionStorage)
 * - Token expiry times
 * - Session metadata
 * - HttpOnly refreshToken cookie (backend responsibility)
 * 
 * PRESERVE (user convenience):
 * - User access rights (enterprises/clinics they can access)
 * - Selected access (last selected clinic/role)
 * - User email (for faster re-login)
 * 
 * This allows users to re-login faster without losing their role/access context
 */
export const clearAllTokens = (): void => {
  try {
    // Clear memory
    memoryAccessToken = null;
    memoryTokenExpiry = null;
    
    // Clear sessionStorage (session-specific, temporary data)
    sessionStorage.removeItem(ACCESS_TOKEN_SS_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_SS_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_SS_KEY);
    sessionStorage.removeItem(SESSION_ID_SS_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_SS_KEY);  // ⭐ Also clear refresh token from sessionStorage
    
    // Clear localStorage - but PRESERVE user access/roles
    localStorage.removeItem(USER_DATA_LS_KEY);  // ❌ Clear: username/userId (session-specific)
    // ✅ PRESERVE: USER_ACCESS_LS_KEY - user should keep their role/clinic options
    // ✅ PRESERVE: SELECTED_ACCESS_LS_KEY - remember their last selection for re-login
    // ✅ PRESERVE: email - for faster re-login next time
    localStorage.removeItem(INACTIVITY_TIMEOUT_LS_KEY);
    localStorage.removeItem('APP_STATE_BEFORE_LOGOUT');  // Clear diagnostic state
    
    // Refresh token (HttpOnly cookie) is cleared by backend on logout endpoint
    // Frontend cannot clear it, so make sure backend handles it
    
    console.log('✅ All tokens and session data cleared');
    console.log('   🧠 Memory: Cleared');
    console.log('   📋 SessionStorage: Cleared');
    console.log('   💾 localStorage:');
    console.log('      ❌ User data cleared (username, userId)');
    console.log('      ✅ PRESERVED: User access rights');
    console.log('      ✅ PRESERVED: Selected clinic/role');
    console.log('   🍪 HttpOnly Cookie: Backend clears this');
  } catch (error) {
    console.error('❌ Failed to clear tokens:', error);
  }
};

/**
 * Get complete session info (for debugging)
 */
export const getSessionInfo = (): any => {
  return {
    accessToken: {
      inMemory: memoryAccessToken ? '✅ Present' : '❌ Missing',
      inSessionStorage: sessionStorage.getItem(ACCESS_TOKEN_SS_KEY) ? '✅ Present' : '❌ Missing',
      expired: isTokenExpired() ? '⏰ Yes' : '✅ Valid'
    },
    refreshToken: {
      inHttpOnlyCookie: '✅ Backend managed (not accessible from JS)'
    },
    userData: {
      present: getUserData() ? '✅ Yes' : '❌ No',
      username: getUserData()?.username || 'N/A'
    },
    selectedAccess: getSelectedAccess() || 'N/A',
    storage: {
      memorySize: memoryAccessToken ? memoryAccessToken.length : 0,
      sessionStorageSize: sessionStorage.length,
      localStorageSize: localStorage.length
    }
  };
};

/**
 * Get clinic ID from token payload (from login token claims)
 * Extracts the clinicId from the currently selected access in localStorage
 */
export const getClinicIdFromToken = (): number | null => {
  try {
    const selectedAccess = getSelectedAccess();
    if (selectedAccess && selectedAccess.clinicId) {
      console.log(`✅ Clinic ID extracted from token: ${selectedAccess.clinicId}`);
      return selectedAccess.clinicId;
    }
    console.warn('⚠️ No clinic ID found in token payload');
    return null;
  } catch (error) {
    console.error('❌ Failed to extract clinic ID from token:', error);
    return null;
  }
};

/**
 * Get enterprise ID from token payload (from login token claims)
 * Extracts the enterpriseId from the currently selected access in localStorage
 */
export const getEnterpriseIdFromToken = (): number | null => {
  try {
    const selectedAccess = getSelectedAccess();
    if (selectedAccess && selectedAccess.enterpriseId) {
      console.log(`✅ Enterprise ID extracted from token: ${selectedAccess.enterpriseId}`);
      return selectedAccess.enterpriseId;
    }
    console.warn('⚠️ No enterprise ID found in token payload');
    return null;
  } catch (error) {
    console.error('❌ Failed to extract enterprise ID from token:', error);
    return null;
  }
};

/**
 * Get doctor ID from JWT token payload (from login token claims)
 * Decodes the access token to extract doctorId
 */
export const getDoctorIdFromToken = (): number | null => {
  try {
    const token = memoryAccessToken || sessionStorage.getItem(ACCESS_TOKEN_SS_KEY);
    if (!token) {
      console.warn('⚠️ No access token available to extract doctorId');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );

    const decoded = JSON.parse(jsonPayload);
    // Try various casing/naming conventions the backend might use
    const doctorId =
      decoded.doctorId ??
      decoded.DoctorId ??
      decoded.doctor_id ??
      decoded.DocId ??
      decoded.docId ??
      null;

    if (doctorId !== null && doctorId !== undefined) {
      const id = Number(doctorId);
      console.log(`✅ Doctor ID extracted from JWT token: ${id}`);
      return id;
    }

    console.warn('⚠️ No doctorId claim found in JWT token payload');
    return null;
  } catch (error) {
    console.error('❌ Failed to extract doctorId from JWT:', error);
    return null;
  }
};

/**
 * Export constants for use in other services
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN_SS: ACCESS_TOKEN_SS_KEY,
  TOKEN_EXPIRY_SS: TOKEN_EXPIRY_SS_KEY,
  LAST_ACTIVITY_SS: LAST_ACTIVITY_SS_KEY,
  SESSION_ID_SS: SESSION_ID_SS_KEY,
  USER_DATA_LS: USER_DATA_LS_KEY,
  USER_ACCESS_LS: USER_ACCESS_LS_KEY,
  SELECTED_ACCESS_LS: SELECTED_ACCESS_LS_KEY,
  INACTIVITY_TIMEOUT_LS: INACTIVITY_TIMEOUT_LS_KEY
};
