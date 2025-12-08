// Shared API client utilities
// Base URL can be configured via Vite env: VITE_API_BASE_URL

export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7104/api";

// Import token management
import { getAuthToken, getSelectedAccess } from './authService';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Get token from localStorage (persists across page refreshes)
  const token = getAuthToken();
  
  // Get selected enterprise/clinic from localStorage
  const selectedAccess = getSelectedAccess();
  
  // Check if user is authenticated
  if (!token) {
    console.warn('⚠️ No access token found in localStorage. User may need to login.');
    console.warn('📍 Attempted request:', path);
  }
  
  // Build headers with token and enterprise/clinic if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`🔑 Token added to request (length: ${token.length} chars)`);
  } else {
    console.error('❌ NO TOKEN AVAILABLE - Request will fail authentication');
  }
  
  // Add Enterprise, Clinic, and Role headers if selected
  if (selectedAccess) {
    headers['X-Enterprise-Id'] = selectedAccess.enterpriseId.toString();
    headers['X-Clinic-Id'] = selectedAccess.clinicId.toString();
    
    // Add roleIds if they exist (backend might need this for ValidateAccess)
    if (selectedAccess.roleIds && selectedAccess.roleIds.length > 0) {
      headers['X-Role-Ids'] = selectedAccess.roleIds.join(',');
    }
    
    console.log(`🔐 API Request: ${path}`);
    console.log(`📦 Headers:`, {
      Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'MISSING',
      'X-Enterprise-Id': selectedAccess.enterpriseId,
      'X-Clinic-Id': selectedAccess.clinicId,
      'X-Role-Ids': selectedAccess.roleIds ? selectedAccess.roleIds.join(',') : 'N/A'
    });
  } else {
    console.warn(`⚠️ API Request: ${path} (No enterprise/clinic context)`);
    console.log(`📦 Headers:`, {
      Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'MISSING'
    });
  }
  
  console.log(`🌐 Sending request to: ${BASE_URL}${path}`);
  console.log(`📤 Full URL: ${BASE_URL}${path}`);
  console.log(`🔧 Method: ${options.method || 'GET'}`);
  console.log(`📋 Request Headers:`, headers);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  let res;
  try {
    console.log(`🚀 FETCH STARTING...`);
    res = await fetch(`${BASE_URL}${path}`, {
      headers,
      ...options
    });
    console.log(`✅ FETCH COMPLETED`);
    console.log(`📡 Response status: ${res.status} ${res.statusText}`);
    console.log(`📥 Response headers:`, Object.fromEntries(res.headers.entries()));
  } catch (fetchError) {
    console.error(`💥 FETCH FAILED - Network error or CORS issue`);
    console.error(`🔴 Fetch Error:`, fetchError);
    console.error(`📍 This means the request did NOT reach the backend server`);
    console.error(`🔍 Possible causes:`);
    console.error(`   1. Backend server is not running`);
    console.error(`   2. CORS policy blocking the request`);
    console.error(`   3. Network connectivity issue`);
    console.error(`   4. SSL certificate issue (for HTTPS)`);
    throw fetchError;
  }
  
  if (!res.ok) {
    console.log(`⚠️ Response NOT OK - Reading response body...`);
    const text = await res.text();
    console.error(`❌ ============ API ERROR RESPONSE ============`);
    console.error(`📍 Endpoint: ${path}`);
    console.error(`🔴 Status: ${res.status} ${res.statusText}`);
    console.error(`📝 Response Body: "${text}"`);
    console.error(`📏 Response Body Length: ${text.length} characters`);
    console.error(`🔑 Request Headers:`, headers);
    console.error(`📥 Response Headers:`, Object.fromEntries(res.headers.entries()));
    console.error(`✅ THIS PROVES THE BACKEND WAS HIT (you got a response back)`);
    
    const error: any = new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    error.status = res.status;
    error.response = { status: res.status, statusText: res.statusText, data: text };
    
    // Log unauthorized errors but DON'T auto-redirect - let the calling code handle it
    if (res.status === 401 || res.status === 403) {
      console.error('🚫 UNAUTHORIZED/FORBIDDEN - Possible reasons:');
      console.error('   1. Token missing or invalid');
      console.error('   2. Token expired');
      console.error('   3. User does not have required role (ValidateAccess failed)');
      console.error('   4. Backend cannot decode JWT token');
      console.error('   5. CORS headers not properly configured');
      
      // Show debug info
      const token = getAuthToken();
      const selected = getSelectedAccess();
      console.error('🔍 Debug Info:');
      console.error('   Token exists:', !!token);
      console.error('   Token length:', token?.length || 0);
      console.error('   Enterprise ID:', selected?.enterpriseId);
      console.error('   Clinic ID:', selected?.clinicId);
      console.error('   Role IDs:', selected?.roleIds || 'MISSING ⚠️');
      console.error('   Full Selected Access:', selected);
      
      // Decode JWT token to see what's inside (for debugging)
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.error('🔓 Decoded JWT Token Claims:');
          console.error('   Full Token:', decoded);
          console.error('   🆔 User ID Claim:', decoded.userId || decoded.sub || decoded.nameid || decoded.unique_name || 'NOT FOUND');
          console.error('   👤 Username Claim:', decoded.username || decoded.name || decoded.preferred_username || 'NOT FOUND');
          console.error('   🏢 Enterprise Claim:', decoded.enterpriseId || decoded.eid || 'NOT FOUND');
          console.error('   🏥 Clinic Claim:', decoded.clinicId || decoded.cid || 'NOT FOUND');
          console.error('   👔 Role Claims:', decoded.role || decoded.roles || decoded.roleIds || 'NOT FOUND');
          console.error('   ⏰ Expiration:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'NOT FOUND');
          console.error('   🔑 Issuer:', decoded.iss || 'NOT FOUND');
          console.error('   📍 Audience:', decoded.aud || 'NOT FOUND');
          
          // Check if token is expired
          if (decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            const isExpired = decoded.exp < now;
            console.error('   ⚠️ Token Expired:', isExpired, isExpired ? '← THIS IS THE PROBLEM!' : '✅ Still valid');
            if (!isExpired) {
              const timeLeft = decoded.exp - now;
              console.error('   ⏱️ Time remaining:', Math.floor(timeLeft / 60), 'minutes');
            }
          }
        } catch (e) {
          console.error('❌ Could not decode JWT token:', e);
        }
      }
      
      console.error('⚠️ NOT AUTO-REDIRECTING - Check error details above');
    }
    
    throw error;
  }
  
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
