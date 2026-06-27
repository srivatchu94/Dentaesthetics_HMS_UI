import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentsByFilters, updateAppointment } from '../services/appointmentService';
import { getAccessToken, getClinicIdFromToken, getSelectedAccess } from '../services/tokenManager';
import { request } from '../services/apiClient';
import { Download, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function PaymentDetailsModal({ isOpen, onClose, appointmentData }) {
  const [paymentDate, setPaymentDate] = useState(appointmentData?.appointmentDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [paymentClinicId, setPaymentClinicId] = useState('');
  const [clinicsList, setClinicsList] = useState([]);
  const [paymentAppointments, setPaymentAppointments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(appointmentData?.appointmentId || null);
  const [invoicesByAppointment, setInvoicesByAppointment] = useState({});
  const [loadingInvoices, setLoadingInvoices] = useState({});

  // Edit payment modal states
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPaymentAppointment, setEditingPaymentAppointment] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editInvoiceLineItems, setEditInvoiceLineItems] = useState([]);
  const [editPaymentForm, setEditPaymentForm] = useState({
    billableAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paymentStatus: 'Pending',
    appointmentStatus: 'Scheduled'
  });
  const [savingPaymentEdit, setSavingPaymentEdit] = useState(false);
  const [showPaymentSuccessPopup, setShowPaymentSuccessPopup] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');

  // Load clinics from token on mount
  useEffect(() => {
    if (isOpen) {
      const selectedAccess = getSelectedAccess();
      if (selectedAccess?.clinics && Array.isArray(selectedAccess.clinics)) {
        setClinicsList(selectedAccess.clinics);
        if (selectedAccess.clinicId) {
          setPaymentClinicId(selectedAccess.clinicId.toString());
        }
      } else {
        const clinicId = getClinicIdFromToken();
        if (clinicId) {
          setPaymentClinicId(clinicId.toString());
          setClinicsList([{ clinicId, clinicName: `Clinic ${clinicId}` }]);
        }
      }
    }
  }, [isOpen]);

  // Load payment appointments
  const loadPaymentAppointments = useCallback(async () => {
    const clinicId = paymentClinicId;
    
    if (!clinicId) {
      setErrorMessage('Please select a clinic to load payments.');
      return;
    }

    setErrorMessage('');
    setLoadingPayments(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setErrorMessage('Authentication required. Please login again.');
        setLoadingPayments(false);
        return;
      }

      const params = {
        clinicId: clinicId.toString(),
        appointmentDate: paymentDate
      };
      
      console.log('💳 Loading payment appointments with params:', params);
      let data = await getAppointmentsByFilters(params);
      console.log('💳 Loaded appointments for payments:', data);
      
      if (!data || data.length === 0) {
        setErrorMessage('No appointments booked for the selected day.');
        setPaymentAppointments([]);
      } else {
        const appointmentsWithInvoices = await Promise.all(data.map(async (appt) => {
          try {
            const invoiceResponse = await request(`/Services/GetInvoicesByAppointmentComplete?appointmentId=${appt.appointmentId}`);
            
            if (invoiceResponse && Array.isArray(invoiceResponse)) {
              console.log(`📦 Found ${invoiceResponse.length} invoices for appointment ${appt.appointmentId}`);
              
              if (invoiceResponse.length > 0) {
                let totalInvoiceAmount = 0;
                let totalPaidAmount = 0;
                
                invoiceResponse.forEach(invoice => {
                  totalInvoiceAmount += invoice.header?.totalAmount || 0;
                  totalPaidAmount += (invoice.lineItems || []).reduce((s, i) => s + (i.amountPaid ?? i.AmountPaid ?? 0), 0);
                });
                
                const pendingAmount = Math.max(totalInvoiceAmount - totalPaidAmount, 0);
                const paymentStatus = totalPaidAmount === 0 ? 'Pending' : totalPaidAmount >= totalInvoiceAmount ? 'Paid' : 'Partial';
                
                return {
                  ...appt,
                  billableAmount: totalInvoiceAmount,
                  paidAmount: totalPaidAmount,
                  pendingAmount: pendingAmount,
                  paymentStatus: paymentStatus
                };
              }
            }
          } catch (invoiceError) {
            console.log(`⚠️ No invoices found for appointment ${appt.appointmentId}`);
          }
          
          const billable = parseFloat(appt.billableAmount) || 0;
          const paid = parseFloat(appt.paidAmount) || 0;
          const pending = billable - paid;
          
          return {
            ...appt,
            billableAmount: billable,
            paidAmount: paid,
            pendingAmount: Math.max(pending, 0),
            paymentStatus: appt.paymentStatus || 'Pending'
          };
        }));
        
        setPaymentAppointments(appointmentsWithInvoices);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Failed to load payment appointments:', error);
      setErrorMessage('Failed to load payments. Please try again.');
      setPaymentAppointments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentClinicId, paymentDate]);

  // Auto-load on appointment data
  useEffect(() => {
    if (isOpen && appointmentData && paymentClinicId) {
      loadPaymentAppointments();
    }
  }, [isOpen, appointmentData, paymentClinicId]);

  // Load invoices for specific appointment
  const loadInvoicesForAppointment = useCallback(async (appointmentId) => {
    setLoadingInvoices(prev => ({ ...prev, [appointmentId]: true }));
    try {
      console.log(`📦 Loading invoices for appointment ${appointmentId}...`);
      const response = await request(`/Services/GetInvoicesByAppointmentComplete?appointmentId=${appointmentId}`, {
        method: "GET"
      });
      
      if (response && Array.isArray(response)) {
        console.log(`✅ Found ${response.length} invoices for appointment ${appointmentId}:`, response);
        setInvoicesByAppointment(prev => ({
          ...prev,
          [appointmentId]: response
        }));
      } else {
        setInvoicesByAppointment(prev => ({
          ...prev,
          [appointmentId]: []
        }));
      }
    } catch (error) {
      console.error(`Failed to load invoices for appointment ${appointmentId}:`, error);
      setInvoicesByAppointment(prev => ({
        ...prev,
        [appointmentId]: []
      }));
    } finally {
      setLoadingInvoices(prev => ({ ...prev, [appointmentId]: false }));
    }
  }, []);

  // Handle showing invoices for an appointment
  const handleShowInvoices = useCallback((appointmentId) => {
    if (expandedAppointmentId === appointmentId) {
      setExpandedAppointmentId(null);
    } else {
      setExpandedAppointmentId(appointmentId);
      if (!invoicesByAppointment[appointmentId]) {
        loadInvoicesForAppointment(appointmentId);
      }
    }
  }, [expandedAppointmentId, invoicesByAppointment, loadInvoicesForAppointment]);

  // Download invoice as PDF
  const downloadInvoicePDF = (invoice) => {
    try {
      const docElement = document.createElement('div');
      docElement.style.position = 'absolute';
      docElement.style.left = '-9999px';
      docElement.style.top = '-9999px';
      docElement.innerHTML = generateInvoiceHTML(invoice);
      document.body.appendChild(docElement);
      
      html2canvas(docElement, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true
      }).then(canvas => {
        try {
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`Invoice-${invoice.header?.invoiceNumber}.pdf`);
          
          document.body.removeChild(docElement);
        } catch (err) {
          console.error('Error in PDF generation:', err);
          document.body.removeChild(docElement);
          alert('Failed to generate PDF');
        }
      }).catch(err => {
        console.error('Error in html2canvas:', err);
        document.body.removeChild(docElement);
        alert('Failed to generate PDF: ' + err.message);
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF: ' + error.message);
    }
  };

  const generateInvoiceHTML = (invoice) => {
    const lineItemsHTML = (invoice.lineItems || []).map((item, idx) => `
      <tr style="border-bottom: 1px solid #ccc; background:${idx % 2 === 0 ? '#fff' : '#f5f5f5'}">
        <td style="padding: 12px; text-align: center; color:#333">${idx + 1}</td>
        <td style="padding: 12px; color:#111">${item.serviceDescription}</td>
        <td style="padding: 12px; text-align: right; color:#333">₹${(item.serviceCost || 0).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; color:#555">₹${(item.gst || 0).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; font-weight:700; color:#000">₹${((item.serviceCost || 0) + (item.gst || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 20px; color:#111;">
        <h1 style="text-align: center; color: #000; border-bottom:3px solid #000; padding-bottom:12px;">INVOICE</h1>
        <p><strong>Invoice Number:</strong> ${invoice.header?.invoiceNumber}</p>
        <p><strong>Bill Date:</strong> ${new Date(invoice.header?.billDate).toLocaleDateString()}</p>
        <p><strong>Doctor:</strong> ${invoice.header?.doctorName || '—'}</p>
        <p><strong>Mode of Payment:</strong> ${invoice.header?.modeOfPayment || '—'}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border:1px solid #ccc;">
          <thead>
            <tr style="background: #222; color:#fff;">
              <th style="padding: 12px; text-align: left; border: 1px solid #555;">#</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #555;">Service</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #555;">Amount</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #555;">GST</th>
              <th style="padding: 12px; text-align: right; border: 1px solid #555;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHTML}
          </tbody>
          <tfoot>
            <tr style="background:#000; color:#fff;">
              <td colspan="4" style="padding:12px; text-align:right; font-weight:700;">Net Amount</td>
              <td style="padding:12px; text-align:right; font-weight:900; font-size:15px;">₹${(invoice.header?.netAmount || invoice.header?.totalAmount || 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-top: 20px; text-align: right; border-top:1px solid #ccc; padding-top:12px;">
          <p><strong>Total Amount:</strong> ₹${(invoice.header?.totalAmount || 0).toFixed(2)}</p>
          <p><strong>Paid Amount:</strong> ₹${(invoice.lineItems || []).reduce((s, i) => s + (i.amountPaid ?? i.AmountPaid ?? 0), 0).toFixed(2)}</p>
          <p><strong>Pending:</strong> ₹${Math.max(0, (invoice.header?.totalAmount || 0) - (invoice.lineItems || []).reduce((s, i) => s + (i.amountPaid ?? i.AmountPaid ?? 0), 0)).toFixed(2)}</p>
        </div>
        <div style="margin-top:24px; text-align:center; font-size:11px; color:#666; border-top:1px solid #ccc; padding-top:12px;">Computer generated invoice · Valid without signature</div>
      </div>
    `;
  };

  const openEditPaymentModal = useCallback((appointment) => {
    const billable = parseFloat(appointment.billableAmount) || 0;
    const paid = parseFloat(appointment.paidAmount) || 0;
    const pending = billable - paid;

    setEditingPaymentAppointment(appointment);
    setEditPaymentForm({
      billableAmount: billable,
      paidAmount: paid,
      pendingAmount: Math.max(pending, 0),
      paymentStatus: appointment.paymentStatus || 'Pending',
      appointmentStatus: appointment.status || 'Scheduled'
    });
    setShowEditPaymentModal(true);
  }, []);

  const handleSavePaymentEdit = useCallback(async () => {
    if (!editingPaymentAppointment) return;
    
    setSavingPaymentEdit(true);
    try {
      const billable = parseFloat(editPaymentForm.billableAmount) || 0;
      const paid = parseFloat(editPaymentForm.paidAmount) || 0;
      const pending = Math.max(billable - paid, 0);

      // Update invoice line items if they were edited
      if (editingInvoice && editInvoiceLineItems.length > 0) {
        console.log('💾 Updating invoice line items...');
        try {
          // Update each line item
          const updatePromises = editInvoiceLineItems.map(item =>
            request('/Services/UpdateInvoiceLineItem', {
              method: 'PUT',
              body: JSON.stringify({
                invoiceLineItemId: item.invoiceLineItemId,
                serviceDescription: item.serviceDescription,
                serviceCost: parseFloat(item.serviceCost) || 0,
                gst: parseFloat(item.gst) || 0
              })
            })
          );
          
          await Promise.all(updatePromises);
          console.log('✅ Invoice line items updated successfully');
        } catch (lineItemError) {
          console.error('❌ Error updating line items:', lineItemError);
          // Continue anyway - appointment still needs to be updated
        }
      }

      const updatedAppointment = {
        ...editingPaymentAppointment,
        billableAmount: billable,
        paidAmount: Math.min(paid, billable),
        pendingAmount: pending,
        paymentStatus: editPaymentForm.paymentStatus,
        status: editPaymentForm.appointmentStatus
      };

      await updateAppointment(updatedAppointment);
      
      // Refresh the invoices for this appointment to show updated data
      if (editingPaymentAppointment.appointmentId) {
        try {
          const updatedInvoices = await request(
            `/Services/GetInvoicesByAppointmentComplete?appointmentId=${editingPaymentAppointment.appointmentId}`
          );
          setInvoicesByAppointment(prev => ({
            ...prev,
            [editingPaymentAppointment.appointmentId]: updatedInvoices || []
          }));
        } catch (invoiceRefreshError) {
          console.error('Error refreshing invoices:', invoiceRefreshError);
        }
      }
      
      setPaymentAppointments(paymentAppointments.map(appt => 
        appt.appointmentId === editingPaymentAppointment.appointmentId 
          ? updatedAppointment
          : appt
      ));

      const funnyMessages = [
        "💰 Payment updated successfully!",
        "🎉 Money matters handled perfectly!",
        "✨ Payment details saved!"
      ];
      setPaymentSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
      setShowPaymentSuccessPopup(true);
      setTimeout(() => setShowPaymentSuccessPopup(false), 3000);
      
      setShowEditPaymentModal(false);
      setEditingPaymentAppointment(null);
      setEditingInvoice(null);
      setEditInvoiceLineItems([]);
    } catch (error) {
      console.error('Failed to save payment edit:', error);
      setPaymentSuccessMessage('😵 Error saving payment details!');
      setShowPaymentSuccessPopup(true);
      setTimeout(() => setShowPaymentSuccessPopup(false), 3000);
    } finally {
      setSavingPaymentEdit(false);
    }
  }, [editingPaymentAppointment, editPaymentForm, editingInvoice, editInvoiceLineItems, paymentAppointments]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden border border-blue-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 flex justify-between items-center text-white flex-shrink-0 z-10 shadow-lg">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">💳 Payment Details</h2>
                <p className="text-blue-100 text-sm">Manage and view appointment payments</p>
              </div>
              <button
                onClick={onClose}
                className="text-3xl hover:bg-white/20 p-2 rounded-full transition flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Filters */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Select Clinic:</label>
                    <select
                      value={paymentClinicId}
                      onChange={(e) => setPaymentClinicId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                    >
                      <option value="">-- Choose a clinic --</option>
                      {clinicsList.map((clinic) => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>
                          {clinic.clinicName || `Clinic ${clinic.clinicId}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Select Date:</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadPaymentAppointments}
                      disabled={loadingPayments || !paymentClinicId}
                      className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>🔍</span>
                      <span>{loadingPayments ? 'Loading...' : 'Load Payments'}</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 py-4 bg-amber-50 border-2 border-amber-200 rounded-2xl"
                  >
                    <p className="text-amber-800 font-medium">ℹ️ {errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Filter */}
              {paymentAppointments.length > 0 && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-100 p-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-stone-700">Filter:</span>
                    {['All', 'Paid', 'Partial', 'Pending'].map((status) => {
                      const count = status === 'All' 
                        ? paymentAppointments.length 
                        : paymentAppointments.filter(a => a.paymentStatus === status).length;
                      
                      return (
                        <motion.button
                          key={status}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPaymentStatusFilter(status)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2 ${
                            paymentStatusFilter === status
                              ? status === 'All' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' :
                                status === 'Paid' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' :
                                status === 'Partial' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
                                'bg-gradient-to-r from-rose-500 to-red-600 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                          }`}
                        >
                          <span>{
                            status === 'All' ? '📋' :
                            status === 'Paid' ? '✓' :
                            status === 'Partial' ? '⚠' : '⏳'
                          }</span>
                          <span>{status}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            paymentStatusFilter === status
                              ? 'bg-white/30'
                              : 'bg-stone-200'
                          }`}>
                            {count}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Appointments List */}
              {paymentAppointments.length > 0 && (
                <div className="space-y-4">
                  {paymentAppointments
                    .filter(appt => paymentStatusFilter === 'All' || appt.paymentStatus === paymentStatusFilter)
                    .map((appt, idx) => (
                      <motion.div
                        key={appt.appointmentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        {/* Main Row */}
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800">#{appt.appointmentId} - {appt.firstName} {appt.lastName}</p>
                            <p className="text-xs text-slate-600">{new Date(appt.appointmentDate).toLocaleDateString()} at {appt.startTime}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-slate-600">Billable</p>
                              <p className="font-bold text-slate-800">₹{(appt.billableAmount || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600">Paid</p>
                              <p className="font-bold text-emerald-600">₹{(appt.paidAmount || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600">Pending</p>
                              <p className="font-bold text-rose-600">₹{(appt.pendingAmount || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              appt.paymentStatus === 'Paid'
                                ? 'bg-emerald-500 text-white'
                                : appt.paymentStatus === 'Partial'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-rose-500 text-white'
                            }`}>
                              {appt.paymentStatus}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEditPaymentModal(appt)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-xs transition-all"
                          >
                            ✏️ Edit Payment
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleShowInvoices(appt.appointmentId)}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-1"
                          >
                            <ChevronDown size={14} className={expandedAppointmentId === appt.appointmentId ? 'rotate-180' : ''} />
                            {expandedAppointmentId === appt.appointmentId ? 'Hide' : 'View'} Invoices
                          </motion.button>
                        </div>

                        {/* Expanded Invoices Section */}
                        <AnimatePresence>
                          {expandedAppointmentId === appt.appointmentId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 pt-4 border-t border-blue-200"
                            >
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-teal-200">
                                {loadingInvoices[appt.appointmentId] ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-300 border-t-teal-600"></div>
                                  </div>
                                ) : invoicesByAppointment[appt.appointmentId]?.length === 0 ? (
                                  <p className="text-teal-700 font-medium text-center">No invoices created yet.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {invoicesByAppointment[appt.appointmentId]?.map((invoice, invIdx) => (
                                      <motion.div
                                        key={invIdx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: invIdx * 0.1 }}>
                                        {/* Compute status dynamically based on paid/total amounts */}
                                        {(() => {
                                          const invTotal = parseFloat(invoice.header?.totalAmount) || 0;
                                          const invPaid = (invoice.lineItems || []).reduce((s, i) => s + (i.amountPaid ?? i.AmountPaid ?? 0), 0);
                                          const invStatus = invPaid === 0 ? 'Pending' : invPaid >= invTotal ? 'Paid' : 'Partial';
                                          
                                          return (
                                            <div className={`rounded-lg p-5 border-l-4 ${
                                              invStatus === 'Paid' ? 'border-l-green-500 bg-green-50' :
                                              invStatus === 'Partial' ? 'border-l-amber-500 bg-amber-50' :
                                              'border-l-red-500 bg-red-50'
                                            }`}>
                                              {/* Header */}
                                              <div className="flex items-center justify-between mb-4">
                                                <div className="flex-1">
                                                  <p className="font-bold text-slate-800 text-lg">Invoice: {invoice.header?.invoiceNumber}</p>
                                                  <p className="text-sm text-slate-600">Bill Date: {new Date(invoice.header?.billDate).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-4 py-2 rounded-full text-sm font-bold text-white ${
                                                  invStatus === 'Paid' ? 'bg-green-500' :
                                                  invStatus === 'Partial' ? 'bg-amber-500' :
                                                  'bg-red-500'
                                                }`}>
                                                  {invStatus}
                                                </span>
                                              </div>

                                              {/* Line Items Table */}
                                              <div className="bg-white rounded-lg overflow-hidden mb-4 border border-slate-200 shadow-sm">
                                                <table className="w-full text-sm">
                                                  <thead>
                                                    <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-300">
                                                      <th className="px-4 py-3 text-left font-bold text-blue-900">#</th>
                                                      <th className="px-4 py-3 text-left font-bold text-blue-900">Service</th>
                                                      <th className="px-4 py-3 text-right font-bold text-blue-900">Amount</th>
                                                      <th className="px-4 py-3 text-right font-bold text-blue-900">GST</th>
                                                      <th className="px-4 py-3 text-right font-bold text-blue-900">Total</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {invoice.lineItems?.map((item, itemIdx) => (
                                                      <tr key={itemIdx} className="border-b hover:bg-blue-50 transition-colors">
                                                        <td className="px-4 py-3 text-slate-700 font-medium">{itemIdx + 1}</td>
                                                        <td className="px-4 py-3 text-slate-800 font-semibold">{item.serviceDescription}</td>
                                                        <td className="px-4 py-3 text-right text-slate-700">₹{(item.serviceCost || 0).toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right text-amber-600 font-medium">₹{(item.gst || 0).toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-blue-700">₹{((item.serviceCost || 0) + (item.gst || 0)).toFixed(2)}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>

                                              {/* Invoice Summary */}
                                              <div className="grid grid-cols-4 gap-3 mb-4">
                                                <div className="bg-white rounded-lg p-3 border-2 border-blue-200 shadow-sm">
                                                  <p className="text-xs font-bold text-blue-600 uppercase">Total</p>
                                                  <p className="font-bold text-blue-700 text-lg">₹{invTotal.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border-2 border-emerald-200 shadow-sm">
                                                  <p className="text-xs font-bold text-emerald-600 uppercase">Paid</p>
                                                  <p className="font-bold text-emerald-600 text-lg">₹{invPaid.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border-2 border-rose-200 shadow-sm">
                                                  <p className="text-xs font-bold text-rose-600 uppercase">Due</p>
                                                  <p className="font-bold text-rose-600 text-lg">₹{Math.max(0, invTotal - invPaid).toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border-2 border-slate-200 shadow-sm">
                                                  <p className="text-xs font-bold text-slate-600 uppercase">Payment Status</p>
                                                  <p className="font-bold text-slate-700 text-lg">{invStatus}</p>
                                                </div>
                                              </div>

                                              {/* Action Buttons */}
                                              <div className="flex gap-3">
                                                <motion.button
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={() => {
                                                    setEditingPaymentAppointment({...appt, invoiceNumber: invoice.header?.invoiceNumber});
                                                    setEditingInvoice(invoice);
                                                    setEditInvoiceLineItems((invoice.lineItems || []).map(item => ({
                                                      ...item,
                                                      originalServiceCost: item.serviceCost,
                                                      originalGst: item.gst
                                                    })));
                                                    setEditPaymentForm({
                                                      billableAmount: invTotal,
                                                      paidAmount: invPaid,
                                                      pendingAmount: Math.max(invTotal - invPaid, 0),
                                                      paymentStatus: invStatus,
                                                      appointmentStatus: appt.status || 'Scheduled'
                                                    });
                                                    setShowEditPaymentModal(true);
                                                  }}
                                                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                                                >
                                                  ✏️ Edit Invoice
                                                </motion.button>
                                                <motion.button
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={() => downloadInvoicePDF(invoice)}
                                                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                                                >
                                                  <Download size={16} />
                                                  PDF Download
                                                </motion.button>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                </div>
              )}

              {loadingPayments && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-stone-600 font-medium">Loading payments...</p>
                </motion.div>
              )}
            </div>

            {/* Footer Close Button */}
            <div className="bg-slate-50 p-4 border-t border-blue-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>

          {/* Edit Payment Modal */}
          <AnimatePresence>
            {showEditPaymentModal && editingPaymentAppointment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4"
                onClick={() => setShowEditPaymentModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 flex justify-between items-center text-white flex-shrink-0 z-10">
                    <h2 className="text-xl md:text-2xl font-bold">✏️ Edit Payment Details</h2>
                    <button
                      onClick={() => setShowEditPaymentModal(false)}
                      className="text-2xl hover:bg-white/20 p-2 rounded-full transition flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Line Items Editing Section */}
                    {editingInvoice && editInvoiceLineItems.length > 0 && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Edit Line Items</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-200 to-indigo-200">
                                <th className="px-3 py-2 text-left font-bold text-blue-900">#</th>
                                <th className="px-3 py-2 text-left font-bold text-blue-900">Service</th>
                                <th className="px-3 py-2 text-right font-bold text-blue-900">Amount</th>
                                <th className="px-3 py-2 text-right font-bold text-blue-900">GST %</th>
                                <th className="px-3 py-2 text-right font-bold text-blue-900">GST Amount</th>
                                <th className="px-3 py-2 text-right font-bold text-blue-900">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editInvoiceLineItems.map((item, idx) => {
                                const amount = parseFloat(item.serviceCost) || 0;
                                const gstRate = (parseFloat(item.gst) / amount * 100) || 0;
                                const gstAmount = parseFloat(item.gst) || 0;
                                return (
                                  <tr key={idx} className="border-b hover:bg-blue-100">
                                    <td className="px-3 py-2 text-slate-700 font-medium">{idx + 1}</td>
                                    <td className="px-3 py-2 text-slate-800">
                                      <input
                                        type="text"
                                        value={item.serviceDescription}
                                        onChange={(e) => {
                                          const updated = [...editInvoiceLineItems];
                                          updated[idx].serviceDescription = e.target.value;
                                          setEditInvoiceLineItems(updated);
                                        }}
                                        className="w-full p-1 border border-slate-300 rounded text-xs"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => {
                                          const newAmount = parseFloat(e.target.value) || 0;
                                          const updated = [...editInvoiceLineItems];
                                          updated[idx].serviceCost = newAmount;
                                          updated[idx].gst = (newAmount * gstRate / 100);
                                          setEditInvoiceLineItems(updated);
                                          
                                          const newTotal = editInvoiceLineItems.reduce((sum, it, i) => {
                                            if (i === idx) return sum + newAmount + (newAmount * gstRate / 100);
                                            return sum + (parseFloat(it.serviceCost) || 0) + (parseFloat(it.gst) || 0);
                                          }, 0);
                                          setEditPaymentForm(prev => ({
                                            ...prev,
                                            billableAmount: newTotal,
                                            pendingAmount: Math.max(newTotal - (parseFloat(prev.paidAmount) || 0), 0)
                                          }));
                                        }}
                                        className="w-full p-1 border border-slate-300 rounded text-xs"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700 text-xs">{gstRate.toFixed(2)}%</td>
                                    <td className="px-3 py-2 text-right text-slate-700 text-xs">₹{gstAmount.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right font-bold text-blue-700">₹{(amount + gstAmount).toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Billable Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPaymentForm.billableAmount}
                        onChange={(e) => {
                          const billable = parseFloat(e.target.value) || 0;
                          const paid = parseFloat(editPaymentForm.paidAmount) || 0;
                          const pending = Math.max(billable - paid, 0);
                          setEditPaymentForm({ 
                            ...editPaymentForm, 
                            billableAmount: billable,
                            pendingAmount: pending
                          });
                        }}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Paid Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPaymentForm.paidAmount}
                        onChange={(e) => {
                          const paid = parseFloat(e.target.value) || 0;
                          const billable = parseFloat(editPaymentForm.billableAmount) || 0;
                          const pending = Math.max(billable - paid, 0);
                          setEditPaymentForm({ 
                            ...editPaymentForm, 
                            paidAmount: paid,
                            pendingAmount: pending
                          });
                        }}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Pending Amount (auto-calculated)</label>
                      <input
                        type="number"
                        value={editPaymentForm.pendingAmount}
                        disabled
                        className="w-full p-3 border-2 border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Status</label>
                      <select
                        value={editPaymentForm.paymentStatus}
                        onChange={(e) => setEditPaymentForm({ ...editPaymentForm, paymentStatus: e.target.value })}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Status</label>
                      <select
                        value={editPaymentForm.appointmentStatus}
                        onChange={(e) => setEditPaymentForm({ ...editPaymentForm, appointmentStatus: e.target.value })}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="No-show">No-show</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 md:p-6 flex gap-3 border-t border-slate-200 flex-shrink-0 sticky bottom-0 z-10">
                    <button
                      onClick={() => setShowEditPaymentModal(false)}
                      disabled={savingPaymentEdit}
                      className="flex-1 px-4 md:px-6 py-2 md:py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition disabled:opacity-50 text-sm md:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePaymentEdit}
                      disabled={savingPaymentEdit}
                      className="flex-1 px-4 md:px-6 py-2 md:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 text-sm md:text-base"
                    >
                      {savingPaymentEdit ? '💾 Saving...' : '💾 Save Changes'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Popup */}
          <AnimatePresence>
            {showPaymentSuccessPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-3xl shadow-2xl p-8 text-center border-4 border-white"
                >
                  <p className="text-2xl font-bold text-white mb-2">Success!</p>
                  <p className="text-white text-lg font-semibold">{paymentSuccessMessage}</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
