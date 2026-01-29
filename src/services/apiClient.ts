// Shared API client utilities
// Base URL can be configured via Vite env: VITE_API_BASE_URL

export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

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
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const expirationTime = new Date(decoded.exp * 1000).toISOString();
        console.log(`🔐 Token Check: Expires at ${expirationTime}, Current time: ${new Date().toISOString()}`);
        
        if (decoded.exp < now) {
          console.error('⚠️ Token is EXPIRED - User needs to login again');
          // Clear expired token
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('selectedAccess');
          localStorage.removeItem('authToken');
          localStorage.removeItem('selectedAccess');
          
          // Trigger expiry event
          const currentLocation = window.location.pathname;
          sessionStorage.setItem('tokenExpiryLocation', currentLocation);
          tokenExpiryEmitter.emit(currentLocation);
          
          throw new Error('Token has expired. Please login again.');
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('expired')) {
        throw e;
      }
      console.warn('⚠️ Could not decode JWT token for expiration check');
    }
  }
  
  // Build headers with token and enterprise/clinic if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add Enterprise, Clinic, and Role headers if selected
  if (selectedAccess) {
    headers['X-Enterprise-Id'] = selectedAccess.enterpriseId.toString();
    headers['X-Clinic-Id'] = selectedAccess.clinicId.toString();
    
    if (selectedAccess.roleIds && selectedAccess.roleIds.length > 0) {
      headers['X-Role-Ids'] = selectedAccess.roleIds.join(',');
    }
  }
  
  console.log(`📞 API CALL: ${options.method || 'GET'} ${path}`);
  
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers,
      ...options
    });
    console.log(`✅ API RESPONSE: ${res.status} ${res.statusText}`);
  } catch (fetchError) {
    console.error(`❌ API FAILED: Network error - ${fetchError}`);
    throw fetchError;
  }
  
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    const snippet = text.slice(0, 300);
    console.error(`❌ API ERROR: ${options.method || 'GET'} ${path} -> ${res.status} ${res.statusText} | ct=${contentType} | body: ${snippet}`);
    
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
      return undefined as T;
    }
  }
  
  return rawText as unknown as T;
}
