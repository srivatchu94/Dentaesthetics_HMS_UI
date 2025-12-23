// StaffDetailsModel interface migrated to Interfaces folder
export interface StaffDetailsModel {
  staffId: number;
  enterpriseId?: number | null;
  clinicId?: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string;
  email: string;
  phone: string;
  phoneNumber?: string; // Legacy field
  address?: string;
  licenseNumber?: string;
  licenseExpiry?: string | null; // ✅ Added
  specialtyId?: number | null; // ✅ Added
  yearsExperience?: number | null; // ✅ Added
  education?: string;
  certifications?: string;
  languages?: string;
  joiningDate?: string | null;
  employmentStatus?: string;
  availability?: string;
  insuranceDetails?: string;
  emergencyContact?: string;
  bio?: string;
  profilePhotoUrl?: string;
  achievements?: string;
  publications?: string;
  socialLinks?: string;
  rolesAssigned?: number | null;
  // Legacy fields
  roleId?: number;
  department?: string;
  hireDate?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
