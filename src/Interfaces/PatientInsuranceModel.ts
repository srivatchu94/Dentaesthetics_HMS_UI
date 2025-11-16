// PatientInsuranceModel interface for insurance information
export interface PatientInsuranceModel {
  insuranceId: number;
  patientId: number;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber?: string;
  policyHolderName: string;
  policyHolderRelation: string;
  coverageStartDate: string; // ISO date string
  coverageEndDate?: string; // ISO date string or null
  isPrimaryInsurance: boolean;
  copayAmount?: number;
  deductibleAmount?: number;
  coveragePercentage?: number;
  insurancePhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
