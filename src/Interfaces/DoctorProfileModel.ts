// DoctorProfileModel interface migrated to Interfaces folder
export interface DoctorProfileModel {
  doctorId: number;
  staffId: number;

  // Personal details
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;

  // Contact details
  email: string;
  phone: string;
  address: string;

  // Professional details
  licenseNumber: string;
  licenseExpiry: string;
  specialtyId: number;
  yearsExperience: number | null;
  education: string;
  certifications: string;
  languages: string;

  // Employment details
  joiningDate: string;
  employmentStatus: string; // Full-time, Part-time, Visiting
  availability: string; // Days/Hours

  // Compliance & legal
  insuranceDetails: string;
  emergencyContact: string;

  // Patient-facing info
  bio: string;
  profilePhotoUrl: string;
  achievements: string;
  publications: string;
  socialLinks: string;

  // System tracking
  branchId: number;
  role: string; // Doctor, Admin, Staff
  createdAt: string;
  updatedAt: string;
}
