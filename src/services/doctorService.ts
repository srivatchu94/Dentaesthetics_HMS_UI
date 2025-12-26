// Doctor/Clinical API Service
import { request } from './apiClient';
import type { DoctorProfileModel, ClinicalSpecialtyModel } from '../Interfaces';

// Doctor Profiles
export function listDoctorProfiles(): Promise<DoctorProfileModel[]> {
  return request<DoctorProfileModel[]>("/DoctorProfile/GetAllDoctors");
}

export function getDoctorProfile(doctorId: number): Promise<DoctorProfileModel> {
  return request<DoctorProfileModel>(`/DoctorProfile/GetDoctorByID?id=${doctorId}`);
}

// Clinical Specialties
export interface CreateClinicalSpecialtyDto {
  department: string;
  clinicalArea: string;
}

export interface UpdateClinicalSpecialtyDto extends Partial<CreateClinicalSpecialtyDto> {}

export function listClinicalSpecialties(): Promise<ClinicalSpecialtyModel[]> {
  return request<ClinicalSpecialtyModel[]>("/ClinicalSpecialty/GetAllSpecialties");
}

export function getClinicalSpecialty(specialtyId: number): Promise<ClinicalSpecialtyModel> {
  return request<ClinicalSpecialtyModel>(`/ClinicalSpecialty/${specialtyId}`);
}

export function createClinicalSpecialty(payload: CreateClinicalSpecialtyDto): Promise<ClinicalSpecialtyModel> {
  return request<ClinicalSpecialtyModel>("/ClinicalSpecialty", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateClinicalSpecialty(specialtyId: number, payload: UpdateClinicalSpecialtyDto): Promise<ClinicalSpecialtyModel> {
  return request<ClinicalSpecialtyModel>(`/ClinicalSpecialty/${specialtyId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteClinicalSpecialty(specialtyId: number): Promise<void> {
  return request<void>(`/ClinicalSpecialty/${specialtyId}`, { method: "DELETE" });
}

// Doctor CRUD Operations
export interface CreateDoctorDto {
  doctorId?: number;
  staffId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  specialtyId: number;
  yearsExperience: number;
  education: string;
  certifications: string;
  languages: string;
  joiningDate: string;
  employmentStatus: string;
  availability: string;
  insuranceDetails: string;
  emergencyContact: string;
  bio: string;
  profilePhotoUrl: string;
  achievements: string;
  publications: string;
  socialLinks: string;
  branchId: number;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateDoctorDto extends Partial<CreateDoctorDto> {}

export function createDoctor(payload: CreateDoctorDto): Promise<DoctorProfileModel> {
  return request<DoctorProfileModel>("/DoctorProfile/OnboardDoctor", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateDoctor(doctorId: number, payload: any): Promise<DoctorProfileModel> {
  return request<DoctorProfileModel>(`/DoctorProfile/Update?id=${doctorId}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateDoctorProfile(payload: any): Promise<DoctorProfileModel> {
  return request<DoctorProfileModel>(`/DoctorProfile/UpdateDoctorProfile`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getDoctorByStaffId(staffId: number): Promise<DoctorProfileModel> {
  return request<DoctorProfileModel>(`/DoctorProfile/${staffId}`);
}

export function deleteDoctor(staffId: number): Promise<void> {
  return request<void>(`/DoctorProfile/${staffId}`, {
    method: "DELETE"
  });
}

// Search doctors with filters
export function searchDoctors(params: {
  enterpriseId?: number;
  firstName?: string;
  lastName?: string;
  staffId?: number;
  clinicId?: number;
  specialtyId?: number;
}): Promise<DoctorProfileModel[]> {
  const queryParams = new URLSearchParams();
  
  if (params.enterpriseId) queryParams.append('enterpriseId', params.enterpriseId.toString());
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  if (params.staffId) queryParams.append('staffId', params.staffId.toString());
  if (params.clinicId) queryParams.append('clinicId', params.clinicId.toString());
  if (params.specialtyId) queryParams.append('specialtyId', params.specialtyId.toString());
  
  return request<DoctorProfileModel[]>(`/DoctorProfile/SearchDoctors?${queryParams.toString()}`);
}

// Doctor-Clinic Mapping
import type { DoctorClinicMapping } from '../Interfaces/DoctorClinicMappingModel';

export function mapDoctorToClinics(mappings: DoctorClinicMapping[]): Promise<DoctorClinicMapping[]> {
  return request<DoctorClinicMapping[]>("/DoctorProfile/MapDoctortoClinics", {
    method: "POST",
    body: JSON.stringify(mappings)
  });
}

export function getDoctorClinicMappings(doctorId: number): Promise<DoctorClinicMapping[]> {
  return request<DoctorClinicMapping[]>(`/DoctorProfile/GetDoctorMappings?doctorId=${doctorId}`);
}

export function getClinicDoctorMappings(clinicId: number): Promise<DoctorClinicMapping[]> {
  return request<DoctorClinicMapping[]>(`/DoctorProfile/GetClinicMappings?clinicId=${clinicId}`);
}

// Get doctors by enterprise ID
export function getDoctorsByEnterpriseId(enterpriseId: number): Promise<DoctorProfileModel[]> {
  return request<DoctorProfileModel[]>(`/DoctorProfile/GetDoctorsByEnterpriseID?enterpriseId=${enterpriseId}`);
}

// Get clinics by enterprise ID
import type { ClinicModel } from '../Interfaces/ClinicModel';

export function getClinicsByEnterpriseId(enterpriseId: number): Promise<ClinicModel[]> {
  console.log('📞 API CALL: getClinicsByEnterpriseId with enterpriseId:', enterpriseId);
  const endpoint = `/Clinic/GetClinicByID?id=${enterpriseId}`;
  return request<ClinicModel[]>(endpoint);
}
