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
  return request<{ participantId: number }>('/Camp/AddCampParticipant', {
    method: 'POST',
    body: JSON.stringify(participant),
  });
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
