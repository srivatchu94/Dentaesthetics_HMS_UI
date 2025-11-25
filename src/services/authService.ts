import { request } from './apiClient';
import { RegisterRequest, LoginRequest, AuthResponse } from '../Interfaces/AuthModels';

const AUTH_BASE_URL = '/Authentication';

// Register a new user
export const registerUser = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  return request<AuthResponse>(`${AUTH_BASE_URL}/registerUser`, {
    method: 'POST',
    body: JSON.stringify(registerData)
  });
};

// Login user
export const loginUser = async (loginData: LoginRequest): Promise<AuthResponse> => {
  return request<AuthResponse>(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify(loginData)
  });
};

// Get user by username
export const getUserByUsername = async (username: string): Promise<AuthResponse> => {
  return request<AuthResponse>(`${AUTH_BASE_URL}/${username}`, {
    method: 'GET'
  });
};
