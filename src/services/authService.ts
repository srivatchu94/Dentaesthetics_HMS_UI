import { request } from './apiClient';
import { RegisterRequest, LoginRequest, AuthResponse, LoginResponse, UserAccess, RefreshTokenRequest, RefreshTokenResponse, OtpLoginResponseFull } from '../Interfaces/AuthModels';
import {
  saveAccessToken,
  getAccessToken,
  saveUserData,
  saveUserAccess,
  saveSelectedAccess,
  getSelectedAccess,
  clearAllTokens,
  updateTokenExpiry,
  getTokenExpiry,
  isTokenExpired,
  saveSessionMetadata,
  getSessionMetadata,
  decodeAndLogTokenClaims,
  getRefreshToken,
  saveRefreshToken,
  STORAGE_KEYS
} from './tokenManager';
import {
  logTokenRefreshEvent,
  logTimerEvent,
  logInactivityEvent,
  logLogoutEvent,
  logAuthEvent,
  printDebugLogs,
  exportDebugLogs
} from '../utils/persistentDebugLogger';

const AUTH_BASE_URL = '/Authentication';

// ============================================
// 🔐 HYBRID TOKEN MANAGEMENT (SECURE)
// ============================================
// ✅ Access Token: Memory + SessionStorage (cleared on tab close)
// ✅ Refresh Token: HttpOnly Cookie (Backend managed, XSS protected)
// ✅ User Data: localStorage (non-sensitive, persists)
// ✅ Refresh token mechanism (auto-refresh before expiry)
// ✅ Inactivity timeout (30 min default)
// ✅ Max session duration (8 hours)
// ✅ User-friendly popups for session events
// ✅ Auto-cleanup on logout

// Timers
let refreshTokenTimer: number | null = null;
let inactivityTimer: number | null = null;
let sessionExpiryTimer: number | null = null;

// ⚙️ DEBUG/TEST MODE - Disable inactivity checks while testing token refresh
const TEST_MODE_DISABLE_INACTIVITY = true; // SET TO FALSE TO ENABLE INACTIVITY TIMEOUT
const TEST_MODE_DISABLE_SESSION_EXPIRY = true; // SET TO FALSE TO ENABLE SESSION EXPIRY CHECK

// Activity tracking
let lastActivityTime: number = Date.now();

// ============================================
// 💾 TOKEN STORAGE (Session-based)
// ============================================

/**
 * Convert OTP login response to standard LoginResponse format
 * Handles conversion from PascalCase backend response to camelCase frontend format
 */
export const convertOtpResponseToLoginResponse = (otpResponse: OtpLoginResponseFull): LoginResponse => {
  return {
    accessToken: otpResponse.accessToken,
    refreshToken: otpResponse.refreshToken,
    username: otpResponse.username,
    userId: parseInt(otpResponse.userId) || 0,
    access: otpResponse.access || [],
    accessTokenExpiresAt: otpResponse.accessTokenExpiresAt,
    refreshTokenExpiresAt: otpResponse.refreshTokenExpiresAt,
    inactivityTimeoutMinutes: otpResponse.inactivityTimeoutMinutes || 30,
    maxSessionDurationHours: otpResponse.maxSessionDurationHours || 8
  };
};

/**
 * Save authentication tokens and user data using HYBRID storage
 * - Access Token: Memory + SessionStorage (cleared on tab close)
 * - Refresh Token: HttpOnly Cookie (Backend managed, automatic)
 * - User Data: localStorage (non-sensitive)
 */
export const saveAuthToken = (loginResponse: LoginResponse): void => {
  try {
    const { accessToken, refreshToken, username, userId, access, accessTokenExpiresAt, refreshTokenExpiresAt, inactivityTimeoutMinutes, maxSessionDurationHours } = loginResponse;
    
    console.log('\n🔐 ==================== SAVING AUTHENTICATION TOKENS ====================');
    console.log('📋 STEP 1: Validating Login Response');
    console.log('   Response Keys:', Object.keys(loginResponse));
    console.log(`   ✓ accessToken: ${accessToken ? 'YES (' + accessToken.substring(0, 20) + '...)' : 'MISSING ❌'}`);
    console.log(`   ✓ refreshToken: ${refreshToken ? 'YES' : 'MISSING ❌'}`);
    console.log(`   ✓ username: ${username || 'MISSING ❌'}`);
    console.log(`   ✓ userId: ${userId || 'MISSING ❌'}`);
    console.log(`   ✓ access: ${access && access.length > 0 ? `YES (${access.length} items)` : 'MISSING ❌'}`);
    console.log(`   ✓ accessTokenExpiresAt: ${accessTokenExpiresAt || 'MISSING ❌'}`);
    
    // 🧠 Save ACCESS TOKEN using HYBRID strategy
    console.log('\n📋 STEP 2: Saving Access Token (Memory + SessionStorage)');
    saveAccessToken(accessToken, accessTokenExpiresAt);
    
    // Verify access token was saved
    const savedToken = sessionStorage.getItem('accessToken_session');
    const savedExpiry = sessionStorage.getItem('accessTokenExpiry');
    console.log(`   ✓ SessionStorage check:`);
    console.log(`      - accessToken_session: ${savedToken ? 'YES' : 'MISSING ❌'}`);
    console.log(`      - accessTokenExpiry: ${savedExpiry ? 'YES' : 'MISSING ❌'}`);
    
    // 🔄 Save REFRESH TOKEN to sessionStorage
    // CRITICAL: Backend requires this in refresh API request body
    console.log('\n📋 STEP 2B: Saving Refresh Token to SessionStorage');
    saveRefreshToken(refreshToken);
    
    console.log('   ✓ Refresh Token also set as HttpOnly Cookie (Backend managed)');
    console.log(`      Expires at: ${refreshTokenExpiresAt}`);
    
    // 💾 Save NON-SENSITIVE user data
    console.log('\n📋 STEP 3: Saving User Data to localStorage');
    saveUserData({ username, userId });
    
    // Verify user data was saved
    const savedUserData = localStorage.getItem('userData');
    console.log(`   ✓ userData saved: ${savedUserData ? 'YES' : 'MISSING ❌'}`);
    if (savedUserData) {
      console.log(`      Content: ${savedUserData}`);
    }
    
    console.log('\n📋 STEP 4: Saving User Access Rights');
    saveUserAccess(access);
    
    // Verify access was saved
    const savedAccess = localStorage.getItem('userAccess');
    console.log(`   ✓ userAccess saved: ${savedAccess ? 'YES' : 'MISSING ❌'}`);
    if (savedAccess) {
      const accessCount = JSON.parse(savedAccess).length;
      console.log(`      Count: ${accessCount} access configurations`);
    }
    
    // Log detailed access info
    console.log('\n📋 STEP 5: Access & Roles Details');
    if (access && access.length > 0) {
      console.log(`✅ User has ${access.length} access configuration(s):`);
      access.forEach((accessItem, index) => {
        console.log(`   [${index + 1}] Enterprise ${accessItem.enterpriseId} → Clinic ${accessItem.clinicId}`);
        console.log(`       Roles: ${accessItem.roleIds && accessItem.roleIds.length > 0 ? accessItem.roleIds.join(', ') : 'NONE'}`);
      });
    } else {
      console.warn('⚠️ NO ACCESS CONFIGURATIONS - User has no roles!');
    }
    
    // Auto-select first access
    console.log('\n📋 STEP 6: Auto-Selecting First Access');
    if (access && access.length > 0) {
      const firstAccess = access[0];
      console.log(`   Selecting: Enterprise ${firstAccess.enterpriseId}, Clinic ${firstAccess.clinicId}`);
      console.log(`   Roles: ${firstAccess.roleIds && firstAccess.roleIds.length > 0 ? firstAccess.roleIds.join(', ') : 'NONE'}`);
      
      try {
        saveSelectedAccess(firstAccess.enterpriseId, firstAccess.clinicId, firstAccess.roleIds);
        
        // Verify selectedAccess was saved
        const verify = localStorage.getItem('selectedAccess');
        if (verify) {
          console.log(`   ✅ selectedAccess saved: ${verify}`);
        } else {
          console.error('   ❌ selectedAccess NOT found in localStorage after save!');
        }
        
        const verifySelected = getSelectedAccess();
        if (verifySelected) {
          console.log(`   ✅ Verification successful: ${JSON.stringify(verifySelected)}`);
        } else {
          console.error('   ❌ Verification FAILED: getSelectedAccess() returned null');
        }
      } catch (error) {
        console.error('❌ ERROR saving selectedAccess:', error);
      }
    } else {
      console.error('❌ Cannot auto-select: No access found');
    }
    
    // Save metadata
    console.log('\n📋 STEP 7: Saving Session Metadata');
    saveSessionMetadata(STORAGE_KEYS.INACTIVITY_TIMEOUT_LS, inactivityTimeoutMinutes.toString());
    updateLastActivity();
    console.log(`   ✓ Inactivity timeout: ${inactivityTimeoutMinutes} minutes`);
    console.log(`   ✓ Max session duration: ${maxSessionDurationHours} hours`);
    
    // Final verification
    console.log('\n📋 STEP 8: Final Storage Verification');
    console.log('   localStorage keys:', Array.from({length: localStorage.length}, (_, i) => localStorage.key(i)));
    console.log('   sessionStorage keys:', Array.from({length: sessionStorage.length}, (_, i) => sessionStorage.key(i)));
    
    console.log('\n✅ SESSION STARTED SUCCESSFULLY (HYBRID STORAGE)');
    console.log('🧠 Access Token: Memory + SessionStorage (XSS protected)');
    console.log('🍪 Refresh Token: HttpOnly Cookie (Backend managed)');
    console.log('💾 User Data: localStorage (non-sensitive)');
    console.log('🔐 ======================================================================\n');
    
    // Start timers
    startTokenRefreshTimer();
    startTokenRefreshHeartbeat();
    startSessionExpiryTimer(refreshTokenExpiresAt);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR in saveAuthToken:');
    console.error('   Error:', error);
    console.error('   Stack:', (error as Error).stack);
  }
};

/**
 * Get access token from HYBRID storage
 * Priority: Memory → SessionStorage → null
 */
export const getAuthToken = (): string | null => {
  const token = getAccessToken();
  if (!token) {
    console.warn('⚠️ getAuthToken(): NO TOKEN FOUND - User is not authenticated');
  }
  return token;
};

/**
 * Check if access token is expired
 */
export const checkTokenExpired = (): boolean => {
  return isTokenExpired();
};

/**
 * Get refresh token (HttpOnly Cookie - cannot be accessed from JS)
 * Browser automatically sends it with API requests
 */
export const getRefreshToken = (): string | null => {
  // HttpOnly cookies cannot be accessed from JavaScript
  // They're automatically included in requests by the browser
  // This function is here for reference only
  console.log('ℹ️ Refresh Token is HttpOnly Cookie - automatically sent by browser');
  return null;
};

/**
 * Get user data from localStorage (non-sensitive)
 */
/**
 * Get authenticated user data from localStorage
 */
export const getAuthUserData = (): any | null => {
  return getUserData();
};

// Backward compatibility alias
export const getUserData = (): any | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA_LS);
  return data ? JSON.parse(data) : null;
};

/**
 * Get user access rights from localStorage
 */
export const getAuthUserAccess = (): UserAccess[] => {
  return getUserAccess();
};

// Backward compatibility alias
export const getUserAccess = (): UserAccess[] => {
  const access = localStorage.getItem(STORAGE_KEYS.USER_ACCESS_LS);
  return access ? JSON.parse(access) : [];
};

/**
 * Set selected enterprise, clinic, and roles
 */
export const setSelectedAccess = (enterpriseId: number, clinicId: number, roleIds: number[] = []): void => {
  saveSelectedAccess(enterpriseId, clinicId, roleIds);
};

// Re-export getSelectedAccess from tokenManager.ts to avoid duplication
// All imports from authService.ts will still work
export { getSelectedAccess } from './tokenManager';

// ============================================
// ⏱️ ACTIVITY TRACKING
// ============================================

/**
 * Update last activity timestamp
 */
export const updateLastActivity = (): void => {
  const now = Date.now();
  saveSessionMetadata(STORAGE_KEYS.LAST_ACTIVITY_SS, now.toString());
  console.log('📍 Activity tracked at:', new Date(now).toLocaleTimeString());
};

/**
 * Get time since last activity in minutes
 */
export const getInactiveMinutes = (): number => {
  const lastActivity = getSessionMetadata(STORAGE_KEYS.LAST_ACTIVITY_SS);
  if (!lastActivity) return 0;
  
  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity);
  const diff = now - lastActivityTime;
  return Math.floor(diff / (1000 * 60));
};

/**
 * Check if user has been inactive for too long
 */
export const isInactive = (): boolean => {
  const timeoutStr = getSessionMetadata(STORAGE_KEYS.INACTIVITY_TIMEOUT_LS);
  const timeoutMinutes = parseInt(timeoutStr || '30');
  return getInactiveMinutes() >= timeoutMinutes;
};

// ============================================
// 🔄 TOKEN REFRESH MECHANISM (HYBRID)
// ============================================

/**
 * Refresh access token using HYBRID storage
 * - Access Token refreshed and stored in Memory + SessionStorage
 * - Refresh Token (HttpOnly Cookie) is automatic from backend
 * - Automatically retries on failure
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const accessToken = getAuthToken();
    
    if (!accessToken) {
      console.warn('⚠️ No access token available for refresh. User may not be authenticated.');
      logTokenRefreshEvent('FAILED: No access token available');
      return false;
    }
    
    const refreshStartTime = new Date();
    logTokenRefreshEvent('REFRESH STARTED', { timestamp: refreshStartTime.toLocaleString() });
    
    console.log('\n\n');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('🔄 TOKEN REFRESH INITIATED');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`⏰ Timestamp: ${refreshStartTime.toLocaleString()}`);
    
    // Get BOTH tokens needed for refresh
    console.log('\n📋 STEP 0: RETRIEVING TOKENS FROM STORAGE');
    console.log('═══════════════════════════════════════════');
    
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('❌ CRITICAL ERROR: Refresh token not found in sessionStorage!');
      console.error('   Cannot call refresh API without refresh token');
      logTokenRefreshEvent('STEP 0: FAILED - Refresh token missing from storage');
      return false;
    }
    
    console.log(`   ✅ Access Token found: ${accessToken.substring(0, 30)}...`);
    console.log(`   ✅ Refresh Token found: ${refreshToken.substring(0, 30)}...`);
    
    // Prepare request parameters with BOTH tokens
    const refreshUrl = `${window.location.origin}/api/Authentication/refresh-token`;
    const requestBody = {
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    
    console.log('\n📋 STEP 1: API ENDPOINT DETAILS');
    console.log('═══════════════════════════════════════════');
    console.log(`   API URL: ${refreshUrl}`);
    console.log(`   Method: POST`);
    console.log(`   Protocol: HTTPS`);
    console.log(`   Origin: ${window.location.origin}`);
    console.log(`   Path: /api/Authentication/refresh-token`);
    
    logTokenRefreshEvent('STEP 1: Preparing API endpoint', { url: refreshUrl });
    
    console.log('\n📋 STEP 2: REQUEST PARAMETERS');
    console.log('═══════════════════════════════════════════');
    console.log('   Request Headers:');
    console.log(`      1. Content-Type: application/json`);
    console.log(`      2. Authorization: Bearer ${accessToken.substring(0, 30)}...${accessToken.substring(accessToken.length - 20)}`);
    console.log(`      3. credentials: 'include' (sends HttpOnly cookies)`);
    console.log('\n   Request Body (REQUIRED BY BACKEND):');
    console.log(`      {`);
    console.log(`        "AccessToken": "${accessToken.substring(0, 30)}..."`);
    console.log(`        "RefreshToken": "${refreshToken.substring(0, 30)}..."`);
    console.log(`      }`);
    console.log('\n   Full Body JSON:');
    console.log(`      ${JSON.stringify(requestBody, null, 6)}`);
    
    logTokenRefreshEvent('STEP 2: Sending request body with both tokens', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      bodyKeys: Object.keys(requestBody)
    });
    
    const startTime = Date.now();
    console.log(`\n📋 STEP 3: SENDING REQUEST`);
    console.log('═══════════════════════════════════════════');
    console.log(`   ⏱️ Request started at: ${new Date(startTime).toLocaleTimeString()}`);
    
    logTokenRefreshEvent('STEP 3: About to call fetch', {
      url: refreshUrl,
      method: 'POST',
      timestamp: new Date(startTime).toLocaleTimeString()
    });
    
    // Execute fetch with detailed parameter logging
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include',  // ✅ CRITICAL: Send HttpOnly refresh token cookie
      body: JSON.stringify(requestBody)
    });
    
    logTokenRefreshEvent('STEP 3: Fetch response received', {
      status: response.status,
      statusText: response.statusText,
      durationMs: Date.now() - startTime
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`\n📋 STEP 4: RESPONSE RECEIVED`);
    console.log('═══════════════════════════════════════════');
    console.log(`   ⏱️ Duration: ${duration}ms`);
    console.log(`   📊 HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`\n   Response Headers:`);
    console.log(`      - Content-Type: ${response.headers.get('content-type')}`);
    console.log(`      - Content-Length: ${response.headers.get('content-length')}`);
    console.log(`      - Set-Cookie: ${response.headers.get('set-cookie') ? 'YES (Cookie set)' : 'N/A'}`);
    console.log(`      - Cache-Control: ${response.headers.get('cache-control') || 'N/A'}`);
    
    // Parse response
    let data: any;
    try {
      const responseText = await response.text();
      console.log(`\n   Raw Response Body (first 500 chars):`);
      console.log(`      ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
      
      data = JSON.parse(responseText);
      console.log(`\n   Parsed Response JSON:`);
      console.log(``, JSON.stringify(data, null, 6));
    } catch (parseError) {
      console.error(`\n❌ ERROR PARSING RESPONSE`);
      console.error(`   Failed to parse response as JSON`);
      console.error(`   Error: ${(parseError as Error).message}`);
      return false;
    }
    
    // Check if response was successful
    if (response.status !== 200) {
      console.error(`\n❌ REFRESH FAILED - HTTP Status ${response.status}`);
      console.error('═══════════════════════════════════════════');
      console.error('   Diagnostic Information:');
      console.error(`   1. Status Code Issue: ${response.status}`);
      
      logTokenRefreshEvent('STEP 4: Response FAILED', {
        status: response.status,
        statusText: response.statusText,
        message: data.message || data.error || 'Unknown error'
      });
      
      if (response.status === 401) {
        console.error(`      → Unauthorized: Refresh token may be invalid or expired`);
        logTokenRefreshEvent('Status 401: Refresh token expired or invalid');
      } else if (response.status === 403) {
        console.error(`      → Forbidden: Access denied`);
        logTokenRefreshEvent('Status 403: Access forbidden');
      } else if (response.status === 400) {
        console.error(`      → Bad Request: Request parameters invalid`);
        logTokenRefreshEvent('Status 400: Bad request parameters');
      } else if (response.status >= 500) {
        console.error(`      → Server Error: Backend issue`);
        logTokenRefreshEvent('Status 5xx: Server error');
      }
      
      console.error(`   2. Server Response: ${data.message || data.error || 'No error message'}`);
      console.error(`   3. Full Error Response:`, data);
      return false;
    }
    
    // Validate response has required fields
    if (!data.accessToken) {
      console.error(`\n❌ INVALID REFRESH RESPONSE`);
      console.error('═══════════════════════════════════════════');
      console.error('   Missing required field: accessToken');
      console.error('   Response provided:', Object.keys(data));
      console.error('   Full response:', data);
      
      logTokenRefreshEvent('STEP 4: Response validation failed - missing accessToken', data);
      return false;
    }
    
    console.log(`\n✅ RESPONSE VALIDATION PASSED`);
    console.log('═══════════════════════════════════════════');
    console.log(`   ✓ Status: 200 OK`);
    console.log(`   ✓ Has accessToken: YES`);
    console.log(`   ✓ New Token: ${data.accessToken.substring(0, 30)}...${data.accessToken.substring(data.accessToken.length - 20)}`);
    console.log(`   ✓ Expires: ${data.accessTokenExpiresAt}`);
    
    logTokenRefreshEvent('STEP 4: Response validation PASSED', {
      status: 200,
      hasAccessToken: true,
      expiresAt: data.accessTokenExpiresAt
    });
    
    console.log('\n📋 STEP 5: UPDATING LOCAL STORAGE');
    console.log('═══════════════════════════════════════════');
    console.log(`   Saving new access token...`);
    console.log(`   New Token (first 30 chars): ${data.accessToken.substring(0, 30)}...`);
    console.log(`   Expires At: ${data.accessTokenExpiresAt}`);
    
    logTokenRefreshEvent('STEP 5: Saving new access token to storage');
    
    // Update access token in HYBRID storage
    saveAccessToken(data.accessToken);
    
    console.log('\n✅ TOKEN STORAGE UPDATED');
    console.log('═══════════════════════════════════════════');
    console.log(`   ✓ Access Token: Saved to memory`);
    console.log(`   ✓ Access Token: Saved to sessionStorage`);
    console.log(`   ✓ Refresh Token: HttpOnly Cookie updated by backend`);
    
    // Extract and log new expiry time
    const newExpiryStr = getTokenExpiry();
    if (newExpiryStr) {
      const newExpiry = new Date(newExpiryStr);
      const minutesRemaining = Math.floor((newExpiry.getTime() - Date.now()) / 1000 / 60);
      const secondsRemaining = Math.floor((newExpiry.getTime() - Date.now()) / 1000) % 60;
      
      console.log(`\n⏰ NEW TOKEN EXPIRY INFORMATION`);
      console.log('═══════════════════════════════════════════');
      console.log(`   Now: ${new Date().toLocaleTimeString()}`);
      console.log(`   Expires: ${newExpiry.toLocaleTimeString()}`);
      console.log(`   Time Remaining: ${minutesRemaining}m ${secondsRemaining}s`);
      console.log(`   Full Expiry: ${newExpiryStr}`);
    }
    
    console.log(`\n📋 STEP 6: RESTARTING REFRESH TIMER`);
    console.log('═══════════════════════════════════════════');
    console.log(`   Setting new timer...`);
    console.log(`   Will refresh again in: 12 minutes`);
    console.log(`   (3 minutes before new expiry)`);
    
    // Restart refresh timer with new expiry
    startTokenRefreshTimer();
    
    console.log(`\n✅ TOKEN REFRESH COMPLETED SUCCESSFULLY`);
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    return true;
  } catch (error) {
    const timestamp = new Date().toLocaleString();
    console.error(`\n\n❌ ════════════════════════════════════════════════════════════════════════════════`);
    console.error(`❌ REFRESH TOKEN FAILED AT ${timestamp}`);
    console.error(`❌ ════════════════════════════════════════════════════════════════════════════════`);
    
    logTokenRefreshEvent('REFRESH FAILED - Exception caught', {
      timestamp,
      errorName: (error as Error).name,
      errorMessage: (error as Error).message
    });
    
    console.error(`\n📋 ERROR DETAILS:`);
    console.error('═══════════════════════════════════════════');
    console.error(`   Error Type: ${(error as Error).name}`);
    console.error(`   Error Message: ${(error as Error).message}`);
    console.error(`   Error Stack: ${(error as Error).stack}`);
    console.error(`   Full Error Object:`, error);
    
    if (error instanceof TypeError) {
      console.error(`\n🔍 ANALYSIS: TypeError detected`);
      console.error('   This usually means:');
      console.error('   1. Network error (CORS, network unreachable)');
      console.error('   2. Fetch API error');
      console.error('   3. Invalid URL or fetch parameters');
      
      logTokenRefreshEvent('TypeError caught - possible network issue');
    }
    
    console.error(`\n📋 TROUBLESHOOTING STEPS:`);
    console.error('═══════════════════════════════════════════');
    console.error(`   1. Check Network tab for failed requests`);
    console.error(`   2. Verify API endpoint is reachable`);
    console.error(`   3. Check if refresh token cookie exists`);
    console.error(`   4. Check browser console for CORS errors`);
    
    // Attempt automatic retry after 5 seconds if we have less than 2 minutes left
    const expiryStr = getTokenExpiry();
    if (expiryStr) {
      const timeRemaining = new Date(expiryStr).getTime() - Date.now();
      if (timeRemaining < 2 * 60 * 1000) {
        console.warn(`\n⏳ RETRY LOGIC TRIGGERED`);
        console.warn('═══════════════════════════════════════════');
        console.warn(`   Token expiring in ${Math.floor(timeRemaining / 1000)} seconds`);
        console.warn(`   Will retry refresh in 5 seconds...`);
        
        setTimeout(() => {
          console.log(`\n🔄 RETRY ATTEMPT at ${new Date().toLocaleTimeString()}`);
          refreshAccessToken();
        }, 5000);
      }
    }
    
    console.error(`\n❌ ════════════════════════════════════════════════════════════════════════════════\n`);
    
    return false;
  }
};

/**
 * Start timer to auto-refresh token before it expires
 * This ensures user never sees "login required" unless refresh token itself expires
 */
const startTokenRefreshTimer = (): void => {
  // Clear existing timer
  if (refreshTokenTimer) {
    clearTimeout(refreshTokenTimer);
    console.log('🔄 Cleared previous refresh timer to set new one');
  }
  
  try {
    const expiryStr = getTokenExpiry();
    if (!expiryStr) {
      console.warn('⚠️ No token expiry found. Token refresh timer not started.');
      return;
    }
    
    const expiryTime = new Date(expiryStr).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    console.log('\n\n════════════════════════════════════════════════════════════════════════════════');
    console.log('⏰ SETTING UP TOKEN REFRESH TIMER');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`⏰ Setup Time: ${new Date(now).toLocaleString()}`);
    
    logTimerEvent('Timer setup started', { setupTime: new Date(now).toLocaleString() });
    
    console.log('\n📋 TOKEN EXPIRY INFORMATION:');
    console.log('═══════════════════════════════════════════');
    console.log(`   Current Time: ${new Date(now).toLocaleTimeString()}`);
    console.log(`   Token Expires: ${new Date(expiryTime).toLocaleTimeString()}`);
    console.log(`   Total Remaining: ${Math.floor(timeUntilExpiry / 1000 / 60)}m ${Math.floor((timeUntilExpiry % 60000) / 1000)}s`);
    console.log(`   Expiry Timestamp: ${expiryStr}`);
    
    // If token is already expired, refresh immediately
    if (timeUntilExpiry <= 0) {
      console.error('🚨 TOKEN ALREADY EXPIRED! Refreshing immediately...');
      logTimerEvent('Token already expired - refreshing immediately');
      refreshAccessToken();
      return;
    }
    
    // If token expires in less than 30 seconds, refresh immediately
    if (timeUntilExpiry < 30 * 1000) {
      console.warn('⚠️ Token expires in less than 30 seconds! Refreshing immediately...');
      refreshAccessToken();
      return;
    }
    
    // Refresh 3 minutes before expiry
    const refreshBuffer = 3 * 60 * 1000; // 3 minutes = 180000 ms
    const refreshTime = Math.max(0, timeUntilExpiry - refreshBuffer);
    const minutesUntilRefresh = Math.floor(refreshTime / 1000 / 60);
    const secondsUntilRefresh = Math.floor((refreshTime % 60000) / 1000);
    const scheduledRefreshTime = new Date(now + refreshTime);
    
    console.log(`\n📋 REFRESH TIMER SCHEDULE:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   3-Minute Buffer: ${3 * 60} seconds`);
    console.log(`   Refresh Time Before Expiry: 180 seconds`);
    console.log(`   Will refresh in: ${minutesUntilRefresh}m ${secondsUntilRefresh}s`);
    console.log(`   Scheduled refresh at: ${scheduledRefreshTime.toLocaleTimeString()}`);
    console.log(`   (${minutesUntilRefresh * 60 + secondsUntilRefresh} seconds from now)`);
    
    console.log(`\n📋 API THAT WILL BE CALLED:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   Endpoint: ${window.location.origin}/api/Authentication/refresh-token`);
    console.log(`   Method: POST`);
    console.log(`   Content-Type: application/json`);
    console.log(`   Auth Header: Bearer [access token]`);
    console.log(`   Body: { "accessToken": "[token]" }`);
    console.log(`   Credentials: 'include' (sends HttpOnly cookie)`);
    
    console.log(`\n📋 WHAT HAPPENS WHEN TIMER FIRES:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   1. Trigger time: ${scheduledRefreshTime.toLocaleTimeString()}`);
    console.log(`   2. POST request sent to /Authentication/refresh-token`);
    console.log(`   3. Request includes current access token in body`);
    console.log(`   4. Request includes refresh token (in HttpOnly cookie)`);
    console.log(`   5. Backend validates both tokens`);
    console.log(`   6. Backend returns new access token`);
    console.log(`   7. New token saved to memory + sessionStorage`);
    console.log(`   8. New refresh timer scheduled (12 min from token issue)`);
    console.log(`   9. User stays logged in ✅`);
    
    console.log(`\n⏱️ COUNTDOWN:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   At ${scheduledRefreshTime.toLocaleTimeString()}, timer will trigger refresh`);
    console.log(`   Waiting... ${minutesUntilRefresh}m ${secondsUntilRefresh}s`);
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    // Set the timer
    refreshTokenTimer = window.setTimeout(async () => {
      const fireTime = new Date();
      
      logTimerEvent('🔔 TIMER FIRED - Refresh scheduled now executing', {
        firedAt: fireTime.toLocaleString(),
        reason: 'Proactive refresh 3 minutes before token expiry'
      });
      
      console.log('\n\n════════════════════════════════════════════════════════════════════════════════');
      console.log('⏰ TIMER FIRED - REFRESH TRIGGERED');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      console.log(`🔔 Fired at: ${fireTime.toLocaleTimeString()}`);
      console.log(`📅 Full timestamp: ${fireTime.toLocaleString()}`);
      console.log(`\n📋 WHY IT FIRED:`);
      console.log('═══════════════════════════════════════════');
      console.log(`   • Proactive token refresh`);
      console.log(`   • Triggered 3 minutes before token expiry`);
      console.log(`   • This ensures token never expires in production use`);
      console.log(`\n📋 ACTION:`);
      console.log('═══════════════════════════════════════════');
      console.log(`   NOW calling: refreshAccessToken()`);
      console.log(`   This will make the API call to /Authentication/refresh-token`);
      console.log('════════════════════════════════════════════════════════════════════════════════\n');
      
      const success = await refreshAccessToken();
      
      if (!success) {
        console.error('\n❌════════════════════════════════════════════════════════════════════════════════');
        console.error('❌ REFRESH API CALL FAILED - AUTO LOGOUT TRIGGERED');
        console.error('❌════════════════════════════════════════════════════════════════════════════════');
        console.error(`\n   Reason: refreshAccessToken() returned false`);
        console.error(`   This means:`);
        console.error(`   1. API call failed or returned error status`);
        console.error(`   2. Response didn't have new access token`);
        console.error(`   3. Refresh token may have expired`);
        console.error(`\n   Action: User will be logged out automatically`);
        console.error('❌════════════════════════════════════════════════════════════════════════════════\n');
        showSessionExpiredPopup();
        handleLogout();
      }
    }, refreshTime);
    
  } catch (error) {
    console.error('❌ Failed to start refresh timer:', error);
  }
};

// ============================================
// ⏱️ INACTIVITY MONITORING
// ============================================

/**
 * Start inactivity timer
 * Checks every minute if user has been inactive for too long
 * ⭐ LOGS ALL INACTIVITY CHECKS TO PERSISTENT STORAGE
 */
const startInactivityTimer = (): void => {
  // 🧪 TEST MODE: Skip inactivity checks
  if (TEST_MODE_DISABLE_INACTIVITY) {
    console.log('🧪 TEST MODE: Inactivity timeout DISABLED - focus on token refresh testing');
    logInactivityEvent('TEST_MODE: Inactivity checks DISABLED');
    return;
  }
  
  // Clear existing timer
  if (inactivityTimer) {
    clearInterval(inactivityTimer);
  }
  
  const timeoutStr = getSessionMetadata(STORAGE_KEYS.INACTIVITY_TIMEOUT_LS);
  const timeoutMinutes = parseInt(timeoutStr || '30');
  
  logInactivityEvent(`Inactivity timer started - will check every 60 seconds for ${timeoutMinutes} minutes idle time`);
  console.log(`⏱️ Inactivity Timer Setup: Will timeout after ${timeoutMinutes} minutes of no activity`);
  
  let checkCount = 0;
  
  // Check every minute
  inactivityTimer = window.setInterval(() => {
    checkCount++;
    const now = new Date();
    
    if (isInactive()) {
      const inactiveMinutes = getInactiveMinutes();
      const logMsg = `⏱️ INACTIVITY DETECTED - User inactive for ${inactiveMinutes}m (timeout is ${timeoutMinutes}m)`;
      
      console.error(logMsg);
      logInactivityEvent(`User INACTIVE - ${inactiveMinutes}/${timeoutMinutes}m`, {
        checkNumber: checkCount,
        inactiveMinutes,
        timeoutMinutes,
        timestamp: now.toLocaleString()
      });
      
      console.log('⏱️ Showing inactivity popup and logging out...');
      logInactivityEvent('Inactivity popup triggered - calling handleLogout');
      
      showInactivityPopup();
      handleLogout();
    } else {
      const inactiveMinutes = getInactiveMinutes();
      // Only log every 3-5 checks to avoid spam (every 3-5 minutes)
      if (checkCount % 5 === 0) {
        logInactivityEvent(`Inactivity check #${checkCount} - User ACTIVE (${inactiveMinutes}m idle)`, {
          checkNumber: checkCount
        });
      }
    }
  }, 60 * 1000); // Check every minute
};

/**
 * Activity tracking with debounce (avoid excessive logging)
 */
let lastActivityLogTime = 0;
const ACTIVITY_LOG_INTERVAL = 30000; // Log activity max once per 30 seconds

const debouncedUpdateActivity = (): void => {
  const now = Date.now();
  if (now - lastActivityLogTime >= ACTIVITY_LOG_INTERVAL) {
    updateLastActivity();
    lastActivityLogTime = now;
  } else {
    // Still update the timestamp, just don't log
    const now2 = Date.now();
    saveSessionMetadata(STORAGE_KEYS.LAST_ACTIVITY_SS, now2.toString());
  }
};

/**
 * Initialize activity listeners to track user interaction
 * Uses bubble phase (false) to avoid interference with React event system
 */
export const initActivityListeners = (): void => {
  // Use bubble phase instead of capture for better compatibility with React
  const events = ['click', 'keypress', 'scroll', 'touchstart'];
  
  // Try to attach to document with error handling
  try {
    events.forEach(event => {
      document.addEventListener(event, debouncedUpdateActivity, false);
    });
    console.log('👂 Activity listeners initialized (bubble phase)');
  } catch (error) {
    console.error('❌ Failed to initialize activity listeners:', error);
  }
};

/**
 * Remove activity listeners
 */
export const removeActivityListeners = (): void => {
  const events = ['click', 'keypress', 'scroll', 'touchstart'];
  
  try {
    events.forEach(event => {
      document.removeEventListener(event, debouncedUpdateActivity, false);
    });
  } catch (error) {
    console.error('Error removing activity listeners:', error);
  }
  
  console.log('🔇 Activity listeners removed');
};

// ============================================
// ⏰ SESSION EXPIRY MONITORING
// ============================================

/**
 * Start session expiry timer (max session duration)
 */
const startSessionExpiryTimer = (refreshTokenExpiresAt: string): void => {
  // 🧪 TEST MODE: Skip session expiry warnings
  if (TEST_MODE_DISABLE_SESSION_EXPIRY) {
    console.log('🧪 TEST MODE: Session expiry warnings DISABLED - focus on token refresh testing');
    return;
  }
  
  // Clear existing timer
  if (sessionExpiryTimer) {
    clearTimeout(sessionExpiryTimer);
  }
  
  try {
    const expiryTime = new Date(refreshTokenExpiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // Show warning 10 minutes before expiry
    const warningTime = Math.max(0, timeUntilExpiry - (10 * 60 * 1000));
    
    sessionExpiryTimer = window.setTimeout(() => {
      showSessionExpiringPopup();
    }, warningTime);
    
    console.log(`⏰ Max session duration: ${Math.floor(timeUntilExpiry / 1000 / 60 / 60)} hours`);
  } catch (error) {
    console.error('❌ Failed to start session expiry timer:', error);
  }
};

// ============================================
// 🔔 USER-FRIENDLY POPUPS
// ============================================

/**
 * Show session expired popup
 */
const showSessionExpiredPopup = (): void => {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; padding: 30px 40px; border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: 999999; text-align: center; min-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  popup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 15px;">⏰</div>
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Session Expired</div>
    <div style="font-size: 16px; opacity: 0.9; margin-bottom: 20px;">Your session has expired. Please login again to continue.</div>
    <button onclick="window.location.href='/'" style="
      background: white; color: #667eea; border: none; padding: 12px 30px;
      border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer;
      transition: transform 0.2s;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      Login Again
    </button>
  `;
  document.body.appendChild(popup);
  
  // Remove after 5 seconds and redirect
  setTimeout(() => {
    popup.remove();
    window.location.href = '/';
  }, 5000);
};

/**
 * Show inactivity popup
 */
const showInactivityPopup = (): void => {
  const timeoutStr = getSessionMetadata(STORAGE_KEYS.INACTIVITY_TIMEOUT_LS);
  const timeoutMinutes = parseInt(timeoutStr || '30');
  
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white; padding: 30px 40px; border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: 999999; text-align: center; min-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  popup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 15px;">😴</div>
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Inactive Session</div>
    <div style="font-size: 16px; opacity: 0.9; margin-bottom: 20px;">You've been inactive for ${timeoutMinutes} minutes. Please login again.</div>
    <button onclick="window.location.href='/'" style="
      background: white; color: #f5576c; border: none; padding: 12px 30px;
      border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer;
      transition: transform 0.2s;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      Login Again
    </button>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.remove();
    window.location.href = '/';
  }, 5000);
};

/**
 * Show session expiring soon popup (10 min warning)
 */
const showSessionExpiringPopup = (): void => {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%);
    color: white; padding: 20px 30px; border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 999999; min-width: 350px;
    animation: slideInRight 0.3s ease-out;
  `;
  popup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <div style="font-size: 32px;">⚠️</div>
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">Session Expiring Soon</div>
        <div style="font-size: 14px; opacity: 0.9;">Your session will expire in 10 minutes. Please save your work.</div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.remove();
  }, 8000);
};

/**
 * Show login success popup
 */
export const showLoginSuccessPopup = (username: string): void => {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: white; padding: 20px 30px; border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 999999; min-width: 300px;
    animation: slideInRight 0.3s ease-out;
  `;
  popup.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <div style="font-size: 32px;">🎉</div>
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">Welcome Back!</div>
        <div style="font-size: 14px; opacity: 0.9;">Successfully logged in as ${username}</div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.remove();
  }, 4000);
};

// ============================================
// 🔓 AUTHENTICATION ACTIONS
// ============================================

/**
 * Register new user
 */
export const registerUser = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  return await request<AuthResponse>(`${AUTH_BASE_URL}/registerUser`, {
    method: 'POST',
    body: JSON.stringify(registerData)
  });
};

/**
 * Login user
 */
export const loginUser = async (loginData: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('📤 Login Payload:', loginData);
    const response = await request<LoginResponse>(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(loginData)
    });
    
    console.log('🎉 Login successful!');
    console.log('📦 Backend Response:', response);
    console.log('════════════════════════════════════════');
    console.log('Access Token expires:', response.accessTokenExpiresAt);
    console.log('Refresh Token expires:', response.refreshTokenExpiresAt);
    console.log('Username:', response.username);
    console.log('User ID:', response.userId);
    console.log('Access Rights:', response.access);
    console.log('════════════════════════════════════════');
    
    // Save tokens and start session management
    saveAuthToken(response);
    
    // Initialize activity tracking
    initActivityListeners();
    
    // Show success popup
    showLoginSuccessPopup(response.username);
    
    return response;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  console.warn('🚨🚨🚨 LOGOUT FUNCTION CALLED - STACK TRACE BELOW 🚨🚨🚨');
  console.trace('👆 Check the stack trace above to see WHO called logout');
  console.warn('⏰ Logout Time:', new Date().toISOString());
  
  try {
    // Call backend logout endpoint
    await request(`${AUTH_BASE_URL}/logout`, {
      method: 'POST'
    });
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
  } finally {
    handleLogout();
  }
};

/**
 * Handle logout (clear session and cleanup)
 * Uses hybrid storage clearance for complete session termination
 * IMPORTANT: Prints all debug logs before clearing to preserve diagnosis info
 */
const handleLogout = (): void => {
  // ⭐ CRITICAL: Print all debug logs BEFORE logout clears everything
  console.log('\n\n🔵 ════════════════════════════════════════════════════════════════');
  console.log('🔵 LOGOUT INITIATED - PRINTING DEBUG LOGS BEFORE CLEAR');
  console.log('🔵 ════════════════════════════════════════════════════════════════\n');
  
  try {
    printDebugLogs();
    const exportedLogs = exportDebugLogs();
    console.log('\n📋 EXPORTED LOGS (for copy/paste to analysis):');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(exportedLogs);
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('⚠️ Failed to print debug logs:', error);
  }
  
  logLogoutEvent('Session terminated - printing full debug logs');
  
  // Clear all timers
  if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
  if (inactivityTimer) clearInterval(inactivityTimer);
  if (sessionExpiryTimer) clearTimeout(sessionExpiryTimer);
  stopTokenRefreshHeartbeat(); // Stop heartbeat on logout
  
  // Remove activity listeners
  removeActivityListeners();
  
  // Clear all tokens and session data using hybrid storage manager
  // This ensures cleanup across: memory, sessionStorage, localStorage, and HttpOnly cookies
  clearAllTokens();
  
  console.log('🔓 Complete logout - All tokens cleared from memory, sessionStorage, and localStorage');
  console.log('🔐 Refresh token in HttpOnly cookie will be invalidated by server on next request');
  console.log('\n🔵 ════════════════════════════════════════════════════════════════\n');
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string): Promise<AuthResponse> => {
  return await request<AuthResponse>(`${AUTH_BASE_URL}/by-username/${username}`);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return token !== null && token !== '';
};

/**
 * Debug function to check authentication state
 */
export const debugAuthState = (): void => {
  console.log('🔍 Authentication Debug Info:');
  console.log('════════════════════════════════════════');
  
  const token = getAccessToken();
  const userData = getUserData();
  const userAccess = getUserAccess();
  const selectedAccess = getSelectedAccess();
  const sessionId = getSessionMetadata(STORAGE_KEYS.SESSION_ID_SS);
  
  console.log('Access Token:', token ? `${token.substring(0, 30)}... (${token.length} chars)` : '❌ MISSING');
  console.log('Refresh Token:', '🔒 HttpOnly Cookie (Cannot access from JavaScript - handled by browser)');
  console.log('User Data:', userData || '❌ MISSING');
  console.log('User Access:', userAccess || '❌ MISSING');
  console.log('Selected Access:', selectedAccess || '❌ MISSING');
  console.log('Session ID:', sessionId || '❌ MISSING');
  console.log('════════════════════════════════════════');
  
  if (!token) {
    console.error('❌ NO TOKEN - You need to login!');
    console.log('💡 Tip: Open login page and enter credentials');
  }
};

/**
 * Handle tab focus to restart token refresh timer if needed
 * Ensures token is always refreshed even if browser tab loses focus
 */
export const handleTabFocus = (): void => {
  console.log('👁️ TAB FOCUSED - Checking token refresh status...');
  
  try {
    const expiryStr = getTokenExpiry();
    if (!expiryStr) {
      console.warn('⚠️ No token expiry found. User may need to re-login.');
      return;
    }

    const expiryTime = new Date(expiryStr).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    // If token has less than 1 minute left, refresh immediately
    if (timeUntilExpiry < 60000) {
      console.warn('⚠️ Token expires very soon. Refreshing immediately...');
      refreshAccessToken();
      return;
    }

    // If token is already expired, trigger logout
    if (timeUntilExpiry <= 0) {
      console.error('❌ Token has expired. Logging out...');
      showSessionExpiredPopup();
      handleLogout();
      return;
    }

    // Token is still valid, but make sure refresh timer is running
    if (!refreshTokenTimer) {
      console.log('🔄 Refresh timer was not running. Restarting...');
      startTokenRefreshTimer();
    } else {
      console.log('✅ Refresh timer is still running. Token safe.');
    }
  } catch (error) {
    console.error('❌ Error handling tab focus:', error);
  }
};

/**
 * Heartbeat mechanism to ensure token refresh timer is always running
 * Runs every 30 seconds to check and restart timer if needed
 */
let tokenRefreshHeartbeatTimer: number | null = null;

export const startTokenRefreshHeartbeat = (): void => {
  if (tokenRefreshHeartbeatTimer) {
    clearInterval(tokenRefreshHeartbeatTimer);
  }

  console.log('💓 Starting token refresh heartbeat (checks every 15 seconds)');
  console.log('   This ensures token is refreshed even if browser tab loses focus');

  // Check more frequently for short-lived tokens (15 mins)
  tokenRefreshHeartbeatTimer = window.setInterval(() => {
    try {
      const expiryStr = getTokenExpiry();
      if (!expiryStr) {
        console.warn('⚠️ [Heartbeat] No token expiry found');
        return;
      }

      const expiryTime = new Date(expiryStr).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // If token is already expired, trigger immediate logout
      if (timeUntilExpiry <= 0) {
        console.error('🚨 [Heartbeat] TOKEN HAS EXPIRED! Logging out immediately...');
        showSessionExpiredPopup();
        handleLogout();
        return;
      }

      // If less than 3.5 minutes until expiry and refresh timer not running, refresh NOW
      if (timeUntilExpiry < 3.5 * 60 * 1000 && !refreshTokenTimer) {
        console.warn(`⚠️ [Heartbeat] Token expires in ${Math.floor(timeUntilExpiry / 1000 / 60)}m and no refresh timer! Refreshing NOW...`);
        refreshAccessToken();
        return;
      }

      // If refresh timer is not set but token still valid, restart it
      if (!refreshTokenTimer && timeUntilExpiry > 60000) {
        console.warn(`⚠️ [Heartbeat] Refresh timer not running but token valid (${Math.floor(timeUntilExpiry / 1000 / 60)}m left). Restarting...`);
        startTokenRefreshTimer();
        return;
      }

      // Log heartbeat status periodically (every 2 minutes)
      const minutesLeft = Math.floor(timeUntilExpiry / 1000 / 60);
      if (minutesLeft > 0 && timeUntilExpiry % 120000 < 15000) { // Log every 2 minutes
        console.log(`💓 [Heartbeat OK] Token valid for ${minutesLeft}m ${Math.floor((timeUntilExpiry % 60000) / 1000)}s`);
      }
    } catch (error) {
      console.error('❌ [Heartbeat] error:', error);
    }
  }, 15 * 1000); // Check every 15 seconds (was 30 seconds)
};

/**
 * Stop the token refresh heartbeat
 */
export const stopTokenRefreshHeartbeat = (): void => {
  if (tokenRefreshHeartbeatTimer) {
    clearInterval(tokenRefreshHeartbeatTimer);
    tokenRefreshHeartbeatTimer = null;
    console.log('💓 Token refresh heartbeat stopped');
  }
};

/**
 * Initialize tab focus listener
 * Ensures token refresh continues even if tab loses focus
 */
export const initializeTabFocusListener = (): (() => void) => {
  const handleFocus = () => handleTabFocus();
  
  window.addEventListener('focus', handleFocus);
  console.log('📱 Tab focus listener initialized - Token refresh will resume when tab regains focus');
  
  // Return cleanup function
  return () => {
    window.removeEventListener('focus', handleFocus);
    console.log('📱 Tab focus listener removed');
  };
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -60%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

// Expose debug function to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
  console.log('💡 Tip: Type debugAuth() in console to check authentication state');
}
