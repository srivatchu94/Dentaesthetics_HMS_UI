// Camp Management Service
import { BASE_URL, request } from './apiClient';

export interface CampRegistrationModel {
  campId?: number;
  enterpriseId?: number;
  clinicId?: number;
  campName: string;
  campType: string;
  campDate: string | Date;
  startTime: string;
  endTime: string;
  venueType: string;
  institutionName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  organizedBy: string;
  contactPerson: string;
  contactNumber: string;
  contactEmail: string;
  expectedParticipants: number;
  targetAgeGroup: string;
  servicesOffered: string;
  campDescription: string;
  specialNotes: string;
  budgetAllocated: number;
  sponsorshipDetails: string;
  createdDate?: string | Date;
  modifiedDate?: string | Date;
  isActive?: boolean;
}

export interface CampParticipantRegistrationModel {
  campId: number;
  participantId?: number;
  enterpriseId?: number;
  clinicId?: number;
  participantName: string;
  age: number;
  gender: string;
  dateOfBirth: string | Date;
  phoneNumber: string;
  email: string;
  parentGuardianName: string;
  studentOrStaff: string;
  classStandard: string;
  gradeYear: string;
  rollNumber: string;
  department: string;
  existingDentalIssues: string;
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  consentGiven: boolean;
  photoConsent: boolean;
  registrationDate?: string | Date;
  registrationStatus?: string;
  service?: string;
}

export interface CampServiceMasterModel {
  campServiceId: number;
  campServiceCode: string;
  campServiceName: string;
  isActive: boolean;
  createdDate: string | Date;
  modifiedDate?: string | Date;
}

export interface CampReportModel {
  enterpriseId: number;
  clinicId: number;
  serviceName: string;
  noOfParticipants: number;
}

const CAMP_API_URL = `${BASE_URL}/Camp`;

// Camp Management APIs
export async function createCamp(camp: CampRegistrationModel): Promise<{ campId: number }> {
  return request<{ campId: number }>('/Camp/CreateCamp', {
    method: 'POST',
    body: JSON.stringify(camp),
  });
}

export async function getAllCamps(): Promise<CampRegistrationModel[]> {
  return request<CampRegistrationModel[]>('/Camp/GetAllCamps', {
    method: 'GET',
  });
}

export async function getCampsByClinicId(clinicId: number): Promise<CampRegistrationModel[]> {
  console.log('🏕️ getCampsByClinicId called with clinicId:', clinicId);
  console.log('📍 Full API URL:', `${CAMP_API_URL}/GetAllCampsbyClinicID?ClinicID=${clinicId}`);
  
  if (!clinicId || clinicId === 0) {
    console.error('❌ Invalid clinicId provided:', clinicId);
    throw new Error('Clinic ID is required and must be greater than 0');
  }
  
  try {
    const response = await request<CampRegistrationModel[]>(`/Camp/GetAllCampsbyClinicID?ClinicID=${clinicId}`, {
      method: 'GET',
    });
    console.log('✅ Camps fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error fetching camps by clinic ID:', error);
    throw error;
  }
}

export async function updateCamp(camp: CampRegistrationModel): Promise<string> {
  return request<string>('/Camp/UpdateCamp', {
    method: 'PUT',
    body: JSON.stringify(camp),
  });
}

export async function deleteCamp(campId: number): Promise<string> {
  return request<string>(`/Camp/DeleteCamp?campId=${campId}`, {
    method: 'DELETE',
  });
}

// Camp Participant Management APIs
export async function addCampParticipant(
  participant: CampParticipantRegistrationModel
): Promise<{ participantId: number }> {
  console.log('👥 addCampParticipant called with data:', participant);
  console.log('📍 Full API URL:', `${CAMP_API_URL}/AddCampParticipant`);
  
  if (!participant.campId || participant.campId === 0) {
    console.error('❌ Invalid campId provided:', participant.campId);
    throw new Error('Camp ID is required and must be greater than 0');
  }
  
  if (!participant.participantName || participant.participantName.trim() === '') {
    console.error('❌ Participant name is required');
    throw new Error('Participant name is required');
  }
  
  try {
    const response = await request<{ participantId: number }>('/Camp/AddCampParticipant', {
      method: 'POST',
      body: JSON.stringify(participant),
    });
    console.log('✅ Participant added successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error adding participant:', error);
    throw error;
  }
}

export async function getAllCampParticipants(campId: number): Promise<CampParticipantRegistrationModel[]> {
  return request<CampParticipantRegistrationModel[]>(`/Camp/GetAllCampParticipants?CampId=${campId}`, {
    method: 'GET',
  });
}

export async function updateCampParticipant(
  participant: CampParticipantRegistrationModel
): Promise<string> {
  return request<string>('/Camp/UpdateCampParticipant', {
    method: 'PUT',
    body: JSON.stringify(participant),
  });
}

export async function deleteCampParticipant(participantId: number): Promise<string> {
  return request<string>(`/Camp/DeleteCampParticipant?participantId=${participantId}`, {
    method: 'DELETE',
  });
}

// Camp Service Master APIs
export async function getAllCampServices(): Promise<CampServiceMasterModel[]> {
  return request<CampServiceMasterModel[]>('/Camp/GetAllCampServices', {
    method: 'GET',
  });
}

export async function addCampService(service: CampServiceMasterModel): Promise<{ campServiceId: number }> {
  console.log('🔧 addCampService called with data:', service);
  console.log('📍 Full API URL:', `${CAMP_API_URL}/AddCampService`);
  
  try {
    const response = await request<{ campServiceId: number }>('/Camp/AddCampService', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    console.log('✅ Camp Service added successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error adding camp service:', error);
    throw error;
  }
}

export async function getServicesByCampID(campId: number): Promise<CampServiceMasterModel[]> {
  console.log('🏕️ getServicesByCampID called with campId:', campId);
  console.log('📍 Full API URL:', `${CAMP_API_URL}/GetservicesbyCampID?id=${campId}`);
  
  if (!campId || campId === 0) {
    console.error('❌ Invalid campId provided:', campId);
    throw new Error('Camp ID is required and must be greater than 0');
  }
  
  try {
    const response = await request<CampServiceMasterModel[]>(`/Camp/GetservicesbyCampID?id=${campId}`, {
      method: 'GET',
    });
    console.log('✅ Services fetched successfully for camp:', response);
    return response;
  } catch (error) {
    console.error('❌ Error fetching services by camp ID:', error);
    throw error;
  }
}

// Camp Reports API
export async function getCampReports(
  campId?: number,
  registrationDate?: string
): Promise<CampReportModel[]> {
  console.log('📊 getCampReports called');
  console.log('  campId:', campId, '(type:', typeof campId + ')');
  console.log('  registrationDate:', registrationDate, '(type:', typeof registrationDate + ')');
  
  try {
    // Build query string with optional parameters
    const params = new URLSearchParams();
    if (campId && campId > 0) {
      params.append('campid', campId.toString());
      console.log('  ✓ Added campid to params:', campId);
    } else {
      console.log('  ✗ campId not added (value:', campId, ')');
    }
    
    if (registrationDate) {
      params.append('registrationDate', registrationDate);
      console.log('  ✓ Added registrationDate to params:', registrationDate);
    } else {
      console.log('  ✗ registrationDate not added (value:', registrationDate, ')');
    }
    
    const queryString = params.toString();
    const url = `/Camp/GetCampReports${queryString ? '?' + queryString : ''}`;
    
    console.log('📍 API Endpoint Details:');
    console.log('  BASE_URL:', CAMP_API_URL);
    console.log('  Path:', url);
    console.log('  Full URL:', `${CAMP_API_URL}${url}`);
    console.log('  Query String:', queryString || '(none)');
    
    const response = await request<CampReportModel[]>(url, {
      method: 'GET',
    });
    console.log('✅ Camp reports fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error fetching camp reports:', error);
    console.error('  Error details:', error.message);
    throw error;
  }
}
