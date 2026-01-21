// API Configuration - Uses Vite Environment Variables
// Environment variables are loaded from .env files:
// - .env.development (npm run dev) → https://localhost:7104/api
// - .env.production (npm run build) → Cloud API
// - .env.local (overrides all, git-ignored)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api';
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'production';
export const DEBUG = import.meta.env.VITE_DEBUG === 'true';

// Log configuration on startup
console.log(`
╔════════════════════════════════════════════╗
║   DENTAESTHETICS HMS UI - Configuration    ║
╠════════════════════════════════════════════╣
║ Environment: ${ENVIRONMENT.toUpperCase().padEnd(30)} ║
║ API Base URL: ${API_BASE_URL.substring(0, 33).padEnd(30)} ║
║ Debug Mode: ${DEBUG.toString().padEnd(30)} ║
╚════════════════════════════════════════════╝
`);

export default API_BASE_URL;
