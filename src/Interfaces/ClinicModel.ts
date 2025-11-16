export interface ClinicModel {
  clinicId: number;
  enterpriseId: number; // Foreign key
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone: string;
  clinicEmail: string;
  operatingHours: string;
}
