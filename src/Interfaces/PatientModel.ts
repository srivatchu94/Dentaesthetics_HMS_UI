// Import related interfaces
import { PatientContact } from './PatientContactModel';
import { PatientMedicalInfo } from './PatientMedicalInfoModel';
import { PatientInsurance } from './PatientInsuranceModel';

// Patient interface matching API model
export interface Patient {
  patientId: number;
  clinicID: string;
  patientEntityID?: string; // Optional for backward compatibility
  patientFirstName: string;
  patientLastName: string;
  patientDOB: string; // ISO date string
  patientGender: string;
  patientBloodType: string;
}

// PatientDataModel - main container for all patient information
export interface PatientDataModel {
  patient: Patient;
  patientContact: PatientContact;
  patientMedicalInfo: PatientMedicalInfo;
  patientInsurance: PatientInsurance;
}
