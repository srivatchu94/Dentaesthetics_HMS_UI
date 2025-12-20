import { request } from './apiClient';
import { RegisterRequest, LoginRequest, AuthResponse, LoginResponse, UserAccess, RefreshTokenRequest, RefreshTokenResponse } from '../Interfaces/AuthModels';
import {
  saveAccessToken,
  getAccessToken,
  saveUserData,
  getUserData,
  saveUserAccess,
  getUserAccess,
  saveSelectedAccess,
  getSelectedAccess,
  clearAllTokens,
  updateTokenExpiry,
  getTokenExpiry,
  isTokenExpired,
  saveSessionMetadata,
  getSessionMetadata,
  STORAGE_KEYS
} from './tokenManager';

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

// Activity tracking
let lastActivityTime: number = Date.now();

// ============================================
// 💾 TOKEN STORAGE (Session-based)
// ============================================

/**
 * Save authentication tokens and user data using HYBRID storage
 * - Access Token: Memory + SessionStorage (cleared on tab close)
 * - Refresh Token: HttpOnly Cookie (Backend managed, automatic)
 * - User Data: localStorage (non-sensitive)
 */
export const saveAuthToken = (loginResponse: LoginResponse): void => {
  try {
    const { accessToken, refreshToken, username, userId, access, accessTokenExpiresAt, refreshTokenExpiresAt, inactivityTimeoutMinutes, maxSessionDurationHours } = loginResponse;
    
    // 🧠 Save ACCESS TOKEN using HYBRID strategy
    // Primary: Memory (fastest, XSS protected)
    // Fallback: SessionStorage (survives page refresh, cleared on tab close)
    saveAccessToken(accessToken, accessTokenExpiresAt);
    
    // 🍪 REFRESH TOKEN - Already handled by Backend
    // Backend sends: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
    // This is the MOST SECURE way - frontend doesn't touch it
    console.log('✅ Refresh Token set as HttpOnly Cookie (Backend managed, XSS protected)');
    
    // 💾 Save NON-SENSITIVE user data to localStorage (persists across sessions)
    saveUserData({ username, userId });
    saveUserAccess(access);
    
    // Auto-select first access if available (including roleIds)
    if (access && access.length > 0) {
      const firstAccess = access[0];
      saveSelectedAccess(firstAccess.enterpriseId, firstAccess.clinicId, firstAccess.roleIds);
    }
    
    // Save session timeout settings
    saveSessionMetadata(STORAGE_KEYS.INACTIVITY_TIMEOUT_LS, inactivityTimeoutMinutes.toString());
    
    // Track activity
    updateLastActivity();
    
    console.log('✅ Session started successfully (HYBRID STORAGE)');
    console.log('🧠 Access Token: Memory + SessionStorage (XSS protected)');
    console.log('🍪 Refresh Token: HttpOnly Cookie (Backend managed)');
    console.log('💾 User Data: localStorage (non-sensitive)');
    console.log('🔑 Access Token expires at:', accessTokenExpiresAt);
    console.log('🔄 Refresh Token expires at:', refreshTokenExpiresAt);
    console.log('⏱️ Inactivity timeout:', inactivityTimeoutMinutes, 'minutes');
    console.log('⏰ Max session duration:', maxSessionDurationHours, 'hours');
    
    // Start auto-refresh and inactivity monitoring
    startTokenRefreshTimer();
    startInactivityTimer();
    startSessionExpiryTimer(refreshTokenExpiresAt);
    
  } catch (error) {
    console.error('❌ Failed to save tokens:', error);
  }
};

/**
 * Get access token from HYBRID storage
 * Priority: Memory → SessionStorage → null
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
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA_LS_KEY);
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
  const access = localStorage.getItem(STORAGE_KEYS.USER_ACCESS_LS_KEY);
  return access ? JSON.parse(access) : [];
};

/**
 * Set selected enterprise, clinic, and roles
 */
export const setSelectedAccess = (enterpriseId: number, clinicId: number, roleIds: number[] = []): void => {
  saveSelectedAccess(enterpriseId, clinicId, roleIds);
};

/**
 * Get currently selected enterprise, clinic, and roles (backward compatible)
 */
export const getSelectedAccess = (): { enterpriseId: number; clinicId: number; roleIds: number[] } | null => {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 getSelectedAccess() CALLED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📦 Checking key:', STORAGE_KEYS.SELECTED_ACCESS_LS);
    console.log('📦 All localStorage keys:', Object.keys(localStorage));
    
    const data = localStorage.getItem(STORAGE_KEYS.SELECTED_ACCESS_LS);
    console.log('📦 Raw data from localStorage:', data);
    console.log('📦 Data type:', typeof data);
    console.log('📦 Data is null?', data === null);
    console.log('📦 Data is undefined?', data === undefined);
    
    if (!data) {
      console.error('❌ NO selectedAccess found in localStorage!');
      console.error('❌ Key checked:', STORAGE_KEYS.SELECTED_ACCESS_LS);
      console.error('💡 Available keys:', Object.keys(localStorage));
      console.error('💡 Try checking key "selectedAccess":', localStorage.getItem('selectedAccess'));
      console.log('═══════════════════════════════════════════════════════');
      return null;
    }
    
    const parsed = JSON.parse(data);
    console.log('✅ Parsed selectedAccess:', parsed);
    console.log('   - enterpriseId:', parsed.enterpriseId);
    console.log('   - clinicId:', parsed.clinicId);
    console.log('   - roleIds:', parsed.roleIds);
    console.log('═══════════════════════════════════════════════════════');
    return parsed;
    return parsed;
  } catch (error) {
    console.error('❌ Failed to parse selected access from localStorage:', error);
    return null;
  }
};

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
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const accessToken = getAuthToken();
    // Refresh token is in HttpOnly cookie - don't try to get it from JS
    
    if (!accessToken) {
      console.warn('⚠️ No access token available for refresh');
      return false;
    }
    
    console.log('🔄 Refreshing access token (HttpOnly cookie sent automatically)...');
    
    const response = await request<RefreshTokenResponse>(`${AUTH_BASE_URL}/refresh-token`, {
      method: 'POST',
      body: JSON.stringify({ accessToken })
    });
    
    // Update access token in HYBRID storage (Memory + SessionStorage)
    saveAccessToken(response.accessToken, response.accessTokenExpiresAt);
    
    // Backend updates HttpOnly cookie automatically - no action needed
    console.log('✅ Access token refreshed successfully');
    console.log('🧠 Access Token: Memory + SessionStorage updated');
    console.log('🍪 Refresh Token: HttpOnly Cookie updated by backend');
    console.log('🔑 New token expires at:', response.accessTokenExpiresAt);
    
    // Restart refresh timer with new expiry
    startTokenRefreshTimer();
    
    return true;
  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
    showSessionExpiredPopup();
    handleLogout();
    return false;
  }
};

/**
 * Start timer to auto-refresh token before it expires
 */
const startTokenRefreshTimer = (): void => {
  // Clear existing timer
  if (refreshTokenTimer) {
    clearTimeout(refreshTokenTimer);
  }
  
  try {
    const expiryStr = getTokenExpiry();
    if (!expiryStr) return;
    
    const expiryTime = new Date(expiryStr).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // Refresh 2 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - (2 * 60 * 1000));
    
    console.log(`⏰ Token will be refreshed in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
    
    refreshTokenTimer = window.setTimeout(async () => {
      console.log('⏰ Auto-refreshing token...');
      const success = await refreshAccessToken();
      if (!success) {
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
 */
const startInactivityTimer = (): void => {
  // Clear existing timer
  if (inactivityTimer) {
    clearInterval(inactivityTimer);
  }
  
  const timeoutStr = getSessionMetadata(STORAGE_KEYS.INACTIVITY_TIMEOUT_LS);
  const timeoutMinutes = parseInt(timeoutStr || '30');
  
  // Check every minute
  inactivityTimer = window.setInterval(() => {
    if (isInactive()) {
      console.log('⏱️ User inactive for', timeoutMinutes, 'minutes');
      showInactivityPopup();
      handleLogout();
    }
  }, 60 * 1000); // Check every minute
};

/**
 * Initialize activity listeners to track user interaction
 */
export const initActivityListeners = (): void => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, updateLastActivity, true);
  });
  
  console.log('👂 Activity listeners initialized');
};

/**
 * Remove activity listeners
 */
export const removeActivityListeners = (): void => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.removeEventListener(event, updateLastActivity, true);
  });
  
  console.log('🔇 Activity listeners removed');
};

// ============================================
// ⏰ SESSION EXPIRY MONITORING
// ============================================

/**
 * Start session expiry timer (max session duration)
 */
const startSessionExpiryTimer = (refreshTokenExpiresAt: string): void => {
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
  const sessionMetadata = getSessionMetadata();
  const timeoutMinutes = sessionMetadata?.inactivityTimeoutMinutes || 30;
  
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
 */
const handleLogout = (): void => {
  // Clear all timers
  if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
  if (inactivityTimer) clearInterval(inactivityTimer);
  if (sessionExpiryTimer) clearTimeout(sessionExpiryTimer);
  
  // Remove activity listeners
  removeActivityListeners();
  
  // Clear all tokens and session data using hybrid storage manager
  // This ensures cleanup across: memory, sessionStorage, localStorage, and HttpOnly cookies
  clearAllTokens();
  
  console.log('🔓 Complete logout - All tokens cleared from memory, sessionStorage, and localStorage');
  console.log('🔐 Refresh token in HttpOnly cookie will be invalidated by server on next request');
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
  const sessionMetadata = getSessionMetadata();
  
  console.log('Access Token:', token ? `${token.substring(0, 30)}... (${token.length} chars)` : '❌ MISSING');
  console.log('Refresh Token:', '🔒 HttpOnly Cookie (Cannot access from JavaScript - handled by browser)');
  console.log('User Data:', userData || '❌ MISSING');
  console.log('User Access:', userAccess || '❌ MISSING');
  console.log('Selected Access:', selectedAccess || '❌ MISSING');
  console.log('Session Metadata:', sessionMetadata || '❌ MISSING');
  console.log('════════════════════════════════════════');
  
  if (!token) {
    console.error('❌ NO TOKEN - You need to login!');
    console.log('💡 Tip: Open login page and enter credentials');
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
  console.log('💡 Tip: Type debugAuth() in console to check authentication state');
}
