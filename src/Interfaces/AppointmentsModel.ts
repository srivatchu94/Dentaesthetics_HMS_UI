// Appointments Model matching backend API
export interface AppointmentsModel {
  appointmentId?: number;
  
  // References
  patientId: number;
  clinicId: number;
  doctorId?: number | null;
  attendingPhysician?: string | null;
  enterpriseId?: number;

  // Patient details (from appointments row)
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;

  // Scheduling
  appointmentDate: string;              // ISO date string (DateTime in C#)
  startTime?: string | null;            // TimeSpan as string (HH:mm:ss)
  endTime?: string | null;              // TimeSpan as string (HH:mm:ss)
  durationMinutes?: number | null;

  // Details
  appointmentType?: string | null;      // e.g., "Consultation", "Follow-up", "Telehealth"
  reasonForVisit?: string | null;
  notes?: string | null;
  roomNumber?: string | null;
  telehealthLink?: string | null;

  // Status & billing
  status?: string | null;               // e.g., "Scheduled", "Completed", "Cancelled", "NoShow"
  isConfirmed?: boolean;
  billableAmount?: number | null;       // Amount to be billed for this appointment
  paidAmount?: number | null;
  pendingAmount?: number | null;
  paymentStatus?: string | null;       // e.g., "Pending", "Paid", "Invoice", "Partial"

  // Audit
  createdAt?: string;                   // DateTime as ISO string
  updatedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}
