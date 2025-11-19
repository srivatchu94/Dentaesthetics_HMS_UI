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
