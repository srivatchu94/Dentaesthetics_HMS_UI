import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentsByFilters, getAppointmentById } from '../services/appointmentService';
import { searchPatients } from '../services/patientService';
import { getAccessToken, getClinicIdFromToken, getSelectedAccess } from '../services/tokenManager';
import { request } from '../services/apiClient';
import { Download, Mail, Eye, ChevronDown, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function ServiceBillingManagement({ onPaymentClick, refreshTrigger }) {
  // Existing states
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [billingClinicId, setBillingClinicId] = useState('');
  const [clinicsList, setClinicsList] = useState([]);
  const [billingAppointments, setBillingAppointments] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const [invoicesByAppointment, setInvoicesByAppointment] = useState({});
  const [loadingInvoices, setLoadingInvoices] = useState({});

  // New states for patient search tab
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'patient'
  const [patientSearchId, setPatientSearchId] = useState('');
  const [patientSearchPhone, setPatientSearchPhone] = useState('');
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingPatientSearch, setLoadingPatientSearch] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState('');
  const [selectedPatientAppointmentId, setSelectedPatientAppointmentId] = useState(null);
  const [mobileNumberError, setMobileNumberError] = useState('');
  const [showPatientAppointments, setShowPatientAppointments] = useState(false);

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
        fromDate: fromDate,
        toDate: toDate
      };
      
      console.log('🏥 Loading service billing appointments with params:', params);
      let data = await getAppointmentsByFilters(params);
      console.log('🏥 Loaded appointments for service billing:', data);
      
      if (!data || data.length === 0) {
        setErrorMessage('No appointments booked for the selected date range.');
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
  }, [billingClinicId, fromDate, toDate]);

  // Auto-load appointments on initial mount with today's date
  useEffect(() => {
    if (billingClinicId) {
      // Only load once when clinic is selected for the first time
      loadBillingAppointments();
    }
  }, [billingClinicId]); // Only on clinic change

  // Clear invoice cache when refreshTrigger changes (after update)
  useEffect(() => {
    console.log("🔄 Refresh triggered - clearing invoice cache");
    setInvoicesByAppointment({});
    // Reload appointments after payment update
    if (billingClinicId) {
      loadBillingAppointments();
    }
  }, [refreshTrigger]);



  // Validate mobile number
  const validateMobileNumber = (mobileNumber) => {
    // If empty, it's optional - no validation needed
    if (!mobileNumber || mobileNumber.trim() === "") {
      setMobileNumberError("");
      return true;
    }

    // Check if only numbers
    if (!/^\d+$/.test(mobileNumber)) {
      setMobileNumberError("⚠️ Mobile number should contain only numbers");
      return false;
    }

    // Check if length is at least 10
    if (mobileNumber.length !== 10) {
      setMobileNumberError("⚠️ Mobile number must be exactly 10 digits");
      return false;
    }

    // Validation passed
    setMobileNumberError("");
    return true;
  };

  // Search patient by ID or phone number
  const searchPatient = useCallback(async () => {
    if (!patientSearchId && !patientSearchPhone) {
      setPatientSearchError('Please enter Patient ID or Phone Number');
      return;
    }

    // Validate mobile number if provided
    if (!validateMobileNumber(patientSearchPhone)) {
      return;
    }

    setLoadingPatientSearch(true);
    setPatientSearchError('');
    setSearchedPatient(null);
    setPatientAppointments([]);

    try {
      // Use the proper searchPatients function with mobilenumber parameter
      const params = {
        patientId: patientSearchId ? parseInt(patientSearchId) : undefined,
        mobilenumber: patientSearchPhone || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      console.log('🔍 Searching patient with params:', params);
      const results = await searchPatients(params);
      
      if (results && results.length > 0) {
        const patient = results[0];
        console.log('✅ Patient found:', patient);
        setSearchedPatient(patient);

        // Load appointments for this patient
        if (patient.patientId) {
          try {
            const clinicIdFromToken = getClinicIdFromToken();
            const appointmentsResponse = await getAppointmentById({
              clinicId: clinicIdFromToken ? parseInt(clinicIdFromToken) : undefined,
              patientId: patient.patientId,
              mobilenumber: patientSearchPhone || undefined
            });
            
            console.log('✅ Patient appointments:', appointmentsResponse);
            setPatientAppointments(Array.isArray(appointmentsResponse) ? appointmentsResponse : []);
          } catch (apptError) {
            console.error('Error fetching appointments:', apptError);
            setPatientAppointments([]);
          }
        }
      } else {
        setPatientSearchError('Patient not found. Please check the ID or phone number.');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setPatientSearchError('Failed to search patient. Please try again.');
    } finally {
      setLoadingPatientSearch(false);
    }
  }, [patientSearchId, patientSearchPhone]);

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
        console.log(`No invoices found for appointment ${appointmentId}`);
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
      // Load invoices if not already loaded
      if (!invoicesByAppointment[appointmentId]) {
        loadInvoicesForAppointment(appointmentId);
      }
    }
  }, [expandedAppointmentId, invoicesByAppointment, loadInvoicesForAppointment]);

  // Handle showing/hiding patient appointments
  const handleTogglePatientAppointments = useCallback(async () => {
    if (showPatientAppointments) {
      // Hide appointments
      setShowPatientAppointments(false);
    } else {
      // Show appointments - fetch from API with patientId, mobilenumber and clinicId
      if (searchedPatient && searchedPatient.patientId) {
        setLoadingPatientSearch(true);
        try {
          const clinicIdFromToken = getClinicIdFromToken();
          console.log('📅 Fetching appointments for patient:', searchedPatient.patientId, 'from clinic:', clinicIdFromToken);
          const appointmentsResponse = await getAppointmentById({
            clinicId: clinicIdFromToken ? parseInt(clinicIdFromToken) : undefined,
            patientId: searchedPatient.patientId,
            mobilenumber: patientSearchPhone || undefined
          });
          
          console.log('✅ Fetched appointments:', appointmentsResponse);
          setPatientAppointments(Array.isArray(appointmentsResponse) ? appointmentsResponse : []);
          setShowPatientAppointments(true);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setPatientSearchError('Failed to load appointments. Please try again.');
        } finally {
          setLoadingPatientSearch(false);
        }
      }
    }
  }, [showPatientAppointments, searchedPatient, patientSearchPhone]);

  // Download invoice as PDF
  const downloadInvoicePDF = (invoice) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // Header
      doc.setFillColor(30, 60, 114);
      doc.rect(0, yPosition, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('INVOICE', pageWidth / 2, yPosition + 10, { align: 'center' });

      yPosition += 20;

      // Invoice details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Invoice #: ${invoice.header.invoiceNumber}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Date: ${new Date(invoice.header.billDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 5;
      const invLineItems = invoice.lineItems || [];
      const invTotalPaid = invLineItems.reduce((s, i) => s + (i.amountPaid || 0), 0);
      const invStatus = invTotalPaid === 0 ? 'Pending' : invTotalPaid >= (invoice.header.totalAmount || 0) ? 'Paid' : 'Partial';
      doc.text(`Status: ${invStatus}`, margin, yPosition);
      yPosition += 10;

      // Line items table
      const lineItems = invLineItems;
      const tableData = [
        ['Service', 'Cost', 'GST', 'Total', 'Paid', 'Pending']
      ];

      lineItems.forEach(item => {
        tableData.push([
          item.serviceDescription || '',
          `₹${item.serviceCost?.toFixed(2) || '0.00'}`,
          `₹${item.gst?.toFixed(2) || '0.00'}`,
          `₹${item.totalAmount?.toFixed(2) || '0.00'}`,
          `₹${item.amountPaid?.toFixed(2) || '0.00'}`,
          `₹${Math.max(0, (item.totalAmount || 0) - (item.amountPaid || 0)).toFixed(2)}`
        ]);
      });

      doc.autoTable({
        startY: yPosition,
        head: [tableData[0]],
        body: tableData.slice(1),
        margin: margin,
        theme: 'grid',
        styles: { fontSize: 9 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Totals
      doc.setFontSize(10);
      doc.text(`Total Amount: ₹${invoice.header.totalAmount?.toFixed(2) || '0.00'}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Amount Paid: ₹${invTotalPaid.toFixed(2)}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Pending: ₹${Math.max(0, (invoice.header.totalAmount || 0) - invTotalPaid).toFixed(2)}`, margin, yPosition);

      const fileName = `Invoice_${invoice.header.invoiceNumber}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      console.log('✅ Invoice PDF downloaded:', fileName);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden">
        {/* Header with Tabs */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="flex items-center gap-3 mb-4">
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

          {/* Tabs */}
          <div className="flex gap-2 border-b-2 border-blue-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'appointments'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              📅 By Appointment
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('patient')}
              className={`px-4 py-3 font-semibold rounded-t-lg transition-all ${
                activeTab === 'patient'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              👤 By Patient
            </motion.button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'appointments' ? (
          <>
            {/* Filters for Appointments Tab */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">From Date:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">To Date:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
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
                          <div className="flex items-center justify-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleShowInvoices(appt.appointmentId)}
                              className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                              title="Expand to view invoices"
                            >
                              📂 Expand Invoices
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onPaymentClick(appt)}
                              className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                              title="Create New Invoice"
                            >
                              ➕ Create Invoice
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expandable Invoices Section */}
              <AnimatePresence>
                {expandedAppointmentId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 border-t-2 border-blue-300 pt-6"
                  >
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-teal-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                        <span>📋</span>
                        Invoices for Appointment #{expandedAppointmentId}
                      </h3>

                    </div>
                      {loadingInvoices[expandedAppointmentId] ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-300 border-t-teal-600"></div>
                        </div>
                      ) : invoicesByAppointment[expandedAppointmentId]?.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-teal-700 font-medium">No invoices created yet for this appointment.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Single-line Compact Invoice Cards */}
                          {invoicesByAppointment[expandedAppointmentId]?.map((invoice, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 ${(() => { const _p = (invoice.lineItems||[]).reduce((s,i)=>s+(i.amountPaid||0),0); const _s = _p===0?'Pending':_p>=(invoice.header?.totalAmount||0)?'Paid':'Partial'; return _s==='Paid'?'border-l-green-500 bg-gradient-to-r from-green-50/40 to-white':_s==='Partial'?'border-l-amber-500 bg-gradient-to-r from-amber-50/40 to-white':'border-l-red-500 bg-gradient-to-r from-red-50/40 to-white'; })()} border border-slate-100`}
                            >
                              <div className="px-5 py-3.5 flex items-center justify-between gap-5">
                                {/* Left Section: Invoice Identity */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  {/* Invoice # & Date as main identity */}
                                  <div className="flex-shrink-0">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">INV</p>
                                    <p className="text-base font-black text-slate-900">{invoice.header?.invoiceNumber || 'N/A'}</p>
                                  </div>

                                  {/* Divider */}
                                  <div className="h-10 border-r border-slate-200"></div>

                                  {/* Date with icon feel */}
                                  <div className="flex-shrink-0">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Bill Date</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {new Date(invoice.header?.billDate).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}
                                    </p>
                                  </div>

                                  {/* Status Badge with enhanced styling */}
                                  <div className="flex-shrink-0">
                                    <motion.span
                                      whileHover={{ scale: 1.05 }}
                                      className={`text-xs font-bold rounded-full px-3.5 py-1.5 inline-block border-2 transition-all ${(() => { const _p=(invoice.lineItems||[]).reduce((s,i)=>s+(i.amountPaid||0),0); const _s=_p===0?'Pending':_p>=(invoice.header?.totalAmount||0)?'Paid':'Partial'; return _s==='Paid'?'bg-green-500 text-white border-green-600 shadow-sm':_s==='Partial'?'bg-amber-500 text-white border-amber-600 shadow-sm':'bg-red-500 text-white border-red-600 shadow-sm'; })()}`}
                                    >
                                      {(() => { const _p=(invoice.lineItems||[]).reduce((s,i)=>s+(i.amountPaid||0),0); return _p===0?'Pending':_p>=(invoice.header?.totalAmount||0)?'Paid':'Partial'; })()}
                                    </motion.span>
                                  </div>
                                </div>

                                {/* Middle Section: Financial Summary (Compact Balanced Layout) */}
                                <div className="flex items-center gap-5 flex-shrink-0">
                                  {/* Financial Summary as key metrics */}
                                  <div className="flex items-center gap-4 px-3 py-2 bg-white/60 rounded-lg backdrop-blur-sm border border-slate-100">
                                    {/* Total */}
                                    <div className="text-center min-w-fit">
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total</p>
                                      <p className="text-sm font-black text-blue-700">₹{(invoice.header?.totalAmount || 0).toFixed(0)}</p>
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="h-9 border-r border-slate-200"></div>
                                    
                                    {/* Paid */}
                                    <div className="text-center min-w-fit">
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Paid</p>
                                      <p className="text-sm font-black text-green-600">₹{(invoice.lineItems||[]).reduce((s,i)=>s+(i.amountPaid||0),0).toFixed(0)}</p>
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="h-9 border-r border-slate-200"></div>
                                    
                                    {/* Pending */}
                                    <div className="text-center min-w-fit">
                                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Due</p>
                                      <p className="text-sm font-black text-red-600">₹{Math.max(0,(invoice.header?.totalAmount||0)-(invoice.lineItems||[]).reduce((s,i)=>s+(i.amountPaid||0),0)).toFixed(0)}</p>
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  <div className="h-12 border-r border-slate-200"></div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        try {
                                          console.log("📋 View Invoice clicked:", invoice);
                                          const appointmentData = billingAppointments.find(a => a.appointmentId === expandedAppointmentId);
                                          const invNumber = invoice?.header?.invoiceNumber;
                                          
                                          if (!appointmentData || !invNumber) {
                                            console.error("❌ Missing data");
                                            return;
                                          }
                                          
                                          onPaymentClick({ 
                                            ...appointmentData, 
                                            invoiceNumber: invNumber,
                                            mode: "view"
                                          });
                                        } catch (error) {
                                          console.error("❌ Error in View button:", error);
                                        }
                                      }}
                                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-xs transition-all whitespace-nowrap"
                                      title="View Full Invoice"
                                    >
                                      <Eye size={14} />
                                      View
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => downloadInvoicePDF(invoice)}
                                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold text-xs transition-all whitespace-nowrap"
                                      title="Download PDF"
                                    >
                                      <Download size={14} />
                                      PDF
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Collapse button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setExpandedAppointmentId(null)}
                        className="mt-4 w-full px-4 py-3 border-2 border-teal-400 bg-teal-50 text-teal-700 rounded-lg font-semibold hover:bg-teal-100 transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronDown size={20} className="rotate-180" />
                        Collapse Invoices
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <p className="text-xs font-bold text-cyan-700 uppercase mb-1">Date Range</p>
                  <p className="text-sm font-bold text-cyan-900">
                    {new Date(fromDate).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric'
                    })} - {new Date(toDate).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </motion.div>
              </div>
            </div>
          )}
            </div>
          </>
        ) : (
          <>
            {/* Patient Search Tab */}
            <div className="p-6">
              {/* Search Form */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 mb-6">
                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <span>🔍</span>
                  Search Patient
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Patient ID:</label>
                    <input
                      type="text"
                      value={patientSearchId}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setPatientSearchId(value);
                      }}
                      placeholder="Enter Patient ID (numbers only)"
                      className="w-full px-3 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Phone Number:</label>
                    <input
                      type="text"
                      value={patientSearchPhone}
                      onChange={(e) => {
                        // Only allow numbers and limit to 10 digits
                        const value = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                        setPatientSearchPhone(value);
                        // Clear error when user starts typing
                        if (mobileNumberError) {
                          setMobileNumberError("");
                        }
                      }}
                      placeholder="Enter Mobile Number (exactly 10 digits)"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium text-slate-700 bg-white ${
                        mobileNumberError ? "border-red-500 focus:ring-red-400" : "border-purple-300"
                      }`}
                      inputMode="numeric"
                      maxLength="10"
                    />
                    {mobileNumberError && (
                      <p className="text-sm text-red-600 mt-1">{mobileNumberError}</p>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={searchPatient}
                    disabled={loadingPatientSearch || (!patientSearchId && !patientSearchPhone)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🔎</span>
                    <span>{loadingPatientSearch ? 'Searching...' : 'Search'}</span>
                  </motion.button>
                </div>
              </div>

              {/* Patient Search Error */}
              <AnimatePresence>
                {patientSearchError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 px-4 py-4 bg-red-50 border-2 border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <p className="text-red-800 font-medium">{patientSearchError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Patient Details Display - Compact Tile */}
              {searchedPatient && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <motion.div
                    whileHover={{ scale: 1.01, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)" }}
                    className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-200 shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                          {searchedPatient.patientFirstName?.charAt(0)}{searchedPatient.patientLastName?.charAt(0)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-emerald-900 truncate">
                            {searchedPatient.patientFirstName} {searchedPatient.patientLastName}
                          </h3>
                          <p className="text-sm text-emerald-700 font-semibold">ID: #{searchedPatient.patientId}</p>
                          <div className="flex gap-4 mt-1 text-xs text-slate-600">
                            <span title="Phone">📞 {searchedPatient.patientPhoneNumber || 'N/A'}</span>
                            <span title="Email" className="truncate">📧 {searchedPatient.patientEmail || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleTogglePatientAppointments}
                          disabled={loadingPatientSearch}
                          className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap text-sm ${
                            showPatientAppointments
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg disabled:opacity-50'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50'
                          }`}
                        >
                          {loadingPatientSearch ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <span>{showPatientAppointments ? '🔻' : '📋'}</span>
                          )}
                          {loadingPatientSearch ? 'Loading...' : (showPatientAppointments ? 'Hide Appointments' : 'Show Appointments')}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onPaymentClick({ 
                            patientId: searchedPatient.patientId, 
                            firstName: searchedPatient.patientFirstName, 
                            lastName: searchedPatient.patientLastName, 
                            mode: 'without-appointment' 
                          })}
                          className="px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center gap-1 flex-shrink-0 whitespace-nowrap text-sm"
                        >
                          <span>➕</span>
                          Invoice
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Patient Appointments List - Collapsible Table View */}
              <AnimatePresence>
                {showPatientAppointments && searchedPatient && patientAppointments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200"
                    >
                      <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <span>📅</span>
                        Appointments for {searchedPatient.patientFirstName} ({patientAppointments.length})
                      </h3>

                      {/* Appointments Table */}
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-300">
                              <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Time</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">Doctor</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientAppointments.map((appt, idx) => (
                              <motion.tr
                                key={appt.appointmentId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b border-slate-200 hover:bg-blue-50/50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <span className="font-bold text-slate-700">#{appt.appointmentId}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-slate-700">
                                    {new Date(appt.appointmentDate).toLocaleDateString('en-US', { 
                                      month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-xs text-slate-500">{appt.startTime?.substring(0, 5) || 'N/A'}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm font-medium text-slate-700">{appt.appointmentType || 'Consultation'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm font-medium text-slate-700">{appt.doctorName || 'N/A'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleShowInvoices(appt.appointmentId)}
                                      className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                                      title="View Invoices"
                                    >
                                      📂 Invoices
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => onPaymentClick(appt)}
                                      className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                                      title="Create New Invoice"
                                    >
                                      ➕ Create
                                    </motion.button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Expandable Invoices Section */}
                      <AnimatePresence>
                        {expandedAppointmentId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t-2 border-blue-300 pt-4"
                          >
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-teal-200">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                                  <span>📋</span>
                                  Invoices for Appointment #{expandedAppointmentId}
                                </h3>
                              </div>
                              {loadingInvoices[expandedAppointmentId] ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-300 border-t-teal-600"></div>
                                </div>
                              ) : invoicesByAppointment[expandedAppointmentId]?.length === 0 ? (
                                <div className="py-8 text-center">
                                  <p className="text-teal-700 font-medium">No invoices created yet for this appointment.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {invoicesByAppointment[expandedAppointmentId]?.map((invoice, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className={`rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 ${(() => { const _p=(invoice.lineItems||[]).reduce((s,i)=>s+(i.amountPaid||0),0); const _s=_p===0?'Pending':_p>=(invoice.header?.totalAmount||0)?'Paid':'Partial'; return _s==='Paid'?'border-l-green-500 bg-gradient-to-r from-green-50/40 to-white':_s==='Partial'?'border-l-amber-500 bg-gradient-to-r from-amber-50/40 to-white':'border-l-red-500 bg-gradient-to-r from-red-50/40 to-white'; })()} border border-slate-100`}
                                    >
                                      <div className="px-5 py-3.5 flex items-center justify-between gap-5">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                          <div className="flex-shrink-0">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">INV</p>
                                            <p className="text-base font-black text-slate-900">{invoice.header?.invoiceNumber || 'N/A'}</p>
                                          </div>
                                          <div className="h-10 border-r border-slate-200"></div>
                                          <div className="flex-shrink-0">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</p>
                                            <p className="text-sm font-bold text-slate-800">
                                              {invoice.header?.billDate ? new Date(invoice.header.billDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</p>
                                          <p className="text-xl font-black text-slate-900">₹{invoice.header?.totalAmount?.toFixed(2) || '0.00'}</p>
                                        </div>
                                      </div>
                                      {/* Invoice Actions */}
                                      <div className="px-5 py-3 bg-white border-t border-slate-100 flex gap-2">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            const appt = patientAppointments.find(a => a.appointmentId === expandedAppointmentId);
                                            onPaymentClick({ 
                                              ...appt, 
                                              invoiceNumber: invoice.header?.invoiceNumber,
                                              mode: "view"
                                            });
                                          }}
                                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-xs transition-all"
                                          title="View Full Invoice"
                                        >
                                          <Eye size={14} />
                                          View
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => downloadInvoicePDF(invoice)}
                                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold text-xs transition-all"
                                          title="Download PDF"
                                        >
                                          <Download size={14} />
                                          PDF
                                        </motion.button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Collapse Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowPatientAppointments(false)}
                        className="mt-4 w-full px-4 py-3 border-2 border-blue-400 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronDown size={20} className="rotate-180" />
                        Hide Appointments
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {searchedPatient && patientAppointments.length === 0 && (
                <div className="py-12 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Appointments Found</h3>
                  <p className="text-slate-500">This patient has no appointments on record.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
