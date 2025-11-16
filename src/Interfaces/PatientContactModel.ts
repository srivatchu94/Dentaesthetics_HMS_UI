// PatientContactModel interface for patient contact details
export interface PatientContactModel {
  contactId: number;
  patientId: number;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  createdAt: string;
  updatedAt: string;
}
