// Shared API client utilities
// Base URL can be configured via Vite env: VITE_API_BASE_URL

export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7104/api";

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  
  if (!res.ok) {
    const text = await res.text();
    const error: any = new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    error.status = res.status;
    error.response = { status: res.status, statusText: res.statusText, data: text };
    
    // Auto-redirect for unauthorized errors - redirect immediately without throwing
    if (res.status === 401 || res.status === 403) {
      window.location.href = '/unauthorized';
      return Promise.reject(error); // Return rejected promise without showing alert
    }
    
    throw error;
  }
  
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
