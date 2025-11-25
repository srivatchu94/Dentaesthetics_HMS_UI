// Authentication Models

export interface RegisterRequest {
  username: string;
  password: string;
  emailid: string;
  mobileNumber: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

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
