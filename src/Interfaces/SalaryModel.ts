export interface DoctorSalaryInfo {
  doctorId: number;
  doctorName: string;
  specialty: string;
  registrationNumber: string;
  clinicId: number;
  clinicName: string;
  staffType: 'doctor' | 'dentist' | 'hygienist' | 'assistant';
  fixedSalary: number;
  totalPatientsThisMonth: number;
  totalRevenueGenerated: number;
  profileImage?: string;
}

export interface PatientTreatmentRecord {
  recordId: number;
  patientId: number;
  patientName: string;
  treatmentDate: string;
  treatmentType: string;
  treatmentAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount: number;
  pendingAmount: number;
  incentivePercent?: number;
  incentiveAmount?: number;
}

export interface SalaryCalculation {
  doctorId: number;
  doctorName: string;
  month: string;
  year: number;
  fixedSalary: number;
  treatmentRecords: PatientTreatmentRecord[];
  totalRevenue: number;
  totalIncentives: number;
  grandTotal: number;
  calculatedDate: string;
}

export interface SalaryPaymentRecord {
  paymentId: number;
  doctorId: number;
  month: string;
  year: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'processing';
}
