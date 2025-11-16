// HMS API typed client (renamed folder: services)
// Base URL can be configured via Vite env: VITE_API_BASE_URL
// Fallback assumes local ASP.NET backend listening at /api

import type { ClinicModel, StaffModel, ServiceModel, EnterpriseDataModel, EnterpriseModel, ClinicalSpecialtyModel, RoleModel } from "../Interfaces";
import type { DoctorProfileModel } from "../Interfaces/DoctorProfileModel";
import type { StaffDetailsModel } from "../Interfaces/StaffDetailsModel";

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api";

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
export function listClinics(): Promise<ClinicModel[]> { return request<ClinicModel[]>("/clinics"); }
export function getClinic(clinicId: number): Promise<ClinicModel> { return request<ClinicModel>(`/clinics/${clinicId}`); }
export interface CreateClinicDto { enterpriseId: number; clinicName: string; clinicAddress: string; clinicCity: string; clinicPhone: string; clinicEmail: string; operatingHours: string; }
export function createClinic(payload: CreateClinicDto): Promise<ClinicModel> { return request<ClinicModel>("/clinics", { method: "POST", body: JSON.stringify(payload) }); }
export interface UpdateClinicDto extends Partial<CreateClinicDto> {}
export function updateClinic(clinicId: number, payload: UpdateClinicDto): Promise<ClinicModel> { return request<ClinicModel>(`/clinics/${clinicId}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteClinic(clinicId: number): Promise<void> { return request<void>(`/clinics/${clinicId}`, { method: "DELETE" }); }

// Staff
export function listStaff(clinicId?: number): Promise<StaffModel[]> { const suffix = clinicId ? `?clinicId=${clinicId}` : ""; return request<StaffModel[]>(`/staff${suffix}`); }
export function getStaff(staffId: number): Promise<StaffModel> { return request<StaffModel>(`/staff/${staffId}`); }
export interface CreateStaffDto { clinicId: number; fullName: string; role: string; phone: string; email: string; }
export function createStaff(payload: CreateStaffDto): Promise<StaffModel> { return request<StaffModel>("/staff", { method: "POST", body: JSON.stringify(payload) }); }
export interface UpdateStaffDto extends Partial<CreateStaffDto> {}
export function updateStaff(staffId: number, payload: UpdateStaffDto): Promise<StaffModel> { return request<StaffModel>(`/staff/${staffId}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteStaff(staffId: number): Promise<void> { return request<void>(`/staff/${staffId}`, { method: "DELETE" }); }

// Services
export function listServices(clinicId?: number): Promise<ServiceModel[]> { const suffix = clinicId ? `?clinicId=${clinicId}` : ""; return request<ServiceModel[]>(`/services${suffix}`); }
export function getService(serviceId: number): Promise<ServiceModel> { return request<ServiceModel>(`/services/${serviceId}`); }
export interface CreateServiceDto { clinicId: number; serviceName: string; description: string; price: number; }
export function createService(payload: CreateServiceDto): Promise<ServiceModel> { return request<ServiceModel>("/services", { method: "POST", body: JSON.stringify(payload) }); }
export interface UpdateServiceDto extends Partial<CreateServiceDto> {}
export function updateService(serviceId: number, payload: UpdateServiceDto): Promise<ServiceModel> { return request<ServiceModel>(`/services/${serviceId}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteService(serviceId: number): Promise<void> { return request<void>(`/services/${serviceId}`, { method: "DELETE" }); }

// Staff Details
export function listStaffDetails(): Promise<StaffDetailsModel[]> { return request<StaffDetailsModel[]>("/staffdetails"); }
export function getStaffDetail(staffId: number): Promise<StaffDetailsModel> { return request<StaffDetailsModel>(`/staffdetails/${staffId}`); }

// Doctor Profiles
export function listDoctorProfiles(): Promise<DoctorProfileModel[]> { return request<DoctorProfileModel[]>("/doctorprofiles"); }
export function getDoctorProfile(doctorId: number): Promise<DoctorProfileModel> { return request<DoctorProfileModel>(`/doctorprofiles/${doctorId}`); }

// Clinical Specialties
export function listClinicalSpecialties(): Promise<ClinicalSpecialtyModel[]> { return request<ClinicalSpecialtyModel[]>("/clinicalspecialties"); }
export function getClinicalSpecialty(specialtyId: number): Promise<ClinicalSpecialtyModel> { return request<ClinicalSpecialtyModel>(`/clinicalspecialties/${specialtyId}`); }
export interface CreateClinicalSpecialtyDto { department: string; clinicalArea: string; }
export function createClinicalSpecialty(payload: CreateClinicalSpecialtyDto): Promise<ClinicalSpecialtyModel> { return request<ClinicalSpecialtyModel>("/clinicalspecialties", { method: "POST", body: JSON.stringify(payload) }); }
export interface UpdateClinicalSpecialtyDto extends Partial<CreateClinicalSpecialtyDto> {}
export function updateClinicalSpecialty(specialtyId: number, payload: UpdateClinicalSpecialtyDto): Promise<ClinicalSpecialtyModel> { return request<ClinicalSpecialtyModel>(`/clinicalspecialties/${specialtyId}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteClinicalSpecialty(specialtyId: number): Promise<void> { return request<void>(`/clinicalspecialties/${specialtyId}`, { method: "DELETE" }); }

// Roles
export function listRoles(): Promise<RoleModel[]> { return request<RoleModel[]>("/roles"); }
export function getRole(roleId: number): Promise<RoleModel> { return request<RoleModel>(`/roles/${roleId}`); }
export interface CreateRoleDto { roleName: string; description: string; isClinical: boolean; }
export function createRole(payload: CreateRoleDto): Promise<RoleModel> { return request<RoleModel>("/roles", { method: "POST", body: JSON.stringify(payload) }); }
export interface UpdateRoleDto extends Partial<CreateRoleDto> {}
export function updateRole(roleId: number, payload: UpdateRoleDto): Promise<RoleModel> { return request<RoleModel>(`/roles/${roleId}`, { method: "PUT", body: JSON.stringify(payload) }); }
export function deleteRole(roleId: number): Promise<void> { return request<void>(`/roles/${roleId}`, { method: "DELETE" }); }

// Usage example:
// import { listClinics } from "../services";
// useEffect(() => { listClinics().then(setClinics).catch(console.error); }, []);
