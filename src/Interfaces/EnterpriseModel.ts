import type { ClinicModel } from "./ClinicModel";

export interface EnterpriseModel {
  enterpriseId: number;
  enterpriseName: string;
  headquartersLocation: string;
  contactPhone: string;
  contactEmail: string;

  // Navigation property for related clinics (optional)
  clinics?: ClinicModel[];
}
