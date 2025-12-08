import { request } from './apiClient';
import { RegisterRequest, LoginRequest, AuthResponse, LoginResponse, UserAccess, RefreshTokenRequest, RefreshTokenResponse } from '../Interfaces/AuthModels';

const AUTH_BASE_URL = '/Authentication';

// ============================================
// 🔐 SESSION-BASED TOKEN MANAGEMENT
// ============================================
// ✅ localStorage (persists across page refreshes)
// ✅ Refresh token mechanism (auto-refresh before expiry)
// ✅ Inactivity timeout (30 min default)
// ✅ Max session duration (8 hours)
// ✅ User-friendly popups for session events
// ✅ Auto-cleanup on logout

// Storage keys - Using localStorage for persistent sessions
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';
const USER_ACCESS_KEY = 'userAccess';
const SELECTED_ACCESS_KEY = 'selectedAccess';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const REFRESH_EXPIRY_KEY = 'refreshExpiry';
const LAST_ACTIVITY_KEY = 'lastActivity';
const INACTIVITY_TIMEOUT_KEY = 'inactivityTimeout';

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
 * Save authentication tokens and user data to localStorage
 * Persists across page refreshes, cleared only on logout
 */
export const saveAuthToken = (loginResponse: LoginResponse): void => {
  try {
    const { accessToken, refreshToken, username, userId, access, accessTokenExpiresAt, refreshTokenExpiresAt, inactivityTimeoutMinutes, maxSessionDurationHours } = loginResponse;
    
    // Save tokens to localStorage (persists across page refreshes)
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, accessTokenExpiresAt);
    localStorage.setItem(REFRESH_EXPIRY_KEY, refreshTokenExpiresAt);
    localStorage.setItem(INACTIVITY_TIMEOUT_KEY, inactivityTimeoutMinutes.toString());
    
    // Save user data
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({ username, userId }));
    localStorage.setItem(USER_ACCESS_KEY, JSON.stringify(access));
    
    // Auto-select first access if available (including roleIds)
    if (access && access.length > 0) {
      const firstAccess = access[0];
      setSelectedAccess(firstAccess.enterpriseId, firstAccess.clinicId, firstAccess.roleIds);
    }
    
    // Track activity
    updateLastActivity();
    
    console.log('✅ Session started successfully');
    console.log('🔑 Access Token expires at:', accessTokenExpiresAt);
    console.log('🔄 Refresh Token expires at:', refreshTokenExpiresAt);
    console.log('⏱️ Inactivity timeout:', inactivityTimeoutMinutes, 'minutes');
    console.log('⏰ Max session duration:', maxSessionDurationHours, 'hours');
    console.log('💾 Tokens stored in localStorage (persists across page refreshes)');
    
    // Start auto-refresh and inactivity monitoring
    startTokenRefreshTimer();
    startInactivityTimer();
    startSessionExpiryTimer(refreshTokenExpiresAt);
    
  } catch (error) {
    console.error('❌ Failed to save tokens:', error);
  }
};

/**
 * Get access token from localStorage
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    return null;
  }
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Get user data from sessionStorage
 */
export const getUserData = (): any | null => {
  try {
    const data = sessionStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Failed to get user data:', error);
    return null;
  }
};

/**
 * Get user access rights
 */
export const getUserAccess = (): UserAccess[] => {
  try {
    const data = localStorage.getItem(USER_ACCESS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Failed to get user access:', error);
    return [];
  }
};

/**
 * Set selected enterprise, clinic, and roles
 */
export const setSelectedAccess = (enterpriseId: number, clinicId: number, roleIds: number[] = []): void => {
  try {
    const selectedAccess = { enterpriseId, clinicId, roleIds };
    localStorage.setItem(SELECTED_ACCESS_KEY, JSON.stringify(selectedAccess));
    console.log('🏢 Selected Access:', `Enterprise ${enterpriseId}, Clinic ${clinicId}, Roles: [${roleIds.join(', ')}]`);
  } catch (error) {
    console.error('❌ Failed to set selected access:', error);
  }
};

/**
 * Get currently selected enterprise, clinic, and roles
 */
export const getSelectedAccess = (): { enterpriseId: number; clinicId: number; roleIds: number[] } | null => {
  try {
    const data = localStorage.getItem(SELECTED_ACCESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Failed to get selected access:', error);
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
  lastActivityTime = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, lastActivityTime.toString());
};

/**
 * Get time since last activity in minutes
 */
export const getInactiveMinutes = (): number => {
  const now = Date.now();
  const diff = now - lastActivityTime;
  return Math.floor(diff / (1000 * 60));
};

/**
 * Check if user has been inactive for too long
 */
export const isInactive = (): boolean => {
  const timeoutMinutes = parseInt(localStorage.getItem(INACTIVITY_TIMEOUT_KEY) || '30');
  return getInactiveMinutes() >= timeoutMinutes;
};

// ============================================
// 🔄 TOKEN REFRESH MECHANISM
// ============================================

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const accessToken = getAuthToken();
    const refreshToken = getRefreshToken();
    
    if (!accessToken || !refreshToken) {
      console.warn('⚠️ No tokens available for refresh');
      return false;
    }
    
    console.log('🔄 Refreshing access token...');
    
    const response = await request<RefreshTokenResponse>(`${AUTH_BASE_URL}/refresh-token`, {
      method: 'POST',
      body: JSON.stringify({ accessToken, refreshToken })
    });
    
    // Update tokens in localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, response.accessTokenExpiresAt);
    localStorage.setItem(REFRESH_EXPIRY_KEY, response.refreshTokenExpiresAt);
    
    console.log('✅ Access token refreshed successfully');
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
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
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
  
  const timeoutMinutes = parseInt(localStorage.getItem(INACTIVITY_TIMEOUT_KEY) || '30');
  
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
  const timeoutMinutes = parseInt(localStorage.getItem(INACTIVITY_TIMEOUT_KEY) || '30');
  
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
 */
const handleLogout = (): void => {
  // Clear all timers
  if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
  if (inactivityTimer) clearInterval(inactivityTimer);
  if (sessionExpiryTimer) clearTimeout(sessionExpiryTimer);
  
  // Remove activity listeners
  removeActivityListeners();
  
  // Clear localStorage to remove all session data
  localStorage.clear();
  
  console.log('🔓 Session cleared - Tab close will require re-login');
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
  
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const userData = localStorage.getItem(USER_DATA_KEY);
  const userAccess = localStorage.getItem(USER_ACCESS_KEY);
  const selectedAccess = localStorage.getItem(SELECTED_ACCESS_KEY);
  
  console.log('Access Token:', token ? `${token.substring(0, 30)}... (${token.length} chars)` : '❌ MISSING');
  console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}... (${refreshToken.length} chars)` : '❌ MISSING');
  console.log('User Data:', userData ? JSON.parse(userData) : '❌ MISSING');
  console.log('User Access:', userAccess ? JSON.parse(userAccess) : '❌ MISSING');
  console.log('Selected Access:', selectedAccess ? JSON.parse(selectedAccess) : '❌ MISSING');
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
