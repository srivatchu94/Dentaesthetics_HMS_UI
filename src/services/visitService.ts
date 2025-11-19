import { request, BASE_URL } from './apiClient';
import { PatientVisitInformation } from '../Interfaces/PatientVisitInformationModel';
import { Prescription } from '../Interfaces/PrescriptionModel';

const VISIT_ENDPOINT = '/PatientVisitInformation';
const PRESCRIPTION_ENDPOINT = '/Prescriptions';

// Visit Information API calls
export const visitService = {
  // Get all visits
  getAllVisits: async (): Promise<PatientVisitInformation[]> => {
    return await request<PatientVisitInformation[]>(VISIT_ENDPOINT);
  },

  // Get visit by ID
  getVisitById: async (visitId: number): Promise<PatientVisitInformation> => {
    return await request<PatientVisitInformation>(`${VISIT_ENDPOINT}/${visitId}`);
  },

  // Get visits by patient ID
  getVisitsByPatientId: async (patientId: number): Promise<PatientVisitInformation[]> => {
    return await request<PatientVisitInformation[]>(`${VISIT_ENDPOINT}/patient/${patientId}`);
  },

  // Get visits by clinic ID
  getVisitsByClinicId: async (clinicId: number): Promise<PatientVisitInformation[]> => {
    return await request<PatientVisitInformation[]>(`${VISIT_ENDPOINT}/clinic/${clinicId}`);
  },

  // Get visits by date range
  getVisitsByDateRange: async (startDate: string, endDate: string): Promise<PatientVisitInformation[]> => {
    return await request<PatientVisitInformation[]>(
      `${VISIT_ENDPOINT}/date-range?startDate=${startDate}&endDate=${endDate}`
    );
  },

  // Create new visit
  createVisit: async (visit: Omit<PatientVisitInformation, 'visitId'>): Promise<PatientVisitInformation> => {
    return await request<PatientVisitInformation>(VISIT_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(visit)
    });
  },

  // Update visit
  updateVisit: async (visitId: number, visit: PatientVisitInformation): Promise<PatientVisitInformation> => {
    return await request<PatientVisitInformation>(`${VISIT_ENDPOINT}/${visitId}`, {
      method: 'PUT',
      body: JSON.stringify(visit)
    });
  },

  // Delete visit
  deleteVisit: async (visitId: number): Promise<void> => {
    await request<void>(`${VISIT_ENDPOINT}/${visitId}`, { method: 'DELETE' });
  },

  // Search visits
  searchVisits: async (searchTerm: string): Promise<PatientVisitInformation[]> => {
    return await request<PatientVisitInformation[]>(
      `${VISIT_ENDPOINT}/search?term=${encodeURIComponent(searchTerm)}`
    );
  }
};

// Prescription API calls
export const prescriptionService = {
  // Get all prescriptions
  getAllPrescriptions: async (): Promise<Prescription[]> => {
    return await request<Prescription[]>(PRESCRIPTION_ENDPOINT);
  },

  // Get prescription by ID
  getPrescriptionById: async (prescriptionId: number): Promise<Prescription> => {
    return await request<Prescription>(`${PRESCRIPTION_ENDPOINT}/${prescriptionId}`);
  },

  // Get prescriptions by visit ID
  getPrescriptionsByVisitId: async (visitId: number): Promise<Prescription[]> => {
    return await request<Prescription[]>(`${PRESCRIPTION_ENDPOINT}/visit/${visitId}`);
  },

  // Get prescriptions by patient ID
  getPrescriptionsByPatientId: async (patientId: number): Promise<Prescription[]> => {
    return await request<Prescription[]>(`${PRESCRIPTION_ENDPOINT}/patient/${patientId}`);
  },

  // Get prescriptions by doctor ID
  getPrescriptionsByDoctorId: async (doctorId: number): Promise<Prescription[]> => {
    return await request<Prescription[]>(`${PRESCRIPTION_ENDPOINT}/doctor/${doctorId}`);
  },

  // Create new prescription
  createPrescription: async (prescription: Omit<Prescription, 'prescriptionId' | 'createdAt' | 'updatedAt'>): Promise<Prescription> => {
    return await request<Prescription>(PRESCRIPTION_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(prescription)
    });
  },

  // Update prescription
  updatePrescription: async (prescriptionId: number, prescription: Prescription): Promise<Prescription> => {
    return await request<Prescription>(`${PRESCRIPTION_ENDPOINT}/${prescriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(prescription)
    });
  },

  // Delete prescription
  deletePrescription: async (prescriptionId: number): Promise<void> => {
    await request<void>(`${PRESCRIPTION_ENDPOINT}/${prescriptionId}`, { method: 'DELETE' });
  },

  // Send prescription (email/SMS)
  sendPrescription: async (prescriptionId: number, method: 'email' | 'sms' | 'both'): Promise<void> => {
    await request<void>(`${PRESCRIPTION_ENDPOINT}/${prescriptionId}/send`, {
      method: 'POST',
      body: JSON.stringify({ method })
    });
  }
};

export default { visitService, prescriptionService };
