// PatientMedicalInfo interface matching API model
export interface PatientMedicalInfo {
  patientId: number;
  patientMedicalHistory: string;
  patientAllergies: string;
  patientCurrentMedications: string;
  patientPrimaryPhysician: string;
  no_of_visits: number;
  lastVisitedDate: string; // ISO date string
  chronicDiseases: string;
  medicalHistory: string;
}
