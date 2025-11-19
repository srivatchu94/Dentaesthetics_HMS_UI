// Prescription interface
export interface Prescription {
  prescriptionId?: number;
  visitId: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  doctorRegistrationNumber: string;
  prescriptionDate: string; // ISO date string
  prescriptionContent: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
