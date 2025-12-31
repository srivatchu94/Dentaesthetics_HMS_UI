// Role API Service
import { request } from './apiClient';
import type { RoleModel } from '../Interfaces';

export interface CreateRoleDto {
  roleName: string;
  description: string;
  isClinical: boolean;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export function listRoles(): Promise<RoleModel[]> {
  // 📋 Using RoleMasterController.GetAllRoles() endpoint
  console.log("📋 Fetching roles from RoleMaster/GetAllRoles API...");
  return request<RoleModel[]>("/RoleMaster/GetAllRoles");
}

// Roles available for Staff module (used in View Staff, Onboarding, etc.)
export function listRolesForStaff(): Promise<RoleModel[]> {
  console.log("📋 Fetching roles from RoleMaster/GetAllRolesForStaff API...");
  return request<RoleModel[]>("/RoleMaster/GetAllRolesForStaff");
}

export function getRole(roleId: number): Promise<RoleModel> {
  return request<RoleModel>(`/roles/${roleId}`);
}

export function createRole(payload: CreateRoleDto): Promise<RoleModel> {
  return request<RoleModel>("/roles", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateRole(roleId: number, payload: UpdateRoleDto): Promise<RoleModel> {
  return request<RoleModel>(`/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteRole(roleId: number): Promise<void> {
  return request<void>(`/roles/${roleId}`, { method: "DELETE" });
}
