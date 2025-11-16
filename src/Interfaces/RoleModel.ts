// RoleModel interface mapped from C# RoleModel
// DateTime -> ISO 8601 string from API
export interface RoleModel {
  roleId: number;
  roleName: string;
  description: string;
  isClinical: boolean;
  createdAt: string;
  updatedAt: string;
}
