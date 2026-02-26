import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getAppointmentsByFilters, updateAppointment } from '../services/appointmentService';
import { getAccessToken, getClinicIdFromToken, getSelectedAccess } from '../services/tokenManager';
import { request } from '../services/apiClient';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function PaymentManagement({ appointmentData, returnTo }) {
  const navigate = useNavigate();
  const [paymentDate, setPaymentDate] = useState(appointmentData?.appointmentDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [paymentClinicId, setPaymentClinicId] = useState('');
  const [clinicsList, setClinicsList] = useState([]);
  const [paymentAppointments, setPaymentAppointments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [showPaymentSuccessPopup, setShowPaymentSuccessPopup] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPaymentAppointment, setEditingPaymentAppointment] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [editPaymentForm, setEditPaymentForm] = useState({
    billableAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paymentStatus: 'Pending',
    appointmentStatus: 'Scheduled'
  });
  const [savingPaymentEdit, setSavingPaymentEdit] = useState(false);

  // Load clinics from token on mount
  useEffect(() => {
    const selectedAccess = getSelectedAccess();
    if (selectedAccess?.clinics && Array.isArray(selectedAccess.clinics)) {
      setClinicsList(selectedAccess.clinics);
      if (selectedAccess.clinicId) {
        setPaymentClinicId(selectedAccess.clinicId.toString());
      }
    } else {
      // Fallback to getting clinic ID directly from token
      const clinicId = getClinicIdFromToken();
      if (clinicId) {
        setPaymentClinicId(clinicId.toString());
        setClinicsList([{ clinicId, clinicName: `Clinic ${clinicId}` }]);
      }
    }
  }, []);

  // Handle appointment data from Calendar redirect
  useEffect(() => {
    if (appointmentData) {
      setEditingPaymentAppointment(appointmentData);
      setEditPaymentForm({
        billableAmount: appointmentData.billableAmount || 0,
        paidAmount: appointmentData.paidAmount || 0,
        pendingAmount: appointmentData.pendingAmount || 0,
        paymentStatus: appointmentData.paymentStatus || 'Pending',
        appointmentStatus: appointmentData.status || 'Scheduled'
      });
      setShowEditPaymentModal(true);
    }
  }, [appointmentData]);

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
        // Fetch invoices for each appointment to get actual paid amounts
        const appointmentsWithInvoices = await Promise.all(data.map(async (appt) => {
          try {
            // Fetch invoices for this appointment
            const invoiceResponse = await request(`/Services/GetInvoicesByAppointmentComplete?appointmentId=${appt.appointmentId}`);
            
            if (invoiceResponse && Array.isArray(invoiceResponse)) {
              console.log(`📦 Found ${invoiceResponse.length} invoices for appointment ${appt.appointmentId}`);
              
              // If invoices exist, calculate paid/pending from invoices
              if (invoiceResponse.length > 0) {
                let totalInvoiceAmount = 0;
                let totalPaidAmount = 0;
                let hasPartialPayment = false;
                
                invoiceResponse.forEach(invoice => {
                  totalInvoiceAmount += invoice.header?.totalAmount || 0;
                  totalPaidAmount += invoice.header?.paidAmount || 0;
                  if (invoice.header?.status === 'Partial') {
                    hasPartialPayment = true;
                  }
                });
                
                const pendingAmount = Math.max(totalInvoiceAmount - totalPaidAmount, 0);
                const paymentStatus = totalPaidAmount === 0 ? 'Pending' : totalPaidAmount >= totalInvoiceAmount ? 'Paid' : 'Partial';
                
                console.log(`💰 Appointment ${appt.appointmentId}: Total=${totalInvoiceAmount}, Paid=${totalPaidAmount}, Pending=${pendingAmount}, Status=${paymentStatus}`);
                
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
            console.log(`⚠️ No invoices found for appointment ${appt.appointmentId}, using appointment data`);
          }
          
          // Fallback: use appointment data if no invoices found
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

  const handleUpdatePaymentStatus = useCallback(async (appointmentId, newStatus) => {
    setUpdatingPayment(appointmentId);
    try {
      const appointment = paymentAppointments.find(appt => appt.appointmentId === appointmentId);
      if (!appointment) return;

      const updatedAppointment = {
        ...appointment,
        paymentStatus: newStatus
      };

      await updateAppointment(updatedAppointment);
      
      // Update local state
      setPaymentAppointments(paymentAppointments.map(appt => 
        appt.appointmentId === appointmentId 
          ? updatedAppointment
          : appt
      ));
      
      // Show funny success popup
      const statusMessages = {
        'Paid': [
          "💸 Ka-ching! Payment marked as PAID! Time to celebrate with confetti!",
          "🎊 Full payment received! The money fairy is pleased!",
          "✅ Paid in full! Someone's getting a gold star today!"
        ],
        'Partial': [
          "💰 Partial payment locked in! We're halfway there, living on a prayer!",
          "⚠️ Part payment recorded! The glass is half full... of money!",
          "📊 Partial success! Rome wasn't built in a day, neither are full payments!"
        ],
        'Pending': [
          "⏳ Back to pending! The payment train hasn't arrived at the station yet!",
          "🕐 Pending status activated! Patience is a virtue... especially in payments!",
          "⌛ Pending mode engaged! Good things come to those who wait!"
        ]
      };
      const messages = statusMessages[newStatus] || statusMessages['Pending'];
      setPaymentSuccessMessage(messages[Math.floor(Math.random() * messages.length)]);
      setShowPaymentSuccessPopup(true);
      setTimeout(() => setShowPaymentSuccessPopup(false), 4000);
      
      console.log('✅ Payment status updated successfully');
    } catch (error) {
      console.error('Failed to update payment status:', error);
      setPaymentSuccessMessage('😵 Whoops! The payment status update took a wrong turn! Please try again!');
      setShowPaymentSuccessPopup(true);
      setTimeout(() => setShowPaymentSuccessPopup(false), 4000);
    } finally {
      setUpdatingPayment(null);
    }
  }, [paymentAppointments]);

  const openEditPaymentModal = useCallback((appointment) => {
    // Ensure all values are properly parsed as numbers
    const billable = parseFloat(appointment.billableAmount) || 0;
    const paid = parseFloat(appointment.paidAmount) || 0;
    const pending = billable - paid;

    console.log('📋 Opening edit modal with appointment:', {
      billable,
      paid,
      pending,
      calculatedPending: Math.max(pending, 0)
    });

    setEditingPaymentAppointment(appointment);
    setEditPaymentForm({
      billableAmount: billable,
      paidAmount: paid,
      pendingAmount: Math.max(pending, 0),
      paymentStatus: appointment.paymentStatus || 'Pending',
      appointmentStatus: appointment.appointmentStatus || 'Scheduled'
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

      console.log('💾 Saving payment with calculated values:', {
        billable,
        paid,
        pending,
        originalData: {
          billable: editingPaymentAppointment.billableAmount,
          paid: editingPaymentAppointment.paidAmount,
          pending: editingPaymentAppointment.pendingAmount
        }
      });

      const updatedAppointment = {
        ...editingPaymentAppointment,
        billableAmount: billable,
        paidAmount: Math.min(paid, billable), // Ensure paid doesn't exceed billable
        pendingAmount: pending, // Use calculated pending
        paymentStatus: editPaymentForm.paymentStatus,
        appointmentStatus: editPaymentForm.appointmentStatus
      };

      await updateAppointment(updatedAppointment);
      
      // Update local state
      setPaymentAppointments(paymentAppointments.map(appt => 
        appt.appointmentId === editingPaymentAppointment.appointmentId 
          ? updatedAppointment
          : appt
      ));

      // If coming from Calendar, redirect back with success
      if (appointmentData && returnTo === 'calendar') {
        // Redirect back to calendar
        navigate('/calendar', { 
          state: { 
            successMessage: '✅ Payment updated successfully!',
            updatedAppointment: updatedAppointment
          }
        });
        return;
      }

      // Show funny success popup for regular payment management
      const funnyMessages = [
        "💰 Cha-ching! Money talk is all sorted! The accountant is doing a happy dance!",
        "🎉 Payment updated! Even your calculator is impressed with those numbers!",
        "✨ Boom! Updated like a boss! The payment gods smile upon you!",
        "🚀 Warp speed payment update complete! Captain's log: Success achieved!",
        "🎪 And the crowd goes wild! Payment details updated with finesse!",
        "🦸‍♂️ Super Save! You've rescued another payment from the pending zone!",
        "🌟 Shazam! Money matters handled like magic! Abracadabra, it's done!",
        "🎯 Bullseye! Direct hit on the payment update button!",
        "🏆 Achievement Unlocked: Master Payment Updater! +100 XP!"
      ];
      setPaymentSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
      setShowPaymentSuccessPopup(true);
      setTimeout(() => setShowPaymentSuccessPopup(false), 5000);
      
      setShowEditPaymentModal(false);
      setEditingPaymentAppointment(null);
    } catch (error) {
      console.error('Failed to save payment edit:', error);
      const errorMessages = [
        "😱 Oops! The payment gremlins are at it again! Give it another shot!",
        "🤦‍♂️ Houston, we have a problem! The payment didn't quite make it. Try again?",
        "🎭 Plot twist! Something went wrong. But hey, second chances are a thing!",
        "🙈 Awkward... The update decided to take a coffee break. Retry?"
      ];
      setPaymentSuccessMessage(errorMessages[Math.floor(Math.random() * errorMessages.length)]);
      setShowPaymentSuccessPopup(true);
      setTimeout(() => setShowPaymentSuccessPopup(false), 5000);
    } finally {
      setSavingPaymentEdit(false);
    }
  }, [editingPaymentAppointment, editPaymentForm, paymentAppointments, appointmentData, returnTo, navigate]);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
            💳
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Payment Management
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">Track and manage patient payments</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
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
              <span>{loadingPayments ? 'Loading...' : 'Search Payments'}</span>
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
            className="px-6 py-4 bg-amber-50 border-b-2 border-amber-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <p className="text-amber-800 font-medium">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Filter Tabs */}
      {paymentAppointments.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-stone-700">Filter by Status:</span>
            {['All', 'Paid', 'Partial', 'Pending'].map((status) => {
              const count = status === 'All' 
                ? paymentAppointments.length 
                : paymentAppointments.filter(a => a.paymentStatus === status).length;
              
              return (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.05, y: -2 }}
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

      {/* Payment Grid */}
      <div className="p-6">
        {loadingPayments ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-stone-600 font-medium">Loading payment information...</p>
          </div>
        ) : paymentAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">No Payments Found</h3>
            <p className="text-stone-500">Try adjusting your filters to see payment records.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Appointments Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 to-teal-100 border-b-2 border-emerald-300">
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Pending</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-emerald-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentAppointments
                    .filter(appt => paymentStatusFilter === 'All' || appt.paymentStatus === paymentStatusFilter)
                    .map((appt, idx) => (
                    <motion.tr
                      key={appt.appointmentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-stone-200 hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-stone-700">#{appt.appointmentId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {appt.firstName?.charAt(0)}{appt.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-800 text-sm">{appt.firstName} {appt.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-stone-700">
                          {new Date(appt.appointmentDate).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-stone-500">{appt.startTime?.substring(0, 5) || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-stone-700">{appt.appointmentType || 'Consultation'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-base font-bold text-stone-900">₹{(appt.billableAmount || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-emerald-700">₹{(appt.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const billable = parseFloat(appt.billableAmount) || 0;
                          const paid = parseFloat(appt.paidAmount) || 0;
                          const pending = Math.max(billable - paid, 0);
                          return <span className="text-sm font-bold text-rose-700">₹{pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUpdatePaymentStatus(appt.appointmentId, 'Paid')}
                            disabled={updatingPayment === appt.appointmentId}
                            className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                              appt.paymentStatus === 'Paid'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300'
                            } disabled:opacity-50`}
                            title="Mark as Paid"
                          >
                            ✓
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUpdatePaymentStatus(appt.appointmentId, 'Partial')}
                            disabled={updatingPayment === appt.appointmentId}
                            className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                              appt.paymentStatus === 'Partial'
                                ? 'bg-yellow-500 text-white shadow-md'
                                : 'bg-white text-yellow-700 hover:bg-yellow-50 border border-yellow-300'
                            } disabled:opacity-50`}
                            title="Mark as Partial"
                          >
                            ⚠
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUpdatePaymentStatus(appt.appointmentId, 'Pending')}
                            disabled={updatingPayment === appt.appointmentId}
                            className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                              appt.paymentStatus === 'Pending'
                                ? 'bg-rose-500 text-white shadow-md'
                                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-300'
                            } disabled:opacity-50`}
                            title="Mark as Pending"
                          >
                            ⏳
                          </motion.button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditPaymentModal(appt)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs shadow-md transition-all"
                            title="Edit Details"
                          >
                            ✏️ Edit
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {paymentAppointments.length > 0 && (() => {
              const filteredAppointments = paymentAppointments.filter(appt => 
                paymentStatusFilter === 'All' || appt.paymentStatus === paymentStatusFilter
              );
              
              return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t-2 border-emerald-200">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-4 border-2 border-indigo-200 shadow-md"
                >
                  <p className="text-xs font-bold text-indigo-700 uppercase mb-1">Total Appointments</p>
                  <p className="text-3xl font-bold text-indigo-900">{filteredAppointments.length}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 border-2 border-emerald-200 shadow-md"
                >
                  <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Total Collected</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    ₹{filteredAppointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0).toLocaleString('en-IN')}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-rose-50 to-red-100 rounded-xl p-4 border-2 border-rose-200 shadow-md"
                >
                  <p className="text-xs font-bold text-rose-700 uppercase mb-1">Total Pending</p>
                  <p className="text-3xl font-bold text-rose-900">
                    ₹{filteredAppointments.reduce((sum, a) => sum + (a.pendingAmount || 0), 0).toLocaleString('en-IN')}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-4 border-2 border-amber-200 shadow-md"
                >
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">Grand Total</p>
                  <p className="text-3xl font-bold text-amber-900">
                    ₹{filteredAppointments.reduce((sum, a) => sum + (a.billableAmount || 0), 0).toLocaleString('en-IN')}
                  </p>
                </motion.div>
              </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Success Popup */}
      <AnimatePresence>
        {showPaymentSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-3xl shadow-2xl p-8 text-center border-4 border-white"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <p className="text-2xl font-bold text-white mb-2">Success!</p>
              <p className="text-white text-lg font-semibold">{paymentSuccessMessage}</p>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-4 text-4xl"
              >
                ✨
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Payment Modal */}
      <AnimatePresence>
        {showEditPaymentModal && editingPaymentAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
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

              <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
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
                      console.log('💵 Updating billable amount:', { billable, paid, pending });
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
                      console.log('💰 Updating paid amount:', { paid, billable, pending });
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
    </div>
  );
}
