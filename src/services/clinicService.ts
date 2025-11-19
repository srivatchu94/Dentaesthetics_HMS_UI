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

export function updateClinic(clinicId: number, payload: UpdateClinicDto): Promise<ClinicModel> {
  return request<ClinicModel>(`/Clinic/UpdateClinic?id=${clinicId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteClinic(clinicId: number): Promise<void> {
  return request<void>(`/clinics/${clinicId}`, { method: "DELETE" });
}
