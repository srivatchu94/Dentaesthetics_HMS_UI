// Patient API Service
import { request } from './apiClient';
import type { PatientDataModel } from '../Interfaces/PatientModel';

// Helper function to transform API response from new format to expected format
const transformPatientData = (data: any): PatientDataModel => {
  if (!data) return data;
  
  // Check if data is in new format (has nested structure)
  if (data.patient || data.patientContact) {
    return {
      ...data.patient,
      patientId: data.patient?.patientId,
      patientFirstName: data.patient?.patientFirstName,
      patientLastName: data.patient?.patientLastName,
      patientDOB: data.patient?.patientDOB,
      patientGender: data.patient?.patientGender,
      patientBloodType: data.patient?.patientBloodType,
      clinicID: data.patient?.clinicID,
      patientPhoneNumber: data.patientContact?.patientPhone,
      patientEmail: data.patientContact?.patientEmail,
      patientAddress: data.patientContact?.patientAddress,
      patientPhone: data.patientContact?.patientPhone,
      // Map to both formats for compatibility
      firstName: data.patient?.patientFirstName,
      lastName: data.patient?.patientLastName,
      dateOfBirth: data.patient?.patientDOB,
      gender: data.patient?.patientGender,
      bloodType: data.patient?.patientBloodType,
      clinicId: data.patient?.clinicID,
      phoneNumber: data.patientContact?.patientPhone,
      email: data.patientContact?.patientEmail,
      address: data.patientContact?.patientAddress,
      // Include medical info if available
      ...data.patientMedicalInfo,
      // Include insurance info if available
      ...data.patientInsurance
    } as PatientDataModel;
  }
  
  // Return as-is if already in expected format
  return data;
};

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
  return request<void>(`/Patient/${patientId}`, {
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
  
  return request<any[]>(`/Patient/Patientsearch?${queryParams.toString()}`).then(response => {
    // Transform the response from new API format to expected format
    if (Array.isArray(response)) {
      return response.map(item => transformPatientData(item));
    }
    return [transformPatientData(response)];
  });
}

export function getAllPatientsByClinicID(clinicId: number): Promise<PatientDataModel[]> {
  return request<PatientDataModel[]>(`/Patient/clinic/${clinicId}`);
}

export function getPatientVisit(appointmentId: number): Promise<any> {
  return request<any>(`/Patient/GetPatientVisit?AppointmentID=${appointmentId}`, {
    method: "POST"
  });
}

export function editPatientVisit(visitData: any): Promise<any> {
  return request<any>("/Patient/EditPatientVisit", {
    method: "POST",
    body: JSON.stringify(visitData)
  });
}

export function getPatientMedicalInfoSummary(patientId: number): Promise<any> {
  return request<any>(`/Patient/GetMedicalInfoSummary?patientId=${patientId}`);
}
