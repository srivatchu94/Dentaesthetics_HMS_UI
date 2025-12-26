// Clinic API Service
import { request } from './apiClient';
import type { ClinicModel } from '../Interfaces';

export interface CreateClinicDto {
  clinicId: number;
  enterpriseId: number;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone: string;
  clinicEmail: string;
  operatingHours: string;
}

export interface UpdateClinicDto extends Partial<CreateClinicDto> {}

export function listClinics(): Promise<ClinicModel[]> {
  return request<ClinicModel[]>("/Clinic/GetAllClinics");
}

export function getClinic(clinicId: number): Promise<ClinicModel> {
  return request<ClinicModel>(`/Clinic/GetClinicByID?id=${clinicId}`);
}

// Get clinics by Enterprise ID
// Backend endpoint expects `id` query param to be the Enterprise ID
export function getClinicsByEnterpriseId(enterpriseId: number): Promise<ClinicModel[]> {
  return request<ClinicModel[]>(`/Clinic/GetClinicByID?id=${enterpriseId}`);
}

export function createClinic(payload: CreateClinicDto): Promise<ClinicModel> {
  const clinicModel: ClinicModel = {
    clinicId: payload.clinicId,
    enterpriseId: payload.enterpriseId,
    clinicName: payload.clinicName,
    clinicAddress: payload.clinicAddress,
    clinicCity: payload.clinicCity,
    clinicPhone: payload.clinicPhone,
    clinicEmail: payload.clinicEmail,
    operatingHours: payload.operatingHours
  };
  return request<ClinicModel>("/Clinic/CreateClinic", {
    method: "POST",
    body: JSON.stringify(clinicModel)
  });
}

export function updateClinic(clinicId: number, clinic: ClinicModel): Promise<ClinicModel> {
  return request<ClinicModel>(`/Clinic/${clinicId}`, {
    method: "PUT",
    body: JSON.stringify(clinic)
  });
}

export function deleteClinic(clinicId: number): Promise<void> {
  return request<void>(`/Clinic/${clinicId}`, { method: "DELETE" });
}

// Get clinic by ClinicId (new endpoint from user requirement)
// Backend endpoint: GetClinicByClinicId with List<int> id parameter
export function getClinicByClinicId(clinicIds: number[]): Promise<ClinicModel[]> {
  const endpoint = `/Clinic/GetClinicByClinicId?${clinicIds.map(id => `id=${id}`).join('&')}`;
  console.log('📞 API CALL: getClinicByClinicId with IDs:', clinicIds);
  return request<ClinicModel[]>(endpoint);
}
