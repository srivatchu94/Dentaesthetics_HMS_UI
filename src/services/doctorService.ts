// Doctor/Clinical API Service
import { request } from './apiClient';
import type { DoctorProfileModel, ClinicalSpecialtyModel } from '../Interfaces';

// Doctor Profiles
export function listDoctorProfiles(): Promise<DoctorProfileModel[]> {
  return request<DoctorProfileModel[]>("/doctorprofiles");
}

export function getDoctorProfile(doctorId: number): Promise<DoctorProfileModel> {
  return request<DoctorProfileModel>(`/doctorprofiles/${doctorId}`);
}

// Clinical Specialties
export interface CreateClinicalSpecialtyDto {
  department: string;
  clinicalArea: string;
}

export interface UpdateClinicalSpecialtyDto extends Partial<CreateClinicalSpecialtyDto> {}

export function listClinicalSpecialties(): Promise<ClinicalSpecialtyModel[]> {
  return request<ClinicalSpecialtyModel[]>("/clinicalspecialties");
}

export function getClinicalSpecialty(specialtyId: number): Promise<ClinicalSpecialtyModel> {
  return request<ClinicalSpecialtyModel>(`/clinicalspecialties/${specialtyId}`);
}

export function createClinicalSpecialty(payload: CreateClinicalSpecialtyDto): Promise<ClinicalSpecialtyModel> {
  return request<ClinicalSpecialtyModel>("/clinicalspecialties", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateClinicalSpecialty(specialtyId: number, payload: UpdateClinicalSpecialtyDto): Promise<ClinicalSpecialtyModel> {
  return request<ClinicalSpecialtyModel>(`/clinicalspecialties/${specialtyId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteClinicalSpecialty(specialtyId: number): Promise<void> {
  return request<void>(`/clinicalspecialties/${specialtyId}`, { method: "DELETE" });
}
