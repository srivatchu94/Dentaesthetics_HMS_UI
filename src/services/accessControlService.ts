// Access Control API Service
// Manages user role assignments within clinics
import { request } from './apiClient';
import type { 
  AccessControlModel, 
  CreateAccessControlDto, 
  BulkAssignRolesDto,
  UpdateAccessControlDto,
  AccessControlWithDetails 
} from '../Interfaces/AccessControlModel';

// List all access control entries (optionally filtered)
export function listAccessControl(params?: {
  userId?: number;
  clinicId?: number;
  roleId?: number;
  isActive?: boolean;
}): Promise<AccessControlModel[]> {
  const queryParams = new URLSearchParams();
  if (params?.userId) queryParams.append('userId', params.userId.toString());
  if (params?.clinicId) queryParams.append('clinicId', params.clinicId.toString());
  if (params?.roleId) queryParams.append('roleId', params.roleId.toString());
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  
  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return request<AccessControlModel[]>(`/Authentication${suffix}`);
}

// Get single access control entry
export function getAccessControl(accessControlId: number): Promise<AccessControlModel> {
  return request<AccessControlModel>(`/Authentication/${accessControlId}`);
}

// Get access control entries with detailed info (joins with User, Clinic, Role tables)
export function getAccessControlWithDetails(params?: {
  userId?: number;
  clinicId?: number;
}): Promise<AccessControlWithDetails[]> {
  const queryParams = new URLSearchParams();
  if (params?.userId) queryParams.append('userId', params.userId.toString());
  if (params?.clinicId) queryParams.append('clinicId', params.clinicId.toString());
  
  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return request<AccessControlWithDetails[]>(`/Authentication/details${suffix}`);
}

// Create single access control entry
export function createAccessControl(payload: CreateAccessControlDto): Promise<AccessControlModel> {
  // Backend expects PascalCase properties and RoleIds as array
  const backendPayload = {
    UserId: payload.userId,
    ClinicId: payload.clinicId,
    RoleIds: [payload.roleId], // Single role as array
    IsActive: payload.isActive ?? true
  };
  
  return request<AccessControlModel>("/Authentication/AssignRoles", {
    method: "POST",
    body: JSON.stringify(backendPayload)
  });
}

// Bulk assign multiple roles to a user in a clinic
// Sends all roles in a single request to match backend model
export async function bulkAssignRoles(payload: BulkAssignRolesDto): Promise<AccessControlModel[]> {
  // Backend expects PascalCase properties: UserId, EnterpriseId, ClinicId, RoleIds, IsActive
  const backendPayload = {
    UserId: payload.userId.toString(),
    EnterpriseId: payload.enterpriseId,
    ClinicId: payload.clinicId,
    RoleIds: payload.roleIds,
    IsActive: payload.isActive ?? true
  };
  
  console.log('📤 Calling AssignRoles API with:', backendPayload);
  
  const result = await request<AccessControlModel[]>("/Authentication/AssignRoles", {
    method: "POST",
    body: JSON.stringify(backendPayload)
  });
  
  console.log('✅ AssignRoles response:', result);
  return result;
}

// Update access control entry (e.g., activate/deactivate)
export function updateAccessControl(
  accessControlId: number, 
  payload: UpdateAccessControlDto
): Promise<AccessControlModel> {
  return request<AccessControlModel>(`/Authentication/${accessControlId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

// Delete access control entry (hard delete)
export function deleteAccessControl(accessControlId: number): Promise<void> {
  return request<void>(`/Authentication/${accessControlId}`, { 
    method: "DELETE" 
  });
}

// Revoke all roles for a user in a specific clinic (sets isActive = false)
export function revokeAllRoles(userId: number, clinicId: number): Promise<void> {
  return request<void>(`/Authentication/revoke`, {
    method: "POST",
    body: JSON.stringify({ userId, clinicId })
  });
}

// Replace all roles for a user in a clinic (removes old, adds new)
export async function replaceUserRoles(payload: BulkAssignRolesDto): Promise<AccessControlModel[]> {
  // Backend expects PascalCase properties: UserId, ClinicId, RoleIds, IsActive
  const backendPayload = {
    UserId: payload.userId,
    ClinicId: payload.clinicId,
    RoleIds: payload.roleIds,
    IsActive: payload.isActive ?? true
  };
  
  return request<AccessControlModel[]>("/Authentication/AssignRoles", {
    method: "POST",
    body: JSON.stringify(backendPayload)
  });
}
