import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCalendarAppointments, getAppointmentsByDoctorID, getAppointmentsByFilters, getAppointmentsByClinicAndDate, createPrescription, getPrescriptionsByAppointment, updateAppointment, addPrescription, updatePrescriptionData, getPrescriptionById, addPatientVisit, getAppointment } from "../services/appointmentService";
import { visitService, prescriptionService } from "../services/visitService";
import { createInventoryMaster, listInventoryMasters, getClinicInventoryByClinicId, createClinicInventory, updateClinicInventory, deleteClinicInventory, addInventoryMasterItemsBulk } from "../services/inventoryService";
import { getClinic, getClinicByClinicId } from "../services/clinicService";
import { getStaffProfileByClinicId } from "../services/staffService";
import { getDoctorsByClinicId } from "../services/doctorService";
import { sendPrescriptionEmail } from "../services/emailService";
import PrescriptionWritingModal from "../components/PrescriptionWritingModal";
import PrescriptionPrint from "../components/PrescriptionPrint";
import VisitInfoModalExternal from "../components/VisitInfoModal";
import InventoryAutoComplete from "../components/InventoryAutoComplete";
import AddToMasterInventoryModal from "../components/AddToMasterInventoryModal";
import SuccessModal from "../components/SuccessModal";
import ScheduleAppointmentsModal from "../components/ScheduleAppointmentsModal";
import PatientHistory from "../components/PatientHistory";
import Assets from "./Assets";
import DoctorSchedule from "./DoctorSchedule";
import { getPatientFullProfile, getPatientVisit, editPatientVisit, getPatientsByClinic, getPatientMedicalInfoSummary } from "../services/patientService";
import { getAccessToken } from "../services/tokenManager";

// Sample data
const SAMPLE_CLINIC_DETAILS = {
  clinicName: "Dentaesthetics Mumbai Central",
  address: "Shop 12, Andheri West, Near Metro Station, Mumbai, MH 400053",
  phone: "+91 98765 43210",
  email: "contact@dentaestheticsmumbai.com",
  operatingHours: "Mon-Fri 9:00 AM - 6:00 PM",
  totalStaff: 12,
  activeDoctors: 4,
  chairsAvailable: 8,
  todayAppointments: 12,
  pendingPayments: 3
};

const SAMPLE_PATIENTS = [
  { id: 1, name: "Priya Sharma", status: "Active", lastVisit: "2025-11-10", nextAppt: "2025-11-20", balance: 0 },
  { id: 2, name: "Arjun Patel", status: "Active", lastVisit: "2025-11-08", nextAppt: "2025-11-22", balance: 20750 },
  { id: 3, name: "Anjali Reddy", status: "Active", lastVisit: "2025-11-05", nextAppt: "2025-11-25", balance: 0 },
  { id: 4, name: "Vikram Singh", status: "Pending", lastVisit: "2025-10-28", nextAppt: "2025-12-01", balance: 41500 },
  { id: 5, name: "Kavya Menon", status: "Active", lastVisit: "2025-11-12", nextAppt: "2025-11-18", balance: 12450 }
];

const SAMPLE_PAYMENTS = [
  { id: 1, patient: "Priya Sharma", amount: 29050, status: "Paid", date: "2025-11-10", method: "Insurance" },
  { id: 2, patient: "Arjun Patel", amount: 20750, status: "Pending", date: "2025-11-08", method: "Credit Card" },
  { id: 3, patient: "Anjali Reddy", amount: 37350, status: "Paid", date: "2025-11-05", method: "Cash" },
  { id: 4, patient: "Vikram Singh", amount: 41500, status: "Overdue", date: "2025-10-28", method: "Insurance" },
  { id: 5, patient: "Kavya Menon", amount: 12450, status: "Pending", date: "2025-11-12", method: "UPI" }
];

const SAMPLE_APPOINTMENTS = [
  { id: 1, patient: "Priya Sharma", date: "2025-11-20", time: "10:00 AM", type: "Cleaning", status: "Confirmed" },
  { id: 2, patient: "Arjun Patel", date: "2025-11-22", time: "2:00 PM", type: "Root Canal", status: "Confirmed" },
  { id: 3, patient: "Anjali Reddy", date: "2025-11-25", time: "11:00 AM", type: "Filling", status: "Confirmed" },
  { id: 4, patient: "Rahul Verma", date: "2025-11-18", time: "9:00 AM", type: "Checkup", status: "Cancelled" },
  { id: 5, patient: "Kavya Menon", date: "2025-11-18", time: "3:00 PM", type: "Crown", status: "Confirmed" }
];

// Memoized AppointmentCard component - TASK 1: Fix Re-rendering in Appointments
const AppointmentCard = React.memo(({ appointment, onViewDetails, getStatusColor, index }) => {
  const handleCardClick = useCallback(async () => {
    const appt = appointment;
    // Show quick view then hydrate with full data from API
    onViewDetails(appt, appt);
  }, [appointment, onViewDetails]);

  return (
    <motion.div
      key={appointment.appointmentId}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring" }}
      className="relative group"
    >
      {/* Gradient Background Blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-purple-300 to-pink-300 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-300"></div>
      
      {/* Card Content */}
      <div className="relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-violet-200 hover:border-violet-400">
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(appointment.status || 'Scheduled')}`}>
            {appointment.status || 'Scheduled'}
          </span>
        </div>
        
        {/* Patient Info */}
        <div className="mb-4 pr-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {appointment.firstName?.charAt(0)}{appointment.lastName?.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-800">
                {appointment.firstName} {appointment.lastName}
              </h3>
              <p className="text-xs text-stone-500">Patient ID: {appointment.patientId}</p>
            </div>
          </div>
        </div>
        
        {/* Appointment Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📅</span>
            <span className="font-semibold text-stone-700">Date:</span>
            <span className="text-stone-600">
              {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">⏰</span>
            <span className="font-semibold text-stone-700">Time:</span>
            <span className="text-stone-600">{appointment.startTime || 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🏥</span>
            <span className="font-semibold text-stone-700">Type:</span>
            <span className="text-stone-600">{appointment.appointmentType || 'General'}</span>
          </div>
          
          {appointment.attendingPhysician && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">👨‍⚕️</span>
              <span className="font-semibold text-stone-700">Doctor:</span>
              <span className="text-stone-600">{appointment.attendingPhysician}</span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCardClick}
          className="w-full mt-3 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>📋</span>
          <span>View Details</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

// ✅ HOISTED: FullEditAppointmentModal Component
// Hoisted outside Doctors to prevent recreation on every render
const FullEditAppointmentModal = ({
  showEditModal,
  editFormData,
  setEditFormData,
  activeEditSection,
  setActiveEditSection,
  isUpdatingAppointment,
  handleUpdateAppointmentSubmit,
  onCloseEditModal,
  doctorsList,
  setDoctorsList,
  loadingDoctors,
  setLoadingDoctors
}) => {
  if (!showEditModal || !editFormData) return null;
  
  // Load doctors when modal opens
  React.useEffect(() => {
    const loadDoctorsForClinic = async () => {
      console.log('🚀 useEffect triggered - showEditModal:', showEditModal);
      console.log('📋 editFormData:', editFormData);
      
      try {
        setLoadingDoctors(true);
        const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
        const clinicId = editFormData?.clinicId || selectedAccess?.clinicId;
        
        console.log('🔍 Loading doctors for clinicId:', clinicId);
        console.log('📦 selectedAccess:', selectedAccess);
        
        if (clinicId) {
          console.log('📞 Calling getDoctorsByClinicId API...');
          const doctors = await getDoctorsByClinicId(clinicId);
          console.log('✅ API returned doctors:', doctors);
          console.log('📊 Number of doctors:', doctors?.length || 0);
          setDoctorsList(doctors || []);
        } else {
          console.warn('⚠️ No clinicId found in editFormData or localStorage');
          console.warn('editFormData?.clinicId:', editFormData?.clinicId);
          console.warn('selectedAccess?.clinicId:', selectedAccess?.clinicId);
          setDoctorsList([]);
        }
      } catch (error) {
        console.error('❌ Error loading doctors for edit modal:', error);
        console.error('❌ Error details:', error.message);
        setDoctorsList([]);
      } finally {
        setLoadingDoctors(false);
        console.log('🏁 Finished loading doctors');
      }
    };
    
    if (showEditModal) {
      loadDoctorsForClinic();
    }
  }, [showEditModal, editFormData?.clinicId, setDoctorsList, setLoadingDoctors]);
  
  // Validation state
  const [fieldErrors, setFieldErrors] = React.useState({});

  const calculateDurationMinutes = React.useCallback((startTime, endTime) => {
    if (!startTime || !endTime) {
      return '';
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) {
      return '';
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      return '';
    }

    return String(endTotalMinutes - startTotalMinutes);
  }, []);

  const validateField = React.useCallback((field, value) => {
    let error = '';
    if (field === 'phoneNumber') {
      const digits = String(value).replace(/\D/g, '');
      if (value && digits.length !== 10) {
        error = 'Phone number must be exactly 10 digits';
      }
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        error = 'Please enter a valid email address';
      }
    } else if (field === 'appointmentDate') {
      if (value) {
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
          error = 'Appointment date cannot be in the past';
        }
      }
    } else if (field === 'billableAmount') {
      if (value !== '' && parseFloat(value) < 0) {
        error = 'Billable amount cannot be negative';
      }
    } else if (field === 'paidAmount') {
      if (value !== '' && parseFloat(value) < 0) {
        error = 'Paid amount cannot be negative';
      }
    }
    return error;
  }, []);

  // Work directly with parent's editFormData
  const handleLocalInputChange = useCallback((field, value) => {
    const normalizedValue = field === 'phoneNumber'
      ? String(value).replace(/\D/g, '').slice(0, 10)
      : value;

    setEditFormData(prev => {
      const nextFormData = {
        ...prev,
        [field]: normalizedValue
      };

      if (field === 'startTime' || field === 'endTime') {
        nextFormData.durationMinutes = calculateDurationMinutes(
          field === 'startTime' ? normalizedValue : nextFormData.startTime,
          field === 'endTime' ? normalizedValue : nextFormData.endTime
        );
      }

      return nextFormData;
    });

    // Run inline validation
    const error = validateField(field, normalizedValue);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [calculateDurationMinutes, setEditFormData, validateField]);
  
  const handleLocalSave = useCallback(async () => {
    // Run full validation before save
    const errors = {};
    ['phoneNumber', 'email', 'appointmentDate', 'billableAmount', 'paidAmount'].forEach(field => {
      const val = editFormData?.[field];
      const err = validateField(field, val !== undefined && val !== null ? String(val) : '');
      if (err) errors[field] = err;
    });
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(prev => ({ ...prev, ...errors }));
      // Navigate to the tab that contains the first error
      if (errors.phoneNumber || errors.email) setActiveEditSection('patient');
      else if (errors.appointmentDate) setActiveEditSection('appointment');
      else if (errors.billableAmount || errors.paidAmount) setActiveEditSection('billing');
      return;
    }
    await handleUpdateAppointmentSubmit();
  }, [handleUpdateAppointmentSubmit, editFormData, validateField, setActiveEditSection]);
  
  // Tab navigation logic
  const editSections = ['patient', 'appointment', 'billing', 'other'];
  const currentSectionIndex = editSections.indexOf(activeEditSection);
  const isLastSection = currentSectionIndex === editSections.length - 1;
  
  const handleNextSection = useCallback(() => {
    if (currentSectionIndex < editSections.length - 1) {
      setActiveEditSection(editSections[currentSectionIndex + 1]);
    }
  }, [currentSectionIndex, editSections, setActiveEditSection]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        onClick={onCloseEditModal}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Header - STICKY */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  ✏️
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Edit Appointment</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    {editFormData.firstName} {editFormData.lastName} • ID: #{editFormData.appointmentId}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCloseEditModal}
                className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 mt-6 flex-wrap justify-center">
              {[
                { id: 'patient', label: ' Patient Info', icon: '👤' },
                { id: 'appointment', label: ' Appointment', icon: '📅' },
                { id: 'other', label: ' Other Details', icon: '📝' }
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveEditSection(tab.id)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap text-sm ${
                    activeEditSection === tab.id
                      ? 'bg-white text-indigo-700 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Body - TABBED SECTIONS */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {/* PATIENT INFO TAB */}
              {activeEditSection === 'patient' && (
                <motion.div
                  key="patient"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <span>👤</span> Patient Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Patient ID (Read-Only)</label>
                        <input
                          type="text"
                          value={editFormData.patientId}
                          disabled
                          className="w-full px-4 py-3 bg-stone-100 border-2 border-stone-300 rounded-xl text-stone-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          value={editFormData.firstName || ""}
                          onChange={(e) => handleLocalInputChange("firstName", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={editFormData.lastName || ""}
                          onChange={(e) => handleLocalInputChange("lastName", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editFormData.phoneNumber || ""}
                          onChange={(e) => handleLocalInputChange("phoneNumber", e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition ${
                            fieldErrors.phoneNumber
                              ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50'
                              : 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="Enter 10-digit phone number"
                          inputMode="numeric"
                          maxLength={10}
                        />
                        {fieldErrors.phoneNumber && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <span>⚠️</span> {fieldErrors.phoneNumber}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-stone-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={editFormData.email || ""}
                          onChange={(e) => handleLocalInputChange("email", e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition ${
                            fieldErrors.email
                              ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50'
                              : 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="Enter email"
                        />
                        {fieldErrors.email && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <span>⚠️</span> {fieldErrors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* APPOINTMENT TAB */}
              {activeEditSection === 'appointment' && (
                <motion.div
                  key="appointment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
                    <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                      <span>📅</span> Scheduling Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Appointment Date *</label>
                        <input
                          type="date"
                          value={editFormData.appointmentDate ? editFormData.appointmentDate.split('T')[0] : ""}
                          onChange={(e) => handleLocalInputChange("appointmentDate", e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 transition ${
                            fieldErrors.appointmentDate
                              ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50'
                              : 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          }`}
                        />
                        {fieldErrors.appointmentDate && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <span>⚠️</span> {fieldErrors.appointmentDate}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Start Time *</label>
                        <input
                          type="time"
                          value={editFormData.startTime || ""}
                          onChange={(e) => handleLocalInputChange("startTime", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={editFormData.endTime || ""}
                          onChange={(e) => handleLocalInputChange("endTime", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Duration (Minutes)</label>
                        <input
                          type="number"
                          value={editFormData.durationMinutes || ""}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed"
                          placeholder="Calculated from start and end time"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Appointment Type</label>
                        <input
                          type="text"
                          value={editFormData.appointmentType || ""}
                          onChange={(e) => handleLocalInputChange("appointmentType", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="e.g., Root Canal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Status</label>
                        <select
                          value={editFormData.status || "Scheduled"}
                          onChange={(e) => handleLocalInputChange("status", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Completed">Completed</option>
                          <option value="No-Show">No-Show</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Room Number</label>
                        <input
                          type="text"
                          value={editFormData.roomNumber || ""}
                          onChange={(e) => handleLocalInputChange("roomNumber", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="e.g., 101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Attending Physician</label>
                        <input
                          type="text"
                          value={editFormData.attendingPhysician || ""}
                          onChange={(e) => handleLocalInputChange("attendingPhysician", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="Enter physician name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-3 cursor-pointer bg-green-100 p-3 rounded-xl">
                          <input
                            type="checkbox"
                            checked={editFormData.isConfirmed || false}
                            onChange={(e) => handleLocalInputChange("isConfirmed", e.target.checked)}
                            className="w-5 h-5 rounded border-stone-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm font-semibold text-stone-700">✅ Confirmed Appointment</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md">
                    <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <span>📝</span> Visit Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Reason for Visit</label>
                        <textarea
                          value={editFormData.reasonForVisit || ""}
                          onChange={(e) => handleLocalInputChange("reasonForVisit", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                          rows="3"
                          placeholder="Enter reason for visit"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Notes</label>
                        <textarea
                          value={editFormData.notes || ""}
                          onChange={(e) => handleLocalInputChange("notes", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                          rows="3"
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* OTHER TAB */}
              {activeEditSection === 'other' && (
                <motion.div
                  key="other"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md">
                    <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <span>👨‍⚕️</span> Additional Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Attending Physician</label>
                        <input
                          type="text"
                          value={editFormData.attendingPhysician || ""}
                          onChange={(e) => handleLocalInputChange("attendingPhysician", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          placeholder="Enter doctor's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Telehealth Link</label>
                        <input
                          type="url"
                          value={editFormData.telehealthLink || ""}
                          onChange={(e) => handleLocalInputChange("telehealthLink", e.target.value)}
                          className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - STICKY */}
          <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCloseEditModal}
              disabled={isUpdatingAppointment}
              className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg disabled:opacity-50"
            >
              ✕ Close
            </motion.button>
            
            {/* Show Next button on tabs 1-3, Save Changes button only on last tab */}
            {!isLastSection ? (
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextSection}
                className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-2xl transition-all flex items-center gap-2"
              >
                <span>Next</span>
                <span>➜</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLocalSave}
                disabled={isUpdatingAppointment}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdatingAppointment ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

FullEditAppointmentModal.displayName = 'FullEditAppointmentModal';

export default function Doctors() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [isManageExpanded, setIsManageExpanded] = useState(false);
  
  // Get doctor name from localStorage
  const [doctorName, setDoctorName] = useState("");
  
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
      
      console.log("👨‍⚕️ Loading doctor name from localStorage:");
      console.log("   userData:", userData);
      console.log("   selectedAccess:", selectedAccess);
      
      // Try to decode JWT token to get name
      const token = getAccessToken();
      let decodedToken = null;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            decodedToken = JSON.parse(jsonPayload);
            console.log("   Decoded token:", decodedToken);
          }
        } catch (err) {
          console.error("Error decoding token:", err);
        }
      }
      
      // Try multiple sources for the doctor's name
      const fullName = decodedToken?.fullName || decodedToken?.name || userData.fullName || selectedAccess.fullName || "";
      const firstName = decodedToken?.firstName || decodedToken?.given_name || userData.firstName || selectedAccess.firstName || "";
      const lastName = decodedToken?.lastName || decodedToken?.family_name || userData.lastName || selectedAccess.lastName || "";
      const username = userData.username || "";
      
      // Use fullName if available, otherwise construct from first and last name
      let name = "";
      if (fullName) {
        name = fullName;
      } else if (firstName || lastName) {
        name = `${firstName} ${lastName}`.trim();
      } else if (username) {
        // Extract name from email as last resort (e.g., "venkatesh.srinivasan@gmail.com" -> "Venkatesh Srinivasan")
        const emailName = username.split('@')[0];
        name = emailName
          .split('.') // Split by dots
          .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Capitalize each part
          .join(' ');
      }
      
      console.log("   Resolved doctor name:", name);
      
      if (name) {
        setDoctorName(name);
      }
    } catch (error) {
      console.error("Error reading user data:", error);
    }
  }, []);
  
  // Appointments management states
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [realAppointments, setRealAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointmentForVisit, setSelectedAppointmentForVisit] = useState(null);
  const [showVisitInfoModal, setShowVisitInfoModal] = useState(false);
  const [appointmentStartDate, setAppointmentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentEndDate, setAppointmentEndDate] = useState("");
  const [appointmentDateValidationError, setAppointmentDateValidationError] = useState("");
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState("All");
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [viewedPrescription, setViewedPrescription] = useState(null);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  
  // Inline prescription states
  const [inlineMedications, setInlineMedications] = useState([]);
  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [editingMedicationIndex, setEditingMedicationIndex] = useState(null);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const medicineInputRef = useRef(null);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const medicationDropdownRef = useRef(null);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showMedicineSaveSuccess, setShowMedicineSaveSuccess] = useState(false);
  const [medicineSaveMessage, setMedicineSaveMessage] = useState('');
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  const [newMedicineForm, setNewMedicineForm] = useState({
    itemName: '',
    itemCode: '',
    category: 'Medicines',
    subCategory: 'General',
    unit: 'tablet'
  });
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [newMedicationName, setNewMedicationName] = useState('');
  const [currentMedicationIndex, setCurrentMedicationIndex] = useState(-1);
  const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);
  const [showPrescriptionSuccessModal, setShowPrescriptionSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDiagnosisSaveSuccess, setShowDiagnosisSaveSuccess] = useState(false);
  const [diagnosisSaveMessage, setDiagnosisSaveMessage] = useState('');
  const [printPrescriptionData, setPrintPrescriptionData] = useState(null);
  const visitFetchRef = useRef({ appointmentId: null, inFlight: false });
  const inventoryLoadedRef = useRef(false);
  const [medicalInfoSummary, setMedicalInfoSummary] = useState({ 
    chronicDiseases: [], 
    allergies: [],
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    reasonForVisit: ''
  });
  const [medicalInfoLoading, setMedicalInfoLoading] = useState(false);
  const [medicalInfoError, setMedicalInfoError] = useState(false);
  const medicalInfoCacheRef = useRef(new Map());
  const medicalInfoInFlightRef = useRef(new Set());

  // 🔍 Debug: Track every change to medicalInfoSummary
  useEffect(() => {
    console.log('👁️ [DOCTORS] ★ MEDICAL INFO SUMMARY CHANGED:');
    console.log('   diagnosis:', medicalInfoSummary.diagnosis ? `"${medicalInfoSummary.diagnosis}"` : '(empty)');
    console.log('   treatment:', medicalInfoSummary.treatment ? `"${medicalInfoSummary.treatment}"` : '(empty)');
    console.log('   medications:', medicalInfoSummary.medications ? `"${medicalInfoSummary.medications}"` : '(empty)');
    console.log('   notes:', medicalInfoSummary.notes ? `"${medicalInfoSummary.notes}"` : '(empty)');
    console.log('   Full object:', JSON.stringify(medicalInfoSummary, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [medicalInfoSummary]);

  // Debug logging for currentMedication state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGE - currentMedication.name:', currentMedication.name);
    console.log('🔄 STATE CHANGE - currentMedication FULL:', JSON.stringify(currentMedication, null, 2));
  }, [currentMedication]);

  // Debug logging for inlineMedications changes
  useEffect(() => {
    console.log('📋 STATE CHANGE - inlineMedications count:', inlineMedications.length);
    console.log('📋 STATE CHANGE - inlineMedications FULL:', JSON.stringify(inlineMedications, null, 2));
  }, [inlineMedications]);

  // Debug logging for dropdown state
  useEffect(() => {
    console.log('🔽 STATE CHANGE - medicineDropdownOpen:', medicineDropdownOpen);
  }, [medicineDropdownOpen]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editAction, setEditAction] = useState(""); // "cancel" or "reschedule"
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
  
  // Prescription management states
  const [showPrescriptionWritingModal, setShowPrescriptionWritingModal] = useState(false);
  const [patientMedicalInfo, setPatientMedicalInfo] = useState(null);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [showPrescriptionPrintModal, setShowPrescriptionPrintModal] = useState(false);
  const [prescriptionToPrint, setPrescriptionToPrint] = useState(null);
  const printRef = useRef(null);
  
  // Payment management states
  const [paymentStartDate, setPaymentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentEndDate, setPaymentEndDate] = useState("");
  const [paymentClinicId, setPaymentClinicId] = useState('');
  const [paymentAppointments, setPaymentAppointments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All'); // New: filter state
  const [showPaymentSuccessPopup, setShowPaymentSuccessPopup] = useState(false); // New: success popup
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');
  
  // Edit payment modal states
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPaymentAppointment, setEditingPaymentAppointment] = useState(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    billableAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paymentStatus: 'Pending',
    appointmentStatus: 'Scheduled'
  });
  const [savingPaymentEdit, setSavingPaymentEdit] = useState(false);

  // My Patients states
  const [myPatients, setMyPatients] = useState([]);
  const [loadingMyPatients, setLoadingMyPatients] = useState(false);
  const [myPatientsFilterText, setMyPatientsFilterText] = useState('');
  const [myPatientsSelectedClinic, setMyPatientsSelectedClinic] = useState('');
  
  // Manage Clinic - Clinic Settings states
  const [clinicData, setClinicData] = useState(null);
  const [loadingClinicData, setLoadingClinicData] = useState(false);
  
  // Manage Clinic - Staff Management states
  const [staffList, setStaffList] = useState([]);
  const [loadingStaffList, setLoadingStaffList] = useState(false);
  const [selectedStaffForView, setSelectedStaffForView] = useState(null);
  const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
  const [selectedStaffTypeFilter, setSelectedStaffTypeFilter] = useState("All");
  
  // Manage Clinic - Inventory states
  const [clinicInventory, setClinicInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [masterItems, setMasterItems] = useState([]);
  const [showAddMasterFromAutocomplete, setShowAddMasterFromAutocomplete] = useState(false);
  const [autocompleteNewItemName, setAutocompleteNewItemName] = useState('');
  const [loadingMasterModal, setLoadingMasterModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ itemCount: 0 });
  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    category: '',
    stock: 0,
    minStock: 0,
    unitCost: 0,
    storageLocation: ''
  });
  
  // Clinic Details states
  const [doctorClinics, setDoctorClinics] = useState([]);
  const [selectedClinicForView, setSelectedClinicForView] = useState(null);
  const [loadingClinicDetails, setLoadingClinicDetails] = useState(false);
  const [selectedClinicDetails, setSelectedClinicDetails] = useState(null);
  
  // Edit appointment states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState("");
  const [activeEditSection, setActiveEditSection] = useState('patient');
  const [restoreDetailsAfterEditClose, setRestoreDetailsAfterEditClose] = useState(false);
  
  // New appointment booking states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    firstName: "",
    lastName: "",
    date: "",
    time: "",
    type: "",
    doctor: "",
    notes: "",
    phone: "",
    email: "",
    isWalkIn: false
  });
  
  // Inventory management states
  const [inventoryItems, setInventoryItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const mapClinicInventoryToDashboardItems = (items = []) => {
    return (Array.isArray(items) ? items : []).map((item, index) => {
      const available = Number(item?.quantityAvailable ?? item?.stock ?? 0) || 0;
      const reorderLevel = Number(item?.reorderLevel ?? item?.minimumStock ?? item?.minStock ?? 0) || 0;
      const backendStatus = String(item?.status || "").trim();

      let status = "In Stock";
      if (available <= 0) {
        status = "Critical";
      } else if (available <= reorderLevel) {
        status = "Low Stock";
      }

      if (backendStatus.toLowerCase() === "critical" || backendStatus.toLowerCase() === "out of stock") {
        status = "Critical";
      } else if (backendStatus.toLowerCase() === "low stock") {
        status = "Low Stock";
      } else if (backendStatus.toLowerCase() === "in stock" || backendStatus.toLowerCase() === "available") {
        status = "In Stock";
      }

      return {
        id: item?.inventoryId ?? item?.id ?? index + 1,
        inventoryId: item?.inventoryId ?? item?.id ?? 0,
        itemId: item?.itemId ?? item?.ItemId ?? 0,
        item: item?.itemName ?? item?.name ?? "N/A",
        category: item?.category ?? item?.categoryName ?? "General",
        available,
        ordered: Number(item?.ordered ?? item?.onOrder ?? 0) || 0,
        reorderLevel,
        status
      };
    });
  };
  
  const vendors = [
    "MedSupply Co.",
    "Dental Solutions Ltd.",
    "Healthcare Partners Inc.",
    "Premier Medical Supplies",
    "Global Dental Equipment"
  ];
  
  const handleCloseAppointmentDetails = useCallback(() => {
    setShowAppointmentDetails(false);
    setSelectedAppointmentDetails(null);
  }, []);

  // Appointment management functions
  const handleEditAppointmentClick = (appointment) => {
    // Hide details while edit modal is open to avoid duplicate stacked renders.
    const shouldRestoreDetails = showAppointmentDetails;
    setRestoreDetailsAfterEditClose(shouldRestoreDetails);
    if (shouldRestoreDetails) {
      setShowAppointmentDetails(false);
    }

    setEditFormData({ ...appointment });
    setActiveEditSection('patient'); // Reset to first tab
    setShowEditModal(true);
  };

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);

    if (restoreDetailsAfterEditClose && selectedAppointmentDetails) {
      setShowAppointmentDetails(true);
    }

    setRestoreDetailsAfterEditClose(false);
  }, [restoreDetailsAfterEditClose, selectedAppointmentDetails]);
  
  const handleUpdateAppointmentSubmit = async () => {
    if (!editFormData) {
      console.error("❌ No edit form data available");
      return;
    }
    
    console.log("════════════════════════════════════════════════════════════════");
    console.log("🔥 SAVE CHANGES CLICKED - Starting Update Process");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("📋 Edit Form Data:", editFormData);
    console.log("🆔 Appointment ID:", editFormData.appointmentId);
    console.log("👤 Patient:", editFormData.firstName, editFormData.lastName);
    console.log("📅 Date:", editFormData.appointmentDate);
    console.log("⏰ Time:", editFormData.startTime);
    console.log("🏥 Clinic ID:", editFormData.clinicId);
    console.log("👨‍⚕️ Doctor ID:", editFormData.doctorId);
    console.log("════════════════════════════════════════════════════════════════");
    console.log("💰 BILLING INFORMATION:");
    console.log("   Billable Amount:", editFormData.billableAmount);
    console.log("   Paid Amount:", editFormData.paidAmount);
    console.log("   Pending Amount:", editFormData.pendingAmount);
    console.log("   Payment Status:", editFormData.paymentStatus);
    console.log("════════════════════════════════════════════════════════════════");
    console.log("📤 FULL PAYLOAD BEING SENT TO API:");
    console.log(JSON.stringify(editFormData, null, 2));
    console.log("════════════════════════════════════════════════════════════════");
    
    const toApiTime = (value) => {
      if (!value) return null;
      const v = String(value).trim();
      if (!v) return null;
      if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
      if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
      return v;
    };

    const toApiDate = (value) => {
      if (!value) return "";
      const v = String(value).trim();
      if (!v) return "";
      return v.includes('T') ? v.split('T')[0] : v;
    };

    const billableAmountNum = parseFloat(editFormData.billableAmount || 0);
    const paidAmountNum = parseFloat(editFormData.paidAmount || 0);
    const computedPendingAmount = Number((billableAmountNum - paidAmountNum).toFixed(2));
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const localUserId = Number(localStorage.getItem('userId') || userData?.userId || 0);

    const payload = {
      appointmentId: Number(editFormData.appointmentId || selectedAppointmentDetails?.appointmentId || 0),
      patientId: Number(editFormData.patientId || selectedAppointmentDetails?.patientId || 0),
      clinicId: Number(editFormData.clinicId || selectedAppointmentDetails?.clinicId || 0),
      doctorId: editFormData.doctorId
        ? String(editFormData.doctorId)
        : (selectedAppointmentDetails?.doctorId ? String(selectedAppointmentDetails.doctorId) : null),
      visitId: editFormData.visitId || selectedAppointmentDetails?.visitId || null,
      attendingPhysician: editFormData.attendingPhysician || selectedAppointmentDetails?.attendingPhysician || '',
      enterpriseId: Number(editFormData.enterpriseId || selectedAppointmentDetails?.enterpriseId || 0),
      firstName: editFormData.firstName || selectedAppointmentDetails?.firstName || '',
      lastName: editFormData.lastName || selectedAppointmentDetails?.lastName || '',
      phoneNumber: editFormData.phoneNumber || selectedAppointmentDetails?.phoneNumber || '',
      email: editFormData.email || selectedAppointmentDetails?.email || '',
      appointmentDate: toApiDate(editFormData.appointmentDate || selectedAppointmentDetails?.appointmentDate),
      startTime: toApiTime(editFormData.startTime || selectedAppointmentDetails?.startTime),
      endTime: toApiTime(editFormData.endTime || selectedAppointmentDetails?.endTime),
      durationMinutes: Number(editFormData.durationMinutes || selectedAppointmentDetails?.durationMinutes || 0),
      appointmentType: editFormData.appointmentType || selectedAppointmentDetails?.appointmentType || 'Consultation',
      reasonForVisit: editFormData.reasonForVisit || selectedAppointmentDetails?.reasonForVisit || '',
      notes: editFormData.notes || selectedAppointmentDetails?.notes || '',
      roomNumber: editFormData.roomNumber || selectedAppointmentDetails?.roomNumber || '',
      telehealthLink: editFormData.telehealthLink || selectedAppointmentDetails?.telehealthLink || '',
      status: editFormData.status || selectedAppointmentDetails?.status || 'Scheduled',
      isConfirmed: Boolean(editFormData.isConfirmed ?? selectedAppointmentDetails?.isConfirmed ?? false),
      billableAmount: billableAmountNum,
      paidAmount: paidAmountNum,
      pendingAmount: computedPendingAmount,
      paymentStatus: editFormData.paymentStatus || selectedAppointmentDetails?.paymentStatus || 'Pending',
      createdAt: editFormData.createdAt || selectedAppointmentDetails?.createdAt,
      updatedAt: new Date().toISOString(),
      createdBy: Number(editFormData.createdBy || selectedAppointmentDetails?.createdBy || 0),
      updatedBy: localUserId
    };

    if (!payload.appointmentId || !payload.patientId || !payload.clinicId || !payload.appointmentDate) {
      alert('❌ Missing required appointment fields. Please verify date, patient and clinic details.');
      return;
    }

    setIsUpdatingAppointment(true);
    try {
      console.log("🚀 Calling updateAppointment API...");
      
      // Call the API to update the appointment
      const result = await updateAppointment(payload);
      
      console.log("✅ API call successful!");
      console.log("📦 API Response:", result);
      
      // Update both appointment states with the new data
      setAppointments(prev => prev.map(appt => 
        appt.appointmentId === payload.appointmentId 
          ? { ...appt, ...payload }
          : appt
      ));
      
      setRealAppointments(prev => prev.map(appt => 
        appt.appointmentId === payload.appointmentId 
          ? { ...appt, ...payload }
          : appt
      ));
      
      const updatedDetails = {
        ...(selectedAppointmentDetails || {}),
        ...payload
      };
      setSelectedAppointmentDetails(updatedDetails);
      console.log("✅ Updated appointment details view with new data");
      
      console.log("✅ Local state updated with new data");
      
      // Batch all modal state updates together
      setShowEditModal(false);
      setEditFormData(null);
      setRestoreDetailsAfterEditClose(false);
      setShowAppointmentDetails(true);
      setUpdateSuccessMessage("🎉 Appointment updated successfully! Your changes have been saved to the system.");
      setShowUpdateSuccessModal(true);
      
      console.log("✅ Update process completed successfully");
    } catch (error) {
      console.error("════════════════════════════════════════════════════════════════");
      console.error("❌ ERROR UPDATING APPOINTMENT");
      console.error("════════════════════════════════════════════════════════════════");
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error response:", error?.response);
      console.error("════════════════════════════════════════════════════════════════");
      const errorText = (error?.response?.data || error?.message || '').toString().slice(0, 200);
      alert(`❌ Failed to update appointment. ${errorText ? `Details: ${errorText}` : 'Please try again.'}`);
    } finally {
      setIsUpdatingAppointment(false);
    }
  };
  
  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditAction("");
    setRescheduleData({ date: appointment.date, time: appointment.time });
    setEditModalOpen(true);
  };
  
  const handleCancelAppointment = () => {
    if (selectedAppointment) {
      setAppointments(appointments.map(appt => 
        appt.id === selectedAppointment.id 
          ? { ...appt, status: "Cancelled" }
          : appt
      ));
      setEditModalOpen(false);
      setSelectedAppointment(null);
      setEditAction("");
    }
  };
  
  const handleRescheduleAppointment = () => {
    if (selectedAppointment && rescheduleData.date && rescheduleData.time) {
      setAppointments(appointments.map(appt => 
        appt.id === selectedAppointment.id 
          ? { ...appt, date: rescheduleData.date, time: rescheduleData.time, status: "Confirmed" }
          : appt
      ));
      setEditModalOpen(false);
      setSelectedAppointment(null);
      setEditAction("");
      setRescheduleData({ date: "", time: "" });
    }
  };
  
  // Calculate real-time dashboard metrics from live data
  const dashboardMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's appointments count
    const todayAppointmentsCount = realAppointments.filter(appt => {
      const apptDate = appt.appointmentDate?.split('T')[0];
      return apptDate === today;
    }).length;
    
    // Calculate unique patients count
    const uniquePatientIds = new Set(
      realAppointments
        .map(appt => appt.patientId)
        .filter(id => id !== null && id !== undefined)
    );
    const activePatientsCount = uniquePatientIds.size;
    
    // Calculate pending payments count
    const pendingPaymentsCount = realAppointments.filter(appt => {
      const pendingAmount = parseFloat(appt.pendingAmount || 0);
      return pendingAmount > 0;
    }).length;
    
    // Calculate low stock inventory items
    const lowStockCount = clinicInventory.filter(item => {
      const available = item.quantityAvailable || item.stock || 0;
      const reorder = item.reorderLevel || item.minStock || item.minimumStock || 0;
      return available <= reorder;
    }).length;
    
    return {
      todayAppointments: todayAppointmentsCount,
      activePatients: activePatientsCount,
      pendingPayments: pendingPaymentsCount,
      lowStockAlerts: lowStockCount
    };
  }, [realAppointments, clinicInventory]);
  
  // Close medicine dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (medicineInputRef.current && !medicineInputRef.current.contains(event.target)) {
        setMedicineDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // New appointment booking functions
  const handleOpenBooking = async () => {
    setBookingModalOpen(true);
    setNewAppointment({
      firstName: "",
      lastName: "",
      date: "",
      time: "",
      type: "",
      doctor: "",
      notes: "",
      phone: "",
      email: "",
      isWalkIn: false
    });

    // Fetch doctors list for the clinic
    try {
      setLoadingDoctors(true);
      // Get clinic ID from clinicData or from selected access
      const clinicId = clinicData?.clinicId || selectedAccess?.clinicId;
      if (clinicId) {
        const doctors = await getDoctorsByClinicId(clinicId);
        setDoctorsList(doctors || []);
        console.log('✅ Doctors fetched:', doctors);
      }
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      setDoctorsList([]);
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  const handleBookAppointment = () => {
    // Validate mandatory fields
    const { firstName, lastName, date, time, type, notes, phone, email, isWalkIn, doctor } = newAppointment;
    
    if (!firstName || !lastName || !date || !time || !type || !notes || !phone || !email) {
      alert("❌ Please fill in all mandatory fields: First Name, Last Name, Contact, Email, Date, Time, Type, and Reason for Visit");
      return;
    }

    // For non-walk-in appointments, doctor is required
    if (!isWalkIn && !doctor) {
      alert("❌ Please select an attending physician for this appointment");
      return;
    }

    const appointment = {
      id: appointments.length + 1,
      firstName: firstName,
      lastName: lastName,
      patient: `${firstName} ${lastName}`,
      date: date,
      time: time,
      type: type,
      doctor: doctor || "Walk-In",
      notes: notes,
      phone: phone,
      email: email,
      status: "Confirmed",
      appointmentType: isWalkIn ? "Walk In" : type
    };
    setAppointments([...appointments, appointment]);
    setBookingModalOpen(false);
    setNewAppointment({
      firstName: "",
      lastName: "",
      date: "",
      time: "",
      type: "",
      doctor: "",
      notes: "",
      phone: "",
      email: "",
      isWalkIn: false
    });
    alert("✅ Appointment booked successfully!");
  };
  
  const handleAddNewItem = () => {
    navigate('/clinics', { state: { openAddInventoryModal: true, source: 'doctors' } });
  };
  
  const handleNewItemChange = (tempId, field, value) => {
    setNewItems(newItems.map(item => 
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };
  
  const handleSaveNewItems = () => {
    const validItems = newItems.filter(item => item.item && item.category && item.available);
    if (validItems.length > 0) {
      const itemsToAdd = validItems.map((item, index) => ({
        id: inventoryItems.length + index + 1,
        item: item.item,
        category: item.category,
        available: parseInt(item.available) || 0,
        ordered: 0,
        reorderLevel: parseInt(item.reorderLevel) || 10,
        status: "In Stock"
      }));
      setInventoryItems([...inventoryItems, ...itemsToAdd]);
      setNewItems([]);
    }
  };
  
  const handlePlaceOrder = (item) => {
    setOrderItem(item);
    setOrderQuantity("");
    setSelectedVendor("");
    setOrderModalOpen(true);
  };
  
  const handleConfirmOrder = () => {
    if (orderItem && orderQuantity && selectedVendor) {
      // Update the inventory item with ordered quantity
      setInventoryItems(inventoryItems.map(item => 
        item.id === orderItem.id 
          ? { ...item, ordered: (item.ordered || 0) + parseInt(orderQuantity), status: "In Stock" }
          : item
      ));
      setOrderModalOpen(false);
      setSuccessModalOpen(true);
    }
  };

  // Prescription handlers
  const handleOpenPrescriptionModal = async (appointment) => {
    try {
      console.log('🔓 Opening prescription modal with appointment:', appointment);
      setSelectedAppointmentDetails(appointment);
      // Load patient medical info only
      const patientData = await getPatientFullProfile(appointment.patientId);
      setPatientMedicalInfo(patientData.patientMedicalInfo);
      setShowPrescriptionWritingModal(true);
    } catch (error) {
      console.error("Failed to load patient data:", error);
      // Still open modal - user can write prescription
      setShowPrescriptionWritingModal(true);
    }
  };

  // Inline Prescription Handlers
  const loadInventoryMedications = async () => {
    console.log('🔄 Starting to load inventory medications...');
    setLoadingMeds(true);
    try {
      const data = await listInventoryMasters();
      console.log('✅ Inventory medications loaded:', data?.length, 'items', data);
      setInventoryMeds(data || []);
    } catch (error) {
      console.error("❌ Failed to load medications:", error);
      setInventoryMeds([]);
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    if (showVisitInfoModal) {
      if (inventoryLoadedRef.current || loadingMeds) return;
      if (inventoryMeds.length > 0) {
        inventoryLoadedRef.current = true;
        return;
      }
      console.log('🏥 Visit Info Modal opened, loading inventory medications...');
      loadInventoryMedications().finally(() => {
        inventoryLoadedRef.current = true;
      });
    } else {
      // Reset medical info when modal closes
      console.log('🏥 Visit Info Modal closed, resetting medical info');
      setMedicalInfoSummary({ chronicDiseases: [], allergies: [], diagnosis: '', treatment: '', medications: '', notes: '', reasonForVisit: '' });
      setMedicalInfoLoading(false);
      setMedicalInfoError(false);
      medicalInfoInFlightRef.current.clear();
    }
  }, [showVisitInfoModal]);

  // Function to reload visit data after saving
  const reloadVisitData = useCallback(() => {
    console.log('🔄 RELOADING VISIT DATA');
    if (selectedAppointmentDetails?.appointmentId) {
      // Reset the ref to force re-fetch
      visitFetchRef.current = { appointmentId: null, inFlight: false };
      // Clear medical info to force reload
      setMedicalInfoSummary({ chronicDiseases: [], allergies: [], diagnosis: '', treatment: '', medications: '', notes: '', reasonForVisit: '' });
      setMedicalInfoLoading(true);
      setMedicalInfoError(false);
    }
  }, [selectedAppointmentDetails?.appointmentId]);

  // Clear visit fetch ref when modal closes so data reloads on next open
  useEffect(() => {
    if (!showVisitInfoModal) {
      visitFetchRef.current = { appointmentId: null, inFlight: false };
    }
  }, [showVisitInfoModal]);

  useEffect(() => {
    if (!showVisitInfoModal || !selectedAppointmentDetails?.appointmentId) return;
    const appointmentId = selectedAppointmentDetails.appointmentId;
    if (visitFetchRef.current.inFlight || visitFetchRef.current.appointmentId === appointmentId) return;

    visitFetchRef.current = { appointmentId, inFlight: true };
    (async () => {
      try {
        const existingVisitData = await getPatientVisit(appointmentId);
        console.log('═══════════════════════════════════════════════════════');
        console.log('📝 VISIT DATA RECEIVED FROM FIRST API CALL:');
        console.log('═══════════════════════════════════════════════════════');
        console.log(JSON.stringify(existingVisitData, null, 2));
        console.log('═══════════════════════════════════════════════════════');
        
        if (existingVisitData) {
          // Extract diagnosis, treatment, and other fields from visit data
          const visitDiagnosis = existingVisitData.diagnosis || existingVisitData.diagnoses || '';
          const visitTreatment = existingVisitData.treatmentProvided || existingVisitData.treatment || existingVisitData.treatments || '';
          const visitMedications = existingVisitData.medications || existingVisitData.medicationPrescriptions || '';
          const visitNotes = existingVisitData.notes || existingVisitData.additionalNotes || '';
          const visitReasonForVisit = existingVisitData.reasonForVisit || existingVisitData.chiefComplaint || '';
          
          // NOTE: Prescriptions are loaded separately into the medications grid, not appended to treatment
          
          console.log('📋 STEP 1 - EXTRACTED FROM VISIT DATA:');
          console.log('   ✅ diagnosis:', visitDiagnosis);
          console.log('   ✅ treatment:', visitTreatment);
          console.log('   ✅ medications:', visitMedications);
          console.log('   ✅ notes:', visitNotes);
          console.log('   ✅ reasonForVisit:', visitReasonForVisit);
          console.log('   ✅ prescriptions:', existingVisitData.prescriptions);
          console.log('═══════════════════════════════════════════════════════');
          
          // Merge visit data into medical summary - IMPORTANT: Always set the values!
          if (visitDiagnosis || visitTreatment || visitMedications || visitNotes || visitReasonForVisit) {
            console.log('📋 STEP 2 - MERGING INTO MEDICAL SUMMARY');
            
            // Use functional update to preserve chronic diseases/allergies from previous state
            setMedicalInfoSummary(prevState => {
              const updatedSummary = {
                chronicDiseases: prevState.chronicDiseases,  // PRESERVE from previous state
                allergies: prevState.allergies,  // PRESERVE from previous state
                diagnosis: visitDiagnosis || prevState.diagnosis,  // Use visit data first
                treatment: visitTreatment || prevState.treatment,  // Use visit data (no prescriptions appended)
                medications: visitMedications || prevState.medications,  // Use visit data first
                notes: visitNotes || prevState.notes,  // Use visit data first
                reasonForVisit: visitReasonForVisit || prevState.reasonForVisit  // Use visit data first
              };
              
              console.log('📤 UPDATED SUMMARY:');
              console.log(JSON.stringify(updatedSummary, null, 2));
              console.log('═══════════════════════════════════════════════════════');
              
              return updatedSummary;
            });
            
            // CRITICAL: Set loading to false after visit data populates the form
            console.log('✅ VISIT DATA LOADED - SETTING LOADING STATE TO FALSE');
            setMedicalInfoLoading(false);
          }
          
          setSelectedAppointmentForVisit({ ...selectedAppointmentDetails, existingVisitData });
        } else {
          setSelectedAppointmentForVisit(selectedAppointmentDetails);
        }
      } catch (error) {
        console.error('❌ Failed to fetch patient visit:', error);
        setSelectedAppointmentForVisit(selectedAppointmentDetails);
      } finally {
        visitFetchRef.current = { appointmentId, inFlight: false };
      }
    })();
  }, [showVisitInfoModal, selectedAppointmentDetails?.appointmentId, medicalInfoSummary]);

  const loadMedicalInfoSummary = useCallback(async (patientId) => {
    if (!patientId) {
      console.warn('⚠️ No patientId provided to loadMedicalInfoSummary');
      setMedicalInfoLoading(false);
      return;
    }
    
    // Check cache first
    if (medicalInfoCacheRef.current.has(patientId)) {
      console.log('✅ Using cached medical info for patientId:', patientId);
      setMedicalInfoSummary(medicalInfoCacheRef.current.get(patientId));
      setMedicalInfoLoading(false);
      setMedicalInfoError(false);
      return;
    }
    
    // If request already in flight, try again in 100ms instead of returning
    if (medicalInfoInFlightRef.current.has(patientId)) {
      console.log('⏳ Medical info request already in flight for patientId:', patientId);
      setMedicalInfoLoading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (medicalInfoCacheRef.current.has(patientId)) {
        console.log('✅ Cached data now available after waiting, patientId:', patientId);
        setMedicalInfoSummary(medicalInfoCacheRef.current.get(patientId));
        setMedicalInfoLoading(false);
      }
      return;
    }

    medicalInfoInFlightRef.current.add(patientId);
    setMedicalInfoLoading(true);
    setMedicalInfoError(false);
    const timeoutId = setTimeout(() => {
      console.error('❌ Medical info request timed out after 5 seconds');
      setMedicalInfoLoading(false);
      setMedicalInfoError(true);
      medicalInfoInFlightRef.current.delete(patientId);
      setMedicalInfoSummary({ chronicDiseases: [], allergies: [], diagnosis: '', treatment: '', medications: '', notes: '', reasonForVisit: '' });
    }, 5000);

    try {
      console.log('🔍 Fetching medical info for patientId:', patientId);
      const data = await getPatientMedicalInfoSummary(patientId);
      clearTimeout(timeoutId);
      console.log('📋 Medical Info Response:', data);
      
      if (!data) {
        console.warn('⚠️ API returned null/undefined for patientId:', patientId);
        setMedicalInfoSummary({ chronicDiseases: [], allergies: [], diagnosis: '', treatment: '', medications: '', notes: '', reasonForVisit: '' });
        medicalInfoCacheRef.current.set(patientId, { chronicDiseases: [], allergies: [], diagnosis: '', treatment: '', medications: '', notes: '', reasonForVisit: '' });
        setMedicalInfoLoading(false);
        return;
      }
      
      // Parse chronic diseases - handle both array and string formats
      let chronicDiseaseArray = [];
      if (Array.isArray(data?.chronicDiseases)) {
        chronicDiseaseArray = data.chronicDiseases;
      } else if (typeof data?.chronicDiseases === 'string' && data.chronicDiseases.trim()) {
        chronicDiseaseArray = data.chronicDiseases
          .split(',')
          .map(d => d.trim())
          .filter(d => d !== '');
      } else if (Array.isArray(data?.chronicDisease)) {
        chronicDiseaseArray = data.chronicDisease;
      } else if (typeof data?.chronicDisease === 'string' && data.chronicDisease.trim()) {
        chronicDiseaseArray = data.chronicDisease
          .split(',')
          .map(d => d.trim())
          .filter(d => d !== '');
      }
      
      // Parse allergies - handle both array and string formats
      let allergyArray = [];
      if (Array.isArray(data?.allergies)) {
        allergyArray = data.allergies;
      } else if (typeof data?.allergies === 'string' && data.allergies.trim()) {
        allergyArray = data.allergies
          .split(',')
          .map(a => a.trim())
          .filter(a => a !== '');
      } else if (typeof data?.patientAllergies === 'string' && data.patientAllergies.trim()) {
        allergyArray = data.patientAllergies
          .split(',')
          .map(a => a.trim())
          .filter(a => a !== '');
      } else if (Array.isArray(data?.allergy)) {
        allergyArray = data.allergy;
      } else if (typeof data?.allergy === 'string' && data.allergy.trim()) {
        allergyArray = data.allergy
          .split(',')
          .map(a => a.trim())
          .filter(a => a !== '');
      }
      
      console.log('✅ Parsed Medical Info:', { chronicDiseaseArray, allergyArray });
      
      // Extract diagnosis, treatment, medications, and notes from API response
      // The API returns medicalHistory which contains diagnosis/treatment info
      let diagnosisText = data?.diagnosis || data?.diagnoses || '';
      let treatmentText = data?.treatment || data?.treatmentProvided || data?.treatments || '';
      let medicationsText = data?.medications || data?.medicationPrescriptions || data?.patientCurrentMedications || data?.prescriptions || '';
      let notesText = data?.notes || data?.additionalNotes || data?.medicalHistory || '';
      
      // If medicalHistory contains the info, use it
      if (data?.medicalHistory && !diagnosisText) {
        diagnosisText = data.medicalHistory;
      }
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔍 FULL API RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 Extracted ONLY Chronic Diseases & Allergies:');
      console.log('   chronicDiseases:', chronicDiseaseArray);
      console.log('   allergies:', allergyArray);
      console.log('   NOTE: Diagnosis, Treatment, Notes will come from Visit API');
      console.log('═══════════════════════════════════════════════════════');
      
      // ONLY extract chronic diseases and allergies from this API
      // Diagnosis, treatment, notes, medications will come from GetPatientVisit API
      const summary = { 
        chronicDiseases: chronicDiseaseArray, 
        allergies: allergyArray,
        diagnosis: '',
        treatment: '',
        medications: '',
        notes: ''
      };
      console.log('📤 SETTING MEDICAL INFO SUMMARY (with empty diagnosis/treatment/notes):');
      console.log(JSON.stringify(summary, null, 2));
      console.log('═══════════════════════════════════════════════════════');
      
      medicalInfoCacheRef.current.set(patientId, summary);
      setMedicalInfoSummary(summary);
      setMedicalInfoError(false);
      setMedicalInfoLoading(false);
    } catch (error) {
      console.error('❌ Failed to load medical info summary:', error);
      setMedicalInfoSummary({ chronicDiseases: [], allergies: [], diagnosis: '', treatment: '', medications: '', notes: '', reasonForVisit: '' });
      setMedicalInfoError(true);
      setMedicalInfoLoading(false);
    } finally {
      clearTimeout(timeoutId);
      medicalInfoInFlightRef.current.delete(patientId);
    }
  }, []);

  useEffect(() => {
    if (!showVisitInfoModal || !selectedAppointmentForVisit?.patientId) return;
    loadMedicalInfoSummary(selectedAppointmentForVisit.patientId);
  }, [showVisitInfoModal, selectedAppointmentForVisit?.patientId]);

  // Load inventory data on component mount
  useEffect(() => {
    console.log('📦 Component mounted, loading inventory data...');
    loadInventoryData();
  }, []);

  // Refresh inventory when dashboard inventory tab is opened
  useEffect(() => {
    if (activeSection === "dashboard" && activeTab === "inventory") {
      loadInventoryData();
    }
  }, [activeSection, activeTab]);

  // 🔥 Debug: Log when about to pass props to VisitInfoModal
  useEffect(() => {
    if (showVisitInfoModal) {
      console.log('🚀 [DOCTORS → MODAL] Passing props to VisitInfoModal:');
      console.log('   chronicDiseases:', medicalInfoSummary.chronicDiseases ? JSON.stringify(medicalInfoSummary.chronicDiseases) : '(empty)');
      console.log('   allergies:', medicalInfoSummary.allergies ? JSON.stringify(medicalInfoSummary.allergies) : '(empty)');
      console.log('   diagnosis:', medicalInfoSummary.diagnosis ? `"${medicalInfoSummary.diagnosis}"` : '(empty)');
      console.log('   treatment:', medicalInfoSummary.treatment ? `"${medicalInfoSummary.treatment}"` : '(empty)');
      console.log('   medications:', medicalInfoSummary.medications ? `"${medicalInfoSummary.medications}"` : '(empty)');
      console.log('   notes:', medicalInfoSummary.notes ? `"${medicalInfoSummary.notes}"` : '(empty)');
      console.log('   loadingMedicalInfo:', medicalInfoLoading);
    }
  }, [showVisitInfoModal, medicalInfoSummary, medicalInfoLoading]);

  // Load master items when inventory modal opens
  useEffect(() => {
    if (showInventoryModal) {
      const loadMasterItems = async () => {
        try {
          const data = await listInventoryMasters();
          setMasterItems(data || []);
        } catch (error) {
          console.error('Error loading master items:', error);
          setMasterItems([]);
        }
      };
      loadMasterItems();
    }
  }, [showInventoryModal]);

  // ============ MANAGE CLINIC API FUNCTIONS ============
  const loadClinicData = async () => {
    const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
    const clinicId = selectedAccess.clinicId;
    if (!clinicId) {
      console.error('❌ Clinic ID not found');
      return;
    }
    
    setLoadingClinicData(true);
    try {
      const data = await getClinicByClinicId([clinicId]);
      console.log('✅ Clinic data loaded:', data);
      setClinicData(data?.[0] || null);
    } catch (error) {
      console.error('❌ Failed to load clinic data:', error);
    } finally {
      setLoadingClinicData(false);
    }
  };

  const loadStaffData = async () => {
    const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
    const clinicId = selectedAccess.clinicId;
    if (!clinicId) {
      console.error('❌ Clinic ID not found');
      return;
    }
    
    setLoadingStaffList(true);
    try {
      const data = await getStaffProfileByClinicId(clinicId);
      console.log('✅ Staff data loaded:', data);
      setStaffList(data || []);
    } catch (error) {
      console.error('❌ Failed to load staff data:', error);
      setStaffList([]);
    } finally {
      setLoadingStaffList(false);
    }
  };

  const loadInventoryData = async () => {
    console.log('🚀 [INVENTORY] loadInventoryData() called');
    const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
    const clinicId = selectedAccess.clinicId;
    console.log('🏥 [INVENTORY] Clinic ID from token:', clinicId);
    
    if (!clinicId) {
      console.error('❌ [INVENTORY] Clinic ID not found in localStorage.selectedAccess');
      return;
    }
    
    setLoadingInventory(true);
    console.log('⏳ [INVENTORY] Set loading state to true, calling API...');
    
    try {
      console.log(`📞 [INVENTORY] Calling getClinicInventoryByClinicId(${clinicId})`);
      const data = await getClinicInventoryByClinicId(clinicId);
      console.log('✅ [INVENTORY] Data loaded successfully:', data);
      setClinicInventory(data || []);
      setInventoryItems(mapClinicInventoryToDashboardItems(data || []));
    } catch (error) {
      console.error('❌ [INVENTORY] Failed to load inventory data:', error);
      setClinicInventory([]);
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleSaveInventoryItem = async () => {
    const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
    const clinicId = selectedAccess.clinicId;
    const enterpriseId = selectedAccess.enterpriseId;
    
    console.log('💾 [INVENTORY] Saving inventory item with token data:', { clinicId, enterpriseId });
    
    if (!clinicId || !enterpriseId) {
      alert('❌ Clinic information not found. Please select a clinic.');
      return;
    }

    if (!inventoryFormData.name.trim()) {
      alert('❌ Please enter item name');
      return;
    }
    
    try {
      // The backend expects itemId (reference to master inventory) AND ItemName
      const payload = {
        itemId: editingInventoryItem?.itemId || editingInventoryItem?.id || 0,
        itemName: inventoryFormData.name.trim(),  // ✅ Backend requires this
        enterpriseId: enterpriseId,
        clinicId: clinicId,
        quantityAvailable: parseInt(inventoryFormData.stock) || 0,
        reorderLevel: parseInt(inventoryFormData.minStock) || 0,
        minimumStock: parseInt(inventoryFormData.minStock) || 0,
        status: 'Active',
        storageLocation: inventoryFormData.storageLocation || 'Storage'
      };
      
      console.log('📤 [INVENTORY] Payload being sent:', payload);
      
      if (editingInventoryItem?.inventoryId || editingInventoryItem?.id) {
        // Update existing item
        console.log('✏️ [INVENTORY] Updating existing inventory item:', editingInventoryItem?.inventoryId || editingInventoryItem?.id);
        const updatePayload = {
          inventoryId: editingInventoryItem?.inventoryId || editingInventoryItem?.id,
          ...payload
        };
        await updateClinicInventory(editingInventoryItem?.inventoryId || editingInventoryItem?.id, updatePayload);
        console.log('✅ Inventory item updated');
      } else {
        // Create new item
        console.log('➕ [INVENTORY] Creating new inventory item');
        await createClinicInventory(payload);
        console.log('✅ Inventory item added');
      }
      
      setShowInventoryModal(false);
      setInventoryFormData({ name: '', category: '', stock: 0, minStock: 0, unitCost: 0, storageLocation: '' });
      setEditingInventoryItem(null);
      await loadInventoryData();
    } catch (error) {
      console.error('❌ Failed to save inventory item:', error);
      alert(`Failed to save inventory item: ${error.message}`);
    }
  };

  const handleDeleteInventoryItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
        const enterpriseId = selectedAccess.enterpriseId;
        const clinicId = selectedAccess.clinicId;
        
        if (!enterpriseId || !clinicId) {
          alert('❌ Enterprise ID or Clinic ID not found. Please login again.');
          return;
        }
        
        console.log(`🗑️ Deleting inventory item:`, { enterpriseId, clinicId, itemId });
        await deleteClinicInventory(enterpriseId, clinicId, itemId);
        console.log('✅ Inventory item deleted');
        await loadInventoryData();
      } catch (error) {
        console.error('❌ Failed to delete inventory item:', error);
        alert('Failed to delete inventory item');
      }
    }
  };

  const handleAddMasterItems = async (validRows) => {
    try {
      console.log('📋 Adding master inventory items:', validRows);
      setLoadingMasterModal(true);
      
      const payload = validRows.map((row) => ({
        itemCode: row.itemCode,
        itemName: row.itemName,
        category: row.category,
        subCategory: row.subCategory,
        unit: row.unit,
        cgst: Number(row.cgst) || 0,
        sgst: Number(row.sgst) || 0,
        description: row.description || '',
      }));
      
      console.log('📦 Payload being sent to API:', payload);
      await addInventoryMasterItemsBulk(payload);
      console.log('✅ Items added to master inventory successfully');
      
      // Refresh master items list
      const updatedMasterItems = await listInventoryMasters();
      setMasterItems(updatedMasterItems || []);
      
      // Get the first added item name to pre-select it
      const firstAddedItemName = validRows[0]?.itemName || '';
      
      // Close the Add to Master modal but keep inventory modal open
      setShowAddMasterFromAutocomplete(false);
      setAutocompleteNewItemName('');
      setLoadingMasterModal(false);
      
      // Update the autocomplete field with the first added item
      if (firstAddedItemName) {
        // Find the newly added item in the master items
        const newItem = updatedMasterItems?.find(item => item.itemName === firstAddedItemName);
        if (newItem) {
          setInventoryFormData({
            ...inventoryFormData,
            itemId: newItem.id,
            name: newItem.itemName,
            category: newItem.category,
            unit: newItem.unit,
            subCategory: newItem.subCategory,
          });
        }
      }
      
      // Show success modal instead of alert
      setSuccessModalData({ itemCount: validRows.length });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error adding master items:', error);
      alert(`Failed to add items: ${error.message}`);
      setLoadingMasterModal(false);
    }
  };

  const handleAddMedication = useCallback(() => {
    console.log('➕ Attempting to add medication:', currentMedication);
    if (!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency || !currentMedication.duration) {
      alert('❌ Please fill in all required fields (Name, Dosage, Frequency, Duration)');
      return;
    }

    if (editingMedicationIndex !== null) {
      // Update existing medication
      const updated = [...inlineMedications];
      updated[editingMedicationIndex] = { ...currentMedication };
      setInlineMedications(updated);
      console.log('✏️ Updated medication at index', editingMedicationIndex, ':', updated[editingMedicationIndex]);
      console.log('📋 Total medications after update:', updated.length);
      setEditingMedicationIndex(null);
    } else {
      // Add new medication
      const newMeds = [...inlineMedications, { ...currentMedication }];
      setInlineMedications(newMeds);
      console.log('✅ Added new medication. Total count:', newMeds.length);
      console.log('📋 Current medications list:', newMeds);
    }

    // Reset form
    setCurrentMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setShowMedicationDropdown(false);
  }, [currentMedication, editingMedicationIndex, inlineMedications]);

  const handleEditMedication = useCallback((index) => {
    setCurrentMedication({ ...inlineMedications[index] });
    setEditingMedicationIndex(index);
  }, [inlineMedications]);

  const handleRemoveMedication = useCallback((index) => {
    setInlineMedications(inlineMedications.filter((_, i) => i !== index));
  }, [inlineMedications]);

  const handleCancelEdit = useCallback(() => {
    setCurrentMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setEditingMedicationIndex(null);
    setShowMedicationDropdown(false);
  }, []);

  const handleAddNewMedicine = useCallback(async () => {
    if (!newMedicineForm.itemName || !newMedicineForm.itemCode) {
      const warningMessages = [
        '🤔 Hold up! We need a name and code for this medicine!',
        '⚠️ Whoa there! Medicine name and code are mandatory!',
        '🚫 Not so fast! Fill in the name and code first!'
      ];
      setMedicineSaveMessage(warningMessages[Math.floor(Math.random() * warningMessages.length)]);
      setShowMedicineSaveSuccess(true);
      return;
    }

    try {
      // Create the new medicine in inventory
      const newMed = await createInventoryMaster({
        itemName: newMedicineForm.itemName,
        itemCode: newMedicineForm.itemCode,
        category: newMedicineForm.category,
        subCategory: newMedicineForm.subCategory,
        unit: newMedicineForm.unit,
        isActive: true
      });

      console.log('✅ New medicine created:', newMed);

      // Reload inventory to get the latest list
      await loadInventoryMedications();
      
      // Auto-select the newly added medicine in the current medication form
      setCurrentMedication(prev => ({
        ...prev,
        name: newMed.itemName || newMedicineForm.itemName
      }));
      
      // Close the modal
      setShowAddMedicineModal(false);
      
      // Reset the form for next use
      setNewMedicineForm({
        itemName: '',
        itemCode: '',
        category: 'Medicines',
        subCategory: 'General',
        unit: 'tablet'
      });
      
      // Show success modal with funny message
      const funnyMessages = [
        `🎉 Boom! ${newMed.itemName || newMedicineForm.itemName} joined the medicine gang!`,
        `💊 Cha-ching! ${newMed.itemName || newMedicineForm.itemName} is now in your arsenal!`,
        `✨ Wham! ${newMed.itemName || newMedicineForm.itemName} is locked and loaded!`,
        `🎯 Bullseye! ${newMed.itemName || newMedicineForm.itemName} is ready for action!`,
        `🚀 ${newMed.itemName || newMedicineForm.itemName} launched into inventory at warp speed!`,
        `🏆 Victory! ${newMed.itemName || newMedicineForm.itemName} is standing by!`,
        `⭐ Sweet! ${newMed.itemName || newMedicineForm.itemName} has entered the chat!`
      ];
      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setMedicineSaveMessage(randomMessage);
      setShowMedicineSaveSuccess(true);
      
      // Focus back on the diagnosis form
      setShowMedicationDropdown(false);
      
    } catch (error) {
      console.error('Failed to add medicine:', error);
      setMedicineSaveMessage('❌ Failed to add medicine to inventory. Please try again.');
      setShowMedicineSaveSuccess(true);
    }
  }, [newMedicineForm, loadInventoryMedications]);

  // Memoized handler for medication selection
  const handleMedicationSelect = useCallback((medicineItem) => {
    setCurrentMedication(prev => ({ ...prev, name: medicineItem.itemName }));
    setShowMedicationDropdown(false);
  }, []);

  // Medicine name handler - updates immediately for dropdown search
  const handleMedicationNameChange = useCallback((value) => {
    console.log('🔵 Medicine name changing:', value);
    setCurrentMedication(prev => ({ ...prev, name: value }));
    setShowMedicationDropdown(true); // Always show dropdown when typing
  }, []);

  // Blur handlers - only update state when user finishes typing (on blur)
  const handleDosageBlur = useCallback((value) => {
    console.log('🟢 Dosage finalized:', value);
    setCurrentMedication(prev => ({ ...prev, dosage: value }));
  }, []);

  const handleDurationBlur = useCallback((value) => {
    console.log('🟠 Duration finalized:', value);
    setCurrentMedication(prev => ({ ...prev, duration: value }));
  }, []);

  const handleInstructionsBlur = useCallback((value) => {
    console.log('🟣 Instructions finalized:', value);
    setCurrentMedication(prev => ({ ...prev, instructions: value }));
  }, []);

  // Frequency handler - updates immediately (dropdown selection)
  const handleFrequencyChange = useCallback((value) => {
    console.log('🟡 Frequency selected:', value);
    setCurrentMedication(prev => ({ ...prev, frequency: value }));
  }, []);

  // Memoized handler to open add medicine modal
  const handleOpenAddMedicineModal = useCallback((medicineItemName = '') => {
    setNewMedicineForm({
      itemName: medicineItemName || currentMedication.name,
      itemCode: '',
      category: 'Medicines',
      subCategory: 'General',
      unit: 'tablet'
    });
    setShowAddMedicineModal(true);
    setShowMedicationDropdown(false);
  }, [currentMedication.name]);

  // SIMPLE INLINE FORM - NO NESTED COMPONENT
  // Medication form is now inline in the JSX for simpler state management
  // Removed renderMedicationForm function to prevent closure issues
  
  const renderMedicationFormOLD_UNUSED = () => {
    return (
    <div className="bg-white rounded-xl p-5 mb-5 border-2 border-indigo-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Medicine Name Searchable Dropdown */}
        <div className="md:col-span-2" ref={medicineInputRef}>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={currentMedication.name || ""}
              onChange={(e) => {
                setCurrentMedication(prev => ({ ...prev, name: e.target.value }));
                if (!medicineDropdownOpen) setMedicineDropdownOpen(true);
              }}
              onFocus={() => {
                if (inventoryMeds.length === 0 && !loadingMeds) {
                  loadInventoryMedications();
                }
                setMedicineDropdownOpen(true);
              }}
              placeholder="Search or type medication name..."
              className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              autoComplete="off"
            />
            {currentMedication.name && !medicineDropdownOpen && (
              <div className="mt-1 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-sm">
                <span className="text-green-700">✓ Selected:</span> <span className="font-bold text-stone-900">{currentMedication.name}</span>
              </div>
            )}
            
            {/* Dropdown Panel */}
            {medicineDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border-2 border-indigo-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {loadingMeds ? (
                  <div className="px-3 py-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-stone-600 font-medium">Loading medicines...</p>
                  </div>
                ) : inventoryMeds.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-stone-600 mb-4">No medicines in inventory. Add one to get started!</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAddMedicineModal(currentMedication.name);
                        setMedicineDropdownOpen(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Inventory
                    </button>
                  </div>
                ) : (
                  <>
                    {inventoryMeds
                      .filter(med => {
                        const searchVal = (currentMedication.name || "").toLowerCase();
                        return !searchVal || med.itemName?.toLowerCase().includes(searchVal) || med.itemCode?.toLowerCase().includes(searchVal);
                      })
                      .map((m) => (
                      <button
                        type="button"
                        key={m.itemId || m.id}
                        onClick={() => {
                          setCurrentMedication(prev => ({ ...prev, name: m.itemName }));
                          setMedicineDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition border-b border-indigo-50 last:border-b-0 focus:outline-none focus:bg-indigo-100"
                      >
                        <div className="font-semibold text-stone-800">{m.itemName}{m.itemCode ? ` (${m.itemCode})` : ""}</div>
                        <div className="text-xs text-stone-500 flex gap-3 flex-wrap">
                          {m.category && <span>Category: {m.category}</span>}
                          {m.unit && <span>Unit: {m.unit}</span>}
                          <span>CGST: {Number(m.cgst) || 0}%</span>
                          <span>SGST: {Number(m.sgst) || 0}%</span>
                        </div>
                      </button>
                    ))}
                    {/* Add New Medicine Button at Bottom */}
                    <div className="sticky bottom-0 bg-gradient-to-r from-slate-100 to-indigo-100 p-3 border-t border-indigo-200">
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAddMedicineModal(currentMedication.name);
                          setMedicineDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Medicine
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Dosage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={currentMedication.dosage || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
            placeholder="e.g., 500mg, 1 tablet"
            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            autoComplete="off"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            value={currentMedication.frequency || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select frequency...</option>
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Four times daily">Four times daily</option>
            <option value="Every 4 hours">Every 4 hours</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="Every 12 hours">Every 12 hours</option>
            <option value="Before meals">Before meals</option>
            <option value="After meals">After meals</option>
            <option value="At bedtime">At bedtime</option>
            <option value="As needed">As needed</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={currentMedication.duration || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
            placeholder="e.g., 7 days, 2 weeks"
            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            autoComplete="off"
          />
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Special Instructions
          </label>
          <input
            type="text"
            value={currentMedication.instructions || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="e.g., Take with food, Avoid alcohol"
            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Add/Update Button */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddMedication}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
        >
          <span>{editingMedicationIndex !== null ? '✏️' : '➕'}</span>
          <span>{editingMedicationIndex !== null ? 'Update Medication' : 'Add Medication'}</span>
        </motion.button>
        {editingMedicationIndex !== null && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancelEdit}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition"
          >
            Cancel
          </motion.button>
        )}
      </div>
    </div>
    );
  };

  const handleSaveAllPrescriptions = async () => {
    if (inlineMedications.length === 0) {
      alert('❌ Please add at least one medication');
      return;
    }

    try {
      const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const appointmentDetails = selectedAppointmentForVisit;

      const enterpriseId = parseInt(selectedAccess.enterpriseId || 0);
      const clinicId = parseInt(selectedAccess.clinicId || 0);
      const appointmentIdNum = parseInt(appointmentDetails?.appointmentId || 0);
      const doctorId = parseInt(appointmentDetails?.doctorId || 0);
      const patientId = parseInt(appointmentDetails?.patientId || 0);
      const visitId = parseInt(appointmentDetails?.visitId || 0);

      if (enterpriseId === 0 || clinicId === 0 || appointmentIdNum === 0 || doctorId === 0) {
        alert('❌ Missing required IDs to save prescription');
        return;
      }

      const now = new Date().toISOString();
      const savedPrescriptions = [];

      for (const med of inlineMedications) {
        const payload = {
          medicationId: 0,
          enterpriseId: enterpriseId,
          clinicId: clinicId,
          appointmentId: appointmentIdNum,
          visitId: visitId,
          doctorId: doctorId,
          patientId: patientId,
          medicineName: String(med.name).trim(),
          dosage: String(med.dosage).trim(),
          frequency: String(med.frequency).trim(),
          duration: String(med.duration).trim(),
          specialInstructions: String(med.instructions || "").trim(),
          generalPrescriptionNotes: "",
          createdAt: now,
          createdBy: String(userData.username || userData.fullName || "Doctor").trim(),
          updatedAt: now,
          updatedBy: String(userData.username || userData.fullName || "Doctor").trim()
        };

        const result = await addPrescription(payload);
        savedPrescriptions.push(result);
        
        // Capture first prescription ID
        if (savedPrescriptions.length === 1 && result.prescriptionId) {
          setPrescriptionId(result.prescriptionId);
        }
      }

      const funnyMessages = [
        "🎉 Medications saved! The germs don't stand a chance!",
        "💊 Success! Prescription documented and ready to heal!",
        "✅ Boom! All medications saved to the system!",
        "🏥 Perfect! Your prescription is now part of medical history!",
        "📋 Done! Medications locked and loaded!",
        "💉 Nailed it! Prescription saved successfully!",
        "🎯 Medications saved with precision! Well done!",
        "🚀 Prescription entered at warp speed! All set!"
      ];
      
      const funnyMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      alert(funnyMessage);

      // Update visit form prescriptions field
      const prescriptionText = inlineMedications
        .map(med => `${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}${med.instructions ? ` (${med.instructions})` : ""}`)
        .join("\n");
      
      handleVisitFormChange('prescriptions', prescriptionText);

      // Clear inline medications after successful save
      setInlineMedications([]);
      
    } catch (error) {
      console.error('Failed to save prescriptions:', error);
      alert('❌ Failed to save prescriptions. Please try again.');
    }
  };

  const handleSavePrescription = async (prescriptionData) => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const doctorInfo = {
        doctorId: userData.doctorId || 0,
        doctorName: userData.username || "Doctor",
        registrationNumber: userData.registrationNumber || ""
      };

      // Create prescription record with the old endpoint for compatibility
      await createPrescription({
        visitId: 0,
        ...prescriptionData,
        ...doctorInfo
      });

      // Store prescription data for viewing/editing
      setCurrentPrescription(prescriptionData);
      setShowPrescriptionWritingModal(false);

      // Show the success message from the modal
      if (prescriptionData.successMessage) {
        // Already shown in modal, no need to show again
      }

      // Redirect back to the diagnosis/visit form so user can continue
      setShowVisitInfoModal(true);
    } catch (error) {
      console.error("Failed to save prescription:", error);
      throw error;
    }
  };

  const handlePrintPrescription = () => {
    if (currentPrescription) {
      console.group('%c📋 PRINT PRESCRIPTION HANDLER', 'color: blue; font-weight: bold; font-size: 14px');
      console.log('✅ Current prescription found')
      console.log('📝 Prescription content length:', currentPrescription.prescriptionContent?.length || 'N/A');
      console.log('📅 Prescription date:', currentPrescription.prescriptionDate);
      console.log('Full prescription object:', currentPrescription);
      console.groupEnd();
      setPrescriptionToPrint(currentPrescription);
      setShowPrescriptionPrintModal(true);
    } else {
      console.error('%c❌ No prescription found', 'color: red; font-weight: bold');
      alert("❌ No prescription found to print");
    }
  };

  const dashboardTabs = [
    { key: "overview", label: "Overview", icon: "📊", gradient: "from-indigo-500 to-purple-600" },
    { key: "schedule", label: "Schedule", icon: "📅", gradient: "from-indigo-500 to-purple-600" },
    { key: "clinic", label: "Clinic Details", icon: "🏥", gradient: "from-purple-500 to-pink-600" },
    { key: "patients", label: "My Patients", icon: "👥", gradient: "from-indigo-500 to-purple-600" },
    { key: "payments", label: "Payments", icon: "💳", gradient: "from-purple-500 to-pink-600" },
    { key: "serviceBilling", label: "Service Billing", icon: "💰", gradient: "from-blue-500 to-indigo-600" },
    { key: "appointments", label: "Appointments", icon: "📅", gradient: "from-indigo-600 to-purple-600" }
  ];

  const manageClinicTabs = [
    { key: "settings", label: "Clinic Settings", icon: "⚙️", gradient: "from-indigo-500 to-purple-600" },
    { key: "staff", label: "Staff Management", icon: "👔", gradient: "from-purple-500 to-pink-600" },
    { key: "billing", label: "Billing & Insurance", icon: "💰", gradient: "from-indigo-500 to-purple-600" },
    { key: "inventory", label: "Inventory", icon: "📦", gradient: "from-purple-500 to-pink-600" },
    { key: "reports", label: "Reports & Analytics", icon: "📈", gradient: "from-indigo-500 to-purple-600" },
    { key: "equipment", label: "Equipment & Assets", icon: "🔧", gradient: "from-purple-500 to-pink-600" }
  ];

  const tabs = activeSection === "dashboard" ? dashboardTabs : manageClinicTabs;

  const getStatusColor = (status) => {
    const colors = {
      "Active": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Pending": "bg-amber-100 text-amber-700 border-amber-200",
      "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Overdue": "bg-rose-100 text-rose-700 border-rose-200",
      "Confirmed": "bg-blue-100 text-blue-700 border-blue-200",
      "Cancelled": "bg-stone-200 text-stone-600 border-stone-300",
      "In Stock": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Low Stock": "bg-amber-100 text-amber-700 border-amber-200",
      "Critical": "bg-rose-100 text-rose-700 border-rose-200"
    };
    return colors[status] || "bg-stone-100 text-stone-600 border-stone-200";
  };

  // Validate date range for appointments
  const validateAppointmentDateRange = () => {
    setAppointmentDateValidationError("");

    // To Date must be >= From Date (this is enforced by the min attribute on the input)
    if (appointmentStartDate && appointmentEndDate) {
      const fromDate = new Date(appointmentStartDate);
      const toDate = new Date(appointmentEndDate);

      if (toDate < fromDate) {
        setAppointmentDateValidationError("❌ 'To Date' must be greater than or equal to 'From Date'");
        return false;
      }
    }

    return true;
  };

  // Search appointments by date range with client-side filtering
  const searchAppointmentsByDateRange = async () => {
    // Validate before searching
    if (!validateAppointmentDateRange()) {
      return; // Validation failed, error message already set
    }

    try {
      setLoadingAppointments(true);
      setViewingMyAppointments(false);

      console.log("🔍 Searching appointments with date range:");
      console.log("   From Date:", appointmentStartDate);
      console.log("   To Date:", appointmentEndDate || "(not set)");

      // Fetch all appointments and filter client-side
      const allAppointments = await getCalendarAppointments();
      
      // Filter by selected date range
      const filteredData = (allAppointments || []).filter(appt => {
        if (!appt.appointmentDate) return false;
        
        // Extract just the date part from appointmentDate
        const apptDateOnly = appt.appointmentDate.split('T')[0];
        
        // Convert dates to comparable format (YYYY-MM-DD)
        const startDate = new Date(appointmentStartDate);
        const apptDate = new Date(apptDateOnly);
        
        // Check if appointment is on or after start date
        if (apptDate < startDate) return false;
        
        // Check if end date is set and appointment is before or on end date
        if (appointmentEndDate) {
          const endDate = new Date(appointmentEndDate);
          if (apptDate > endDate) return false;
        }
        
        return true;
      });

      console.log(`✅ Search results: ${filteredData.length} appointments found`);
      setRealAppointments(filteredData);

      if (!filteredData || filteredData.length === 0) {
        alert("ℹ️ No appointments found for the selected date range");
      }
    } catch (error) {
      console.error("❌ Error searching appointments:", error);
      alert("❌ Failed to search appointments. Please try again.");
      setRealAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Define loadAllAppointments before the useEffect that uses it
  const loadAllAppointments = useCallback(() => {
    setLoadingAppointments(true);
    getCalendarAppointments()
      .then(data => {
        console.log('📅 Loaded all appointments:', data?.length || 0);
        console.log('🔍 Filtering by date range:');
        console.log('   Start Date:', appointmentStartDate);
        console.log('   End Date:', appointmentEndDate || '(Optional - not set)');
        console.log('   Status Filter:', selectedAppointmentStatus);
        
        // Filter by selected date range and status
        const filteredData = data.filter(appt => {
          if (!appt.appointmentDate) return false;
          
          // Extract just the date part from appointmentDate
          const apptDateOnly = appt.appointmentDate.split('T')[0];
          
          // Convert dates to comparable format (YYYY-MM-DD)
          const startDate = new Date(appointmentStartDate);
          const apptDate = new Date(apptDateOnly);
          
          // Check if appointment is on or after start date
          if (apptDate < startDate) return false;
          
          // Check if end date is set and appointment is before or on end date
          if (appointmentEndDate) {
            const endDate = new Date(appointmentEndDate);
            if (apptDate > endDate) return false;
          }

          // Filter by status
          if (selectedAppointmentStatus !== "All") {
            const appointmentStatus = appt.status || "Scheduled";
            if (appointmentStatus !== selectedAppointmentStatus) return false;
          }
          
          return true;
        });
        
        console.log(`✅ Filtered appointments: ${filteredData.length} out of ${data.length} total`);
        
        // Always show filtered results (empty list if no matches)
        setRealAppointments(filteredData);
      })
      .catch(err => {
        console.error('Failed to load appointments:', err);
        setRealAppointments([]);
      })
      .finally(() => setLoadingAppointments(false));
  }, [appointmentStartDate, appointmentEndDate, selectedAppointmentStatus]); // Memoized with date range and status dependencies

  // Load real appointments when appointments tab is active
  useEffect(() => {
    // Don't reload appointments while editing to prevent background refresh
    if (showEditModal) {
      console.log("⏸️ Skipping appointment reload - edit modal is open");
      return;
    }
    
    if (activeSection === "dashboard" && activeTab === "appointments") {
      loadAllAppointments();
    }
  }, [activeSection, activeTab, appointmentStartDate, appointmentEndDate, selectedAppointmentStatus, loadAllAppointments, showEditModal]);

  // Load appointments for dashboard overview (with status filter if applied)
  useEffect(() => {
    if (activeSection === "dashboard" && activeTab === "overview") {
      console.log("📊 Loading all appointments for dashboard overview");
      setLoadingAppointments(true);
      getCalendarAppointments()
        .then(data => {
          console.log('📅 Loaded all appointments for dashboard:', data?.length || 0);
          // Filter by status if one is selected
          let filteredData = data || [];
          if (selectedAppointmentStatus !== "All") {
            filteredData = filteredData.filter(appt => (appt.status || 'Scheduled') === selectedAppointmentStatus);
          }
          setRealAppointments(filteredData);
        })
        .catch(err => {
          console.error('Failed to load appointments for dashboard:', err);
          setRealAppointments([]);
        })
        .finally(() => setLoadingAppointments(false));
    }
  }, [activeSection, activeTab]);

  const loadMyAppointments = () => {
    // Get clinic ID from selected access (most reliable source)
    const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const clinicId = selectedAccess.clinicId || parseInt(localStorage.getItem('clinicId') || '0');
    // For doctors, userId IS the doctorId
    const doctorId = userData.userId;

    console.log('🔍 Loading My Appointments - Using GetAppointmentById API');
    console.log('   Clinic ID:', clinicId);
    console.log('   Doctor ID (from userData.userId):', doctorId);
    console.log('   Date:', appointmentDate);

    if (!clinicId) {
      alert('❌ Unable to load your appointments. Clinic ID not found. Please ensure you are logged in.');
      return;
    }

    if (!doctorId) {
      console.error('❌ Doctor ID not found');
      console.error('   userData:', userData);
      console.error('   selectedAccess:', selectedAccess);
      alert('❌ Unable to load your appointments. Doctor ID not found. Please ensure you are logged in with a doctor account.');
      return;
    }

    setLoadingAppointments(true);
    setViewingMyAppointments(true);
    
    // Get appointments and filter by date range
    getCalendarAppointments()
      .then(data => {
        console.log('👨‍⚕️ Loaded all appointments for filtering:', data?.length || 0);
        console.log('   Filtering for doctor ID:', doctorId);
        console.log('   Date range: ', appointmentStartDate, ' to ', appointmentEndDate || '(end of time)');
        
        // Filter for doctor's appointments within date range
        const filteredData = (data || []).filter(appt => {
          // Check if appointment belongs to this doctor
          if (appt.doctorId !== doctorId) return false;
          if (!appt.appointmentDate) return false;
          
          // Extract just the date part from appointmentDate
          const apptDateOnly = appt.appointmentDate.split('T')[0];
          
          // Convert dates to comparable format (YYYY-MM-DD)
          const startDate = new Date(appointmentStartDate);
          const apptDate = new Date(apptDateOnly);
          
          // Check if appointment is on or after start date
          if (apptDate < startDate) return false;
          
          // Check if end date is set and appointment is before or on end date
          if (appointmentEndDate) {
            const endDate = new Date(appointmentEndDate);
            if (apptDate > endDate) return false;
          }
          
          return true;
        });
        
        console.log('✅ Filtered my appointments: ', filteredData.length, ' out of ', data?.length || 0);
        setRealAppointments(filteredData);
      })
      .catch(err => {
        console.error('Failed to load my appointments:', err);
        console.error('Error details:', err.message);
        alert('❌ Failed to load your appointments: ' + (err.message || 'Unknown error'));
        setRealAppointments([]);
      })
      .finally(() => setLoadingAppointments(false));
  };

  // Cancel appointment
  const cancelAppointment = async (appt) => {
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to cancel this appointment for ${appt.firstName} ${appt.lastName}?`)) {
      return;
    }

    try {
      const cancelledAppointment = {
        ...appt,
        status: "Cancelled"
      };

      console.log("❌ Cancelling appointment:", appt.appointmentId);
      console.log("📤 Sending update request with status: Cancelled");

      await updateAppointment(cancelledAppointment);

      console.log("✅ Appointment cancelled successfully");
      alert(`✅ Appointment for ${appt.firstName} ${appt.lastName} has been cancelled.`);

      // Reload appointments to reflect the change
      loadAllAppointments();
    } catch (error) {
      console.error("❌ Error cancelling appointment:", error);
      alert(`❌ Failed to cancel appointment: ${error.message || 'Unknown error'}`);
    }
  };

  // Get unique appointment statuses for filter buttons
  const getAppointmentStatuses = useCallback(() => {
    const statuses = new Set(realAppointments.map(appt => appt.status || 'Scheduled'));
    return ['All', ...Array.from(statuses).sort()];
  }, [realAppointments]);

  // Payment management functions
  const loadPaymentAppointments = async () => {
    const clinicId = paymentClinicId || parseInt(localStorage.getItem('clinicId') || '0');
    
    if (!clinicId) {
      alert('❌ Please select a clinic to load payments.');
      return;
    }

    setLoadingPayments(true);
    try {
      console.log('💳 Loading payment appointments with date range:');
      console.log('   Start Date:', paymentStartDate);
      console.log('   End Date:', paymentEndDate || '(Optional - not set)');
      console.log('   Clinic ID:', clinicId);
      
      // Get all appointments and filter by date range
      const data = await getCalendarAppointments();
      
      // Filter by clinic, payment status, and date range
      const filteredData = (data || []).filter(appt => {
        // Check clinic
        if (appt.clinicId !== clinicId) return false;
        if (!appt.appointmentDate) return false;
        
        // Extract just the date part from appointmentDate
        const apptDateOnly = appt.appointmentDate.split('T')[0];
        
        // Convert dates to comparable format (YYYY-MM-DD)
        const startDate = new Date(paymentStartDate);
        const apptDate = new Date(apptDateOnly);
        
        // Check if appointment is on or after start date
        if (apptDate < startDate) return false;
        
        // Check if end date is set and appointment is before or on end date
        if (paymentEndDate) {
          const endDate = new Date(paymentEndDate);
          if (apptDate > endDate) return false;
        }
        
        return true;
      });
      
      console.log('💳 Loaded and filtered appointments for payments:', filteredData?.length || 0, 'out of', data?.length || 0);
      setPaymentAppointments(filteredData || []);
    } catch (error) {
      console.error('Failed to load payment appointments:', error);
      alert('❌ Failed to load payments. Please try again.');
      setPaymentAppointments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleUpdatePaymentStatus = async (appointmentId, newStatus) => {
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
  };

  // Open edit payment modal
  const openEditPaymentModal = (appointment) => {
    setEditingPaymentAppointment(appointment);
    setEditPaymentForm({
      billableAmount: appointment.billableAmount || 0,
      paidAmount: appointment.paidAmount || 0,
      pendingAmount: appointment.pendingAmount || 0,
      paymentStatus: appointment.paymentStatus || 'Pending',
      appointmentStatus: appointment.appointmentStatus || 'Scheduled'
    });
    setShowEditPaymentModal(true);
  };

  // Save edited payment details
  const handleSavePaymentEdit = async () => {
    if (!editingPaymentAppointment) return;
    
    setSavingPaymentEdit(true);
    try {
      // Ensure amounts make sense
      const billable = parseFloat(editPaymentForm.billableAmount) || 0;
      const paid = parseFloat(editPaymentForm.paidAmount) || 0;
      const pending = billable - paid;

      const updatedAppointment = {
        ...editingPaymentAppointment,
        billableAmount: billable,
        paidAmount: Math.min(paid, billable),
        pendingAmount: Math.max(pending, 0),
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

      // Show funny success popup instead of alert
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
  };

  // Load payments when tab is active
  useEffect(() => {
    if (activeTab === 'payments') {
      const clinicId = parseInt(localStorage.getItem('clinicId') || '0');
      if (clinicId) {
        setPaymentClinicId(clinicId.toString());
      }
    }
  }, [activeTab]);

  // Load my patients when tab is active
  useEffect(() => {
    if (activeTab === 'patients') {
      loadMyPatients();
    }
  }, [activeTab, myPatientsSelectedClinic]);

  // Load doctor clinics when clinic tab is active
  const loadDoctorClinicsCallback = useCallback(async () => {
    setLoadingClinicDetails(true);
    try {
      const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
      const doctorId = selectedAccess.staffId || parseInt(localStorage.getItem('doctorId') || '0');
      
      if (!doctorId) {
        console.warn('No doctor ID found in localStorage');
        setDoctorClinics([]);
        setSelectedClinicForView(null);
        setLoadingClinicDetails(false);
        return;
      }

      // Get clinic IDs from login token payload
      const clinicIds = selectedAccess.clinicIds || [];
      
      if (Array.isArray(clinicIds) && clinicIds.length > 0) {
        console.log('📍 Loading clinics from token payload:', clinicIds);
        // Fetch clinic details for each clinic ID from token
        const clinicsData = [];
        for (const clinicId of clinicIds) {
          try {
            const clinicData = await getClinicByClinicId(clinicId);
            clinicsData.push(clinicData);
          } catch (error) {
            console.warn(`Failed to load clinic ${clinicId}:`, error);
          }
        }
        
        setDoctorClinics(clinicsData);
        if (clinicsData.length > 0) {
          setSelectedClinicForView(clinicsData[0].clinicId);
          setSelectedClinicDetails(clinicsData[0]);
        }
      } else {
        console.log('📍 No clinic IDs in token, fetching from appointments');
        // Fallback: fetch from the appointment data to get clinic IDs the doctor works with
        const doctorAppointments = await getAppointmentsByDoctorID(doctorId);
        
        if (Array.isArray(doctorAppointments) && doctorAppointments.length > 0) {
          // Get unique clinic IDs from appointments
          const uniqueClinicIds = [...new Set(doctorAppointments.map(apt => apt.clinicId).filter(id => id))];
          
          // Fetch clinic details for each unique clinic
          const clinicsData = [];
          for (const clinicId of uniqueClinicIds) {
            try {
              const clinicData = await getClinicByClinicId(clinicId);
              clinicsData.push(clinicData);
            } catch (error) {
              console.warn(`Failed to load clinic ${clinicId}:`, error);
            }
          }
          
          setDoctorClinics(clinicsData);
          if (clinicsData.length > 0) {
            setSelectedClinicForView(clinicsData[0].clinicId);
            setSelectedClinicDetails(clinicsData[0]);
          }
        } else {
          setDoctorClinics([]);
          setSelectedClinicForView(null);
        }
      }
    } catch (error) {
      console.error('Failed to load doctor clinics:', error);
      setDoctorClinics([]);
      setSelectedClinicForView(null);
    } finally {
      setLoadingClinicDetails(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'clinic' && activeSection === 'dashboard') {
      loadDoctorClinicsCallback();
    }
  }, [activeTab, activeSection, loadDoctorClinicsCallback]);

  // Navigate to Service Billing page when tab is selected
  useEffect(() => {
    if (activeTab === 'serviceBilling' && activeSection === 'dashboard') {
      navigate('/service-billing');
    }
  }, [activeTab, activeSection, navigate]);

  // Load my patients function
  const loadMyPatients = async () => {
    const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
    const clinicId = myPatientsSelectedClinic || selectedAccess.clinicId;

    if (!clinicId) {
      return;
    }

    setLoadingMyPatients(true);
    try {
      const data = await getPatientsByClinic(parseInt(clinicId));
      console.log('✅ Loaded patients for clinic:', clinicId, data);
      setMyPatients(data || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
      setMyPatients([]);
    } finally {
      setLoadingMyPatients(false);
    }
  };

  // Filter my patients by search text
  const filteredMyPatients = myPatients.filter(patient => {
    const searchLower = myPatientsFilterText.toLowerCase();
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
    return fullName.includes(searchLower) || (patient.patientId?.toString() || '').includes(searchLower);
  });

  const fetchAppointmentDetails = async (appt) => {
    try {
      const detailedData = await getAppointment(appt.appointmentId);
      console.log('📥 Fetched detailed appointment data:', detailedData);
      return detailedData;
    } catch (error) {
      console.error('Failed to load appointment details:', error);
      return appt;
    }
  };

  // ✅ Using the hoisted FullEditAppointmentModal component (defined at top of file)
  // The modal is now defined outside this function to prevent recreation on every render

  // Old Edit Appointment Modal Component (keeping for reference, can be removed later)
  const EditAppointmentModal = () => {
    if (!editModalOpen || !selectedAppointment) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setEditModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  ✏️ Edit Appointment
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Appointment Details */}
              <div className="bg-gradient-to-r from-slate-100 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Appointment Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-stone-600">Patient:</span> <span className="text-stone-800">{selectedAppointment.patient}</span></p>
                  <p><span className="font-medium text-stone-600">Type:</span> <span className="text-stone-800">{selectedAppointment.type}</span></p>
                  <p><span className="font-medium text-stone-600">Current Date:</span> <span className="text-stone-800">{selectedAppointment.date}</span></p>
                  <p><span className="font-medium text-stone-600">Current Time:</span> <span className="text-stone-800">{selectedAppointment.time}</span></p>
                  <p><span className="font-medium text-stone-600">Status:</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Select Action</label>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditAction("cancel")}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      editAction === "cancel" 
                        ? "bg-red-50 border-red-500 text-red-700" 
                        : "bg-white border-stone-200 text-stone-700 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚫</span>
                      <div>
                        <p className="font-semibold">Cancel Appointment</p>
                        <p className="text-xs opacity-70">Mark this appointment as cancelled</p>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditAction("reschedule")}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      editAction === "reschedule" 
                        ? "bg-blue-50 border-blue-500 text-blue-700" 
                        : "bg-white border-stone-200 text-stone-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="font-semibold">Reschedule Appointment</p>
                        <p className="text-xs opacity-70">Change the date and time</p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Reschedule Inputs - Conditional */}
              <AnimatePresence>
                {editAction === "reschedule" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">New Date</label>
                      <input
                        type="date"
                        value={rescheduleData.date}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">New Time</label>
                      <input
                        type="time"
                        value={rescheduleData.time}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 border-t border-stone-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (editAction === "cancel") {
                    handleCancelAppointment();
                  } else if (editAction === "reschedule") {
                    handleRescheduleAppointment();
                  }
                }}
                disabled={!editAction || (editAction === "reschedule" && (!rescheduleData.date || !rescheduleData.time))}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition shadow-md ${
                  !editAction || (editAction === "reschedule" && (!rescheduleData.date || !rescheduleData.time))
                    ? "bg-stone-300 cursor-not-allowed"
                    : editAction === "cancel"
                    ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                }`}
              >
                {editAction === "cancel" ? "Confirm Cancel" : editAction === "reschedule" ? "Save Changes" : "Select Action"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Visit Info Modal Component - IMPROVED DIAGNOSIS FORM - FIXED FOCUS LOSS
  // Using React.memo to prevent recreation on every parent re-render (like when typing)
  const VisitInfoModal = React.useMemo(() => React.memo(() => {
    if (!showVisitInfoModal || !selectedAppointmentForVisit) return null;

    const [visitForm, setVisitForm] = useState({
      visitDate: new Date().toISOString().split('T')[0],
      chiefComplaint: '',
      diagnosis: '',
      treatmentProvided: '',
      prescriptions: '',
      followUpDate: '',
      notes: ''
    });
    const [savingVisit, setSavingVisit] = useState(false);
    const [isExistingVisit, setIsExistingVisit] = useState(false);
    
    // LOCAL prescription state - moved from parent to prevent page refresh on keystroke
    const [localCurrentMedication, setLocalCurrentMedication] = useState({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    const [localInlineMedications, setLocalInlineMedications] = useState([]);
    const [localEditingMedicationIndex, setLocalEditingMedicationIndex] = useState(null);
    const [localMedicineDropdownOpen, setLocalMedicineDropdownOpen] = useState(false);
    const localMedicineInputRef = useRef(null);
    
    // Destructure to use simpler names in JSX (prevents massive refactoring)
    const currentMedication = localCurrentMedication;
    const setCurrentMedication = setLocalCurrentMedication;
    const inlineMedications = localInlineMedications;
    const setInlineMedications = setLocalInlineMedications;
    const editingMedicationIndex = localEditingMedicationIndex;
    const setEditingMedicationIndex = setLocalEditingMedicationIndex;
    const medicineDropdownOpen = localMedicineDropdownOpen;
    const setMedicineDropdownOpen = setLocalMedicineDropdownOpen;
    const medicineInputRef = localMedicineInputRef;

    // Track loaded appointment IDs to prevent duplicate loading
    const loadedAppointmentRef = useRef(null);

    // Load existing visit data if available - ONLY ONCE per appointment
    useEffect(() => {
      const appointmentId = selectedAppointmentForVisit?.appointmentId;
      const existingData = selectedAppointmentForVisit?.existingVisitData;
      
      // If we've already loaded this appointment's data, skip
      if (loadedAppointmentRef.current === appointmentId && existingData) {
        return;
      }
      
      if (!appointmentId) {
        console.log('📝 No appointment ID, initializing empty form');
        setIsExistingVisit(false);
        setLocalInlineMedications([]);
        return;
      }

      if (!existingData) {
        console.log('📝 No existing data yet for appointment', appointmentId);
        return;
      }

      // Mark this appointment as loaded
      loadedAppointmentRef.current = appointmentId;
      
      console.log('📥 Loading existing visit data into form - Appointment:', appointmentId);
      console.log('📦 Existing data:', existingData);
      
      // Check if this is an existing visit
      const hasExistingData = existingData.visitDate || existingData.diagnosis || existingData.reasonForVisit;
      if (hasExistingData) {
        setIsExistingVisit(true);
      }
      
      // Load visit form data - handle both old and new field names
      setVisitForm({
        visitDate: existingData.visitDate ? existingData.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
        chiefComplaint: existingData.chiefComplaint || existingData.reasonForVisit || '',
        diagnosis: existingData.diagnosis || existingData.diagnoses || '',
        treatmentProvided: existingData.treatmentProvided || existingData.treatments || '',
        prescriptions: existingData.prescriptions || '',
        followUpDate: existingData.followUpDate ? existingData.followUpDate.split('T')[0] : '',
        notes: existingData.notes || ''
      });
      
      // Load medications if they exist
      if (existingData.prescriptions && Array.isArray(existingData.prescriptions)) {
        console.log('💊 Loading existing prescriptions into medications grid:', existingData.prescriptions);
        const mappedMeds = existingData.prescriptions.map(med => ({
          name: med.medicineName || med.name || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.specialInstructions || med.instructions || ''
        }));
        console.log('💊 Mapped medications for grid:', mappedMeds);
        setLocalInlineMedications(mappedMeds);
      } else {
        console.log('💊 No existing prescriptions to load');
        setLocalInlineMedications([]);
      }
    }, [selectedAppointmentForVisit?.appointmentId, selectedAppointmentForVisit?.existingVisitData]);
    
    // Reset the ref when modal closes to allow fresh loads next time
    useEffect(() => {
      if (!showVisitInfoModal) {
        console.log('🔄 Modal closed - resetting loaded appointment ref and clearing medications');
        loadedAppointmentRef.current = null;
        setLocalInlineMedications([]);
        setLocalCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
        setLocalEditingMedicationIndex(null);
      }
    }, [showVisitInfoModal]);

    // Debug: Track medication changes
    useEffect(() => {
      console.log('💊 MEDICATIONS STATE CHANGED:');
      console.log('   localInlineMedications.length:', localInlineMedications.length);
      console.log('   inlineMedications.length:', inlineMedications.length);
      console.log('   Data:', JSON.stringify(inlineMedications, null, 2));
    }, [localInlineMedications, inlineMedications]);
    
    // Sample medical conditions - in real app this would come from API
    const chronicDiseases = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Kidney Disease'];
    const allergies = ['Penicillin', 'Aspirin', 'Iodine'];

    // Manage body overflow when modal opens/closes
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (medicineInputRef.current && !medicineInputRef.current.contains(event.target)) {
          setMedicineDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Local medication handlers
    const handleAddMedication = useCallback(() => {
      console.log('➕ Adding medication:', currentMedication);
      if (!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency || !currentMedication.duration) {
        alert('❌ Please fill in all required fields (Name, Dosage, Frequency, Duration)');
        return;
      }

      if (editingMedicationIndex !== null) {
        const updated = [...inlineMedications];
        updated[editingMedicationIndex] = { ...currentMedication };
        setInlineMedications(updated);
        setEditingMedicationIndex(null);
      } else {
        setInlineMedications([...inlineMedications, { ...currentMedication }]);
      }

      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    }, [currentMedication, editingMedicationIndex, inlineMedications]);

    const handleEditMedication = (index) => {
      setCurrentMedication({ ...inlineMedications[index] });
      setEditingMedicationIndex(index);
    };

    const handleRemoveMedication = (index) => {
      setInlineMedications(inlineMedications.filter((_, i) => i !== index));
    };

    const handleCancelEdit = () => {
      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
      setEditingMedicationIndex(null);
    };

    // Save prescription handler
    const handleSavePrescriptionAPI = async () => {
      // Validate medications
      const validMeds = inlineMedications.filter(med => 
        med.name && med.dosage && med.frequency && med.duration
      );

      if (validMeds.length === 0) {
        alert('❌ Please add at least one complete medication with name, dosage, frequency, and duration.');
        return;
      }

      setSavingPrescription(true);
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
        
        const enterpriseId = selectedAccess?.enterpriseId || userData?.enterpriseId || 0;
        const clinicId = selectedAccess?.clinicId || userData?.clinicId || 0;
        const doctorId = userData?.doctorId || 0;
        const appointmentDetails = selectedAppointmentForVisit;
        const patientId = appointmentDetails?.patientId || 0;
        const visitId = 0; // Visit might not be created yet
        const appointmentId = appointmentDetails?.appointmentId || 0;

        console.log('💊 Saving prescriptions for medications:', validMeds);
        const savedPrescriptions = [];

        // Save each medication using addPrescription API
        for (const med of validMeds) {
          const now = new Date().toISOString();
          const payload = {
            medicationId: 0,
            enterpriseId,
            clinicId,
            appointmentId,
            visitId,
            doctorId,
            patientId,
            medicineName: String(med.name).trim(),
            dosage: String(med.dosage).trim(),
            frequency: String(med.frequency).trim(),
            duration: String(med.duration).trim(),
            specialInstructions: String(med.instructions || '').trim(),
            generalPrescriptionNotes: '',
            createdAt: now,
            createdBy: String(userData.username || 'Doctor').trim(),
            updatedAt: now,
            updatedBy: String(userData.username || 'Doctor').trim()
          };

          const result = await addPrescription(payload);
          savedPrescriptions.push(result);
        }

        const successMessages = [
          '🎉 Prescription saved successfully! Medications documented.',
          '💊 Success! Prescriptions added to patient record.',
          '✅ Excellent! All medications saved successfully.',
          '🏥 Well done! Prescription saved and ready.',
          '💉 Perfect! Medications documented successfully.'
        ];
        const message = successMessages[Math.floor(Math.random() * successMessages.length)];
        
        alert(message);
        
      } catch (error) {
        console.error('Failed to save prescription:', error);
        alert('❌ Failed to save prescription. Please try again.');
      } finally {
        setSavingPrescription(false);
      }
    };

    // Print prescription handler
    const handlePrintPrescription = () => {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const appointmentDetails = selectedAppointmentForVisit;
      setPrintPrescriptionData({
        patientName: `${appointmentDetails.firstName} ${appointmentDetails.lastName}`,
        patientId: appointmentDetails.patientId,
        patientAge: appointmentDetails.age || 'N/A',
        doctorName: appointmentDetails.doctorName || userData.username || 'Doctor',
        registrationNumber: appointmentDetails.registrationNumber || 'N/A',
        diagnosis: visitForm.diagnosis,
        medications: inlineMedications,
        notes: visitForm.notes
      });
    };

    // Memoized input handler to prevent focus loss
    const handleVisitFormChange = useCallback((field, value) => {
      setVisitForm(prev => ({
        ...prev,
        [field]: value
      }));
    }, []);

    const handleSaveVisit = async () => {
      console.log('═════════════════════════════════════════════');
      console.log('🚀 SAVE VISIT INITIATED');
      console.log('═════════════════════════════════════════════');
      
      if (!visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided) {
        alert('❌ Please fill in Chief Complaint, Diagnosis, and Treatment Provided fields.');
        return;
      }

      setSavingVisit(true);
      try {
        // Log localStorage contents
        console.log('📦 Checking localStorage...');
        console.log('   localStorage keys:', Object.keys(localStorage));
        console.log('   selectedAccess raw:', localStorage.getItem("selectedAccess"));
        console.log('   userData raw:', localStorage.getItem("userData"));
        
        const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const appointmentDetails = selectedAppointmentForVisit;
        
        console.log('✅ Parsed selectedAccess:', selectedAccess);
        console.log('   - enterpriseId:', selectedAccess?.enterpriseId);
        console.log('   - clinicId:', selectedAccess?.clinicId);
        console.log('   - Type of enterpriseId:', typeof selectedAccess?.enterpriseId);
        console.log('   - Type of clinicId:', typeof selectedAccess?.clinicId);
        console.log('✅ Parsed userData:', userData);
        
        // Validate selectedAccess exists
        if (!selectedAccess || !selectedAccess.enterpriseId || !selectedAccess.clinicId) {
          console.error('❌ ==================== VALIDATION FAILED ====================');
          console.error('❌ selectedAccess is invalid!');
          console.error('   selectedAccess object:', selectedAccess);
          console.error('   enterpriseId:', selectedAccess?.enterpriseId);
          console.error('   clinicId:', selectedAccess?.clinicId);
          console.error('❌ ============================================================');
          alert('❌ Session error: Please logout and login again to select your enterprise/clinic.');
          setSavingVisit(false);
          return;
        }
        
        console.log('✅ Validation passed - selectedAccess is valid');
        
        console.log('💊 ═══════════════════════════════════════════');
        console.log('💊 Checking inlineMedications before conversion');
        console.log('💊 Count:', inlineMedications.length);
        console.log('💊 Data:', JSON.stringify(inlineMedications, null, 2));
        console.log('💊 ═══════════════════════════════════════════');

        // Convert inline medications to Prescription model format (C# PascalCase)
        const prescriptions = inlineMedications.map(med => ({
          MedicineName: med.name,
          Dosage: med.dosage,
          Frequency: med.frequency,
          Duration: med.duration,
          SpecialInstructions: med.instructions || '',
          GeneralPrescriptionNotes: ''
        }));
        
        console.log('💊 ═══════════════════════════════════════════');
        console.log('💊 Converted prescriptions:');
        console.log('💊 Count:', prescriptions.length);
        console.log('💊 Data:', JSON.stringify(prescriptions, null, 2));
        console.log('💊 ═══════════════════════════════════════════');

        // Build PatientVisitInformation payload (C# PascalCase)
        const visitData = {
          AppointmentId: parseInt(appointmentDetails.appointmentId || 0),
          PatientId: parseInt(appointmentDetails.patientId || 0),
          ClinicId: parseInt(selectedAccess.clinicId || appointmentDetails.clinicId || 0),
          VisitDate: visitForm.visitDate,
          ReasonForVisit: visitForm.chiefComplaint,
          Diagnoses: visitForm.diagnosis,
          Treatments: visitForm.treatmentProvided,
          Notes: visitForm.notes || '',
          NextAppointmentDate: visitForm.followUpDate || null,
          AttendingPhysician: appointmentDetails.doctorName || userData.username || 'Doctor',
          BillingAmount: Number(appointmentDetails.billableAmount) || 0,
          PaymentStatus: appointmentDetails.paymentStatus || 'Pending',
          CreatedBy: userData.username || userData.fullName || 'Doctor',
          UpdatedBy: userData.username || userData.fullName || 'Doctor',
          Prescriptions: prescriptions
        };

        console.log('═══════════════════════════════════════════════════════');
        console.log('📤 PATIENT VISIT PAYLOAD CONSTRUCTED');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📦 Full Payload:', JSON.stringify(visitData, null, 2));
        console.log('📊 Payload Fields:');
        console.log('   - AppointmentId:', visitData.AppointmentId, '(type:', typeof visitData.AppointmentId, ')');
        console.log('   - PatientId:', visitData.PatientId, '(type:', typeof visitData.PatientId, ')');
        console.log('   - ClinicId:', visitData.ClinicId, '(type:', typeof visitData.ClinicId, ')');
        console.log('   - VisitDate:', visitData.VisitDate);
        console.log('   - ReasonForVisit:', visitData.ReasonForVisit);
        console.log('   - Diagnoses:', visitData.Diagnoses);
        console.log('   - Treatments:', visitData.Treatments);
        console.log('   - Prescriptions count:', visitData.Prescriptions?.length || 0);
        console.log('═══════════════════════════════════════════════════════');
        
        // Call appropriate API based on whether it's a new or existing visit
        let response;
        if (isExistingVisit) {
          console.log('🔄 UPDATING EXISTING VISIT - Calling EditPatientVisit API');
          response = await editPatientVisit(visitData);
        } else {
          console.log('✨ CREATING NEW VISIT - Calling AddPatientVisit API');
          response = await addPatientVisit(visitData);
        }
        
        // Show success modal with funny message
        const funnyMessages = [
          "🎉 " + (isExistingVisit ? 'Diagnosis updated!' : 'Diagnosis saved!') + " Another satisfied patient incoming!",
          "💊 Boom! Visit documented with surgical precision!",
          "✅ Perfect! Your diagnosis is now immortalized in the system!",
          "🏥 Success! You've just made medical history!",
          "📋 Done! Your visit report is safe and sound!",
          "💉 Nailed it! The prescription gods smile upon you!",
          "🎯 Visit " + (isExistingVisit ? 'updated' : 'saved') + "! You're officially awesome today!",
          "🚀 Warp speed success! Your diagnosis has entered orbit!",
          "🏆 Champion! Your patient care game is strong!",
          "⭐ Star quality diagnosis! Standing ovation from the germs!"
        ];
        
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        setDiagnosisSaveMessage(randomMessage);
        setShowDiagnosisSaveSuccess(true);
        
        console.log('✅ Visit ' + (isExistingVisit ? 'updated' : 'saved') + ' successfully:', response);
        
        // Reset form
        setTimeout(() => {
          setShowVisitInfoModal(false);
          setShowDiagnosisSaveSuccess(false);
          setInlineMedications([]);
          setVisitForm({
            visitDate: new Date().toISOString().split('T')[0],
            followUpDate: '',
            chiefComplaint: '',
            diagnosis: '',
            treatmentProvided: '',
            notes: '',
            prescriptions: ''
          });
        }, 3000);
      } catch (error) {
        console.error('Failed to save visit:', error);
        alert('❌ Failed to save visit information. Please try again.');
      } finally {
        setSavingVisit(false);
      }
    };

    // Listen for prescription saved from prescription modal
    // Prescription is tracked at the top level now to avoid focus resets and cross-modal state issues
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={() => setShowVisitInfoModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col"
        >
            {/* Header - Sticky */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 rounded-t-3xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                  🩺
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Diagnosis & Patient Visit</h2>
                  <p className="text-teal-100 text-sm mt-1">
                    {selectedAppointmentForVisit.firstName} {selectedAppointmentForVisit.lastName} • ID: #{selectedAppointmentForVisit.patientId}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowVisitInfoModal(false)}
                className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Body - Scrollable with 2-column layout */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - MEDICAL HISTORY */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-1 space-y-4"
                >
                  {/* Patient Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <span>👤</span> Patient Info
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3 pb-3 border-b border-blue-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                          {selectedAppointmentForVisit.firstName?.charAt(0)}{selectedAppointmentForVisit.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs text-stone-600 font-medium">Name</p>
                          <p className="font-bold text-stone-800">{selectedAppointmentForVisit.firstName} {selectedAppointmentForVisit.lastName}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-600">Phone:</span>
                          <span className="font-bold text-stone-800">{selectedAppointmentForVisit.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600">Email:</span>
                          <span className="font-bold text-stone-800 truncate max-w-[140px]">{selectedAppointmentForVisit.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chronic Diseases */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Chronic Diseases
                    </h3>
                    <div className="space-y-2">
                      {chronicDiseases.map((disease, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white rounded-lg p-3 border-l-4 border-red-400 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-stone-800">✓ {disease}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                      <span>🚨</span> Allergies
                    </h3>
                    <div className="space-y-2">
                      {allergies.map((allergy, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white rounded-lg p-3 border-l-4 border-orange-400 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-stone-800">⚠️ {allergy}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Appointment Summary */}
                  <div className="bg-gradient-to-br from-slate-100 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <span>📅</span> Appointment
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between pb-2 border-b border-indigo-100">
                        <span className="text-stone-600">Date:</span>
                        <span className="font-bold text-stone-800">{new Date(selectedAppointmentForVisit.appointmentDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Time:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentForVisit.startTime || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-indigo-100">
                        <span className="text-stone-600">Type:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentForVisit.appointmentType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CENTER & RIGHT COLUMN - VISIT FORM */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-2 space-y-5"
                >
                  {/* Visit Dates */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-md">
                    <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                      <span>📆</span> Visit Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Visit Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={visitForm.visitDate}
                          onChange={(e) => handleVisitFormChange('visitDate', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Follow-up Date</label>
                        <input
                          type="date"
                          value={visitForm.followUpDate}
                          onChange={(e) => handleVisitFormChange('followUpDate', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200 shadow-md">
                    <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
                      <span>🤕</span> Chief Complaint <span className="text-red-500">*</span>
                    </h3>
                    <textarea
                      key="chiefComplaint"
                      value={visitForm.chiefComplaint}
                      onChange={(e) => handleVisitFormChange('chiefComplaint', e.target.value)}
                      placeholder="What is the main reason for the visit?"
                      rows={2}
                      className="w-full px-4 py-2 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition resize-none"
                    />
                  </div>

                  {/* Diagnosis - PROMINENT */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg ring-2 ring-green-200">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                        <span>🔬</span> Diagnosis <span className="text-red-500">*</span>
                      </h3>
                      <div className="flex gap-2">
                        {prescriptionId && (
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              try {
                                console.log('📋 Fetching prescription with ID:', prescriptionId);
                                const prescription = await getPrescriptionById(prescriptionId);
                                console.log('✅ Prescription fetched:', prescription);
                                setViewedPrescription(prescription);
                                setShowViewPrescriptionModal(true);
                              } catch (error) {
                                console.error('Failed to fetch prescription:', error);
                                alert('❌ Failed to load prescription. Please try again.');
                              }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm"
                          >
                            <span>👁️</span>
                            <span>View Prescription</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={visitForm.diagnosis}
                      onChange={(e) => handleVisitFormChange('diagnosis', e.target.value)}
                      placeholder="Enter detailed diagnosis based on examination and findings..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none font-medium text-stone-800"
                    />
                  </div>

                  {/* Inline Prescription Section */}
                  <div className="bg-gradient-to-br from-slate-100 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-300 shadow-lg">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <span>💊</span> Write Prescription
                    </h3>

                    {/* Medication Input Form - INLINE for better state management */}
                    <div className="bg-white rounded-xl p-5 mb-5 border-2 border-indigo-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Medicine Name Searchable Dropdown */}
                        <div className="md:col-span-2" ref={medicineInputRef}>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Medicine Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              key="medicine-name-input"
                              type="text"
                              value={currentMedication.name || ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const currentDOMValue = e.target.value;
                                console.log('🔵 MEDICINE NAME TYPING:', newValue);
                                console.log('🔵 DOM Input value:', currentDOMValue);
                                console.log('🔵 DOM Input selectionStart:', e.target.selectionStart);
                                console.log('🔵 DOM Input selectionEnd:', e.target.selectionEnd);
                                console.log('🔵 Current state BEFORE - name:', currentMedication.name, '| Full object:', JSON.stringify(currentMedication));
                                setCurrentMedication(prev => {
                                  const updated = { ...prev, name: newValue };
                                  console.log('🔵 Current state AFTER - name:', updated.name, '| Full object:', JSON.stringify(updated));
                                  return updated;
                                });
                                if (!medicineDropdownOpen) {
                                  console.log('🔵 Opening dropdown');
                                  setMedicineDropdownOpen(true);
                                }
                              }}
                              onFocus={() => {
                                if (inventoryMeds.length === 0 && !loadingMeds) {
                                  loadInventoryMedications();
                                }
                                setLocalMedicineDropdownOpen(true);
                              }}
                              placeholder="Search or type medication name..."
                              className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                              autoComplete="off"
                            />
                            {currentMedication.name && !medicineDropdownOpen && (
                              <div className="mt-1 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-sm">
                                <span className="text-green-700">✓ Selected:</span> <span className="font-bold text-stone-900">{currentMedication.name}</span>
                              </div>
                            )}
                            
                            {/* Dropdown Panel */}
                            {medicineDropdownOpen && (
                              <div className="absolute z-30 mt-1 w-full bg-white border-2 border-indigo-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                                {loadingMeds ? (
                                  <div className="px-3 py-8 text-center">
                                    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <p className="text-sm text-stone-600 font-medium">Loading medicines...</p>
                                  </div>
                                ) : inventoryMeds.length === 0 ? (
                                  <div className="px-4 py-6 text-center">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                      </svg>
                                    </div>
                                    <p className="text-sm text-stone-600 mb-4">No medicines in inventory. Add one to get started!</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('🟡 Opening add medicine modal');
                                        handleOpenAddMedicineModal(currentMedication.name);
                                        setMedicineDropdownOpen(false);
                                      }}
                                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      Add to Inventory
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {inventoryMeds
                                      .filter(med => {
                                        const searchVal = (currentMedication.name || "").toLowerCase();
                                        return !searchVal || med.itemName?.toLowerCase().includes(searchVal) || med.itemCode?.toLowerCase().includes(searchVal);
                                      })
                                      .map((m) => (
                                      <button
                                        type="button"
                                        key={m.itemId || m.id}
                                        onClick={() => {
                                          console.log('✅ Medicine SELECTED:', m.itemName);
                                          console.log('✅ Medicine object:', m);
                                          setCurrentMedication(prev => {
                                            const updated = { ...prev, name: m.itemName };
                                            console.log('✅ Updated medication state:', updated);
                                            return updated;
                                          });
                                          setMedicineDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition border-b border-indigo-50 last:border-b-0 focus:outline-none focus:bg-indigo-100"
                                      >
                                        <div className="font-semibold text-stone-800">{m.itemName}{m.itemCode ? ` (${m.itemCode})` : ""}</div>
                                        <div className="text-xs text-stone-500 flex gap-3 flex-wrap">
                                          {m.category && <span>Category: {m.category}</span>}
                                          {m.unit && <span>Unit: {m.unit}</span>}
                                          <span>CGST: {Number(m.cgst) || 0}%</span>
                                          <span>SGST: {Number(m.sgst) || 0}%</span>
                                        </div>
                                      </button>
                                    ))}
                                    <div className="sticky bottom-0 bg-gradient-to-r from-slate-100 to-indigo-100 p-3 border-t border-indigo-200">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          console.log('🟡 Opening add medicine modal from dropdown');
                                          handleOpenAddMedicineModal(currentMedication.name);
                                          setMedicineDropdownOpen(false);
                                        }}
                                        className="w-full px-4 py-2 bg-white border-2 border-indigo-300 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add New Medicine
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Dosage <span className="text-red-500">*</span>
                          </label>
                          <input
                            key="dosage-input"
                            type="text"
                            value={currentMedication.dosage || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🟠 DOSAGE TYPING:', newValue);
                              console.log('🟠 DOM dosage value:', e.target.value);
                              console.log('🟠 Current dosage BEFORE:', currentMedication.dosage);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, dosage: newValue };
                                console.log('🟠 Dosage updated to:', updated.dosage);
                                return updated;
                              });
                            }}
                            placeholder="e.g., 500mg, 1 tablet"
                            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            autoComplete="off"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Frequency <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={currentMedication.frequency || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🟡 FREQUENCY SELECTED:', newValue);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, frequency: newValue };
                                console.log('🟡 Frequency updated:', updated);
                                return updated;
                              });
                            }}
                            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          >
                            <option value="">Select frequency...</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 4 hours">Every 4 hours</option>
                            <option value="Every 6 hours">Every 6 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="Every 12 hours">Every 12 hours</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="At bedtime">At bedtime</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Duration <span className="text-red-500">*</span>
                          </label>
                          <input
                            key="duration-input"
                            type="text"
                            value={currentMedication.duration || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🟣 DURATION TYPING:', newValue);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, duration: newValue };
                                console.log('🟣 Duration updated:', updated);
                                return updated;
                              });
                            }}
                            placeholder="e.g., 7 days, 2 weeks"
                            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            autoComplete="off"
                          />
                        </div>

                        {/* Instructions */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Special Instructions
                          </label>
                          <input
                            key="instructions-input"
                            type="text"
                            value={currentMedication.instructions || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🔵 INSTRUCTIONS TYPING:', newValue);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, instructions: newValue };
                                console.log('🔵 Instructions updated:', updated);
                                return updated;
                              });
                            }}
                            placeholder="e.g., Take with food, Avoid alcohol"
                            className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {/* Add/Update Button */}
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            console.log('➕ ADD MEDICATION CLICKED');
                            console.log('➕ Current medication:', currentMedication);
                            handleAddMedication();
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                        >
                          <span>{editingMedicationIndex !== null ? '✏️' : '➕'}</span>
                          <span>{editingMedicationIndex !== null ? 'Update Medication' : 'Add Medication'}</span>
                        </motion.button>
                        {editingMedicationIndex !== null && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              console.log('❌ CANCEL EDIT CLICKED');
                              handleCancelEdit();
                            }}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* No medications message */}
                    {inlineMedications.length === 0 && (
                      <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 text-center text-blue-700 mb-4">
                        <p className="font-semibold">👆 Fill in the fields above and click "Add Medication" to add prescriptions</p>
                        <p className="text-sm mt-1">Added medications will appear here as a list</p>
                      </div>
                    )}

                    {/* Debug info - Visible during troubleshooting */}
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-xs">
                      <p className="font-bold text-yellow-900">🐛 Debug Info:</p>
                      <p>inlineMedications.length: <span className="font-bold">{inlineMedications.length}</span></p>
                      <p>localInlineMedications.length: <span className="font-bold">{localInlineMedications.length}</span></p>
                      <p>inlineMedications === localInlineMedications: <span className="font-bold">{(inlineMedications === localInlineMedications).toString()}</span></p>
                      <p>Has existingVisitData: <span className="font-bold">{selectedAppointmentForVisit?.existingVisitData ? 'Yes' : 'No'}</span></p>
                      <p>Prescriptions in data: <span className="font-bold">{selectedAppointmentForVisit?.existingVisitData?.prescriptions?.length || 0}</span></p>
                      <button 
                        onClick={() => {
                          console.log('🔍 MANUAL STATE CHECK:');
                          console.log('inlineMedications:', inlineMedications);
                          console.log('localInlineMedications:', localInlineMedications);
                          console.log('selectedAppointmentForVisit:', selectedAppointmentForVisit);
                          alert(`Medications count: ${inlineMedications.length}\nData: ${JSON.stringify(inlineMedications)}`);
                        }}
                        className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded font-semibold"
                      >
                        Check State
                      </button>
                      {inlineMedications.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-semibold">View medications data</summary>
                          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(inlineMedications, null, 2)}</pre>
                        </details>
                      )}
                    </div>

                    {/* Force render test - Always show if data exists */}
                    {inlineMedications.length > 0 && (
                      <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 mb-4">
                        <p className="font-bold text-green-900">✅ MEDICATIONS EXIST - SHOULD SHOW GRID BELOW</p>
                        <p className="text-sm">Count: {inlineMedications.length}</p>
                      </div>
                    )}

                    {/* Medications List Grid */}
                    {inlineMedications.length > 0 ? (
                      <div className="space-y-3 mb-5">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                          <span>📋</span> Added Medications ({inlineMedications.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {inlineMedications.map((med, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-md hover:shadow-lg transition"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-bold text-stone-800 text-lg mb-2">{med.name || 'N/A'}</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="font-semibold text-stone-600">Dosage:</span>
                                      <p className="text-stone-800">{med.dosage || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-stone-600">Frequency:</span>
                                      <p className="text-stone-800">{med.frequency || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-stone-600">Duration:</span>
                                      <p className="text-stone-800">{med.duration || 'N/A'}</p>
                                    </div>
                                    {med.instructions && (
                                      <div className="md:col-span-1">
                                        <span className="font-semibold text-stone-600">Instructions:</span>
                                        <p className="text-stone-800">{med.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleEditMedication(index)}
                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                    title="Edit"
                                  >
                                    ✏️
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRemoveMedication(index)}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                    title="Remove"
                                  >
                                    🗑️
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                      </div>
                    ) : (
                      <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-4">
                        <p className="font-bold text-red-900">❌ NO MEDICATIONS - Grid is hidden because inlineMedications.length = 0</p>
                      </div>
                    )}

                    {/* Save Prescription Button */}
                    {inlineMedications.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSavePrescriptionAPI}
                        disabled={savingPrescription}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 text-base mb-5"
                      >
                        {savingPrescription ? '💾 Saving Prescription...' : '💊 Save Prescription to API'}
                      </motion.button>
                    )}
                  </div>

                  {/* Action Buttons - Email, WhatsApp, and Print - Horizontal Layout */}
                  {inlineMedications.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {/* Print Button */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowPrescriptionPrintModal(true);
                        }}
                        className="px-3 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-1 text-sm"
                      >
                        <span>🖨️</span>
                        <span>Print</span>
                      </motion.button>

                      {/* WhatsApp Button */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const appointmentDetails = selectedAppointmentForVisit;
                          const medicationText = inlineMedications
                            .map((med, i) => `${i+1}. ${med.name}\n   Dosage: ${med.dosage}\n   Frequency: ${med.frequency}\n   Duration: ${med.duration}${med.instructions ? `\n   Instructions: ${med.instructions}` : ''}`)
                            .join('\n\n');
                          const message = `Hello, here is the prescription for ${appointmentDetails.firstName} ${appointmentDetails.lastName}:\n\n${medicationText}\n\nPlease follow the instructions carefully.`;
                          const encodedMessage = encodeURIComponent(message);
                          const whatsappLink = `https://wa.me/?text=${encodedMessage}`;
                          window.open(whatsappLink, '_blank');
                        }}
                        className="px-3 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-1 text-sm"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </motion.button>

                      {/* Email Button */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={sendingEmail}
                        onClick={async () => {
                          try {
                            setSendingEmail(true);
                            const appointmentDetails = selectedAppointmentForVisit;
                            
                            // ===== COMPREHENSIVE LOGGING =====
                            console.log('🔍 ===== DOCTORS PAGE PRESCRIPTION EMAIL SEND CALLED =====');
                            console.log('📋 Full appointmentDetails object:', appointmentDetails);
                            console.log('📧 appointmentDetails.patientEmail:', appointmentDetails?.patientEmail);
                            console.log('📧 appointmentDetails.email:', appointmentDetails?.email);
                            console.log('📧 appointmentDetails.patientContact:', appointmentDetails?.patientContact);
                            console.log('📧 appointmentDetails.patientContact?.patientEmail:', appointmentDetails?.patientContact?.patientEmail);
                            
                            // Multiple fallback options
                            const patientEmail = (appointmentDetails?.patientContact?.patientEmail 
                              || appointmentDetails?.patientEmail 
                              || appointmentDetails?.email 
                              || '').trim() ? 
                              (appointmentDetails?.patientContact?.patientEmail 
                                || appointmentDetails?.patientEmail 
                                || appointmentDetails?.email).trim()
                              : 'srivatchu94@gmail.com';
                            
                            console.log('✅ Final patientEmail being used:', patientEmail);
                            
                            if (!patientEmail || patientEmail === 'srivatchu94@gmail.com') {
                              console.warn('⚠️ Using fallback email: srivatchu94@gmail.com');
                            }

                            if (!patientEmail) {
                              alert('❌ Patient email not found. Please update patient contact information.');
                              setSendingEmail(false);
                              return;
                            }

                            if (inlineMedications.length === 0) {
                              alert('❌ Please add at least one medication before sending email');
                              setSendingEmail(false);
                              return;
                            }

                            await sendPrescriptionEmail(
                              patientEmail,
                              `${appointmentDetails.patientFirstName} ${appointmentDetails.patientLastName}`,
                              appointmentDetails.doctorName || 'Doctor',
                              inlineMedications,
                              appointmentDetails.clinicName || 'Dental Clinic',
                              appointmentDetails.doctorId || appointmentDetails.doctorCode || ''
                            );

                            setSuccessMessage('🎉 Email delivered! Your patient\'s inbox just got a little healthier!');
                            setShowPrescriptionSuccessModal(true);
                            setSendingEmail(false);
                          } catch (error) {
                            console.error('Error sending email:', error);
                            setSuccessMessage(`❌ Oops! Email got lost in the digital void: ${error.message}`);
                            setShowPrescriptionSuccessModal(true);
                            setSendingEmail(false);
                          }
                        }}
                        className={`px-3 py-2.5 text-white rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-1 text-sm ${
                          sendingEmail 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl'
                        }`}
                      >
                        <span>{sendingEmail ? '⏳' : '📧'}</span>
                        <span>{sendingEmail ? 'Sending...' : 'Email'}</span>
                      </motion.button>
                    </div>
                  )}

                  {/* Treatment Provided */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <span>⚕️</span> Treatment Provided <span className="text-red-500">*</span>
                    </h3>
                    <textarea
                      value={visitForm.treatmentProvided}
                      onChange={(e) => handleVisitFormChange('treatmentProvided', e.target.value)}
                      placeholder="Describe the treatment provided during this visit..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                    />
                  </div>

                  {/* Notes Section - Single */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-7 border-2 border-gray-300 shadow-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-200">
                      <span className="text-2xl">📝</span> Additional Notes
                    </h3>
                    <textarea
                      value={visitForm.notes}
                      onChange={(e) => handleVisitFormChange('notes', e.target.value)}
                      placeholder="Document any additional observations or follow-up instructions..."
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-400 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition resize-none text-sm font-medium text-stone-800 bg-white"
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVisitInfoModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveVisit}
                  disabled={savingVisit || !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    savingVisit || !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided
                      ? 'bg-gray-300 cursor-not-allowed'
                      : isExistingVisit
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  <span>{isExistingVisit ? '🔄' : '💾'}</span>
                  <span>{savingVisit ? 'Processing...' : isExistingVisit ? 'Update Visit & Diagnosis' : 'Save Visit & Diagnosis'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
    );
  }), [
    showVisitInfoModal,
    selectedAppointmentForVisit,
    setShowVisitInfoModal,
    setDiagnosisSaveMessage,
    setShowDiagnosisSaveSuccess,
    setPrintPrescriptionData
  ]);

  // Appointment Details Modal Component - IMPROVED LAYOUT
  // Memoized to prevent recreation on every parent render
  const AppointmentDetailsModal = React.useMemo(() => {
    if (!showAppointmentDetails || !selectedAppointmentDetails) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`appointment-details-${selectedAppointmentDetails.appointmentId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={handleCloseAppointmentDetails}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col"
          >
            {/* Header - STICKY */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  📋
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Appointment Details</h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {selectedAppointmentDetails.firstName} {selectedAppointmentDetails.lastName}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseAppointmentDetails}
                className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Body - SCROLLABLE WITH 2-COLUMN GRID */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">👤</span> Patient Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-blue-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {selectedAppointmentDetails.firstName?.charAt(0)}{selectedAppointmentDetails.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-stone-600 font-medium">Full Name</p>
                        <p className="font-bold text-stone-800">{selectedAppointmentDetails.firstName} {selectedAppointmentDetails.lastName}</p>
                      </div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Patient ID:</span>
                        <span className="font-bold text-stone-800">#{selectedAppointmentDetails.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Phone:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentDetails.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Email:</span>
                        <span className="font-bold text-stone-800 text-xs truncate">{selectedAppointmentDetails.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-100">
                        <span className="text-stone-600 font-medium">Doctor ID:</span>
                        <span className="font-bold text-stone-800">#{selectedAppointmentDetails.doctorId ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Clinic ID:</span>
                        <span className="font-bold text-stone-800">#{selectedAppointmentDetails.clinicId ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Appointment Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-gradient-to-br from-slate-100 via-indigo-100 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span> Appointment
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-indigo-100">
                      <span className="text-stone-600 font-medium">Date:</span>
                      <span className="font-bold text-stone-800">
                        {selectedAppointmentDetails.appointmentDate 
                          ? new Date(selectedAppointmentDetails.appointmentDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Time:</span>
                      <span className="font-bold text-stone-800">
                        {selectedAppointmentDetails.startTime || 'N/A'}
                        {selectedAppointmentDetails.endTime ? ` - ${selectedAppointmentDetails.endTime}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Duration:</span>
                      <span className="font-bold text-stone-800">{selectedAppointmentDetails.durationMinutes ?? 'N/A'} min</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-violet-100">
                      <span className="text-stone-600 font-medium">Type:</span>
                      <span className="font-bold text-stone-800">{selectedAppointmentDetails.appointmentType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Room:</span>
                      <span className="font-bold text-stone-800">{selectedAppointmentDetails.roomNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-violet-100">
                      <span className="text-stone-600 font-medium">Status:</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedAppointmentDetails.status || 'Scheduled')}`}>
                        {selectedAppointmentDetails.status || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Additional Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-slate-50 via-stone-50 to-gray-50 rounded-2xl p-6 border-2 border-stone-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">ℹ️</span> Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedAppointmentDetails.attendingPhysician && (
                      <div className="flex justify-between pb-2 border-b border-stone-100">
                        <span className="text-stone-600 font-medium">Physician:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentDetails.attendingPhysician}</span>
                      </div>
                    )}
                    {selectedAppointmentDetails.reasonForVisit && (
                      <div className="pb-2 border-b border-stone-100">
                        <span className="text-stone-600 font-medium text-xs">Reason:</span>
                        <p className="font-bold text-stone-800 text-xs">{selectedAppointmentDetails.reasonForVisit}</p>
                      </div>
                    )}
                    {selectedAppointmentDetails.notes && (
                      <div className="pb-2 border-b border-stone-100">
                        <span className="text-stone-600 font-medium text-xs">Notes:</span>
                        <p className="font-bold text-stone-800 text-xs line-clamp-2">{selectedAppointmentDetails.notes}</p>
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <span className="text-stone-600 font-medium">Visit ID:</span>
                      <span className="font-bold text-stone-800 text-xs">#{selectedAppointmentDetails.visitId ?? 'N/A'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer - STICKY WITH ORGANIZED BUTTONS */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCloseAppointmentDetails}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEditAppointmentClick(selectedAppointmentDetails)}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </motion.button>
                {currentPrescription && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrintPrescription}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    <span>Print</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    console.log('═══════════════════════════════════════════════════════');
                    console.log('🩺 DIAGNOSIS BUTTON CLICKED');
                    console.log('═══════════════════════════════════════════════════════');
                    console.log('📋 Selected Appointment:', selectedAppointmentDetails);
                    console.log('🆔 AppointmentID:', selectedAppointmentDetails.appointmentId);
                    
                    setSelectedAppointmentForVisit(selectedAppointmentDetails);
                    loadMedicalInfoSummary(selectedAppointmentDetails.patientId);
                    
                    console.log('🎯 Opening diagnosis modal...');
                    console.log('═══════════════════════════════════════════════════════');
                    // Set modal visibility - this should trigger modal open
                    setShowVisitInfoModal(true);
                    setShowAppointmentDetails(false);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>🩺</span>
                  <span>Diagnosis</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }, [
    showAppointmentDetails,
    selectedAppointmentDetails,
    handleCloseAppointmentDetails,
    handleEditAppointmentClick,
    currentPrescription,
    handlePrintPrescription,
    setSelectedAppointmentForVisit,
    loadMedicalInfoSummary,
    setShowVisitInfoModal,
    setShowAppointmentDetails
  ]);

  // Prescription Modal Component - ENHANCED with patient details & keyboard nav
  const commonMedications = [
    'Amoxicillin', 'Ibuprofen', 'Acetaminophen', 'Cephalexin', 'Metronidazole', 
    'Ciprofloxacin', 'Trimethoprim-Sulfamethoxazole', 'Clarithromycin',
    'Clindamycin', 'Tetracycline', 'Penicillin V', 'Azithromycin'
  ];

  const PrescriptionModal = () => {
    if (!showPrescriptionModal) return null;

    const [localPrescriptionForm, setLocalPrescriptionForm] = React.useState(prescriptionForm);
    const [medicationInput, setMedicationInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
    const [savingPrescription, setSavingPrescription] = useState(false);
    
    React.useEffect(() => {
      setLocalPrescriptionForm(prescriptionForm);
    }, [showPrescriptionModal]);
    
    // Sample medical conditions - in real app this would come from API
    const chronicDiseases = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Kidney Disease'];
    const allergies = ['Penicillin', 'Aspirin', 'Iodine'];

    const addMedication = React.useCallback(() => {
      setLocalPrescriptionForm(prev => ({
        ...prev,
        medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      }));
    }, []);

    const removeMedication = React.useCallback((index) => {
      setLocalPrescriptionForm(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index)
      }));
    }, []);

    const updateMedication = React.useCallback((index, field, value) => {
      setLocalPrescriptionForm(prev => {
        const newMedications = [...prev.medications];
        newMedications[index][field] = value;
        return { ...prev, medications: newMedications };
      });
      
      if (field === 'name') {
        setMedicationInput(value);
        setShowSuggestions(value.length > 0);
        setSelectedSuggestion(-1);
        setCurrentMedicationIndex(index);
      }
    }, []);

    const handleMedicationKeyDown = (e, index) => {
      if (!showSuggestions) return;

      const filteredMeds = commonMedications.filter(med =>
        med.toLowerCase().includes(medicationInput.toLowerCase())
      );

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < filteredMeds.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestion >= 0) {
            updateMedication(index, 'name', filteredMeds[selectedSuggestion]);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
        default:
          break;
      }
    };

    const getSuggestions = (input) => {
      if (!input) return [];
      return commonMedications.filter(med =>
        med.toLowerCase().includes(input.toLowerCase())
      );
    };

    const handleApplyPrescription = React.useCallback(() => {
      setPrescriptionForm(localPrescriptionForm);
      const validMedications = localPrescriptionForm.medications.filter(med => med.name && med.dosage);
      if (validMedications.length === 0) {
        alert('❌ Please add at least one medication with name and dosage.');
        return;
      }
      
      // Apply prescription to the diagnosis form
      const prescriptionText = validMedications
        .map(med => `${med.name} ${med.dosage}${med.frequency ? ' - ' + med.frequency : ''}${med.duration ? ' for ' + med.duration : ''}${med.instructions ? ' (' + med.instructions + ')' : ''}`)
        .join('\n');
      
      handleVisitFormChange('prescriptions', prescriptionText);
      setSavedPrescription({ medications: validMedications, notes: localPrescriptionForm.notes });
      alert('✅ Prescription applied successfully!');
      setShowPrescriptionModal(false);
    }, [localPrescriptionForm]);

    const handleSavePrescription = React.useCallback(async () => {
      setPrescriptionForm(localPrescriptionForm);
      const validMedications = localPrescriptionForm.medications.filter(med => med.name && med.dosage);
      if (validMedications.length === 0) {
        alert('❌ Please add at least one medication with name and dosage.');
        return;
      }

      setSavingPrescription(true);
      try {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
        
        console.log('🔍 handleSavePrescription - Available data:');
        console.log('  selectedAppointmentForVisit:', selectedAppointmentForVisit);
        console.log('  userData:', userData);
        console.log('  selectedAccess:', selectedAccess);
        
        // Get IDs from correct sources
        const enterpriseId = selectedAccess?.enterpriseId || 0;
        const clinicId = selectedAccess?.clinicId || 0;
        const appointmentId = selectedAppointmentForVisit?.appointmentId || 0;
        const visitId = selectedAppointmentForVisit?.visitId || 0;
        const doctorId = selectedAppointmentForVisit?.doctorId || 0;  // Use from appointment, not userData
        let patientId = selectedAppointmentForVisit?.patientId || 0;
        
        console.log('📋 Extracted IDs:');
        console.log('  enterpriseId:', enterpriseId, '(from selectedAccess)');
        console.log('  clinicId:', clinicId, '(from selectedAccess)');
        console.log('  appointmentId:', appointmentId, '(from appointment)');
        console.log('  visitId:', visitId, '(from appointment - might be null)');
        console.log('  doctorId:', doctorId, '(from appointment)');
        console.log('  patientId:', patientId, '(from appointment)');
        console.log('🔍 Full appointment object:', selectedAppointmentForVisit);
        
        // Validate all required IDs (visitId can be 0/null, but others cannot)
        if (enterpriseId === 0 || clinicId === 0 || appointmentId === 0 || doctorId === 0) {
          const missing = [];
          if (enterpriseId === 0) missing.push('enterpriseId (from login)');
          if (clinicId === 0) missing.push('clinicId (from login)');
          if (appointmentId === 0) missing.push('appointmentId (from appointment)');
          if (doctorId === 0) missing.push('doctorId (from appointment)');
          
          alert(`❌ Missing required IDs: ${missing.join(', ')}\n\nCheck console for details.`);
          console.error('Missing IDs:', missing);
          setSavingPrescription(false);
          return;
        }
        
        // patientId validation - THIS IS THE ISSUE
        if (patientId === 0) {
          console.warn('⚠️  ALERT: patientId is 0 in the appointment object!');
          console.log('Available appointment fields:', Object.keys(selectedAppointmentForVisit));
          alert(`❌ ERROR: Cannot save prescription - Patient ID is missing from appointment!\n\nThe backend returned patientId: 0, which is invalid.\n\nPlease check:\n1. Is the appointment data complete?\n2. Does the patient exist in the system?`);
          setSavingPrescription(false);
          return;
        }
        
        // Save each medication separately using AddPrescription API
        for (const medication of validMedications) {
          const prescriptionPayload = {
            medicationId: 0,
            enterpriseId: enterpriseId,
            clinicId: clinicId,
            appointmentId: appointmentId,
            visitId: visitId,
            doctorId: doctorId,
            patientId: patientId,
            medicineName: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            duration: medication.duration,
            specialInstructions: medication.instructions,
            generalPrescriptionNotes: localPrescriptionForm.notes || "",
            createdAt: new Date().toISOString(),
            createdBy: userData.username || "Doctor",
            updatedAt: new Date().toISOString(),
            updatedBy: userData.username || "Doctor"
          };

          console.log('📤 Sending payload for:', medication.name, prescriptionPayload);

          const response = await fetch('`${API_BASE_URL}/Appointments/AddPrescription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify(prescriptionPayload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`Failed to save prescription: ${response.statusText} - ${errorText}`);
          }

          // Capture prescriptionId from response
          const responseData = await response.json();
          console.log('✅ Prescription saved successfully:', responseData);
          if (responseData?.prescriptionId) {
            setPrescriptionId(responseData.prescriptionId);
            console.log('📋 Stored prescriptionId:', responseData.prescriptionId);
          }
        }

        setSavedPrescription({ medications: validMedications, notes: localPrescriptionForm.notes });
        setShowPrescriptionSuccessModal(true);
        
        // Close prescription modal and show diagnosis page after success
        setTimeout(() => {
          setShowPrescriptionModal(false);
          setShowVisitInfoModal(true);
          setShowPrescriptionSuccessModal(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to save prescription:', error);
        alert('❌ Failed to save prescription. Please try again.');
      } finally {
        setSavingPrescription(false);
      }
    }, [localPrescriptionForm, selectedAppointmentForVisit, setSavedPrescription]);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4"
          onClick={() => setShowPrescriptionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col"
          >
            {/* Header - STICKY */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    💊
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Write Prescription</h2>
                    <p className="text-pink-100 text-sm mt-1">
                      {selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName} • ID: #{selectedAppointmentForVisit?.patientId}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body - Scrollable with Patient Context */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Patient Details & Medical Context - Always Visible on Scroll */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Patient Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span>👤</span> Patient Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3 pb-3 border-b border-blue-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {selectedAppointmentForVisit?.firstName?.charAt(0)}{selectedAppointmentForVisit?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-stone-600 font-medium">Name</p>
                        <p className="font-bold text-stone-800">{selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-600">Phone:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentForVisit?.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Email:</span>
                        <span className="font-bold text-stone-800 truncate max-w-[140px]">{selectedAppointmentForVisit?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Critical Allergies - WARNING */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="lg:col-span-1 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-red-300 shadow-lg ring-2 ring-red-200 h-fit"
                >
                  <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                    <span>🚨</span> ALLERGIES
                  </h3>
                  <div className="space-y-2">
                    {allergies.map((allergy, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-lg p-3 border-l-4 border-red-500 shadow-sm"
                      >
                        <p className="text-sm font-bold text-red-700">⚠️ {allergy}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Chronic Diseases */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>⚠️</span> Medical Conditions
                  </h3>
                  <div className="space-y-2">
                    {chronicDiseases.map((disease, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-lg p-2 border-l-4 border-amber-400 shadow-sm"
                      >
                        <p className="text-xs font-semibold text-stone-800">• {disease}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Medications Section */}
              <div className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                    <span>💊</span> Add Medications
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addMedication}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>Add Medication</span>
                  </motion.button>
                </div>

                <div className="space-y-5">
                  {localPrescriptionForm.medications.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-6 border-2 border-purple-300 shadow-md relative"
                    >
                      {localPrescriptionForm.medications.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeMedication(index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-100 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      )}

                      <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <span className="bg-purple-200 text-purple-900 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>Medication</span>
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Medicine Name with Autofill */}
                        <div className="lg:col-span-1 relative">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Medicine Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              onKeyDown={(e) => handleMedicationKeyDown(e, index)}
                              onFocus={() => {
                                setMedicationInput(med.name);
                                if (med.name.length > 0) setShowSuggestions(true);
                              }}
                              onClick={() => {
                                setMedicationInput(med.name);
                                setShowSuggestions(true);
                                setCurrentMedicationIndex(index);
                              }}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              placeholder="Click to select or type to search..."
                              className="w-full px-4 py-3 pr-10 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition cursor-pointer"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Autocomplete Suggestions - Keyboard Navigation Ready + Add to Inventory */}
                          {showSuggestions && med.name.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-full mt-1 w-full bg-white border-2 border-purple-300 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
                            >
                              {getSuggestions(med.name).length > 0 ? (
                                getSuggestions(med.name).map((suggestion, idx) => (
                                  <motion.div
                                    key={idx}
                                    onClick={() => {
                                      updateMedication(index, 'name', suggestion);
                                      setShowSuggestions(false);
                                    }}
                                    className={`px-4 py-2.5 cursor-pointer transition-all ${
                                      selectedSuggestion === idx
                                        ? 'bg-purple-500 text-white font-semibold'
                                        : 'hover:bg-purple-100 text-stone-800'
                                    }`}
                                  >
                                    {suggestion}
                                  </motion.div>
                                ))
                              ) : (
                                <div className="p-2">
                                  <div className="px-4 py-2.5 text-stone-600 text-sm mb-2 border-b border-stone-200">
                                    🔍 No matches found for "{med.name}"
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setNewMedicationName(med.name);
                                      setShowAddMedicationModal(true);
                                      setShowSuggestions(false);
                                    }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                  >
                                    <span>➕</span>
                                    <span>Add "{med.name}" to Inventory</span>
                                  </motion.button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Dosage <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Frequency</label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            placeholder="e.g., 3 times a day"
                            className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Duration</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                            placeholder="e.g., 7 days"
                            className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* Special Instructions */}
                        <div className="lg:col-span-3">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Special Instructions</label>
                          <textarea
                            value={med.instructions}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="e.g., Take after meals, avoid dairy products"
                            rows={2}
                            className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* General Notes */}
                <div className="mt-6 pt-6 border-t-2 border-indigo-300">
                  <label className="block text-sm font-semibold text-stone-700 mb-2">General Prescription Notes</label>
                  <textarea
                    value={localPrescriptionForm.notes || ''}
                    onChange={(e) => setLocalPrescriptionForm({...localPrescriptionForm, notes: e.target.value})}
                    placeholder="e.g., Follow-up in 1 week, take with water"
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer - STICKY */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPrescriptionModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (localPrescriptionForm.medications.filter(m => m.name && m.dosage).length > 0) {
                      setPrescriptionForm(localPrescriptionForm);
                      setShowPrintPreviewModal(true);
                    }
                  }}
                  disabled={localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-2xl'
                  }`}
                >
                  <span>🖨️</span>
                  <span>Print Preview</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyPrescription}
                  disabled={localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-2xl'
                  }`}
                >
                  <span>✓</span>
                  <span>Apply to Diagnosis</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSavePrescription}
                  disabled={savingPrescription || localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    savingPrescription || localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:shadow-2xl'
                  }`}
                >
                  <span>💾</span>
                  <span>{savingPrescription ? 'Saving...' : 'Save Prescription'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // View Prescription Modal Component
  const ViewPrescriptionModal = () => {
    if (!showViewPrescriptionModal) return null;

    const [isEditMode, setIsEditMode] = React.useState(false);
    const [editedPrescription, setEditedPrescription] = React.useState(currentPrescription);
    const [isSavingPrescription, setIsSavingPrescription] = React.useState(false);

    // Parse medications from prescription content
    const parseMedications = (content) => {
      if (!content) return [];
      // Content is in format: "MedicineName - Dosage Frequency for Duration (Instructions)"
      const lines = content.split('\n').filter(l => l.trim());
      return lines.map(line => {
        // Parse each medication line
        const match = line.match(/^([^-]+)\s*-\s*([^(]*?)(?:\s*\(([^)]*)\))?$/);
        if (match) {
          const parts = match[2].trim().split(' for ');
          const dosageFreq = parts[0] || '';
          const duration = parts[1] || '';
          return {
            name: match[1].trim(),
            dosageFreq: dosageFreq,
            duration: duration,
            instructions: match[3] || ''
          };
        }
        return { name: line, dosageFreq: '', duration: '', instructions: '' };
      });
    };

    const medications = parseMedications(editedPrescription?.prescriptionContent);

    const handleMedicationChange = (index, field, value) => {
      const newMeds = [...medications];
      newMeds[index][field] = value;
      // Reconstruct prescription content
      const newContent = newMeds.map(med => {
        let str = `${med.name} - ${med.dosageFreq} for ${med.duration}`;
        if (med.instructions) str += ` (${med.instructions})`;
        return str;
      }).join('\n');
      setEditedPrescription({ ...editedPrescription, prescriptionContent: newContent });
    };

    const handleAddMedication = () => {
      const newMeds = [...medications, { name: '', dosageFreq: '', duration: '', instructions: '' }];
      const newContent = newMeds.map(med => {
        let str = `${med.name} - ${med.dosageFreq} for ${med.duration}`;
        if (med.instructions) str += ` (${med.instructions})`;
        return str;
      }).filter(s => s.trim()).join('\n');
      setEditedPrescription({ ...editedPrescription, prescriptionContent: newContent });
    };

    const handleRemoveMedication = (index) => {
      const newMeds = medications.filter((_, i) => i !== index);
      const newContent = newMeds.map(med => {
        let str = `${med.name} - ${med.dosageFreq} for ${med.duration}`;
        if (med.instructions) str += ` (${med.instructions})`;
        return str;
      }).join('\n');
      setEditedPrescription({ ...editedPrescription, prescriptionContent: newContent });
    };

    const handleSaveChanges = async () => {
      try {
        setIsSavingPrescription(true);
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");

        // Update each medication
        const validMeds = medications.filter(m => m.name && m.dosageFreq && m.duration);
        for (const med of validMeds) {
          const payload = {
            medicationId: 0,
            enterpriseId: selectedAccess.enterpriseId || 0,
            clinicId: selectedAccess.clinicId || 0,
            appointmentId: editedPrescription?.appointmentId || 0,
            visitId: 0,
            doctorId: userData.doctorId || 0,
            patientId: editedPrescription?.patientId || 0,
            medicineName: med.name,
            dosage: med.dosageFreq.split(' ')[0] || '',
            frequency: med.dosageFreq.split(' for ')[0]?.trim().split(' ').pop() || '',
            duration: med.duration,
            specialInstructions: med.instructions || "",
            generalPrescriptionNotes: "",
            createdAt: new Date().toISOString(),
            createdBy: userData.username || "Doctor",
            updatedAt: new Date().toISOString(),
            updatedBy: userData.username || "Doctor"
          };

          await updatePrescriptionData(payload);
        }

        setCurrentPrescription(editedPrescription);
        setIsEditMode(false);
        alert('✅ Prescription updated successfully!');
      } catch (error) {
        console.error('Error saving prescriptions:', error);
        alert('❌ Failed to save prescriptions');
      } finally {
        setIsSavingPrescription(false);
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowViewPrescriptionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">📋 Prescription Details {isEditMode && '(Edit Mode)'}</h2>
                <p className="text-indigo-100 text-sm mt-1">Patient: {editedPrescription?.patientId || 'N/A'}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowViewPrescriptionModal(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition"
              >
                ✕
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {!editedPrescription ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 font-semibold">No prescription found</p>
                </div>
              ) : (
                <>
                  {/* Medications Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-200 to-indigo-200">
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Medicine Name</th>
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Dosage & Frequency</th>
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Duration</th>
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Instructions</th>
                          {isEditMode && <th className="border border-indigo-300 px-4 py-3 text-center font-bold">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {medications.map((med, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="font-semibold text-slate-900">{med.name}</span>
                              )}
                            </td>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.dosageFreq}
                                  onChange={(e) => handleMedicationChange(idx, 'dosageFreq', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                  placeholder="e.g., 500mg twice daily"
                                />
                              ) : (
                                med.dosageFreq
                              )}
                            </td>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                  placeholder="e.g., 5 days"
                                />
                              ) : (
                                med.duration
                              )}
                            </td>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.instructions}
                                  onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                  placeholder="e.g., Take with food"
                                />
                              ) : (
                                med.instructions || '-'
                              )}
                            </td>
                            {isEditMode && (
                              <td className="border border-indigo-200 px-4 py-3 text-center">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveMedication(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ✕
                                </motion.button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isEditMode && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddMedication}
                      className="w-full px-4 py-3 border-2 border-dashed border-indigo-400 rounded-xl text-indigo-700 font-semibold hover:bg-indigo-50 transition"
                    >
                      ➕ Add Another Medication
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-stone-50 border-t-2 border-stone-200 px-8 py-4 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isEditMode) {
                    setEditedPrescription(currentPrescription);
                  }
                  setIsEditMode(!isEditMode);
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                  isEditMode
                    ? 'bg-gray-400 text-white hover:bg-gray-500'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg'
                }`}
              >
                <span>{isEditMode ? '✕ Cancel' : '✏️ Edit Prescription'}</span>
              </motion.button>
              {isEditMode && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveChanges}
                  disabled={isSavingPrescription}
                  className={`px-6 py-2.5 font-semibold rounded-lg transition flex items-center gap-2 ${
                    isSavingPrescription
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                  }`}
                >
                  <span>💾 Save Changes</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowViewPrescriptionModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50 font-semibold rounded-lg transition"
              >
                ✕ Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Add Medication to Inventory Modal Component
  const AddMedicationModal = () => {
    if (!showAddMedicationModal) return null;

    const [medicationData, setMedicationData] = React.useState({
      itemName: newMedicationName || '',
      itemCode: '',
      categoryName: 'Medication',
      subCategory: '',
      dosageForms: '',
      manufacturer: '',
      genericName: '',
      unitOfMeasure: 'Unit',
      reorderLevel: 10,
      isActive: true
    });
    const [isSaving, setIsSaving] = React.useState(false);

    const handleInputChange = React.useCallback((field, value) => {
      setMedicationData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveMedication = async () => {
      if (!medicationData.itemName.trim()) {
        alert('❌ Please enter medication name');
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          ...medicationData,
          itemCode: medicationData.itemCode || `MED-${Date.now()}`,
          reorderLevel: parseInt(medicationData.reorderLevel) || 10
        };

        await createInventoryMaster(payload);
        
        alert(`✅ "${medicationData.itemName}" has been added to inventory successfully!`);
        
        // Update commonMedications list (in real app, refetch from API)
        commonMedications.push(medicationData.itemName);
        
        // Update the current medication in prescription form
        if (currentMedicationIndex >= 0) {
          updateMedication(currentMedicationIndex, 'name', medicationData.itemName);
        }
        
        setShowAddMedicationModal(false);
        setNewMedicationName('');
      } catch (error) {
        console.error('Failed to add medication:', error);
        alert('❌ Failed to add medication to inventory. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100000] p-4"
          onClick={() => setShowAddMedicationModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    ➕
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Add New Medication</h2>
                    <p className="text-green-100 text-sm mt-1">Add medication to inventory master</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddMedicationModal(false)}
                  className="w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body - Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Medication Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Medication Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicationData.itemName}
                      onChange={(e) => handleInputChange('itemName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition font-semibold"
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>

                  {/* Item Code */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Item Code</label>
                    <input
                      type="text"
                      value={medicationData.itemCode}
                      onChange={(e) => handleInputChange('itemCode', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Category</label>
                    <select
                      value={medicationData.categoryName}
                      onChange={(e) => handleInputChange('categoryName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    >
                      <option value="Medication">Medication</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Anesthetics">Anesthetics</option>
                      <option value="Antiseptics">Antiseptics</option>
                      <option value="Anti-inflammatory">Anti-inflammatory</option>
                    </select>
                  </div>

                  {/* Sub-category */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Sub-category</label>
                    <input
                      type="text"
                      value={medicationData.subCategory}
                      onChange={(e) => handleInputChange('subCategory', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Penicillin"
                    />
                  </div>

                  {/* Dosage Forms */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Dosage Forms</label>
                    <input
                      type="text"
                      value={medicationData.dosageForms}
                      onChange={(e) => handleInputChange('dosageForms', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Tablet, Capsule, Syrup"
                    />
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Manufacturer</label>
                    <input
                      type="text"
                      value={medicationData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Pfizer, GSK"
                    />
                  </div>

                  {/* Generic Name */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Generic Name</label>
                    <input
                      type="text"
                      value={medicationData.genericName}
                      onChange={(e) => handleInputChange('genericName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Chemical/Generic name"
                    />
                  </div>

                  {/* Unit of Measure */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Unit of Measure</label>
                    <select
                      value={medicationData.unitOfMeasure}
                      onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    >
                      <option value="Unit">Unit</option>
                      <option value="Box">Box</option>
                      <option value="Strip">Strip</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Vial">Vial</option>
                    </select>
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Reorder Level</label>
                    <input
                      type="number"
                      value={medicationData.reorderLevel}
                      onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="10"
                      min="1"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={medicationData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-semibold text-stone-700">Active Item (Available for use)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 border-t-2 border-stone-200 flex justify-end gap-3 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddMedicationModal(false)}
                disabled={isSaving}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg disabled:opacity-50"
              >
                ✕ Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveMedication}
                disabled={isSaving || !medicationData.itemName.trim()}
                className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                  isSaving || !medicationData.itemName.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:shadow-2xl'
                }`}
              >
                <span>{isSaving ? '⏳' : '✅'}</span>
                <span>{isSaving ? 'Saving...' : 'Add to Inventory'}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Print Preview Modal Component
  const PrintPreviewModal = () => {
    if (!showPrintPreviewModal) return null;

    const printRef = useRef(null);
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    const handlePrint = () => {
      if (printRef.current) {
        window.print();
      }
    };

    const handleEmailShare = async () => {
      try {
        // ===== COMPREHENSIVE LOGGING =====
        console.log('🔍 ===== PRINT PREVIEW EMAIL SHARE CALLED =====');
        console.log('📋 Full selectedAppointmentForVisit object:', selectedAppointmentForVisit);
        console.log('📧 selectedAppointmentForVisit?.email:', selectedAppointmentForVisit?.email);
        console.log('📧 selectedAppointmentForVisit?.patientEmail:', selectedAppointmentForVisit?.patientEmail);
        console.log('📧 selectedAppointmentForVisit?.patientContact:', selectedAppointmentForVisit?.patientContact);
        console.log('📧 selectedAppointmentForVisit?.patientContact?.patientEmail:', selectedAppointmentForVisit?.patientContact?.patientEmail);
        
        // Multiple fallback options
        const patientEmail = (selectedAppointmentForVisit?.patientContact?.patientEmail 
          || selectedAppointmentForVisit?.patientEmail 
          || selectedAppointmentForVisit?.email 
          || '').trim() ? 
          (selectedAppointmentForVisit?.patientContact?.patientEmail 
            || selectedAppointmentForVisit?.patientEmail 
            || selectedAppointmentForVisit?.email).trim()
          : 'srivatchu94@gmail.com';
        
        console.log('✅ Final patientEmail being used:', patientEmail);
        
        if (!patientEmail || patientEmail === 'srivatchu94@gmail.com') {
          console.warn('⚠️ Using fallback email: srivatchu94@gmail.com');
        }

        setSendingEmail(true);
        const prescriptionText = prescriptionForm.medications
          .map(m => `${m.name} - ${m.dosage} - ${m.frequency}`)
          .join('\n');
        
        const patientName = `${selectedAppointmentForVisit?.patientFirstName || ''} ${selectedAppointmentForVisit?.patientLastName || ''}`.trim() || 'Patient';
        const doctorName = selectedAppointmentForVisit?.doctorName || userData?.username || selectedAppointmentForVisit?.doctor_name || 'Dr. Physician';
        const clinicName = selectedAppointmentForVisit?.clinicName || 'Dental Clinic';
        const doctorId = selectedAppointmentForVisit?.doctorId || userData?.doctorId || '';

        console.log('📧 Email Details:', {
          patientEmail,
          patientName,
          doctorName,
          clinicName,
          doctorId,
          medicationsCount: prescriptionForm.medications.length
        });

        await sendPrescriptionEmail(
          patientEmail,
          patientName,
          doctorName,
          prescriptionForm.medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration || 'As prescribed',
            instructions: m.instructions || ''
          })),
          clinicName,
          doctorId
        );

        setSuccessMessage('🚀 Prescription zoomed through the internet! Check your inbox magic! ✨');
        setShowPrescriptionSuccessModal(true);
        setSendingEmail(false);
      } catch (error) {
        console.error('Error sending email:', error);
        setSuccessMessage(`❌ Oops! Email got lost in the digital void: ${error.message}`);
        setShowPrescriptionSuccessModal(true);
        setSendingEmail(false);
      }
    };

    const handleWhatsAppShare = () => {
      const patientPhone = selectedAppointmentForVisit?.phoneNumber?.replace(/\D/g, '') || '';
      const prescriptionText = prescriptionForm.medications
        .map(m => `${m.name} - ${m.dosage} - ${m.frequency}`)
        .join('\n');
      
      const message = `Hello! Here is your prescription from ${SAMPLE_CLINIC_DETAILS.clinicName}:\n\n${prescriptionText}\n\nThank you!`;
      const whatsappUrl = `https://wa.me/91${patientPhone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4"
          onClick={() => setShowPrintPreviewModal(false)}
        >
          <motion.div
            ref={printRef}
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden print:rounded-none print:shadow-none"
          >
            {/* Print Header - Not visible on print */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 rounded-t-3xl print:hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🖨️</span> Prescription Print Preview
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPrintPreviewModal(false)}
                  className="w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
              {/* Clinic Header */}
              <div className="text-center mb-8 pb-8 border-b-2 border-stone-300">
                <h1 className="text-4xl font-bold text-stone-900 mb-2">{SAMPLE_CLINIC_DETAILS.clinicName}</h1>
                <p className="text-stone-600 text-lg mb-4">📍 {SAMPLE_CLINIC_DETAILS.address}</p>
                <div className="flex justify-center gap-6 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{SAMPLE_CLINIC_DETAILS.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span>{SAMPLE_CLINIC_DETAILS.email}</span>
                  </div>
                </div>
              </div>

              {/* Doctor & Patient Info */}
              <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                  <h3 className="font-bold text-stone-900 mb-2">Dr. {userData.username || 'Doctor Name'}</h3>
                  <p className="text-sm text-stone-600">Registration No: {userData.registrationNumber || 'MH-12345'}</p>
                  <p className="text-sm text-stone-600">Specialization: Dentistry</p>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 mb-2">Patient Information</h3>
                  <p className="text-sm text-stone-600">Name: {selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName}</p>
                  <p className="text-sm text-stone-600">ID: #{selectedAppointmentForVisit?.patientId}</p>
                  <p className="text-sm text-stone-600">Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Medications Table */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b-2 border-stone-300 pb-2">Prescribed Medications</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Medicine Name</th>
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Dosage</th>
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Frequency</th>
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionForm.medications.map((med, idx) => (
                      med.name && med.dosage && (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                          <td className="border border-stone-300 px-4 py-3">{med.name}</td>
                          <td className="border border-stone-300 px-4 py-3">{med.dosage}</td>
                          <td className="border border-stone-300 px-4 py-3">{med.frequency || '-'}</td>
                          <td className="border border-stone-300 px-4 py-3">{med.duration || '-'}</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              {prescriptionForm.medications.some(m => m.instructions) && (
                <div className="mb-8 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h3 className="font-bold text-stone-900 mb-2 text-lg">Special Instructions:</h3>
                  <div className="space-y-2">
                    {prescriptionForm.medications.map((med, idx) => (
                      med.instructions && (
                        <p key={idx} className="text-stone-700">
                          <strong>{med.name}:</strong> {med.instructions}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {prescriptionForm.notes && (
                <div className="mb-8 bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
                  <h3 className="font-bold text-stone-900 mb-2 text-lg">Additional Notes:</h3>
                  <p className="text-stone-700">{prescriptionForm.notes}</p>
                </div>
              )}

              {/* Signature Area */}
              <div className="mt-16 flex justify-end">
                <div className="text-center">
                  <div className="h-20 border-t-2 border-stone-400 mb-2 w-40"></div>
                  <p className="font-bold text-stone-900">Dr. {userData.username || 'Doctor Name'}</p>
                  <p className="text-sm text-stone-600">Signature & Stamp</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t-2 border-stone-300 text-center text-xs text-stone-600">
                <p>This is a computer-generated prescription. Signature on soft copy is valid.</p>
                <p>{SAMPLE_CLINIC_DETAILS.clinicName} • {SAMPLE_CLINIC_DETAILS.operatingHours}</p>
              </div>
            </div>

            {/* Action Buttons - Not visible on print */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap print:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPrintPreviewModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEmailShare}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>📧</span>
                  <span>Email</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWhatsAppShare}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  const BookAppointmentModal = () => {
    if (!bookingModalOpen) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setBookingModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  ➕ Book New Appointment
                </h2>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Patient Information */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <span>👤</span> Patient Information
                  {newAppointment.isWalkIn && (
                    <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                      Walk-In Patient
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAppointment.firstName}
                      onChange={(e) => setNewAppointment({ ...newAppointment, firstName: e.target.value })}
                      placeholder="Enter first name"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAppointment.lastName}
                      onChange={(e) => setNewAppointment({ ...newAppointment, lastName: e.target.value })}
                      placeholder="Enter last name"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newAppointment.phone}
                      onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newAppointment.email}
                      onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                      placeholder="patient@example.com"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="border-t border-stone-200 pt-4">
                <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <span>📅</span> Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      required
                    />
                    <input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Appointment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newAppointment.type}
                      onChange={(e) => {
                        const isWalkIn = e.target.value === "Walk In";
                        setNewAppointment({ 
                          ...newAppointment, 
                          type: e.target.value,
                          isWalkIn
                        });
                      }}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    >
                      <option value="">Select type</option>
                      <option value="Checkup">Checkup</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Filling">Filling</option>
                      <option value="Root Canal">Root Canal</option>
                      <option value="Crown">Crown</option>
                      <option value="Extraction">Extraction</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Walk In">Walk In</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Attending Physician {!newAppointment.isWalkIn && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={newAppointment.doctor}
                      onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
                      disabled={loadingDoctors}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition disabled:bg-stone-100"
                    >
                      <option value="">{loadingDoctors ? "Loading doctors..." : "Select doctor"}</option>
                      {doctorsList.map((doc) => (
                        <option key={doc.doctorId} value={doc.doctorId}>
                          {doc.firstName} {doc.lastName} {doc.specialization ? `(${doc.specialization})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Reason for Visit <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                      placeholder="Describe the reason for visit, symptoms, or concerns..."
                      rows={3}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 border-t border-stone-200 sticky bottom-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBookingModalOpen(false)}
                className="px-6 py-2 text-stone-600 hover:text-stone-800 font-semibold transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBookAppointment}
                className="px-6 py-2 rounded-lg font-semibold text-white transition shadow-md bg-gradient-to-r from-indigo-600 to-slate-900 hover:from-indigo-700 hover:to-slate-800"
              >
                Book Appointment
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Prescription Success Modal
  const PrescriptionSuccessModal = () => {
    if (!showPrescriptionSuccessModal) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
          onClick={() => setShowPrescriptionSuccessModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <span className="text-6xl">✅</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mt-4">Success!</h2>
            </div>

            {/* Content */}
            <div className="px-8 py-6 text-center">
              <p className="text-stone-700 text-lg font-semibold mb-2">
                {successMessage || "Operation Completed Successfully! 🎉"}
              </p>
              <p className="text-stone-600 text-sm">
                Your changes have been saved. Please wait...
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-stone-50 border-t border-stone-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPrescriptionSuccessModal(false)}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                ✓ Dismiss
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!showUpdateSuccessModal) return null;

    const funnyMessages = [
      "🎉 Appointment updated successfully! Your calendar is now perfectly organized!",
      "✨ Update complete! Even your appointment time is excited to be changed!",
      "🚀 Boom! Appointment details have been rocketed into the system!",
      "🎊 Success! The appointment fairy has blessed these changes!",
      "💫 Done and dusted! Your appointment is now perfectly pristine!",
      "🌟 Mission accomplished! Time to celebrate with a coffee! ☕",
      "🎯 Bull's eye! Your appointment update was spot-on!",
      "🏆 Victory! Your appointment has been updated to perfection!",
      "🎪 Voilà! The appointment magician has done his trick!",
      "💪 Appointment slayed! Updates were handled like a boss!"
    ];

    const randomMessage = updateSuccessMessage || funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => {
            setShowUpdateSuccessModal(false);
            setUpdateSuccessMessage("");
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <span className="text-6xl">✅</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mt-4">Success!</h2>
            </div>

            {/* Body */}
            <div className="p-8 text-center space-y-4">
              <p className="text-lg font-semibold text-stone-800">
                {randomMessage}
              </p>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700">
                  Your appointment has been updated in the system and all changes have been saved.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-4 border-t border-stone-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowUpdateSuccessModal(false);
                  setUpdateSuccessMessage("");
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Got it! 👍
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Spacer for header and nav */}
      <div className="h-[148px]"></div>
      
      {/* Animated Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-6 mt-4"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 p-8 shadow-2xl">
          {/* Animated background blobs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"
          />
          
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-white mb-3 flex items-center gap-4"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl"
              >
                👨‍⚕️
              </motion.span>
              Doctor's Clinical Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-purple-50"
            >
              {doctorName ? `Welcome, Dr. ${doctorName}` : "Manage appointments, patients, and clinic operations efficiently"}
            </motion.p>
          </div>
        </div>
      </motion.div>
      
      {/* Sidebar Toggle Button - Outside the sidebar */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: 1,
          x: 0,
          left: isSidebarCollapsed ? "64px" : "280px"
        }}
        transition={{ 
          opacity: { duration: 0.3, delay: 0.2 },
          x: { duration: 0.3, delay: 0.2 },
          left: { duration: 0.35, ease: "easeInOut" }
        }}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        whileHover={{ 
          scale: 1.1, 
          boxShadow: "0 4px 20px rgba(6, 182, 212, 0.25)",
          backgroundColor: "rgba(255, 255, 255, 1)"
        }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-[180px] w-5 h-12 bg-white/90 backdrop-blur-sm rounded-r-lg shadow-lg flex items-center justify-center text-indigo-600 hover:text-indigo-500 transition-all border border-l-0 border-indigo-100 hover:border-indigo-300 z-[60]"
        style={{
          clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)"
        }}
      >
        <motion.svg
          animate={{ 
            rotate: isSidebarCollapsed ? 180 : 0,
            x: isSidebarCollapsed ? -1 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      {/* Left Sidebar Navigation */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ 
          x: 0,
          opacity: 1,
          width: isSidebarCollapsed ? "64px" : "280px"
        }}
        transition={{ 
          x: { duration: 0.5, ease: "easeOut" },
          opacity: { duration: 0.5 },
          width: { duration: 0.35, ease: "easeInOut" }
        }}
        className="bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 shadow-2xl fixed left-0 top-[148px] h-[calc(100vh-148px)] z-50 rounded-tr-3xl border-t-4 border-white/20"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
        }}
      >
        <style>{`
          aside::-webkit-scrollbar {
            width: 6px;
          }
          aside::-webkit-scrollbar-track {
            background: transparent;
          }
          aside::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          aside::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>

        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'p-3' : 'p-5'}`}>
          {/* Header - Clickable to expand sidebar */}
          <motion.div 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`flex items-center mb-5 pb-5 border-b border-white/20 cursor-pointer hover:bg-white/10 rounded-lg transition-all ${isSidebarCollapsed ? 'justify-center flex-col gap-2 p-2' : 'gap-3 p-2'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'}`}
            >
              👨‍⚕️
              {/* Expand indicator when collapsed */}
              {isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg"
                >
                  »
                </motion.div>
              )}
            </motion.div>
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.div
                  key="header-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <h2 className="text-white font-bold text-lg whitespace-nowrap">Doctor's Space</h2>
                  <p className="text-indigo-100 text-xs whitespace-nowrap">{(() => {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    return userData.username || 'Doctor';
                  })()}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dashboard Section */}
          <div className="mb-4">
            {/* Dashboard Header - Collapsible (VS Code Style) */}
            <motion.button
              onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
              className={`w-full flex items-center justify-between mb-2 px-2 py-1.5 hover:bg-white/10 rounded transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <h3 className="text-white/90 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    📊 Dashboard
                  </h3>
                  <motion.svg
                    animate={{ 
                      rotate: isDashboardExpanded ? 180 : 0,
                      y: isDashboardExpanded ? 0 : [0, -2, 0]
                    }}
                    transition={{ 
                      rotate: { duration: 0.3 },
                      y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white/60"
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </>
              ) : (
                <div className="relative">
                  <span className="text-xl">📊</span>
                  <motion.div
                    animate={{ 
                      scale: isDashboardExpanded ? 1 : [1, 1.2, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              )}
            </motion.button>
            
            {/* Dashboard Items */}
            <AnimatePresence>
              {isDashboardExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-1"
                >
                  {dashboardTabs.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => {
                        if (tab.key === "schedule") {
                          setShowScheduleModal(true);
                        } else {
                          setActiveSection("dashboard");
                          setActiveTab(tab.key);
                        }
                      }}
                      whileHover={{ x: isSidebarCollapsed ? 0 : 3, scale: isSidebarCollapsed ? 1.08 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      title={isSidebarCollapsed ? tab.label : ""}
                      className={`w-full flex items-center rounded-lg font-medium transition-all ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                      } ${
                        activeSection === "dashboard" && activeTab === tab.key
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`transition-all flex-shrink-0 ${
                        isSidebarCollapsed ? 'text-lg' : 'text-base'
                      }`}>{tab.icon}</span>
                      <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-xs"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-4"></div>

          {/* Manage Clinic Section */}
          <div className="mb-4">
            {/* Manage Clinic Header - Collapsible (VS Code Style) */}
            <motion.button
              onClick={() => setIsManageExpanded(!isManageExpanded)}
              className={`w-full flex items-center justify-between mb-2 px-2 py-1.5 hover:bg-white/10 rounded transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <h3 className="text-white/90 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    🏛️ Manage Clinic
                  </h3>
                  <motion.svg
                    animate={{ 
                      rotate: isManageExpanded ? 180 : 0,
                      y: isManageExpanded ? 0 : [0, -2, 0]
                    }}
                    transition={{ 
                      rotate: { duration: 0.3 },
                      y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white/60"
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </>
              ) : (
                <div className="relative">
                  <span className="text-xl">🏛️</span>
                  <motion.div
                    animate={{ 
                      scale: isManageExpanded ? 1 : [1, 1.2, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              )}
            </motion.button>
            
            {/* Manage Clinic Items */}
            <AnimatePresence>
              {isManageExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-1"
                >
                  {manageClinicTabs.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => {
                        console.log(`🖱️ [SIDEBAR] Clicked on Manage Clinic tab:`, tab.key);
                        setActiveSection("manage");
                        setActiveTab(tab.key);
                        // Load API data based on tab
                        if (tab.key === "settings") {
                          console.log('⚙️ [SIDEBAR] Loading clinic settings...');
                          loadClinicData();
                        } else if (tab.key === "staff") {
                          console.log('👔 [SIDEBAR] Loading staff data...');
                          loadStaffData();
                        } else if (tab.key === "inventory") {
                          console.log('📦 [SIDEBAR] Loading inventory data from sidebar click...');
                          loadInventoryData();
                        }
                      }}
                      whileHover={{ x: isSidebarCollapsed ? 0 : 3, scale: isSidebarCollapsed ? 1.08 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      title={isSidebarCollapsed ? tab.label : ""}
                      className={`w-full flex items-center rounded-lg font-medium transition-all ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                      } ${
                        activeSection === "manage" && activeTab === tab.key
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`transition-all flex-shrink-0 ${
                        isSidebarCollapsed ? 'text-lg' : 'text-base'
                      }`}>{tab.icon}</span>
                      <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-xs"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-4"></div>

          {/* Bottom Actions */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className={`w-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/30 transition shadow-md border border-white/30 ${
                isSidebarCollapsed ? 'px-2 py-2.5 gap-0' : 'px-3 py-2.5 gap-2'
              }`}
              title={isSidebarCollapsed ? "Back to Home" : ""}
            >
              <span className={`transition-all ${
                isSidebarCollapsed ? 'text-lg' : 'text-sm'
              }`}>←</span>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.span
                    key="back-text"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap text-xs"
                  >
                    Back to Home
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1,
          y: 0,
          marginLeft: isSidebarCollapsed ? "64px" : "280px",
          paddingLeft: isSidebarCollapsed ? "2rem" : "2.5rem"
        }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.3 },
          y: { duration: 0.5, delay: 0.3 },
          marginLeft: { duration: 0.35, ease: "easeInOut" },
          paddingLeft: { duration: 0.35, ease: "easeInOut" }
        }}
        className="flex-1 pb-12 pr-8 pt-6 min-h-[calc(100vh-148px)]" style={{ marginTop: 0 }}
      >
        <AnimatePresence mode="wait">
          {/* Dashboard Section Tabs */}
          {activeSection === "dashboard" && activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    👨‍⚕️
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                      Welcome, Dr. {doctorName || 'Doctor'}
                    </h2>
                    <p className="text-stone-600 text-sm mt-1">Here's your practice overview for today</p>
                  </div>
                </div>

                {/* Quick Stats Grid - Navigatable Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("appointments")}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-xl p-5 border border-blue-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">📅</span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{dashboardMetrics.todayAppointments}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Appointments</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("patients")}
                    className="bg-gradient-to-br from-emerald-50 to-teal-100/50 rounded-xl p-5 border border-emerald-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">👥</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700">{dashboardMetrics.activePatients}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Patients</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("payments")}
                    className="bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-xl p-5 border border-amber-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">💰</span>
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-700">{dashboardMetrics.pendingPayments}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Payments</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("inventory")}
                    className="bg-gradient-to-br from-violet-50 to-purple-100/50 rounded-xl p-5 border border-violet-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">⚠️</span>
                      <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">Low Stock</span>
                    </div>
                    <p className="text-3xl font-bold text-violet-700">{dashboardMetrics.lowStockAlerts}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Alerts</p>
                  </motion.div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments Preview */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                      <span>📅</span> Next Appointments
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("appointments")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View All →
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {realAppointments
                      .filter(appt => {
                        const apptDateTime = new Date(appt.appointmentDate);
                        const now = new Date();
                        return apptDateTime >= now; // Show future appointments only
                      })
                      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
                      .slice(0, 3)
                      .map((appt) => {
                        const apptDate = new Date(appt.appointmentDate);
                        const dateStr = apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const timeStr = appt.startTime || apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const patientName = `${appt.firstName || ''} ${appt.lastName || ''}`.trim() || 'Patient';
                        
                        return (
                          <motion.div
                            key={appt.appointmentId}
                            whileHover={{ x: 5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab("appointments")}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 cursor-pointer transition-all hover:shadow-md"
                          >
                            <div>
                              <p className="font-semibold text-stone-800 text-sm">{patientName}</p>
                              <p className="text-xs text-stone-600">{appt.appointmentType || 'Checkup'} • {timeStr}</p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                              {dateStr}
                            </span>
                          </motion.div>
                        );
                      })}
                    {realAppointments.filter(appt => new Date(appt.appointmentDate) >= new Date()).length === 0 && (
                      <p className="text-sm text-stone-500 text-center py-4">No upcoming appointments</p>
                    )}
                  </div>
                </div>

                {/* Critical Inventory Alerts */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-100/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                      <span>⚠️</span> Inventory Alerts
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("inventory")}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      View All →
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {clinicInventory
                      .filter(item => {
                        const available = item.quantityAvailable || item.stock || 0;
                        const reorder = item.reorderLevel || item.minStock || item.minimumStock || 0;
                        return available <= reorder;
                      })
                      .slice(0, 3)
                      .map((item) => {
                        const available = item.quantityAvailable || item.stock || 0;
                        const reorder = item.reorderLevel || item.minStock || item.minimumStock || 0;
                        const isCritical = available === 0 || available < (reorder * 0.5);
                        const itemName = item.itemName || item.name || 'Inventory Item';
                        
                        return (
                          <motion.div
                            key={item.inventoryId || item.id}
                            whileHover={{ x: 5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab("inventory")}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                              isCritical ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-stone-800 text-sm">{itemName}</p>
                              <p className="text-xs text-stone-600">Available: {available} • Reorder: {reorder}</p>
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              isCritical ? "bg-rose-200 text-rose-700" : "bg-amber-200 text-amber-700"
                            }`}>
                              {isCritical ? "Critical" : "Low Stock"}
                            </span>
                          </motion.div>
                        );
                      })}
                    {clinicInventory.filter(item => {
                      const available = item.quantityAvailable || item.stock || 0;
                      const reorder = item.reorderLevel || item.minStock || item.minimumStock || 0;
                      return available <= reorder;
                    }).length === 0 && (
                      <p className="text-sm text-stone-500 text-center py-4">No inventory alerts</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Schedule Tab - Using DoctorSchedule Component */}
          {activeSection === "dashboard" && activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <DoctorSchedule />
            </motion.div>
          )}

          {/* Clinic Details Tab */}
          {activeSection === "dashboard" && activeTab === "clinic" && (
            <motion.div
              key="clinic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {loadingClinicDetails ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 p-8 flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-6xl mb-4"
                    >
                      🏥
                    </motion.div>
                    <p className="text-teal-700 font-semibold">Loading clinic details...</p>
                  </div>
                </div>
              ) : doctorClinics.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 p-8">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-2xl font-bold text-amber-900 mb-2">No Clinics Found</h3>
                    <p className="text-amber-700 mb-6">You don't have any appointments assigned to clinics yet. Once you have appointments, clinic details will appear here.</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("appointments")}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      View Appointments →
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Clinic Selector */}
                  {doctorClinics.length > 1 ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 p-6">
                      <label className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-3 block">
                        🏥 Select a Clinic
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {doctorClinics.map((clinic) => (
                          <motion.button
                            key={clinic.clinicId}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedClinicForView(clinic.clinicId);
                              setSelectedClinicDetails(clinic);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                              selectedClinicForView === clinic.clinicId
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 border-teal-700 text-white shadow-xl'
                                : 'bg-white border-teal-200 text-teal-700 hover:border-teal-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">🏥</span>
                              <div className="text-left">
                                <p className="font-bold text-sm">{clinic.clinicName}</p>
                                <p className="text-xs opacity-75">ID: {clinic.clinicId} • {clinic.clinicCity}</p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : doctorClinics.length === 1 && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 p-6">
                      <label className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-3 block">
                        🏥 Your Clinic
                      </label>
                      <div className="p-6 rounded-xl border-2 border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                            🏥
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-teal-900">{doctorClinics[0].clinicName}</p>
                            <p className="text-sm text-teal-700">ID: {doctorClinics[0].clinicId} • {doctorClinics[0].clinicCity}</p>
                            <p className="text-xs text-teal-600 mt-1 italic">This is your only assigned clinic</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clinic Details */}
                  {selectedClinicDetails && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 p-8">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                          🏥
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 bg-clip-text text-transparent">
                            {selectedClinicDetails.clinicName}
                          </h2>
                          <p className="text-stone-600 text-sm">Clinic Information</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <span className="w-1 h-4 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></span>
                              Contact Information
                            </h3>
                            <div className="space-y-4 text-sm">
                              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                                <span className="text-teal-600 text-lg">📍</span>
                                <div className="text-stone-700 flex-1">
                                  <p className="font-semibold">{selectedClinicDetails.clinicAddress}</p>
                                  {selectedClinicDetails.clinicCity && (
                                    <p className="text-xs text-stone-600">{selectedClinicDetails.clinicCity}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                                <span className="text-teal-600 text-lg">📞</span>
                                <span className="text-stone-700">{selectedClinicDetails.clinicPhone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                                <span className="text-teal-600 text-lg">✉️</span>
                                <span className="text-stone-700 break-all">{selectedClinicDetails.clinicEmail || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                                <span className="text-teal-600 text-lg">🕒</span>
                                <span className="text-stone-700">{selectedClinicDetails.operatingHours || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></span>
                            Clinic Details
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <motion.div
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200/50 shadow-md"
                            >
                              <p className="text-3xl font-bold text-teal-700">{selectedClinicDetails.clinicId || '-'}</p>
                              <p className="text-xs text-stone-600 mt-2 font-medium">Clinic ID</p>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200/50 shadow-md"
                            >
                              <p className="text-3xl font-bold text-blue-700">{selectedClinicDetails.enterpriseId || '-'}</p>
                              <p className="text-xs text-stone-600 mt-2 font-medium">Enterprise ID</p>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200/50 shadow-md"
                            >
                              <p className="text-lg font-bold text-indigo-700">✅</p>
                              <p className="text-xs text-stone-600 mt-2 font-medium">Status: Active</p>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              className="bg-gradient-to-br from-slate-100 to-blue-50 rounded-xl p-5 border border-indigo-200/50 shadow-md"
                            >
                              <p className="text-lg font-bold text-indigo-700">📅</p>
                              <p className="text-xs text-stone-600 mt-2 font-medium">Your Clinic</p>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Patient Details Tab - Innovative Grid View */}
          {activeSection === "dashboard" && activeTab === "patients" && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md"
                    >
                      👥
                    </motion.div>
                    <div>
                      <h2 className="text-4xl font-bold">My Patients</h2>
                      <p className="text-blue-100 mt-1">Connected & Care Management System</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search patients by name or ID..."
                    value={myPatientsFilterText}
                    onChange={(e) => setMyPatientsFilterText(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 border-2 border-stone-300 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium transition"
                  />
                </div>

                {/* Clinic Filter */}
                <select
                  value={myPatientsSelectedClinic}
                  onChange={(e) => setMyPatientsSelectedClinic(e.target.value)}
                  className="px-4 py-3 border-2 border-stone-300 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium transition bg-white"
                >
                  <option value="">Select Clinic</option>
                  {(doctorClinics || []).map((clinic) => (
                    <option key={clinic.clinicId} value={clinic.clinicId}>
                      {clinic.clinicName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats Cards */}
              {myPatients.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border-2 border-blue-200">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-blue-900">{myPatients.length}</div>
                    <div className="text-sm text-blue-700">Total Patients</div>
                  </motion.div>
                  <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border-2 border-emerald-200">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold text-emerald-900">{filteredMyPatients.length}</div>
                    <div className="text-sm text-emerald-700">Matching Search</div>
                  </motion.div>
                  <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border-2 border-purple-200">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-2xl font-bold text-purple-900">{Math.round((filteredMyPatients.length / Math.max(myPatients.length, 1)) * 100)}%</div>
                    <div className="text-sm text-purple-700">Match Rate</div>
                  </motion.div>
                  <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border-2 border-orange-200">
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="text-2xl font-bold text-orange-900">{loadingMyPatients ? '...' : 'Ready'}</div>
                    <div className="text-sm text-orange-700">Status</div>
                  </motion.div>
                </div>
              )}

              {/* Patients Grid */}
              {loadingMyPatients ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"
                  ></motion.div>
                  <p className="text-stone-600 font-semibold text-lg">Loading your patients...</p>
                </div>
              ) : filteredMyPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl border-2 border-dashed border-stone-300">
                  <div className="text-6xl mb-4">👨‍⚕️</div>
                  <p className="text-stone-600 font-semibold text-lg mb-2">No Patients Found</p>
                  <p className="text-stone-500 text-sm">Start by adding patients to your clinic</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMyPatients.sort((a, b) => (a.patientId || 0) - (b.patientId || 0)).map((patient, idx) => (
                    <motion.div
                      key={patient.patientId || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                      className="group relative bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:border-blue-400 transition-all cursor-pointer"
                    >
                      {/* Gradient Background */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 group-hover:h-1 transition-all"></div>

                      {/* Avatar Section */}
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-5xl mb-3 mx-auto backdrop-blur-md">
                          {patient.firstName?.charAt(0) || 'P'}{patient.lastName?.charAt(0) || 'P'}
                        </div>
                        <h3 className="text-center text-xl font-bold">{patient.firstName} {patient.lastName}</h3>
                        <p className="text-center text-blue-100 text-sm mt-1">ID: #{patient.patientId}</p>
                      </div>

                      {/* Patient Details */}
                      <div className="p-6 space-y-4">
                        {/* Contact & Demographics */}
                        <div className="space-y-2">
                          {patient.email && (
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📧</span>
                              <span className="text-sm text-stone-600 break-all">{patient.email}</span>
                            </div>
                          )}
                          {patient.primaryPhoneNumber && (
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📱</span>
                              <span className="text-sm font-semibold text-stone-800">{patient.primaryPhoneNumber}</span>
                            </div>
                          )}
                          {patient.dateOfBirth && (
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🎂</span>
                              <span className="text-sm text-stone-600">{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        {(patient.address || patient.city) && (
                          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">📍 Address</p>
                            <p className="text-sm text-stone-700">{patient.address || 'N/A'}, {patient.city || ''}</p>
                          </div>
                        )}

                        {/* Action Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Navigate to view patient details
                            navigate(`/patients`, { state: { selectedPatient: patient, isModal: true } });
                          }}
                          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group/btn"
                        >
                          <span>👁️</span>
                          <span>View Details</span>
                          <span className="ml-auto group-hover/btn:translate-x-1 transition">→</span>
                        </motion.button>
                      </div>

                      {/* Corner Badge */}
                      <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Active
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Payment Status Tab */}
          {activeSection === "dashboard" && activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
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
                      <p className="text-sm text-stone-600 mt-0.5">Track and manage patient payments and billing status</p>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="text-sm font-semibold text-stone-700 mb-2 block">From Date:</label>
                      <input
                        type="date"
                        value={paymentStartDate}
                        onChange={(e) => setPaymentStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium text-stone-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-stone-700 mb-2 block">To Date (Optional):</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={paymentEndDate}
                          onChange={(e) => setPaymentEndDate(e.target.value)}
                          className="flex-1 px-3 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium text-stone-700"
                        />
                        {paymentEndDate && (
                          <button
                            onClick={() => setPaymentEndDate("")}
                            className="px-2 py-2.5 text-red-600 hover:text-red-700 font-bold"
                            title="Clear end date"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-stone-700 mb-2 block">Clinic ID:</label>
                      <input
                        type="number"
                        value={paymentClinicId}
                        onChange={(e) => setPaymentClinicId(e.target.value)}
                        placeholder="Enter Clinic ID"
                        className="w-full px-3 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-medium text-stone-700"
                      />
                    </div>
                    <div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadPaymentAppointments}
                        disabled={loadingPayments}
                        className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>🔍</span>
                        <span>{loadingPayments ? 'Loading...' : 'Search Payments'}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

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
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 ${
                              paymentStatusFilter === status
                                ? status === 'All' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-200' :
                                  status === 'Paid' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white ring-4 ring-emerald-200' :
                                  status === 'Partial' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white ring-4 ring-yellow-200' :
                                  'bg-gradient-to-r from-rose-500 to-red-600 text-white ring-4 ring-rose-200'
                                : 'bg-white text-stone-700 hover:bg-stone-100 border-2 border-stone-300'
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
                                  <span className="text-sm font-bold text-emerald-700">₹{(appt.paidAmount || 0).toLocaleString('en-IN')}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm font-bold text-rose-700">₹{(appt.pendingAmount || 0).toLocaleString('en-IN')}</span>
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
                      {paymentAppointments.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t-2 border-emerald-200">
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-4 border-2 border-indigo-200 shadow-md"
                          >
                            <p className="text-xs font-bold text-indigo-700 uppercase mb-1">Total Appointments</p>
                            <p className="text-3xl font-bold text-indigo-900">{paymentAppointments.length}</p>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 border-2 border-emerald-200 shadow-md"
                          >
                            <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Total Collected</p>
                            <p className="text-3xl font-bold text-emerald-900">
                              ₹{paymentAppointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0).toLocaleString('en-IN')}
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-gradient-to-br from-rose-50 to-red-100 rounded-xl p-4 border-2 border-rose-200 shadow-md"
                          >
                            <p className="text-xs font-bold text-rose-700 uppercase mb-1">Total Pending</p>
                            <p className="text-3xl font-bold text-rose-900">
                              ₹{paymentAppointments.reduce((sum, a) => sum + (a.pendingAmount || 0), 0).toLocaleString('en-IN')}
                            </p>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-4 border-2 border-amber-200 shadow-md"
                          >
                            <p className="text-xs font-bold text-amber-700 uppercase mb-1">Grand Total</p>
                            <p className="text-3xl font-bold text-amber-900">
                              ₹{paymentAppointments.reduce((sum, a) => sum + (a.billableAmount || 0), 0).toLocaleString('en-IN')}
                            </p>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Appointments Tab */}
          {activeSection === "dashboard" && activeTab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-violet-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        📅
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
                          Appointments & Cancellations
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Upcoming appointments and recent cancellations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/calendar")}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <span>📆</span>
                        <span>Calendar View</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenBooking}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <span>➕</span>
                        <span>Book New Appointment</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Date Range Filter and My Appointments Controls */}
                <div className="px-6 py-5 bg-stone-50 border-b border-stone-200">
                  {/* Date Range Filter Section */}
                  <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                      {/* From Date */}
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">📅 From Date *</label>
                        <input
                          type="date"
                          value={appointmentStartDate}
                          onChange={(e) => {
                            setAppointmentStartDate(e.target.value);
                            setAppointmentDateValidationError("");
                            // Auto-clear To Date if it becomes invalid
                            if (appointmentEndDate && new Date(e.target.value) > new Date(appointmentEndDate)) {
                              setAppointmentEndDate("");
                            }
                          }}
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition font-medium text-stone-900"
                        />
                        <p className="text-xs text-stone-500 mt-1.5">✓ Default: Today</p>
                      </div>

                      {/* To Date */}
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">📅 To Date <span className="text-stone-500 font-normal">(optional)</span></label>
                        <input
                          type="date"
                          value={appointmentEndDate}
                          onChange={(e) => {
                            setAppointmentEndDate(e.target.value);
                            setAppointmentDateValidationError("");
                          }}
                          min={appointmentStartDate}
                          disabled={!appointmentStartDate}
                          className={`w-full px-4 py-2.5 rounded-lg transition font-medium ${
                            !appointmentStartDate
                              ? 'bg-stone-200 border border-stone-300 text-stone-400 cursor-not-allowed'
                              : 'border border-stone-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-stone-900'
                          }`}
                        />
                        <p className="text-xs mt-1.5 text-stone-500">
                          {!appointmentStartDate ? '🔒 select From Date first' : appointmentEndDate ? '✓ selected' : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Clear Dates Option */}
                    {appointmentEndDate && (
                      <div className="flex justify-start">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setAppointmentEndDate("");
                            setAppointmentDateValidationError("");
                          }}
                          className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition"
                        >
                          ✕ Clear To Date
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Status Filter Buttons */}
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-stone-700 uppercase tracking-widest">🎯 Filter by Status:</span>
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-violet-300 to-transparent"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getAppointmentStatuses().map((status) => (
                        <motion.button
                          key={status}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedAppointmentStatus(status)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                            selectedAppointmentStatus === status
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                              : 'bg-white text-stone-700 border-2 border-violet-200 hover:border-violet-400 shadow-sm'
                          }`}
                        >
                          <span>{status === 'Scheduled' ? '📅' : status === 'Confirmed' ? '✅' : status === 'Cancelled' ? '❌' : status === 'Pending' ? '⏳' : '📌'}</span>
                          <span>{status}</span>
                          {status !== 'All' && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              selectedAppointmentStatus === status
                                ? 'bg-white bg-opacity-30 text-white'
                                : 'bg-violet-100 text-violet-700'
                            }`}>
                              {realAppointments.filter(a => (a.status || 'Scheduled') === status).length}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                    {selectedAppointmentStatus !== 'All' && (
                      <div className="mt-3 text-sm text-stone-600 font-medium">
                        Showing <span className="font-bold text-violet-600">{realAppointments.length}</span> {selectedAppointmentStatus} appointments
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loadingAppointments ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
                      <p className="mt-4 text-stone-600 font-medium">Loading appointments...</p>
                    </div>
                  ) : realAppointments.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-bold text-stone-700 mb-2">No Appointments Found</h3>
                      <p className="text-stone-500">There are no appointments scheduled for this clinic.</p>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {realAppointments.map((appt, idx) => (
                        <motion.div
                          key={appt.appointmentId}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, type: "spring" }}
                          className="relative group"
                        >
                          {/* Gradient Background Blur */}
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-purple-300 to-pink-300 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-300"></div>
                          
                          {/* Card Content */}
                          <div className="relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-violet-200 hover:border-violet-400 overflow-hidden">
                            {/* Status Badge - Enhanced */}
                            <div className="absolute top-0 right-0">
                              <div className="bg-gradient-to-br from-violet-600 to-purple-600 text-white px-4 py-2 rounded-bl-xl font-bold text-sm shadow-lg flex items-center gap-2">
                                <span>{(appt.status || 'Scheduled') === 'Confirmed' ? '✅' : (appt.status || 'Scheduled') === 'Cancelled' ? '❌' : (appt.status || 'Scheduled') === 'Pending' ? '⏳' : '📅'}</span>
                                <span>{appt.status || 'Scheduled'}</span>
                              </div>
                            </div>
                            
                            {/* Patient Info */}
                            <div className="mb-4 pt-2">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {appt.firstName?.charAt(0)}{appt.lastName?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-stone-800">
                                    {appt.firstName} {appt.lastName}
                                  </h3>
                                  <p className="text-xs text-stone-500">ID: {appt.patientId}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Appointment Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-2 text-sm bg-stone-50 p-2 rounded-lg">
                                <span className="text-lg">📅</span>
                                <div>
                                  <span className="font-semibold text-stone-700">Date:</span>
                                  <span className="text-stone-600 ml-2">
                                    {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    }) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm bg-stone-50 p-2 rounded-lg">
                                <span className="text-lg">⏰</span>
                                <div>
                                  <span className="font-semibold text-stone-700">Time:</span>
                                  <span className="text-stone-600 ml-2">{appt.startTime || 'N/A'}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm bg-stone-50 p-2 rounded-lg">
                                <span className="text-lg">🏥</span>
                                <div>
                                  <span className="font-semibold text-stone-700">Type:</span>
                                  <span className="text-stone-600 ml-2">{appt.appointmentType || 'General'}</span>
                                </div>
                              </div>
                              
                              {appt.attendingPhysician && (
                                <div className="flex items-center gap-2 text-sm bg-stone-50 p-2 rounded-lg">
                                  <span className="text-lg">👨‍⚕️</span>
                                  <div>
                                    <span className="font-semibold text-stone-700">Doctor:</span>
                                    <span className="text-stone-600 ml-2">{appt.attendingPhysician}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              {/* View Details Button */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                  const hydrated = await fetchAppointmentDetails(appt);
                                  setSelectedAppointmentDetails(hydrated);
                                  setShowAppointmentDetails(true);
                                }}
                                className="py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                <span>📋</span>
                                <span>Details</span>
                              </motion.button>

                              {/* Cancel Button - Only show if not already cancelled */}
                              {(appt.status || 'Scheduled') !== 'Cancelled' && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => cancelAppointment(appt)}
                                  className="py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                  <span>❌</span>
                                  <span>Cancel</span>
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Inventory Tab */}
          {activeSection === "dashboard" && activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        📦
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                          Clinic Inventory
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage inventory items and place orders</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddNewItem}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                      >
                        + Add Item
                      </button>
                      {newItems.length > 0 && (
                        <button
                          onClick={handleSaveNewItems}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                        >
                          Save New Items
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Existing Inventory Items */}
                    {loadingInventory ? (
                      <div className="col-span-full text-center py-10">
                        <p className="text-stone-600">Loading inventory...</p>
                      </div>
                    ) : inventoryItems.length === 0 ? (
                      <div className="col-span-full text-center py-10">
                        <p className="text-stone-600">No inventory items found for this clinic.</p>
                      </div>
                    ) : inventoryItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-stone-800 text-sm mb-1">{item.item}</h3>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              {item.category}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">Available:</span>
                            <span className="font-bold text-stone-800 text-base">{item.available}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">On Order:</span>
                            <span className="font-semibold text-stone-700">{item.ordered || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">Reorder Level:</span>
                            <span className="font-semibold text-stone-700">{item.reorderLevel}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handlePlaceOrder(item)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition text-sm shadow-md"
                        >
                          Place Order
                        </button>
                      </motion.div>
                    ))}
                    
                    {/* New Item Entry Cards */}
                    {newItems.map((newItem) => (
                      <motion.div
                        key={newItem.tempId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-xl p-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Item Name *</label>
                            <input
                              type="text"
                              value={newItem.item}
                              onChange={(e) => handleNewItemChange(newItem.tempId, 'item', e.target.value)}
                              placeholder="Enter item name"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                            <input
                              type="text"
                              value={newItem.category}
                              onChange={(e) => handleNewItemChange(newItem.tempId, 'category', e.target.value)}
                              placeholder="e.g., Supplies, Medication"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Quantity *</label>
                              <input
                                type="number"
                                value={newItem.available}
                                onChange={(e) => handleNewItemChange(newItem.tempId, 'available', e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Reorder At</label>
                              <input
                                type="number"
                                value={newItem.reorderLevel}
                                onChange={(e) => handleNewItemChange(newItem.tempId, 'reorderLevel', e.target.value)}
                                placeholder="10"
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setNewItems(newItems.filter(item => item.tempId !== newItem.tempId))}
                            className="w-full px-3 py-2 bg-rose-100 text-rose-700 rounded-lg font-semibold hover:bg-rose-200 transition text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Order Modal */}
              <AnimatePresence>
                {orderModalOpen && orderItem && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setOrderModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-200"
                    >
                      <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <h3 className="text-xl font-bold text-amber-900">Place Order</h3>
                        <p className="text-sm text-stone-600 mt-1">Submit a purchase order for inventory replenishment</p>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Item</label>
                          <p className="text-lg font-bold text-stone-800">{orderItem.item}</p>
                          <p className="text-xs text-stone-600 mt-1">Category: {orderItem.category}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Quantity Required *</label>
                          <input
                            type="number"
                            value={orderQuantity}
                            onChange={(e) => setOrderQuantity(e.target.value)}
                            placeholder="Enter quantity to order"
                            min="1"
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Vendor *</label>
                          <select
                            value={selectedVendor}
                            onChange={(e) => setSelectedVendor(e.target.value)}
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          >
                            <option value="">Select a vendor</option>
                            {vendors.map((vendor, idx) => (
                              <option key={idx} value={vendor}>{vendor}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">Current Stock:</span> {orderItem.available} units<br/>
                            <span className="font-semibold">Reorder Level:</span> {orderItem.reorderLevel} units
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 border-t border-stone-200 flex gap-3">
                        <button
                          onClick={() => setOrderModalOpen(false)}
                          className="flex-1 px-4 py-3 border border-stone-300 rounded-lg text-stone-700 font-semibold hover:bg-stone-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmOrder}
                          disabled={!orderQuantity || !selectedVendor}
                          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                            orderQuantity && selectedVendor
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-md'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Place Order
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Success Modal */}
              <AnimatePresence>
                {successModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSuccessModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 text-center"
                    >
                      <div className="p-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg"
                        >
                          ✓
                        </motion.div>
                        <h3 className="text-2xl font-bold text-emerald-700 mb-2">Order Placed Successfully!</h3>
                        <p className="text-stone-600 mb-6">
                          Your order has been submitted and will be processed shortly.
                        </p>
                        <button
                          onClick={() => setSuccessModalOpen(false)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition shadow-md"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Today's Summary Tab */}
          {activeSection === "dashboard" && activeTab === "today-summary" && (
            <motion.div
              key="today-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-yellow-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      ⭐
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text text-transparent">
                        Today's Summary
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Quick overview of today's activities and metrics</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                      <div className="text-3xl mb-2">📅</div>
                      <p className="text-xs text-stone-600 mb-1">Today's Appointments</p>
                      <p className="text-2xl font-bold text-blue-700">12</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                      <div className="text-3xl mb-2">✓</div>
                      <p className="text-xs text-stone-600 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-emerald-700">8</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                      <div className="text-3xl mb-2">⏳</div>
                      <p className="text-xs text-stone-600 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-orange-700">4</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                      <div className="text-3xl mb-2">💰</div>
                      <p className="text-xs text-stone-600 mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-purple-700">$2,450</p>
                    </motion.div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="text-lg font-bold text-stone-800 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 pb-3 border-b border-yellow-100">
                        <span className="text-2xl">👨‍⚕️</span>
                        <div className="flex-1">
                          <p className="font-semibold text-stone-800">Dr. Sarah Johnson</p>
                          <p className="text-xs text-stone-600">Completed Root Canal Treatment - Patient: John Doe</p>
                          <p className="text-xs text-stone-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pb-3 border-b border-yellow-100">
                        <span className="text-2xl">📋</span>
                        <div className="flex-1">
                          <p className="font-semibold text-stone-800">New Appointment Booked</p>
                          <p className="text-xs text-stone-600">Patient: Emily Davis - Cleaning Session</p>
                          <p className="text-xs text-stone-500 mt-1">1 hour ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💳</span>
                        <div className="flex-1">
                          <p className="font-semibold text-stone-800">Payment Received</p>
                          <p className="text-xs text-stone-600">Patient: Michael Brown - $350 for Whitening</p>
                          <p className="text-xs text-stone-500 mt-1">30 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Follow-ups Tab */}
          {activeSection === "dashboard" && activeTab === "follow-ups" && (
            <motion.div
              key="follow-ups"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      🔔
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">
                        Follow-ups
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Patient follow-ups and recall schedules</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {[
                      { patient: "John Doe", type: "Post-Treatment", date: "2024-01-15", status: "Pending" },
                      { patient: "Sarah Williams", type: "Routine Check-up", date: "2024-01-18", status: "Scheduled" },
                      { patient: "Michael Brown", type: "Dental Cleaning", date: "2024-01-22", status: "Overdue" }
                    ].map((followup, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-cyan-50 rounded-xl p-4 border border-cyan-200 flex items-start gap-4 hover:shadow-md transition">
                        <div className="text-3xl">📞</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-stone-800">{followup.patient}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              followup.status === "Overdue" ? "bg-red-100 text-red-700" :
                              followup.status === "Scheduled" ? "bg-green-100 text-green-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {followup.status}
                            </span>
                          </div>
                          <p className="text-sm text-stone-600 mb-2">{followup.type}</p>
                          <p className="text-xs text-stone-500">Due: {new Date(followup.date).toLocaleDateString()}</p>
                        </div>
                        <button className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition">Schedule</button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Treatment Plans Tab */}
          {activeSection === "dashboard" && activeTab === "treatment-plans" && (
            <motion.div
              key="treatment-plans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-orange-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      💼
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                        Treatment Plans
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Active and pending treatment plans</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { patient: "John Doe", plan: "Complete Smile Makeover", progress: 65, estimated: "3 weeks" },
                      { patient: "Emily Davis", plan: "Orthodontic Braces", progress: 40, estimated: "12 weeks" },
                      { patient: "James Wilson", plan: "Implant Restoration", progress: 80, estimated: "2 weeks" }
                    ].map((plan, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-stone-800">{plan.patient}</h3>
                            <p className="text-sm text-stone-600">{plan.plan}</p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">Est: {plan.estimated}</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all" style={{ width: `${plan.progress}%` }}></div>
                        </div>
                        <p className="text-xs text-stone-600 mt-2">{plan.progress}% Complete</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Notes Tab */}
          {activeSection === "dashboard" && activeTab === "quick-notes" && (
            <motion.div
              key="quick-notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-lime-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-lime-50 to-green-50 border-b border-lime-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      ✏️
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-lime-700 to-green-700 bg-clip-text text-transparent">
                        Quick Notes
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Important reminders and clinical notes</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <textarea
                      placeholder="Add a new note..."
                      className="w-full px-4 py-3 border border-lime-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent transition resize-none"
                      rows="3"
                    ></textarea>
                    <button className="mt-2 px-4 py-2 bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition">Save Note</button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { date: "Today", text: "Schedule follow-up for patient John Doe", priority: "High" },
                      { date: "Yesterday", text: "Review treatment plan for Emily Davis", priority: "Medium" },
                      { date: "2 days ago", text: "Order missing supplies for clinic inventory", priority: "Low" }
                    ].map((note, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-lime-50 rounded-xl p-4 border border-lime-200 hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-stone-800">{note.text}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-stone-500">{note.date}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                note.priority === "High" ? "bg-red-100 text-red-700" :
                                note.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {note.priority}
                              </span>
                            </div>
                          </div>
                          <button className="text-stone-400 hover:text-red-500 transition">✕</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Patient History Tab */}
          {activeSection === "dashboard" && activeTab === "patient-history" && (
            <motion.div
              key="patient-history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PatientHistory clinicId={JSON.parse(localStorage.getItem('selectedAccess') || '{}')?.clinicId} />
            </motion.div>
          )}

          {/* Manage Clinic - Clinic Settings Tab */}
          {activeSection === "manage" && activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-slate-100 to-blue-50 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      ⚙️
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                        Clinic Settings
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Manage clinic information and preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  {loadingClinicData ? (
                    <div className="text-center py-12">
                      <div className="inline-block">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
                        />
                      </div>
                      <p className="text-stone-600 mt-4">Loading clinic data...</p>
                    </div>
                  ) : clinicData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Clinic Name</label>
                        <input type="text" defaultValue={clinicData.clinicName || "N/A"} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Registration Number</label>
                        <input type="text" defaultValue={clinicData.registrationNumber || "N/A"} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
                        <input type="text" defaultValue={clinicData.address || "N/A"} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Contact Email</label>
                        <input type="email" defaultValue={clinicData.email || "N/A"} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number</label>
                        <input type="tel" defaultValue={clinicData.phoneNumber || "N/A"} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-stone-600 font-medium">No clinic data available</p>
                      <p className="text-sm text-stone-500 mt-2">Please ensure you have permission to view clinic settings</p>
                    </div>
                  )}
                  {clinicData && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Clinic Name</label>
                          <p className="text-stone-800 font-medium">{clinicData.clinicName || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                        <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                          Cancel
                        </button>
                        <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                          Save Changes
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Staff Management Tab */}
          {activeSection === "manage" && activeTab === "staff" && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        👥
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                          Staff Management
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage clinic staff and their schedules</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      + Add Staff
                    </button>
                  </div>
                </div>

                {/* Staff Type Filter Tabs */}
                <div className="px-6 py-4 border-b border-teal-200 bg-gradient-to-r from-teal-50/50 to-emerald-50/50">
                  <div className="flex gap-2 flex-wrap">
                    {["All", ...(staffList ? [...new Set(staffList.map(s => s.role))].filter(Boolean) : [])].map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedStaffTypeFilter(type)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          selectedStaffTypeFilter === type
                            ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                            : "bg-white/60 text-stone-700 hover:bg-white/80 border border-teal-200/40"
                        }`}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Specialty</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Schedule</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Contact</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingStaffList ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="flex justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full"
                              />
                            </div>
                            <p className="text-stone-600 mt-3">Loading staff data...</p>
                          </td>
                        </tr>
                      ) : staffList && staffList.length > 0 ? (
                        (selectedStaffTypeFilter === "All" 
                          ? staffList 
                          : staffList.filter(staff => staff.role === selectedStaffTypeFilter)
                        ).map((staff, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                          >
                            <td className="px-6 py-4 font-medium text-stone-800">{staff.fullName || "N/A"}</td>
                            <td className="px-6 py-4 text-stone-600">{staff.role || "N/A"}</td>
                            <td className="px-6 py-4 text-stone-600">{staff.specialization || "N/A"}</td>
                            <td className="px-6 py-4 text-stone-600 text-xs">{staff.schedule || "N/A"}</td>
                            <td className="px-6 py-4 text-stone-600 text-xs">{staff.phone || staff.email || "N/A"}</td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => {
                                  setSelectedStaffForView(staff);
                                  setShowStaffDetailsModal(true);
                                }}
                                className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 transition"
                              >
                                View Details
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <p className="text-stone-600 font-medium">No staff members found</p>
                            <p className="text-sm text-stone-500 mt-1">Click "Load Data" to fetch staff information</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Schedule & Hours Tab */}
          {activeSection === "manage" && activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📅
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                        Schedule & Operating Hours
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Configure clinic operating hours and holidays</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <input type="checkbox" defaultChecked={day !== "Sunday"} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-stone-800">{day}</p>
                          <div className="flex gap-2 mt-2">
                            <input type="time" defaultValue="09:00" className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <span className="text-stone-500">to</span>
                            <input type="time" defaultValue="18:00" className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Holidays & Closures</h3>
                    <div className="space-y-2">
                      {[
                        { date: "2024-12-25", name: "Christmas Day" },
                        { date: "2024-01-01", name: "New Year's Day" },
                        { date: "2024-07-14", name: "Bastille Day" }
                      ].map((holiday, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div>
                            <p className="font-medium text-stone-800">{holiday.name}</p>
                            <p className="text-sm text-stone-600">{holiday.date}</p>
                          </div>
                          <button className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200 transition">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button className="w-full px-4 py-2 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition">
                        + Add Holiday
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Schedule
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Billing & Insurance Tab */}
          {activeSection === "manage" && activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      💳
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                        Billing & Insurance
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Manage payment methods and insurance settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-bold text-stone-800 mb-4">Payment Methods Accepted</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Payment", "Cheque"].map(method => (
                        <label key={method} className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-rose-50 transition">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500" />
                          <span className="text-sm font-medium text-stone-700">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Service Fee Schedule</h3>
                    <div className="space-y-2">
                      {[
                        { service: "General Consultation", fee: "₹50" },
                        { service: "Teeth Cleaning", fee: "₹80" },
                        { service: "Tooth Extraction", fee: "₹120" },
                        { service: "Dental Filling", fee: "₹90" },
                        { service: "Root Canal", fee: "₹350" },
                        { service: "Teeth Whitening", fee: "₹200" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                          <span className="font-medium text-stone-800">{item.service}</span>
                          <span className="text-rose-700 font-bold">{item.fee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Tax & Regulatory Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">VAT Number</label>
                        <input type="text" defaultValue="FR12345678901" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Tax Rate (%)</label>
                        <input type="number" defaultValue="20" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Reports & Analytics Tab */}
          {activeSection === "manage" && activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📊
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
                        Reports & Analytics
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">View clinic performance and statistics</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-stone-600 mb-1">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-amber-700">₹45,280</p>
                      <p className="text-xs text-emerald-600 mt-2">↑ 12.5% from last month</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                      <p className="text-sm text-stone-600 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-teal-700">1,247</p>
                      <p className="text-xs text-emerald-600 mt-2">↑ 8.3% from last month</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                      <p className="text-sm text-stone-600 mb-1">Appointments</p>
                      <p className="text-3xl font-bold text-indigo-700">342</p>
                      <p className="text-xs text-rose-600 mt-2">↓ 3.2% from last month</p>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Quick Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "Daily Appointments Summary", icon: "📋" },
                        { name: "Revenue by Service Type", icon: "💰" },
                        { name: "Patient Demographics", icon: "👥" },
                        { name: "Treatment Success Rates", icon: "✅" },
                        { name: "Insurance Claims Report", icon: "📄" },
                        { name: "Inventory Usage Analysis", icon: "📦" }
                      ].map((report, idx) => (
                        <button key={idx} className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200 hover:bg-amber-50 hover:border-amber-300 transition text-left">
                          <span className="text-2xl">{report.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-stone-800">{report.name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">Click to generate</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Custom Report Builder</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Report Type</label>
                        <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <option>Revenue Analysis</option>
                          <option>Patient Statistics</option>
                          <option>Appointment Trends</option>
                          <option>Treatment Analysis</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Date Range</label>
                        <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                          <option>Last 3 Months</option>
                          <option>Custom Range</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Inventory Tab */}
          {activeSection === "manage" && activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        📦
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                          Clinic Inventory
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage clinic supplies and medications inventory</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowInventoryModal(true);
                        setEditingInventoryItem(null);
                        setInventoryFormData({ name: '', category: '', stock: 0, minStock: 0, unitCost: 0, storageLocation: '' });
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Item Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Category</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">In Stock</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">Min Level</th>
                        <th className="px-6 py-3 text-right font-semibold text-stone-700">Unit Cost</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">Status</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingInventory ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full"
                              />
                            </div>
                            <p className="text-stone-600 mt-3">Loading inventory data...</p>
                          </td>
                        </tr>
                      ) : clinicInventory && clinicInventory.length > 0 ? (
                        clinicInventory.map((item, idx) => {
                          const currentStock = item.quantityAvailable || item.stock || 0;
                          const minStock = item.reorderLevel || item.minStock || item.minimumStock || 0;
                          let status = "OK";
                          let statusColor = "bg-emerald-100 text-emerald-700";
                          
                          if (currentStock === 0) {
                            status = "Out of Stock";
                            statusColor = "bg-red-100 text-red-700";
                          } else if (currentStock <= minStock) {
                            status = "Low Stock";
                            statusColor = "bg-yellow-100 text-yellow-700";
                          }
                          
                          return (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-b border-stone-100 hover:bg-amber-50/40 transition"
                            >
                              <td className="px-6 py-4 font-semibold text-stone-900">{item.itemName || item.name || "N/A"}</td>
                              <td className="px-6 py-4">
                                <span className="inline-block px-3 py-1 bg-stone-200 text-stone-700 rounded-full text-xs font-medium">
                                  {item.category || item.categoryName || "General"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-lg font-bold text-blue-700">{currentStock}</span>
                                <p className="text-xs text-stone-500">units</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm font-medium text-stone-700">{minStock}</span>
                                <p className="text-xs text-stone-500">minimum</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-lg font-bold text-green-700">₹{parseFloat(item.unitCost || item.cost || 0).toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingInventoryItem(item);
                                      setInventoryFormData({
                                        name: item.itemName || item.name || '',
                                        category: item.category || item.categoryName || '',
                                        stock: item.quantityAvailable || item.stock || 0,
                                        minStock: item.reorderLevel || item.minStock || item.minimumStock || 0,
                                        unitCost: item.unitCost || item.cost || 0,
                                        storageLocation: item.storageLocation || ''
                                      });
                                      setShowInventoryModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition transform hover:scale-105"
                                    title="Edit this item"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInventoryItem(item.inventoryId || item.id)}
                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition transform hover:scale-105"
                                    title="Delete this item"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="mb-4">
                              <p className="text-4xl">📭</p>
                            </div>
                            <p className="text-stone-600 font-semibold text-lg">No inventory items found</p>
                            <p className="text-sm text-stone-500 mt-1">Click "+ Add Item" to add your first inventory item</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-stone-50 border-t border-stone-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Total Items in Inventory</p>
                      <p className="text-2xl font-bold text-amber-700">{clinicInventory?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Total Stock Count</p>
                      <p className="text-2xl font-bold text-blue-700">{clinicInventory?.reduce((sum, item) => sum + (item.quantityAvailable || item.stock || 0), 0) || 0}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Low Stock Items</p>
                      <p className="text-2xl font-bold text-red-700">{clinicInventory?.filter(item => (item.quantityAvailable || item.stock || 0) <= (item.reorderLevel || item.minStock || item.minimumStock || 0)).length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Equipment & Assets Tab */}
          {activeSection === "manage" && activeTab === "equipment" && (
            <Assets />
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Edit Appointment Modal */}
      <EditAppointmentModal />
      
      {/* Staff Details Modal */}
      <AnimatePresence>
        {showStaffDetailsModal && selectedStaffForView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowStaffDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStaffForView?.fullName || "N/A"}</h2>
                    <p className="text-white/80 text-sm">{selectedStaffForView?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStaffDetailsModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                    <p className="text-xs font-semibold text-teal-600 uppercase mb-1">Role</p>
                    <p className="text-lg font-bold text-teal-900">{selectedStaffForView?.role || "N/A"}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Specialization</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedStaffForView?.specialization || "N/A"}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Email</p>
                    <p className="text-lg font-bold text-blue-900">{selectedStaffForView?.email || "N/A"}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Phone</p>
                    <p className="text-lg font-bold text-purple-900">{selectedStaffForView?.phone || "N/A"}</p>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4 border border-pink-200 md:col-span-2">
                    <p className="text-xs font-semibold text-pink-600 uppercase mb-1">License Number</p>
                    <p className="text-lg font-bold text-pink-900">{selectedStaffForView?.licenseNumber || "N/A"}</p>
                  </div>
                  {selectedStaffForView?.schedule && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 md:col-span-2">
                      <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Schedule</p>
                      <p className="text-lg font-bold text-amber-900">{selectedStaffForView.schedule}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-stone-50 border-t border-stone-200 px-8 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowStaffDetailsModal(false)}
                  className="px-6 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Add/Edit Modal */}
      <AnimatePresence>
        {showInventoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowInventoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📦</span> {editingInventoryItem ? "Edit Inventory" : "Add Inventory Item"}
                </h2>
              </div>

              {/* Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveInventoryItem();
                }}
                className="p-8 space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Item Name *</label>
                  <InventoryAutoComplete
                    value={{
                      itemId: inventoryFormData.itemId,
                      itemName: inventoryFormData.name,
                    }}
                    masterItems={masterItems}
                    placeholder="Search item... (e.g., Dental Bibs)"
                    onChange={(item) => {
                      setInventoryFormData({
                        ...inventoryFormData,
                        name: item.itemName,
                      });
                    }}
                    onSelect={(item) => {
                      setInventoryFormData({
                        ...inventoryFormData,
                        itemId: item.id,
                        name: item.itemName,
                        category: item.category,
                        subCategory: item.subCategory,
                        unit: item.unit,
                      });
                    }}
                    onAddNewItem={(itemData) => {
                      setAutocompleteNewItemName(itemData.searchValue);
                      setShowAddMasterFromAutocomplete(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Category *</label>
                  <select
                    value={inventoryFormData.category}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Materials">Materials</option>
                    <option value="PPE">PPE</option>
                    <option value="Medications">Medications</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Current Stock *</label>
                  <input
                    type="number"
                    value={inventoryFormData.stock}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Minimum Stock Level *</label>
                  <input
                    type="number"
                    value={inventoryFormData.minStock}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, minStock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    value={inventoryFormData.unitCost}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, unitCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInventoryModal(false);
                      setEditingInventoryItem(null);
                      setInventoryFormData({ name: '', category: '', stock: 0, minStock: 0, unitCost: 0, storageLocation: '' });
                    }}
                    className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                  >
                    {editingInventoryItem ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Book Appointment Modal */}
      <BookAppointmentModal />
      
      {/* Appointment Details Modal */}
      {AppointmentDetailsModal}
      
      {/* Visit Info Modal */}
      <AnimatePresence mode="wait">
        {showVisitInfoModal && (
          <VisitInfoModalExternal
            key="visit-info-modal"
            show={showVisitInfoModal}
            onClose={() => {
              setShowVisitInfoModal(false);
              if (selectedAppointmentDetails) {
                setShowAppointmentDetails(true);
              }
            }}
            selectedAppointment={selectedAppointmentForVisit}
            onVisitSaved={(savedVisitData) => {
              setShowVisitInfoModal(false);
              if (savedVisitData && selectedAppointmentDetails) {
                setSelectedAppointmentDetails((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    reasonForVisit: savedVisitData.reasonForVisit || prev.reasonForVisit,
                    notes: savedVisitData.notes || prev.notes,
                    diagnosis: savedVisitData.diagnosis || prev.diagnosis,
                    treatmentProvided: savedVisitData.treatmentProvided || prev.treatmentProvided,
                    existingVisitData: savedVisitData
                  };
                });
              }
              setShowAppointmentDetails(true);
              reloadVisitData();
            }}
            loadInventoryMedications={loadInventoryMedications}
            inventoryMeds={inventoryMeds}
            loadingMeds={loadingMeds}
            handleOpenAddMedicineModal={handleOpenAddMedicineModal}
            handleRemoveMedication={handleRemoveMedication}
            prescriptionId={prescriptionId}
            getPrescriptionById={getPrescriptionById}
            sendingEmail={sendingEmail}
            setSendingEmail={setSendingEmail}
            setSuccessMessage={setSuccessMessage}
            setShowPrescriptionSuccessModal={setShowPrescriptionSuccessModal}
            chronicDiseases={medicalInfoSummary.chronicDiseases}
            allergies={medicalInfoSummary.allergies}
            diagnosis={medicalInfoSummary.diagnosis}
            treatment={medicalInfoSummary.treatment}
            medications={medicalInfoSummary.medications}
            notes={medicalInfoSummary.notes}
            reasonForVisit={medicalInfoSummary.reasonForVisit}
            loadingMedicalInfo={medicalInfoLoading}
            medicalInfoError={medicalInfoError}
          />
        )}
      </AnimatePresence>
      
      {/* Prescription Modal */}
      <PrescriptionModal />

      {/* Print Preview Modal */}
      <PrintPreviewModal />

      {/* Add Medication to Inventory Modal */}
      <AddMedicationModal />

      {/* Prescription Writing Modal */}
      <PrescriptionWritingModal
        isOpen={showPrescriptionWritingModal}
        onClose={() => setShowPrescriptionWritingModal(false)}
        patientInfo={selectedAppointmentDetails}
        medicalHistory={patientMedicalInfo}
        doctorInfo={{
          doctorId: JSON.parse(localStorage.getItem("userData") || "{}").doctorId || 0,
          doctorName: JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor",
          registrationNumber: JSON.parse(localStorage.getItem("userData") || "{}").registrationNumber || ""
        }}
        appointmentId={selectedAppointmentDetails?.appointmentId}
        appointmentDetails={selectedAppointmentDetails}
        onSavePrescription={handleSavePrescription}
      />

      {/* View Prescription Modal */}
      <AnimatePresence>
        {showViewPrescriptionModal && viewedPrescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowViewPrescriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>👁️</span> View Prescription
                </h2>
                <button
                  onClick={() => setShowViewPrescriptionModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                {/* Prescription Details */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4">Prescription Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-stone-600 font-medium">Prescription ID</p>
                      <p className="font-bold text-stone-800">#{viewedPrescription.prescriptionId}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Appointment ID</p>
                      <p className="font-bold text-stone-800">#{viewedPrescription.appointmentId}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Created By</p>
                      <p className="font-bold text-stone-800">{viewedPrescription.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Created Date</p>
                      <p className="font-bold text-stone-800">
                        {new Date(viewedPrescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications List */}
                {viewedPrescription.medicationsJson && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Medications</h3>
                    <div className="space-y-3">
                      {typeof viewedPrescription.medicationsJson === 'string' 
                        ? JSON.parse(viewedPrescription.medicationsJson).map((med, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                              <p className="font-bold text-stone-800">{med.name} - {med.dosage}</p>
                              <p className="text-sm text-stone-600">Frequency: {med.frequency}</p>
                              <p className="text-sm text-stone-600">Duration: {med.duration}</p>
                              {med.instructions && (
                                <p className="text-sm text-stone-600">Instructions: {med.instructions}</p>
                              )}
                            </div>
                          ))
                        : viewedPrescription.medicationsJson?.map((med, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                              <p className="font-bold text-stone-800">{med.name} - {med.dosage}</p>
                              <p className="text-sm text-stone-600">Frequency: {med.frequency}</p>
                              <p className="text-sm text-stone-600">Duration: {med.duration}</p>
                              {med.instructions && (
                                <p className="text-sm text-stone-600">Instructions: {med.instructions}</p>
                              )}
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}

                {/* Prescription Text */}
                {viewedPrescription.prescriptionText && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Full Prescription</h3>
                    <p className="whitespace-pre-wrap font-mono text-sm text-stone-700">
                      {viewedPrescription.prescriptionText}
                    </p>
                  </div>
                )}

                {/* Special Instructions */}
                {viewedPrescription.specialInstructions && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">Special Instructions</h3>
                    <p className="text-stone-700">{viewedPrescription.specialInstructions}</p>
                  </div>
                )}

                {/* Notes */}
                {viewedPrescription.notes && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
                    <p className="text-stone-700">{viewedPrescription.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 border-t-2 border-stone-200 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowViewPrescriptionModal(false)}
                  className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
                >
                  Close
                </motion.button>
              </div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowEditPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>✏️</span> Edit Payment & Appointment
                </h2>
                <button
                  onClick={() => setShowEditPaymentModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Patient Info */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 mb-3">👤 Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-semibold">Name:</span>
                      <p className="text-stone-900">{editingPaymentAppointment.firstName} {editingPaymentAppointment.lastName}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-semibold">Date:</span>
                      <p className="text-stone-900">{new Date(editingPaymentAppointment.appointmentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Billing Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>💰</span> Billing Information
                  </h3>
                  
                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-2">Total Billable Amount (₹)</label>
                    <input
                      type="number"
                      value={editPaymentForm.billableAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditPaymentForm({
                          ...editPaymentForm,
                          billableAmount: val,
                          pendingAmount: Math.max(val - editPaymentForm.paidAmount, 0)
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-stone-700 block mb-2">Amount Paid (₹)</label>
                    <input
                      type="number"
                      value={editPaymentForm.paidAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const pending = Math.max(editPaymentForm.billableAmount - val, 0);
                        setEditPaymentForm({
                          ...editPaymentForm,
                          paidAmount: Math.min(val, editPaymentForm.billableAmount),
                          pendingAmount: pending
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                    />
                  </div>

                  <div className="bg-stone-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-stone-700">Pending Amount:</span>
                      <span className="text-xl font-bold text-rose-600">₹{editPaymentForm.pendingAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-stone-900">Payment Status</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['Paid', 'Partial', 'Pending'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setEditPaymentForm({ ...editPaymentForm, paymentStatus: status })}
                        className={`px-4 py-3 rounded-lg font-bold transition-all ${
                          editPaymentForm.paymentStatus === status
                            ? status === 'Paid' ? 'bg-emerald-500 text-white' : status === 'Partial' ? 'bg-yellow-500 text-white' : 'bg-rose-500 text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        {status === 'Paid' ? '✓' : status === 'Partial' ? '⚠' : '⏳'} {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appointment Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-stone-900">Appointment Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Scheduled', 'Completed', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setEditPaymentForm({ ...editPaymentForm, appointmentStatus: status })}
                        className={`px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                          editPaymentForm.appointmentStatus === status
                            ? 'bg-blue-500 text-white'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-stone-100 px-8 py-4 flex justify-end gap-3 border-t border-stone-200 sticky bottom-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditPaymentModal(false)}
                  className="px-6 py-2.5 text-stone-700 hover:text-stone-900 font-semibold transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSavePaymentEdit}
                  disabled={savingPaymentEdit}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPaymentEdit ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Print Modal */}
      <AnimatePresence>
        {showPrescriptionPrintModal && prescriptionToPrint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowPrescriptionPrintModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🖨️</span> Print Prescription
                </h2>
                <button
                  onClick={() => setShowPrescriptionPrintModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Prescription Preview */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <PrescriptionPrint
                  ref={printRef}
                  prescription={prescriptionToPrint}
                  patientInfo={selectedAppointmentDetails}
                  doctorInfo={{
                    doctorName: JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor",
                    registrationNumber: JSON.parse(localStorage.getItem("userData") || "{}").registrationNumber || ""
                  }}
                  clinicInfo={SAMPLE_CLINIC_DETAILS}
                />
              </div>

              {/* Footer */}
              <div className="bg-stone-100 px-8 py-5 flex justify-end gap-3 border-t border-stone-200 sticky bottom-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPrescriptionPrintModal(false)}
                  className="px-6 py-2.5 text-stone-700 hover:text-stone-900 font-semibold transition-colors"
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.group('%c🖨️ PRINT BUTTON CLICKED', 'color: red; font-weight: bold; font-size: 16px');
                    console.log('📋 Current prescription:', prescriptionToPrint);
                    console.log('👤 Patient details:', selectedAppointmentDetails);
                    const container = document.querySelector('.prescription-print-container');
                    console.log('%c📦 Container Check:', 'color: blue; font-weight: bold');
                    console.log('  - Container found:', !!container);
                    if (container) {
                      console.log('  - Container ID:', container.id);
                      console.log('  - Container classes:', container.className);
                      console.log('  - Container parent:', container.parentElement?.tagName);
                      console.log('  - Container grandparent:', container.parentElement?.parentElement?.tagName);
                      console.log('  - Content visible:', container.style.visibility !== 'hidden');
                      console.log('  - Display:', window.getComputedStyle(container).display);
                    }
                    console.log('%c🎯 Print command executing...', 'color: green; font-weight: bold');
                    console.groupEnd();
                    window.print();
                  }}
                  className="px-8 py-2.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print Now</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Edit Appointment Modal */}
      <FullEditAppointmentModal
        showEditModal={showEditModal}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        activeEditSection={activeEditSection}
        setActiveEditSection={setActiveEditSection}
        isUpdatingAppointment={isUpdatingAppointment}
        handleUpdateAppointmentSubmit={handleUpdateAppointmentSubmit}
        onCloseEditModal={handleCloseEditModal}
        doctorsList={doctorsList}
        setDoctorsList={setDoctorsList}
        loadingDoctors={loadingDoctors}
        setLoadingDoctors={setLoadingDoctors}
      />

      {/* View Prescription Modal */}
      <ViewPrescriptionModal />

      {/* Diagnosis Save Success Modal */}
      <AnimatePresence>
        {showDiagnosisSaveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-6xl mb-4 mx-auto w-fit"
              >
                ✨
              </motion.div>
              <h3 className="text-2xl font-bold text-green-600 mb-3">Success!</h3>
              <p className="text-lg text-stone-700 mb-6">{diagnosisSaveMessage}</p>
              <div className="w-full bg-gradient-to-r from-green-600 to-emerald-600 h-1 rounded-full mb-6"></div>
              <p className="text-sm text-stone-500">Closing in a moment...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medicine Save Success Modal */}
      <AnimatePresence>
        {showMedicineSaveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
            onClick={() => setShowMedicineSaveSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl mb-4 mx-auto w-fit"
              >
                💊
              </motion.div>
              <h3 className="text-2xl font-bold text-purple-600 mb-3">Awesome!</h3>
              <p className="text-lg text-stone-700 mb-6">{medicineSaveMessage}</p>
              <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 h-1 rounded-full mb-6"></div>
              <button
                onClick={() => setShowMedicineSaveSuccess(false)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Preview & Print Modal */}
      <AnimatePresence>
        {showPrescriptionPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[10002] p-4"
            onClick={() => setShowPrescriptionPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📋</span> Prescription Preview
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span> Print
                  </button>
                  <button
                    onClick={() => setShowPrescriptionPreview(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Prescription Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
                  {/* Clinic Header */}
                  <div className="border-b-4 border-indigo-600 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-indigo-900 mb-2">
                      {JSON.parse(localStorage.getItem("selectedAccess") || "{}").clinicName || "Dentaesthetics Clinic"}
                    </h1>
                    <p className="text-stone-600">Contact: +91 98765 43210 | Email: clinic@dentaesthetics.com</p>
                  </div>

                  {/* Doctor & Patient Info */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2 text-lg">Doctor Information</h3>
                      <p className="text-stone-700"><strong>Name:</strong> {JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor"}</p>
                      <p className="text-stone-700"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2 text-lg">Patient Information</h3>
                      <p className="text-stone-700"><strong>Name:</strong> {selectedAppointmentForVisit?.patientName || "Patient"}</p>
                      <p className="text-stone-700"><strong>Age:</strong> {selectedAppointmentForVisit?.patientAge || "N/A"}</p>
                      <p className="text-stone-700"><strong>Phone:</strong> {selectedAppointmentForVisit?.patientPhone || "N/A"}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {visitForm.diagnosis && (
                    <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                      <h3 className="font-bold text-amber-900 mb-2">Diagnosis</h3>
                      <p className="text-stone-700">{visitForm.diagnosis}</p>
                    </div>
                  )}

                  {/* Medications */}
                  <div className="mb-6">
                    <h3 className="font-bold text-indigo-900 mb-4 text-xl flex items-center gap-2 border-b-2 border-indigo-200 pb-2">
                      <span>💊</span> Prescribed Medications
                    </h3>
                    <div className="space-y-4">
                      {inlineMedications.map((med, index) => (
                        <div key={index} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-lg text-stone-900 mb-2">{index + 1}. {med.name}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-purple-900">Dosage:</span>
                              <p className="text-stone-700">{med.dosage}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-purple-900">Frequency:</span>
                              <p className="text-stone-700">{med.frequency}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-purple-900">Duration:</span>
                              <p className="text-stone-700">{med.duration}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-2">
                              <span className="font-semibold text-purple-900">Instructions:</span>
                              <p className="text-stone-700">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {visitForm.notes && (
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <h3 className="font-bold text-blue-900 mb-2">Additional Notes</h3>
                      <p className="text-stone-700">{visitForm.notes}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t-2 border-gray-300 pt-6 mt-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-stone-600">Follow-up: {visitForm.followUpDate || "As needed"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 mb-1">Doctor's Signature</p>
                        <div className="border-b-2 border-stone-400 w-48 mb-2"></div>
                        <p className="text-sm text-stone-600">{JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-100 px-8 py-4 flex items-center justify-between border-t">
                <p className="text-sm text-stone-600">{inlineMedications.length} medication(s) prescribed</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPrescriptionPreview(false)}
                    className="px-6 py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 rounded-lg font-semibold transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span> Print
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Prescription Modal */}
      <AnimatePresence>
        {printPrescriptionData && (
          <>
            {/* Print Styles - Only visible during printing */}
            <style>
              {`
                @media print {
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  
                  html, body {
                    width: 100%;
                    height: 100%;
                  }
                  
                  body {
                    display: block;
                  }
                  
                  body > * {
                    display: none !important;
                  }
                  
                  #printable-prescription {
                    display: block !important;
                    visibility: visible !important;
                    position: static;
                    width: 100%;
                    height: 100%;
                    background: white;
                    margin: 0;
                    padding: 20mm;
                    border: none;
                    box-shadow: none;
                    overflow: visible;
                  }
                  
                  #printable-prescription * {
                    visibility: visible !important;
                    display: block;
                  }
                  
                  @page {
                    margin: 15mm;
                    size: A4;
                  }
                }
              `}
            </style>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header - Hidden in print */}
                <div className="print:hidden sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 flex items-center justify-between z-50">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>🖨️</span> Prescription Preview
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPrintPrescriptionData(null)}
                    className="w-10 h-10 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition"
                  >
                    ✕
                  </motion.button>
                </div>

                {/* Printable Content */}
                <div id="printable-prescription" className="p-8 bg-white">
                  {/* Clinic Header */}
                  <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-blue-900 mb-1">DENTAESTHETICS</h1>
                    <p className="text-sm text-gray-600">Mumbai Central | Shop 12, Andheri West</p>
                    <p className="text-xs text-gray-500">Ph: +91 98765 43210</p>
                  </div>

                  {/* Patient & Date Info */}
                  <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Patient Name:</strong> {printPrescriptionData.patientName || 'N/A'}</p>
                      <p><strong>Age:</strong> {printPrescriptionData.patientAge || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
                      <p><strong>Dr.</strong> {printPrescriptionData.doctorName || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">DIAGNOSIS</h3>
                    <p className="text-sm">{printPrescriptionData.diagnosis || 'N/A'}</p>
                  </div>

                  {/* Medications */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-300 pb-1">℞ PRESCRIPTION</h3>
                    <div className="space-y-3">
                      {printPrescriptionData.medications && printPrescriptionData.medications.length > 0 ? (
                        printPrescriptionData.medications.map((med, idx) => (
                          <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                            <p className="font-semibold text-sm">{idx + 1}. {med.name || med.medicineName}</p>
                            <p className="text-xs text-gray-600 ml-4">
                              {med.dosage} - {med.frequency} - {med.duration}
                            </p>
                            {med.instructions && (
                              <p className="text-xs text-gray-500 ml-4 italic">{med.instructions}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No medications prescribed</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {printPrescriptionData.notes && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">NOTES</h3>
                      <p className="text-xs text-gray-600">{printPrescriptionData.notes}</p>
                    </div>
                  )}

                  {/* Signature */}
                  <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <p>Generated: {new Date().toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-center">
                      <div className="h-8 mb-1"></div>
                      <p className="text-xs border-t border-gray-400 pt-1">Doctor's Signature</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Hidden in print */}
                <div className="print:hidden bg-gray-100 px-8 py-4 flex justify-end gap-3 border-t">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPrintPrescriptionData(null)}
                    className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    <span>Print Now</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Prescription Success Modal */}
      <PrescriptionSuccessModal />

      {/* Add New Medicine Modal - Compact & Quick */}
      <AnimatePresence>
        {showAddMedicineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
            onClick={() => setShowAddMedicineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                  <span>💊</span> Quick Add Medicine
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddMedicineModal(false)}
                  className="w-8 h-8 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  ✕
                </motion.button>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-3 mb-5">
                <p className="text-sm text-purple-900 flex items-center gap-2">
                  <span>💡</span>
                  <span>After adding, this medicine will be automatically selected in your prescription form</span>
                </p>
              </div>

              <div className="space-y-4">
                {/* Medicine Name */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMedicineForm.itemName}
                    onChange={(e) => setNewMedicineForm(prev => ({ ...prev, itemName: e.target.value }))}
                    placeholder="e.g., Paracetamol, Amoxicillin"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    autoFocus
                  />
                </div>

                {/* Medicine Code */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Medicine Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMedicineForm.itemCode}
                    onChange={(e) => setNewMedicineForm(prev => ({ ...prev, itemCode: e.target.value }))}
                    placeholder="e.g., PARA001, AMOX002"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newMedicineForm.category}
                      onChange={(e) => setNewMedicineForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                      <option value="Medicines">Medicines</option>
                      <option value="Consumables">Consumables</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                      Unit
                    </label>
                    <select
                      value={newMedicineForm.unit}
                      onChange={(e) => setNewMedicineForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="ml">ML (Liquid)</option>
                      <option value="injection">Injection</option>
                      <option value="powder">Powder</option>
                      <option value="ointment">Ointment</option>
                      <option value="syrup">Syrup</option>
                      <option value="drops">Drops</option>
                    </select>
                  </div>
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    value={newMedicineForm.subCategory}
                    onChange={(e) => setNewMedicineForm(prev => ({ ...prev, subCategory: e.target.value }))}
                    placeholder="e.g., Antibiotic, Analgesic, Pain Relief"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddMedicineModal(false)}
                  className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddNewMedicine}
                  disabled={!newMedicineForm.itemName || !newMedicineForm.itemCode}
                  className={`flex-1 px-5 py-2.5 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${
                    !newMedicineForm.itemName || !newMedicineForm.itemCode
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl'
                  }`}
                >
                  <span>➕</span>
                  <span>Add to Inventory</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Success Popup */}
      <AnimatePresence>
        {showPaymentSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
            className="fixed top-20 right-8 z-[99999] max-w-md"
          >
            <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
              <div className="p-6 relative">
                {/* Animated background sparkles */}
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{ 
                    rotate: [360, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ 
                        rotate: [0, -15, 15, -15, 0],
                        scale: [1, 1.2, 1, 1.2, 1]
                      }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                      className="text-6xl"
                    >
                      🎉
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                        <span>✨</span> Success!
                      </h3>
                      <p className="text-white/95 text-sm leading-relaxed">
                        {paymentSuccessMessage}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPaymentSuccessPopup(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Progress bar */}
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1.5 bg-white/40 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Master Inventory Updated!"
        itemCount={successModalData.itemCount}
      />

      {/* Add to Master Inventory Modal */}
      <AddToMasterInventoryModal
        isOpen={showAddMasterFromAutocomplete}
        onClose={() => {
          setShowAddMasterFromAutocomplete(false);
          setAutocompleteNewItemName('');
        }}
        onSubmit={handleAddMasterItems}
        isLoading={loadingMasterModal}
        initialItemName={autocompleteNewItemName}
      />

      {/* Schedule Appointments Modal */}
      <ScheduleAppointmentsModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      />

      {/* Prescription Print Modal */}
      <AnimatePresence>
        {showPrescriptionPrintModal && selectedAppointmentForVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowPrescriptionPrintModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sticky top-0 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>🖨️</span> Print Prescription
                  </h2>
                  <p className="text-purple-100 text-sm mt-1">
                    {selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPrescriptionPrintModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <span className="text-2xl text-white">✕</span>
                </motion.button>
              </div>

              {/* Print Preview */}
              <div className="p-6 max-h-[70vh] overflow-y-auto bg-stone-50">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <PrescriptionPrint
                    prescription={{
                      diagnosisId: diagnosisData?.diagnosisId,
                      prescriptionContent: inlineMedications,
                      prescriptionDate: new Date(),
                      appointmentId: selectedAppointmentForVisit?.appointmentId
                    }}
                    patientInfo={{
                      patientId: selectedAppointmentForVisit?.patientId,
                      firstName: selectedAppointmentForVisit?.firstName,
                      lastName: selectedAppointmentForVisit?.lastName,
                      age: selectedAppointmentForVisit?.age,
                      gender: selectedAppointmentForVisit?.gender
                    }}
                    doctorInfo={{
                      doctorId: selectedAppointmentForVisit?.doctorId,
                      doctorName: selectedAppointmentForVisit?.doctorName,
                      registrationNumber: selectedAppointmentForVisit?.registrationNumber
                    }}
                    clinicInfo={{
                      clinicId: selectedAppointmentForVisit?.clinicId,
                      clinicName: selectedAppointmentForVisit?.clinicName,
                      address: selectedAppointmentForVisit?.clinicAddress,
                      phone: selectedAppointmentForVisit?.clinicPhone,
                      email: selectedAppointmentForVisit?.clinicEmail
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-stone-50 border-t border-stone-200 p-6 rounded-b-2xl flex justify-end gap-3 sticky bottom-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPrescriptionPrintModal(false)}
                  className="px-6 py-2.5 bg-stone-300 text-stone-800 rounded-lg font-semibold hover:bg-stone-400 transition"
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.print();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print Now</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




