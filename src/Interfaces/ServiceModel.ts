import type { ClinicModel } from "./ClinicModel";

export interface ServiceModel {
  serviceId: number;
  clinicId: number; // Foreign key
  serviceName: string;
  description: string;
  price: number; // decimal -> number in TS

  // optional navigation property
  clinic?: ClinicModel;
}
