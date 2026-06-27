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
import { getClinicByClinicId } from "../services/clinicService";
import { searchDoctors } from "../services/doctorService";
import { toast } from "sonner";
import clinicLogo from "../assets/dhantha-logo-new.svg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { request } from "../services/apiClient";
import { useNavigate } from "react-router-dom";

export function ServiceBillingModal({ show, onClose, appointmentId, appointmentDetails, invoiceNumber: passedInvoiceNumber, onSuccess, initialMode = "edit" }) {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [displayInvoiceNumber, setDisplayInvoiceNumber] = useState("INV-2026-001");
  const [modalMode, setModalMode] = useState(initialMode); // "edit" for create new, "view" for viewing, "edit-invoice" for editing existing
  const [consultationFee, setConsultationFee] = useState(null); // Optional - null means no consultation fee
  const [consultationPaid, setConsultationPaid] = useState(0); // Per-item payment tracking
  const [otherCharges, setOtherCharges] = useState([
    { id: "1", name: "Registration", amount: 50, paidAmount: 0 }
  ]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null); // 'sending' | 'success' | 'error'
  const [clinicInfo, setClinicInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modeOfPayment, setModeOfPayment] = useState("Cash");
  const [savedLineItems, setSavedLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get clinic ID and doctor info from localStorage
  const getClinicIdAndDoctorInfo = () => {
    const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    return {
      clinicId: selectedAccess.clinicId || userData.clinicId || 0,
      doctorId: appointmentDetails?.doctorId || userData.doctorId || 0,
      enterpriseId: selectedAccess.enterpriseId || userData.enterpriseId || 0,
      // Fallback values used only until API data loads
      doctorName: userData.username || "Doctor",
      registrationNumber: userData.registrationNumber || ""
    };
  };

  // Load clinic and doctor data when modal opens
  useEffect(() => {
    if (show) {
      const { clinicId, doctorId, enterpriseId } = getClinicIdAndDoctorInfo();
      if (clinicId) loadClinicData(clinicId);
      if (doctorId || enterpriseId) loadDoctorData(doctorId, enterpriseId);

      if (appointmentDetails) {
        setPatientName(`${appointmentDetails.firstName || ""} ${appointmentDetails.lastName || ""}`.trim());
        setRecipientEmail(appointmentDetails.email || "");
      }

      if (passedInvoiceNumber) {
        setDisplayInvoiceNumber(passedInvoiceNumber);
        checkForExistingInvoiceByNumber(passedInvoiceNumber);
      } else {
        checkForExistingInvoice();
      }
    }
  }, [show, appointmentDetails, appointmentId, passedInvoiceNumber]);

  // Fetch clinic details from GetClinicByClinicId endpoint
  const loadClinicData = async (clinicId) => {
    setLoadingClinic(true);
    try {
      const results = await getClinicByClinicId([clinicId]);
      const data = Array.isArray(results) ? results[0] : results;
      setClinicInfo(data);
    } catch (error) {
      console.error("Failed to load clinic:", error);
    } finally {
      setLoadingClinic(false);
    }
  };

  // Fetch doctor details from SearchDoctors endpoint
  const loadDoctorData = async (doctorId, enterpriseId) => {
    try {
      const params = {};
      if (doctorId) params.doctorId = doctorId;
      if (enterpriseId) params.enterpriseId = enterpriseId;
      const results = await searchDoctors(params);
      const doc = Array.isArray(results) ? results[0] : results;
      if (doc) setDoctorInfo(doc);
    } catch (error) {
      console.error("Failed to load doctor:", error);
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
        // Invoice exists - force view mode to prevent duplicate creation
        console.log("✅ Found existing invoice:", response);
        setModalMode("view");
        setExistingInvoiceNumber(response.header.invoiceNumber);
        setDisplayInvoiceNumber(response.header.invoiceNumber);
        setModeOfPayment(response.header.modeOfPayment || "Cash");
        setSavedLineItems(response.lineItems || []);
        
        // IMPORTANT: Populate form state from loaded invoice data for accurate calculations
        if (response.lineItems && response.lineItems.length > 0) {
          let consultationItem = null;
          const otherItems = [];
          
          // Parse lineItems to separate consultation from other charges
          response.lineItems.forEach((item) => {
            if (item.serviceDescription === "Consultation Fee") {
              consultationItem = item;
            } else {
              otherItems.push({
                id: item.lineItemNumber.toString(),
                name: item.serviceDescription,
                amount: item.serviceCost,
                paidAmount: item.amountPaid ?? item.AmountPaid ?? 0
              });
            }
          });

          // Set consultation fee data
          if (consultationItem) {
            setConsultationFee(consultationItem.serviceCost);
            setConsultationPaid(consultationItem.amountPaid ?? consultationItem.AmountPaid ?? 0);
          }

          // Set other charges
          if (otherItems.length > 0) {
            setOtherCharges(otherItems);
          }
        }

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
        // Invoice exists - load data
        console.log("✅ Found invoice by number:", response);
        
        // Set mode based on initialMode (respect the passed mode)
        setModalMode(initialMode); // Use the passed initialMode, not forced "view"
        setExistingInvoiceNumber(response.header.invoiceNumber);
        setDisplayInvoiceNumber(response.header.invoiceNumber);
        setModeOfPayment(response.header.modeOfPayment || "Cash");
        setSavedLineItems(response.lineItems || []);
        
        // IMPORTANT: Populate form state from loaded invoice data
        if (response.lineItems && response.lineItems.length > 0) {
          let consultationItem = null;
          const otherItems = [];
          
          // Parse lineItems to separate consultation from other charges
          response.lineItems.forEach((item) => {
            if (item.serviceDescription === "Consultation Fee") {
              consultationItem = item;
            } else {
              otherItems.push({
                id: item.lineItemNumber.toString(),
                name: item.serviceDescription,
                amount: item.serviceCost,
                paidAmount: item.amountPaid ?? item.AmountPaid ?? 0
              });
            }
          });

          // Set consultation fee data
          if (consultationItem) {
            setConsultationFee(consultationItem.serviceCost);
            setConsultationPaid(consultationItem.amountPaid ?? consultationItem.AmountPaid ?? 0);
          }
          
          // Set other charges
          if (otherItems.length > 0) {
            setOtherCharges(otherItems);
          }
        }
        
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

  const subtotalAmount = useMemo(() => {
    return (consultationFee || 0) + otherCharges.reduce((sum, item) => sum + item.amount, 0);
  }, [consultationFee, otherCharges]);

  const totalAmount = subtotalAmount;

  const totalPaidAmount = (consultationPaid || 0) + otherCharges.reduce((sum, item) => sum + (item.paidAmount || 0), 0);

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = 'Rupees ' + convert(intPart);
    if (decPart > 0) result += ' and ' + convert(decPart) + ' Paise';
    return result + ' Only';
  };

  const addCharge = () => {
    const newCharge = {
      id: Date.now().toString(),
      name: "",
      amount: 0,
      paidAmount: 0
    };
    setOtherCharges([...otherCharges, newCharge]);
  };

  const updateCharge = (id, field, value) => {
    setOtherCharges(otherCharges.map(charge =>
      charge.id === id ? { ...charge, [field]: ["amount", "paidAmount"].includes(field) ? Number(value) : value } : charge
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
    const { doctorName: fbName, registrationNumber: fbReg } = getClinicIdAndDoctorInfo();
    const doctorName = doctorInfo ? `${doctorInfo.firstName || ""} ${doctorInfo.lastName || ""}`.trim() : fbName;
    const registrationNumber = doctorInfo?.licenseNumber || fbReg;
    const chargesHTML = [
      ...(consultationFee !== null ? [{ name: "Consultation Fee", amount: consultationFee }] : []),
      ...otherCharges.filter(c => c.name && c.amount)
    ].map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: center; background-color: #f9fafb; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 12px; background-color: #f9fafb;"><strong>${item.name}</strong></td>
        <td style="padding: 12px; text-align: right; font-weight: bold; background-color: #f9fafb;">₹${item.amount.toFixed(2)}</td>
      </tr>
    `).join("");
    
    const statusColor = status === "Paid" ? "#10b981" : status === "Partial" ? "#f59e0b" : "#ef4444";
    const statusBg = status === "Paid" ? "#ecfdf5" : status === "Partial" ? "#fffbeb" : "#fef2f2";
    const emailAmountPaid = totalPaidAmount;
    const pendingAmount = Math.max(0, totalAmount - emailAmountPaid);

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
            <th style="width: 70%">Service Description</th>
            <th style="width: 22%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${chargesHTML}
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="total-row final">
        <span>Grand Total:</span>
        <span>₹${totalAmount.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span style="color: #6b7280;">Amount Paid:</span>
        <span style="color: #1f2937;">₹${emailAmountPaid.toFixed(2)}</span>
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
      const { doctorName: fbName } = getClinicIdAndDoctorInfo();
      const doctorName = doctorInfo ? `${doctorInfo.firstName || ""} ${doctorInfo.lastName || ""}`.trim() : fbName;

      // Build invoice line items - include consultation fee only if it's not null
      const lineItems = [];
      let lineNumber = 1;

      // Add consultation fee if present
      if (consultationFee !== null) {
        lineItems.push({
          invoiceNumber: displayInvoiceNumber,
          lineItemNumber: lineNumber,
          serviceDescription: "Consultation Fee",
          serviceCost: consultationFee,
          gst: 0,
          modeOfPayment: modeOfPayment,
          totalAmount: consultationFee,
          amountPaid: consultationPaid
        });
        lineNumber++;
      }

      // Add other charges
      const otherLineItems = otherCharges.map((charge) => ({
        invoiceNumber: displayInvoiceNumber,
        lineItemNumber: lineNumber++,
        serviceDescription: charge.name,
        serviceCost: charge.amount,
        gst: 0,
        modeOfPayment: modeOfPayment,
        totalAmount: charge.amount,
        amountPaid: charge.paidAmount || 0
      }));
      lineItems.push(...otherLineItems);

      // Build complete invoice
      const completeInvoice = {
        header: {
          invoiceNumber: displayInvoiceNumber,
          patientId: appointmentDetails?.patientId || 0,
          appointmentId: appointmentId,
          doctorName: doctorName,
          billDate: new Date().toISOString(),
          modeOfPayment: modeOfPayment,
          totalAmount: totalAmount,
          netAmount: subtotalAmount
        },
        lineItems: lineItems
      };

      console.log("Submitting invoice:", completeInvoice);
      console.log("📝 Modal mode:", modalMode);

      // Determine which API endpoint to use based on modal mode
      let response;
      let successMsg;

      if (modalMode === "edit-invoice") {
        // Update existing invoice
        console.log("🔄 Updating existing invoice...");
        response = await request(`/Services/UpdateCompleteInvoice?appointmentId=${appointmentId}`, {
          method: "PUT",
          body: JSON.stringify(completeInvoice)
        });
        successMsg = `✅ Invoice ${displayInvoiceNumber} updated successfully!`;
      } else {
        // Create new invoice
        console.log("✨ Creating new invoice...");
        response = await request("/Services/CreateCompleteInvoice", {
          method: "POST",
          body: JSON.stringify(completeInvoice)
        });
        successMsg = `✅ Invoice ${displayInvoiceNumber} created successfully!`;
      }
      
      // Store saved line items from response
      if (response && response.lineItems) {
        setSavedLineItems(response.lineItems);
      }
      
      // Show success modal
      setSuccessMessage(successMsg);
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

  const toGrayscalePreservingImages = (canvas, sourceEl) => {
    const ctx = canvas.getContext('2d');
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    ctx.putImageData(id, 0, 0);
    const er = sourceEl.getBoundingClientRect();
    const sx = canvas.width / sourceEl.offsetWidth;
    const sy = canvas.height / sourceEl.offsetHeight;
    sourceEl.querySelectorAll('img').forEach(img => {
      if (!img.complete || !img.naturalWidth) return;
      const r = img.getBoundingClientRect();
      ctx.drawImage(img, (r.left - er.left) * sx, (r.top - er.top) * sy, r.width * sx, r.height * sy);
    });
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
      toGrayscalePreservingImages(canvas, element);

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
      alert("Please enter a recipient email address.");
      return;
    }

    setShowEmailModal(false);
    setEmailStatus('sending');
    try {
      const emailHTML = generateServiceBillingEmail();
      await sendEmail({
        Email: recipientEmail,
        Subject: `Service Bill ${displayInvoiceNumber} from ${clinicInfo?.clinicName || "Clinic"}`,
        HtmlBody: emailHTML
      });
      setEmailStatus('success');
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus('error');
    }
  };

  const markAsPaid = () => {
    setAmountPaid(totalAmount);
    toast.success("Marked as fully paid!");
  };

  if (!show) return null;

  const { doctorName: fbDoctorName, registrationNumber: fbReg } = getClinicIdAndDoctorInfo();
  const doctorName = doctorInfo
    ? `${doctorInfo.firstName || ""} ${doctorInfo.lastName || ""}`.trim()
    : fbDoctorName;
  const registrationNumber = doctorInfo?.licenseNumber || fbReg;
  const statusColor = status === "Paid" ? "text-green-600" : status === "Partial" ? "text-amber-600" : "text-red-600";
  const statusBg = status === "Paid" ? "bg-green-50" : status === "Partial" ? "bg-amber-50" : "bg-red-50";
  const statusBorder = status === "Paid" ? "border-green-300" : status === "Partial" ? "border-amber-300" : "border-red-300";
  const statusIcon = status === "Paid" ? <CheckCircle2 size={20} /> : status === "Partial" ? <Clock size={20} /> : <AlertCircle size={20} />;
  const isViewMode = modalMode === "view"; // Only view mode hides all editables
  const isEditInvoiceMode = modalMode === "edit-invoice"; // Edit mode for existing invoices

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
                      {loading ? "Loading Invoice..." : isViewMode ? "📋 Invoice Details" : isEditInvoiceMode ? "✏️ Edit Invoice" : "💳 Create Service Invoice"}
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {loading ? "Retrieving invoice information..." : isViewMode ? `Invoice #${displayInvoiceNumber}` : isEditInvoiceMode ? `Editing Invoice #${displayInvoiceNumber}` : `New Invoice for Appointment #${appointmentId}`}
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
                        onClick={() => recipientEmail ? handleSendEmail() : setShowEmailModal(true)}
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

                {/* ── HEADER ── screen: dark gradient | print: white + black border */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-teal-900 text-white px-8 pt-8 pb-6 print:bg-white print:text-black print:border-b-2 print:border-black">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: clinic identity */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Logo — color preserved on print */}
                        <img
                          src={clinicLogo}
                          alt="clinic logo"
                          className="w-14 h-14 object-contain flex-shrink-0"
                          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                        />
                        <div>
                          <h1 className="text-2xl font-black tracking-wide print:text-black">{clinicInfo?.clinicName || "Dental Clinic"}</h1>
                          <p className="text-teal-300 text-xs mt-0.5 print:text-black">
                            {[clinicInfo?.clinicAddress, clinicInfo?.clinicCity].filter(Boolean).join(", ")}
                          </p>
                          {clinicInfo?.clinicPhone && (
                            <p className="text-slate-400 text-xs mt-0.5 print:text-black">
                              {clinicInfo.clinicPhone}{clinicInfo.clinicEmail ? "  ·  " + clinicInfo.clinicEmail : ""}
                            </p>
                          )}
                          {(clinicInfo?.registrationNumber || clinicInfo?.gstNumber) && (
                            <p className="text-slate-400 text-xs mt-0.5 print:text-black">
                              Reg: {clinicInfo.registrationNumber || clinicInfo.gstNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Doctor line */}
                      <div className="border-l-2 border-teal-500 pl-3 print:border-black">
                        <p className="font-bold text-sm print:text-black">Dr. {doctorName}</p>
                        {registrationNumber && (
                          <p className="text-indigo-300 text-xs print:text-black">Reg. No: {registrationNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: invoice badge */}
                    <div className="text-right flex-shrink-0">
                      <div className="inline-block border border-teal-400/40 rounded-xl px-5 py-3 print:border-black print:rounded-none">
                        <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-1 print:text-black">Invoice</p>
                        <p className="text-white text-2xl font-black print:text-black">{displayInvoiceNumber}</p>
                        <p className="text-slate-300 text-xs mt-1 print:text-black">
                          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── PATIENT + INVOICE META ── screen: 2-col | print: stacked */}
                <div className="grid grid-cols-2 print:grid-cols-1 border-b-2 border-slate-100 print:border-black">
                  {/* Billed To */}
                  <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 border-r border-slate-100 print:bg-white print:border-r-0 print:border-b print:border-black">
                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 print:text-black">Billed To</p>
                    <input
                      type="text"
                      placeholder="Enter patient name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      disabled={isViewMode}
                      className="text-xl font-black text-slate-900 border-b-2 border-indigo-300 pb-1 w-full focus:border-indigo-600 focus:outline-none bg-transparent transition disabled:cursor-not-allowed print:border-b print:border-black print:text-black"
                    />
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 print:text-black print:mt-1">
                      <span>📞 {appointmentDetails?.phoneNumber || "—"}</span>
                      <span className="print:hidden">·</span>
                      <span>🗓 {new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Invoice meta */}
                  <div className="p-5 bg-white print:py-3">
                    <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-2 print:text-black">Invoice Details</p>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-0.5 text-slate-500 print:text-black w-32">Invoice By</td>
                          <td className="py-0.5 font-bold text-slate-800 print:text-black">Dr. {doctorName}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 text-slate-500 print:text-black">Payment Mode</td>
                          <td className="py-0.5 font-bold text-slate-800 print:text-black">
                            {isViewMode ? modeOfPayment : (
                              <select
                                value={modeOfPayment}
                                onChange={(e) => setModeOfPayment(e.target.value)}
                                className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 focus:outline-none print:bg-white print:text-black print:border-0"
                              >
                                <option>Cash</option>
                                <option>Card</option>
                                <option>UPI</option>
                                <option>Insurance</option>
                                <option>Cheque</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── SERVICE TABLE — EDIT / CREATE MODE ── */}
                {(!isViewMode || !savedLineItems.length) && (
                  <div className="px-6 py-5">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 print:text-black">Service Details</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm print:rounded-none print:shadow-none">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
                            <th className="px-3 py-3 text-left text-xs font-bold uppercase w-8">#</th>
                            <th className="px-3 py-3 text-left text-xs font-bold uppercase">Service</th>
                            <th className="px-3 py-3 text-right text-xs font-bold uppercase">Amount (₹)</th>
                            <th className="px-3 py-3 text-center text-xs font-bold uppercase print:hidden">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                          {consultationFee !== null && (
                            <tr className="hover:bg-indigo-50/40 print:hover:bg-white">
                              <td className="px-3 py-3 text-sm font-black text-indigo-600 print:text-black">1</td>
                              <td className="px-3 py-3 text-sm font-semibold text-slate-800 print:text-black">Consultation Fee</td>
                              <td className="px-3 py-3 text-right">
                                <input type="number" step="0.01" value={consultationFee}
                                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                                  disabled={isViewMode}
                                  className="w-28 text-right text-sm font-bold py-1 px-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none print:hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                <span className="hidden print:inline text-sm font-bold text-black">₹{consultationFee.toFixed(2)}</span>
                              </td>
                              <td className="px-3 py-3 text-center print:hidden">
                                {!isViewMode && (
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setConsultationFee(null)}
                                    className="text-rose-400 hover:text-rose-600">
                                    <Trash2 size={16} />
                                  </motion.button>
                                )}
                              </td>
                            </tr>
                          )}
                          {otherCharges.map((charge, idx) => (
                            <tr key={charge.id} className="hover:bg-teal-50/40 print:hover:bg-white">
                              <td className="px-3 py-3 text-sm font-black text-teal-600 print:text-black">{consultationFee !== null ? idx + 2 : idx + 1}</td>
                              <td className="px-3 py-3">
                                <input type="text" placeholder="Service name"
                                  value={charge.name}
                                  onChange={(e) => updateCharge(charge.id, "name", e.target.value)}
                                  disabled={isViewMode}
                                  className="w-full text-sm font-semibold py-1 px-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 outline-none print:hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                <span className="hidden print:inline text-sm font-semibold text-black">{charge.name || '—'}</span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <input type="number" step="0.01" value={charge.amount}
                                  onChange={(e) => updateCharge(charge.id, "amount", e.target.value)}
                                  disabled={isViewMode}
                                  className="w-28 text-right text-sm font-bold py-1 px-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none print:hidden disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  placeholder="0.00"
                                />
                                <span className="hidden print:inline text-sm font-bold text-black">₹{charge.amount.toFixed(2)}</span>
                              </td>
                              <td className="px-3 py-3 text-center print:hidden">
                                {!isViewMode && (
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteCharge(charge.id)}
                                    className="text-rose-400 hover:text-rose-600">
                                    <Trash2 size={16} />
                                  </motion.button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isViewMode && (
                      <div className="mt-4 print:hidden flex gap-3 flex-wrap">
                        {consultationFee === null && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setConsultationFee(500)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                            <Plus size={16} /> Add Consultation Fee
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={addCharge}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                          <Plus size={16} /> Add Service
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SERVICE TABLE — VIEW MODE ── */}
                {isViewMode && savedLineItems && savedLineItems.length > 0 && (
                  <div className="px-6 py-5">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 print:text-black">Service Details</p>
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm print:rounded-none print:shadow-none">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
                            <th className="px-3 py-3 text-left text-xs font-bold uppercase w-8">#</th>
                            <th className="px-3 py-3 text-left text-xs font-bold uppercase">Service</th>
                            <th className="px-3 py-3 text-right text-xs font-bold uppercase">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                          {savedLineItems.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60 print:bg-white"}>
                              <td className="px-3 py-3 text-sm font-black text-indigo-600 print:text-black">{item.lineItemNumber}</td>
                              <td className="px-3 py-3 text-sm font-semibold text-slate-800 print:text-black">{item.serviceDescription}</td>
                              <td className="px-3 py-3 text-right text-sm font-black text-teal-700 print:text-black">₹{item.serviceCost?.toFixed(2) || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TOTALS ── screen: 2-col | print: stacked right-aligned */}
                <div className="border-t-2 border-slate-100 print:border-black">
                  {/* Summary numbers — screen: right col | print: full-width right-aligned */}
                  <div className="px-6 py-4 flex flex-col items-end">
                    <div className="w-full max-w-xs space-y-1">
                      <div className="flex justify-between items-center py-2 mt-1 bg-gradient-to-r from-indigo-600 to-teal-600 rounded-xl px-4 shadow-md print:bg-white print:rounded-none print:shadow-none print:border-t-2 print:border-black print:px-0 print:py-2">
                        <span className="text-sm font-black text-white uppercase tracking-wide print:text-black">Grand Total</span>
                        <span className="text-xl font-black text-white print:text-black">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total in words + signature — full width below totals */}
                  <div className="px-6 pb-6 border-t border-slate-100 print:border-gray-300 pt-4">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 print:text-black">Total in Words</p>
                    <p className="text-sm font-semibold text-slate-800 italic leading-relaxed border-l-4 border-indigo-400 pl-3 mb-6 print:border-black print:text-black print:not-italic">
                      {numberToWords(Math.round(totalAmount))}
                    </p>
                    <div className="flex justify-end">
                      <div className="text-right border-t-2 border-dashed border-slate-300 pt-3 min-w-48 print:border-black">
                        <p className="text-xs text-slate-400 mb-0.5 print:text-black">Electronically signed by</p>
                        <p className="text-sm font-black text-slate-800 print:text-black">Dr. {doctorName}</p>
                        {registrationNumber && <p className="text-xs text-slate-500 print:text-black">{registrationNumber}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── FOOTER ── screen: dark | print: white with black text */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-teal-900 text-white px-8 py-4 print:bg-white print:text-black print:border-t-2 print:border-black">
                  <div className="flex items-center justify-between gap-4 print:flex-col print:items-start print:gap-1">
                    <div className="text-xs space-y-0.5 print:text-black">
                      <p className="text-slate-300 print:text-black">
                        {[clinicInfo?.clinicAddress, clinicInfo?.clinicCity].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-slate-400 print:text-black">
                        {clinicInfo?.clinicPhone || ""}{clinicInfo?.clinicEmail ? "  ·  " + clinicInfo.clinicEmail : ""}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 italic print:text-black">Computer generated invoice · Valid without signature</p>
                  </div>
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
                        {isEditInvoiceMode ? "Updating..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        {isEditInvoiceMode ? "💾 Update Invoice" : "✅ Submit & Create Invoice"}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Email Status Modal (sending / success / error) */}
            <AnimatePresence>
              {emailStatus && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                  onClick={emailStatus !== 'sending' ? () => setEmailStatus(null) : undefined}
                >
                  <motion.div
                    initial={{ scale: 0.85, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.85, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
                  >
                    {emailStatus === 'sending' && (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="text-5xl mb-4 inline-block"
                        >
                          📤
                        </motion.div>
                        <p className="text-lg font-bold text-slate-800">Sending Invoice...</p>
                        <p className="text-sm text-slate-500 mt-1">Sending to {recipientEmail}</p>
                      </>
                    )}
                    {emailStatus === 'success' && (
                      <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-6xl mb-4">✅</motion.div>
                        <p className="text-xl font-black text-green-700">Invoice Sent!</p>
                        <p className="text-sm text-slate-500 mt-2">Email delivered to<br /><strong>{recipientEmail}</strong></p>
                        <button onClick={() => setEmailStatus(null)} className="mt-5 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">Done</button>
                      </>
                    )}
                    {emailStatus === 'error' && (
                      <>
                        <div className="text-5xl mb-4">❌</div>
                        <p className="text-lg font-bold text-red-700">Failed to Send</p>
                        <p className="text-sm text-slate-500 mt-2">Please check your connection and try again.</p>
                        <div className="flex gap-3 mt-5 justify-center">
                          <button onClick={() => { setEmailStatus(null); handleSendEmail(); }} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Retry</button>
                          <button onClick={() => setEmailStatus(null)} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition">Close</button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
