// Doctor/Clinical API Service
import { request } from './apiClient';
import type { DoctorProfileModel, ClinicalSpecialtyModel } from '../Interfaces';

// Doctor Profiles
export function listDoctorProfiles(): Promise<DoctorProfileModel[]> {
  console.log('📞 Fetching all doctors from /DoctorProfile/GetAllDoctors');
  return request<DoctorProfileModel[]>("/DoctorProfile/GetAllDoctors")
    .catch((err) => {
      console.error('❌ GetAllDoctors failed, trying fallback /StaffDetail/GetAllStaffDetails:', err);
      return request<DoctorProfileModel[]>("/StaffDetail/GetAllStaffDetails");
    });
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
  console.log('📞 Fetching specialties from /ClinicalSpecialty/GetAllSpecialties');
  return request<ClinicalSpecialtyModel[]>("/ClinicalSpecialty/GetAllSpecialties")
    .then((data) => {
      console.log('✅ Specialties API response:', data);
      return data;
    })
    .catch((err) => {
      console.error('❌ Specialties API error:', err);
      throw err;
    });
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
  console.log('📤 Sending doctor-clinic mappings to /DoctorProfile/MapDoctortoClinics:', mappings);
  return request<DoctorClinicMapping[]>("/DoctorProfile/MapDoctortoClinics", {
    method: "POST",
    body: JSON.stringify(mappings)
  })
    .then((data) => {
      console.log('✅ Mappings saved successfully:', data);
      return data;
    })
    .catch((err) => {
      console.error('❌ Failed to save mappings:', err);
      throw err;
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

// Get doctors for mapping with filters
export function getDoctorsForMapping(params: {
  enterpriseId: string;
  profileId?: string;
  firstName?: string;
  lastName?: string;
}): Promise<DoctorProfileModel[]> {
  const queryParams = new URLSearchParams();
  
  queryParams.append('enterpriseId', params.enterpriseId);
  if (params.profileId) queryParams.append('profileId', params.profileId);
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  
  console.log('🔍 Calling GetDoctorsForMapping endpoint with params:', params);
  console.log('📝 Query string:', queryParams.toString());
  
  return request<DoctorProfileModel[]>(`/StaffDetail/GetDoctorsForMapping?${queryParams.toString()}`);
}

export function getDoctorsByClinicId(clinicId: number): Promise<DoctorProfileModel[]> {
  // Backend: [HttpGet("GetDoctorsForClinicID")] with [FromQuery] int clinicId
  console.log('📞 Calling GetDoctorsForClinicID with clinicId:', clinicId);
  return request<DoctorProfileModel[]>(`/DoctorProfile/GetDoctorsForClinicID?clinicId=${clinicId}`);
}

// Get clinics by enterprise ID
import type { ClinicModel } from '../Interfaces/ClinicModel';

export function getClinicsByEnterpriseId(enterpriseId: number): Promise<ClinicModel[]> {
  console.log('📞 API CALL: getClinicsByEnterpriseId with enterpriseId:', enterpriseId);
  const endpoint = `/Clinic/GetClinicByID?id=${enterpriseId}`;
  return request<ClinicModel[]>(endpoint);
}
