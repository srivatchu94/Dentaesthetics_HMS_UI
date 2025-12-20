// HMS API typed client
// Base URL can be configured via Vite env: VITE_API_BASE_URL
// Fallback assumes local ASP.NET backend listening at /api

import type { ClinicModel, StaffModel, ServiceModel, EnterpriseDataModel, EnterpriseModel } from "../Interfaces";

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7104/api";

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

// Get all enterprises
export function getAllEnterprises(): Promise<EnterpriseModel[]> {
  return request<EnterpriseModel[]>("/Enterprise");
}

// Clinics
export function listClinics(): Promise<ClinicModel[]> {
  return request<ClinicModel[]>("/Clinic");
}

export function getClinic(clinicId: number): Promise<ClinicModel> {
  return request<ClinicModel>(`/Clinic/GetClinicByID?id=${clinicId}`);
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

// Get all clinics across all enterprises
export function getAllClinics(): Promise<ClinicModel[]> {
  return request<ClinicModel[]>("/Clinic/all");
}

// Get clinics by enterprise ID
export async function getClinicsByEnterpriseId(enterpriseId: number): Promise<ClinicModel[]> {
  return request<ClinicModel[]>(`/Clinic/GetClinicByID?id=${enterpriseId}`);
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

// Analytics Models
export interface RevenueAnalyticsModel {
  enterpriseID: number;
  clinicID: number | null;
  periodLabel: string;
  totalRevenue: number;
  totalAppointments: number;
  paidAmount: number;
  pendingAmount: number;
  averageRevenue: number;
}

export interface UserStatisticsModel {
  clinicID: number | null;
  periodLabel: string;
  totalUsers: number;
  newUsers: number;
  returnUsers: number;
}

export interface ClinicPerformanceModel {
  enterpriseID: number;
  clinicID: number | null;
  clinicName: string;
  totalRevenue: number;
  totalAppointments: number;
  totalUsers: number;
  averageRevenuePerAppointment: number;
}

// Analytics Queries
export interface AnalyticsQueryParams {
  enterpriseId: number | string;
  clinicId?: number | string | null;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  quarter?: number;
  useActiveMonthsOnly?: boolean;
}

// Revenue Analytics
export function getRevenueAnalytics(params: AnalyticsQueryParams): Promise<RevenueAnalyticsModel[]> {
  const queryParams = new URLSearchParams();
  if (params.enterpriseId) queryParams.append("enterpriseId", String(params.enterpriseId));
  if (params.clinicId) queryParams.append("clinicId", String(params.clinicId));

  let endpoint = "/Analytics";

  switch ((params.periodLabel || "").toLowerCase()) {
    case "monthly":
      endpoint = "/Analytics/monthly";
      if (params.year) queryParams.append("year", String(params.year));
      if (params.month) queryParams.append("month", String(params.month));
      break;
    case "quarterly":
      endpoint = "/Analytics/quarterly";
      if (params.year) queryParams.append("year", String(params.year));
      if (params.quarter) queryParams.append("quarter", String(params.quarter));
      break;
    case "yearly":
      endpoint = "/Analytics/yearly";
      if (params.year) queryParams.append("year", String(params.year));
      queryParams.append("useActiveMonthsOnly", String(params.useActiveMonthsOnly ?? false));
      break;
    case "weekly":
      endpoint = "/Analytics/weekly";
      break;
    case "daily":
      endpoint = "/Analytics/daily";
      if (params.startDate) queryParams.append("currentDate", params.startDate);
      break;
    default:
      if (params.startDate && params.endDate) {
        endpoint = "/Analytics/by-dates";
        queryParams.append("startDate", params.startDate);
        queryParams.append("endDate", params.endDate);
      }
      break;
  }

  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return request<RevenueAnalyticsModel[]>(`${endpoint}${suffix}`);
}

// User Statistics
export function getUserStatistics(params: AnalyticsQueryParams): Promise<UserStatisticsModel[]> {
  const queryParams = new URLSearchParams();
  if (params.enterpriseId) queryParams.append("enterpriseId", String(params.enterpriseId));
  if (params.clinicId) queryParams.append("clinicId", String(params.clinicId));

  let endpoint = "/Analytics/user-statistics";

  switch ((params.periodLabel || "").toLowerCase()) {
    case "daily":
      endpoint = "/Analytics/user-statistics/daily";
      if (params.startDate) queryParams.append("date", params.startDate);
      break;
    case "weekly":
      endpoint = "/Analytics/user-statistics/weekly";
      if (params.startDate) queryParams.append("weekStartDate", params.startDate);
      break;
    case "monthly":
      endpoint = "/Analytics/user-statistics/monthly";
      if (params.year) queryParams.append("year", String(params.year));
      if (params.month) queryParams.append("month", String(params.month));
      break;
    case "quarterly":
      endpoint = "/Analytics/user-statistics/quarterly";
      if (params.year) queryParams.append("year", String(params.year));
      if (params.quarter) queryParams.append("quarter", String(params.quarter));
      break;
    case "yearly":
      endpoint = "/Analytics/user-statistics/yearly";
      if (params.year) queryParams.append("year", String(params.year));
      break;
    default:
      if (params.startDate && params.endDate) {
        endpoint = "/Analytics/user-statistics/date-range";
        queryParams.append("startDate", params.startDate);
        queryParams.append("endDate", params.endDate);
      }
      break;
  }

  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return request<UserStatisticsModel[]>(`${endpoint}${suffix}`);
}

// Clinic Performance
export function getClinicPerformance(params: AnalyticsQueryParams): Promise<ClinicPerformanceModel[]> {
  const queryParams = new URLSearchParams();
  if (params.enterpriseId) queryParams.append("enterpriseId", String(params.enterpriseId));
  if (params.clinicId) queryParams.append("clinicId", String(params.clinicId));

  let endpoint = "/Analytics/clinic-performance";

  switch ((params.periodLabel || "").toLowerCase()) {
    case "monthly":
      endpoint = "/Analytics/clinic-performance/monthly";
      if (params.year) queryParams.append("year", String(params.year));
      if (params.month) queryParams.append("month", String(params.month));
      break;
    case "quarterly":
      endpoint = "/Analytics/clinic-performance/quarterly";
      if (params.year) queryParams.append("year", String(params.year));
      if (params.quarter) queryParams.append("quarter", String(params.quarter));
      break;
    case "yearly":
      endpoint = "/Analytics/clinic-performance/yearly";
      if (params.year) queryParams.append("year", String(params.year));
      break;
    case "weekly":
      endpoint = "/Analytics/clinic-performance/weekly";
      if (params.startDate) queryParams.append("weekStartDate", params.startDate);
      break;
    case "daily":
      endpoint = "/Analytics/clinic-performance/daily";
      if (params.startDate) queryParams.append("date", params.startDate);
      break;
    default:
      if (params.startDate && params.endDate) {
        endpoint = "/Analytics/clinic-performance/date-range";
        queryParams.append("startDate", params.startDate);
        queryParams.append("endDate", params.endDate);
      }
      break;
  }

  const suffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return request<ClinicPerformanceModel[]>(`${endpoint}${suffix}`);
}

// Example usage (remove when integrating):
// import { listClinics } from "../api/hmsApi";
// useEffect(() => { listClinics().then(setClinics).catch(console.error); }, []);
