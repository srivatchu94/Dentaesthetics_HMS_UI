/// <summary>
/// Service Invoice Models - For billing appointments
/// </summary>

/**
 * Invoice Header Model - Represents the main invoice/bill
 */
export interface ServiceInvoiceHeader {
  invoiceNumber: string;
  patientId: number;
  appointmentId: number;
  doctorName: string;
  billDate: string; // ISO date string
  modeOfPayment: string; // Cash, Card, UPI, Insurance
  totalAmount: number;
  netAmount: number;
}

/**
 * Invoice Line Item Model - Represents individual services/charges on the invoice
 */
export interface ServiceInvoiceLineItem {
  invoiceNumber: string;
  lineItemNumber: number;
  serviceDescription: string;
  serviceCost: number;
  gst: number;
  modeOfPayment: string;
  totalAmount: number;
  amountPaid: number;
}

/**
 * Combined Invoice Model - Invoice Header with all line items
 */
export interface ServiceInvoiceComplete {
  header: ServiceInvoiceHeader;
  lineItems: ServiceInvoiceLineItem[];
}

/**
 * Service/Doctor Service Model - For adding services to invoice
 */
export interface ServiceItem {
  id: string;
  name: string;
  amount: number;
  gstPercent: number;
  gstAmount?: number;
  totalAmount?: number;
}
