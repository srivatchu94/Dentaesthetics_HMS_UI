export interface ClinicModel {
  clinicId: number;
  enterpriseId: number;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone: string;
  clinicEmail: string;
  operatingHours: string;
  registrationNumber?: string;
  gstNumber?: string;
}
