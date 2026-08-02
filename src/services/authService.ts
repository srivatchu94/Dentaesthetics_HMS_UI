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
  exportDebugLogs,
  getStoredLogs
} from '../utils/persistentDebugLogger';
import { sessionDebugLogger } from '../utils/sessionDebugLogger';
import { API_BASE_URL } from '../config/apiConfig';
import { azureTokenRefreshManager, sessionSyncManager, printTokenRefreshDiagnostics } from './azureTokenRefreshManager';

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

// 🔒 CRITICAL FLAG: Prevent apiClient from logging out while refresh is in progress
let isTokenRefreshInProgress = false;

// Helper to check if refresh is in progress
export const isRefreshInProgress = (): boolean => {
  return isTokenRefreshInProgress;
};

// ⏰ TIMERS - Kept minimal for clean session management
// Only 3 essential timers:
// 1. refreshTokenTimer - Refreshes token at 13-minute mark
// 2. inactivityTimer - Logs out after 1 hour of inactivity
// 3. sessionExpiryTimer - Logs out after max session duration (8 hours)
let refreshTokenTimer: number | null = null;
let inactivityTimer: number | null = null;
let sessionExpiryTimer: number | null = null;

// ⚙️ DEBUG/TEST MODE - PRODUCTION SHOULD ALWAYS HAVE THESE FALSE
// 🚨 CRITICAL: These must be FALSE in production to enable proper session management
const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
const TEST_MODE_DISABLE_INACTIVITY = !isProduction ? false : false; // ❌ ALWAYS FALSE in production
const TEST_MODE_DISABLE_SESSION_EXPIRY = !isProduction ? false : false; // ❌ ALWAYS FALSE in production

// ⚙️ TEST MODE - REFRESH TIMING
const TEST_MODE_FAST_REFRESH = !isProduction ? false : false; // ❌ ALWAYS FALSE in production
const TEST_REFRESH_DELAY_SECONDS = 120; // 2 minutes for testing (normally would be ~12 min)



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
// 🛡️ GUARD: Prevent duplicate token saves during a single login
let lastSaveTimestamp: number = 0;
const MIN_SAVE_INTERVAL = 1000; // At least 1 second between saves

export const saveAuthToken = (loginResponse: LoginResponse): void => {
  try {
    const now = Date.now();
    if (now - lastSaveTimestamp < MIN_SAVE_INTERVAL) {
      console.warn('⚠️ DUPLICATE SAVE PREVENTED: saveAuthToken called too quickly (< 1 second)');
      return;
    }
    lastSaveTimestamp = now;
    
    const { accessToken, refreshToken, username, userId, access, accessTokenExpiresAt, refreshTokenExpiresAt, inactivityTimeoutMinutes, maxSessionDurationHours } = loginResponse;
    
    console.log('\n🔐 ==================== SAVING AUTHENTICATION TOKENS ====================');
    console.log('📋 STEP 0: VALIDATING CRITICAL DATA BEFORE SAVE');
    
    // 🛡️ CRITICAL VALIDATION: Check all required fields
    const validationErrors: string[] = [];
    if (!accessToken) validationErrors.push('accessToken is missing or empty');
    if (!refreshToken) validationErrors.push('refreshToken is missing or empty');
    if (!username) validationErrors.push('username is missing or empty');
    if (!userId || userId === '' || userId === '0') validationErrors.push(`userId is invalid (received: "${userId}")`);
    if (!access || access.length === 0) validationErrors.push('access array is empty - user has no roles');
    if (!accessTokenExpiresAt) validationErrors.push('accessTokenExpiresAt is missing');
    
    if (validationErrors.length > 0) {
      console.error('❌ VALIDATION FAILED - Cannot save incomplete auth data:');
      validationErrors.forEach((err, i) => {
        console.error(`   ${i + 1}. ${err}`);
      });
      console.error('\n🚫 LOGIN WILL FAIL - Incomplete response from server');
      throw new Error(`Invalid login response: ${validationErrors.join(', ')}`);
    }
    
    console.log('✅ All critical data validated successfully');
    console.log('📋 STEP 1: Validating Login Response');
    console.log('   Response Keys:', Object.keys(loginResponse));
    console.log(`   ✓ accessToken: ${accessToken ? 'YES (' + accessToken.substring(0, 20) + '...)' : 'MISSING ❌'}`);
    console.log(`   ✓ refreshToken: ${refreshToken ? 'YES' : 'MISSING ❌'}`);
    console.log(`   ✓ username: ${username || 'MISSING ❌'}`);
    console.log(`   ✓ userId: ${userId || 'MISSING ❌'} (VALIDATED: NOT EMPTY)`);
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
    // 🛡️ VALIDATE userId is NOT empty before saving
    const userIdToSave = userId && userId !== '' && userId !== '0' ? userId : null;
    if (!userIdToSave) {
      throw new Error('Cannot save user data: userId is empty or invalid after validation');
    }
    saveUserData({ username, userId: userIdToSave });
    
    // Verify user data was saved
    const savedUserData = localStorage.getItem('userData');
    console.log(`   ✓ userData saved: ${savedUserData ? 'YES' : 'MISSING ❌'}`);
    if (savedUserData) {
      const parsedData = JSON.parse(savedUserData);
      console.log(`      Content: ${savedUserData}`);
      console.log(`      userId verification: ${parsedData.userId ? '✅ PRESENT' : '❌ EMPTY - CRITICAL ERROR'}`);
      if (!parsedData.userId) {
        throw new Error('userId was saved as empty - data integrity check failed');
      }
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
    console.log(`   ✓ Inactivity timeout: ${inactivityTimeoutMinutes || 60} minutes`);
    console.log(`   ✓ Max session duration: ${maxSessionDurationHours || 8} hours`);
    
    // Final verification
    console.log('\n📋 STEP 8: Final Storage Verification');
    console.log('   localStorage keys:', Array.from({length: localStorage.length}, (_, i) => localStorage.key(i)));
    console.log('   sessionStorage keys:', Array.from({length: sessionStorage.length}, (_, i) => sessionStorage.key(i)));
    
    console.log('\n✅ SESSION STARTED SUCCESSFULLY (HYBRID STORAGE)');
    console.log('🧠 Access Token: Memory + SessionStorage (XSS protected)');
    console.log('🍪 Refresh Token: HttpOnly Cookie (Backend managed)');
    console.log('💾 User Data: localStorage (non-sensitive)');
    console.log('🔐 ======================================================================\n');
    
    // ⭐ SESSION DEBUG LOGGER - Log successful token save
    sessionDebugLogger.logTokenSaved('BOTH', 'BOTH', accessTokenExpiresAt);
    sessionDebugLogger.logUserDataSaved({ username, userId });
    sessionDebugLogger.logSessionInitialized(access, getSelectedAccess());
    
    // Start timers - UNIFIED MECHANISM ONLY
    // ✨ Single refresh timer at 13-minute mark for seamless session expansion
    startTokenRefreshTimer();
    
    // Session inactivity timeout (30 minutes default)
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
 * NOTE: Silent method - no logging to avoid spam in background timers
 */
export const getAuthToken = (): string | null => {
  return getAccessToken();
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
 * ✨ UNIFIED REFRESH MECHANISM - SINGLE SOURCE OF TRUTH
 * 
 * This function CONSOLIDATES ALL refresh logic into ONE reliable mechanism.
 * Instead of multiple timers/pointers fighting each other, we use the 
 * proven `manualRefreshToken()` function for BOTH manual and automatic refresh.
 * 
 * This ensures:
 * - ✅ Refresh token ALWAYS included in request body
 * - ✅ Consistent error handling
 * - ✅ No race conditions
 * - ✅ Works every time (like manual refresh does)
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  isTokenRefreshInProgress = true;
  
  try {
    console.log('\n🔄 AUTOMATIC TOKEN REFRESH (Using Unified Mechanism)');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`⏰ Timestamp: ${new Date().toLocaleTimeString()}`);
    
    // ✨ SESSION DEBUG LOGGER - Log refresh attempt
    sessionDebugLogger.addLog('TOKEN_REFRESH_ATTEMPT', 'INFO', 'Attempting to refresh access token', {
      timestamp: new Date().toLocaleString(),
      mechanism: 'Unified Mechanism'
    });
    
    // ✅ Use the same proven mechanism as manual refresh
    const result = await manualRefreshToken();
    
    console.log('\n✅ REFRESH COMPLETED');
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Message: ${result.message}`);
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // ✨ SESSION DEBUG LOGGER - Log refresh result
    sessionDebugLogger.logTokenRefresh(result.success, result.message);
    
    return result.success;
  } catch (error) {
    console.error('\n❌ REFRESH FAILED (Unified Mechanism)');
    console.error(`   Error: ${(error as Error).message}`);
    console.error('═══════════════════════════════════════════════════════════════════\n');
    
    // ✨ SESSION DEBUG LOGGER - Log refresh error
    sessionDebugLogger.logError('TOKEN_REFRESH', error as Error);
    sessionDebugLogger.logTokenRefresh(false, (error as Error).message);
    
    logTokenRefreshEvent('REFRESH FAILED - Exception caught', {
      timestamp: new Date().toLocaleString(),
      errorName: (error as Error).name,
      errorMessage: (error as Error).message
    });
    
    return false;
  } finally {
    isTokenRefreshInProgress = false;
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
    console.log('⏰ SETTING UP UNIFIED TOKEN REFRESH TIMER (13-MINUTE BUFFER)');
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
    
    // ✨ NEW UNIFIED LOGIC: Refresh at 13 minutes before expiry
    // This creates a seamless session expansion with 2-minute buffer before actual expiry
    const refreshBuffer = 13 * 60 * 1000; // 13 minutes = 780000 ms
    const refreshTime = Math.max(0, timeUntilExpiry - refreshBuffer);
    
    const minutesUntilRefresh = Math.floor(refreshTime / 1000 / 60);
    const secondsUntilRefresh = Math.floor((refreshTime % 60000) / 1000);
    const scheduledRefreshTime = new Date(now + refreshTime);
    
    console.log(`\n📋 REFRESH TIMER SCHEDULE (UNIFIED MECHANISM):`);
    console.log('═══════════════════════════════════════════');
    console.log(`   ✨ Refresh Strategy: 13-Minute Buffer`);
    console.log(`   🔄 Mechanism: Unified Token Refresh (manualRefreshToken)`);
    console.log(`   Timeline:`);
    console.log(`      - Token issues at: NOW`);
    console.log(`      - Token expires at: +15 minutes`);
    console.log(`      - Refresh triggers at: +2 minutes (13 min before expiry)`);
    console.log(`      - Session seamlessly expands: User never experiences interruption ✅`);
    console.log(`   Will refresh in: ${minutesUntilRefresh}m ${secondsUntilRefresh}s`);
    console.log(`   Scheduled refresh at: ${scheduledRefreshTime.toLocaleTimeString()}`);
    console.log(`   (${minutesUntilRefresh * 60 + secondsUntilRefresh} seconds from now)`);
    
    console.log(`\n📋 UNIFIED REFRESH MECHANISM DETAILS:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   Endpoint: /Authentication/refresh-token`);
    console.log(`   Method: POST`);
    console.log(`   Function: refreshAccessToken() → manualRefreshToken()`);
    console.log(`   Includes: Refresh token in request body`);
    console.log(`   Credentials: HttpOnly cookie + sessionStorage token`);
    
    console.log(`\n📋 WHAT HAPPENS WHEN TIMER FIRES AT 13-MINUTE MARK:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   1. ⏰ Trigger time: ${scheduledRefreshTime.toLocaleTimeString()} (13 min before expiry)`);
    console.log(`   2. 🔄 Call unified refresh: manualRefreshToken()`);
    console.log(`   3. 📨 Request includes refresh token from sessionStorage`);
    console.log(`   4. ✅ Backend validates and returns new access token`);
    console.log(`   5. 💾 New token saved to memory + sessionStorage`);
    console.log(`   6. ⏰ New timer scheduled for next 13-minute window`);
    console.log(`   7. 👤 User session seamlessly expanded without interruption`);
    console.log(`   8. ✨ RESULT: Continuous, uninterrupted session ✅`);
    
    console.log(`\n⏱️ COUNTDOWN TO REFRESH:`);
    console.log('═══════════════════════════════════════════');
    console.log(`   Next refresh: ${scheduledRefreshTime.toLocaleTimeString()}`);
    console.log(`   Time until refresh: ${minutesUntilRefresh}m ${secondsUntilRefresh}s`);
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    // Set the single unified timer
    refreshTokenTimer = window.setTimeout(async () => {
      const fireTime = new Date();
      
      logTimerEvent('🔔 TIMER FIRED - Unified refresh at 13-minute mark', {
        firedAt: fireTime.toLocaleString(),
        reason: 'Seamless session expansion - Proactive refresh 13 minutes before token expiry',
        mechanism: 'Unified (manualRefreshToken)'
      });
      
      console.log('\n\n════════════════════════════════════════════════════════════════════════════════');
      console.log('🔔 🔔 🔔  ⏰ UNIFIED TIMER FIRED - TOKEN REFRESH TRIGGERED  🔔 🔔 🔔');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      console.log(`🔔 Fired at: ${fireTime.toLocaleTimeString()}`);
      console.log(`📅 Full timestamp: ${fireTime.toLocaleString()}`);
      console.log(`\n📋 WHY IT FIRED:`);
      console.log('═══════════════════════════════════════════');
      console.log(`   • ✨ Unified token refresh mechanism`);
      console.log(`   • 🔄 Using proven manualRefreshToken() function`);
      console.log(`   • ⏰ Triggered 13 minutes before token expiry`);
      console.log(`   • 🎯 Seamless session expansion with 2-minute buffer`);
      
      console.log(`\n🌐 API ENDPOINT:`);
      console.log('═══════════════════════════════════════════');
      console.log(`   URL: /Authentication/refresh-token`);
      console.log(`   Method: POST`);
      console.log(`   Function: manualRefreshToken()`);
      console.log(`   Status: Using UNIFIED mechanism`);
      
      console.log(`\n📋 ACTION - UNIFIED REFRESH STARTING:`);
      console.log('═══════════════════════════════════════════');
      console.log(`   🔒 Setting isTokenRefreshInProgress = true`);
      console.log(`   ✅ Calling refreshAccessToken()`);
      console.log(`   → Which calls: manualRefreshToken()`);
      console.log(`   📨 Including refresh token in request body`);
      console.log(`   ⏳ Awaiting response from backend`);
      console.log(`   ✅ Updating token storage`);
      console.log(`   🔓 Clear isTokenRefreshInProgress flag`);
      console.log('════════════════════════════════════════════════════════════════════════════════\n');
      
      // Clear the timer ref now that it has fired — before the async refresh
      refreshTokenTimer = null;

      const success = await refreshAccessToken();

      if (!success) {
        // Check whether the token is still valid before deciding to logout.
        // A transient network error ("Failed to fetch") should NOT cause logout
        // if the token hasn't actually expired yet.
        const currentExpiry = getTokenExpiry();
        const tokenStillValid = currentExpiry && new Date(currentExpiry).getTime() > Date.now() + 30_000;

        if (tokenStillValid) {
          console.warn('⚠️ Token refresh failed but token is still valid — retrying in 60s (transient network error).');
          window.setTimeout(() => startTokenRefreshTimer(), 60_000);
        } else {
          console.error('❌ Token refresh failed and token has expired — logging out.');
          showSessionExpiredPopup();
          // Call handleLogout and wait for logs to download before redirect happens
          handleLogout().catch(err => console.error('❌ Logout error:', err));
        }
      } else {
        console.log('\n\n✅════════════════════════════════════════════════════════════════════════════════');
        console.log('✅ UNIFIED TOKEN REFRESH SUCCESSFUL - SESSION SEAMLESSLY EXTENDED');
        console.log('✅════════════════════════════════════════════════════════════════════════════════');
        console.log(`   ✓ New access token received from manualRefreshToken()`);
        console.log(`   ✓ Token stored in memory and sessionStorage`);
        console.log(`   ✓ Next refresh timer scheduled (another 13-minute window)`);
        console.log(`   ✓ User session expanded for another 15 minutes`);
        console.log(`   ✓ Seamless experience - no interruption ✨`);
        console.log('✅════════════════════════════════════════════════════════════════════════════════\n');
        
        // Restart timer for next refresh window
        startTokenRefreshTimer();
      }
    }, refreshTime);
    
  } catch (error) {
    console.error('❌ Failed to start refresh timer:', error);
  }
};

/**
 * 🔄 CONTINUOUS POLLING - New Primary Mechanism
 * Refreshes token every 60 seconds (user requirement: "every minute")
 * This is more reliable than a single timer and ensures session never expires
 */
// ============================================
// ⏱️ INACTIVITY MONITORING
// ============================================

/**
 * Start inactivity timer
 * Checks every minute if user has been inactive for too long (default: 1 hour)
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
  const timeoutMinutes = parseInt(timeoutStr || '60'); // 1 hour default inactivity timeout
  
  logInactivityEvent(`Inactivity timer started - will check every 60 seconds for ${timeoutMinutes} minutes idle time`);
  console.log(`⏱️ Inactivity Timer Setup: Will timeout after ${timeoutMinutes} minutes of no activity`);
  
  let checkCount = 0;
  
  // Check every minute
  inactivityTimer = window.setInterval(() => {
    // 🛡️ SAFETY: If no token exists, don't check inactivity - user already logged out
    if (!getAccessToken()) {
      return;
    }
    
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
      // Call handleLogout and AWAIT it fully before any redirect
      // This BLOCKS the setInterval until logout completes
      handleLogout().catch(err => console.error('❌ Logout error:', err));
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
 * Show session expired popup with log download before redirect
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
  popup.id = 'session-expired-popup';
  
  // CRITICAL: Don't redirect immediately - wait for handleLogout to complete
  popup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 15px;">⏰</div>
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Session Expired</div>
    <div style="font-size: 16px; opacity: 0.9; margin-bottom: 20px;">Downloading logs... Please wait.</div>
    <div style="font-size: 14px; opacity: 0.8; margin-top: 15px;">
      <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      Saving session data...
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;
  document.body.appendChild(popup);
};

/**
 * Close session expired popup and redirect after logs downloaded
 */
const closeSessionExpiredPopupAndRedirect = async (): Promise<void> => {
  const popup = document.getElementById('session-expired-popup');
  if (popup) {
    popup.remove();
  }
  // Small delay to ensure UI updates before redirect
  await new Promise(resolve => setTimeout(resolve, 500));
  window.location.href = '/';
};

/**
 * Show inactivity popup with log download before redirect
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
  popup.id = 'inactivity-popup';
  
  // CRITICAL: Don't redirect immediately - wait for handleLogout to complete
  popup.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 15px;">😴</div>
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Inactive Session</div>
    <div style="font-size: 16px; opacity: 0.9; margin-bottom: 20px;">Inactive for ${timeoutMinutes} minutes. Downloading logs...</div>
    <div style="font-size: 14px; opacity: 0.8; margin-top: 15px;">
      <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      Saving session data...
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;
  document.body.appendChild(popup);
};

/**
 * Close inactivity popup and redirect after logs downloaded
 */
const closeInactivityPopupAndRedirect = async (): Promise<void> => {
  const popup = document.getElementById('inactivity-popup');
  if (popup) {
    popup.remove();
  }
  // Small delay to ensure UI updates before redirect
  await new Promise(resolve => setTimeout(resolve, 500));
  window.location.href = '/';
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
    
    // 🧪 Add global commands for debugging
    (window as any).viewDebugLogs = () => {
      console.clear();
      console.log('🔍 RETRIEVING STORED DEBUG LOGS...\n');
      printDebugLogs();
      const exported = exportDebugLogs();
      console.log('\n📋 COPYABLE LOG EXPORT:\n');
      console.log(exported);
      return exported;
    };
    
    // 🧪 Add manual refresh trigger for testing
    (window as any).triggerRefresh = () => {
      console.log('\n\n🔥 MANUAL REFRESH TRIGGERED FROM CONSOLE\n');
      logTokenRefreshEvent('MANUAL REFRESH TRIGGERED FROM CONSOLE');
      return refreshAccessToken();
    };
    
    // 🧪 Add immediate test - refresh in 2 minutes for testing
    if (TEST_MODE_FAST_REFRESH) {
      (window as any).getRefreshStatus = () => {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const expiry = getTokenExpiry();
        console.log('\n📊 REFRESH STATUS:');
        console.log('═══════════════════════════════════════');
        console.log(`   Access Token: ${accessToken ? '✅ Exists' : '❌ MISSING'}`);
        console.log(`   Refresh Token: ${refreshToken ? '✅ Exists' : '❌ MISSING'}`);
        console.log(`   Expiry: ${expiry}`);
        console.log(`   Time Remaining: ${expiry ? Math.floor((new Date(expiry).getTime() - Date.now()) / 1000 / 60) + 'm' : 'N/A'}`);
        console.log('═══════════════════════════════════════\n');
        return { accessToken: !!accessToken, refreshToken: !!refreshToken, expiry };
      };
    }
    
    console.log('\n✅ Global debug commands available:');
    console.log('   1️⃣ viewDebugLogs() - Display all stored debug logs');
    console.log('   2️⃣ triggerRefresh() - Manually trigger token refresh NOW');
    if (TEST_MODE_FAST_REFRESH) {
      console.log('   3️⃣ getRefreshStatus() - Check current token status');
      console.log('\n🧪 TEST MODE: Refresh will happen in 2 minutes (set TEST_MODE_FAST_REFRESH=false to disable)\n');
    }
    
    return response;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
};

/**
 * Manual Token Refresh - Called when user clicks "Refresh Token" button
 * This hits the API with the current access token and refresh token
 */
export const manualRefreshToken = async (): Promise<{ success: boolean; message: string; newToken?: string }> => {
  const baseRefreshLogic = async (): Promise<{ success: boolean; message: string; newToken?: string }> => {
    try {
      console.log('\n🔄 =============== MANUAL TOKEN REFRESH ===============');
      console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
      
      const accessToken = getAuthToken();
      const refreshToken = sessionStorage.getItem('refreshToken_session');
      
      console.log(`   Current Access Token: ${accessToken ? '✅ Found' : '❌ MISSING'}`);
      console.log(`   Current Refresh Token: ${refreshToken ? '✅ Found' : '❌ MISSING'}`);
      
      if (!refreshToken) {
        console.error('❌ Cannot refresh: No refresh token available');
        return { success: false, message: 'No refresh token available. Please login again.' };
      }
      
      // Import the API function
      const { manualRefreshToken: apiManualRefreshToken } = await import('../api/hmsApi');
      
      console.log('\n📡 Calling API endpoint: /Authentication/refresh-token');
      console.log('   Method: POST');
      console.log(`   Access Token: ${accessToken ? `✅ Including (${accessToken.substring(0, 20)}...)` : '❌ Not including'}`);
      console.log(`   Refresh Token: ${refreshToken ? `✅ Including (${refreshToken.substring(0, 20)}...)` : '❌ Not including'}`);
      
      const response = await apiManualRefreshToken({
        accessToken: accessToken || undefined,
        refreshToken: refreshToken
      });
      
      console.log('\n✅ API Response Received');
      console.log('   Status: Success');
      console.log(`   New Access Token: ${response.accessToken ? `✅ Received (${response.accessToken.substring(0, 20)}...)` : '❌ Missing'}`);
      console.log(`   Expires At: ${response.accessTokenExpiresAt || 'N/A'}`);
      
      // Save new token
      if (response.accessToken) {
        console.log('\n💾 Saving new token to storage');
        saveAccessToken(response.accessToken, response.accessTokenExpiresAt);
        
        // Update refresh token if returned
        if (response.refreshToken) {
          saveRefreshToken(response.refreshToken);
          console.log('   ✅ Refresh token updated');
        }
        
        console.log('✅ Token saved to sessionStorage');
        
        // Log the event
        logTokenRefreshEvent('✅ Manual token refresh successful', {
          timestamp: new Date().toISOString(),
          newTokenExpiry: response.accessTokenExpiresAt
        });
        
        console.log('🔄 =============== MANUAL TOKEN REFRESH COMPLETED ===============\n');
        
        return {
          success: true,
          message: 'Token refreshed successfully! ✅',
          newToken: response.accessToken
        };
      } else {
        console.error('❌ No access token in response');
        return { success: false, message: 'Failed to refresh token. Please try again.' };
      }
    } catch (error) {
      console.error('\n❌ MANUAL TOKEN REFRESH FAILED');
      console.error('   Error:', error);
      console.error('   Details:', (error as any)?.message);
      
      logTokenRefreshEvent('❌ Manual token refresh failed', {
        timestamp: new Date().toISOString(),
        error: (error as any)?.message
      });
      
      // Re-throw to let Azure manager handle retry logic
      throw error;
    }
  };

  // ✨ NEW: Use Azure Production Manager for retry logic and resilience
  // This provides automatic retries, connection health checks, and graceful degradation
  if (API_BASE_URL && API_BASE_URL.includes('azure')) {
    console.log('🔵 AZURE PRODUCTION ENVIRONMENT DETECTED - Using retry logic');
    
    const result = await azureTokenRefreshManager.refreshWithRetry(baseRefreshLogic);
    
    // Log retry statistics
    console.log(`\n📊 Retry Statistics: ${result.retriesUsed} retries used`);
    
    return result;
  } else {
    // Local development: use simple refresh without retries
    console.log('🟢 LOCAL DEVELOPMENT - Using simple refresh (no retry logic)');
    
    try {
      return await baseRefreshLogic();
    } catch (error) {
      return {
        success: false,
        message: (error as any)?.message || 'Failed to refresh token. Please try again.'
      };
    }
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
    // IMPORTANT: Await handleLogout to ensure logs are downloaded before return
    await handleLogout();
  }
};

/**
 * 📊 COMPREHENSIVE STATE LOGGER
 * Captures all app state data before logout to prevent data loss
 * Saves to localStorage for export
 */
export const captureCompleteAppState = (): string => {
  try {
    const state = {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Token Information
      tokens: {
        accessToken: sessionStorage.getItem('accessToken_session') ? '✅ EXISTS (first 50 chars: ' + sessionStorage.getItem('accessToken_session')?.substring(0, 50) + '...)' : '❌ MISSING',
        refreshToken: sessionStorage.getItem('refreshToken_session') ? '✅ EXISTS' : '❌ MISSING',
        tokenExpiry: sessionStorage.getItem('accessTokenExpiry') || '❌ NOT FOUND',
      },
      
      // User Information
      user: {
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        userRole: localStorage.getItem('userRole'),
        clinicId: localStorage.getItem('clinicId'),
        enterpriseId: localStorage.getItem('enterpriseId'),
      },
      
      // Session Metadata
      session: {
        lastActivity: localStorage.getItem('lastActivity'),
        sessionStart: localStorage.getItem('sessionStartTime'),
        inactivityTimeout: sessionStorage.getItem('inactivityTimeout_ls'),
      },
      
      // All sessionStorage keys
      sessionStorageKeys: Array.from({length: sessionStorage.length}, (_, i) => {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key || '');
        return `${key}: ${value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : 'EMPTY'}`;
      }),
      
      // All localStorage keys
      localStorageKeys: Array.from({length: localStorage.length}, (_, i) => {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key || '');
        return `${key}: ${value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : 'EMPTY'}`;
      }),
      
      // Stored logs
      debugLogs: getStoredLogs(),
    };
    
    const stateJson = JSON.stringify(state, null, 2);
    localStorage.setItem('APP_STATE_BEFORE_LOGOUT', stateJson);
    return stateJson;
  } catch (error) {
    console.error('❌ Error capturing app state:', error);
    return 'ERROR: Could not capture app state';
  }
};

/**
 * 💾 EXPORT LOGS TO FILE
 * Creates a downloadable text file with all diagnostic information
 * File saved to: C:\Users\{username}\Desktop\app-logs-{timestamp}.txt
 */
export const exportLogsToFile = async (): Promise<void> => {
  return new Promise<void>((resolve) => {
    try {
      console.log('📄 exportLogsToFile: Starting comprehensive log export...');
      
      const appState = captureCompleteAppState();
      const exportedLogs = exportDebugLogs();
    
      // Create comprehensive log content
      const logContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                      APPLICATION DIAGNOSTIC LOGS                            ║
║                    Generated: ${new Date().toLocaleString()}                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 CURRENT APPLICATION STATE
════════════════════════════════════════════════════════════════════════════════
${appState}

📋 EXPORTED DEBUG LOGS
════════════════════════════════════════════════════════════════════════════════
${exportedLogs}

📱 Browser Information
════════════════════════════════════════════════════════════════════════════════
User Agent: ${navigator.userAgent}
Language: ${navigator.language}
Online: ${navigator.onLine ? '✅ YES' : '❌ NO'}
Storage Available: ${navigator.storage ? '✅ YES' : '❌ NO'}

🖼️ Window Information
════════════════════════════════════════════════════════════════════════════════
URL: ${window.location.href}
Hostname: ${window.location.hostname}
Protocol: ${window.location.protocol}
Screen Size: ${window.innerWidth}x${window.innerHeight}

⏰ Session Timeline
════════════════════════════════════════════════════════════════════════════════
Report Generated: ${new Date().toISOString()}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

════════════════════════════════════════════════════════════════════════════════
End of Log File
════════════════════════════════════════════════════════════════════════════════
`;

      // Create blob and download
      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().toLocaleTimeString().replace(/[:.]/g, '-');
      link.download = `HMS-Diagnostic-Logs_${timestamp}.txt`;
      const fileSizeKB = (logContent.length / 1024).toFixed(2);
      
      console.log(`💾 exportLogsToFile: Download ${link.download} (${fileSizeKB} KB)`);
      
      document.body.appendChild(link);
      
      // Direct click - NO requestAnimationFrame (was causing delays)
      link.click();
      console.log('✅ exportLogsToFile: Click executed');
      
      // PRODUCTION TIMEOUT: 15 seconds
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
      const cleanupDelay = isProduction ? 15000 : 2000;
      
      console.log(`⏱️ exportLogsToFile: Cleanup in ${cleanupDelay}ms (${isProduction ? 'PRODUCTION' : 'dev'})`);
      
      const cleanupTimeout = setTimeout(() => {
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
          console.log(`✅ exportLogsToFile: Cleanup done after ${cleanupDelay}ms`);
          resolve();
        } catch (cleanupError) {
          console.error('exportLogsToFile cleanup error:', cleanupError);
          resolve();
        }
      }, cleanupDelay);
      
      // Safety timeout - 2x cleanup delay
      const maxWait = setTimeout(() => {
        clearTimeout(cleanupTimeout);
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        } catch (e) {
          console.error('exportLogsToFile safety error:', e);
        }
        console.log('⚠️ exportLogsToFile: Safety timeout - forcing resolve');
        resolve();
      }, cleanupDelay * 2);
        
    } catch (error) {
      console.error('❌ exportLogsToFile error:', error);
      resolve();
    }
  });
};

/**
 * Handle logout (clear session and cleanup)
 * Uses hybrid storage clearance for complete session termination
 * IMPORTANT: Prints all debug logs before clearing to preserve diagnosis info
 */
/**
 * Extract and manually download logs from localStorage
 * Call this if automatic download fails for debugging
 */
export const manuallyDownloadStoredLogs = (): void => {
  try {
    const diagnosticLogs = localStorage.getItem('PERSISTED_DEBUG_LOGS') || '';
    const sessionLogs = localStorage.getItem('SESSION_DEBUG_LOGS') || '';
    const appState = localStorage.getItem('APP_STATE_BEFORE_LOGOUT') || '';
    
    const combinedLogs = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                      MANUALLY EXTRACTED LOGS                                  ║
║                    Generated: ${new Date().toLocaleString()}                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

═════════════════════════════════════════════════════════════════════════════════
📋 DIAGNOSTIC LOGS
═════════════════════════════════════════════════════════════════════════════════
${diagnosticLogs}

═════════════════════════════════════════════════════════════════════════════════
📋 SESSION DEBUG LOGS
═════════════════════════════════════════════════════════════════════════════════
${sessionLogs}

═════════════════════════════════════════════════════════════════════════════════
📊 APPLICATION STATE
═════════════════════════════════════════════════════════════════════════════════
${appState}

═════════════════════════════════════════════════════════════════════════════════
End of Manual Extraction
═════════════════════════════════════════════════════════════════════════════════
`;
    
    const blob = new Blob([combinedLogs], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HMS-Manual-Logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Manual logs download triggered');
  } catch (error) {
    console.error('❌ Failed to manually extract logs:', error);
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).manuallyDownloadStoredLogs = manuallyDownloadStoredLogs;
  (window as any).downloadLogsNow = manuallyDownloadStoredLogs;
  // Helper function to check available logs\n  (window as any).checkAvailableLogs = (): void => {\n    console.log('\\n🔍 CHECKING AVAILABLE LOGS IN LOCALSTORAGE:\\n');\n    const diagnosticLogs = localStorage.getItem('PERSISTED_DEBUG_LOGS');\n    const sessionLogs = localStorage.getItem('SESSION_DEBUG_LOGS');\n    const appState = localStorage.getItem('APP_STATE_BEFORE_LOGOUT');\n    \n    console.log(`📄 Diagnostic Logs: ${diagnosticLogs ? '✅ AVAILABLE (' + Math.round(diagnosticLogs.length / 1024) + ' KB)' : '❌ NOT FOUND'}`);\n    console.log(`📄 Session Logs: ${sessionLogs ? '✅ AVAILABLE (' + Math.round(sessionLogs.length / 1024) + ' KB)' : '❌ NOT FOUND'}`);\n    console.log(`📄 App State: ${appState ? '✅ AVAILABLE (' + Math.round(appState.length / 1024) + ' KB)' : '❌ NOT FOUND'}`);\n    \n    if (diagnosticLogs || sessionLogs || appState) {\n      console.log('\\n✅ LOGS AVAILABLE! To download them manually:');\n      console.log('   → window.downloadLogsNow()');\n      console.log('   → window.manuallyDownloadStoredLogs()\\n');\n    } else {\n      console.log('\\n⚠️  No logs found in storage. They may not have been saved yet.\\n');\n    }\n  };\n  \n  console.log('\\n🔧 MANUAL LOG DOWNLOAD HELPERS AVAILABLE:');\n  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\n  console.log('window.downloadLogsNow()           → Download logs from localStorage');\n  console.log('window.checkAvailableLogs()        → Check what logs are available');\n  console.log('window.sessionDebugLogger          → Access session logger directly');\n  console.log('window.sessionDebugLogger.getLogsAsText() → View logs in console');\n  console.log('\\n💡 If automatic download fails on logout:');\n  console.log('   1. Before closing browser: Run window.downloadLogsNow()');\n  console.log('   2. This will save ALL logs to your Downloads folder');\n  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
}

/**
 * Handle logout (clear session and cleanup)
 * CRITICAL FIX: Ensures logs are downloaded BEFORE tokens are cleared
 * Returns promise that completes AFTER logs are downloaded and tokens cleared
 */
const handleLogout = async (): Promise<void> => {
  console.log('\n\n🔵 ════════════════════════════════════════════════════════════════');
  console.log('🔵 LOGOUT INITIATED - STOPPING TIMERS & DOWNLOADING LOGS');
  console.log('🔵 ════════════════════════════════════════════════════════════════\n');
  
  try {
    // 🛡️ STEP 0: IMMEDIATELY STOP ALL TIMERS (before anything else)
    console.log('🔴 PRE-STEP: Stopping all active timers...');
    if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
    if (inactivityTimer) clearInterval(inactivityTimer);
    if (sessionExpiryTimer) clearTimeout(sessionExpiryTimer);
    console.log('✅ All timers stopped - logs download will not be interrupted');
    // STEP 0: Capture app state
    console.log('🔴 STEP 0: Capturing application state...');
    try {
      const appState = captureCompleteAppState();
      console.log('✅ App state captured and saved to localStorage');
    } catch (error) {
      console.error('❌ Error capturing app state:', error);
    }
    
    // STEP 1: Print debug logs to console
    console.log('🔴 STEP 1: Printing all debug logs...');
    try {
      printDebugLogs();
      const exportedLogs = exportDebugLogs();
      console.log('\n📋 EXPORTED LOGS:');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(exportedLogs);
      console.log('═══════════════════════════════════════════════════════════════\n');
    } catch (error) {
      console.error('⚠️ Failed to print debug logs:', error);
    }
    
    logLogoutEvent('Session terminated - downloading logs...');
    
    // STEP 2: Wait for comprehensive diagnostic logs download (with timeout)
    console.log('🔴 STEP 2: Downloading comprehensive diagnostic logs...');
    sessionDebugLogger.logLogout('User logout initiated');
    
    try {
      const downloadPromise = exportLogsToFile();
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Diagnostic logs download timeout')), 20000)
      );
      await Promise.race([downloadPromise, timeoutPromise]);
      console.log('✅ STEP 2b: Diagnostic logs downloaded');
    } catch (error) {
      console.warn('⚠️ STEP 2 WARNING: Diagnostic logs download failed or timed out:', error);
      console.warn('   Continuing with logout anyway...');
    }
    
    // STEP 3: Wait for session debug logs download (with timeout)
    console.log('🔴 STEP 3: Downloading session debug logs...');
    try {
      const sessionLogPromise = sessionDebugLogger.downloadLogs();
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Session logs download timeout')), 20000)
      );
      await Promise.race([sessionLogPromise, timeoutPromise]);
      console.log('✅ STEP 3b: Session debug logs downloaded');
    } catch (error) {
      console.warn('⚠️ STEP 3 WARNING: Session logs download failed or timed out:', error);
      console.warn('   Continuing with logout anyway...');
    }
    
    console.log('✅ Both log files should now be in your Downloads folder');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR during log export:', error);
  } finally {
    // STEP 4: Clear all tokens and session data
    console.log('🔴 STEP 4: Clearing all tokens from storage...');
    removeActivityListeners();
    clearAllTokens();
    
    // Also explicitly clear refresh token backup
    try {
      localStorage.removeItem('refreshToken_backup');
      sessionStorage.removeItem('refreshToken_session');
    } catch (e) {
      // Ignore errors
    }
    
    console.log('\n✅ LOGOUT COMPLETE');
    console.log('🔓 All tokens cleared from memory, sessionStorage, and localStorage');
    console.log('🔐 Refresh token in HttpOnly cookie invalidated by server');
    console.log('📁 Logs downloaded to Downloads folder');
    console.log('🔵 ════════════════════════════════════════════════════════════════\n');
    
    // Close popups and redirect ONLY after ALL logs downloaded
    if (document.getElementById('session-expired-popup')) {
      await closeSessionExpiredPopupAndRedirect();
    } else if (document.getElementById('inactivity-popup')) {
      await closeInactivityPopupAndRedirect();
    }
  }
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
      console.warn('⚠️ ⏰ Unified refresh timer not running. Restarting...');
      startTokenRefreshTimer();
    } else {
      console.log('✅ ⏰ Unified refresh timer is running correctly');
    }
  } catch (error) {
    console.error('❌ Error handling tab focus:', error);
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
  };
};

/**
 * ==========================================
 * 📊 PRODUCTION DIAGNOSTICS & DEBUGGING
 * ==========================================
 * 
 * Use these functions to diagnose Azure production token refresh issues
 */

/**
 * Export comprehensive token refresh diagnostics for debugging
 * Call this in browser console to get full diagnostic report
 */
export const exportTokenRefreshDiagnostics = (): any => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      apiBaseUrl: API_BASE_URL,
      isProduction: API_BASE_URL && API_BASE_URL.includes('azure'),
      userAgent: navigator.userAgent,
    },
    auth: {
      isAuthenticated: isAuthenticated(),
      tokenExpired: checkTokenExpired(),
      tokenExpiry: getTokenExpiry(),
      hasAccessToken: !!getAuthToken(),
      hasRefreshToken: !!sessionStorage.getItem('refreshToken_session'),
    },
    storage: {
      sessionStorageKeys: Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i)),
      localStorageKeys: Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)),
    },
    tokenRefresh: azureTokenRefreshManager.getRefreshStatistics(),
    connectionHealth: azureTokenRefreshManager.getConnectionHealth(),
    recentAttempts: azureTokenRefreshManager.getRefreshHistory().slice(-10),
  };

  return diagnostics;
};

/**
 * Print detailed token refresh diagnostics to console
 */
export const printTokenRefreshDiagnosticsReport = (): void => {
  const diagnostics = exportTokenRefreshDiagnostics();

  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ 📊 TOKEN REFRESH PRODUCTION DIAGNOSTICS REPORT                                ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════════╣');

  console.log('║ ENVIRONMENT:                                                                 ║');
  console.log(`║   API Base URL: ${diagnostics.environment.apiBaseUrl}                                            ║`);
  console.log(
    `║   Environment: ${diagnostics.environment.isProduction ? '🔴 PRODUCTION (Azure)' : '🟢 LOCAL DEVELOPMENT'}                              ║`
  );

  console.log('║ AUTHENTICATION STATUS:                                                       ║');
  console.log(`║   Is Authenticated: ${diagnostics.auth.isAuthenticated ? '✅ YES' : '❌ NO'}                                                   ║`);
  console.log(`║   Token Expired: ${diagnostics.auth.tokenExpired ? '🔴 YES' : '✅ NO'}                                                       ║`);
  console.log(`║   Token Expiry: ${diagnostics.auth.tokenExpiry || 'N/A'}                                    ║`);
  console.log(`║   Access Token Present: ${diagnostics.auth.hasAccessToken ? '✅ YES' : '❌ NO'}                                                ║`);
  console.log(`║   Refresh Token Present: ${diagnostics.auth.hasRefreshToken ? '✅ YES' : '❌ NO'}                                              ║`);

  console.log('║ REFRESH STATISTICS:                                                         ║');
  console.log(`║   Total Attempts: ${diagnostics.tokenRefresh.totalAttempts}                                                              ║`);
  console.log(`║   Successful: ${diagnostics.tokenRefresh.successfulAttempts}                                                                  ║`);
  console.log(`║   Failed: ${diagnostics.tokenRefresh.failedAttempts}                                                                     ║`);
  console.log(`║   Success Rate: ${diagnostics.tokenRefresh.successRate}%                                                              ║`);
  console.log(`║   Last Successful: ${diagnostics.tokenRefresh.lastSuccessfulRefresh}                                ║`);

  console.log('║ CONNECTION HEALTH:                                                          ║');
  console.log(
    `║   Status: ${diagnostics.connectionHealth.isHealthy ? '✅ HEALTHY' : '⚠️ DEGRADED'}                                                       ║`
  );
  console.log(
    `║   Consecutive Failures: ${diagnostics.connectionHealth.consecutiveFailures}                                                            ║`
  );
  console.log(
    `║   Avg Response Time: ${diagnostics.connectionHealth.avgResponseTimeMs.toFixed(0)}ms                                                  ║`
  );

  console.log('║ RECENT ATTEMPTS:                                                             ║');
  diagnostics.recentAttempts.forEach((attempt, idx) => {
    const status = attempt.success ? '✅' : '❌';
    const time = new Date(attempt.timestamp).toLocaleTimeString();
    console.log(`║   [${idx + 1}] ${status} ${time} - Attempt #${attempt.attemptNumber}${attempt.errorType ? ` (${attempt.errorType})` : ''}           ║`);
  });

  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  // Also print Azure manager diagnostics
  console.log('\n🔧 Printing detailed Azure Token Refresh Manager diagnostics:\n');
  printTokenRefreshDiagnostics();
};

/**
 * Display token refresh diagnostics in a formatted table (if console supports it)
 */
export const displayTokenRefreshTable = (): void => {
  const diagnostics = exportTokenRefreshDiagnostics();

  console.log('\n📊 TOKEN REFRESH DIAGNOSTICS TABLE:');
  console.table({
    Environment: diagnostics.environment.isProduction ? 'Production (Azure)' : 'Local Dev',
    'API URL': diagnostics.environment.apiBaseUrl,
    'Is Authenticated': diagnostics.auth.isAuthenticated ? 'Yes' : 'No',
    'Token Expired': diagnostics.auth.tokenExpired ? 'Yes' : 'No',
    'Token Expiry': diagnostics.auth.tokenExpiry || 'N/A',
    'Total Attempts': diagnostics.tokenRefresh.totalAttempts,
    'Successful': diagnostics.tokenRefresh.successfulAttempts,
    'Failed': diagnostics.tokenRefresh.failedAttempts,
    'Success Rate': diagnostics.tokenRefresh.successRate + '%',
    'Connection Health': diagnostics.connectionHealth.isHealthy ? 'Healthy' : 'Degraded',
    'Consecutive Failures': diagnostics.connectionHealth.consecutiveFailures,
  });
};

/**
 * Export diagnostics as JSON file
 */
export const downloadTokenRefreshDiagnostics = (): void => {
  const diagnostics = exportTokenRefreshDiagnostics();
  const json = JSON.stringify(diagnostics, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `token-refresh-diagnostics-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('✅ Diagnostics exported to:', link.download);
};

/**
 * Initialize global diagnostics for easy access in browser console
 * Accessible as: window.__HMS_DIAGNOSTICS__
 */
export const initializeDiagnosticsGlobals = (): void => {
  (window as any).__HMS_DIAGNOSTICS__ = {
    // Core diagnostic functions
    getDiagnostics: exportTokenRefreshDiagnostics,
    printDiagnostics: printTokenRefreshDiagnosticsReport,
    showTable: displayTokenRefreshTable,
    download: downloadTokenRefreshDiagnostics,
    
    // Auth state functions
    checkAuthState: debugAuthState,
    
    // Token functions
    getToken: getAuthToken,
    getTokenExpiry: getTokenExpiry,
    isExpired: checkTokenExpired,
    refreshNow: manualRefreshToken,
    
    // Session functions
    getUserData: getUserData,
    getUserAccess: getUserAccess,
    getSelectedAccess: getSelectedAccess,
    
    // Timer functions
    startRefreshTimer: startTokenRefreshTimer,
    
    // Logging functions
    printLogs: printDebugLogs,
    exportLogs: exportDebugLogs,
  };

  console.log('✅ HMS Diagnostics initialized. Use window.__HMS_DIAGNOSTICS__ in console:');
  console.log('   • window.__HMS_DIAGNOSTICS__.getDiagnostics() - Get diagnostics object');
  console.log('   • window.__HMS_DIAGNOSTICS__.printDiagnostics() - Print full report');
  console.log('   • window.__HMS_DIAGNOSTICS__.showTable() - Show table view');
  console.log('   • window.__HMS_DIAGNOSTICS__.download() - Download as JSON');
  console.log('   • window.__HMS_DIAGNOSTICS__.checkAuthState() - Check auth state');
  console.log('   • window.__HMS_DIAGNOSTICS__.refreshNow() - Refresh token immediately');
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
  (window as any).exportLogs = exportLogsToFile;
  (window as any).captureState = captureCompleteAppState;
  console.log('💡 Debug Functions Available:');
  console.log('   • debugAuth() - Check authentication state');
  console.log('   • exportLogs() - Export diagnostic logs to file');
  console.log('   • captureState() - Capture current app state to console');
}
