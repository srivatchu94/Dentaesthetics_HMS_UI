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

// Timers
let refreshTokenTimer: number | null = null;
let inactivityTimer: number | null = null;
let sessionExpiryTimer: number | null = null;
let continuousRefreshPollingTimer: number | null = null; // NEW: Continuous polling every 60 seconds
let pollingGuardianTimer: number | null = null; // 🛡️ Guardian: Ensures polling never stops

// ⚙️ DEBUG/TEST MODE - Disable inactivity checks while testing token refresh
const TEST_MODE_DISABLE_INACTIVITY = true; // SET TO FALSE TO ENABLE INACTIVITY TIMEOUT
const TEST_MODE_DISABLE_SESSION_EXPIRY = true; // SET TO FALSE TO ENABLE SESSION EXPIRY CHECK

// ⚙️ TEST MODE - REFRESH TIMING
const TEST_MODE_FAST_REFRESH = true; // SET TO TRUE to test refresh in 2 min instead of 12 min
const TEST_REFRESH_DELAY_SECONDS = 120; // 2 minutes for testing (normally would be ~12 min)

// 🔄 CONTINUOUS POLLING CONFIGURATION
const CONTINUOUS_POLLING_INTERVAL = 60 * 1000; // 60 seconds (user requirement: "every minute")
const MIN_TIME_BEFORE_EXPIRY = 5 * 60 * 1000; // Refresh if less than 5 minutes before expiry

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
          handleLogout();
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
const startContinuousTokenRefreshPolling = (): void => {
  // Clear any existing polling timer
  if (continuousRefreshPollingTimer) {
    clearInterval(continuousRefreshPollingTimer);
    console.log('🔄 Cleared previous continuous polling timer');
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ 🔄 AUTOMATIC TOKEN REFRESH POLLING STARTED                                       ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Interval: EVERY 60 SECONDS (Every 1 minute)                                      ║');
  console.log('║ Purpose: Automatically expand token before expiry                                ║');
  console.log('║ Behavior: Silent background refresh - no user interruption                       ║');
  console.log('║ Logging: Step-by-step logs for each refresh attempt                              ║');
  console.log('║ Result: User NEVER gets logged out as long as token exists                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════════╝\n');

  let pollCount = 0;
  const sessionStartTime = new Date();

  continuousRefreshPollingTimer = window.setInterval(async () => {
    pollCount++;
    const pollStartTime = new Date();
    const pollStartMs = pollStartTime.getTime();
    const secondsSinceSessionStart = Math.floor((pollStartMs - sessionStartTime.getTime()) / 1000);

    try {
      console.log('\n╔════════════════════════════════════════════════════════════════════════════════════╗');
      console.log(`║ 🔄 AUTO-REFRESH TICK #${pollCount} - ${pollStartTime.toLocaleTimeString()}                                       ║`);
      console.log(`║ Session Duration: ${Math.floor(secondsSinceSessionStart / 60)}m ${secondsSinceSessionStart % 60}s                                                   ║`);
      console.log('╠════════════════════════════════════════════════════════════════════════════════════╣');
      
      // STEP 1: Get current token status
      console.log('║ STEP 1️⃣ : CHECK CURRENT TOKEN STATUS                                           ║');
      const accessToken = getAuthToken();
      const expiryStr = getTokenExpiry();
      const refreshToken = sessionStorage.getItem('refreshToken_session');
      
      console.log(`║   ✓ Access Token Present: ${accessToken ? '✅ YES' : '❌ NO'}                                                   ║`);
      console.log(`║   ✓ Refresh Token Present: ${refreshToken ? '✅ YES' : '❌ NO'}                                                  ║`);
      
      if (!expiryStr) {
        console.log('║   ⚠️ Warning: No token expiry found - skipping refresh this tick                   ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════════════╝\n');
        return;
      }
      
      const expiryTime = new Date(expiryStr).getTime();
      const timeUntilExpiry = expiryTime - pollStartMs;
      const minutesLeft = Math.floor(timeUntilExpiry / 1000 / 60);
      const secondsLeft = Math.floor((timeUntilExpiry % 60000) / 1000);
      
      console.log(`║   ✓ Current Time: ${pollStartTime.toLocaleTimeString()}                                                  ║`);
      console.log(`║   ✓ Token Expiry: ${new Date(expiryStr).toLocaleTimeString()}                                                 ║`);
      console.log(`║   ✓ Time Until Expiry: ${minutesLeft}m ${secondsLeft}s                                                       ║`);
      
      // STEP 2: Prepare refresh request
      console.log('║                                                                                ║');
      console.log('║ STEP 2️⃣ : PREPARE TOKEN REFRESH REQUEST                                         ║');
      console.log('║   Building request payload with:                                              ║');
      console.log(`║   • Access Token: ${accessToken ? '✅ Including' : '⚠️ Not including'}                                                 ║`);
      console.log(`║   • Refresh Token: ${refreshToken ? '✅ From sessionStorage' : '⚠️ Will use HttpOnly cookie'}                               ║`);
      console.log('║                                                                                ║');
      console.log('║ STEP 3️⃣ : CALLING MANUAL REFRESH FUNCTION                                       ║');
      console.log('║   Endpoint: /Authentication/refresh-token                                     ║');
      console.log('║   Method: POST                                                                ║');
      console.log('║   Protocol: HTTPS                                                             ║');
      
      // STEP 3: Call manual refresh function
      const startRefreshTime = Date.now();
      const refreshResult = await manualRefreshToken();
      const refreshDuration = Date.now() - startRefreshTime;
      
      console.log('║                                                                                ║');
      console.log('║ STEP 4️⃣ : PROCESS REFRESH RESPONSE                                              ║');
      console.log(`║   API Response Time: ${refreshDuration}ms                                                      ║`);
      console.log(`║   Refresh Success: ${refreshResult.success ? '✅ YES' : '❌ NO'}                                                    ║`);
      console.log(`║   Message: ${refreshResult.message}                                          ║`);
      
      if (refreshResult.success) {
        console.log('║                                                                                ║');
        console.log('║ STEP 5️⃣ : TOKEN REFRESHED SUCCESSFULLY                                         ║');
        console.log('║   Status: ✅ Token expanded                                                   ║');
        const newExpiryStr = getTokenExpiry();
        if (newExpiryStr) {
          const newExpiryTime = new Date(newExpiryStr).getTime();
          const newMinutesLeft = Math.floor((newExpiryTime - Date.now()) / 1000 / 60);
          console.log(`║   New Expiry: ${new Date(newExpiryStr).toLocaleTimeString()}                                                  ║`);
          console.log(`║   Token Valid For: ${newMinutesLeft}+ minutes more                                                  ║`);
        }
        console.log('║   Action: User remains logged in ✅                                           ║');
        console.log('║   No user interruption                                                       ║');
      } else {
        console.log('║                                                                                ║');
        console.log('║ STEP 5️⃣ : TOKEN REFRESH FAILED ❌                                               ║');
        console.log(`║   Error: ${refreshResult.message}                                          ║`);
        console.log('║   Status: ⚠️ Will retry on next tick                                          ║');
        console.log('║   Next Retry: In 60 seconds                                                  ║');
      }
      
      console.log('║                                                                                ║');
      console.log('║ STEP 6️⃣ : SUMMARY & TIMELINE                                                    ║');
      console.log(`║   Total Polls So Far: #${pollCount}                                                      ║`);
      console.log(`║   Session Active For: ${Math.floor(secondsSinceSessionStart / 60)}m ${secondsSinceSessionStart % 60}s                                                    ║`);
      console.log(`║   Refresh Frequency: Every 60 seconds                                          ║`);
      console.log(`║   Next Refresh: In 60s at approximately ${new Date(pollStartMs + 60000).toLocaleTimeString()}                ║`);
      console.log('╚════════════════════════════════════════════════════════════════════════════════════╝\n');
      
    } catch (error) {
      console.log('║                                                                                ║');
      console.log('║ STEP 5️⃣ : ERROR IN REFRESH PROCESS ❌                                             ║');
      console.error(`║   Error Type: ${(error as any)?.name || 'Unknown'}                                                ║`);
      console.error(`║   Error Message: ${(error as any)?.message || 'No message'}                                     ║`);
      console.log('║   Action: Will retry on next tick                                             ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════════════╝\n');
    }
  }, CONTINUOUS_POLLING_INTERVAL);
};

/**
 * Stop continuous token refresh polling
 */
const stopContinuousTokenRefreshPolling = (): void => {
  if (continuousRefreshPollingTimer) {
    clearInterval(continuousRefreshPollingTimer);
    continuousRefreshPollingTimer = null;
    console.log('🛑 Continuous token refresh polling stopped');
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
  try {
    console.log('\n🔄 =============== MANUAL TOKEN REFRESH (USER INITIATED) ===============');
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
      logTokenRefreshEvent('✅ Manual token refresh successful (user initiated)', {
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
    
    logTokenRefreshEvent('❌ Manual token refresh failed (user initiated)', {
      timestamp: new Date().toISOString(),
      error: (error as any)?.message
    });
    
    return {
      success: false,
      message: (error as any)?.message || 'Failed to refresh token. Please try again.'
    };
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
  try {
    // Capture current state
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
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().toLocaleTimeString().replace(/[:.]/g, '-');
    link.download = `HMS-Diagnostic-Logs_${timestamp}.txt`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Logs exported to file:', link.download);
    console.log('📁 File saved to your Downloads folder');
    console.log('📄 You can also find logs at: localStorage.getItem("APP_STATE_BEFORE_LOGOUT")');
  } catch (error) {
    console.error('❌ Error exporting logs:', error);
  }
};

/**
 * Handle logout (clear session and cleanup)
 * Uses hybrid storage clearance for complete session termination
 * IMPORTANT: Prints all debug logs before clearing to preserve diagnosis info
 */
const handleLogout = (): void => {
  // ⭐ CRITICAL: Capture app state BEFORE logout clears everything
  console.log('\n\n🔵 ════════════════════════════════════════════════════════════════');
  console.log('🔵 LOGOUT INITIATED - CAPTURING APP STATE');
  console.log('🔵 ════════════════════════════════════════════════════════════════\n');
  
  try {
    const appState = captureCompleteAppState();
    console.log('✅ App state captured and saved to localStorage');
    console.log('📊 State saved under key: APP_STATE_BEFORE_LOGOUT');
  } catch (error) {
    console.error('❌ Error capturing app state:', error);
  }
  
  // ⭐ EXPORT LOGS TO FILE
  try {
    exportLogsToFile().catch(err => console.error('❌ Failed to export logs:', err));
  } catch (error) {
    console.error('⚠️ Could not export logs:', error);
  }

  // ⭐ Print all debug logs
  console.log('\n🔵 PRINTING DEBUG LOGS BEFORE CLEAR\n');
  
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
  
  // ⭐ SESSION DEBUG LOGGER - Download logs BEFORE clearing tokens (with async handling)
  sessionDebugLogger.logLogout('User initiated logout');
  console.log('\n🔴 STEP 1: Initiating session debug log download...');
  
  // Use async IIFE to handle the async download and then proceed with logout
  (async () => {
    try {
      await sessionDebugLogger.downloadLogs(); // Wait for download to complete
      console.log('🔴 STEP 2: Log download complete - proceeding with token clearance');
    } catch (error) {
      console.error('🔴 STEP 2 ERROR: Download failed but continuing logout:', error);
    }
    
    // AFTER download completes, clear timers
    console.log('🔴 STEP 3: Clearing timers...');
    if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
    if (inactivityTimer) clearInterval(inactivityTimer);
    if (sessionExpiryTimer) clearTimeout(sessionExpiryTimer);
    stopContinuousTokenRefreshPolling(); // NEW: Stop continuous polling
    stopProactiveRefreshTimer();          // NEW: Stop proactive refresh
    stopTokenRefreshHeartbeat(); // Stop heartbeat on logout
    stopPollingGuardian();        // 🛡️ Stop polling guardian on logout
    
    // Remove activity listeners
    removeActivityListeners();
    
    // Clear all tokens and session data using hybrid storage manager
    // This ensures cleanup across: memory, sessionStorage, localStorage, and HttpOnly cookies
    console.log('🔴 STEP 4: Clearing all tokens from storage...');
    clearAllTokens();
    
    console.log('🔓 Complete logout - All tokens cleared from memory, sessionStorage, and localStorage');
    console.log('🔐 Refresh token in HttpOnly cookie will be invalidated by server on next request');
    console.log('📁 Logs should have been downloaded as HMS_DEBUG_LOGS_*.log to your Downloads folder');
    console.log('\n🔵 ════════════════════════════════════════════════════════════════\n');
  })();
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

      // If less than 3.5 minutes until expiry and refresh timer not running, refresh NOW.
      // Skip if a refresh is already in progress — prevents duplicate timer setup.
      if (timeUntilExpiry < 3.5 * 60 * 1000 && !refreshTokenTimer && !isTokenRefreshInProgress) {
        console.warn(`⚠️ [Heartbeat] Token expires in ${Math.floor(timeUntilExpiry / 1000 / 60)}m and no refresh timer! Refreshing NOW...`);
        refreshAccessToken();
        return;
      }

      // If refresh timer is not set but token still valid, restart it.
      // Only restart when no refresh is currently running — avoids the double-setup bug.
      if (!refreshTokenTimer && timeUntilExpiry > 60000 && !isTokenRefreshInProgress) {
        console.warn(`⚠️ [Heartbeat] Refresh timer not running but token valid (${Math.floor(timeUntilExpiry / 1000 / 60)}m left). Restarting...`);
        startTokenRefreshTimer();
        return;
      }

      // Log heartbeat status periodically (every 2 minutes)
      const minutesLeft = Math.floor(timeUntilExpiry / 1000 / 60);
      if (minutesLeft > 0 && timeUntilExpiry % 120000 < 15000) { // Log every 2 minutes
        console.log(`💓 [Heartbeat OK] Token valid for ${minutesLeft}m ${Math.floor((timeUntilExpiry % 60000) / 1000)}s (Unified Timer Active)`);
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
 * 🛡️ POLLING GUARDIAN - Super aggressive safety mechanism
 * Runs every 5 seconds to ensure continuous polling NEVER stops
 * Even if something breaks the polling, it will be restarted within 5 seconds
 */
let pollingGuardianCheckCount = 0;
export const startPollingGuardian = (): void => {
  if (pollingGuardianTimer) {
    clearInterval(pollingGuardianTimer);
  }

  console.log('🛡️ 🛡️ 🛡️ POLLING GUARDIAN ACTIVATED 🛡️ 🛡️ 🛡️');
  console.log('   Purpose: Ensure continuous token refresh NEVER stops');
  console.log('   Check Frequency: Every 5 seconds');
  console.log('   Action: If polling is stopped, immediately restart it');
  console.log('   Benefit: Session remains active even during tab inactivity\n');

  pollingGuardianCheckCount = 0;

  pollingGuardianTimer = window.setInterval(() => {
    pollingGuardianCheckCount++;

    // Check if continuous polling is still running
    if (!continuousRefreshPollingTimer) {
      console.error('🚨 🛡️ [Guardian] CRITICAL: Continuous polling has STOPPED!');
      console.error('   Check #' + pollingGuardianCheckCount);
      console.error('   Immediate Action: RESTARTING polling NOW');
      
      // Immediately restart the polling
      startContinuousTokenRefreshPolling();
      console.log('✅ Polling restarted by Guardian');
    } else {
      // Every 20 checks (every 100 seconds), log that guardian is active
      if (pollingGuardianCheckCount % 20 === 0) {
        console.log(`🛡️ [Guardian] Check #${pollingGuardianCheckCount}: Continuous polling is RUNNING ✅`);
      }
    }
  }, 5 * 1000); // Check every 5 seconds - aggressive!
};

/**
 * Stop the polling guardian
 */
export const stopPollingGuardian = (): void => {
  if (pollingGuardianTimer) {
    clearInterval(pollingGuardianTimer);
    pollingGuardianTimer = null;
    console.log('🛡️ Polling guardian stopped');
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

// ============================================
// ⏱️ PROACTIVE REFRESH TIMER (NEW SIMPLIFIED VERSION)
// ============================================
/**
 * Simple proactive refresh: every 60 seconds, check if token expires in < 2 minutes
 * If so, refresh it immediately
 * This is the PRIMARY token refresh mechanism (simpler than the old polling)
 */
let proactiveRefreshTimer: number | null = null;

export const startProactiveRefreshTimer = (): void => {
  if (proactiveRefreshTimer) {
    clearInterval(proactiveRefreshTimer);
  }

  console.log('⏱️ Starting proactive token refresh (every 60 seconds)');

  let checkCount = 0;

  proactiveRefreshTimer = window.setInterval(async () => {
    checkCount++;
    
    try {
      const expiryStr = getTokenExpiry();
      if (!expiryStr) return;

      const expiryTime = new Date(expiryStr).getTime();
      const timeUntilExpiry = expiryTime - Date.now();
      const minutesLeft = Math.floor(timeUntilExpiry / 1000 / 60);

      // If token expires in less than 2 minutes, refresh immediately
      if (timeUntilExpiry < 2 * 60 * 1000 && !isTokenRefreshInProgress) {
        console.log(`⏱️ Token expires in ${minutesLeft}m - Refreshing NOW`);
        // CRITICAL FIX: Actually call the refresh function instead of just logging!
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          console.log('✅ Proactive refresh succeeded - Token extended');
        } else {
          console.warn('⚠️ Proactive refresh failed - Will retry on next check');
        }
      } else if (checkCount % 5 === 0) {
        // Log status periodically (every 5 checks = every 5 minutes)
        console.log(`💚 Token healthy: ${minutesLeft}m remaining`);
      }
    } catch (error) {
      console.error('❌ Proactive refresh error:', error);
    }
  }, 60 * 1000); // Every 60 seconds
};

export const stopProactiveRefreshTimer = (): void => {
  if (proactiveRefreshTimer) {
    clearInterval(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
    console.log('⏱️ Proactive refresh timer stopped');
  }
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
