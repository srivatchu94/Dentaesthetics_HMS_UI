// HMS API typed client
// Configuration loaded from environment variables (.env files)
// 
// .env.development  → https://localhost:7104/api (local)
// .env.production   → Cloud API URL (for deployment)

import type { ClinicModel, StaffModel, ServiceModel, EnterpriseDataModel, EnterpriseModel, AssetModel, CreateAssetDto, UpdateAssetDto } from "../Interfaces";
import { request } from "../services/apiClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api';

console.log(`✅ HMS API initialized: ${BASE_URL}`);

// Enterprise
export function getEnterpriseData(): Promise<EnterpriseDataModel> {
  return request<EnterpriseDataModel>("/enterprise");
}

export function getEnterprise(id: number): Promise<EnterpriseModel> {
  return request<EnterpriseModel>(`/enterprise/${id}`);
}

// Get all enterprises
export function getAllEnterprises(): Promise<EnterpriseModel[]> {
  return request<EnterpriseModel[]>("/Enterprise/GetAllEnterprises");
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

// Inventory by Clinic
export interface ClinicInventoryModel {
  inventoryId: number;
  clinicId: number;
  itemName: string;
  category: string;
  quantityAvailable: number;
  reorderLevel: number;
  status: string;
  storageLocation?: string;
}

export function getClinicInventoryByClinicId(clinicId: number): Promise<ClinicInventoryModel[]> {
  console.log('📞 API CALL: getClinicInventoryByClinicId with clinicId:', clinicId);
  return request<ClinicInventoryModel[]>(`/Inventory/GetClinicInventoryByClinicId?clinicId=${clinicId}`);
}

// Staff Profile by Clinic
export interface StaffProfileModel extends StaffModel {
  role?: string;
  specialty?: string;
  experienceYears?: number;
  licenseNumber?: string;
}

export function getStaffProfileByClinicId(clinicId: number): Promise<StaffProfileModel[]> {
  console.log('📞 API CALL: getStaffProfileByClinicId with clinicId:', clinicId);
  return request<StaffProfileModel[]>(`/StaffDetail/GetStaffProfileByClinicId?clinicId=${clinicId}`);
}

// Get Clinic Details by Clinic ID List
// Backend endpoint expects: [FromQuery] List<int> id
// Format: /Clinic/GetClinicByClinicId?id=1&id=2&id=3
export function getClinicByClinicIdList(clinicIds: number[]): Promise<ClinicModel[]> {
  // Create query params in the format: id=1&id=2&id=3
  // This is the standard way to pass List<int> in ASP.NET from query strings
  const queryParams = clinicIds.map(id => `id=${id}`).join('&');
  const endpoint = `/Clinic/GetClinicByClinicId?${queryParams}`;
  
  console.log('%c🔗 CLINIC API CALL', 'color: #00AA00; font-weight: bold; font-size: 14px');
  console.log('📍 Endpoint:', `${endpoint}`);
  console.log('📋 Clinic IDs:', clinicIds);
  console.log('📤 Full URL:', endpoint);
  console.log('Expected Return Type: ClinicModel[]');
  
  return request<ClinicModel[]>(endpoint).then(data => {
    console.log('%c✅ CLINIC API RESPONSE', 'color: #00AA00; font-weight: bold; font-size: 14px');
    console.log('Return Type:', Array.isArray(data) ? 'Array<ClinicModel>' : typeof data);
    console.log('Data Count:', Array.isArray(data) ? data.length : 'N/A');
    console.log('Full Response Data:', JSON.stringify(data, null, 2));
    if (Array.isArray(data) && data.length > 0) {
      console.log('📋 Sample Item Structure:', JSON.stringify(data[0], null, 2));
    }
    return data;
  }).catch(error => {
    console.error('%c❌ CLINIC API ERROR', 'color: #FF0000; font-weight: bold; font-size: 14px');
    console.error('Error Details:', error);
    throw error;
  });
}

// Example usage (remove when integrating):
// import { listClinics } from "../api/hmsApi";
// useEffect(() => { listClinics().then(setClinics).catch(console.error); }, []);

// Update Clinic Inventory
export interface ClinicInventoryUpdateModel {
  inventoryId?: number;
  itemName: string;
  quantityAvailable: number;
  reorderLevel: number;
  category?: string;
  status?: string;
  storageLocation?: string;
}

export function updateClinicInventory(inventoryModel: ClinicInventoryUpdateModel): Promise<any> {
  console.log('📝 UPDATING INVENTORY:', inventoryModel);
  return request<any>('/Inventory/UpdateClinicInventory', {
    method: 'PUT',
    body: JSON.stringify(inventoryModel)
  }).then(data => {
    console.log('✅ INVENTORY UPDATED SUCCESSFULLY:', data);
    return data;
  }).catch(error => {
    console.error('❌ FAILED TO UPDATE INVENTORY:', error);
    throw error;
  });
}

// Asset Management Endpoints
export function addAsset(asset: CreateAssetDto): Promise<{ assetID: number }> {
  console.log('📝 Adding Asset:', asset);
  return request<{ assetID: number }>('/Clinic/AddAsset', {
    method: 'POST',
    body: JSON.stringify(asset)
  }).then(data => {
    console.log('✅ ASSET ADDED SUCCESSFULLY:', data);
    return data;
  }).catch(error => {
    console.error('❌ FAILED TO ADD ASSET:', error);
    throw error;
  });
}

export function getAssetsByClinicId(clinicId: number): Promise<AssetModel[]> {
  console.log('📞 API CALL: getAssetsByClinicId with clinicId:', clinicId);
  return request<AssetModel[]>(`/Clinic/GetAssetsByClinicId?clinicId=${clinicId}`)
    .then(data => {
      console.log('✅ ASSETS FETCHED SUCCESSFULLY:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ FAILED TO FETCH ASSETS:', error);
      throw error;
    });
}

export function getAssetsByEnterpriseId(enterpriseId: number): Promise<AssetModel[]> {
  console.log('📞 API CALL: getAssetsByEnterpriseId with enterpriseId:', enterpriseId);
  return request<AssetModel[]>(`/Clinic/GetAssetsByEnterpriseID?enterpriseId=${enterpriseId}`)
    .then(data => {
      console.log('✅ ASSETS FETCHED SUCCESSFULLY:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ FAILED TO FETCH ASSETS:', error);
      throw error;
    });
}

export function updateAsset(assetId: number, asset: UpdateAssetDto): Promise<void> {
  console.log('📝 UPDATING ASSET:', asset);
  return request<void>(`/Clinic/UpdateAsset?assetId=${assetId}`, {
    method: 'PUT',
    body: JSON.stringify(asset)
  }).then(() => {
    console.log('✅ ASSET UPDATED SUCCESSFULLY');
  }).catch(error => {
    console.error('❌ FAILED TO UPDATE ASSET:', error);
    throw error;
  });
}

export function deleteAsset(assetId: number): Promise<void> {
  console.log('🗑️ DELETING ASSET with ID:', assetId);
  return request<void>(`/Clinic/DeleteAsset?assetId=${assetId}`, {
    method: 'DELETE'
  }).then(() => {
    console.log('✅ ASSET DELETED SUCCESSFULLY');
  }).catch(error => {
    console.error('❌ FAILED TO DELETE ASSET:', error);
    throw error;
  });
}

// ============================================
// PATIENT MANAGEMENT ENDPOINTS
// ============================================

export function searchPatients(params: {
  firstName?: string;
  lastName?: string;
  dob?: string;
  patientId?: number;
  clinicId?: number;
}): Promise<any[]> {
  console.log('📞 API CALL: searchPatients with params:', params);
  const queryParams = new URLSearchParams();
  if (params.patientId) queryParams.append('patientId', params.patientId.toString());
  if (params.clinicId) queryParams.append('clinicId', params.clinicId.toString());
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  if (params.dob) queryParams.append('dob', params.dob);
  
  return request<any[]>(`/Patient/Patientsearch?${queryParams.toString()}`)
    .then(data => {
      console.log('✅ PATIENTS FETCHED SUCCESSFULLY:', data);
      return data;
    })
    .catch(error => {
      console.error('❌ FAILED TO FETCH PATIENTS:', error);
      throw error;
    });
}

export function getFullPatientProfile(patientId: number): Promise<any> {
  console.log('📞 API CALL: getFullPatientProfile with patientId:', patientId);
  return request<any>(`/Patient/details/fullProfile?patientId=${patientId}`)
    .then(data => {
      console.log('═════════════════════════════════════════════════════════');
      console.log('✅ API RAW RESPONSE (fullProfile):', data);
      console.log('📊 Response Type:', typeof data);
      console.log('🔑 Is Array?:', Array.isArray(data));
      console.log('═════════════════════════════════════════════════════════');
      
      // Handle array response - API returns [{ patient, patientContact, ... }]
      let profile = data;
      if (Array.isArray(data) && data.length > 0) {
        profile = data[0];
        console.log('✅ Extracted first element from array - this is the actual profile object');
      }
      
      console.log('📋 Final profile object to return:', profile);
      return profile;
    })
    .catch(error => {
      console.error('❌ FAILED TO FETCH PATIENT PROFILE:', error);
      throw error;
    });
}

export function updateFullPatientProfile(patientData: any): Promise<any> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 API CALL: PUT /Patient/details/UpdatefullProfile');
  console.log('📊 PATIENT DATA BEING SENT:', patientData);
  console.log('═══════════════════════════════════════════════════════');
  
  return request<any>('/Patient/details/UpdatefullProfile', {
    method: 'PUT',
    body: JSON.stringify(patientData)
  }).then(data => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ PATIENT PROFILE UPDATED SUCCESSFULLY!');
    console.log('📥 API RESPONSE:', data);
    console.log('═══════════════════════════════════════════════════════');
    return data;
  }).catch(error => {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ FAILED TO UPDATE PATIENT PROFILE');
    console.error('📋 Error Details:', error);
    console.error('═══════════════════════════════════════════════════════');
    throw error;
  });
}

export function getDoctorsByClinicID(clinicID: number): Promise<any> {
  console.log('📞 API CALL: getDoctorsByClinicID with clinicID:', clinicID);
  return request<any>(`/DoctorProfile/GetDoctorsByClinicID?ClinicID=${clinicID}`)
    .then(data => {
      console.log('✅ DOCTORS FETCHED SUCCESSFULLY:', data);
      return data || [];
    })
    .catch(error => {
      console.error('❌ FAILED TO FETCH DOCTORS:', error);
      return [];
    });
}
