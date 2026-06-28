import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointmentsByFilters, getAppointmentById } from '../services/appointmentService';
import { searchPatients } from '../services/patientService';
import { getClinicIdFromToken } from '../services/tokenManager';
import { request } from '../services/apiClient';
import { Download, Mail, Eye, ChevronDown, Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function ServiceBillingManagement({ onPaymentClick, refreshTrigger }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterPatientId, setFilterPatientId] = useState('');
  const [filterMobile, setFilterMobile] = useState('');
  const [dateValidationError, setDateValidationError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [billingAppointments, setBillingAppointments] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);
  const [invoicesByAppointment, setInvoicesByAppointment] = useState({});
  const [loadingInvoices, setLoadingInvoices] = useState({});
  const carouselRef = useRef(null);

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
  const [patientMatches, setPatientMatches] = useState([]);


  const handleFromDateChange = (val) => {
    setFromDate(val);
    setDateValidationError('');
    if (!val) { setToDate(''); return; }
    if (toDate && val > toDate) { setToDate(''); }
  };

  const handleToDateChange = (val) => {
    setDateValidationError('');
    if (fromDate && val && val < fromDate) {
      setDateValidationError('To Date cannot be earlier than From Date.');
      return;
    }
    setToDate(val);
  };

  // Load service billing appointments
  const loadBillingAppointments = useCallback(async () => {
    const clinicId = getClinicIdFromToken();
    if (!clinicId) {
      setErrorMessage('Unable to determine clinic. Please login again.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const effectiveToDate = fromDate && !toDate ? todayStr : toDate;
    if (fromDate && effectiveToDate && fromDate > effectiveToDate) {
      setDateValidationError('From Date cannot be greater than To Date.');
      return;
    }
    setErrorMessage('');
    setDateValidationError('');
    setLoadingBilling(true);
    setHasSearched(true);
    try {
      const params = {
        clinicId: clinicId.toString(),
        ...(fromDate && { fromDate }),
        ...(effectiveToDate && { toDate: effectiveToDate }),
        ...(filterPatientId.trim() && { patientId: parseInt(filterPatientId.trim()) }),
        ...(filterMobile.trim() && { mobilenumber: filterMobile.trim() }),
      };
      console.log('🏥 Searching service billing appointments with params:', params);
      const data = await getAppointmentsByFilters(params);
      if (!data || data.length === 0) {
        setErrorMessage('No appointments found for the selected filters.');
        setBillingAppointments([]);
      } else {
        setBillingAppointments(data);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Failed to load service billing appointments:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setBillingAppointments([]);
    } finally {
      setLoadingBilling(false);
    }
  }, [fromDate, toDate, filterPatientId, filterMobile]);


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
    setPatientMatches([]);
    setShowPatientAppointments(false);
    setExpandedAppointmentId(null);

    try {
      const params = {
        patientId: patientSearchId ? parseInt(patientSearchId) : undefined,
        mobilenumber: patientSearchPhone || undefined
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      console.log('🔍 Searching patient with params:', params);
      const results = await searchPatients(params);

      if (results && results.length > 1) {
        // Multiple patients match — show selection dropdown
        setPatientMatches(results);
      } else if (results && results.length === 1) {
        const patient = results[0];
        console.log('✅ Patient found:', patient);
        setSearchedPatient(patient);

        if (patient.patientId) {
          try {
            const clinicIdFromToken = getClinicIdFromToken();
            const appointmentsResponse = await getAppointmentById({
              clinicId: clinicIdFromToken ? parseInt(clinicIdFromToken) : undefined,
              patientId: patient.patientId,
              mobilenumber: patientSearchPhone || undefined
            });

            console.log('✅ Patient appointments:', appointmentsResponse);
            const appts = Array.isArray(appointmentsResponse)
              ? appointmentsResponse
              : (appointmentsResponse && (appointmentsResponse.appointmentId || appointmentsResponse.AppointmentId)
                  ? [appointmentsResponse]
                  : []);
            setPatientAppointments(appts);
            setShowPatientAppointments(true);
          } catch (apptError) {
            console.error('Error fetching appointments:', apptError);
            setPatientAppointments([]);
            setShowPatientAppointments(true);
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
    if (!appointmentId) {
      console.warn("⚠️ loadInvoicesForAppointment called with no appointmentId");
      return;
    }
    setLoadingInvoices(prev => ({ ...prev, [appointmentId]: true }));
    try {
      console.log(`📦 Loading invoices for appointment ${appointmentId}...`);
      const response = await request(`/Services/GetInvoicesByAppointmentComplete?appointmentId=${appointmentId}`, {
        method: "GET"
      });

      // API may return array of invoices OR a single invoice object — handle both
      let invoices = [];
      if (response) {
        if (Array.isArray(response)) {
          invoices = response;
        } else if (response.header) {
          // Single ServiceInvoiceComplete object returned
          invoices = [response];
        }
      }

      console.log(`✅ Found ${invoices.length} invoice(s) for appointment ${appointmentId}`);
      setInvoicesByAppointment(prev => ({ ...prev, [appointmentId]: invoices }));
    } catch (error) {
      console.error(`Failed to load invoices for appointment ${appointmentId}:`, error);
      setInvoicesByAppointment(prev => ({ ...prev, [appointmentId]: [] }));
    } finally {
      setLoadingInvoices(prev => ({ ...prev, [appointmentId]: false }));
    }
  }, []);

  // Refresh billing appointments and preserve the currently expanded appointment's invoice cache
  useEffect(() => {
    if (refreshTrigger === 0) return;
    console.log("🔄 Refresh triggered - preserving current invoice cache if expanded");
    const preservedExpandedAppointmentId = expandedAppointmentId;
    setInvoicesByAppointment((prev) => {
      if (!preservedExpandedAppointmentId || !prev[preservedExpandedAppointmentId]) {
        return {};
      }
      return { [preservedExpandedAppointmentId]: prev[preservedExpandedAppointmentId] };
    });

    if (hasSearched) {
      loadBillingAppointments();
    }
    if (preservedExpandedAppointmentId) {
      loadInvoicesForAppointment(preservedExpandedAppointmentId);
    }
  }, [refreshTrigger, expandedAppointmentId, hasSearched, loadBillingAppointments, loadInvoicesForAppointment]);

  // Handle showing invoices for an appointment
  const handleShowInvoices = useCallback((appointmentId) => {
    // Normalise field name — backend may return AppointmentId (PascalCase) or appointmentId
    const id = appointmentId;
    if (!id) {
      console.warn("⚠️ handleShowInvoices: appointmentId is undefined");
      return;
    }
    if (expandedAppointmentId === id) {
      setExpandedAppointmentId(null);
    } else {
      setExpandedAppointmentId(id);
      if (!invoicesByAppointment[id]) {
        loadInvoicesForAppointment(id);
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
          const appts = Array.isArray(appointmentsResponse)
            ? appointmentsResponse
            : (appointmentsResponse && (appointmentsResponse.appointmentId || appointmentsResponse.AppointmentId)
                ? [appointmentsResponse]
                : []);
          setPatientAppointments(appts);
          setShowPatientAppointments(true);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setPatientAppointments([]);
          setShowPatientAppointments(true);
        } finally {
          setLoadingPatientSearch(false);
        }
      }
    }
  }, [showPatientAppointments, searchedPatient, patientSearchPhone]);

  // Handle patient selection when multiple matches found
  const handleSelectPatient = useCallback(async (patient) => {
    setPatientMatches([]);
    setSearchedPatient(patient);
    setPatientAppointments([]);
    setPatientSearchError('');
    setShowPatientAppointments(false);
    setExpandedAppointmentId(null);

    if (patient.patientId) {
      setLoadingPatientSearch(true);
      try {
        const clinicIdFromToken = getClinicIdFromToken();
        const appointmentsResponse = await getAppointmentById({
          clinicId: clinicIdFromToken ? parseInt(clinicIdFromToken) : undefined,
          patientId: patient.patientId,
          mobilenumber: patientSearchPhone || undefined
        });
        const appts = Array.isArray(appointmentsResponse)
          ? appointmentsResponse
          : (appointmentsResponse && (appointmentsResponse.appointmentId || appointmentsResponse.AppointmentId)
              ? [appointmentsResponse]
              : []);
        setPatientAppointments(appts);
        setShowPatientAppointments(true);
      } catch {
        setPatientAppointments([]);
        setShowPatientAppointments(true);
      } finally {
        setLoadingPatientSearch(false);
      }
    }
  }, [patientSearchPhone]);

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
      const invTotalPaid = invLineItems.reduce((s, i) => s + (i.amountPaid ?? i.AmountPaid ?? 0), 0);
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
          `₹${(item.amountPaid ?? item.AmountPaid ?? 0).toFixed(2)}`,
          `₹${Math.max(0, (item.totalAmount ?? item.TotalAmount ?? 0) - (item.amountPaid ?? item.AmountPaid ?? 0)).toFixed(2)}`
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                {/* Patient ID */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Patient ID</label>
                  <input
                    type="number"
                    value={filterPatientId}
                    onChange={(e) => setFilterPatientId(e.target.value)}
                    placeholder="e.g. 1042"
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                  />
                </div>
                {/* Mobile */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Mobile Number</label>
                  <input
                    type="text"
                    value={filterMobile}
                    onChange={(e) => setFilterMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                  />
                </div>
                {/* From Date */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">From Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => handleFromDateChange(e.target.value)}
                      className="w-full px-3 py-2.5 pr-8 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white"
                    />
                    {fromDate && (
                      <button type="button"
                        onClick={() => { setFromDate(''); setToDate(''); setDateValidationError(''); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors text-lg leading-none"
                      >×</button>
                    )}
                  </div>
                </div>
                {/* To Date */}
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${fromDate ? 'text-slate-700' : 'text-slate-400'}`}>
                    To Date
                    {fromDate && !toDate && <span className="ml-1 text-xs font-normal text-blue-500">(defaults to today)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      disabled={!fromDate}
                      onChange={(e) => handleToDateChange(e.target.value)}
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium text-slate-700 bg-white ${
                        !fromDate ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : dateValidationError ? 'border-red-400' : 'border-blue-300'
                      }`}
                    />
                    {toDate && (
                      <button type="button"
                        onClick={() => { setToDate(''); setDateValidationError(''); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors text-lg leading-none"
                      >×</button>
                    )}
                  </div>
                  {dateValidationError && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{dateValidationError}</p>
                  )}
                </div>
                {/* Search Button */}
                <div>
                  <label className="text-sm font-semibold text-transparent mb-2 block select-none">.</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadBillingAppointments}
                    disabled={loadingBilling || !!dateValidationError}
                    className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🔍</span>
                    <span>{loadingBilling ? 'Searching...' : 'Search'}</span>
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
          ) : !hasSearched ? (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Search to Load Appointments</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Use the filters above — by patient ID, mobile number, or date range — then click <strong>Search</strong>.</p>
            </div>
          ) : billingAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-stone-700 mb-2">No Appointments Found</h3>
              <p className="text-stone-500">Try adjusting your filters and search again.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Appointments Table with inline invoice expansion */}
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
                    {billingAppointments.map((appt, idx) => {
                      const apptId = appt.appointmentId || appt.AppointmentId;
                      const isExpanded = expandedAppointmentId === apptId;
                      return (
                        <React.Fragment key={apptId || idx}>
                          <motion.tr
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`border-b transition-colors ${isExpanded ? 'bg-indigo-50 border-indigo-300' : 'border-stone-200 hover:bg-blue-50/50'}`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-bold text-stone-700">#{apptId}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {appt.firstName?.charAt(0)}{appt.lastName?.charAt(0)}
                                </div>
                                <p className="font-semibold text-stone-800 text-sm">{appt.firstName} {appt.lastName}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-stone-700">
                                {new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleShowInvoices(apptId)}
                                  className={`px-3 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${
                                    isExpanded
                                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                                  }`}
                                >
                                  {isExpanded ? '▲ Collapse' : '📂 Invoices'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => onPaymentClick(appt)}
                                  className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                                >
                                  ➕ Create
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.tr
                                key={`inv-${apptId}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <td colSpan={7} className="p-0">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                                      {/* Panel header */}
                                      <div className="px-6 py-3 flex items-center justify-between border-b border-slate-700">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                                            <FileText size={16} className="text-teal-300" />
                                          </div>
                                          <div>
                                            <p className="text-white font-black text-sm">Invoices · Appt #{apptId}</p>
                                            <p className="text-slate-400 text-xs">
                                              {loadingInvoices[apptId]
                                                ? 'Loading...'
                                                : `${invoicesByAppointment[apptId]?.length || 0} invoice${(invoicesByAppointment[apptId]?.length || 0) !== 1 ? 's' : ''}`}
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => setExpandedAppointmentId(null)}
                                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all text-sm"
                                        >✕</button>
                                      </div>
                                      {/* Panel body */}
                                      <div className="px-6 py-4">
                                        {loadingInvoices[apptId] ? (
                                          <div className="flex items-center justify-center py-8 gap-3">
                                            <div className="animate-spin rounded-full h-7 w-7 border-4 border-teal-700 border-t-teal-400"></div>
                                            <p className="text-slate-400 text-sm">Fetching invoices...</p>
                                          </div>
                                        ) : !invoicesByAppointment[apptId]?.length ? (
                                          <div className="py-8 text-center">
                                            <div className="text-4xl mb-2">🧾</div>
                                            <p className="text-slate-400 font-semibold text-sm">No invoices yet for this appointment.</p>
                                          </div>
                                        ) : (
                                          <div className="relative">
                                            <button
                                              onClick={() => carouselRef.current?.scrollBy({ left: -316, behavior: 'smooth' })}
                                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/10"
                                            ><ChevronLeft size={16} /></button>
                                            <div
                                              ref={carouselRef}
                                              className="flex gap-4 overflow-x-auto px-10 pb-2"
                                              style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
                                            >
                                              {invoicesByAppointment[apptId].map((invoice, iIdx) => {
                                                const total = invoice.header?.totalAmount ?? invoice.header?.TotalAmount ?? 0;
                                                return (
                                                  <motion.div
                                                    key={iIdx}
                                                    initial={{ opacity: 0, scale: 0.92 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: iIdx * 0.06 }}
                                                    className="flex-shrink-0 w-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden"
                                                    style={{ scrollSnapAlign: 'start' }}
                                                  >
                                                    <div className="h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
                                                    <div className="p-4">
                                                      <div className="flex justify-between mb-3">
                                                        <div>
                                                          <p className="text-xs text-slate-500 uppercase tracking-widest">Invoice</p>
                                                          <p className="text-base font-black text-white">{invoice.header?.invoiceNumber || '—'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                          <p className="text-xs text-slate-500 uppercase tracking-widest">Bill Date</p>
                                                          <p className="text-xs font-bold text-teal-400">
                                                            {new Date(invoice.header?.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-3">
                                                        <p className="text-xs text-emerald-400 uppercase tracking-widest mb-0.5">Amount Paid</p>
                                                        <p className="text-xl font-black text-emerald-400">₹{total.toLocaleString('en-IN')}</p>
                                                      </div>
                                                      <div className="flex items-center justify-between mb-3 text-xs">
                                                        <span className="text-slate-500 truncate max-w-[55%]">
                                                          {invoice.header?.doctorName ? `Dr. ${invoice.header.doctorName}` : ''}
                                                        </span>
                                                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                                                          {invoice.header?.modeOfPayment || 'Cash'}
                                                        </span>
                                                      </div>
                                                      <div className="flex gap-2">
                                                        <motion.button
                                                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                          onClick={() => onPaymentClick({ ...appt, invoiceNumber: invoice.header?.invoiceNumber, mode: 'view' })}
                                                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                                                        ><Eye size={12} /> View</motion.button>
                                                        <motion.button
                                                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                          onClick={() => downloadInvoicePDF(invoice)}
                                                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                                                        ><Download size={12} /> PDF</motion.button>
                                                      </div>
                                                    </div>
                                                  </motion.div>
                                                );
                                              })}
                                            </div>
                                            <button
                                              onClick={() => carouselRef.current?.scrollBy({ left: 316, behavior: 'smooth' })}
                                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/10"
                                            ><ChevronRight size={16} /></button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                    {fromDate
                      ? `${new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${toDate ? new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}`
                      : 'All dates'}
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

                {/* Multiple Patient Matches — visible list inside search form */}
                {patientMatches.length > 1 && (
                  <div className="mt-4 border-t border-purple-200 pt-4">
                    <p className="text-sm font-bold text-purple-700 mb-3">
                      👥 {patientMatches.length} patients found for this number — select one:
                    </p>
                    <div className="flex flex-col gap-2">
                      {patientMatches.map((p) => (
                        <motion.button
                          key={p.patientId}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectPatient(p)}
                          disabled={loadingPatientSearch}
                          className="flex items-center justify-between px-4 py-3 bg-white border border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-lg transition-all text-left disabled:opacity-50 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                              {p.patientFirstName?.charAt(0)}{p.patientLastName?.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800">{p.patientFirstName} {p.patientLastName}</span>
                          </div>
                          <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full">
                            ID: {p.patientId}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
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

              {/* Guide placeholder — shown before any search */}
              {!searchedPatient && patientMatches.length === 0 && !patientSearchError && (
                <div className="py-14 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-purple-700 mb-2">Find a Patient</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-6">Enter the patient's ID or mobile number above and click <strong>Search</strong> to pull up their profile and billing history.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-slate-400">
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                      <span>🆔</span> Search by Patient ID
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                      <span>📱</span> Search by 10-digit mobile
                    </div>
                  </div>
                </div>
              )}

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
                          className="px-4 py-2 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50"
                        >
                          {loadingPatientSearch ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <span>{showPatientAppointments ? '🔄' : '📋'}</span>
                          )}
                          {loadingPatientSearch ? 'Loading...' : 'Refresh Appointments'}
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
                {showPatientAppointments && searchedPatient && (
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
                        Appointments for {searchedPatient.patientFirstName}
                        {patientAppointments.length > 0 && <span className="text-lg font-normal text-blue-500">({patientAppointments.length})</span>}
                      </h3>

                      {patientAppointments.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="text-5xl mb-3">📭</div>
                          <p className="text-lg font-bold text-slate-600 mb-1">No Appointments Found</p>
                          <p className="text-sm text-slate-400">This patient has no appointments on record.</p>
                        </div>
                      ) : null}

                      {/* Appointments Table with inline invoice expansion */}
                      {patientAppointments.length > 0 && (
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
                              {patientAppointments.map((appt, idx) => {
                                const apptId = appt.appointmentId || appt.AppointmentId || appt.id || appt.Id;
                                const isExpanded = expandedAppointmentId === apptId;
                                return (
                                  <React.Fragment key={apptId || idx}>
                                    <motion.tr
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className={`border-b transition-colors ${isExpanded ? 'bg-indigo-50 border-indigo-300' : 'border-slate-200 hover:bg-blue-50'}`}
                                    >
                                      <td className="px-4 py-3">
                                        <span className={`font-bold ${isExpanded ? 'text-indigo-700' : 'text-slate-700'}`}>#{apptId}</span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="text-sm text-slate-700">
                                          {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </p>
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="text-xs text-slate-500">{appt.startTime?.substring(0, 5) || 'N/A'}</p>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-slate-700">{appt.appointmentType || 'Consultation'}</span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-slate-700">{appt.doctorName || appt.DoctorName || 'N/A'}</span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleShowInvoices(apptId)}
                                            className={`px-3 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${
                                              isExpanded
                                                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                                            }`}
                                          >
                                            {isExpanded ? '▲ Collapse' : '📂 Invoices'}
                                          </motion.button>
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => { e.stopPropagation(); onPaymentClick(appt); }}
                                            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all"
                                          >
                                            ➕ Create
                                          </motion.button>
                                        </div>
                                      </td>
                                    </motion.tr>
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.tr
                                          key={`inv-${apptId}`}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <td colSpan={6} className="p-0">
                                            <motion.div
                                              initial={{ height: 0 }}
                                              animate={{ height: 'auto' }}
                                              exit={{ height: 0 }}
                                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                                              style={{ overflow: 'hidden' }}
                                            >
                                              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                                                <div className="px-6 py-3 flex items-center justify-between border-b border-slate-700">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                                                      <FileText size={16} className="text-teal-300" />
                                                    </div>
                                                    <div>
                                                      <p className="text-white font-black text-sm">Invoices · Appt #{apptId}</p>
                                                      <p className="text-slate-400 text-xs">
                                                        {loadingInvoices[apptId]
                                                          ? 'Loading...'
                                                          : `${invoicesByAppointment[apptId]?.length || 0} invoice${(invoicesByAppointment[apptId]?.length || 0) !== 1 ? 's' : ''}`}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <button
                                                    onClick={() => setExpandedAppointmentId(null)}
                                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all text-sm"
                                                  >✕</button>
                                                </div>
                                                <div className="px-6 py-4">
                                                  {loadingInvoices[apptId] ? (
                                                    <div className="flex items-center justify-center py-8 gap-3">
                                                      <div className="animate-spin rounded-full h-7 w-7 border-4 border-teal-700 border-t-teal-400"></div>
                                                      <p className="text-slate-400 text-sm">Fetching invoices...</p>
                                                    </div>
                                                  ) : !invoicesByAppointment[apptId]?.length ? (
                                                    <div className="py-8 text-center">
                                                      <div className="text-4xl mb-2">🧾</div>
                                                      <p className="text-slate-400 font-semibold text-sm">No invoices yet for this appointment.</p>
                                                    </div>
                                                  ) : (
                                                    <div className="relative">
                                                      <button
                                                        onClick={() => carouselRef.current?.scrollBy({ left: -316, behavior: 'smooth' })}
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/10"
                                                      ><ChevronLeft size={16} /></button>
                                                      <div
                                                        ref={carouselRef}
                                                        className="flex gap-4 overflow-x-auto px-10 pb-2"
                                                        style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
                                                      >
                                                        {invoicesByAppointment[apptId].map((invoice, iIdx) => {
                                                          const total = invoice.header?.totalAmount ?? invoice.header?.TotalAmount ?? 0;
                                                          return (
                                                            <motion.div
                                                              key={iIdx}
                                                              initial={{ opacity: 0, scale: 0.92 }}
                                                              animate={{ opacity: 1, scale: 1 }}
                                                              transition={{ delay: iIdx * 0.06 }}
                                                              className="flex-shrink-0 w-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden"
                                                              style={{ scrollSnapAlign: 'start' }}
                                                            >
                                                              <div className="h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
                                                              <div className="p-4">
                                                                <div className="flex justify-between mb-3">
                                                                  <div>
                                                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Invoice</p>
                                                                    <p className="text-base font-black text-white">{invoice.header?.invoiceNumber || '—'}</p>
                                                                  </div>
                                                                  <div className="text-right">
                                                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Bill Date</p>
                                                                    <p className="text-xs font-bold text-teal-400">
                                                                      {new Date(invoice.header?.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                  </div>
                                                                </div>
                                                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-3">
                                                                  <p className="text-xs text-emerald-400 uppercase tracking-widest mb-0.5">Amount Paid</p>
                                                                  <p className="text-xl font-black text-emerald-400">₹{total.toLocaleString('en-IN')}</p>
                                                                </div>
                                                                <div className="flex items-center justify-between mb-3 text-xs">
                                                                  <span className="text-slate-500 truncate max-w-[55%]">
                                                                    {invoice.header?.doctorName ? `Dr. ${invoice.header.doctorName}` : ''}
                                                                  </span>
                                                                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                                                                    {invoice.header?.modeOfPayment || 'Cash'}
                                                                  </span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                  <motion.button
                                                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => onPaymentClick({ ...appt, invoiceNumber: invoice.header?.invoiceNumber, mode: 'view' })}
                                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                                                                  ><Eye size={12} /> View</motion.button>
                                                                  <motion.button
                                                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                                    onClick={() => downloadInvoicePDF(invoice)}
                                                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                                                                  ><Download size={12} /> PDF</motion.button>
                                                                </div>
                                                              </div>
                                                            </motion.div>
                                                          );
                                                        })}
                                                      </div>
                                                      <button
                                                        onClick={() => carouselRef.current?.scrollBy({ left: 316, behavior: 'smooth' })}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/10"
                                                      ><ChevronRight size={16} /></button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </motion.div>
                                          </td>
                                        </motion.tr>
                                      )}
                                    </AnimatePresence>
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </>
        )}
      </div>
    </>
  );
}
