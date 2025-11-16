import type { EnterpriseModel } from "./EnterpriseModel";
import type { ClinicModel } from "./ClinicModel";
import type { StaffModel } from "./StaffModel";
import type { ServiceModel } from "./ServiceModel";

export interface EnterpriseDataModel {
  enterprise: EnterpriseModel;
  clinics: ClinicModel[];
  staffs: StaffModel[];
  services: ServiceModel[];
}
