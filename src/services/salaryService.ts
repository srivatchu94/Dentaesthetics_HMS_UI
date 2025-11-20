import { request } from "./apiClient";
import type { DoctorSalaryInfo, PatientTreatmentRecord, SalaryCalculation, SalaryPaymentRecord, SalaryHistoryRecord } from "../Interfaces";

// Get all doctors with salary information
export const getAllDoctorsSalaryInfo = async (): Promise<DoctorSalaryInfo[]> => {
  return request<DoctorSalaryInfo[]>('/api/salary/doctors');
};

// Search doctors by name
export const searchDoctorsByName = async (searchTerm: string): Promise<DoctorSalaryInfo[]> => {
  return request<DoctorSalaryInfo[]>(`/api/salary/doctors/search?name=${encodeURIComponent(searchTerm)}`);
};

// Get doctor's treatment records for a specific period
export const getDoctorTreatmentRecords = async (
  doctorId: number, 
  month?: number, 
  year?: number
): Promise<PatientTreatmentRecord[]> => {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request<PatientTreatmentRecord[]>(`/api/salary/doctor/${doctorId}/treatments${queryString}`);
};

// Calculate salary for a doctor
export const calculateDoctorSalary = async (
  doctorId: number,
  month: number,
  year: number,
  treatmentRecords: PatientTreatmentRecord[]
): Promise<SalaryCalculation> => {
  return request<SalaryCalculation>('/api/salary/calculate', {
    method: 'POST',
    body: JSON.stringify({ doctorId, month, year, treatmentRecords })
  });
};

// Get salary calculation history
export const getSalaryHistory = async (doctorId: number): Promise<SalaryCalculation[]> => {
  return request<SalaryCalculation[]>(`/api/salary/doctor/${doctorId}/history`);
};

// Process salary payment
export const processSalaryPayment = async (
  doctorId: number,
  salaryCalculation: SalaryCalculation,
  paymentMethod: string
): Promise<SalaryPaymentRecord> => {
  return request<SalaryPaymentRecord>('/api/salary/payment', {
    method: 'POST',
    body: JSON.stringify({ doctorId, salaryCalculation, paymentMethod })
  });
};

// Get payment records
export const getPaymentRecords = async (doctorId?: number): Promise<SalaryPaymentRecord[]> => {
  const url = doctorId 
    ? `/api/salary/payments?doctorId=${doctorId}` 
    : '/api/salary/payments';
  return request<SalaryPaymentRecord[]>(url);
};

// Update treatment incentive percentage
export const updateTreatmentIncentive = async (
  recordId: number,
  incentivePercent: number
): Promise<PatientTreatmentRecord> => {
  return request<PatientTreatmentRecord>(`/api/salary/treatment/${recordId}/incentive`, {
    method: 'PATCH',
    body: JSON.stringify({ incentivePercent })
  });
};

// Get salary history for a doctor
export const getDoctorSalaryHistory = async (doctorId: number): Promise<SalaryHistoryRecord[]> => {
  return request<SalaryHistoryRecord[]>(`/api/salary/doctor/${doctorId}/salary-history`);
};

// Update fixed salary with effective date
export const updateFixedSalary = async (
  doctorId: number,
  newSalary: number,
  effectiveDate: string,
  remarks?: string
): Promise<SalaryHistoryRecord> => {
  return request<SalaryHistoryRecord>(`/api/salary/doctor/${doctorId}/update-salary`, {
    method: 'POST',
    body: JSON.stringify({ newSalary, effectiveDate, remarks })
  });
};

export const salaryService = {
  getAllDoctorsSalaryInfo,
  searchDoctorsByName,
  getDoctorTreatmentRecords,
  calculateDoctorSalary,
  getSalaryHistory,
  processSalaryPayment,
  getPaymentRecords,
  updateTreatmentIncentive,
  getDoctorSalaryHistory,
  updateFixedSalary
};
