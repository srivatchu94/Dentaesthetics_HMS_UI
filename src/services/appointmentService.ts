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
// Pass enterpriseId and clinicId as query parameters from token
export function getCalendarAppointments(): Promise<AppointmentsModel[]> {
  console.log('🔍 getCalendarAppointments() called');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    // Debug: Show all localStorage keys
    console.log('📍 All localStorage keys:', Object.keys(localStorage));
    console.log('📍 localStorage contents:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`   ${key}:`, value ? value.substring(0, 100) : 'null');
      }
    }
    
    // Get selectedAccess from token/localStorage
    const selectedAccess = getSelectedAccess();
    console.log('📦 getSelectedAccess() returned:', selectedAccess);
    
    // If getSelectedAccess returned null, try direct localStorage access as fallback
    let enterpriseId, clinicId;
    
    if (selectedAccess?.enterpriseId && selectedAccess?.clinicId) {
      enterpriseId = selectedAccess.enterpriseId;
      clinicId = selectedAccess.clinicId;
      console.log('✅ Using selectedAccess from getSelectedAccess()');
    } else {
      // Fallback: Try to get from localStorage directly with different key names
      console.warn('⚠️ selectedAccess is null, trying fallback keys...');
      
      // Try key: 'selectedAccess'
      let data = localStorage.getItem('selectedAccess');
      if (data) {
        console.log('✅ Found in localStorage key "selectedAccess":', data);
        try {
          const parsed = JSON.parse(data);
          enterpriseId = parsed.enterpriseId;
          clinicId = parsed.clinicId;
        } catch (e) {
          console.error('❌ Failed to parse "selectedAccess":', e);
        }
      }
      
      // Try other possible keys
      if (!enterpriseId || !clinicId) {
        data = localStorage.getItem('selected_access');
        if (data) {
          console.log('✅ Found in localStorage key "selected_access":', data);
          try {
            const parsed = JSON.parse(data);
            enterpriseId = parsed.enterpriseId;
            clinicId = parsed.clinicId;
          } catch (e) {
            console.error('❌ Failed to parse "selected_access":', e);
          }
        }
      }
      
      // Try another key
      if (!enterpriseId || !clinicId) {
        data = localStorage.getItem('access');
        if (data) {
          console.log('✅ Found in localStorage key "access":', data);
          try {
            const parsed = JSON.parse(data);
            enterpriseId = parsed[0]?.enterpriseId;
            clinicId = parsed[0]?.clinicId;
          } catch (e) {
            console.error('❌ Failed to parse "access":', e);
          }
        }
      }
    }
    
    if (!enterpriseId || !clinicId) {
      console.error('❌ CRITICAL: Missing enterpriseId or clinicId');
      console.error('   enterpriseId:', enterpriseId);
      console.error('   clinicId:', clinicId);
      console.error('   selectedAccess:', selectedAccess);
      throw new Error('Enterprise ID or Clinic ID not found in user token. Make sure you logged in and selected a clinic.');
    }
    
    console.log('🏢 Enterprise ID:', enterpriseId);
    console.log('🏥 Clinic ID:', clinicId);
    
    // Construct API URL with query parameters
    const apiUrl = `/Appointments/CalendarAppointments?enterpriseId=${enterpriseId}&clinicId=${clinicId}`;
    console.log(`📅 API URL: ${apiUrl}`);
    console.log('🚀 Calling API with enterpriseId and clinicId as query parameters...');
    
    return request<AppointmentsModel[]>(apiUrl);
  } catch (error) {
    console.error('❌ Error in getCalendarAppointments:', error);
    console.error('🔗 Error message:', (error as Error).message);
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
