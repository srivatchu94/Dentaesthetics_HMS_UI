import type { ClinicModel } from "./ClinicModel";

export interface StaffModel {
  staffId: number;
  clinicId: number; // Foreign key
  fullName: string;
  role: string; // e.g., Dentist, Receptionist
  phone: string;
  email: string;

  // optional navigation property
  clinic?: ClinicModel;
}
