// DoctorClinicMapping interface matching C# API model
export interface DoctorClinicMapping {
  // Foreign Keys
  doctorId: number;
  clinicId: number;

  // Flags
  isActive: boolean;

  // Context / Role
  doctorRole?: string;          // Consultant, Visiting Specialist, Resident
  specialty?: string;           // Doctor's specialty in this clinic

  // Schedule / Availability
  startDate?: string;           // ISO date string - Effective start date of mapping
  endDate?: string;             // ISO date string - Expiry date of mapping
  availableDays?: string;       // e.g., "Mon, Wed, Fri"

  // Operational Flags
  isPrimaryClinic?: boolean;    // Flag for doctor's main clinic
  consultationType?: string;    // In-person, Telehealth, Hybrid

  // Audit Columns
  createdBy: string;            // User/system who created mapping
  createdAt: string;            // ISO date string - UTC timestamp
  updatedBy?: string;           // User/system who last updated mapping
  updatedAt: string;            // ISO date string - UTC timestamp
}
