// Authentication Models

export interface RegisterRequest {
  username: string;
  password: string;
  emailid: string;
  mobileNumber: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Access structure for enterprise/clinic/roles
export interface UserAccess {
  enterpriseId: number;
  clinicId: number;
  roleIds: number[];
}

// Actual backend login response structure (with refresh token)
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  userId: number;
  access: UserAccess[];
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  inactivityTimeoutMinutes: number;
  maxSessionDurationHours: number;
}

// Refresh token request
export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

// Refresh token response
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

// Legacy AuthResponse (kept for compatibility)
export interface AuthResponse {
  username: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserCredentialModel {
  username: string;
  passwordHash: Uint8Array;
  passwordSalt: Uint8Array;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}
