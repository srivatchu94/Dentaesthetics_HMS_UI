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
  return request<AppointmentsModel>(`/Appointments/GetAppointmentById?id=${appointmentId}`);
}

export function updateAppointment(appointment: AppointmentsModel): Promise<AppointmentsModel> {
  console.log("🔍 DEBUG: updateAppointment called");
  console.log("📊 Appointment data to update:", appointment);
  console.log("🆔 Appointment ID:", appointment.appointmentId);
  console.log("📤 Sending PUT request to /Appointments/UpdateAppointment");
  
  // Convert doctorId to string if it's a number (backend expects string)
  const payload = {
    ...appointment,
    doctorId: appointment.doctorId ? String(appointment.doctorId) : null
  };
  
  console.log("📤 Converted payload with doctorId as string:", payload);
  
  return request<AppointmentsModel>(`/Appointments/UpdateAppointment`, {
    method: "PUT",
    body: JSON.stringify(payload)
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

export function getAppointmentsByDate(enterpriseId: number, clinicId: number, date: string): Promise<AppointmentsModel[]> {
  return request<AppointmentsModel[]>(`/Appointments/CalendarAppointments?enterpriseId=${enterpriseId}&clinicId=${clinicId}&date=${date}`);
}

// Get appointment by ID with filters
export function getAppointmentById(params: {
  clinicId?: number;
  firstName?: string;
  lastName?: string;
  doctorId?: number;
  appointmentDate?: string;
}): Promise<AppointmentsModel> {
  const queryString = new URLSearchParams();
  if (params.clinicId) queryString.append('clinicId', params.clinicId.toString());
  if (params.firstName) queryString.append('firstName', params.firstName);
  if (params.lastName) queryString.append('lastName', params.lastName);
  if (params.doctorId) queryString.append('doctorId', params.doctorId.toString());
  if (params.appointmentDate) queryString.append('appointmentDate', params.appointmentDate);
  
  const endpoint = `/Appointments/GetAppointmentById?${queryString.toString()}`;
  console.log("🔍 DEBUG: getAppointmentById called");
  console.log("📊 Input params:", params);
  console.log("📤 Query string:", queryString.toString());
  console.log("🔗 Full endpoint:", endpoint);
  
  return request<AppointmentsModel>(endpoint);
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
  
  const endpoint = `/Appointments/GetAppointmentById?${queryParams.toString()}`;
  console.log("🔍 DEBUG: getAppointmentsByFilters called");
  console.log("📊 Input params:", params);
  console.log("📤 Query string:", queryParams.toString());
  console.log("🔗 Full endpoint:", endpoint);
  
  return request<AppointmentsModel[]>(endpoint);
}

// Get appointments by clinic and date (simple filters)
export function getAppointmentsByClinicAndDate(clinicId: number, appointmentDate: string): Promise<AppointmentsModel[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('clinicId', clinicId.toString());
  queryParams.append('appointmentDate', appointmentDate);
  
  const endpoint = `/Appointments/GetAppointmentById?${queryParams.toString()}`;
  console.log("════════════════════════════════════════════════════════════════");
  console.log("🔥🔥🔥 getAppointmentsByClinicAndDate FUNCTION CALLED 🔥🔥🔥");
  console.log("════════════════════════════════════════════════════════════════");
  console.log("✅ API ENDPOINT: /Appointments/GetAppointmentById");
  console.log("✅ METHOD: GET");
  console.log("✅ QUERY PARAMS: clinicId=" + clinicId + ", appointmentDate=" + appointmentDate);
  console.log("🏥 Clinic ID:", clinicId);
  console.log("📅 Appointment Date:", appointmentDate);
  console.log("🔗 Full URL:", endpoint);
  console.log("════════════════════════════════════════════════════════════════");
  
  return request<AppointmentsModel[]>(endpoint);
}

// Get appointments by doctor ID with date filter
export function getAppointmentsByDoctorID(clinicId: number, doctorId: string, appointmentDate: string): Promise<AppointmentsModel[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('clinicId', clinicId.toString());
  queryParams.append('UserName', doctorId);
  queryParams.append('appointmentDate', appointmentDate);
  
  console.log('📅 Loading Doctor Appointments with GetAppointmentsByDoctorID API');
  console.log('   Clinic ID:', clinicId);
  console.log('   UserName (Doctor):', doctorId);
  console.log('   Appointment Date:', appointmentDate);
  
  return request<AppointmentsModel[]>(`/Appointments/GetAppointmentsByDoctorID?${queryParams.toString()}`);
}

export interface DoctorAppointmentsWithCountParams {
  clinicId: number;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

export function getDoctorAppointmentsWithCount(params: DoctorAppointmentsWithCountParams): Promise<any> {
  const queryParams = new URLSearchParams();
  queryParams.append('clinicId', String(params.clinicId));
  queryParams.append('doctorId', String(params.doctorId));
  queryParams.append('appointmentDate', params.appointmentDate);
  queryParams.append('startTime', params.startTime);
  queryParams.append('endTime', params.endTime);

  return request<any>(`/Appointments/GetDoctorAppointmentsWithCount?${queryParams.toString()}`);
}

// ============= PRESCRIPTION OPERATIONS =============

export interface PrescriptionDto {
  prescriptionId?: number;
  visitId: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  doctorRegistrationNumber: string;
  prescriptionDate: string;
  prescriptionContent: string;
  notes?: string;
}

// New prescription request payload matching backend /api/Appointments/AddPrescription
export interface AddPrescriptionPayload {
  medicationId: number;
  enterpriseId: number;
  clinicId: number;
  appointmentId: number;
  visitId: number;
  doctorId: number;
  patientId: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  specialInstructions?: string;
  generalPrescriptionNotes?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export function createPrescription(payload: PrescriptionDto): Promise<PrescriptionDto> {
  return request<PrescriptionDto>("/Prescriptions/Create", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// New endpoint for AddPrescription API
export function addPrescription(payload: AddPrescriptionPayload): Promise<any> {
  console.log('═══════════════════════════════════════');
  console.log('📡 ADDPRESCRIPTION API CALL');
  console.log('═══════════════════════════════════════');
  console.log('🔗 Endpoint: /Appointments/AddPrescription');
  console.log('🔧 Method: POST');
  console.log('📦 Payload Structure:');
  console.log({
    medicationId: typeof payload.medicationId + ' = ' + payload.medicationId,
    enterpriseId: typeof payload.enterpriseId + ' = ' + payload.enterpriseId,
    clinicId: typeof payload.clinicId + ' = ' + payload.clinicId,
    appointmentId: typeof payload.appointmentId + ' = ' + payload.appointmentId,
    visitId: typeof payload.visitId + ' = ' + payload.visitId,
    doctorId: typeof payload.doctorId + ' = ' + payload.doctorId,
    patientId: typeof payload.patientId + ' = ' + payload.patientId,
    medicineName: typeof payload.medicineName + ' = "' + payload.medicineName + '"',
    dosage: typeof payload.dosage + ' = "' + payload.dosage + '"',
    frequency: typeof payload.frequency + ' = "' + payload.frequency + '"',
    duration: typeof payload.duration + ' = "' + payload.duration + '"',
    specialInstructions: typeof payload.specialInstructions + ' = "' + payload.specialInstructions + '"',
    generalPrescriptionNotes: typeof payload.generalPrescriptionNotes + ' = "' + payload.generalPrescriptionNotes + '"',
    createdAt: typeof payload.createdAt + ' = "' + (payload.createdAt?.substring(0, 20) || 'null') + '..."',
    createdBy: typeof payload.createdBy + ' = "' + payload.createdBy + '"',
    updatedAt: typeof payload.updatedAt + ' = "' + (payload.updatedAt?.substring(0, 20) || 'null') + '..."',
    updatedBy: typeof payload.updatedBy + ' = "' + payload.updatedBy + '"'
  });
  console.log('📋 Full Payload:');
  console.log(payload);
  console.log('═══════════════════════════════════════');
  
  return request<any>("/Appointments/AddPrescription", {
    method: "POST",
    body: JSON.stringify(payload)
  }).catch(error => {
    console.error('═══════════════════════════════════════');
    console.error('❌ ADDPRESCRIPTION API ERROR');
    console.error('═══════════════════════════════════════');
    console.error('🔗 Endpoint: /Appointments/AddPrescription');
    console.error('❌ Error:', error.message);
    if (error.status) {
      console.error('📊 Status Code:', error.status);
    }
    if (error.response && error.response.data) {
      console.error('📝 Backend Response:', error.response.data);
    }
    console.error('📦 Payload that failed:');
    console.error(payload);
    console.error('═══════════════════════════════════════');
    throw error;
  });
}

export function updatePrescription(prescriptionId: number, payload: PrescriptionDto): Promise<PrescriptionDto> {
  return request<PrescriptionDto>(`/Prescriptions/Update?id=${prescriptionId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

// New endpoint for UpdatePrescription API
export function updatePrescriptionData(payload: AddPrescriptionPayload): Promise<any> {
  return request<any>("/Appointments/UpdatePrescription", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getPrescriptionsByAppointment(appointmentId: number): Promise<PrescriptionDto[]> {
  return request<PrescriptionDto[]>(`/Appointments/GetPrescriptionsByAppointment?appointmentId=${appointmentId}`)
    .catch((error: any) => {
      if (error.status === 404) {
        console.log('ℹ️ Prescriptions endpoint returned 404, returning empty array');
        return [];
      }
      throw error;
    });
}

export function getPrescriptionById(prescriptionId: number): Promise<any> {
  console.log('📋 Fetching prescription by ID:', prescriptionId);
  return request<any>(`/Prescriptions/GetPrescriptionById?id=${prescriptionId}`);
}

export function getPrescription(prescriptionId: number): Promise<PrescriptionDto> {
  return request<PrescriptionDto>(`/Prescriptions/Get?id=${prescriptionId}`);
}

export function deletePrescription(prescriptionId: number): Promise<void> {
  return request<void>(`/Prescriptions/Delete?id=${prescriptionId}`, {
    method: "DELETE"
  });
}

// PatientVisitInformation payload
export interface PrescriptionModel {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  specialInstructions?: string;
  generalPrescriptionNotes?: string;
}

export interface PatientVisitPayload {
  visitId?: number;
  appointmentId: number;
  patientId: number;
  clinicId: number;
  visitDate: string;
  reasonForVisit?: string;
  diagnoses: string;
  treatments: string;
  notes?: string;
  nextAppointmentDate?: string;
  attendingPhysician: string;
  billingAmount?: number;
  paymentStatus?: string;
  createdBy: string;
  updatedBy: string;
  prescriptions: PrescriptionModel[];
}

export function addPatientVisit(payload: PatientVisitPayload): Promise<any> {
  console.log('═══════════════════════════════════════');
  console.log('📡 ADDPATIENTVISIT API CALL');
  console.log('═══════════════════════════════════════');
  console.log('🔗 Endpoint: /Patient/AddPatientVisit');
  console.log('🔧 Method: POST');
  console.log('📦 Payload:');
  console.log(payload);
  console.log('═══════════════════════════════════════');
  
  return request<any>("/Patient/AddPatientVisit", {
    method: "POST",
    body: JSON.stringify(payload)
  }).catch(error => {
    console.error('═══════════════════════════════════════');
    console.error('❌ ADDPATIENTVISIT API ERROR');
    console.error('═══════════════════════════════════════');
    console.error('🔗 Endpoint: /Patient/AddPatientVisit');
    console.error('❌ Error:', error.message);
    if (error.status) {
      console.error('📊 Status Code:', error.status);
    }
    if (error.response && error.response.data) {
      console.error('📝 Backend Response:', error.response.data);
    }
    console.error('════════════════════════════════════════');
    throw error;
  });
}

// Get distinct appointment types from backend
export async function getAppointmentTypes(): Promise<string[]> {
  try {
    console.log('📡 Fetching appointment types from backend...');
    const types = await request<string[]>("/Appointments/GetAppointmentType");
    console.log('✅ Appointment types fetched:', types);
    return Array.isArray(types) ? types.sort() : [];
  } catch (error) {
    console.error('❌ Failed to fetch appointment types:', error);
    return [];
  }
}

// Get distinct appointment statuses from backend
export async function getAppointmentStatuses(): Promise<string[]> {
  try {
    console.log('📡 Fetching appointment statuses from backend...');
    const statuses = await request<string[]>("/Appointments/GetStatus");
    console.log('✅ Appointment statuses fetched:', statuses);
    return Array.isArray(statuses) ? statuses.sort() : [];
  } catch (error) {
    console.error('❌ Failed to fetch appointment statuses:', error);
    return [];
  }
}

