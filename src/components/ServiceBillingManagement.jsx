import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentsByFilters } from '../services/appointmentService';
import { getAccessToken, getClinicIdFromToken, getSelectedAccess } from '../services/tokenManager';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function ServiceBillingManagement({ onPaymentClick, refreshTrigger }) {
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingClinicId, setBillingClinicId] = useState('');
  const [clinicsList, setClinicsList] = useState([]);
  const [billingAppointments, setBillingAppointments] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load clinics from token on mount
  useEffect(() => {
    const selectedAccess = getSelectedAccess();
    console.log('📋 Loading clinics from selectedAccess:', selectedAccess);
    
    if (selectedAccess?.clinics && Array.isArray(selectedAccess.clinics)) {
      console.log('✅ Found clinics array:', selectedAccess.clinics);
      setClinicsList(selectedAccess.clinics);
      if (selectedAccess.clinicId) {
        setBillingClinicId(selectedAccess.clinicId.toString());
      }
    } else {
      // Fallback to getting clinic ID directly from token
      const clinicId = getClinicIdFromToken();
      console.log('⚠️ Fallback: Getting clinicId from token:', clinicId);
      if (clinicId) {
        setBillingClinicId(clinicId.toString());
        setClinicsList([{ clinicId, clinicName: `Clinic ${clinicId}` }]);
      }
    }
  }, []);

  // Load service billing appointments
  const loadBillingAppointments = useCallback(async () => {
    const clinicId = billingClinicId;
    
    if (!clinicId) {
      setErrorMessage('Please select a clinic to load appointments.');
      return;
    }

    setErrorMessage('');
    setLoadingBilling(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setErrorMessage('Authentication required. Please login again.');
        setLoadingBilling(false);
        return;
      }

      const params = {
        clinicId: clinicId.toString(),
        appointmentDate: billingDate
      };
      
      console.log('🏥 Loading service billing appointments with params:', params);
      let data = await getAppointmentsByFilters(params);
      console.log('🏥 Loaded appointments for service billing:', data);
      
      if (!data || data.length === 0) {
        setErrorMessage('No appointments booked for the selected day.');
        setBillingAppointments([]);
      } else {
        setBillingAppointments(data);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Failed to load service billing appointments:', error);
      setErrorMessage('Failed to load appointments. Please try again.');
      setBillingAppointments([]);
    } finally {
      setLoadingBilling(false);
    }
  }, [billingClinicId, billingDate]);

  // Auto-load appointments when clinic or date changes
  useEffect(() => {
    if (billingClinicId) {
      loadBillingAppointments();
    }
  }, [billingClinicId, billingDate, refreshTrigger, loadBillingAppointments]);

  return (
    <>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
              💰
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Service Billing
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">Create invoices for patient services</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Select Clinic:</label>
              <select
                value={billingClinicId}
                onChange={(e) => setBillingClinicId(e.target.value)}
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
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
              />
            </div>
            <div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadBillingAppointments}
                disabled={loadingBilling || !billingClinicId}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>🔍</span>
                <span>{loadingBilling ? 'Loading...' : 'Search Appointments'}</span>
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

        {/* Appointments Grid */}
        <div className="p-6">
          {loadingBilling ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-stone-600 font-medium">Loading appointments...</p>
            </div>
          ) : billingAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-stone-700 mb-2">No Appointments Found</h3>
              <p className="text-stone-500">Try adjusting your filters to see appointments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Appointments Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-300">
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Doctor</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingAppointments.map((appt, idx) => (
                      <motion.tr
                        key={appt.appointmentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-stone-200 hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-stone-700">#{appt.appointmentId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
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
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-stone-500">{appt.startTime?.substring(0, 5) || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-stone-700">{appt.appointmentType || 'Consultation'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-stone-700">{appt.doctorName || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onPaymentClick(appt)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                              title="Create Invoice"
                            >
                              💳 Payment
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-blue-200">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-4 border-2 border-indigo-200 shadow-md"
                >
                  <p className="text-xs font-bold text-indigo-700 uppercase mb-1">Total Appointments</p>
                  <p className="text-3xl font-bold text-indigo-900">{billingAppointments.length}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-200 shadow-md"
                >
                  <p className="text-xs font-bold text-blue-700 uppercase mb-1">Ready for Billing</p>
                  <p className="text-3xl font-bold text-blue-900">{billingAppointments.length}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gradient-to-br from-cyan-50 to-teal-100 rounded-xl p-4 border-2 border-cyan-200 shadow-md"
                >
                  <p className="text-xs font-bold text-cyan-700 uppercase mb-1">Date</p>
                  <p className="text-lg font-bold text-cyan-900">
                    {new Date(billingDate).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
