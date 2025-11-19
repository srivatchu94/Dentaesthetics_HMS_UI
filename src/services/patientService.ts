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
