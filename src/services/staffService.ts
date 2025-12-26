// Staff API Service
import { request } from './apiClient';
import type { StaffModel, StaffDetailsModel } from '../Interfaces';

export interface CreateStaffDto {
  clinicId: number;
  fullName: string;
  role: string;
  phone: string;
  email: string;
}

export interface CreateStaffDetailDto {
  staffId?: number;
  enterpriseId?: number;
  clinicId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  email: string;
  phone: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiry?: string; // ✅ DateTime on backend
  specialtyId?: number; // ✅ int? on backend
  yearsExperience?: number; // ✅ int? on backend
  education?: string;
  certifications?: string;
  languages?: string;
  joiningDate?: string;
  employmentStatus?: string;
  availability?: string;
  insuranceDetails?: string;
  emergencyContact?: string;
  bio?: string;
  profilePhotoUrl?: string;
  achievements?: string;
  publications?: string;
  socialLinks?: string;
  rolesAssigned?: string; // ✅ string? on backend (not int)
}

export interface UpdateStaffDto extends Partial<CreateStaffDto> {}

export function listStaff(clinicId?: number): Promise<StaffModel[]> {
  const suffix = clinicId ? `?clinicId=${clinicId}` : "";
  return request<StaffModel[]>(`/staff${suffix}`);
}

export function getStaff(staffId: number): Promise<StaffModel> {
  return request<StaffModel>(`/staff/${staffId}`);
}

export function createStaff(payload: CreateStaffDto): Promise<StaffModel> {
  return request<StaffModel>("/staff", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateStaff(staffId: number, payload: UpdateStaffDto): Promise<StaffModel> {
  return request<StaffModel>(`/staff/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteStaff(staffId: number): Promise<void> {
  return request<void>(`/staff/${staffId}`, { method: "DELETE" });
}

// Staff Details
export function listStaffDetails(): Promise<StaffDetailsModel[]> {
  return request<StaffDetailsModel[]>("/staffdetails");
}

export function getStaffDetail(staffId: number): Promise<StaffDetailsModel> {
  return request<StaffDetailsModel>(`/staffdetails/${staffId}`);
}

export function createStaffDetail(payload: CreateStaffDetailDto): Promise<StaffDetailsModel> {
  // 🔍 DEBUG LOGGING - Check payload before sending to backend
  console.log("=== SENDING TO StaffDetail/CreateStaffDetails ===");
  console.log("Full Payload:", payload);
  console.log("enterpriseId:", payload.enterpriseId, "(Type:", typeof payload.enterpriseId, ")");
  console.log("clinicId:", payload.clinicId, "(Type:", typeof payload.clinicId, ")");
  console.log("licenseExpiry:", payload.licenseExpiry, "(Type:", typeof payload.licenseExpiry, ")");
  console.log("yearsExperience:", payload.yearsExperience, "(Type:", typeof payload.yearsExperience, ")");
  console.log("specialtyId:", payload.specialtyId, "(Type:", typeof payload.specialtyId, ")");
  console.log("rolesAssigned:", payload.rolesAssigned, "(Type:", typeof payload.rolesAssigned, ")");
  
  // Check for empty strings
  if (payload.licenseExpiry === "") console.warn("⚠️ licenseExpiry is EMPTY STRING - will be null in backend");
  if (payload.yearsExperience === "" || payload.yearsExperience === undefined) console.warn("⚠️ yearsExperience is EMPTY/UNDEFINED - will be null in backend");
  if (payload.specialtyId === "" || payload.specialtyId === undefined) console.warn("⚠️ specialtyId is EMPTY/UNDEFINED - will be null in backend");
  
  return request<StaffDetailsModel>("/StaffDetail/CreateStaffDetails", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateStaffDetail(staffId: number, payload: Partial<CreateStaffDetailDto>): Promise<StaffDetailsModel> {
  // 🔍 DEBUG LOGGING - Check payload before sending to backend
  console.log("=== UPDATING STAFF - SENDING TO BACKEND ===");
  console.log("Staff ID:", staffId);
  console.log("Update Payload:", payload);
  console.log("licenseExpiry:", payload.licenseExpiry, "(Type:", typeof payload.licenseExpiry, ")");
  console.log("yearsExperience:", payload.yearsExperience, "(Type:", typeof payload.yearsExperience, ")");
  console.log("specialtyId:", payload.specialtyId, "(Type:", typeof payload.specialtyId, ")");
  
  return request<StaffDetailsModel>(`/staffdetails/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

// Get staff profile by clinic ID (new endpoint from user requirement)
// Backend endpoint: GetStaffProfileByClinicId with int ClinicId parameter
export function getStaffProfileByClinicId(clinicId: number): Promise<StaffDetailsModel[]> {
  console.log('📞 API CALL: getStaffProfileByClinicId with ClinicId:', clinicId);
  const endpoint = `/StaffDetail/GetStaffProfileByClinicId?ClinicId=${clinicId}`;
  return request<StaffDetailsModel[]>(endpoint);
}
