// API Configuration - Uses environment variable or defaults to cloud URL
export const API_BASE_URL = 
  (import.meta as any).env?.VITE_API_BASE_URL || 
  'https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api';

// For development purposes, you can override this via environment variables:
// Development:  VITE_API_BASE_URL=https://localhost:7104/api
// Production:   VITE_API_BASE_URL=https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api

export default API_BASE_URL;
