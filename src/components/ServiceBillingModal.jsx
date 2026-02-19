import React, { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  Mail, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  User, 
  FileText,
  Clock,
  Download,
  X,
  Hospital,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendEmail } from "../services/emailService";
import { getClinic } from "../services/clinicService";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { request } from "../services/apiClient";
import { useNavigate } from "react-router-dom";

export function ServiceBillingModal({ show, onClose, appointmentId, appointmentDetails, invoiceNumber: passedInvoiceNumber, onSuccess }) {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [displayInvoiceNumber, setDisplayInvoiceNumber] = useState("INV-2026-001");
  const [consultationFee, setConsultationFee] = useState(500);
  const [consultationGST, setConsultationGST] = useState(18);
  const [otherCharges, setOtherCharges] = useState([
    { id: "1", name: "Registration", amount: 50, gstPercent: 0 }
  ]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modeOfPayment, setModeOfPayment] = useState("Cash");
  const [savedLineItems, setSavedLineItems] = useState([]);
  const [modalMode, setModalMode] = useState("edit"); // "edit" for new, "view" for existing
  const [loading, setLoading] = useState(true);
  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get clinic ID and doctor info
  const getClinicIdAndDoctorInfo = () => {
    const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    
    return {
      clinicId: selectedAccess.clinicId || userData.clinicId || 0,
      doctorName: userData.username || "Dr. Dentist",
      registrationNumber: userData.registrationNumber || "Registration #",
      enterpriseId: selectedAccess.enterpriseId || userData.enterpriseId || 0
    };
  };

  // Load clinic data from API
  useEffect(() => {
    if (show) {
      console.log("🔍 Modal opened - received passedInvoiceNumber:", passedInvoiceNumber);
      
      const { clinicId } = getClinicIdAndDoctorInfo();
      if (clinicId) {
        loadClinicData(clinicId);
      }
      // Pre-populate with appointment details
      if (appointmentDetails) {
        setPatientName(`${appointmentDetails.firstName || ""} ${appointmentDetails.lastName || ""}`.trim());
        setRecipientEmail(appointmentDetails.email || "");
      }
      
      // Initialize displayInvoiceNumber from passedInvoiceNumber
      if (passedInvoiceNumber) {
        console.log("✅ Setting displayInvoiceNumber to:", passedInvoiceNumber);
        setDisplayInvoiceNumber(passedInvoiceNumber);
        checkForExistingInvoiceByNumber(passedInvoiceNumber);
      } else {
        console.log("⚠️ No passedInvoiceNumber, checking for existing appointment invoice");
        checkForExistingInvoice();
      }
    }
  }, [show, appointmentDetails, appointmentId, passedInvoiceNumber]);

  const loadClinicData = async (clinicId) => {
    setLoadingClinic(true);
    try {
      const data = await getClinic(clinicId);
      setClinicInfo(data);
      console.log("✅ Clinic data loaded:", data);
    } catch (error) {
      console.error("Failed to load clinic:", error);
      toast.error("Failed to load clinic details");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      setClinicInfo({
        clinicName: userData.clinicName || "Dental Clinic",
        clinicAddress: userData.clinicAddress || "Clinic Address",
        clinicPhone: userData.clinicPhone || "+1-555-1234",
        clinicEmail: userData.clinicEmail || "clinic@example.com"
      });
    } finally {
      setLoadingClinic(false);
    }
  };

  // Check if invoice already exists for this appointment
  const checkForExistingInvoice = async () => {
    setLoading(true);
    try {
      // Try to find an existing invoice for this appointment
      // The backend should search for invoices by appointmentId
      const response = await request(`/Services/GetCompleteInvoice?appointmentId=${appointmentId}`, {
        method: "GET"
      });
      
      if (response && response.header && response.header.invoiceNumber) {
        // Invoice exists - set view mode
        console.log("✅ Found existing invoice:", response);
        setModalMode("view");
        setExistingInvoiceNumber(response.header.invoiceNumber);
        setDisplayInvoiceNumber(response.header.invoiceNumber);
        setModeOfPayment(response.header.modeOfPayment || "Cash");
        setAmountPaid(response.header.paidAmount || 0);
        setSavedLineItems(response.lineItems || []);
        
        // Pre-populate patient info from response
        if (appointmentDetails) {
          setPatientName(`${appointmentDetails.firstName || ""} ${appointmentDetails.lastName || ""}`.trim());
          setRecipientEmail(appointmentDetails.email || "");
        }
        
        toast.success("📋 Existing invoice loaded successfully!");
      } else {
        // No invoice found - stay in edit mode
        setModalMode("edit");
        setExistingInvoiceNumber(null);
      }
    } catch (error) {
      // Invoice not found - this is expected for new appointments
      // Can be 404 or other error
      console.log("No existing invoice found (expected for new appointments):", error.message);
      setModalMode("edit");
      setExistingInvoiceNumber(null);
    } finally {
      setLoading(false);
    }
  };

  // Check for existing invoice by invoice number (when clicking View from invoice list)
  const checkForExistingInvoiceByNumber = async (invNumber) => {
    setLoading(true);
    try {
      // Call GetCompleteInvoice with invoice number
      console.log(`📦 Fetching invoice details for: ${invNumber}`);
      const response = await request(`/Services/GetCompleteInvoice?invoiceNumber=${invNumber}`, {
        method: "GET"
      });
      
      if (response && response.header && response.header.invoiceNumber) {
        // Invoice exists - set view mode
        console.log("✅ Found invoice by number:", response);
        setModalMode("view");
        setExistingInvoiceNumber(response.header.invoiceNumber);
        setDisplayInvoiceNumber(response.header.invoiceNumber);
        setModeOfPayment(response.header.modeOfPayment || "Cash");
        setAmountPaid(response.header.paidAmount || 0);
        setSavedLineItems(response.lineItems || []);
        
        // Pre-populate patient info from response
        if (appointmentDetails) {
          setPatientName(`${appointmentDetails.firstName || ""} ${appointmentDetails.lastName || ""}`.trim());
          setRecipientEmail(appointmentDetails.email || "");
        }
        
        toast.success("📋 Invoice loaded successfully!");
      } else {
        // No invoice found - stay in edit mode
        console.warn(`Invoice ${invNumber} not found`);
        setModalMode("edit");
        setExistingInvoiceNumber(null);
      }
    } catch (error) {
      console.error(`Failed to fetch invoice ${invNumber}:`, error);
      toast.error(`Failed to load invoice: ${error.message}`);
      setModalMode("edit");
      setExistingInvoiceNumber(null);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = useMemo(() => {
    const consultationWithGST = consultationFee + (consultationFee * consultationGST / 100);
    const othersWithGST = otherCharges.reduce((sum, item) => {
      const gst = item.amount * (item.gstPercent || 0) / 100;
      return sum + item.amount + gst;
    }, 0);
    return consultationWithGST + othersWithGST;
  }, [consultationFee, consultationGST, otherCharges]);

  const totalGST = useMemo(() => {
    const consultationGSTAmount = consultationFee * consultationGST / 100;
    const othersGST = otherCharges.reduce((sum, item) => {
      const gst = item.amount * (item.gstPercent || 0) / 100;
      return sum + gst;
    }, 0);
    return consultationGSTAmount + othersGST;
  }, [consultationFee, consultationGST, otherCharges]);

  const subtotalAmount = useMemo(() => {
    return consultationFee + otherCharges.reduce((sum, item) => sum + item.amount, 0);
  }, [consultationFee, otherCharges]);

  const pendingAmount = totalAmount - amountPaid;

  const status = amountPaid === 0 ? "Pending" : amountPaid >= totalAmount ? "Paid" : "Partial";

  const addCharge = () => {
    const newCharge = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
      gstPercent: 0
    };
    setOtherCharges([...otherCharges, newCharge]);
  };

  const updateCharge = (id, field, value) => {
    setOtherCharges(otherCharges.map(charge => 
      charge.id === id ? { ...charge, [field]: field === "amount" || field === "gstPercent" ? Number(value) : value } : charge
    ));
  };

  const deleteCharge = (id) => {
    if (otherCharges.length === 1) {
      toast.error("At least one charge is required");
      return;
    }
    setOtherCharges(otherCharges.filter(c => c.id !== id));
  };

  // Generate HTML for email
  const generateServiceBillingEmail = () => {
    const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();
    const chargesHTML = [
      { name: "Consultation Fee", amount: consultationFee, gstPercent: consultationGST, gstAmount: consultationFee * consultationGST / 100 },
      ...otherCharges.filter(c => c.name && c.amount).map(c => ({ ...c, gstAmount: c.amount * c.gstPercent / 100 }))
    ].map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: center; background-color: #f9fafb; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 12px; background-color: #f9fafb;"><strong>${item.name}</strong></td>
        <td style="padding: 12px; text-align: right; background-color: #f9fafb; color: #2563eb;">₹${item.amount.toFixed(2)}</td>
        <td style="padding: 12px; text-align: center; background-color: #f9fafb; color: #f59e0b;">${item.gstPercent}%</td>
        <td style="padding: 12px; text-align: right; background-color: #f9fafb; color: #f59e0b;">₹${item.gstAmount.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; background-color: #f9fafb;">₹${(item.amount + item.gstAmount).toFixed(2)}</td>
      </tr>
    `).join("");
    
    const statusColor = status === "Paid" ? "#10b981" : status === "Partial" ? "#f59e0b" : "#ef4444";
    const statusBg = status === "Paid" ? "#ecfdf5" : status === "Partial" ? "#fffbeb" : "#fef2f2";

    const emailHTML = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 850px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 50px 40px; text-align: center; }
    .clinic-name { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
    .clinic-subtitle { font-size: 14px; opacity: 0.9; margin-bottom: 20px; }
    .invoice-no { font-size: 12px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 4px; display: inline-block; }
    .patient-section { background: linear-gradient(to right, #eff6ff, #dbeafe); padding: 30px 40px; border-bottom: 2px solid #bfdbfe; }
    .content { padding: 40px; }
    .patient-name { font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    thead tr { background: #eff6ff; }
    th { padding: 15px 12px; text-align: left; font-weight: 700; color: #1e40af; border-bottom: 2px solid #bfdbfe; font-size: 13px; text-transform: uppercase; }
    .totals-section { background: #eff6ff; padding: 30px 40px; border-top: 2px solid #bfdbfe; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #3b82f6; border-top: 2px solid #bfdbfe; padding-top: 15px; }
    .status-badge { display: inline-block; padding: 10px 20px; border-radius: 8px; background: ${statusBg}; color: ${statusColor}; font-weight: bold; margin-top: 15px; font-size: 14px; }
    .footer { background: #f9fafb; padding: 30px 40px; text-align: center; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .doctor-sig { background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="clinic-name">💙 ${clinicInfo?.clinicName || "Dental Clinic"}</div>
      <div class="clinic-subtitle">Service & Consultation Billing Invoice</div>
      <div class="invoice-no">Invoice # ${displayInvoiceNumber}</div>
    </div>

    <div class="patient-section">
      <div class="patient-name">👤 ${patientName || "Patient"}</div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
        <strong>Clinic:</strong> ${clinicInfo?.clinicName || "Clinic"}<br/>
        <strong>Contact:</strong> ${clinicInfo?.clinicPhone || "N/A"} | ${clinicInfo?.clinicEmail || "N/A"}
      </div>
    </div>

    <div class="content">
      <h3 style="color: #3b82f6; margin-bottom: 20px; font-size: 16px; text-transform: uppercase;">Service Charges</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 8%">#</th>
            <th style="width: 40%">Service Description</th>
            <th style="width: 12%">Amount</th>
            <th style="width: 10%">GST %</th>
            <th style="width: 12%">GST Amount</th>
            <th style="width: 18%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${chargesHTML}
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="total-row">
        <span style="color: #6b7280;">Subtotal:</span>
        <span style="color: #1f2937;">₹${subtotalAmount.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span style="color: #f59e0b;">Total GST:</span>
        <span style="color: #f59e0b; font-weight: bold;">₹${totalGST.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span>Final Total Amount:</span>
        <span>₹${totalAmount.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span style="color: #6b7280;">Amount Paid:</span>
        <span style="color: #1f2937;">₹${amountPaid.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span>Balance Due:</span>
        <span>₹${pendingAmount.toFixed(2)}</span>
      </div>
      <div class="status-badge">Payment Status: ${status}</div>
    </div>

    <div class="content">
      <div class="doctor-sig">
        <p style="margin: 0; color: #1e40af; font-weight: 700; font-size: 14px;">
          Dr. ${doctorName}
        </p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
          ${registrationNumber}
        </p>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">This is a computer-generated invoice. Valid without signature.</p>
    </div>
  </div>
</body>
</html>
    `;
    return emailHTML;
  };

  // Handle form submission and API call
  const handleSubmit = async () => {
    if (!appointmentId || !patientName || !clinicInfo) {
      toast.error("Missing required information");
      return;
    }

    setSubmitting(true);
    try {
      const { doctorName } = getClinicIdAndDoctorInfo();
      
      // Build invoice line items
      const lineItems = [
        {
          invoiceNumber: displayInvoiceNumber,
          lineItemNumber: 1,
          serviceDescription: "Consultation Fee",
          serviceCost: consultationFee,
          gst: consultationFee * consultationGST / 100,
          modeOfPayment: modeOfPayment,
          totalAmount: consultationFee + (consultationFee * consultationGST / 100),
          amountPaid: amountPaid
        },
        ...otherCharges.map((charge, idx) => ({
          invoiceNumber: displayInvoiceNumber,
          lineItemNumber: idx + 2,
          serviceDescription: charge.name,
          serviceCost: charge.amount,
          gst: charge.amount * (charge.gstPercent || 0) / 100,
          modeOfPayment: modeOfPayment,
          totalAmount: charge.amount + (charge.amount * (charge.gstPercent || 0) / 100),
          amountPaid: amountPaid
        }))
      ];

      // Build complete invoice
      const completeInvoice = {
        header: {
          invoiceNumber: displayInvoiceNumber,
          patientId: appointmentDetails?.patientId || 0,
          appointmentId: appointmentId,
          doctorName: doctorName,
          billDate: new Date().toISOString(),
          modeOfPayment: modeOfPayment,
          status: amountPaid >= totalAmount ? "Paid" : amountPaid > 0 ? "Partial" : "Pending",
          totalAmount: totalAmount,
          paidAmount: amountPaid,
          pendingAmount: Math.max(0, totalAmount - amountPaid)
        },
        lineItems: lineItems
      };

      console.log("Submitting invoice:", completeInvoice);

      // Call API to Services controller with correct endpoint
      const response = await request("/Services/CreateCompleteInvoice", {
        method: "POST",
        body: JSON.stringify(completeInvoice)
      });
      
      // Store saved line items from response
      if (response && response.lineItems) {
        setSavedLineItems(response.lineItems);
      }
      
      // Show success modal instead of closing immediately
      setSuccessMessage(`✅ Invoice ${displayInvoiceNumber} created successfully!`);
      setShowSuccessModal(true);
      
      // Close modal and redirect after delay
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
        
        // Call onSuccess callback to refresh appointment list
        if (onSuccess) onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error("Error submitting invoice:", error);
      toast.error(`Failed to create invoice: ${error.message || "Please try again"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF function
  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('consultation-invoice-print');
      if (!element) {
        toast.error('Invoice element not found');
        return;
      }

      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF with multiple pages if needed
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Download PDF
      pdf.save(`Invoice_${displayInvoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download invoice PDF');
    }
  };

  // Email function
  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Please enter recipient email");
      return;
    }

    setSendingEmail(true);
    try {
      const { clinicName, clinicEmail } = clinicInfo || {};
      const emailHTML = generateServiceBillingEmail();

      await sendEmail({
        Email: recipientEmail,
        Subject: `Service Bill ${displayInvoiceNumber} from ${clinicName || "Clinic"}`,
        HtmlBody: emailHTML
      });

      toast.success("Email sent successfully!");
      setShowEmailModal(false);
      setRecipientEmail("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const markAsPaid = () => {
    setAmountPaid(totalAmount);
    toast.success("Marked as fully paid!");
  };

  if (!show) return null;

  const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();
  const statusColor = status === "Paid" ? "text-green-600" : status === "Partial" ? "text-amber-600" : "text-red-600";
  const statusBg = status === "Paid" ? "bg-green-50" : status === "Partial" ? "bg-amber-50" : "bg-red-50";
  const statusBorder = status === "Paid" ? "border-green-300" : status === "Partial" ? "border-amber-300" : "border-red-300";
  const statusIcon = status === "Paid" ? <CheckCircle2 size={20} /> : status === "Partial" ? <Clock size={20} /> : <AlertCircle size={20} />;
  const isViewMode = modalMode === "view";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 z-10 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                    {loading ? "⏳" : isViewMode ? "👁️" : "💳"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold">
                      {loading ? "Loading Invoice..." : isViewMode ? "📋 Invoice Details" : "💳 Create Service Invoice"}
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {loading ? "Retrieving invoice information..." : isViewMode ? `Invoice #${displayInvoiceNumber}` : `New Invoice for Appointment #${appointmentId}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!loading && isViewMode && (
                    <div className="flex items-center gap-2 mr-4 px-3 py-2 bg-white/20 rounded-lg border border-white/40">
                      <div className={`w-3 h-3 rounded-full ${status === "Paid" ? "bg-green-400" : status === "Partial" ? "bg-amber-400" : "bg-red-400"}`}></div>
                      <span className="text-sm font-semibold">{status}</span>
                    </div>
                  )}
                  {!loading && (
                    <>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium bg-white/20 border-white/40 hover:bg-white/30"
                        title="Download Invoice as PDF"
                      >
                        <Download size={18} />
                        Download
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowEmailModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium bg-white/20 border-white/40 hover:bg-white/30"
                        title="Email Invoice"
                      >
                        <Mail size={18} />
                        Email
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium bg-white/20 border-white/40 hover:bg-white/30"
                        title="Print Invoice"
                      >
                        <Printer size={18} />
                        Print
                      </motion.button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="ml-2 p-2 hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Mode Warning - Removed, no longer needed */}

            {/* Main Content */}
            <div className="p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-600 font-semibold">Checking for existing invoice...</p>
                </div>
              ) : isViewMode && existingInvoiceNumber ? (
                <>
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={24} className="text-green-600" />
                      <div>
                        <p className="font-bold text-green-700">Invoice Already Exists</p>
                        <p className="text-sm text-green-600">This appointment has been invoiced. You can view, print, or email the invoice.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              <div id="consultation-invoice-print" className="bg-white">
                
                {/* Professional Invoice Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-10 rounded-t-2xl">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h1 className="text-4xl font-bold mb-1">{clinicInfo?.clinicName || "Dental Clinic"}</h1>
                      <p className="text-blue-100 text-sm">Service & Consultation Invoice</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Invoice</p>
                      <p className="text-3xl font-bold">{displayInvoiceNumber}</p>
                    </div>
                  </div>
                
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="text-blue-100 font-semibold mb-1">Date</p>
                      <p className="text-lg font-bold">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 font-semibold mb-1">Clinic Contact</p>
                      <p className="text-sm">{clinicInfo?.clinicPhone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-blue-100 font-semibold mb-1">Email</p>
                      <p className="text-sm">{clinicInfo?.clinicEmail || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Patient & Bill-To Section */}
                <div className="grid grid-cols-2 gap-8 p-8 border-b-2 border-blue-100">
                  {/* Patient Info */}
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Billed To</p>
                    <input 
                      type="text"
                      placeholder="Enter patient name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      disabled={isViewMode}
                      className="text-2xl font-bold text-slate-800 border-b-2 border-blue-300 pb-2 w-full focus:border-blue-600 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-slate-600"
                    />
                  </div>

                  {/* Clinic Address */}
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Billing Address</p>
                    <div className="text-sm text-slate-700">
                      <p className="font-semibold text-slate-800 mb-1">{clinicInfo?.clinicName}</p>
                      <p>{clinicInfo?.clinicAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Services Table Section */}
                <div className="p-8">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Service Details</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                          <th className="text-left px-3 py-3 text-xs font-bold text-blue-700 uppercase">Line #</th>
                          <th className="text-left px-3 py-3 text-xs font-bold text-blue-700 uppercase">Service Name</th>
                          <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">Amount (₹)</th>
                          <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">GST %</th>
                          <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">GST Amount (₹)</th>
                          <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">Total (₹)</th>
                          <th className="text-center px-3 py-3 text-xs font-bold text-blue-700 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Consultation Fee Row */}
                        <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                          <td className="px-3 py-4 text-sm font-bold text-blue-700">1</td>
                          <td className="px-3 py-4">
                            <p className="text-sm font-semibold text-slate-800">Consultation Fee</p>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-slate-600 print:hidden">₹</span>
                              <input 
                                type="number"
                                step="0.01"
                                value={consultationFee}
                                onChange={(e) => setConsultationFee(Number(e.target.value))}
                                disabled={isViewMode}
                                className="w-20 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                              <span className="hidden print:inline text-sm font-bold text-slate-800">₹{consultationFee.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number"
                                step="0.01"
                                value={consultationGST}
                                onChange={(e) => setConsultationGST(Number(e.target.value))}
                                disabled={isViewMode}
                                className="w-16 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                              <span className="text-xs text-slate-600 print:hidden">%</span>
                              <span className="hidden print:inline text-sm font-bold text-slate-800">{consultationGST}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right font-bold text-amber-600">₹{(consultationFee * consultationGST / 100).toFixed(2)}</td>
                          <td className="px-3 py-4 text-right font-bold text-blue-700">₹{(consultationFee + consultationFee * consultationGST / 100).toFixed(2)}</td>
                          <td className="px-3 py-4 text-center print:hidden">
                            <span className="text-xs text-gray-500">Fixed</span>
                          </td>
                        </tr>

                        {/* Other Charges Rows */}
                        {otherCharges.map((charge, idx) => (
                          <tr key={charge.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                            <td className="px-3 py-4 text-sm font-bold text-blue-700">{idx + 2}</td>
                            <td className="px-3 py-4">
                              <input 
                                type="text"
                                placeholder="e.g., Additional Treatment"
                                value={charge.name}
                                onChange={(e) => updateCharge(charge.id, "name", e.target.value)}
                                disabled={isViewMode}
                                className="w-full text-sm py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:border-0 print:px-0 print:py-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                              <span className="hidden print:inline text-sm font-semibold text-slate-800">{charge.name || '—'}</span>
                            </td>
                            <td className="px-3 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-xs text-slate-600 print:hidden">₹</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={charge.amount}
                                  onChange={(e) => updateCharge(charge.id, "amount", e.target.value)}
                                  disabled={isViewMode}
                                  className="w-20 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden print:border-0 print:px-0 print:py-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  placeholder="0.00"
                                />
                                <span className="hidden print:inline text-sm font-bold text-slate-800">₹{charge.amount.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={charge.gstPercent}
                                  onChange={(e) => updateCharge(charge.id, "gstPercent", e.target.value)}
                                  disabled={isViewMode}
                                  className="w-16 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                <span className="text-xs text-slate-600 print:hidden">%</span>
                                <span className="hidden print:inline text-sm font-bold text-slate-800">{charge.gstPercent}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-right font-bold text-amber-600">₹{(charge.amount * charge.gstPercent / 100).toFixed(2)}</td>
                            <td className="px-3 py-4 text-right font-bold text-blue-700">₹{(charge.amount + charge.amount * charge.gstPercent / 100).toFixed(2)}</td>
                            <td className="px-3 py-4 text-center print:hidden">
                              {!isViewMode && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => deleteCharge(charge.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </motion.button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Charge Button */}
                  {!isViewMode && (
                    <div className="mt-4 print:hidden">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addCharge}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        <Plus size={18} />
                        Add Service
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Saved Billing Information - Single Line Grid Format */}
                {savedLineItems && savedLineItems.length > 0 && (
                  <div className="p-8 border-t-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-6">✅ Invoice Details</p>
                    
                    {/* Invoice Line Items - Single Line Grid */}
                    <div className="space-y-2">
                      {savedLineItems.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white rounded-lg border-2 border-green-200 p-4 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* Line Number */}
                            <div className="md:col-span-1">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">Line</p>
                              <p className="text-lg font-bold text-green-700">#{item.lineItemNumber}</p>
                            </div>
                            
                            {/* Service Description */}
                            <div className="md:col-span-4">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">Service</p>
                              <p className="text-sm font-semibold text-slate-800">{item.serviceDescription}</p>
                            </div>
                            
                            {/* Cost */}
                            <div className="md:col-span-1 text-center">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">Cost</p>
                              <p className="text-sm font-bold text-slate-700">₹{item.serviceCost?.toFixed(2) || '0.00'}</p>
                            </div>
                            
                            {/* GST */}
                            <div className="md:col-span-1 text-center">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">GST</p>
                              <p className="text-sm font-bold text-amber-600">₹{item.gst?.toFixed(2) || '0.00'}</p>
                            </div>
                            
                            {/* Total */}
                            <div className="md:col-span-1 text-center">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">Total</p>
                              <p className="text-sm font-bold text-blue-700">₹{item.totalAmount?.toFixed(2) || '0.00'}</p>
                            </div>
                            
                            {/* Paid */}
                            <div className="md:col-span-1 text-center">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">Paid</p>
                              <p className="text-sm font-bold text-green-700">₹{item.paidAmount?.toFixed(2) || '0.00'}</p>
                            </div>
                            
                            {/* Pending */}
                            <div className="md:col-span-1 text-center">
                              <p className="text-xs text-green-600 font-bold uppercase mb-1">Pending</p>
                              <p className="text-sm font-bold text-red-700">₹{item.pendingAmount?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals & Payment Section */}
                <div className="grid grid-cols-2 gap-8 p-8 border-t-2 border-blue-100">
                  {/* Doctor Info */}
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Attending Doctor</p>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <p className="font-bold text-slate-800 text-lg">Dr. {doctorName}</p>
                      <p className="text-sm text-slate-600 mt-1">{registrationNumber}</p>
                    </div>
                  </div>

                  {/* Billing Summary */}
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Billing Summary</p>
                    <div className="space-y-3">
                      {/* Subtotal */}
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
                        <span className="text-sm font-semibold text-slate-700">Subtotal</span>
                        <span className="text-lg font-bold text-slate-600">₹{subtotalAmount.toFixed(2)}</span>
                      </div>

                      {/* GST Amount */}
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <span className="text-sm font-semibold text-slate-700">Total GST</span>
                        <span className="text-lg font-bold text-amber-600">₹{totalGST.toFixed(2)}</span>
                      </div>

                      {/* Final Total Amount */}
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300">
                        <span className="text-sm font-bold text-blue-900">Final Total Amount</span>
                        <span className="text-2xl font-bold text-blue-700">₹{totalAmount.toFixed(2)}</span>
                      </div>

                      {/* Amount Paid */}
                      <div className="flex items-center justify-between gap-4 p-3 bg-white border-2 border-blue-200 rounded-lg">
                        <label className="text-sm font-semibold text-slate-700">Amount Paid</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-600 print:hidden">₹</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(Number(e.target.value))}
                            disabled={isViewMode}
                            className="w-28 text-right text-lg font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden print:border-0 print:px-0 print:py-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <span className="hidden print:inline w-28 text-right text-lg font-bold text-slate-800">₹{amountPaid.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Balance Due */}
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                        <span className="text-sm font-semibold text-slate-700">Balance Due</span>
                        <span className="text-2xl font-bold text-red-600">₹{pendingAmount.toFixed(2)}</span>
                      </div>

                      {/* Payment Status */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${statusBg} ${statusBorder}`}>
                        <div className="flex items-center gap-2">
                          <div className={statusColor}>{statusIcon}</div>
                          <span className={`font-bold text-sm ${statusColor}`}>Payment Status</span>
                        </div>
                        <span className={`font-bold text-lg ${statusColor}`}>{status}</span>
                      </div>

                      {/* Mode of Payment */}
                      <div className="flex items-center justify-between gap-2 print:hidden">
                        <label className="text-sm font-semibold text-slate-700">Payment Mode</label>
                        <select
                          value={modeOfPayment}
                          onChange={(e) => setModeOfPayment(e.target.value)}
                          disabled={isViewMode}
                          className="px-3 py-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option>Cash</option>
                          <option>Card</option>
                          <option>UPI</option>
                          <option>Insurance</option>
                          <option>Cheque</option>
                        </select>
                      </div>

                      {/* Quick Actions */}
                      {!isViewMode && (
                        <div className="flex gap-2 pt-2 print:hidden">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={markAsPaid}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all text-sm"
                          >
                            ✓ Mark as Paid
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center border-t-2 border-blue-100 rounded-b-2xl">
                  <p className="text-xs text-slate-600 mb-1">This is a computer-generated invoice. Valid without signature.</p>
                  <p className="text-xs text-slate-500">
                    For queries, contact {clinicInfo?.clinicPhone} or {clinicInfo?.clinicEmail}
                  </p>
                </div>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-t-2 border-slate-200 flex items-center justify-between print:hidden">
              {isViewMode && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-700">Invoice already exists. Use Print or Email options above.</p>
                </div>
              )}
              <div className="ml-auto flex items-center justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
                >
                  {isViewMode ? "Close" : "Cancel"}
                </motion.button>
                {!isViewMode && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Submit & Create Invoice
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Email Modal */}
            <AnimatePresence>
              {showEmailModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                  onClick={() => setShowEmailModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Send Invoice via Email</h3>
                    <input
                      type="email"
                      placeholder="Recipient email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none mb-4"
                    />
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowEmailModal(false)}
                        className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {sendingEmail ? "Sending..." : "Send"}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
              {showSuccessModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
                    >
                      ✅
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Success!</h3>
                    <p className="text-slate-600 mb-1">{successMessage}</p>
                    <p className="text-sm text-slate-500">Redirecting back to appointments...</p>
                    <div className="mt-6 w-12 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto"></div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
