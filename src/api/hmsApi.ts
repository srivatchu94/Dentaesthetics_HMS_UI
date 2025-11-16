// HMS API typed client
// Base URL can be configured via Vite env: VITE_API_BASE_URL
// Fallback assumes local ASP.NET backend listening at /api

import type { ClinicModel, StaffModel, ServiceModel, EnterpriseDataModel, EnterpriseModel } from "../Interfaces";

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api";

// Generic helper for JSON requests
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  // some endpoints (like DELETE) might return empty
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Enterprise
export function getEnterpriseData(): Promise<EnterpriseDataModel> {
  return request<EnterpriseDataModel>("/enterprise");
}

export function getEnterprise(id: number): Promise<EnterpriseModel> {
  return request<EnterpriseModel>(`/enterprise/${id}`);
}

// Clinics
export function listClinics(): Promise<ClinicModel[]> {
  return request<ClinicModel[]>("/clinics");
}

export function getClinic(clinicId: number): Promise<ClinicModel> {
  return request<ClinicModel>(`/clinics/${clinicId}`);
}

export interface CreateClinicDto {
  enterpriseId: number;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone: string;
  clinicEmail: string;
  operatingHours: string;
}

export function createClinic(payload: CreateClinicDto): Promise<ClinicModel> {
  return request<ClinicModel>("/clinics", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface UpdateClinicDto extends Partial<CreateClinicDto> {}
export function updateClinic(clinicId: number, payload: UpdateClinicDto): Promise<ClinicModel> {
  return request<ClinicModel>(`/clinics/${clinicId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteClinic(clinicId: number): Promise<void> {
  return request<void>(`/clinics/${clinicId}`, { method: "DELETE" });
}

// Staff
export function listStaff(clinicId?: number): Promise<StaffModel[]> {
  const suffix = clinicId ? `?clinicId=${clinicId}` : "";
  return request<StaffModel[]>(`/staff${suffix}`);
}

export function getStaff(staffId: number): Promise<StaffModel> {
  return request<StaffModel>(`/staff/${staffId}`);
}

export interface CreateStaffDto {
  clinicId: number;
  fullName: string;
  role: string;
  phone: string;
  email: string;
}

export function createStaff(payload: CreateStaffDto): Promise<StaffModel> {
  return request<StaffModel>("/staff", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface UpdateStaffDto extends Partial<CreateStaffDto> {}
export function updateStaff(staffId: number, payload: UpdateStaffDto): Promise<StaffModel> {
  return request<StaffModel>(`/staff/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteStaff(staffId: number): Promise<void> {
  return request<void>(`/staff/${staffId}`, { method: "DELETE" });
}

// Services
export function listServices(clinicId?: number): Promise<ServiceModel[]> {
  const suffix = clinicId ? `?clinicId=${clinicId}` : "";
  return request<ServiceModel[]>(`/services${suffix}`);
}

export function getService(serviceId: number): Promise<ServiceModel> {
  return request<ServiceModel>(`/services/${serviceId}`);
}

export interface CreateServiceDto {
  clinicId: number;
  serviceName: string;
  description: string;
  price: number;
}

export function createService(payload: CreateServiceDto): Promise<ServiceModel> {
  return request<ServiceModel>("/services", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {}
export function updateService(serviceId: number, payload: UpdateServiceDto): Promise<ServiceModel> {
  return request<ServiceModel>(`/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteService(serviceId: number): Promise<void> {
  return request<void>(`/services/${serviceId}`, { method: "DELETE" });
}

// Example usage (remove when integrating):
// import { listClinics } from "../api/hmsApi";
// useEffect(() => { listClinics().then(setClinics).catch(console.error); }, []);
