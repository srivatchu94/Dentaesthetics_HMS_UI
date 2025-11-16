// PatientMedicalInfoModel interface for medical history
export interface PatientMedicalInfoModel {
  medicalInfoId: number;
  patientId: number;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  pastSurgeries?: string;
  familyMedicalHistory?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  exerciseFrequency?: string;
  dietaryRestrictions?: string;
  lastDentalVisit?: string; // ISO date string or null
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
