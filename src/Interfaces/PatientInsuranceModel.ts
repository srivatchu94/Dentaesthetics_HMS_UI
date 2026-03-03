// PatientInsurance interface matching API model
export interface PatientInsurance {
  patientId: number;
  patientInsuranceProvider: string;

  insuranceProviderId?: number | null;

  policyNumber?: string | null;
  groupNumber?: string | null;
  policyHolderName?: string | null;
  relationshipToPolicyHolder?: string | null;

  insurancePhone?: string | null;
  providerEmail?: string | null;
  providerAddress?: string | null;

  coverageStartDate?: string | null;
  coverageEndDate?: string | null;

  copayAmount?: number | null;
  deductibleAmount?: number | null;
  coveragePercentage?: number | null;

  isPrimary?: boolean;

  createdAt?: string;
  updatedAt?: string;
} 