// PatientVisitInformation interface matching API model
export interface PatientVisitInformation {
  visitId: number;
  patientId: number;
  clinicId: number;
  visitDate: string; // ISO date string
  reasonForVisit: string;
  diagnoses: string;
  treatments: string;
  prescriptions: string;
  notes: string; // Required field
  nextAppointmentDate: string; // ISO date string
  attendingPhysician: string;
  billingAmount: number; // decimal in C# maps to number in TS
  paymentStatus: string;
}
