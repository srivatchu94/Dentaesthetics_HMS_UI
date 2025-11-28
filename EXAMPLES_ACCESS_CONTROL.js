// Example: How to fetch and display existing role assignments for a staff member

import { listAccessControl, getAccessControlWithDetails } from '../services/accessControlService';

// ============================================
// Example 1: Get all roles for a specific user
// ============================================
async function getUserRoles(userId, clinicId) {
  try {
    const assignments = await listAccessControl({ 
      userId: userId, 
      clinicId: clinicId,
      isActive: true  // Only get active roles
    });
    
    console.log('User roles:', assignments);
    // Returns array of AccessControlModel objects
    // [
    //   { accessControlId: 1, userId: 1006, clinicId: 1005, roleId: 2, isActive: true, ... },
    //   { accessControlId: 2, userId: 1006, clinicId: 1005, roleId: 5, isActive: true, ... }
    // ]
    
    return assignments;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

// ============================================
// Example 2: Get role assignments with details (with role names, clinic names, etc.)
// ============================================
async function getUserRolesWithDetails(userId, clinicId) {
  try {
    const detailedAssignments = await getAccessControlWithDetails({ 
      userId: userId, 
      clinicId: clinicId 
    });
    
    console.log('Detailed roles:', detailedAssignments);
    // Returns array with additional fields:
    // [
    //   { 
    //     accessControlId: 1, 
    //     userId: 1006, 
    //     userName: "Rajesh Kumar",
    //     clinicId: 1005, 
    //     clinicName: "Main Branch",
    //     roleId: 2, 
    //     roleName: "Clinic Admin",
    //     isActive: true, 
    //     ...
    //   }
    // ]
    
    return detailedAssignments;
  } catch (error) {
    console.error('Error fetching detailed roles:', error);
    return [];
  }
}

// ============================================
// Example 3: Show existing roles when opening role manager
// ============================================
const handleOpenRoleManager = async (staff) => {
  setSelectedStaff(staff);
  setShowRoleManager(true);
  
  // Fetch existing role assignments from backend
  try {
    const userId = staff.id;
    const clinicId = parseInt(staff.clinicId.replace('C', ''));
    
    const existingRoles = await listAccessControl({ 
      userId: userId, 
      clinicId: clinicId,
      isActive: true 
    });
    
    // Pre-select roles that user already has
    const preselectedRoles = availableRoles.filter(role => 
      existingRoles.some(assignment => assignment.roleId === role.id)
    );
    
    setSelectedRoles(preselectedRoles);
    
  } catch (error) {
    console.error('Error loading existing roles:', error);
  }
};

// ============================================
// Example 4: Display user's current roles in search results
// ============================================
const fetchStaffWithRoles = async () => {
  try {
    // 1. Get staff data (from your existing API)
    const staffList = await listStaff();
    
    // 2. For each staff member, fetch their roles
    const staffWithRoles = await Promise.all(
      staffList.map(async (staff) => {
        const roles = await listAccessControl({ 
          userId: staff.staffId, 
          clinicId: staff.clinicId,
          isActive: true 
        });
        
        return {
          ...staff,
          assignedRoles: roles,
          roleCount: roles.length
        };
      })
    );
    
    setSearchResults(staffWithRoles);
    
  } catch (error) {
    console.error('Error fetching staff with roles:', error);
  }
};

// ============================================
// Example 5: Check if user has specific permission
// ============================================
async function userHasPermission(userId, clinicId, requiredPermission) {
  try {
    // Get user's roles
    const assignments = await listAccessControl({ 
      userId: userId, 
      clinicId: clinicId,
      isActive: true 
    });
    
    // Get role IDs
    const userRoleIds = assignments.map(a => a.roleId);
    
    // Check if any of their roles has the required permission
    const hasPermission = availableRoles
      .filter(role => userRoleIds.includes(role.id))
      .some(role => role.permissions.includes(requiredPermission));
    
    return hasPermission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// ============================================
// Example 6: Revoke all roles when staff leaves
// ============================================
import { revokeAllRoles } from '../services/accessControlService';

async function deactivateStaffAccess(userId, clinicId) {
  try {
    await revokeAllRoles(userId, clinicId);
    alert('All roles revoked successfully');
  } catch (error) {
    console.error('Error revoking roles:', error);
    alert('Failed to revoke roles');
  }
}

// ============================================
// Example 7: Update single role (activate/deactivate)
// ============================================
import { updateAccessControl } from '../services/accessControlService';

async function toggleRoleStatus(accessControlId, isActive) {
  try {
    await updateAccessControl(accessControlId, { isActive: isActive });
    console.log(`Role ${isActive ? 'activated' : 'deactivated'}`);
  } catch (error) {
    console.error('Error updating role:', error);
  }
}

// ============================================
// Example 8: Replace all roles (remove old, add new)
// ============================================
import { replaceUserRoles } from '../services/accessControlService';

async function updateUserRoles(userId, clinicId, newRoleIds) {
  try {
    // This will deactivate all existing roles and assign new ones
    const result = await replaceUserRoles({
      userId: userId,
      clinicId: clinicId,
      roleIds: newRoleIds,
      isActive: true
    });
    
    console.log('Roles replaced:', result);
    return result;
  } catch (error) {
    console.error('Error replacing roles:', error);
    throw error;
  }
}

// ============================================
// Example 9: Get all staff members with a specific role
// ============================================
async function getStaffByRole(roleId, clinicId) {
  try {
    const assignments = await listAccessControl({ 
      roleId: roleId,
      clinicId: clinicId,
      isActive: true 
    });
    
    // Extract unique user IDs
    const userIds = [...new Set(assignments.map(a => a.userId))];
    
    console.log(`Found ${userIds.length} staff members with role ${roleId}`);
    return userIds;
  } catch (error) {
    console.error('Error fetching staff by role:', error);
    return [];
  }
}

// ============================================
// Example 10: Audit log - Get all role changes
// ============================================
async function getRoleAuditLog(userId, clinicId) {
  try {
    // Get all assignments (including inactive ones)
    const allAssignments = await listAccessControl({ 
      userId: userId, 
      clinicId: clinicId
      // Don't filter by isActive to see history
    });
    
    // Sort by date
    const sortedLog = allAssignments.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    console.log('Role change history:', sortedLog);
    return sortedLog;
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return [];
  }
}

export {
  getUserRoles,
  getUserRolesWithDetails,
  handleOpenRoleManager,
  fetchStaffWithRoles,
  userHasPermission,
  deactivateStaffAccess,
  toggleRoleStatus,
  updateUserRoles,
  getStaffByRole,
  getRoleAuditLog
};
