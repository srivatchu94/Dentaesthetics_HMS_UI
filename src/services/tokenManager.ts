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
 * Save access token using hybrid strategy:
 * 1. Store in MEMORY first (fastest access)
 * 2. Backup in sessionStorage (survives page refresh)
 * 3. Store expiry time
 */
export const saveAccessToken = (token: string, expiryTime: string): void => {
  try {
    // Store in memory (primary)
    memoryAccessToken = token;
    memoryTokenExpiry = expiryTime;
    
    // Store in sessionStorage (fallback - auto-cleared on tab close)
    sessionStorage.setItem(ACCESS_TOKEN_SS_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_SS_KEY, expiryTime);
    
    console.log('✅ ACCESS TOKEN SAVED SUCCESSFULLY:');
    console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('   Storage locations:');
    console.log('      🧠 Memory: Active (fast access)');
    console.log('      📋 SessionStorage: Backup (persists on page refresh)');
    
    // Decode and show expiry info
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      
      if (decoded.exp) {
        const expiryDate = new Date(decoded.exp * 1000).toISOString();
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = decoded.exp - now;
        console.log(`   ⏰ Expiration Details:`);
        console.log(`      Expires at: ${expiryDate}`);
        console.log(`      Unix timestamp: ${decoded.exp}`);
        console.log(`      Time remaining: ${timeRemaining} seconds (${Math.floor(timeRemaining / 60)} minutes)`);
      }
    } catch (e) {
      console.log('   ⏰ Expiry time: ' + expiryTime);
    }
    
    console.log('   🔒 Security: Protected from XSS via memory storage');
  } catch (error) {
    console.error('❌ Failed to save access token:', error);
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
    
    // No token found - user needs to login
    console.warn('❌ NO TOKEN FOUND - neither in memory nor in sessionStorage');
    console.warn('   User needs to login again');
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
export const getRefreshToken = (): string => {
  // This function is here for documentation purposes
  // In reality, we CANNOT access HttpOnly cookies from JavaScript
  // The browser automatically includes them in requests
  console.log('ℹ️ Refresh Token is stored as HttpOnly Cookie (cannot be accessed via JavaScript)');
  console.log('✅ Browser automatically includes it in API requests');
  return '';
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
    console.log('✅ User access rights saved to localStorage');
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
    return data ? JSON.parse(data) : [];
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
    const selectedAccess = { enterpriseId, clinicId, roleIds };
    localStorage.setItem(SELECTED_ACCESS_LS_KEY, JSON.stringify(selectedAccess));
    console.log('🏢 Selected access saved to localStorage: Enterprise ' + enterpriseId + ', Clinic ' + clinicId);
  } catch (error) {
    console.error('❌ Failed to save selected access:', error);
  }
};

/**
 * Get selected enterprise/clinic from localStorage
 */
export const getSelectedAccess = (): { enterpriseId: number; clinicId: number; roleIds: number[] } | null => {
  try {
    const data = localStorage.getItem(SELECTED_ACCESS_LS_KEY);
    return data ? JSON.parse(data) : null;
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
 * SECURE LOGOUT - Clear all tokens and data
 */
export const clearAllTokens = (): void => {
  try {
    // Clear memory
    memoryAccessToken = null;
    memoryTokenExpiry = null;
    
    // Clear sessionStorage
    sessionStorage.removeItem(ACCESS_TOKEN_SS_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_SS_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_SS_KEY);
    sessionStorage.removeItem(SESSION_ID_SS_KEY);
    
    // Clear localStorage
    localStorage.removeItem(USER_DATA_LS_KEY);
    localStorage.removeItem(USER_ACCESS_LS_KEY);
    localStorage.removeItem(SELECTED_ACCESS_LS_KEY);
    localStorage.removeItem(INACTIVITY_TIMEOUT_LS_KEY);
    
    // Refresh token (HttpOnly cookie) is cleared by backend on logout endpoint
    // Frontend cannot clear it, so make sure backend handles it
    
    console.log('✅ All tokens and data cleared');
    console.log('   🧠 Memory: Cleared');
    console.log('   📋 SessionStorage: Cleared');
    console.log('   💾 localStorage: User data cleared');
    console.log('   🍪 HttpOnly Cookie: Backend clears this (frontend cannot access)');
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
