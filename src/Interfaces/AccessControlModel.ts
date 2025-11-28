// AccessControlModel interface for role mapping table
// Maps users to roles within specific clinics
export interface AccessControlModel {
  accessControlId: number;
  userId: number;
  clinicId: number;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// DTO for creating access control entries
export interface CreateAccessControlDto {
  userId: number;
  clinicId: number;
  roleId: number;
  isActive?: boolean; // defaults to true on backend
}

// DTO for bulk role assignment (multiple roles for one user)
export interface BulkAssignRolesDto {
  userId: number;
  clinicId: number;
  roleIds: number[]; // Array of role IDs to assign
  isActive?: boolean;
}

// DTO for updating access control
export interface UpdateAccessControlDto {
  isActive?: boolean;
  roleId?: number;
}

// Response model with additional details
export interface AccessControlWithDetails extends AccessControlModel {
  userName?: string;
  clinicName?: string;
  roleName?: string;
}
