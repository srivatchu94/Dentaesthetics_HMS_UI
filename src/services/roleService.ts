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
  return request<RoleModel[]>("/roles");
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
