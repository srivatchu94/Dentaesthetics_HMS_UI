import React, { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  Mail, 
  Plus, 
  Trash2, 
  Search, 
  Pill, 
  Hospital,
  Download,
  X,
  ChevronDown,
  Copy,
  Edit2,
  Lock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendEmail } from "../services/emailService";
import { listInventoryMasters } from "../services/inventoryService";
import { getClinic } from "../services/clinicService";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function PharmacyBillingModal({ show, onClose }) {
  const [patientName, setPatientName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);

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
      loadInventoryMedications();
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

  const loadInventoryMedications = async () => {
    setLoadingMeds(true);
    try {
      const data = await listInventoryMasters();
      setInventoryMeds(data || []);
    } catch (error) {
      console.error("Failed to load medicines:", error);
      toast.error("Failed to load medicines from inventory");
      setInventoryMeds([]);
    } finally {
      setLoadingMeds(false);
    }
  };

  const filteredMedicines = inventoryMeds.filter(m => 
    m.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (med) => {
    const existing = selectedItems.find(i => i.itemId === med.itemId);
    if (existing) {
      updateItem(med.itemId, "quantity", existing.quantity + 1);
    } else {
      setSelectedItems([...selectedItems, { 
        itemId: med.itemId, 
        name: med.itemName,
        itemCode: med.itemCode,
        quantity: 1, 
        rate: 0,
        gst: 18 
      }]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const updateItem = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.itemId === id ? { ...item, [field]: field === "rate" ? parseFloat(value) : field === "quantity" ? parseInt(value) : field === "gst" ? parseFloat(value) : value } : item
    ));
  };

  const removeItem = (id) => {
    setSelectedItems(selectedItems.filter(i => i.itemId !== id));
  };

  const totals = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const itemTotal = item.rate * item.quantity * (1 + item.gst / 100);
      const itemSubtotal = item.rate * item.quantity;
      return {
        subtotal: acc.subtotal + itemSubtotal,
        gst: acc.gst + (itemSubtotal * item.gst / 100),
        total: acc.total + itemTotal
      };
    }, { subtotal: 0, gst: 0, total: 0 });
  }, [selectedItems]);

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    
    setSendingEmail(true);
    try {
      const emailHTML = generatePharmacyBillingEmail();
      
      await sendEmail({
        Email: recipientEmail,
        Subject: `Pharmacy Bill ${invoiceNumber} from ${clinicInfo?.clinicName || "Clinic"}`,
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

  const generatePharmacyBillingEmail = () => {
    const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();
    const itemsHTML = selectedItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: center; background-color: #f9fafb; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 12px; background-color: #f9fafb;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 12px; color: #6b7280;">SKU: ${item.itemCode}</span>
        </td>
        <td style="padding: 12px; text-align: center; background-color: #f9fafb;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; background-color: #f9fafb;">₹${item.rate.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; background-color: #f9fafb;">${item.gst}%</td>
        <td style="padding: 12px; text-align: right; font-weight: bold; background-color: #f9fafb; color: #10b981;">₹${(item.rate * item.quantity * (1 + item.gst / 100)).toFixed(2)}</td>
      </tr>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0; }
    .container { max-width: 850px; margin: 30px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 50px 40px; text-align: center; }
    .clinic-name { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
    .clinic-subtitle { font-size: 14px; opacity: 0.9; margin-bottom: 20px; }
    .invoice-no { font-size: 12px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 4px; display: inline-block; }
    .patient-section { background: linear-gradient(to right, #f0fdf4, #ecfdf5); padding: 30px 40px; border-bottom: 2px solid #d1fae5; }
    .content { padding: 40px; }
    .patient-name { font-size: 18px; font-weight: 700; color: #065f46; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    thead tr { background: #f0fdf4; }
    th { padding: 15px 12px; text-align: left; font-weight: 700; color: #065f46; border-bottom: 2px solid #d1fae5; font-size: 13px; text-transform: uppercase; }
    .totals-section { background: #f0fdf4; padding: 25px 40px; border-top: 2px solid #d1fae5; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #10b981; border-top: 2px solid #d1fae5; padding-top: 12px; }
    .footer { background: #f9fafb; padding: 30px 40px; text-align: center; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .doctor-sig { background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="clinic-name">💊 ${clinicInfo?.clinicName || "Dental Clinic"}</div>
      <div class="clinic-subtitle">Pharmacy & Medication Billing Invoice</div>
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
      <h3 style="color: #10b981; margin-bottom: 20px; font-size: 16px; text-transform: uppercase;">Medication Details</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 40%">Medicine</th>
            <th style="width: 8%">Qty</th>
            <th style="width: 15%">Rate</th>
            <th style="width: 12%">GST</th>
            <th style="width: 20%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="total-row">
        <span style="color: #6b7280;">Subtotal:</span>
        <span style="color: #1f2937;">₹${totals.subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span style="color: #6b7280;">GST (Inclusive):</span>
        <span style="color: #1f2937;">₹${totals.gst.toFixed(2)}</span>
      </div>
      <div class="total-row final">
        <span>Total Amount:</span>
        <span>₹${totals.total.toFixed(2)}</span>
      </div>
    </div>

    <div class="content">
      <div class="doctor-sig">
        <p style="margin: 0; color: #065f46; font-weight: 700; font-size: 14px;">
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
    const invoiceElement = document.getElementById("pharmacy-invoice-print");
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
      pdf.save(`pharmacy-invoice-${patientName || invoiceNumber}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = () => {
    const invoiceElement = document.getElementById("pharmacy-invoice-print");
    if (!invoiceElement) {
      toast.error("Invoice element not found");
      return;
    }
    window.print();
  };

  if (!show) return null;

  const { doctorName, registrationNumber } = getClinicIdAndDoctorInfo();

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 z-10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill size={36} />
                <div>
                  <h2 className="text-3xl font-bold">Pharmacy Billing</h2>
                  <p className="text-emerald-100 text-sm">Professional Medication Invoice</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                    isEditMode 
                      ? 'bg-green-500 border border-green-600 text-white hover:bg-green-600' 
                      : 'bg-emerald-500 border border-emerald-600 text-white hover:bg-emerald-600'
                  }`}
                >
                  {isEditMode ? <Lock size={18} /> : <Edit2 size={18} />}
                  {isEditMode ? 'Done' : 'Edit'}
                </motion.button>
                <motion.button 
                  whileHover={!isEditMode ? { scale: 1.05 } : {}}
                  whileTap={!isEditMode ? { scale: 0.95 } : {}}
                  onClick={() => setShowEmailModal(true)}
                  disabled={isEditMode}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium ${
                    isEditMode 
                      ? 'bg-gray-400 border-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-white/20 border-white/40 hover:bg-white/30'
                  }`}
                >
                  <Mail size={18} />
                  Email
                </motion.button>
                <motion.button 
                  whileHover={!isEditMode ? { scale: 1.05 } : {}}
                  whileTap={!isEditMode ? { scale: 0.95 } : {}}
                  onClick={handleDownloadPDF}
                  disabled={isEditMode}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-white rounded-lg transition-all font-medium ${
                    isEditMode 
                      ? 'bg-gray-400 border-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-white/20 border-white/40 hover:bg-white/30'
                  }`}
                >
                  <Download size={18} />
                  PDF
                </motion.button>
                <motion.button 
                  whileHover={!isEditMode ? { scale: 1.05 } : {}}
                  whileTap={!isEditMode ? { scale: 0.95 } : {}}
                  onClick={handlePrint}
                  disabled={isEditMode}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium shadow-lg ${
                    isEditMode 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50' 
                      : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
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

          {/* Edit Mode Warning */}
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border-b-2 border-amber-200 px-6 py-4 flex items-center gap-3"
            >
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 font-semibold">
                ⚠️ Columns are editable. Please make sure to click <span className="font-bold text-amber-900">"Done"</span> to lock all values before you download or print.
              </p>
            </motion.div>
          )}

          {/* Main Content */}
          <div className="p-8">
            <div id="pharmacy-invoice-print" className="bg-gradient-to-b from-emerald-50 to-white rounded-3xl border-2 border-emerald-200 shadow-lg overflow-hidden">
              
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 text-center">
                <div className="inline-block mb-4 p-4 bg-white/20 rounded-full">
                  <Pill size={40} />
                </div>
                <h1 className="text-4xl font-bold mb-2">{clinicInfo?.clinicName || "Dental Clinic"}</h1>
                <p className="text-emerald-100 mb-4">PHARMACY BILLING INVOICE</p>
                <div className="flex justify-center gap-6 text-emerald-50">
                  <div className="text-sm">
                    <span className="font-semibold">Invoice #</span><br/>
                    <span className="text-lg font-bold">{invoiceNumber}</span>
                  </div>
                  <div className="border-l border-emerald-300"></div>
                  <div className="text-sm">
                    <span className="font-semibold">Date</span><br/>
                    <span className="text-lg font-bold">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-8 space-y-6">
                
                {/* Patient & Medicine Selection Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 print:hidden">
                  {/* Patient Name - 1 col */}
                  <div className="bg-white rounded-xl border-2 border-emerald-200 p-4 shadow-sm">
                    <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2 block">
                      Patient Name
                    </label>
                    <input 
                      type="text"
                      placeholder="Enter name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full text-lg font-semibold text-slate-800 border-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Medicine Search - 2 cols */}
                  <div className="lg:col-span-2 bg-white rounded-xl border-2 border-emerald-200 p-4 shadow-sm">
                    <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2 block">
                      Search & Add Medicine
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={loadingMeds}
                        className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-sm disabled:opacity-50"
                      />
                      <ChevronDown size={18} className="absolute right-3 top-2.5 text-emerald-400 pointer-events-none" />
                      
                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-emerald-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto print:hidden"
                          >
                            {loadingMeds ? (
                              <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                            ) : filteredMedicines.length > 0 ? (
                              filteredMedicines.map(med => (
                                <button
                                  key={med.itemId}
                                  onClick={() => addItem(med)}
                                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-emerald-100 last:border-b-0 transition-colors"
                                >
                                  <p className="font-semibold text-slate-700 text-sm">{med.itemName}</p>
                                  <p className="text-xs text-slate-500">SKU: {med.itemCode}</p>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-slate-500 text-sm">No medicines found</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Clinic Info - 2 cols */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-4 shadow-sm">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Clinic</p>
                        <p className="font-semibold text-slate-800 text-sm">{clinicInfo?.clinicName}</p>
                        <p className="text-xs text-slate-600">{clinicInfo?.clinicAddress}</p>
                      </div>
                      <div className="border-t border-emerald-200 pt-2">
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Doctor</p>
                        <p className="font-semibold text-slate-800 text-sm">Dr. {doctorName}</p>
                        <p className="text-xs text-slate-600">{registrationNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Table */}
                <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                          <th className="px-3 py-3 text-left text-xs font-bold text-emerald-700 uppercase">#</th>
                          <th className="px-3 py-3 text-left text-xs font-bold text-emerald-700 uppercase">Medicine Name</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase">Qty</th>
                          <th className="px-3 py-3 text-right text-xs font-bold text-emerald-700 uppercase">Rate (₹)</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase">GST %</th>
                          <th className="px-3 py-3 text-right text-xs font-bold text-emerald-700 uppercase">Total (₹)</th>
                          <th className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {selectedItems.length > 0 ? (
                          selectedItems.map((item, idx) => (
                            <tr key={item.itemId} className="hover:bg-emerald-50 transition-colors">
                              <td className="px-3 py-3 text-sm font-bold text-slate-600">{idx + 1}</td>
                              <td className="px-3 py-3">
                                <p className="font-semibold text-slate-700 text-sm">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.itemCode}</p>
                              </td>
                              <td className="px-3 py-3">
                                {isEditMode ? (
                                  <input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.itemId, "quantity", Number(e.target.value))}
                                    className="w-16 mx-auto block text-center py-1.5 px-2 rounded border border-emerald-200 focus:ring-2 focus:ring-emerald-300 outline-none text-sm font-bold"
                                  />
                                ) : (
                                  <p className="text-sm font-bold text-slate-800 text-center">{item.quantity}</p>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {isEditMode ? (
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={item.rate}
                                    onChange={(e) => updateItem(item.itemId, "rate", Number(e.target.value))}
                                    className="w-20 ml-auto block text-right py-1.5 px-2 rounded border border-emerald-200 focus:ring-2 focus:ring-emerald-300 outline-none text-sm font-bold"
                                  />
                                ) : (
                                  <p className="text-sm font-bold text-slate-800 text-right">₹{item.rate.toFixed(2)}</p>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {isEditMode ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input 
                                      type="number"
                                      step="0.5"
                                      value={item.gst}
                                      onChange={(e) => updateItem(item.itemId, "gst", Number(e.target.value))}
                                      className="w-20 text-center py-1.5 px-2 rounded border border-emerald-200 focus:ring-2 focus:ring-emerald-300 outline-none text-sm font-bold"
                                    />
                                    <span className="text-xs text-slate-600">%</span>
                                  </div>
                                ) : (
                                  <p className="text-sm font-bold text-slate-800 text-center">{item.gst}%</p>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-emerald-600 text-sm">
                                ₹{(item.rate * item.quantity * (1 + item.gst / 100)).toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-center print:hidden">
                                {isEditMode && (
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeItem(item.itemId)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors inline-flex items-center justify-center"
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                              <Pill size={32} className="mx-auto mb-3 opacity-30" />
                              <p className="text-sm">No medicines added. Search and select medicines to begin billing.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Footer */}
                  {selectedItems.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-2 border-emerald-200 px-6 py-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                          <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Subtotal</p>
                          <p className="text-2xl font-bold text-slate-800">₹{totals.subtotal.toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                          <p className="text-xs font-bold text-amber-700 uppercase mb-2">Total GST</p>
                          <p className="text-2xl font-bold text-amber-600">₹{totals.gst.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-4 border-2 border-emerald-300 shadow-md">
                          <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Total Amount</p>
                          <p className="text-2xl font-bold text-emerald-700">₹{totals.total.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Amount Paid Section */}
                      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5 print:hidden">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-blue-700 uppercase mb-2 block">Amount Paid</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-lg font-bold text-blue-600">₹</span>
                              {isEditMode ? (
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={amountPaid}
                                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                                  className="w-full pl-8 py-2.5 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none text-lg font-bold"
                                />
                              ) : (
                                <p className="w-full pl-8 py-2.5 text-lg font-bold text-slate-800">{amountPaid.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-end">
                            <div className="w-full">
                              <label className="text-xs font-bold text-blue-700 uppercase mb-2 block">Balance Due</label>
                              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-red-300 text-center">
                                <p className="text-lg font-bold text-red-600">₹{Math.max(0, totals.total - amountPaid).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
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
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50"
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
