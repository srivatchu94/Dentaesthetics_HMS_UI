// API Models for Staff Detail endpoints

export interface CreateRoleBasedProfileRequest {
  enterpriseID: number;
  clinicID: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  specialtyId?: number | null;
  yearsExperience: number;
  education: string;
  certifications: string;
  languages: string;
  joiningDate: string;
  employmentStatus: string;
  availability: string;
  insuranceDetails: string;
  emergencyContact: string;
  bio: string;
  profilePhotoUrl: string;
  achievements: string;
  publications: string;
  socialLinks: string;
  createdAt: string;
  updatedAt: string;
  rolesAssigned: string;
}

export interface RoleBasedProfile {
  staffId: number;
  enterpriseID: number;
  clinicID: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  specialtyId: number | null;
  yearsExperience: number;
  education: string;
  certifications: string;
  languages: string;
  joiningDate: string;
  employmentStatus: string;
  availability: string;
  insuranceDetails: string;
  emergencyContact: string;
  bio: string;
  profilePhotoUrl: string;
  achievements: string;
  publications: string;
  socialLinks: string;
  createdAt: string;
  updatedAt: string;
  rolesAssigned: string | null;
}

export interface RoleBasedProfilesResponse extends Array<RoleBasedProfile> {}

export type RoleType = "entityadmin" | "staff" | "clinicadmin" | "Doctor" | string;
