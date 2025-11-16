// PatientModel interface for core patient demographic information
export interface PatientModel {
  patientId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender: string;
  bloodGroup?: string;
  maritalStatus?: string;
  registrationDate: string; // ISO date string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
