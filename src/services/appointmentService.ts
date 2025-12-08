// Appointments API Service
import { request } from './apiClient';
import { getSelectedAccess } from './authService';
import type { AppointmentsModel } from '../Interfaces/AppointmentsModel';

export function createAppointment(appointment: AppointmentsModel): Promise<AppointmentsModel> {
  return request<AppointmentsModel>("/Appointments/CreateAppointment", {
    method: "POST",
    body: JSON.stringify(appointment)
  });
}

export function listAppointments(): Promise<AppointmentsModel[]> {
  return request<AppointmentsModel[]>("/Appointments/GetAllAppointments");
}

export function getAppointment(appointmentId: number): Promise<AppointmentsModel> {
  return request<AppointmentsModel>(`/Appointments/GetAppointmentByID?id=${appointmentId}`);
}

export function updateAppointment(appointment: AppointmentsModel): Promise<AppointmentsModel> {
  return request<AppointmentsModel>(`/Appointments/UpdateAppointment`, {
    method: "PUT",
    body: JSON.stringify(appointment)
  });
}

export function deleteAppointment(appointmentId: number): Promise<void> {
  return request<void>(`/Appointments/DeleteAppointment?id=${appointmentId}`, {
    method: "DELETE"
  });
}

export function getAppointmentsByPatient(patientId: number): Promise<AppointmentsModel[]> {
  return request<AppointmentsModel[]>(`/Appointments/GetByPatient?patientId=${patientId}`);
}

export function getAppointmentsByClinic(clinicId: number): Promise<AppointmentsModel[]> {
  return request<AppointmentsModel[]>(`/Appointments/GetByClinic?clinicId=${clinicId}`);
}

// Get appointments by clinic using X-Clinic-Id header (from user's login context)
// This method relies on the apiClient automatically adding X-Clinic-Id header from localStorage
export function getAppointmentsByClinicFromHeader(): Promise<AppointmentsModel[]> {
  // The backend GetAppointmentsByClinic endpoint will read clinicId from X-Clinic-Id header
  // No need to pass clinicId as query param since it's in the header
  return request<AppointmentsModel[]>("/Appointments/GetAppointmentsByClinic");
}

// Get appointments by clinic and enterprise (from token/localStorage)
// This uses the new GetAppointmentsByClinicEnterprise endpoint
export function getAppointmentsByClinicEnterprise(): Promise<AppointmentsModel[]> {
  // Get enterpriseId and clinicId from localStorage (stored during login)
  const selectedAccess = localStorage.getItem('selectedAccess');
  
  if (!selectedAccess) {
    throw new Error('No clinic/enterprise context found. Please login again.');
  }
  
  const accessData = JSON.parse(selectedAccess);
  const enterpriseId = accessData.enterpriseId;
  const clinicId = accessData.clinicId;
  
  if (!enterpriseId || !clinicId) {
    throw new Error('Enterprise ID or Clinic ID not found in session.');
  }
  
  console.log(`📅 Loading appointments for Enterprise: ${enterpriseId}, Clinic: ${clinicId}`);
  
  // Call the backend with enterpriseId and clinicId as query parameters
  return request<AppointmentsModel[]>(
    `/Appointments/GetAppointmentsByClinicEnterprise?enterpriseId=${enterpriseId}&clinicId=${clinicId}`
  );
}

// Get calendar appointments for the current user's clinic and enterprise
// The apiClient automatically adds X-Enterprise-Id and X-Clinic-Id headers
export function getCalendarAppointments(): Promise<AppointmentsModel[]> {
  console.log('🔍 getCalendarAppointments() called');
  
  try {
    // Get selectedAccess to verify we have context
    const selectedAccess = getSelectedAccess();
    console.log('📦 selectedAccess from getSelectedAccess():', selectedAccess);
    
    if (!selectedAccess) {
      console.warn('❌ No selectedAccess found');
      throw new Error('AUTH_TOKEN_NOT_FOUND');
    }
    
    const enterpriseId = selectedAccess.enterpriseId;
    const clinicId = selectedAccess.clinicId;
    
    console.log('🏢 Enterprise ID:', enterpriseId);
    console.log('🏥 Clinic ID:', clinicId);
    
    if (!enterpriseId || !clinicId) {
      console.warn('❌ Enterprise ID or Clinic ID not found');
      throw new Error('TOKEN_MISSING_IDS');
    }
    
    const apiUrl = `/Appointments/CalendarAppointments?enterpriseId=${enterpriseId}&clinicId=${clinicId}`;
    console.log(`📅 Loading calendar appointments from: ${apiUrl}`);
    console.log(`📤 Query params - Enterprise: ${enterpriseId}, Clinic: ${clinicId}`);
    
    // Call the CalendarAppointments endpoint
    // apiClient will automatically add X-Enterprise-Id and X-Clinic-Id headers
    return request<AppointmentsModel[]>(apiUrl);
  } catch (error) {
    console.error('❌ Error in getCalendarAppointments:', error);
    console.log('🔗 Error message:', (error as Error).message);
    throw error;
  }
}

export function getAppointmentsByDate(date: string): Promise<AppointmentsModel[]> {
  return request<AppointmentsModel[]>(`/Appointments/GetByDate?date=${date}`);
}

// Get appointments with filters
export interface AppointmentFilterParams {
  clinicId: string;
  firstName?: string;
  lastName?: string;
  doctorId?: string;
  appointmentDate?: string;
}

export function getAppointmentsByFilters(params: AppointmentFilterParams): Promise<AppointmentsModel[]> {
  const queryParams = new URLSearchParams();
  
  // Clinic ID is mandatory
  queryParams.append('clinicId', params.clinicId);
  
  if (params.firstName) queryParams.append('firstName', params.firstName);
  if (params.lastName) queryParams.append('lastName', params.lastName);
  if (params.doctorId) queryParams.append('doctorId', params.doctorId);
  if (params.appointmentDate) queryParams.append('appointmentDate', params.appointmentDate);
  
  return request<AppointmentsModel[]>(`/Appointments/GetAppointmentById?${queryParams.toString()}`);
}
