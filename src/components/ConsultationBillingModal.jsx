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
  Hospital
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendEmail } from "../services/emailService";
import { getClinic } from "../services/clinicService";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function ConsultationBillingModal({ show, onClose }) {
  const [patientName, setPatientName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
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

  // Get clinic ID and doctor info
  const getClinicIdAndDoctorInfo = () => {
    const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    
    return {
      clinicId: selectedAccess.clinicId || userData.clinicId || 0,
      doctorName: userData.username || "Dr. Dentist",
      registrationNumber: userData.registrationNumber || "Registration #"
    };
  };

  // Load clinic data from API
  useEffect(() => {
    if (show) {
      const { clinicId } = getClinicIdAndDoctorInfo();
      if (clinicId) {
        loadClinicData(clinicId);
      }
    }
  }, [show]);

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

  const totalAmount = useMemo(() => {
    const consultationWithGST = consultationFee + (consultationFee * consultationGST / 100);
    const othersWithGST = otherCharges.reduce((sum, item) => {
      const gst = item.amount * (item.gstPercent || 0) / 100;
      return sum + item.amount + gst;
    }, 0);
    return consultationWithGST + othersWithGST;
  }, [consultationFee, consultationGST, otherCharges]);

  const subtotalAmount = useMemo(() => {
    return consultationFee + otherCharges.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [consultationFee, otherCharges]);

  const totalGST = useMemo(() => {
    const consultationGSTAmount = consultationFee * consultationGST / 100;
    const othersGST = otherCharges.reduce((sum, item) => sum + (item.amount * (item.gstPercent || 0) / 100), 0);
    return consultationGSTAmount + othersGST;
  }, [consultationFee, consultationGST, otherCharges]);

  const pendingAmount = Math.max(0, totalAmount - amountPaid);

  const status = useMemo(() => {
    if (amountPaid === 0) return "Pending";
    if (amountPaid >= totalAmount) return "Paid";
    return "Partial";
  }, [amountPaid, totalAmount]);

  const addCharge = () => {
    setOtherCharges([
      ...otherCharges,
      { id: Math.random().toString(36).substr(2, 9), name: "", amount: 0, gstPercent: 0 }
    ]);
  };

  const removeCharge = (id) => {
    setOtherCharges(otherCharges.filter(c => c.id !== id));
  };

  const updateCharge = (id, field, value) => {
    setOtherCharges(otherCharges.map(c => 
      c.id === id ? { ...c, [field]: field === "amount" || field === "gstPercent" ? Number(value) || 0 : value } : c
    ));
  };

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    
    setSendingEmail(true);
    try {
      const emailHTML = generateConsultationBillingEmail();
      
      await sendEmail({
        Email: recipientEmail,
        Subject: `Consultation Bill ${invoiceNumber} from ${clinicInfo?.clinicName || "Clinic"}`,
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

  const generateConsultationBillingEmail = () => {
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
        <td style="padding: 12px; text-align: right; background-color: #f9fafb; font-weight: bold; color: #1f2937;">₹${(item.amount + item.gstAmount).toFixed(2)}</td>
      </tr>
    `).join("");

    const statusColor = status === "Paid" ? "#10b981" : status === "Partial" ? "#f59e0b" : "#ef4444";
    const statusBg = status === "Paid" ? "#ecfdf5" : status === "Partial" ? "#fffbeb" : "#fef2f2";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0; }
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
      <div class="clinic-subtitle">Consultation & Service Billing Invoice</div>
      <div class="invoice-no">Invoice # ${invoiceNumber}</div>
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
      <p style="margin: 10px 0 0 0;">For queries, contact ${clinicInfo?.clinicPhone || "N/A"} or ${clinicInfo?.clinicEmail || "N/A"}</p>
      <p style="margin: 10px 0 0 0; color: #9ca3af;">&copy; ${new Date().getFullYear()} ${clinicInfo?.clinicName || "Clinic"}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadPDF = async () => {
    const invoiceElement = document.getElementById("consultation-invoice-print");
    if (!invoiceElement) {
      toast.error("Invoice element not found");
      return;
    }

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save(`consultation-invoice-${patientName || invoiceNumber}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = () => {
    const invoiceElement = document.getElementById("consultation-invoice-print");
    if (!invoiceElement) {
      toast.error("Invoice element not found");
      return;
    }
    window.print();
  };

  const handleMarkAsPaid = () => {
    setAmountPaid(totalAmount);
    toast.success("Marked as fully paid!");
  };

  if (!show) return null;

  const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();
  const statusColor = status === "Paid" ? "text-green-600" : status === "Partial" ? "text-amber-600" : "text-red-600";
  const statusBg = status === "Paid" ? "bg-green-50" : status === "Partial" ? "bg-amber-50" : "bg-red-50";
  const statusBorder = status === "Paid" ? "border-green-300" : status === "Partial" ? "border-amber-300" : "border-red-300";
  const statusIcon = status === "Paid" ? <CheckCircle2 size={20} /> : status === "Partial" ? <Clock size={20} /> : <AlertCircle size={20} />;

  return (
    <AnimatePresence>
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                  💳
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Consultation Billing</h2>
                  <p className="text-blue-100 text-sm">Professional Consultation Invoice</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium bg-white/20 border-white/40 hover:bg-white/30"
                >
                  <Mail size={18} />
                  Email
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium bg-white/20 border-white/40 hover:bg-white/30"
                >
                  <Download size={18} />
                  PDF
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium shadow-lg bg-white text-blue-700 hover:bg-blue-50"
                >
                  <Printer size={18} />
                  Print
                </motion.button>
                <button
                  onClick={onClose}
                  className="text-2xl hover:bg-white/20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Edit Mode Warning - Removed, no longer needed */}

          {/* Main Content */}
          <div className="p-8">
            <div id="consultation-invoice-print" className="bg-white">
              
              {/* Professional Invoice Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-10 rounded-t-2xl">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{clinicInfo?.clinicName || "Dental Clinic"}</h1>
                    <p className="text-blue-100 text-sm">Consultation & Service Invoice</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Invoice</p>
                    <p className="text-3xl font-bold">{invoiceNumber}</p>
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
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Patient Name</p>
                  <input 
                    type="text"
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="text-2xl font-bold text-slate-800 border-b-2 border-blue-300 pb-2 w-full focus:border-blue-600 focus:outline-none transition"
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
                        <th className="text-left px-3 py-3 text-xs font-bold text-blue-700 uppercase">#</th>
                        <th className="text-left px-3 py-3 text-xs font-bold text-blue-700 uppercase">Service Name</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">Amount (₹)</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">GST %</th>
                        <th className="text-right px-3 py-3 text-xs font-bold text-blue-700 uppercase">Total (₹)</th>
                        <th className="text-center px-3 py-3 text-xs font-bold text-blue-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Consultation Fee Row */}
                      <tr className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-4 text-sm font-bold text-slate-600">1</td>
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
                              className="w-20 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden"
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
                              className="w-16 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden"
                            />
                            <span className="text-xs text-slate-600 print:hidden">%</span>
                            <span className="hidden print:inline text-sm font-bold text-slate-800">{consultationGST}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-bold text-blue-600">
                          ₹{(consultationFee + consultationFee * consultationGST / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-center print:hidden">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeCharge("consultation")}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </td>
                      </tr>

                      {/* Additional Charges Rows */}
                      {otherCharges.map((charge, idx) => (
                        <tr key={charge.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                          <td className="px-3 py-4 text-sm font-bold text-slate-600">{idx + 2}</td>
                          <td className="px-3 py-4">
                            <input 
                              type="text"
                              placeholder="e.g., Additional Treatment"
                              value={charge.name}
                              onChange={(e) => updateCharge(charge.id, "name", e.target.value)}
                              className="w-full text-sm py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:border-0 print:px-0 print:py-0"
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
                                className="w-20 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden print:border-0 print:px-0 print:py-0"
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
                                className="w-16 text-right text-sm font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden print:border-0 print:px-0 print:py-0"
                                placeholder="0"
                              />
                              <span className="text-xs text-slate-600 print:hidden">%</span>
                              <span className="hidden print:inline text-sm font-bold text-slate-800">{charge.gstPercent}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right text-sm font-bold text-blue-600">
                            ₹{(charge.amount + charge.amount * charge.gstPercent / 100).toFixed(2)}
                          </td>
                          <td className="px-3 py-4 text-center print:hidden">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeCharge(charge.id)}
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </td>
                        </tr>
                      ))}

                      {/* Add Charge Row */}
                      <tr className="bg-blue-50 print:hidden">
                        <td colSpan="6" className="px-4 py-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={addCharge}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-white rounded transition-all"
                          >
                            <Plus size={16} />
                            Add Additional Service
                          </motion.button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

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
                          className="w-28 text-right text-lg font-bold py-1.5 px-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none print:hidden print:border-0 print:px-0 print:py-0"
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
                    <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${statusBg} ${statusBorder}`}>
                      <div className={statusColor}>
                        {statusIcon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold uppercase ${statusColor}`}>Payment Status</p>
                        <p className={`text-sm font-bold ${statusColor}`}>{status}</p>
                      </div>
                    </div>

                    {/* Mark as Paid Button */}
                    {status !== "Paid" && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMarkAsPaid}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-bold text-sm mt-2"
                      >
                        ✓ Mark as Fully Paid
                      </motion.button>
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
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
                >
                  <h3 className="text-xl font-bold text-slate-900">Send Invoice Email</h3>
                  <input 
                    type="email"
                    placeholder="Recipient email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="flex-1 px-4 py-2.5 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
                    >
                      {sendingEmail ? "Sending..." : "Send"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
