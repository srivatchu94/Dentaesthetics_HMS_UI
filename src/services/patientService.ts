// Patient API Service
import { request } from './apiClient';
import type { PatientDataModel } from '../Interfaces/PatientModel';

export function listPatients(): Promise<PatientDataModel[]> {
  return request<PatientDataModel[]>("/Patient/GetAllPatients");
}

export function getPatient(patientId: number): Promise<PatientDataModel> {
  return request<PatientDataModel>(`/Patient/GetPatientByID?id=${patientId}`);
}

export function createPatient(payload: PatientDataModel): Promise<PatientDataModel> {
  return request<PatientDataModel>("/Patient/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePatient(patientId: number, payload: PatientDataModel): Promise<PatientDataModel> {
  return request<PatientDataModel>(`/Patient/UpdatePatient?id=${patientId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePatient(patientId: number): Promise<void> {
  return request<void>(`/Patient/DeletePatient?id=${patientId}`, {
    method: "DELETE"
  });
}

export function getPatientsByClinic(clinicId: number): Promise<PatientDataModel[]> {
  return request<PatientDataModel[]>(`/Patient/clinic/${clinicId}`);
}

export async function getPatientFullProfile(patientId: number): Promise<PatientDataModel> {
  const response = await request<PatientDataModel[]>(`/Patient/details/fullProfile?patientId=${patientId}`);
  // API returns an array with one element, extract the first element
  return Array.isArray(response) && response.length > 0 ? response[0] : response as any;
}

export function updatePatientFullProfile(payload: PatientDataModel): Promise<PatientDataModel> {
  return request<PatientDataModel>("/Patient/details/UpdatefullProfile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function searchPatients(params: {
  patientId?: number;
  clinicId?: number;
  firstName?: string;
  lastName?: string;
  dob?: string;
}): Promise<PatientDataModel[]> {
  const queryParams = new URLSearchParams();
  
  if (params.patientId) queryParams.append('patientId', params.patientId.toString());
  if (params.clinicId) queryParams.append('clinicId', params.clinicId.toString());
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  if (params.dob) queryParams.append('dob', params.dob);
  
  return request<PatientDataModel[]>(`/Patient/Patientsearch?${queryParams.toString()}`);
}
