// Shared API client utilities
// Base URL can be configured via Vite env: VITE_API_BASE_URL

export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

type ApiDebugEntry = {
  time: string;
  level: "error" | "warn";
  message: string;
  detail?: any;
};

function recordBrowserApiLog(level: "error" | "warn", message: string, detail?: any) {
  const entry: ApiDebugEntry = {
    time: new Date().toISOString(),
    level,
    message,
    detail
  };

  if (typeof window !== "undefined") {
    const debugWindow = window as any;
    const existing: ApiDebugEntry[] = Array.isArray(debugWindow.__hmsApiLogs) ? debugWindow.__hmsApiLogs : [];
    debugWindow.__hmsApiLogs = [...existing.slice(-99), entry];
    debugWindow.__hmsLastApiError = entry;
    window.dispatchEvent(new CustomEvent("hms:api-log", { detail: entry }));
  }
}

// Import token management
import { getAuthToken, getSelectedAccess } from './authService';

// Event emitter for token expiry to communicate with React components
export const tokenExpiryEmitter = {
  listeners: [] as Array<(location: string) => void>,
  
  subscribe: (callback: (location: string) => void) => {
    tokenExpiryEmitter.listeners.push(callback);
    return () => {
      tokenExpiryEmitter.listeners = tokenExpiryEmitter.listeners.filter(cb => cb !== callback);
    };
  },
  
  emit: (location: string) => {
    tokenExpiryEmitter.listeners.forEach(callback => callback(location));
  }
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Get token from localStorage
  let token = getAuthToken();
  const selectedAccess = getSelectedAccess();
  
  // Check if token is expired before making request
  if (token) {
    try {
      console.log('🔍 Token Validation Starting...');
      console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      
      console.log('✅ Token Decoded Successfully');
      console.log('   Token Payload:', JSON.stringify(decoded, null, 2));
      
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const expirationTime = new Date(decoded.exp * 1000).toISOString();
        const currentTime = new Date().toISOString();
        const timeRemaining = decoded.exp - now;
        
        console.log(`⏰ TOKEN EXPIRY DETAILS:`);
        console.log(`   Token expires at: ${expirationTime}`);
        console.log(`   Current server time: ${currentTime}`);
        console.log(`   Token exp (unix): ${decoded.exp}`);
        console.log(`   Current now (unix): ${now}`);
        console.log(`   Time remaining: ${timeRemaining} seconds (${Math.floor(timeRemaining / 60)} minutes)`);
        console.log(`   Time difference: ${decoded.exp - now} seconds`);
        
        if (decoded.exp < now) {
          console.error('❌ TOKEN IS EXPIRED!');
          console.error(`   Expired ${Math.abs(timeRemaining)} seconds ago`);
          console.error('⚠️ Token is EXPIRED - User needs to login again');
          
          // Clear expired token
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('selectedAccess');
          sessionStorage.removeItem('accessToken_session');
          sessionStorage.removeItem('accessTokenExpiry');
          localStorage.removeItem('authToken');
          localStorage.removeItem('selectedAccess');
          
          // Trigger expiry event
          const currentLocation = window.location.pathname;
          sessionStorage.setItem('tokenExpiryLocation', currentLocation);
          tokenExpiryEmitter.emit(currentLocation);
          
          // Force redirect to login page
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
          
          throw new Error('Token has expired. Please login again.');
        } else {
          console.log(`✅ TOKEN IS VALID - ${timeRemaining} seconds remaining`);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('expired')) {
        throw e;
      }
      console.warn('⚠️ Could not decode JWT token for expiration check:', e);
    }
  } else {
    console.warn('⚠️ No token found in getAuthToken()');
  }
  
  // Build headers with token and enterprise/clinic if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('📌 Authorization header added: Bearer [token present]');
  } else {
    console.warn('⚠️ NO TOKEN - Authorization header will NOT be sent');
  }
  
  // Add Enterprise, Clinic, and Role headers if selected
  if (selectedAccess) {
    headers['X-Enterprise-Id'] = selectedAccess.enterpriseId.toString();
    headers['X-Clinic-Id'] = selectedAccess.clinicId.toString();
    console.log(`🏢 ENTERPRISE & CLINIC HEADERS:`);
    console.log(`   Enterprise ID: ${selectedAccess.enterpriseId}`);
    console.log(`   Clinic ID: ${selectedAccess.clinicId}`);
    
    if (selectedAccess.roleIds && selectedAccess.roleIds.length > 0) {
      headers['X-Role-Ids'] = selectedAccess.roleIds.join(',');
      console.log(`👤 ROLE HEADERS:`);
      console.log(`   Role IDs: ${selectedAccess.roleIds.join(', ')}`);
      console.log(`   Number of roles: ${selectedAccess.roleIds.length}`);
    } else {
      console.warn(`⚠️ NO ROLES - User has no roles assigned for this access`);
    }
  } else {
    console.error('❌ NO SELECTED ACCESS - Enterprise/Clinic/Role headers will NOT be sent - User cannot access API');
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
  
  let res;
  try {
    res = await fetch(fullUrl, {
      headers,
      credentials: 'include',  // ✅ CRITICAL: Send HttpOnly cookies (refresh token) with every request
      ...options
    });
    console.log(`✅ API RESPONSE: ${res.status} ${res.statusText} for ${path}`);
  } catch (fetchError) {
    console.error(`❌ API FAILED: Network error for ${path} - ${fetchError}`);
    recordBrowserApiLog("error", `Network error for ${path}`, {
      method: options.method || "GET",
      url: fullUrl,
      error: String(fetchError)
    });
    throw fetchError;
  }
  
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    const snippet = text.slice(0, 300);
    console.error(`❌ API ERROR: ${options.method || 'GET'} ${path} -> ${res.status} ${res.statusText} | ct=${contentType} | body: ${snippet}`);
    recordBrowserApiLog("error", `HTTP ${res.status} ${res.statusText} for ${path}`, {
      method: options.method || "GET",
      url: fullUrl,
      status: res.status,
      statusText: res.statusText,
      contentType,
      bodySnippet: snippet,
      requestHeaders: {
        "Content-Type": headers["Content-Type"],
        "X-Enterprise-Id": headers["X-Enterprise-Id"] || "[missing]",
        "X-Clinic-Id": headers["X-Clinic-Id"] || "[missing]"
      }
    });
    
    const error: any = new Error(`HTTP ${res.status} ${res.statusText} - ct=${contentType} body=${snippet}`);
    error.status = res.status;
    error.response = { status: res.status, statusText: res.statusText, data: text };
    
    // Log unauthorized errors
    if (res.status === 401 || res.status === 403) {
      console.error('🚫 UNAUTHORIZED/FORBIDDEN - Token may be expired or invalid');
      
      const token = getAuthToken();
      const selected = getSelectedAccess();
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.error('🔓 Token Expiration:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'NOT FOUND');
          if (decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            const isExpired = decoded.exp < now;
            if (isExpired) {
              console.error('⚠️ Token is EXPIRED - Triggering token expiry modal');
              // Clear tokens
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('selectedAccess');
              localStorage.removeItem('authToken');
              localStorage.removeItem('selectedAccess');
              
              // Store current location and trigger modal
              const currentLocation = window.location.pathname;
              sessionStorage.setItem('tokenExpiryLocation', currentLocation);
              tokenExpiryEmitter.emit(currentLocation);
              
              // Force redirect to login page
              setTimeout(() => {
                window.location.href = '/login';
              }, 500);
            }
          }
        } catch (e) {
          console.error('❌ Could not decode JWT token');
        }
      }
    }
    
    throw error;
  }
  
  // Gracefully handle empty or non-JSON successful responses
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();
  const isEmptyBody = !rawText || rawText.trim().length === 0;
  
  if (isEmptyBody) return undefined as T;
  
  if (contentType.toLowerCase().includes('application/json')) {
    try {
      const data = JSON.parse(rawText) as T;
      console.log('📥 API RESULT:', data);
      return data;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      recordBrowserApiLog("warn", `JSON parse error for ${path}`, {
        method: options.method || "GET",
        url: fullUrl,
        parseError: String(parseError),
        contentType,
        bodySnippet: rawText.slice(0, 300)
      });
      return undefined as T;
    }
  }
  
  return rawText as unknown as T;
}
