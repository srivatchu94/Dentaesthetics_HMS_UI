import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getAccessToken, getClinicIdFromToken } from "../services/tokenManager";
import { createPatient, getPatientsByClinic, getPatientFullProfile, updatePatientFullProfile, searchPatients, deletePatient, getAllPatientsByClinicID, getPatientVisit } from "../services/patientService";
import { visitService } from "../services/visitService";
import { getDoctorsByClinicID } from "../api/hmsApi";
import { getClinicsByEnterpriseId } from "../services/doctorService";
import { createAppointment, listAppointments, getAppointmentsByFilters, getCalendarAppointments, updateAppointment, getAppointmentTypes, getAppointmentStatuses, getDoctorAppointmentsWithCount } from "../services/appointmentService";
import { sendPrescriptionEmail, sendEmail } from "../services/emailService";
import ViewPatients from "./ViewPatients";
import FancyDatePicker from "../components/FancyDatePicker";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE_URL = (import.meta).env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

const normalizePatientPayloadForModal = (payload) => {
  if (!payload) return null;

  const patient = payload.patient || {
    patientId: payload.patientId || payload.id || payload.patientID || payload.patientId,
    patientEntityID: payload.patientEntityID || payload.patientEntityId || payload.patientEntityID || "",
    patientFirstName: payload.patientFirstName || payload.firstName || "",
    patientLastName: payload.patientLastName || payload.lastName || "",
    patientDOB: payload.patientDOB || payload.dateOfBirth || "",
    patientGender: payload.patientGender || payload.gender || "",
    patientBloodType: payload.patientBloodType || payload.bloodType || "",
    clinicID: payload.clinicID || payload.clinicId || payload.clinic || ""
  };

  const patientContact = payload.patientContact || {
    patientPhone: payload.patientPhone || payload.phoneNumber || payload.primaryPhoneNumber || payload.patientPhoneNumber || "",
    patientEmail: payload.patientEmail || payload.email || "",
    patientAddress: payload.patientAddress || payload.address || "",
    patientCity: payload.patientCity || payload.city || "",
    patientEmergencyContact: payload.patientEmergencyContact || ""
  };

  const patientMedicalInfo = payload.patientMedicalInfo || {
    patientId: patient.patientId,
    patientAllergies: payload.patientAllergies || payload.allergies || "",
    patientCurrentMedications: payload.patientCurrentMedications || payload.currentMedications || "",
    patientPrimaryPhysician: payload.patientPrimaryPhysician || payload.primaryPhysician || "",
    no_of_visits: payload.patientMedicalInfo?.no_of_visits || payload.no_of_visits || 0,
    lastVisitedDate: payload.patientMedicalInfo?.lastVisitedDate || payload.lastVisitedDate || "",
    chronicDiseases: payload.patientMedicalInfo?.chronicDiseases || payload.chronicDiseases || "",
    medicalHistory: payload.patientMedicalInfo?.medicalHistory || payload.medicalHistory || ""
  };

  const patientInsurance = payload.patientInsurance || {
    patientId: patient.patientId,
    patientInsuranceProvider: payload.patientInsuranceProvider || payload.insuranceProvider || "",
    insuranceProviderId: payload.insuranceProviderId || null,
    policyNumber: payload.policyNumber || "",
    groupNumber: payload.groupNumber || "",
    policyHolderName: payload.policyHolderName || "",
    relationshipToPolicyHolder: payload.relationshipToPolicyHolder || "",
    coverageStartDate: payload.coverageStartDate || "",
    coverageEndDate: payload.coverageEndDate || "",
    isPrimary: payload.isPrimary || false,
    copayAmount: payload.copayAmount || "",
    deductibleAmount: payload.deductibleAmount || "",
    coveragePercentage: payload.coveragePercentage || null,
    insurancePhone: payload.insurancePhone || "",
    providerEmail: payload.providerEmail || "",
    providerAddress: payload.providerAddress || ""
  };

  return {
    patient,
    patientContact,
    patientMedicalInfo,
    patientInsurance
  };
};

// Reusable InputField component - moved outside to prevent re-creation on renders
const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", options = null, disabled = false, error = "" }) => (
  <div className="mb-2">
    <label className={`block text-xs font-medium mb-1 transition ${
      disabled ? "text-gray-400" : "text-gray-700"
    }`}>
      {label} {required && <span className="text-red-500">*</span>}
      {disabled && <span className="text-xs ml-1 text-gray-400">🔒</span>}
    </label>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-1.5 text-sm border rounded-lg transition ${
          error
            ? "border-red-400 focus:ring-1 focus:ring-red-500 focus:border-transparent"
            :
          disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-purple-300 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
        }`}
      >
        <option value="">{disabled ? "Select patient first" : `Select ${label}`}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={disabled ? "Select patient first to enable" : placeholder}
        rows={2}
        disabled={disabled}
        className={`w-full px-3 py-1.5 text-sm border rounded-lg resize-none transition ${
          error
            ? "border-red-400 focus:ring-1 focus:ring-red-500 focus:border-transparent"
            :
          disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-purple-300 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
        }`}
      />
    ) : type === "date" ? (
      <FancyDatePicker
        label=""
        name={name}
        value={value}
        onChange={(dateValue) => onChange({ target: { name, value: dateValue } })}
        required={required}
        disabled={disabled}
        restrictYearToFourDigits={[
          "dateOfBirth",
          "lastDentalVisit",
          "coverageStartDate",
          "coverageEndDate"
        ].includes(name)}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={disabled ? "Select patient first to enable" : placeholder}
        disabled={disabled}
        className={`w-full px-3 py-1.5 text-sm border rounded-lg transition ${
          error
            ? "border-red-400 focus:ring-1 focus:ring-red-500 focus:border-transparent"
            :
          disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-purple-300 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
        }`}
      />
    )}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

// Reusable CollapsibleSection component - moved outside to prevent re-creation on renders
const CollapsibleSection = ({ title, isOpen, onToggle, children, icon }) => (
  <div className="mb-4 border border-purple-200 rounded-lg overflow-hidden shadow-sm">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 flex items-center justify-between transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-amber-900 text-lg">{title}</span>
      </div>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="text-amber-700"
      >
        ▼
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="p-6 bg-white">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ChronicConditionsDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const conditions = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Arthritis", "Thyroid Disease", "Kidney Disease", "Liver Disease", "Cancer History"];
  const selected = value.split(',').filter(Boolean);
  const hasOther = selected.some((item) => item.startsWith('Other:'));
  const otherValue = selected.find((item) => item.startsWith('Other:'))?.replace('Other:', '') || '';

  const toggleCondition = (condition, checked) => {
    const current = selected.filter((item) => !item.startsWith('Other:'));
    const updated = checked
      ? [...current, condition]
      : current.filter((item) => item !== condition);
    const other = hasOther ? `Other:${otherValue}` : '';
    onChange([...updated, other].filter(Boolean).join(','));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition flex items-center justify-between"
      >
        <span className={`text-sm ${selected.length ? 'text-slate-700' : 'text-slate-500'}`}>
          {selected.length ? `${selected.length} selected` : 'Select chronic conditions'}
        </span>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg p-3 space-y-2 max-h-64 overflow-y-auto">
          {conditions.map((condition) => (
            <label key={condition} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition">
              <input
                type="checkbox"
                checked={selected.includes(condition)}
                onChange={(e) => toggleCondition(condition, e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">{condition}</span>
            </label>
          ))}

          <div className="border-t border-slate-200 pt-2">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition">
              <input
                type="checkbox"
                checked={hasOther}
                onChange={(e) => {
                  const current = selected.filter((item) => !item.startsWith('Other:'));
                  if (e.target.checked) {
                    onChange([...current, 'Other:'].join(','));
                  } else {
                    onChange(current.join(','));
                  }
                }}
                className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">Other (please specify)</span>
            </label>

            {hasOther && (
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm mt-2"
                placeholder="Please specify other conditions"
                value={otherValue}
                onChange={(e) => {
                  const current = selected.filter((item) => !item.startsWith('Other:'));
                  const other = e.target.value ? `Other:${e.target.value}` : 'Other:';
                  onChange([...current, other].join(','));
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sample patient data
const SAMPLE_PATIENTS_LIST = [
  { id: 1, firstName: "Sarah", lastName: "Johnson", dateOfBirth: "1985-03-15", gender: "Female", phoneNumber: "555-0101", email: "sarah.johnson@email.com", city: "New York", status: "Active", lastVisit: "2025-11-10", nextAppt: "2025-11-20" },
  { id: 2, firstName: "Michael", lastName: "Chen", dateOfBirth: "1978-07-22", gender: "Male", phoneNumber: "555-0102", email: "michael.chen@email.com", city: "Los Angeles", status: "Active", lastVisit: "2025-11-08", nextAppt: "2025-11-22" },
  { id: 3, firstName: "Emily", lastName: "Rodriguez", dateOfBirth: "1992-11-30", gender: "Female", phoneNumber: "555-0103", email: "emily.rodriguez@email.com", city: "Chicago", status: "Active", lastVisit: "2025-11-05", nextAppt: "2025-11-25" },
  { id: 4, firstName: "David", lastName: "Thompson", dateOfBirth: "1965-05-18", gender: "Male", phoneNumber: "555-0104", email: "david.thompson@email.com", city: "Houston", status: "Inactive", lastVisit: "2025-10-28", nextAppt: "2025-12-01" },
  { id: 5, firstName: "Lisa", lastName: "Martinez", dateOfBirth: "1988-09-12", gender: "Female", phoneNumber: "555-0105", email: "lisa.martinez@email.com", city: "Phoenix", status: "Active", lastVisit: "2025-11-12", nextAppt: "2025-11-18" },
  { id: 6, firstName: "James", lastName: "Wilson", dateOfBirth: "1995-01-25", gender: "Male", phoneNumber: "555-0106", email: "james.wilson@email.com", city: "Philadelphia", status: "Active", lastVisit: "2025-11-09", nextAppt: "2025-11-23" },
  { id: 7, firstName: "Maria", lastName: "Garcia", dateOfBirth: "1982-06-08", gender: "Female", phoneNumber: "555-0107", email: "maria.garcia@email.com", city: "San Antonio", status: "Active", lastVisit: "2025-11-11", nextAppt: "2025-11-21" },
  { id: 8, firstName: "Robert", lastName: "Anderson", dateOfBirth: "1970-12-03", gender: "Male", phoneNumber: "555-0108", email: "robert.anderson@email.com", city: "San Diego", status: "Inactive", lastVisit: "2025-10-15", nextAppt: "2025-12-10" },
];

export default function Patients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("list");
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    status: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // View Patients modal state
  const [showViewPatientsModal, setShowViewPatientsModal] = useState(false);
  
  // Appointments modal states
  const [showViewAppointmentsModal, setShowViewAppointmentsModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  
  // State for pre-populated appointment data from registration
  const [appointmentFromRegistration, setAppointmentFromRegistration] = useState(null);
  
  // Appointment booking form state
  const [appointmentForm, setAppointmentForm] = useState({
    // Patient details
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    age: "",
    // Scheduling
    date: "",
    startTime: "",
    endTime: "",
    durationMinutes: "",
    // Details
    appointmentType: "",
    reasonForVisit: "",
    notes: "",
    telehealthLink: "",
    attendingPhysician: "",
    // References
    doctorId: "",
    // Walk-in flag
    isWalkIn: false
  })
  
  // Patient search state for appointment booking
  const [patientSearchForm, setPatientSearchForm] = useState({
    clinicId: "",
    patientId: "",
    firstName: "",
    lastName: "",
    mobileNumber: ""
  });
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientNotFound, setPatientNotFound] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [bookingWithoutRegistration, setBookingWithoutRegistration] = useState(false);
  const [clinicsList, setClinicsList] = useState([]);
  const [clinicPatientsList, setClinicPatientsList] = useState([]);
  const [loadingClinicPatients, setLoadingClinicPatients] = useState(false);
  const [showAppointmentSuccessModal, setShowAppointmentSuccessModal] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [showBookingConflictMessage, setShowBookingConflictMessage] = useState(false);
  const [bookingConflictCount, setBookingConflictCount] = useState(0);
  const [allowConflictBooking, setAllowConflictBooking] = useState(false);
  const appointmentBookingFormRef = useRef(null);
  const [appointmentDoctors, setAppointmentDoctors] = useState([]);
  const [appointmentDoctorsLoading, setAppointmentDoctorsLoading] = useState(false);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editAppointmentForm, setEditAppointmentForm] = useState(null);
  const [showAppointmentUpdateSuccess, setShowAppointmentUpdateSuccess] = useState(false);
  const [showNotLoggedInModal, setShowNotLoggedInModal] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(!!localStorage.getItem('accessToken'));

  const normalizePhoneNumber = (value) => value.replace(/\D/g, '').slice(0, 10);
  const normalizeIndianPhoneDigits = (value) => {
    const rawValue = String(value || "").trim();
    let normalizedValue = rawValue;

    if (normalizedValue.startsWith("+91")) {
      normalizedValue = normalizedValue.slice(3);
    }

    let digits = normalizedValue.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) {
      digits = digits.slice(2);
    }
    return digits.slice(0, 10);
  };
  const formatIndianPhone = (value) => {
    return normalizeIndianPhoneDigits(value);
  };
  const addIndianCountryCode = (value) => {
    const digits = normalizeIndianPhoneDigits(value);
    return digits ? `+91${digits}` : "";
  };
  const isValidIndianPhone = (value) => /^\d{10}$/.test(String(value || ""));
  const isValidPostalCode = (value) => /^\d{6}$/.test(String(value || ""));
  const validateEmailDomain = (email) => {
    if (!email) return "";
    const normalizedEmail = String(email).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return "Please enter a valid email format (example@domain.com)";
    }
    const domain = normalizedEmail.split("@")[1] || "";
    const tld = domain.split(".").pop() || "";
    if (tld.length < 2) {
      return "Please enter a valid email domain";
    }
    return "";
  };
  const isYearLengthValid = (dateValue) => {
    if (!dateValue) return true;
    const [year] = String(dateValue).split('-');
    return !year || year.length <= 4;
  };
  const isStrictDateWithFourDigitYear = (dateValue) => /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ""));

  // Initialize appointment form with pre-populated data from registration
  useEffect(() => {
    if (appointmentFromRegistration && showNewAppointmentModal) {
      setAppointmentForm(prev => ({
        ...prev,
        firstName: appointmentFromRegistration.firstName,
        lastName: appointmentFromRegistration.lastName,
        email: appointmentFromRegistration.email,
        phoneNumber: normalizeIndianPhoneDigits(appointmentFromRegistration.phoneNumber),
        dateOfBirth: appointmentFromRegistration.dateOfBirth
      }));
      // Enable form editing when prepopulated from registration
      setBookingWithoutRegistration(true);
      setAppointmentFromRegistration(null); // Clear after using
    }
  }, [appointmentFromRegistration, showNewAppointmentModal]);

  useEffect(() => {
    if (!showNewAppointmentModal) return;

    const selectedAccessStr = localStorage.getItem('selectedAccess');
    const selectedAccess = selectedAccessStr ? JSON.parse(selectedAccessStr) : null;
    const clinicId = selectedAccess?.clinicId;

    console.log("🔍 Fetching doctors for clinicId:", clinicId);

    if (!clinicId) {
      console.warn("⚠️ No clinicId found in selectedAccess");
      setAppointmentDoctors([]);
      setAppointmentDoctorsLoading(false);
      return;
    }

    const fetchDoctors = async () => {
      try {
        setAppointmentDoctorsLoading(true);
        console.log("🔄 Starting doctor fetch...");
        const doctorsList = await getDoctorsByClinicID(Number(clinicId));
        console.log("🏥 Walk-in doctors response:", doctorsList);
        
        let rawDoctors = Array.isArray(doctorsList)
          ? doctorsList
          : Array.isArray(doctorsList?.data)
            ? doctorsList.data
            : Array.isArray(doctorsList?.doctors)
              ? doctorsList.doctors
              : [];

        console.log("📋 Raw doctors array:", rawDoctors);

        // Normalize the doctor data to have consistent field names
        let normalizedDoctors = rawDoctors.map((item) => ({
          doctorId: item.doctorId || item.doctorID || item.id || item.staffId || "",
          firstName: item.firstName || item.FirstName || "",
          lastName: item.lastName || item.LastName || "",
          name: `${item.firstName || item.FirstName || ""} ${item.lastName || item.LastName || ""}`.trim(),
          email: item.email || item.Email || "",
          phone: item.phone || item.Phone || "",
          specialization: item.specialization || item.Specialization || ""
        }));

        console.log("📋 Normalized doctors:", normalizedDoctors);

        // Fallback: try staff profile search for clinic and filter Doctor/Nurse roles
        if (normalizedDoctors.length === 0) {
          console.log("⚠️ No doctors found, trying fallback staff profile fetch...");
          try {
            const response = await fetch(`${API_BASE_URL}/StaffDetail/GetStaffProfile?clinicId=${clinicId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              const staffList = Array.isArray(data) ? data : data?.data || [];
              const filtered = staffList.filter(item => {
                const role = (item.roleType || item.role || item.roleName || "").toLowerCase();
                return role.includes("doctor") || role.includes("nurse") || role.includes("dentist") || role.includes("physician");
              });
              const fallbackList = filtered.length > 0 ? filtered : staffList;
              
              // Normalize fallback data too
              normalizedDoctors = fallbackList.map((item) => ({
                doctorId: item.doctorId || item.doctorID || item.id || item.staffId || "",
                firstName: item.firstName || item.FirstName || "",
                lastName: item.lastName || item.LastName || "",
                name: `${item.firstName || item.FirstName || ""} ${item.lastName || item.LastName || ""}`.trim(),
                email: item.email || item.Email || "",
                phone: item.phone || item.Phone || "",
                specialization: item.specialization || item.Specialization || ""
              }));
              
              console.log("✅ Fallback staff found and normalized:", normalizedDoctors);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback staff profile fetch failed:', fallbackError);
          }
        }

        console.log("✅ Setting appointment doctors:", normalizedDoctors);
        setAppointmentDoctors(normalizedDoctors);
      } catch (error) {
        console.error('❌ Failed to fetch doctors for appointment:', error);
        setAppointmentDoctors([]);
      } finally {
        console.log("🏁 Doctor fetch complete, setting loading to false");
        setAppointmentDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, [showNewAppointmentModal]);

  useEffect(() => {
    if (!showNewAppointmentModal) {
      setShowBookingConflictMessage(false);
      setBookingConflictCount(0);
      setAllowConflictBooking(false);
      setPatientSearchForm({ clinicId: "", patientId: "", firstName: "", lastName: "", mobileNumber: "" });
      setSearchedPatient(null);
      setPatientNotFound(false);
      setPatientSearchResults([]);
      setBookingWithoutRegistration(false);
      setAppointmentForm({
        firstName: "", lastName: "", phoneNumber: "", email: "", dateOfBirth: "", age: "",
        date: "", startTime: "", endTime: "", durationMinutes: "",
        appointmentType: "", reasonForVisit: "", notes: "", telehealthLink: "",
        attendingPhysician: "", doctorId: "", isWalkIn: false
      });
    }
  }, [showNewAppointmentModal]);
  
  // Diagnosis modal states
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Appointment filter state
  const [appointmentFilter, setAppointmentFilter] = useState({
    clinicId: "",
    firstName: "",
    lastName: "",
    doctorId: "",
    patientId: "",
    mobilenumber: "",
    fromDate: "",
    toDate: "",
    status: "All",
    appointmentType: "All"
  });
  const [appointmentDateValidationError, setAppointmentDateValidationError] = useState("");
  const [filteredAppointmentsList, setFilteredAppointmentsList] = useState([]);
  const [distinctStatuses, setDistinctStatuses] = useState([]);
  const [distinctAppointmentTypes, setDistinctAppointmentTypes] = useState([]);
  const [mobileNumberError, setMobileNumberError] = useState('');
  const [appointmentPhoneError, setAppointmentPhoneError] = useState('');
  
  // Load clinics on mount
  useEffect(() => {
    const enterpriseId = localStorage.getItem('enterpriseId') || '1';
    getClinicsByEnterpriseId(parseInt(enterpriseId))
      .then(clinics => setClinicsList(clinics))
      .catch(err => console.error('Failed to load clinics:', err));
  }, []);

  // Load patients when appointment modal opens
  useEffect(() => {
    if (showNewAppointmentModal) {
      const clinicId = localStorage.getItem('clinicId');
      if (clinicId) {
        setLoadingClinicPatients(true);
        getAllPatientsByClinicID(parseInt(clinicId))
          .then(patients => {
            setClinicPatientsList(patients);
          })
          .catch(err => {
            console.error('Failed to load clinic patients:', err);
            setClinicPatientsList([]);
          })
          .finally(() => setLoadingClinicPatients(false));
      }
    }
  }, [showNewAppointmentModal]);

  // Check login status on mount and when active view changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsUserLoggedIn(!!token);
    console.log('✅ Login status updated:', !!token);
  }, [activeView]);

  // Also check on initial mount
  useEffect(() => {
    const token = getAccessToken();
    setIsUserLoggedIn(!!token);
    console.log('✅ Initial login check:', !!token);
    
    // Debug: Log all credentials
    if (token) {
      console.log('🔐 User is logged in');
      console.log('📋 Token:', token.substring(0, 20) + '...');
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('👤 User Data:', { username: user.username, userId: user.userId });
      }
    } else {
      console.log('❌ No token found in sessionStorage');
      console.log('📦 Available sessionStorage keys:', Object.keys(sessionStorage));
      console.log('📦 Available localStorage keys:', Object.keys(localStorage));
    }
  }, []);
  
  // Function to load appointments
  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const appointments = await listAppointments();
      setAppointmentsList(appointments);
      setFilteredAppointmentsList(appointments);
      
      // Fetch distinct statuses from backend API
      console.log('📡 Fetching appointment statuses from backend...');
      const statuses = await getAppointmentStatuses();
      setDistinctStatuses(statuses);
      console.log('✅ Distinct Statuses from API:', statuses);
      
      // Fetch distinct appointment types from backend API
      console.log('📡 Fetching appointment types from backend...');
      const types = await getAppointmentTypes();
      setDistinctAppointmentTypes(types);
      console.log('✅ Distinct Appointment Types from API:', types);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
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

    // Check if length is exactly 10
    if (mobileNumber.length !== 10) {
      setMobileNumberError("⚠️ Mobile number must be exactly 10 digits");
      return false;
    }

    // Validation passed
    setMobileNumberError("");
    return true;
  };

  // Function to filter appointments via API and apply local status/type filters
  const filterAppointments = async () => {
    if (!appointmentFilter.clinicId) {
      alert('⚠️ Clinic ID is required to search appointments');
      return;
    }

    // Validate mobile number if provided
    if (!validateMobileNumber(appointmentFilter.mobilenumber)) {
      return;
    }

    // Validate date range
    if (appointmentFilter.toDate && !appointmentFilter.fromDate) {
      setAppointmentDateValidationError("❌ 'From Date' is required when 'To Date' is selected");
      return;
    }

    if (appointmentFilter.fromDate && appointmentFilter.toDate) {
      const fromDate = new Date(appointmentFilter.fromDate);
      const toDate = new Date(appointmentFilter.toDate);
      
      if (toDate < fromDate) {
        setAppointmentDateValidationError("❌ 'To Date' must be greater than or equal to 'From Date'");
        return;
      }
    }
    
    setLoadingAppointments(true);
    try {
      // Build filter params for GetAppointmentByIdwithDateRange API
      const apiFilterParams = {
        clinicId: appointmentFilter.clinicId,
        firstName: appointmentFilter.firstName || undefined,
        lastName: appointmentFilter.lastName || undefined,
        doctorId: appointmentFilter.doctorId || undefined,
        patientId: appointmentFilter.patientId ? parseInt(appointmentFilter.patientId) : undefined,
        mobilenumber: appointmentFilter.mobilenumber || undefined,
        fromDate: appointmentFilter.fromDate || undefined,
        toDate: appointmentFilter.toDate || undefined
      };

      // Remove undefined values
      Object.keys(apiFilterParams).forEach(key => 
        apiFilterParams[key] === undefined && delete apiFilterParams[key]
      );

      console.log('🔍 SEARCHING APPOINTMENTS with filters:', apiFilterParams);
      console.log('📡 Calling GetAppointmentByIdwithDateRange API...');
      
      // Call the proper API endpoint: GetAppointmentByIdwithDateRange
      const results = await getAppointmentsByFilters(apiFilterParams);
      console.log('✅ API RESULTS from GetAppointmentByIdwithDateRange:', results?.length || 0, 'appointments found');
      
      const sorted = [...(results || [])].sort((a, b) =>
        new Date(b.appointmentDate || b.AppointmentDate || 0) - new Date(a.appointmentDate || a.AppointmentDate || 0)
      );
      setFilteredAppointmentsList(sorted);

      if (!sorted.length) {
        alert('ℹ️ No appointments found matching the search criteria');
      }
    } catch (error) {
      console.error('❌ Failed to filter appointments:', error);
      alert('❌ Failed to search appointments. Please try again.');
      setFilteredAppointmentsList([]);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  // Reset filters
  const resetAppointmentFilters = () => {
    setAppointmentFilter({
      clinicId: "",
      firstName: "",
      lastName: "",
      doctorId: "",
      patientId: "",
      mobilenumber: "",
      fromDate: "",
      toDate: "",
      status: "All",
      appointmentType: "All"
    });
    setMobileNumberError("");
    setAppointmentDateValidationError("");
    setFilteredAppointmentsList(appointmentsList);
  };

  // Unified close handler for edit appointment modal (exits edit mode only)
  const handleCloseEditAppointment = () => {
    setIsEditingAppointment(false);
    setEditAppointmentForm(null);
  };

  // Unified close handler for entire appointment details modal
  const handleCloseAppointmentDetails = () => {
    setSelectedAppointmentDetails(null);
    setIsEditingAppointment(false);
    setEditAppointmentForm(null);
  };

  // Load diagnosis details for an appointment
  const loadDiagnosisDetails = async (appointmentId) => {
    console.log('🔍 loadDiagnosisDetails called with appointmentId:', appointmentId);
    console.log('📊 Current showDiagnosisModal state:', showDiagnosisModal);
    
    if (!appointmentId) {
      console.warn('⚠️ No appointment ID found');
      alert('❌ No appointment ID found. Cannot load diagnosis details.');
      return;
    }
    
    console.log('📋 Setting loading state to true and opening diagnosis modal...');
    setLoadingDiagnosis(true);
    setShowDiagnosisModal(true);
    console.log('📋 showDiagnosisModal state setter called - should update to true');
    
    try {
      console.log('📋 Loading diagnosis for appointment ID:', appointmentId);
      const diagnosisData = await getPatientVisit(appointmentId);
      console.log('✅ Diagnosis data received:', diagnosisData);

      // 204 No Content or empty response — show friendly empty state
      if (!diagnosisData) {
        setSelectedDiagnosis(null);
        setLoadingDiagnosis(false);
        return;
      }

      // Transform diagnosis data to ensure patient name and gender are populated
      const transformedData = {
        ...diagnosisData,
        patientName: diagnosisData.patientName || `${diagnosisData.patientFirstName || ''} ${diagnosisData.patientLastName || ''}`.trim() || 'N/A',
        patientGender: diagnosisData.patientGender || diagnosisData.gender || 'N/A'
      };

      // Normalize attending physician display name: prefer explicit full name fields,
      // fall back to first/last name components, then to createdBy/doctorName fields,
      // finally construct a readable name from an email local-part if needed.
      try {
        const doctorFirst = diagnosisData.doctorFirstName || diagnosisData.attendingDoctorFirstName || diagnosisData.doctorFirstName || '';
        const doctorLast = diagnosisData.doctorLastName || diagnosisData.attendingDoctorLastName || diagnosisData.doctorLastName || '';
        const possibleNameFields = [
          diagnosisData.attendingPhysicianName,
          diagnosisData.attendingPhysicianFullName,
          diagnosisData.doctorName,
          diagnosisData.createdByName,
          diagnosisData.fullName,
          diagnosisData.createdBy
        ];

        let attendingDisplay = possibleNameFields.find(f => f && String(f).trim());

        if (!attendingDisplay && (doctorFirst || doctorLast)) {
          attendingDisplay = `${doctorFirst} ${doctorLast}`.trim();
        }

        if (!attendingDisplay && diagnosisData.attendingPhysician && String(diagnosisData.attendingPhysician).includes('@')) {
          // Convert email local-part to a human name: venkatesh.srinivasan -> Venkatesh Srinivasan
          const emailName = String(diagnosisData.attendingPhysician).split('@')[0];
          attendingDisplay = emailName.split(/[._\-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }

        // Ensure display includes 'Dr.' prefix unless already present
        try {
          const raw = attendingDisplay || diagnosisData.attendingPhysician || 'N/A';
          const trimmed = String(raw).trim();
          const displayName = (/^dr\.?\s+/i).test(trimmed)
            ? trimmed
            : (trimmed === 'N/A' ? 'N/A' : `Dr. ${trimmed}`);
          transformedData.attendingPhysician = displayName;
        } catch (err) {
          transformedData.attendingPhysician = attendingDisplay || diagnosisData.attendingPhysician || 'N/A';
        }
      } catch (e) {
        console.warn('Failed to normalize attending physician name', e);
        transformedData.attendingPhysician = diagnosisData.attendingPhysician || 'N/A';
      }
      
      console.log('✅ Transformed diagnosis data:', transformedData);
      setSelectedDiagnosis(transformedData);
    } catch (error) {
      console.error("❌ Error loading diagnosis:", error);
      setSelectedDiagnosis(null);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  // Generate PDF from prescription
  const generateDiagnosisPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFillColor(102, 126, 234);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text('Diagnosis & Prescription Report', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('Medical Consultation Summary', pageWidth / 2, 30, { align: 'center' });

      // Reset text color
      pdf.setTextColor(50, 50, 50);
      yPosition = 50;

      // Patient Info
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Patient Information', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Name: ${selectedDiagnosis?.patientName || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`ID: ${selectedDiagnosis?.patientId || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Gender: ${selectedDiagnosis?.patientGender || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Doctor: ${selectedDiagnosis?.attendingPhysician || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Visit Date: ${selectedDiagnosis?.visitDate ? new Date(selectedDiagnosis.visitDate).toLocaleDateString() : 'N/A'}`, 20, yPosition);
      yPosition += 12;

      // Reason for Visit
      if (selectedDiagnosis?.reasonForVisit) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Reason for Visit', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const reasonLines = pdf.splitTextToSize(selectedDiagnosis.reasonForVisit, pageWidth - 40);
        pdf.text(reasonLines, 20, yPosition);
        yPosition += reasonLines.length * 6 + 6;
      }

      // Diagnosis
      if (selectedDiagnosis?.diagnoses) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Diagnosis', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const diagnosisLines = pdf.splitTextToSize(selectedDiagnosis.diagnoses, pageWidth - 40);
        pdf.text(diagnosisLines, 20, yPosition);
        yPosition += diagnosisLines.length * 6 + 6;
      }

      // Treatments
      if (selectedDiagnosis?.treatments) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Treatments', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const treatmentLines = pdf.splitTextToSize(selectedDiagnosis.treatments, pageWidth - 40);
        pdf.text(treatmentLines, 20, yPosition);
        yPosition += treatmentLines.length * 6 + 6;
      }

      // Medications
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Medications', 20, yPosition);
      yPosition += 8;

      try {
        const presData = typeof selectedDiagnosis?.prescriptions === 'string'
          ? JSON.parse(selectedDiagnosis.prescriptions)
          : selectedDiagnosis?.prescriptions;
        
        const medications = (Array.isArray(presData) ? presData : [presData]).filter(m => m);

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        medications.forEach((med) => {
          const medText = `• ${med.medicineName || med.name || 'N/A'} - Dosage: ${med.dosage || 'N/A'} - Frequency: ${med.frequency || 'N/A'} - Duration: ${med.duration || 'N/A'}`;
          const medLines = pdf.splitTextToSize(medText, pageWidth - 40);
          
          if (yPosition + medLines.length * 5 > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(medLines, 20, yPosition);
          yPosition += medLines.length * 5 + 2;
          
          if (med.specialInstructions) {
            const instructionsText = `Special Instructions: ${med.specialInstructions}`;
            const instructionsLines = pdf.splitTextToSize(instructionsText, pageWidth - 40);
            if (yPosition + instructionsLines.length * 5 > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.setFont(undefined, 'italic');
            pdf.text(instructionsLines, 20, yPosition);
            pdf.setFont(undefined, 'normal');
            yPosition += instructionsLines.length * 5 + 2;
          }
        });
      } catch (e) {
        pdf.text('No medications recorded', 20, yPosition);
        yPosition += 8;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('This is an automated diagnosis and prescription report from the clinic management system.', pageWidth / 2, pageHeight - 10, { align: 'center' });

      const patientName = selectedDiagnosis?.patientName || 'Patient';
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`Diagnosis_${patientName}_${timestamp}.pdf`);
      
      alert('✅ Diagnosis PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating PDF. Please try again.');
    }
  };

  // Send diagnosis email
  const handleSendDiagnosisEmail = async () => {
    try {
      setSendingEmail(true);
      
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
      
      // Get patient email from selectedDiagnosis - try multiple field names
      const patientEmail = selectedDiagnosis?.email || selectedDiagnosis?.patientEmail || selectedDiagnosis?.emailAddress;
      if (!patientEmail) {
        alert('❌ Patient email not available. Cannot send email.');
        console.error('Patient email fields:', {email: selectedDiagnosis?.email, patientEmail: selectedDiagnosis?.patientEmail, emailAddress: selectedDiagnosis?.emailAddress});
        return;
      }

      // Build prescription content from selectedDiagnosis
      let prescriptionContent = '';
      let prescriptionHTML = '<ul style="margin: 10px 0; padding-left: 20px;">';
      
      try {
        const presData = typeof selectedDiagnosis.prescriptions === 'string'
          ? JSON.parse(selectedDiagnosis.prescriptions)
          : selectedDiagnosis.prescriptions;
        
        if (Array.isArray(presData) && presData.length > 0) {
          prescriptionContent = presData.map(m => 
            `${m.medicineName || m.name} - ${m.dosage} - ${m.frequency} - ${m.duration}`
          ).join('\n');
          prescriptionHTML = presData.map(m => 
            `<li style="margin: 5px 0;">${m.medicineName || m.name} - Dosage: ${m.dosage || 'N/A'} - Frequency: ${m.frequency || 'N/A'} - Duration: ${m.duration || 'N/A'}</li>`
          ).join('');
        } else if (typeof presData === 'object' && presData !== null) {
          prescriptionContent = JSON.stringify(presData, null, 2);
          prescriptionHTML = `<li>${JSON.stringify(presData)}</li>`;
        }
      } catch (e) {
        prescriptionContent = typeof selectedDiagnosis.prescriptions === 'string' ? selectedDiagnosis.prescriptions : JSON.stringify(selectedDiagnosis.prescriptions);
        prescriptionHTML = `<li>${prescriptionContent}</li>`;
      }
      prescriptionHTML += '</ul>';

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <!-- Header
             -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0;">Diagnosis & Prescription Report</h1>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Medical Consultation Summary</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px;">
            <!-- Patient & Clinic Info -->
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 10px;">Patient Information</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${selectedDiagnosis?.patientName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Gender:</strong> ${selectedDiagnosis?.patientGender || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${patientEmail}</p>
              <p style="margin: 5px 0;"><strong>Clinic:</strong> ${userData.clinicName || selectedAccess.clinicName || 'Our Clinic'}</p>
            </div>
            
            <!-- Diagnosis -->
            ${selectedDiagnosis?.diagnoses ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🩺 Diagnosis</h3>
                <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${selectedDiagnosis.diagnoses}</p>
              </div>
            ` : ''}
            
            <!-- Treatment -->
            ${selectedDiagnosis?.treatments ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💉 Treatment Provided</h3>
                <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${selectedDiagnosis.treatments}</p>
              </div>
            ` : ''}
            
            <!-- Medications -->
            ${prescriptionContent ? `
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💊 Prescribed Medications</h3>
                <pre style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; color: #555; white-space: pre-wrap; font-family: monospace;">${prescriptionContent}</pre>
              </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
              <p>This is an automated prescription report. Please consult with your doctor for any clarifications.</p>
              <p>© ${new Date().getFullYear()} ${userData.clinicName || selectedAccess.clinicName || 'Clinic'}. All rights reserved.</p>
            </div>
          </div>
        </div>
      `;

      const response = await sendEmail({
        Email: patientEmail,
        Subject: `Diagnosis & Prescription Report from ${userData.clinicName || 'Clinic'}`,
        HtmlBody: emailHTML
      });

      if (response.success) {
        alert('✅ Diagnosis email sent successfully!');
        setShowEmailModal(false);
      } else {
        alert('❌ Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Error sending email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Send diagnosis via WhatsApp
  const handleSendDiagnosisWhatsApp = () => {
    const patientPhone = selectedDiagnosis?.phoneNumber || selectedDiagnosis?.phone || '';
    if (!patientPhone) {
      alert('Patient phone number not available');
      return;
    }

    try {
      // Format prescription for WhatsApp
      let prescriptionText = '';
      try {
        const presData = typeof selectedDiagnosis?.prescriptions === 'string'
          ? JSON.parse(selectedDiagnosis.prescriptions)
          : selectedDiagnosis?.prescriptions;
        
        if (Array.isArray(presData) && presData.length > 0) {
          prescriptionText = presData.map(m => 
            `• ${m.medicineName || m.name} - ${m.dosage || 'N/A'} - ${m.frequency || 'N/A'} - ${m.duration || 'N/A'}`
          ).join('\n');
        } else if (typeof presData === 'object' && presData !== null) {
          prescriptionText = JSON.stringify(presData, null, 2);
        } else {
          prescriptionText = selectedDiagnosis?.prescriptions || 'N/A';
        }
      } catch (e) {
        prescriptionText = typeof selectedDiagnosis?.prescriptions === 'string' ? selectedDiagnosis.prescriptions : 'Prescription data';
      }
      
      const messageText = `🏥 *Diagnosis & Prescription Report*\n\n` +
        `👤 *Patient:* ${selectedDiagnosis?.patientName || 'N/A'}\n\n` +
        `📋 *Diagnosis:*\n${selectedDiagnosis?.diagnoses || 'N/A'}\n\n` +
        `💉 *Treatment:*\n${selectedDiagnosis?.treatments || 'N/A'}\n\n` +
        `💊 *Medications:*\n${prescriptionText}\n\n` +
        `*For queries, please contact the clinic.* ☺️`;
      
      const encodedText = encodeURIComponent(messageText);
      const whatsappURL = `https://api.whatsapp.com/send?phone=${patientPhone}&text=${encodedText}`;
      window.open(whatsappURL, '_blank');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('❌ Error opening WhatsApp. Please try again.');
    }
  };


  // Handle Visit Filtering
  const handleFilterVisits = async () => {
    setLoadingVisits(true);
    try {
      let visits = [];

      // Priority: Patient ID > Clinic ID > Visit Date
      if (visitFilters.patientId) {
        visits = await visitService.getVisitsByPatientId(parseInt(visitFilters.patientId));
      } else if (visitFilters.clinicId) {
        visits = await visitService.getVisitsByClinicId(parseInt(visitFilters.clinicId));
      } else if (visitFilters.visitDate) {
        // Use single date as both start and end
        visits = await visitService.getVisitsByDateRange(visitFilters.visitDate, visitFilters.visitDate);
      }

      // Apply additional client-side filtering if multiple criteria
      let filtered = visits || [];
      
      if (visitFilters.patientId && visitFilters.clinicId) {
        filtered = filtered.filter(v => v.clinicId == visitFilters.clinicId);
      }
      if (visitFilters.visitDate) {
        filtered = filtered.filter(v => v.visitDate?.split('T')[0] === visitFilters.visitDate);
      }

      setFilteredVisits(filtered);
      setPatientVisits(filtered);
    } catch (error) {
      console.error("Error filtering visits:", error);
      alert("Error loading visits: " + (error.message || "Unknown error"));
      setFilteredVisits([]);
      setPatientVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleResetVisitFilters = () => {
    setVisitFilters({
      clinicId: "",
      patientId: "",
      visitDate: ""
    });
    setFilteredVisits([]);
    setPatientVisits([]);
  };
  
  // Load appointments when View Appointments modal opens
  useEffect(() => {
    if (showViewAppointmentsModal) {
      loadAppointments();
      // Reset filters when modal opens and load clinicId from token
      const tokenClinicId = getClinicIdFromToken() || "";
      setAppointmentFilter({
        clinicId: tokenClinicId.toString(),
        firstName: "",
        lastName: "",
        doctorId: "",
        status: "All",
        appointmentType: "All"
      });
    }
  }, [showViewAppointmentsModal]);
  
  // Check URL params on mount to set initial view
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "register") {
      setActiveView("register");
    } else if (viewParam === "list") {
      setActiveView("list");
    }
  }, [searchParams]);

  // Open Patients "New Appointment" modal when redirected from Calendar.
  useEffect(() => {
    const shouldOpenAppointment = searchParams.get("openAppointment") === "true";
    if (!shouldOpenAppointment) return;

    const dateFromQuery = searchParams.get("date") || "";
    const startTimeFromQuery = searchParams.get("startTime") || "";

    setShowNewAppointmentModal(true);
    setAppointmentForm((prev) => ({
      ...prev,
      ...(dateFromQuery ? { date: dateFromQuery } : {}),
      ...(startTimeFromQuery ? { startTime: startTimeFromQuery } : {})
    }));

    // Remove one-time params so refresh/back doesn't re-open unexpectedly.
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("openAppointment");
    nextParams.delete("date");
    nextParams.delete("startTime");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  // Apply local filtering based on status and appointment type when filters change
  useEffect(() => {
    if (appointmentsList.length === 0) return;
    
    let filtered = appointmentsList;
    
    // Apply status filter
    if (appointmentFilter.status && appointmentFilter.status !== 'All') {
      filtered = filtered.filter(apt => apt.status === appointmentFilter.status);
    }
    
    // Apply appointment type filter
    if (appointmentFilter.appointmentType && appointmentFilter.appointmentType !== 'All') {
      filtered = filtered.filter(apt => apt.appointmentType === appointmentFilter.appointmentType);
    }
    
    setFilteredAppointmentsList(filtered);
  }, [appointmentFilter.status, appointmentFilter.appointmentType, appointmentsList]);
  
  // Filter patients based on search and filters
  const filteredPatients = SAMPLE_PATIENTS_LIST.filter(patient => {
    const matchesSearch = searchQuery === "" || 
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phoneNumber.includes(searchQuery);
    
    const matchesFilters = 
      (filters.firstName === "" || patient.firstName.toLowerCase().includes(filters.firstName.toLowerCase())) &&
      (filters.lastName === "" || patient.lastName.toLowerCase().includes(filters.lastName.toLowerCase())) &&
      (filters.dateOfBirth === "" || patient.dateOfBirth === filters.dateOfBirth) &&
      (filters.gender === "" || patient.gender === filters.gender) &&
      (filters.status === "" || patient.status === filters.status);
    
    return matchesSearch && matchesFilters;
  });
  
  const clearFilters = () => {
    setFilters({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      status: ""
    });
    setSearchQuery("");
  };
  
  // Tab navigation for Register Patient modal
  const [registerActiveTab, setRegisterActiveTab] = useState("patient");

  // Visit Management States
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [showViewVisitsModal, setShowViewVisitsModal] = useState(false);
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [visitSearchQuery, setVisitSearchQuery] = useState("");
  const [visitFilters, setVisitFilters] = useState({
    clinicId: "",
    patientId: "",
    visitDate: ""
  });
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [newVisit, setNewVisit] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    reasonForVisit: "",
    diagnoses: "",
    treatments: "",
    prescriptions: "",
    notes: "",
    nextAppointmentDate: "",
    attendingPhysician: "",
    billingAmount: 0,
    paymentStatus: "Pending"
  });
  const [savingVisit, setSavingVisit] = useState(false);
  const [visitPatientError, setVisitPatientError] = useState("");
  const [selectedVisitDetail, setSelectedVisitDetail] = useState(null);
  const [showVisitDetailModal, setShowVisitDetailModal] = useState(false);
  
  // Prescription Modal States
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionColor, setPrescriptionColor] = useState("#8b5cf6"); // Default purple
  const [patientMedicalInfo, setPatientMedicalInfo] = useState(null);
  const [loadingMedicalInfo, setLoadingMedicalInfo] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    category: "",
    subCategory: "",
    instructions: ""
  });
  const [medications, setMedications] = useState([]);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState(null);

  const medicationCategories = {
    Antibiotic: ["Penicillin", "Cephalosporin", "Macrolide", "Fluoroquinolone", "Nitroimidazole"],
    Analgesic: ["NSAID", "Opioid", "Acetaminophen", "COX-2 Inhibitor"],
    "Anti-inflammatory": ["Steroid", "Non-steroidal", "Topical", "Immunomodulator"],
    Mouthwash: ["Antiseptic", "Fluoride", "Chlorhexidine", "Herbal"],
    Supplement: ["Vitamin", "Mineral", "Probiotic", "Herbal"],
    Other: ["General", "Custom"]
  };

  const emptyMedicationForm = {
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    category: "",
    subCategory: "",
    instructions: ""
  };

  const serializeMedications = (list) => list.map((med, idx) => {
    const categoryLabel = med.category ? `[${med.category}${med.subCategory ? `/${med.subCategory}` : ''}]` : '';
    const durationLabel = med.duration ? ` for ${med.duration}` : '';
    const dosageLabel = med.dosage ? ` (${med.dosage})` : '';
    const frequencyLabel = med.frequency || "As directed";
    const instructionsLabel = med.instructions ? ` — ${med.instructions}` : '';
    return `${idx + 1}. ${med.name}${dosageLabel} – ${frequencyLabel}${durationLabel} ${categoryLabel}${instructionsLabel}`.trim();
  }).join("\n");

  const handleAddMedication = () => {
    if (!medicationForm.name.trim()) {
      alert("Please enter medication name before adding.");
      return;
    }

    const nextEntry = { ...medicationForm };

    setMedications((prev) => {
      if (editingMedicationIndex !== null) {
        return prev.map((item, idx) => idx === editingMedicationIndex ? nextEntry : item);
      }
      return [...prev, nextEntry];
    });

    setEditingMedicationIndex(null);
    setMedicationForm(emptyMedicationForm);
  };

  const handleEditMedication = (index) => {
    setEditingMedicationIndex(index);
    setMedicationForm(medications[index]);
  };

  const handleDeleteMedication = (index) => {
    setMedications((prev) => prev.filter((_, idx) => idx !== index));
    setEditingMedicationIndex(null);
    setMedicationForm(emptyMedicationForm);
  };
  
  // Doctor information - should come from authentication context
  const CURRENT_DOCTOR = {
    doctorId: 1,
    name: "Dr. Rajesh Kumar",
    registrationNumber: "MCI-A-12345-MH",
    specialization: "General Dentistry & Oral Medicine"
  };

  const appointmentTypeOptions = ["Consultation", "Follow-up", "Telehealth", "Emergency", "Routine Checkup", "Treatment", "Surgery","Walk-in"];

  // Form state for all four models
  const [patientData, setPatientData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    clinicId: "",
    isActive: true
  });

  const [clinicList, setClinicList] = useState([]);

  const [contactData, setContactData] = useState({
    phoneNumber: "",
    alternatePhoneNumber: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: ""
  });
  const [isCityLookupLoading, setIsCityLookupLoading] = useState(false);
  const cityLookupAbortRef = useRef(null);
  const [registerFormErrors, setRegisterFormErrors] = useState({
    email: "",
    providerEmail: "",
    postalCode: "",
    city: "",
    state: "",
    country: ""
  });

  const [medicalData, setMedicalData] = useState({
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    pastSurgeries: "",
    familyMedicalHistory: "",
    smokingStatus: "",
    alcoholConsumption: "",
    exerciseFrequency: "",
    dietaryRestrictions: "",
    lastDentalVisit: "",
    notes: ""
  });

  const [insuranceData, setInsuranceData] = useState({
    patientInsuranceProvider: "",
    insuranceProviderId: "",
    policyNumber: "",
    groupNumber: "",
    policyHolderName: "",
    relationshipToPolicyHolder: "",
    coverageStartDate: "",
    coverageEndDate: "",
    isPrimary: true,
    copayAmount: "",
    deductibleAmount: "",
    coveragePercentage: "",
    insurancePhone: "",
    providerEmail: "",
    providerAddress: ""
  });

  // View/Filter states
  const [viewTab, setViewTab] = useState("search");


  // Patient details modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const incomingPatient = location?.state?.selectedPatient;
    const shouldOpenModal = location?.state?.isModal === true && incomingPatient;

    if (!shouldOpenModal) return;

    const normalizedIncomingPatient = normalizePatientPayloadForModal(incomingPatient);
    setSelectedPatient(normalizedIncomingPatient);
    setShowPatientModal(true);

    const patientId = Number(incomingPatient?.patientId || incomingPatient?.id || incomingPatient?.patient?.patientId || incomingPatient?.patient?.id);
    if (!isNaN(patientId) && patientId > 0) {
      setLoadingPatientDetails(true);
      getPatientFullProfile(patientId)
        .then((profile) => {
          if (profile) {
            setSelectedPatient(normalizePatientPayloadForModal(profile));
          }
        })
        .catch((error) => {
          console.error("Failed to load full patient profile from route state:", error);
        })
        .finally(() => {
          setLoadingPatientDetails(false);
        });
    }
  }, [location?.state]);

  const handleClosePatientModal = useCallback(() => {
    const routeState = location?.state || {};
    const returnRoute = routeState.returnTo || (routeState.origin === 'doctors' ? '/doctors' : null);

    if (returnRoute) {
      navigate(returnRoute);
      return;
    }

    setShowPatientModal(false);
    setSelectedPatient(null);
    setIsEditMode(false);
    setEditedPatient(null);
  }, [location?.state, navigate]);

  // Delete modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(false);

  // Load clinic from token and populate patient data on component mount
  useEffect(() => {
    const clinicId = getClinicIdFromToken();
    if (clinicId) {
      setPatientData(prev => ({ ...prev, clinicId: clinicId.toString() }));
      // Load clinics list
      fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${clinicId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const clinics = Array.isArray(data) ? data : (data ? [data] : []);
          setClinicList(clinics);
        })
        .catch(err => {
          console.error("Error loading clinic:", err);
          setClinicList([]);
        });
    }
  }, []);

  useEffect(() => {
    const cityValue = String(contactData.city || "").trim();

    if (cityValue.length < 2) {
      setIsCityLookupLoading(false);
      return;
    }

    const timerId = setTimeout(async () => {
      try {
        if (cityLookupAbortRef.current) {
          cityLookupAbortRef.current.abort();
        }

        const controller = new AbortController();
        cityLookupAbortRef.current = controller;
        setIsCityLookupLoading(true);

        const response = await fetch(
          `https://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=${encodeURIComponent(cityValue)}&limit=1&sort=-population`,
          { signal: controller.signal }
        );

        if (!response.ok) return;

        const payload = await response.json();
        const cityMatch = payload?.data?.[0];
        if (!cityMatch) return;

        const nextState = cityMatch.region || cityMatch.regionCode || "";
        const nextCountry = cityMatch.country || cityMatch.countryCode || "";

        setContactData((prev) => {
          if (String(prev.city || "").trim() !== cityValue) return prev;
          return {
            ...prev,
            state: nextState || prev.state,
            country: nextCountry || prev.country
          };
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("City lookup failed:", error);
        }
      } finally {
        setIsCityLookupLoading(false);
      }
    }, 450);

    return () => clearTimeout(timerId);
  }, [contactData.city]);

  useEffect(() => {
    return () => {
      if (cityLookupAbortRef.current) {
        cityLookupAbortRef.current.abort();
      }
    };
  }, []);

  // Mock patient data (replace with API call)
  const mockPatients = [
    { patientId: 1, firstName: "John", lastName: "Doe", dateOfBirth: "1990-05-15", gender: "Male", clinicId: 1, phoneNumber: "+1 555-0101", email: "john.doe@email.com", registrationDate: "2024-01-15" },
    { patientId: 2, firstName: "Jane", lastName: "Smith", dateOfBirth: "1985-08-22", gender: "Female", clinicId: 1, phoneNumber: "+1 555-0102", email: "jane.smith@email.com", registrationDate: "2024-02-20" },
    { patientId: 3, firstName: "Michael", lastName: "Johnson", dateOfBirth: "1978-12-10", gender: "Male", clinicId: 2, phoneNumber: "+1 555-0103", email: "michael.j@email.com", registrationDate: "2024-03-10" },
    { patientId: 4, firstName: "Emily", lastName: "Williams", dateOfBirth: "1992-03-28", gender: "Female", clinicId: 2, phoneNumber: "+1 555-0104", email: "emily.w@email.com", registrationDate: "2024-04-05" },
    { patientId: 5, firstName: "Robert", lastName: "Brown", dateOfBirth: "1988-07-14", gender: "Male", clinicId: 1, phoneNumber: "+1 555-0105", email: "robert.b@email.com", registrationDate: "2024-05-12" },
  ];

  const mockClinics = [
    { clinicId: 1, clinicName: "Downtown Dental Clinic" },
    { clinicId: 2, clinicName: "Eastside Dental Care" },
    { clinicId: 3, clinicName: "Westside Family Dentistry" }
  ];





  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmailDomain(contactData.email);
    if (emailError) {
      setRegisterFormErrors((prev) => ({ ...prev, email: emailError }));
      setRegisterActiveTab("contact");
      return;
    }

    const providerEmailError = validateEmailDomain(insuranceData.providerEmail);
    if (providerEmailError) {
      setRegisterFormErrors((prev) => ({ ...prev, providerEmail: providerEmailError }));
      setRegisterActiveTab("insurance");
      return;
    }

    if (!isValidIndianPhone(contactData.phoneNumber)) {
      alert("⚠️ Phone Number must be exactly 10 digits.");
      setRegisterActiveTab("contact");
      return;
    }

    if (contactData.alternatePhoneNumber && !isValidIndianPhone(contactData.alternatePhoneNumber)) {
      alert("⚠️ Alternate Phone must be exactly 10 digits.");
      setRegisterActiveTab("contact");
      return;
    }

    if (contactData.emergencyContactPhone && !isValidIndianPhone(contactData.emergencyContactPhone)) {
      alert("⚠️ Emergency Contact Phone must be exactly 10 digits.");
      setRegisterActiveTab("contact");
      return;
    }

    if (!isValidPostalCode(contactData.postalCode)) {
      setRegisterFormErrors((prev) => ({ ...prev, postalCode: "Postal code must be exactly 6 digits" }));
      setRegisterActiveTab("contact");
      return;
    }

    if (!isStrictDateWithFourDigitYear(patientData.dateOfBirth)) {
      alert("⚠️ Date of Birth must be in YYYY-MM-DD format with a 4-digit year.");
      setRegisterActiveTab("patient");
      return;
    }
    
    // Construct PatientDataModel according to API interface
    const patientDataModel = {
      patient: {
        patientId: 0, // Will be assigned by backend
        patientEntityID: "", // Will be assigned by backend
        patientFirstName: patientData.firstName,
        patientLastName: patientData.lastName,
        patientDOB: patientData.dateOfBirth,
        patientGender: patientData.gender,
        patientBloodType: patientData.bloodGroup || "",
        clinicID: patientData.clinicId || ""
      },
      patientContact: {
        patientId: 0, // Will be assigned by backend
        patientAddress: `${contactData.addressLine1}${contactData.addressLine2 ? ', ' + contactData.addressLine2 : ''}`,
        patientCity: contactData.city,
        patientPhone: addIndianCountryCode(contactData.phoneNumber),
        patientEmail: contactData.email || "",
        patientEmergencyContact: contactData.emergencyContactName 
          ? `${contactData.emergencyContactName} - ${addIndianCountryCode(contactData.emergencyContactPhone)} (${contactData.emergencyContactRelation})`
          : ""
      },
      patientMedicalInfo: {
        patientId: 0, // Will be assigned by backend
        patientMedicalHistory: medicalData.familyMedicalHistory || "",
        patientAllergies: medicalData.allergies || "",
        patientCurrentMedications: medicalData.currentMedications || "",
        patientPrimaryPhysician: "", // Not collected in current form
        no_of_visits: 0,
        lastVisitedDate: medicalData.lastDentalVisit || new Date().toISOString(),
        chronicDiseases: medicalData.chronicConditions || "",
        medicalHistory: `Past Surgeries: ${medicalData.pastSurgeries || 'None'}; Smoking: ${medicalData.smokingStatus || 'Unknown'}; Alcohol: ${medicalData.alcoholConsumption || 'Unknown'}; Exercise: ${medicalData.exerciseFrequency || 'Unknown'}; Diet: ${medicalData.dietaryRestrictions || 'None'}; Notes: ${medicalData.notes || 'None'}`
      },
      patientInsurance: {
        patientId: 0,
        patientInsuranceProvider: insuranceData.patientInsuranceProvider || "",
        insuranceProviderId: insuranceData.insuranceProviderId ? parseInt(insuranceData.insuranceProviderId) : null,
        policyNumber: insuranceData.policyNumber || "",
        groupNumber: insuranceData.groupNumber || "",
        policyHolderName: insuranceData.policyHolderName || "",
        relationshipToPolicyHolder: insuranceData.relationshipToPolicyHolder || "",
        coverageStartDate: insuranceData.coverageStartDate ? new Date(insuranceData.coverageStartDate).toISOString() : null,
        coverageEndDate: insuranceData.coverageEndDate ? new Date(insuranceData.coverageEndDate).toISOString() : null,
        isPrimary: insuranceData.isPrimary || false,
        copayAmount: insuranceData.copayAmount ? parseFloat(insuranceData.copayAmount) : null,
        deductibleAmount: insuranceData.deductibleAmount ? parseFloat(insuranceData.deductibleAmount) : null,
        coveragePercentage: insuranceData.coveragePercentage ? parseFloat(insuranceData.coveragePercentage) : null,
        insurancePhone: insuranceData.insurancePhone || "",
        providerEmail: insuranceData.providerEmail || "",
        providerAddress: insuranceData.providerAddress || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    try {
      console.log("Submitting patient data:", patientDataModel);
      const response = await createPatient(patientDataModel);
      console.log("Patient created successfully:", response);
      
      // Store patient info and show success modal
      setRegisteredPatient({
        patientId: response.patient.patientId,
        name: `${patientData.firstName} ${patientData.lastName}`,
        email: contactData.email,
        phone: addIndianCountryCode(contactData.phoneNumber),
        dateOfBirth: patientData.dateOfBirth
      });
      setShowSuccessModal(true);
      
      // Clear form after successful submission
      setPatientData({ firstName: "", lastName: "", dateOfBirth: "", gender: "", bloodGroup: "", maritalStatus: "", clinicId: "", isActive: true });
      setContactData({ phoneNumber: "", alternatePhoneNumber: "", email: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "" });
      setMedicalData({ allergies: "", chronicConditions: "", currentMedications: "", pastSurgeries: "", familyMedicalHistory: "", smokingStatus: "", alcoholConsumption: "", exerciseFrequency: "", dietaryRestrictions: "", lastDentalVisit: "", notes: "" });
      setInsuranceData({ patientInsuranceProvider: "", insuranceProviderId: "", policyNumber: "", groupNumber: "", policyHolderName: "", relationshipToPolicyHolder: "", coverageStartDate: "", coverageEndDate: "", isPrimary: true, copayAmount: "", deductibleAmount: "", coveragePercentage: "", insurancePhone: "", providerEmail: "", providerAddress: "" });
      setRegisterFormErrors({ email: "", providerEmail: "", postalCode: "" });
      
      // Close the registration modal
      setActiveView("list");
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("❌ Error registering patient: " + error.message);
    }
  };

  // Tab validation functions
  const isPatientTabValid = () => {
    return patientData.firstName && patientData.lastName && patientData.dateOfBirth && 
           patientData.gender && patientData.clinicId;
  };

  const isContactTabValid = () => {
    const alphaOnly = (v) => v && /^[a-zA-Z\s]+$/.test(String(v).trim());
    return contactData.phoneNumber && contactData.addressLine1 &&
           contactData.city && alphaOnly(contactData.city) &&
           contactData.state && alphaOnly(contactData.state) &&
           contactData.postalCode && !registerFormErrors.postalCode &&
           contactData.country && alphaOnly(contactData.country);
  };

  const isAllTabsValid = () => {
    return isPatientTabValid() && isContactTabValid();
  };

  // Print-friendly ref for diagnosis modal
  const diagnosisPrintRef = useRef(null);

  const handlePrintDiagnosis = () => {
    if (!diagnosisPrintRef.current) return;
    const printContent = diagnosisPrintRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Diagnosis Details</title><style>
      body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 24px; color: #0f172a; line-height: 1.6; }
      h1 { margin: 0 0 8px; font-size: 24px; color: #0f172a; font-weight: bold; }
      h2 { margin: 16px 0 8px; font-size: 18px; color: #0f172a; font-weight: 600; }
      h3 { margin: 12px 0 6px; font-size: 16px; color: #0f172a; font-weight: 600; }
      .border-b { border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
      .text-sm { font-size: 14px; color: #64748b; }
      .inline-block { display: inline-block; padding: 6px 12px; margin: 4px; border-radius: 8px; font-size: 13px; }
      .bg-cyan-50 { background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; }
      .bg-teal-50 { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
      .bg-blue-50 { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      td { padding: 8px 4px; vertical-align: top; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
      strong, .font-bold { font-weight: 600; color: #0f172a; }
      p { margin: 8px 0; }
      @media print { body { margin: 0; padding: 16px; } }
    </style></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-8"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
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
                🏥
              </motion.span>
              Patient Management Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-cyan-50"
            >
              Register, view, and manage patient information with ease
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Quick Action Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {[
              { id: 'register', title: '📝 Register Patient', description: 'Add new patient records', icon: '📝', color: 'from-teal-400 to-cyan-400', action: () => setActiveView('register') },
              { id: 'list', title: '📋 View Patients', description: 'Browse patient records', icon: '📋', color: 'from-blue-400 to-indigo-400', action: () => setShowViewPatientsModal(true) }
            ].map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard(tile.id)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={tile.action}
                className="relative cursor-pointer group"
              >
                <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${tile.color} p-4 shadow-md hover:shadow-lg transition-all duration-300`}>
                  {/* Animated shine effect */}
                  <motion.div
                    animate={{
                      x: hoveredCard === tile.id ? ["-100%", "200%"] : "-100%",
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        rotate: hoveredCard === tile.id ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-5xl mb-3"
                    >
                      {tile.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {tile.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {tile.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Patient Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        />

        {/* Appointments Management Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Appointments Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {[
              { id: 'new-appointment', title: '📅 New Appointment', description: 'Book patient appointment', icon: '📅', color: 'from-cyan-400 to-blue-400', action: () => {
                // Real-time token check - using correct sessionStorage key
                const currentToken = getAccessToken();
                if (!currentToken) {
                  setShowNotLoggedInModal(true);
                } else {
                  setIsUserLoggedIn(true);
                  setShowNewAppointmentModal(true);
                }
              } },
              { id: 'view-appointments', title: '📋 View Appointments', description: 'Browse appointments', icon: '📋', color: 'from-purple-400 to-pink-400', action: () => setShowViewAppointmentsModal(true) },
              { id: 'calendar', title: '📆 Appointments Calendar', description: 'View clinic calendar', icon: '📆', color: 'from-orange-400 to-red-400', action: () => navigate('/calendar') }
            ].map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard(tile.id)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={tile.action}
                className="relative cursor-pointer group"
              >
                <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${tile.color} p-4 shadow-md hover:shadow-lg transition-all duration-300`}>
                  <motion.div
                    animate={{
                      x: hoveredCard === tile.id ? ["-100%", "200%"] : "-100%",
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  
                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        rotate: hoveredCard === tile.id ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-5xl mb-3"
                    >
                      {tile.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {tile.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {tile.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Payments Management Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Payments Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {[
              { id: 'payments', title: '💳 Payments', description: 'Manage patient payments', icon: '💳', color: 'from-emerald-400 to-teal-400', action: () => navigate('/service-billing') }
            ].map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard(tile.id)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={tile.action}
                className="relative cursor-pointer group"
              >
                <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${tile.color} p-4 shadow-md hover:shadow-lg transition-all duration-300`}>
                  <motion.div
                    animate={{
                      x: hoveredCard === tile.id ? ["-100%", "200%"] : "-100%",
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  
                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        rotate: hoveredCard === tile.id ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-5xl mb-3"
                    >
                      {tile.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {tile.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {tile.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
            }
          </div>
        </motion.div>

        {/* Registration Modal */}
        {activeView === "register" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4"
            onClick={() => setActiveView("list")}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border-2 border-teal-400 overflow-hidden max-w-5xl w-full h-[94vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="text-3xl"
                  >
                    📝
                  </motion.span>
                  <div>
                    <h2 className="text-2xl font-bold">Register New Patient</h2>
                    <p className="text-cyan-100 text-xs mt-1">Fill in the patient information to create a new record</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveView("list")}
                  type="button"
                  className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0 sticky top-0 z-10">
                {[
                  { key: "patient", label: "Patient Info", icon: "👤" },
                  { key: "contact", label: "Contact", icon: "📞" },
                  { key: "medical", label: "Medical Info", icon: "🏥" },
                  { key: "insurance", label: "Insurance", icon: "💳" }
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    type="button"
                    onClick={() => setRegisterActiveTab(tab.key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      registerActiveTab === tab.key
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                        : "bg-white text-slate-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-600 border-2 border-slate-200"
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} id="register-patient-form">
            
            {/* Patient Basic Information - Tab */}
            <AnimatePresence mode="wait">
            {registerActiveTab === "patient" && (
              <motion.div
                key="patient-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={patientData.firstName}
                  onChange={(e) => setPatientData({ ...patientData, firstName: e.target.value })}
                  required
                  placeholder="Enter first name"
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  value={patientData.lastName}
                  onChange={(e) => setPatientData({ ...patientData, lastName: e.target.value })}
                  required
                  placeholder="Enter last name"
                />
                <InputField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={patientData.dateOfBirth}
                  onChange={(e) => {
                    const dobValue = e.target.value;
                    if (!dobValue) {
                      setPatientData({ ...patientData, dateOfBirth: "" });
                      return;
                    }
                    const [year = "", month = "", day = ""] = String(dobValue).split('-');
                    const normalizedYear = year.slice(0, 4);
                    if (normalizedYear.length !== 4 || !month || !day) return;
                    setPatientData({ ...patientData, dateOfBirth: `${normalizedYear}-${month}-${day}` });
                  }}
                  required
                />
                <InputField
                  label="Gender"
                  name="gender"
                  value={patientData.gender}
                  onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                  required
                  options={["Male", "Female", "Other"]}
                />
                <InputField
                  label="Blood Group"
                  name="bloodGroup"
                  value={patientData.bloodGroup}
                  onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                />
                <InputField
                  label="Marital Status"
                  name="maritalStatus"
                  value={patientData.maritalStatus}
                  onChange={(e) => setPatientData({ ...patientData, maritalStatus: e.target.value })}
                  options={["Single", "Married", "Divorced", "Widowed"]}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic *</label>
                  <select
                    value={patientData.clinicId}
                    onChange={(e) => setPatientData({ ...patientData, clinicId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Clinic</option>
                    {clinicList.map(clinic => (
                      <option key={clinic.clinicId} value={clinic.clinicId}>
                        {clinic.clinicName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Pre-populated from your login credentials</p>
                </div>
              </div>
              </motion.div>
            )}
            {registerActiveTab === "contact" && (
              <motion.div
                key="contact-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">📞</span>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="mb-2">
                  <label className="block text-xs font-medium mb-1 transition text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                  <div className="flex items-center w-full border border-purple-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-transparent bg-white">
                    <span className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 border-r border-slate-300">+91</span>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={contactData.phoneNumber}
                      onChange={(e) => setContactData({ ...contactData, phoneNumber: normalizeIndianPhoneDigits(e.target.value) })}
                      required
                      inputMode="numeric"
                      maxLength={10}
                      autoComplete="off"
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-1.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs font-medium mb-1 transition text-gray-700">Alternate Phone</label>
                  <div className="flex items-center w-full border border-purple-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-transparent bg-white">
                    <span className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 border-r border-slate-300">+91</span>
                    <input
                      type="tel"
                      name="alternatePhoneNumber"
                      value={contactData.alternatePhoneNumber}
                      onChange={(e) => setContactData({ ...contactData, alternatePhoneNumber: normalizeIndianPhoneDigits(e.target.value) })}
                      inputMode="numeric"
                      maxLength={10}
                      autoComplete="off"
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-1.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => {
                      const emailValue = e.target.value;
                      setContactData({ ...contactData, email: emailValue });
                      setRegisterFormErrors((prev) => ({ ...prev, email: validateEmailDomain(emailValue) }));
                    }}
                    placeholder="patient@example.com"
                    error={registerFormErrors.email}
                  />
                </div>
                <div className="md:col-span-3">
                  <InputField
                    label="Address Line 1"
                    name="addressLine1"
                    value={contactData.addressLine1}
                    onChange={(e) => setContactData({ ...contactData, addressLine1: e.target.value })}
                    required
                    placeholder="Street address"
                  />
                </div>
                <div className="md:col-span-3">
                  <InputField
                    label="Address Line 2"
                    name="addressLine2"
                    value={contactData.addressLine2}
                    onChange={(e) => setContactData({ ...contactData, addressLine2: e.target.value })}
                    placeholder="Apt, suite, unit, etc. (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={contactData.city}
                    placeholder="City"
                    required
                    onKeyDown={(e) => {
                      if (/[0-9]/.test(e.key)) {
                        e.preventDefault();
                        setRegisterFormErrors(prev => ({ ...prev, city: 'City must contain letters only — no numbers allowed' }));
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      setContactData({ ...contactData, city: v });
                      setRegisterFormErrors(prev => ({ ...prev, city: v !== e.target.value ? 'City must contain letters only — no numbers allowed' : '' }));
                    }}
                    onBlur={(e) => {
                      setRegisterFormErrors(prev => ({ ...prev, city: /[0-9]/.test(e.target.value) ? 'City must contain letters only — no numbers allowed' : '' }));
                    }}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg transition focus:outline-none focus:ring-1 ${registerFormErrors.city ? 'border-red-500 focus:ring-red-400 bg-red-50' : 'border-purple-300 focus:ring-indigo-500'}`}
                  />
                  {registerFormErrors.city && <p className="text-xs text-red-600 font-medium mt-1">⚠ {registerFormErrors.city}</p>}
                  {isCityLookupLoading && !registerFormErrors.city && (
                    <p className="text-xs text-indigo-600 mt-1">Auto-filling state and country...</p>
                  )}
                </div>
                <div className="mb-2">
                  <label className="block text-xs font-medium mb-1 text-gray-700">State/Province <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="state"
                    value={contactData.state}
                    placeholder="State"
                    required
                    onKeyDown={(e) => {
                      if (/[0-9]/.test(e.key)) {
                        e.preventDefault();
                        setRegisterFormErrors(prev => ({ ...prev, state: 'State must contain letters only — no numbers allowed' }));
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      setContactData({ ...contactData, state: v });
                      setRegisterFormErrors(prev => ({ ...prev, state: v !== e.target.value ? 'State must contain letters only — no numbers allowed' : '' }));
                    }}
                    onBlur={(e) => {
                      setRegisterFormErrors(prev => ({ ...prev, state: /[0-9]/.test(e.target.value) ? 'State must contain letters only — no numbers allowed' : '' }));
                    }}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg transition focus:outline-none focus:ring-1 ${registerFormErrors.state ? 'border-red-500 focus:ring-red-400 bg-red-50' : 'border-purple-300 focus:ring-indigo-500'}`}
                  />
                  {registerFormErrors.state && <p className="text-xs text-red-600 font-medium mt-1">⚠ {registerFormErrors.state}</p>}
                </div>
                <InputField
                  label="Postal Code"
                  name="postalCode"
                  value={contactData.postalCode}
                  onChange={(e) => {
                    const postalValue = String(e.target.value || "").replace(/\D/g, "").slice(0, 6);
                    setContactData({ ...contactData, postalCode: postalValue });
                    setRegisterFormErrors((prev) => ({
                      ...prev,
                      postalCode: postalValue.length === 0 || postalValue.length === 6
                        ? ""
                        : "Postal code must be exactly 6 digits"
                    }));
                  }}
                  required
                  placeholder="123456"
                  error={registerFormErrors.postalCode}
                />
                <div className="mb-2">
                  <label className="block text-xs font-medium mb-1 text-gray-700">Country <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="country"
                    value={contactData.country}
                    placeholder="Country"
                    required
                    onKeyDown={(e) => {
                      if (/[0-9]/.test(e.key)) {
                        e.preventDefault();
                        setRegisterFormErrors(prev => ({ ...prev, country: 'Country must contain letters only — no numbers allowed' }));
                      }
                    }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      setContactData({ ...contactData, country: v });
                      setRegisterFormErrors(prev => ({ ...prev, country: v !== e.target.value ? 'Country must contain letters only — no numbers allowed' : '' }));
                    }}
                    onBlur={(e) => {
                      setRegisterFormErrors(prev => ({ ...prev, country: /[0-9]/.test(e.target.value) ? 'Country must contain letters only — no numbers allowed' : '' }));
                    }}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg transition focus:outline-none focus:ring-1 ${registerFormErrors.country ? 'border-red-500 focus:ring-red-400 bg-red-50' : 'border-purple-300 focus:ring-indigo-500'}`}
                  />
                  {registerFormErrors.country && <p className="text-xs text-red-600 font-medium mt-1">⚠ {registerFormErrors.country}</p>}
                </div>
                <div className="md:col-span-3 mt-2 pt-2 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputField
                      label="Name"
                      name="emergencyContactName"
                      value={contactData.emergencyContactName}
                      onChange={(e) => setContactData({ ...contactData, emergencyContactName: e.target.value })}
                      placeholder="Emergency contact name"
                    />
                    <div className="mb-2">
                      <label className="block text-xs font-medium mb-1 transition text-gray-700">Phone</label>
                      <div className="flex items-center w-full border border-purple-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-transparent bg-white">
                        <span className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 border-r border-slate-300">+91</span>
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={contactData.emergencyContactPhone}
                          onChange={(e) => setContactData({ ...contactData, emergencyContactPhone: normalizeIndianPhoneDigits(e.target.value) })}
                          inputMode="numeric"
                          maxLength={10}
                          autoComplete="off"
                          placeholder="10-digit mobile number"
                          className="w-full px-3 py-1.5 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <InputField
                      label="Relation"
                      name="emergencyContactRelation"
                      value={contactData.emergencyContactRelation}
                      onChange={(e) => setContactData({ ...contactData, emergencyContactRelation: e.target.value })}
                      placeholder="Spouse, Parent, etc."
                    />
                  </div>
                </div>
              </div>
              </motion.div>
            )}

            {/* Medical Information - Tab */}
            {registerActiveTab === "medical" && (
              <motion.div
                key="medical-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  Medical Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                  label="Allergies"
                  name="allergies"
                  type="textarea"
                  value={medicalData.allergies}
                  onChange={(e) => setMedicalData({ ...medicalData, allergies: e.target.value })}
                  placeholder="List any known allergies (medications, food, environmental)"
                />
                {/* Chronic Conditions Multi-Select Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chronic Conditions</label>
                  <ChronicConditionsDropdown
                    value={medicalData.chronicConditions}
                    onChange={(value) => setMedicalData({ ...medicalData, chronicConditions: value })}
                  />
                </div>
                <InputField
                  label="Current Medications"
                  name="currentMedications"
                  type="textarea"
                  value={medicalData.currentMedications}
                  onChange={(e) => setMedicalData({ ...medicalData, currentMedications: e.target.value })}
                  placeholder="List all current medications and dosages"
                />
                <InputField
                  label="Past Surgeries"
                  name="pastSurgeries"
                  type="textarea"
                  value={medicalData.pastSurgeries}
                  onChange={(e) => setMedicalData({ ...medicalData, pastSurgeries: e.target.value })}
                  placeholder="List any previous surgeries and dates"
                />
                <InputField
                  label="Family Medical History"
                  name="familyMedicalHistory"
                  type="textarea"
                  value={medicalData.familyMedicalHistory}
                  onChange={(e) => setMedicalData({ ...medicalData, familyMedicalHistory: e.target.value })}
                  placeholder="Relevant family medical history"
                />
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InputField
                    label="Smoking Status"
                    name="smokingStatus"
                    value={medicalData.smokingStatus}
                    onChange={(e) => setMedicalData({ ...medicalData, smokingStatus: e.target.value })}
                    options={["Never", "Former", "Current"]}
                  />
                  <InputField
                    label="Alcohol Consumption"
                    name="alcoholConsumption"
                    value={medicalData.alcoholConsumption}
                    onChange={(e) => setMedicalData({ ...medicalData, alcoholConsumption: e.target.value })}
                    options={["None", "Occasional", "Moderate", "Heavy"]}
                  />
                  <InputField
                    label="Exercise Frequency"
                    name="exerciseFrequency"
                    value={medicalData.exerciseFrequency}
                    onChange={(e) => setMedicalData({ ...medicalData, exerciseFrequency: e.target.value })}
                    options={["Sedentary", "Light", "Moderate", "Active", "Very Active"]}
                  />
                  <InputField
                    label="Last Dental Visit"
                    name="lastDentalVisit"
                    type="date"
                    value={medicalData.lastDentalVisit}
                    onChange={(e) => setMedicalData({ ...medicalData, lastDentalVisit: e.target.value })}
                  />
                </div>
                <InputField
                  label="Dietary Restrictions"
                  name="dietaryRestrictions"
                  type="textarea"
                  value={medicalData.dietaryRestrictions}
                  onChange={(e) => setMedicalData({ ...medicalData, dietaryRestrictions: e.target.value })}
                  placeholder="Vegetarian, vegan, gluten-free, etc."
                />
                <InputField
                  label="Additional Notes"
                  name="notes"
                  type="textarea"
                  value={medicalData.notes}
                  onChange={(e) => setMedicalData({ ...medicalData, notes: e.target.value })}
                  placeholder="Any additional medical information"
                />
              </div>
              </motion.div>
            )}

            {/* Insurance Information - Tab */}
            {registerActiveTab === "insurance" && (
              <motion.div
                key="insurance-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  Insurance Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InputField
                  label="Insurance Provider"
                  name="patientInsuranceProvider"
                  value={insuranceData.patientInsuranceProvider}
                  onChange={(e) => setInsuranceData({ ...insuranceData, patientInsuranceProvider: e.target.value })}
                  placeholder="Insurance company name"
                />
                <InputField
                  label="Provider ID"
                  name="insuranceProviderId"
                  type="number"
                  value={insuranceData.insuranceProviderId}
                  onChange={(e) => setInsuranceData({ ...insuranceData, insuranceProviderId: e.target.value })}
                  placeholder="Provider ID"
                />
                <InputField
                  label="Policy Number"
                  name="policyNumber"
                  value={insuranceData.policyNumber}
                  onChange={(e) => setInsuranceData({ ...insuranceData, policyNumber: e.target.value })}
                  placeholder="Policy/Member ID"
                />
                <InputField
                  label="Group Number"
                  name="groupNumber"
                  value={insuranceData.groupNumber}
                  onChange={(e) => setInsuranceData({ ...insuranceData, groupNumber: e.target.value })}
                  placeholder="Group number (if applicable)"
                />
                <InputField
                  label="Insurance Phone"
                  name="insurancePhone"
                  type="tel"
                  value={insuranceData.insurancePhone}
                  onChange={(e) => setInsuranceData({ ...insuranceData, insurancePhone: e.target.value })}
                  placeholder="Insurance company phone"
                />
                <InputField
                  label="Provider Email"
                  name="providerEmail"
                  type="email"
                  value={insuranceData.providerEmail}
                  onChange={(e) => {
                    const providerEmailValue = e.target.value;
                    setInsuranceData({ ...insuranceData, providerEmail: providerEmailValue });
                    setRegisterFormErrors((prev) => ({ ...prev, providerEmail: validateEmailDomain(providerEmailValue) }));
                  }}
                  placeholder="provider@insurance.com"
                  error={registerFormErrors.providerEmail}
                />
                <InputField
                  label="Policy Holder Name"
                  name="policyHolderName"
                  value={insuranceData.policyHolderName}
                  onChange={(e) => setInsuranceData({ ...insuranceData, policyHolderName: e.target.value })}
                  placeholder="Name on insurance policy"
                />
                <InputField
                  label="Relationship to Policy Holder"
                  name="relationshipToPolicyHolder"
                  value={insuranceData.relationshipToPolicyHolder}
                  onChange={(e) => setInsuranceData({ ...insuranceData, relationshipToPolicyHolder: e.target.value })}
                  options={["Self", "Spouse", "Child", "Parent", "Other"]}
                />
                <InputField
                  label="Provider Address"
                  name="providerAddress"
                  value={insuranceData.providerAddress}
                  onChange={(e) => setInsuranceData({ ...insuranceData, providerAddress: e.target.value })}
                  placeholder="Provider address"
                />
                <InputField
                  label="Coverage Start Date"
                  name="coverageStartDate"
                  type="date"
                  value={insuranceData.coverageStartDate}
                  onChange={(e) => setInsuranceData({ ...insuranceData, coverageStartDate: e.target.value })}
                />
                <InputField
                  label="Coverage End Date"
                  name="coverageEndDate"
                  type="date"
                  value={insuranceData.coverageEndDate}
                  onChange={(e) => setInsuranceData({ ...insuranceData, coverageEndDate: e.target.value })}
                />
                <InputField
                  label="Copay Amount"
                  name="copayAmount"
                  type="number"
                  value={insuranceData.copayAmount}
                  onChange={(e) => setInsuranceData({ ...insuranceData, copayAmount: e.target.value })}
                  placeholder="$0.00"
                />
                <InputField
                  label="Deductible Amount"
                  name="deductibleAmount"
                  type="number"
                  value={insuranceData.deductibleAmount}
                  onChange={(e) => setInsuranceData({ ...insuranceData, deductibleAmount: e.target.value })}
                  placeholder="$0.00"
                />
                <InputField
                  label="Coverage Percentage"
                  name="coveragePercentage"
                  type="number"
                  value={insuranceData.coveragePercentage}
                  onChange={(e) => setInsuranceData({ ...insuranceData, coveragePercentage: e.target.value })}
                  placeholder="80"
                />
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={insuranceData.isPrimary}
                      onChange={(e) => setInsuranceData({ ...insuranceData, isPrimary: e.target.checked })}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-sm font-medium text-stone-700">Primary Insurance</span>
                  </label>
                </div>
              </div>
              </motion.div>
            )}
            </AnimatePresence>

                </form>
              </div>

              {/* Footer with Tab Navigation */}
              <div className="bg-gradient-to-r from-slate-100 to-blue-50 p-4 border-t-2 border-teal-300 flex justify-between items-center gap-3 rounded-b-2xl shrink-0">
                {/* Previous/Next Tab Buttons */}
                <div className="flex gap-3">
                  {registerActiveTab !== "patient" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        const tabs = ["patient", "contact", "medical", "insurance"];
                        const currentIndex = tabs.indexOf(registerActiveTab);
                        if (currentIndex > 0) setRegisterActiveTab(tabs[currentIndex - 1]);
                      }}
                      className="px-6 py-3 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition border-2 border-slate-300 shadow-md"
                    >
                      ← Previous
                    </motion.button>
                  )}
                  {registerActiveTab !== "insurance" && (() => {
                    const canProceed =
                      registerActiveTab === "patient" ? isPatientTabValid() :
                      registerActiveTab === "contact" ? isContactTabValid() : true;
                    return canProceed ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          const tabs = ["patient", "contact", "medical", "insurance"];
                          const currentIndex = tabs.indexOf(registerActiveTab);
                          if (currentIndex < tabs.length - 1) setRegisterActiveTab(tabs[currentIndex + 1]);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition shadow-md"
                      >
                        Next →
                      </motion.button>
                    ) : (
                      <p className="text-xs text-red-500 font-medium self-center">Fill all required fields (*) to continue</p>
                    );
                  })()}
                </div>

                {/* Register Button (available once required tabs are valid) */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: isAllTabsValid() ? 1.05 : 1 }}
                    whileTap={{ scale: isAllTabsValid() ? 0.95 : 1 }}
                    type="submit"
                    form="register-patient-form"
                    disabled={!isAllTabsValid()}
                    className={`px-8 py-3 rounded-lg font-bold shadow-lg transition ${
                      isAllTabsValid()
                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white cursor-pointer"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                    }`}
                  >
                    💾 Register Patient
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
            </div>

      {/* Patient Details Modal */}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && registeredPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Success Animation Header */}
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-center relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative z-10"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.3,
                      repeat: 2
                    }}
                    className="inline-block text-8xl mb-4"
                  >
                    ✅
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    Registration Successful!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-emerald-50 text-sm"
                  >
                    Patient has been successfully registered
                  </motion.p>
                </motion.div>
                
                {/* Animated Background Elements */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.1, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.05, 0.2]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"
                />
              </div>

              {/* Patient Details */}
              <div className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4 mb-6"
                >
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                    <p className="text-xs font-semibold text-teal-700 mb-1">PATIENT ID</p>
                    <p className="text-2xl font-bold text-slate-800">#{registeredPatient.patientId}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {registeredPatient.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600">Patient Name</p>
                        <p className="font-semibold text-slate-800">{registeredPatient.name}</p>
                      </div>
                    </div>

                    {registeredPatient.email && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
                          📧
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-600">Email</p>
                          <p className="font-medium text-slate-800 text-sm">{registeredPatient.email}</p>
                        </div>
                      </div>
                    )}

                    {registeredPatient.phone && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-lg">
                          📱
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-600">Phone</p>
                          <p className="font-medium text-slate-800">{registeredPatient.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowSuccessModal(false);
                        setShowViewPatientsModal(true);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      View Patients
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowSuccessModal(false);
                        setActiveView("register");
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Add Another
                    </motion.button>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Prepare appointment data with registered patient info
                      const names = registeredPatient.name.split(' ');
                      const firstName = names[0];
                      const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
                      
                      setAppointmentFromRegistration({
                        firstName: firstName,
                        lastName: lastName,
                        email: registeredPatient.email || '',
                        phoneNumber: registeredPatient.phone || '',
                        dateOfBirth: registeredPatient.dateOfBirth || ''
                      });
                      
                      setShowSuccessModal(false);
                      setShowNewAppointmentModal(true);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    📅 Book Appointment
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleClosePatientModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 px-8 py-6 rounded-t-2xl border-b-4 border-teal-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {isEditMode ? 'Edit Patient Record' : 'Patient Medical Record'}
                    </h2>
                    <p className="text-teal-50 text-sm mt-1">
                      {isEditMode ? 'Update patient information' : 'Complete patient profile and medical history'}
                    </p>
                  </div>
                  <button
                    onClick={handleClosePatientModal}
                    className="text-white hover:bg-white/20 rounded-lg p-2.5 transition-all duration-200"
                    title="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
                {loadingPatientDetails ? (
                  <div className="text-center py-20 bg-white rounded-xl shadow-lg border-2 border-teal-200">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-teal-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-teal-500 rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
                      </div>
                    </div>
                    <p className="text-teal-800 text-base font-semibold">Loading patient information...</p>
                    <p className="text-teal-600 text-sm mt-2">Please wait</p>
                  </div>
                ) : selectedPatient ? (
                  <div className="space-y-5">
                    {/* Debug: Log the complete data structure */}
                    {(() => {
                      console.log('═════════════════════════════════════════════');
                      console.log('📋 PATIENT MODAL - COMPLETE DATA STRUCTURE');
                      console.log('═════════════════════════════════════════════');
                      console.log('selectedPatient:', selectedPatient);
                      console.log('selectedPatient.patient:', selectedPatient?.patient);
                      console.log('selectedPatient.patientContact:', selectedPatient?.patientContact);
                      console.log('selectedPatient.patientMedicalInfo:', selectedPatient?.patientMedicalInfo);
                      console.log('selectedPatient.patientInsurance:', selectedPatient?.patientInsurance);
                      console.log('First Name:', selectedPatient?.patient?.patientFirstName);
                      console.log('Last Name:', selectedPatient?.patient?.patientLastName);
                      console.log('Phone:', selectedPatient?.patientContact?.patientPhone);
                      console.log('Email:', selectedPatient?.patientContact?.patientEmail);
                      console.log('═════════════════════════════════════════════');
                      return null;
                    })()}
                    {/* Data Validation Alert */}
                    {(!selectedPatient?.patient || Object.keys(selectedPatient?.patient || {}).length === 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">⚠️</span>
                          <div>
                            <p className="font-bold text-amber-900">Data Loading Issue</p>
                            <p className="text-sm text-amber-800 mt-1">
                              The patient data structure appears to be incomplete. Check the browser console (F12) for detailed data structure logs.
                            </p>
                            <p className="text-xs text-amber-700 mt-2">
                              Expected structure: patient, patientContact, patientMedicalInfo, patientInsurance
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Debug Data Display Panel */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-xl shadow-md">
                      <details className="cursor-pointer">
                        <summary className="font-bold text-blue-900 flex items-center gap-2 cursor-pointer hover:text-blue-700 transition">
                          <span>🔍</span> Debug: Raw Data Values & Token
                        </summary>
                        <div className="mt-3 space-y-2 text-sm bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                          {/* Bearer Token */}
                          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-300 rounded-lg shadow-sm">
                            <p className="font-bold text-purple-900"><strong>🔐 Bearer Token:</strong></p>
                            <code className="bg-purple-100 px-2 py-1 rounded block text-xs break-all mt-2 text-purple-900">
                              {(() => {
                                const token = sessionStorage.getItem('accessToken_session') || localStorage.getItem('accessToken');
                                console.log('🔐 BEARER TOKEN:', token);
                                return token ? token.substring(0, 50) + '...' : '(not found)';
                              })()}
                            </code>
                            <p className="text-xs text-purple-600 mt-1">Full token logged to console</p>
                          </div>
                          
                          <hr className="my-2" />
                          
                          {/* Patient Data */}
                          <p><strong>First Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.patientFirstName || '(empty)'}</code></p>
                          <p><strong>Last Name:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.patientLastName || '(empty)'}</code></p>
                          <p><strong>Clinic ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.clinicID || '(empty)'}</code></p>
                          <p><strong>Patient ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.patientId || '(empty)'}</code></p>
                          <p><strong>DOB:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.patientDOB || '(empty)'}</code></p>
                          <p><strong>Gender:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.patientGender || '(empty)'}</code></p>
                          <p><strong>Blood Type:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patient?.patientBloodType || '(empty)'}</code></p>
                          <hr className="my-2" />
                          <p><strong>Phone:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patientContact?.patientPhone || '(empty)'}</code></p>
                          <p><strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patientContact?.patientEmail || '(empty)'}</code></p>
                          <p><strong>Address:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patientContact?.patientAddress || '(empty)'}</code></p>
                          <p><strong>City:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedPatient?.patientContact?.patientCity || '(empty)'}</code></p>
                        </div>
                      </details>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-gradient-to-br from-blue-50 via-blue-25 to-cyan-50 rounded-xl p-6 shadow-lg border-3 border-blue-400">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-3 border-blue-400">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">👤 Basic Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">👤 First Name</label>
                          <input
                            type="text"
                            placeholder="Enter first name"
                            value={isEditMode ? editedPatient?.patient?.patientFirstName || '' : selectedPatient?.patient?.patientFirstName || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patient: { ...editedPatient.patient, patientFirstName: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-blue-50 disabled:text-blue-900 text-blue-900 font-medium transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">👤 Last Name</label>
                          <input
                            type="text"
                            placeholder="Enter last name"
                            value={isEditMode ? editedPatient?.patient?.patientLastName || '' : selectedPatient?.patient?.patientLastName || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patient: { ...editedPatient.patient, patientLastName: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-blue-50 disabled:text-blue-900 text-blue-900 font-medium transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">🏥 Clinic ID</label>
                          <input
                            type="text"
                            placeholder="Clinic ID"
                            value={selectedPatient?.patient?.clinicID || selectedPatient?.patient?.patientEntityID || ''}
                            disabled
                            className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg bg-blue-50 text-blue-900 font-medium cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">📅 Date of Birth</label>
                          <input
                            type="date"
                            placeholder="Date of Birth"
                            value={isEditMode ? editedPatient?.patient?.patientDOB?.split('T')[0] || '' : selectedPatient?.patient?.patientDOB?.split('T')[0] || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patient: { ...editedPatient.patient, patientDOB: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-blue-50 disabled:text-blue-900 text-blue-900 font-medium transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">⚧️ Gender</label>
                          {isEditMode ? (
                            <select
                              value={editedPatient?.patient?.patientGender || ''}
                              onChange={(e) => setEditedPatient({
                                ...editedPatient,
                                patient: { ...editedPatient.patient, patientGender: e.target.value }
                              })}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 font-medium transition-colors"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Gender"
                              value={selectedPatient?.patient?.patientGender || ''}
                              disabled
                              className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg disabled:bg-blue-50 disabled:text-blue-900 text-blue-900 font-medium transition-colors"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">🩸 Blood Type</label>
                          {isEditMode ? (
                            <select
                              value={editedPatient?.patient?.patientBloodType || ''}
                              onChange={(e) => setEditedPatient({
                                ...editedPatient,
                                patient: { ...editedPatient.patient, patientBloodType: e.target.value }
                              })}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 font-medium transition-colors"
                            >
                              <option value="">Select Blood Type</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Blood Type"
                              value={selectedPatient?.patient?.patientBloodType || ''}
                              disabled
                              className="w-full mt-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg disabled:bg-blue-50 disabled:text-blue-900 text-blue-900 font-medium transition-colors"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gradient-to-br from-emerald-50 via-emerald-25 to-teal-50 rounded-xl p-6 shadow-lg border-3 border-emerald-400">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-3 border-emerald-400">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-emerald-900">📞 Contact Information</h3>
                      </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">📱 Phone Number</label>
                            <input
                              type="text"
                              placeholder="Enter phone number"
                              value={isEditMode ? editedPatient?.patientContact?.patientPhone || '' : selectedPatient?.patientContact?.patientPhone || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientPhone: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-emerald-50 disabled:text-emerald-900 text-emerald-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">📧 Email Address</label>
                            <input
                              type="email"
                              placeholder="Enter email address"
                              value={isEditMode ? editedPatient?.patientContact?.patientEmail || '' : selectedPatient?.patientContact?.patientEmail || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientEmail: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-emerald-50 disabled:text-emerald-900 text-emerald-900 font-medium transition-colors"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">🏠 Address</label>
                            <input
                              type="text"
                              placeholder="Enter full address"
                              value={isEditMode ? editedPatient?.patientContact?.patientAddress || '' : selectedPatient?.patientContact?.patientAddress || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientAddress: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-emerald-50 disabled:text-emerald-900 text-emerald-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">🏙️ City</label>
                            <input
                              type="text"
                              placeholder="Enter city name"
                              value={isEditMode ? editedPatient?.patientContact?.patientCity || '' : selectedPatient?.patientContact?.patientCity || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientCity: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-emerald-50 disabled:text-emerald-900 text-emerald-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">🆘 Emergency Contact</label>
                            <input
                              type="text"
                              placeholder="Enter emergency contact name/number"
                              value={isEditMode ? editedPatient?.patientContact?.patientEmergencyContact || '' : selectedPatient?.patientContact?.patientEmergencyContact || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientEmergencyContact: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-emerald-50 disabled:text-emerald-900 text-emerald-900 font-medium transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                    {/* Medical Information */}
                    <div className="bg-gradient-to-br from-amber-50 via-amber-25 to-orange-50 rounded-xl p-6 shadow-lg border-3 border-amber-400">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-3 border-amber-400">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-amber-900">📋 Medical Information</h3>
                      </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">🚫 Allergies</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.patientAllergies || '' : selectedPatient?.patientMedicalInfo?.patientAllergies || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, patientAllergies: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              placeholder="List any known allergies"
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-amber-50 disabled:text-amber-900 text-amber-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">💊 Current Medications</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.patientCurrentMedications || '' : selectedPatient?.patientMedicalInfo?.patientCurrentMedications || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, patientCurrentMedications: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              placeholder="List current medications"
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-amber-50 disabled:text-amber-900 text-amber-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">⚠️ Chronic Diseases</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.chronicDiseases || '' : selectedPatient?.patientMedicalInfo?.chronicDiseases || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, chronicDiseases: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              placeholder="List chronic diseases or conditions"
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-amber-50 disabled:text-amber-900 text-amber-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">📖 Medical History</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.medicalHistory || '' : selectedPatient?.patientMedicalInfo?.medicalHistory || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, medicalHistory: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              placeholder="Describe medical history"
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-amber-50 disabled:text-amber-900 text-amber-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">👨‍⚕️ Primary Physician</label>
                            <input
                              type="text"
                              placeholder="Enter primary physician name"
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.patientPrimaryPhysician || '' : selectedPatient?.patientMedicalInfo?.patientPrimaryPhysician || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, patientPrimaryPhysician: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-amber-50 disabled:text-amber-900 text-amber-900 font-medium transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">📊 Number of Visits</label>
                            <input
                              type="number"
                              value={selectedPatient?.patientMedicalInfo?.no_of_visits || 0}
                              disabled
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg bg-amber-50 text-amber-900 font-medium cursor-not-allowed"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">🗓️ Last Visited Date</label>
                            <input
                              type="date"
                              value={selectedPatient?.patientMedicalInfo?.lastVisitedDate?.split('T')[0] || ''}
                              disabled
                              className="w-full mt-1 px-4 py-2.5 border-2 border-amber-200 rounded-lg bg-amber-50 text-amber-900 font-medium cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                    {/* Insurance Information */}
                    <div className="bg-gradient-to-br from-rose-50 via-rose-25 to-pink-50 rounded-xl p-6 shadow-lg border-3 border-rose-400">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-3 border-rose-400">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-rose-900">🛡️ Insurance Information</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1.5">🏢 Insurance Provider</label>
                          <input
                            type="text"
                            placeholder="Enter insurance provider name"
                            value={isEditMode ? editedPatient?.patientInsurance?.patientInsuranceProvider || '' : selectedPatient?.patientInsurance?.patientInsuranceProvider || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patientInsurance: { ...editedPatient.patientInsurance, patientInsuranceProvider: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-4 py-2.5 border-2 border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:bg-rose-50 disabled:text-rose-900 text-rose-900 font-medium transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl shadow-lg border-2 border-coral-200">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-coral-100 to-peach-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-amber-900 font-bold">No patient data available</p>
                    <p className="text-stone-600 text-sm mt-2">Unable to load patient information</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!loadingPatientDetails && selectedPatient && (
                <div className="bg-gradient-to-r from-coral-50 to-peach-50 px-8 py-5 rounded-b-2xl border-t-2 border-teal-300 flex gap-3">
                  {isEditMode ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={async () => {
                          try {
                            setUpdatingPatient(true);
                            
                            // Ensure all required fields have values
                            const payload = {
                              ...editedPatient,
                              patientContact: {
                                ...editedPatient.patientContact,
                                patientEmergencyContact: editedPatient.patientContact?.patientEmergencyContact || "N/A"
                              }
                            };
                            
                            await updatePatientFullProfile(payload);
                            setShowPatientModal(false);
                            setIsEditMode(false);
                            setShowUpdateSuccessModal(true);
                          } catch (error) {
                            console.error("Error updating patient:", error);
                            alert("Failed to update patient. Please try again.");
                          } finally {
                            setUpdatingPatient(false);
                          }
                        }}
                        disabled={updatingPatient}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-coral-500 to-peach-500 hover:from-coral-600 hover:to-peach-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingPatient ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Updating...
                          </span>
                        ) : "Save Changes"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setIsEditMode(false);
                          setEditedPatient(null);
                          setSelectedPatient(null);
                          handleClosePatientModal();
                        }}
                        className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        Cancel
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          const patient = selectedPatient?.patient;
                          navigate('/calendar', { 
                            state: { 
                              patientData: {
                                patientId: patient?.patientId,
                                patientName: `${patient?.patientFirstName || ''} ${patient?.patientLastName || ''}`.trim(),
                                patientFirstName: patient?.patientFirstName,
                                patientLastName: patient?.patientLastName,
                                patientPhone: selectedPatient?.patientContact?.patientPrimaryPhone || '',
                                patientEmail: selectedPatient?.patientContact?.patientEmail || '',
                                patientDOB: patient?.patientDOB,
                                patientGender: patient?.patientGender,
                                patientBloodType: patient?.patientBloodType
                              }
                            } 
                          });
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        📅 Book Appointment
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsEditMode(true)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        ✏️ Edit Patient
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleClosePatientModal}
                        className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        Close
                      </motion.button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Success Modal */}
      <AnimatePresence>
        {showUpdateSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowUpdateSuccessModal(false);
              // Scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-12 h-12 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  🎉 Woohoo! 🎉
                </h3>
                <p className="text-white/90 text-lg font-medium">
                  Patient Records Updated!
                </p>
              </div>

              {/* Success Message */}
              <div className="p-8 text-center">
                <div className="mb-6">
                  <p className="text-xl font-semibold text-slate-800 mb-3">
                    Mission Accomplished! 🚀
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    The patient's records have been successfully updated! 
                    Even the database did a little happy dance. 💃
                  </p>
                  <p className="text-slate-500 text-sm mt-3 italic">
                    (No patients were harmed in the making of this update)
                  </p>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowUpdateSuccessModal(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-coral-500 to-peach-500 hover:from-coral-600 hover:to-peach-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Back to Patient List
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && patientToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deletingPatient && setShowDeleteConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Warning Header */}
              <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 p-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-5xl">⚠️</span>
                  </div>
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Danger Zone! ⚡
                </h3>
                <p className="text-white/90 text-lg font-medium">
                  Are you absolutely sure?
                </p>
              </div>

              {/* Warning Message */}
              <div className="p-8">
                <div className="mb-6 text-center">
                  <p className="text-xl font-semibold text-red-600 mb-3">
                    Delete Patient Record?
                  </p>
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                    <p className="font-bold text-red-900 mb-2">
                      {patientToDelete.patientFirstName} {patientToDelete.patientLastName}
                    </p>
                    <p className="text-sm text-red-700">
                      Patient ID: <span className="font-mono font-bold">{patientToDelete.patientId}</span>
                    </p>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-2">
                    This action <span className="font-bold text-red-600">cannot be undone</span>. 
                    All patient records will be permanently deleted from the system.
                  </p>
                  <p className="text-slate-500 text-sm italic">
                    Think twice, delete once! 🤔
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirmModal(false)}
                    disabled={deletingPatient}
                    className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        setDeletingPatient(true);
                        await deletePatient(patientToDelete.patientId);
                        setShowDeleteConfirmModal(false);
                        setShowDeleteSuccessModal(true);
                      } catch (error) {
                        console.error("Error deleting patient:", error);
                        alert("Failed to delete patient. Please try again.");
                      } finally {
                        setDeletingPatient(false);
                      }
                    }}
                    disabled={deletingPatient}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingPatient ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deleting...
                      </span>
                    ) : "Yes, Delete Forever"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Success Modal */}
      <AnimatePresence>
        {showDeleteSuccessModal && patientToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteSuccessModal(false);
              setPatientToDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Sad Header */}
              <div className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <motion.span 
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="text-5xl"
                    >
                      😢
                    </motion.span>
                  </div>
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Farewell, Friend! 👋
                </h3>
                <p className="text-white/90 text-lg font-medium">
                  Patient Record Deleted
                </p>
              </div>

              {/* Sad Message */}
              <div className="p-8 text-center">
                <div className="mb-6">
                  <p className="text-xl font-semibold text-slate-800 mb-3">
                    They're Gone... 💔
                  </p>
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 mb-4">
                    <p className="font-bold text-slate-700 mb-1">
                      {patientToDelete.patientFirstName} {patientToDelete.patientLastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      has been removed from the system
                    </p>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-2">
                    The patient record has sailed off into the digital sunset. 🌅
                    <br />
                    Our database just shed a single tear... 😭
                  </p>
                  <p className="text-slate-500 text-sm italic mt-3">
                    "We'll miss you, but your data won't miss our servers!" 🗄️💨
                  </p>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowDeleteSuccessModal(false);
                    setPatientToDelete(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Back to Patient List
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Visit Modal */}
      <AnimatePresence>
        {showAddVisitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddVisitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🧠 Diagnosis &amp; Visit Info</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddVisitModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form
                  ref={appointmentBookingFormRef}
                  id="patients-book-appointment-form"
                  onSubmit={async (e) => {
                  e.preventDefault();
                  
                  if (!selectedPatientForVisit) {
                    setVisitPatientError("⚠️ Please search and select a patient before submitting the visit information.");
                    return;
                  }

                  setVisitPatientError("");
                  setSavingVisit(true);
                  try {
                    const visitData = {
                      patientId: parseInt(selectedPatientForVisit.patientId) || 0,
                      clinicId: parseInt(selectedPatientForVisit.clinicId) || 0,
                      visitDate: newVisit.visitDate,
                      reasonForVisit: newVisit.reasonForVisit,
                      diagnoses: newVisit.diagnoses,
                      treatments: newVisit.treatments,
                      prescriptions: newVisit.prescriptions,
                      notes: newVisit.notes || "N/A",
                      nextAppointmentDate: newVisit.nextAppointmentDate || null,
                      attendingPhysician: newVisit.attendingPhysician,
                      billingAmount: parseFloat(newVisit.billingAmount) || 0,
                      paymentStatus: newVisit.paymentStatus
                    };

                    console.log("Submitting visit data:", visitData);
                    const response = await visitService.createVisit(visitData);
                    console.log("Visit created successfully:", response);
                    
                    alert("✅ Visit recorded successfully!");
                    
                    // Reset form
                    setNewVisit({
                      visitDate: new Date().toISOString().split('T')[0],
                      reasonForVisit: "",
                      diagnoses: "",
                      treatments: "",
                      prescriptions: "",
                      notes: "",
                      nextAppointmentDate: "",
                      attendingPhysician: "",
                      billingAmount: 0,
                      paymentStatus: "Pending"
                    });
                    setSelectedPatientForVisit(null);
                    setShowAddVisitModal(false);
                  } catch (error) {
                    console.error("Error creating visit:", error);
                    alert("❌ Error recording visit: " + (error.message || "Unknown error"));
                  } finally {
                    setSavingVisit(false);
                  }
                }}>
                  {/* Patient Search */}
                  <div className={`mb-6 p-4 bg-gradient-to-r rounded-xl border-2 transition-all ${
                    visitPatientError 
                      ? "from-red-50 to-orange-50 border-red-400 shadow-lg shadow-red-200" 
                      : "from-blue-50 to-cyan-50 border-blue-200"
                  }`}>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      visitPatientError ? "text-red-900" : "text-blue-900"
                    }`}>Search Patient {visitPatientError && "⚠️"}</h3>
                    {visitPatientError && (
                      <div className="mb-3 p-3 bg-red-100 border-2 border-red-400 rounded-lg flex items-start gap-2">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-sm font-semibold text-red-900 flex-1">{visitPatientError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={visitSearchQuery}
                        onChange={(e) => setVisitSearchQuery(e.target.value)}
                        placeholder="Enter Patient ID"
                        className="px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!visitSearchQuery.trim()) {
                            setVisitPatientError("⚠️ Please enter a patient ID to search.");
                            return;
                          }
                          
                          setVisitPatientError("");
                          try {
                            // Search for patient
                            const results = await searchPatients({ patientId: visitSearchQuery.trim() });
                            if (results && results.length > 0) {
                              setSelectedPatientForVisit(results[0]);
                              setVisitPatientError("");
                            } else {
                              setVisitPatientError(`❌ No patient found with ID: ${visitSearchQuery.trim()}. Please verify the patient ID.`);
                            }
                          } catch (error) {
                            console.error("Error searching patient:", error);
                            setVisitPatientError("❌ Error searching for patient. Please try again.");
                          }
                        }}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700"
                      >
                        🔍 Search
                      </button>
                    </div>
                    
                    {selectedPatientForVisit && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-3 p-3 bg-white rounded-lg border-2 border-green-400 shadow-lg shadow-green-200">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="text-sm font-bold text-green-900">
                              Patient Selected: {selectedPatientForVisit.patientFirstName} {selectedPatientForVisit.patientLastName}
                            </p>
                            <p className="text-xs text-green-700">
                              ID: {selectedPatientForVisit.patientId} • Clinic ID: {selectedPatientForVisit.clinicId}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Visit Form */}
                  <div className={`space-y-4 transition-opacity ${
                    !selectedPatientForVisit ? "opacity-50" : "opacity-100"
                  }`}>
                    {!selectedPatientForVisit && (
                      <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center gap-2">
                        <span className="text-2xl">🔒</span>
                        <p className="text-sm font-semibold text-amber-900">
                          Form fields are disabled. Please search and select a patient to enable data entry.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Visit Date"
                        type="date"
                        value={newVisit.visitDate}
                        onChange={(e) => setNewVisit({ ...newVisit, visitDate: e.target.value })}
                        required
                        disabled={!selectedPatientForVisit}
                      />
                      <InputField
                        label="Attending Physician"
                        value={newVisit.attendingPhysician}
                        onChange={(e) => setNewVisit({ ...newVisit, attendingPhysician: e.target.value })}
                        placeholder="Dr. Name"
                        required
                        disabled={!selectedPatientForVisit}
                      />
                    </div>

                    <InputField
                      label="Reason for Visit"
                      value={newVisit.reasonForVisit}
                      onChange={(e) => setNewVisit({ ...newVisit, reasonForVisit: e.target.value })}
                      placeholder="Brief description of visit purpose"
                      required
                      disabled={!selectedPatientForVisit}
                    />

                    <InputField
                      label="Diagnoses"
                      type="textarea"
                      value={newVisit.diagnoses}
                      onChange={(e) => setNewVisit({ ...newVisit, diagnoses: e.target.value })}
                      placeholder="Detailed diagnoses"
                      required
                      disabled={!selectedPatientForVisit}
                    />

                    <InputField
                      label="Treatments"
                      type="textarea"
                      value={newVisit.treatments}
                      onChange={(e) => setNewVisit({ ...newVisit, treatments: e.target.value })}
                      placeholder="Treatments provided"
                      required
                      disabled={!selectedPatientForVisit}
                    />

                    <div className="mb-2">
                      <label className={`block text-xs font-medium mb-1 transition ${
                        !selectedPatientForVisit ? "text-gray-400" : "text-gray-700"
                      }`}>
                        Prescriptions {!selectedPatientForVisit && <span className="text-xs ml-1 text-gray-400">🔒</span>}
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          value={newVisit.prescriptions}
                          onChange={(e) => setNewVisit({ ...newVisit, prescriptions: e.target.value })}
                          placeholder={!selectedPatientForVisit ? "Select patient first to enable" : "Medications prescribed"}
                          rows={2}
                          disabled={!selectedPatientForVisit}
                          className={`flex-1 px-3 py-1.5 text-sm border rounded-lg resize-none transition ${
                            !selectedPatientForVisit 
                              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                              : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
                          }`}
                        />
                        <motion.button
                          type="button"
                          whileHover={selectedPatientForVisit ? { scale: 1.05 } : {}}
                          whileTap={selectedPatientForVisit ? { scale: 0.95 } : {}}
                          onClick={async () => {
                            if (selectedPatientForVisit) {
                              setPrescriptionText(newVisit.prescriptions);
                              setMedications([]);
                              setMedicationForm(emptyMedicationForm);
                              setEditingMedicationIndex(null);
                              setShowPrescriptionModal(true);
                              
                              // Fetch patient medical info
                              setLoadingMedicalInfo(true);
                              try {
                                const fullProfile = await getPatientFullProfile(parseInt(selectedPatientForVisit.patientId));
                                setPatientMedicalInfo(fullProfile.patientMedicalInfo || null);
                              } catch (error) {
                                console.error("Error fetching patient medical info:", error);
                                setPatientMedicalInfo(null);
                              } finally {
                                setLoadingMedicalInfo(false);
                              }
                            }
                          }}
                          disabled={!selectedPatientForVisit}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                            selectedPatientForVisit
                              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-md hover:shadow-lg"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          📝 Write / Edit Prescription
                        </motion.button>
                      </div>
                    </div>

                    <InputField
                      label="Notes"
                      type="textarea"
                      value={newVisit.notes}
                      onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                      placeholder="Additional notes"
                      disabled={!selectedPatientForVisit}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InputField
                        label="Next Appointment"
                        type="date"
                        value={newVisit.nextAppointmentDate}
                        onChange={(e) => setNewVisit({ ...newVisit, nextAppointmentDate: e.target.value })}
                        disabled={!selectedPatientForVisit}
                      />
                      <InputField
                        label="Billing Amount"
                        type="number"
                        value={newVisit.billingAmount}
                        onChange={(e) => setNewVisit({ ...newVisit, billingAmount: e.target.value })}
                        placeholder="0.00"
                        required
                        disabled={!selectedPatientForVisit}
                      />
                      <InputField
                        label="Payment Status"
                        options={["Pending", "Paid", "Partial"]}
                        value={newVisit.paymentStatus}
                        onChange={(e) => setNewVisit({ ...newVisit, paymentStatus: e.target.value })}
                        disabled={!selectedPatientForVisit}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddVisitModal(false)}
                      className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedPatientForVisit || savingVisit}
                      onClick={(e) => {
                        if (!selectedPatientForVisit) {
                          e.preventDefault();
                          setVisitPatientError("⚠️ Please search and select a patient before submitting the visit information.");
                          document.querySelector('.overflow-y-auto').scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`px-8 py-2 rounded-lg font-bold transition-all ${
                        selectedPatientForVisit && !savingVisit
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 hover:scale-105"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                      }`}
                      title={!selectedPatientForVisit ? "Please select a patient first" : ""}
                    >
                      {savingVisit ? "💾 Saving..." : selectedPatientForVisit ? "💾 Save Diagnosis" : "🔒 Select Patient First"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Visits Modal */}
      <AnimatePresence>
        {showViewVisitsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewVisitsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">📋 View Patient Visits</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowViewVisitsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Filter Section */}
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <span>🔍</span>
                    Filter Visits
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Clinic ID */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-purple-800 flex items-center gap-2">
                        <span>🏥</span> Clinic ID
                      </label>
                      <input
                        type="text"
                        value={visitFilters.clinicId}
                        onChange={(e) => setVisitFilters({ ...visitFilters, clinicId: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                        placeholder="Enter Clinic ID"
                      />
                    </div>

                    {/* Patient ID */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-purple-800 flex items-center gap-2">
                        <span>👤</span> Patient ID
                      </label>
                      <input
                        type="number"
                        value={visitFilters.patientId}
                        onChange={(e) => setVisitFilters({ ...visitFilters, patientId: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                        placeholder="Enter Patient ID"
                      />
                    </div>

                    {/* Visit Date */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-purple-800 flex items-center gap-2">
                        <span>📅</span> Visit Date
                      </label>
                      <input
                        type="date"
                        value={visitFilters.visitDate}
                        onChange={(e) => setVisitFilters({ ...visitFilters, visitDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleFilterVisits}
                      disabled={!visitFilters.clinicId && !visitFilters.patientId && !visitFilters.visitDate}
                      className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                        visitFilters.clinicId || visitFilters.patientId || visitFilters.visitDate
                          ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>🔍</span>
                      <span>{loadingVisits ? 'Searching...' : 'Search Visits'}</span>
                    </button>

                    <button
                      onClick={handleResetVisitFilters}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>🔄</span>
                      <span>Reset</span>
                    </button>
                  </div>

                  {!visitFilters.clinicId && !visitFilters.patientId && !visitFilters.visitDate && (
                    <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>At least one filter is required to search</span>
                    </p>
                  )}
                </div>

                {/* Loading State */}
                {loadingVisits && (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-purple-600 font-bold">Loading visits...</p>
                  </div>
                )}

                {/* Results Summary */}
                {!loadingVisits && filteredVisits.length > 0 && (
                  <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold text-xl shadow-md">
                          {filteredVisits.length}
                        </div>
                        <div>
                          <p className="font-bold">Search Results</p>
                          <p className="text-sm opacity-90">
                            {filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''} found
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {visitFilters.clinicId && <p>🏥 Clinic: {visitFilters.clinicId}</p>}
                        {visitFilters.patientId && <p>👤 Patient: {visitFilters.patientId}</p>}
                        {visitFilters.visitDate && <p>📅 Date: {visitFilters.visitDate}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Visit Tiles */}
                {!loadingVisits && filteredVisits.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredVisits.map((visit, index) => {
                      const colors = [
                        { bg: 'from-purple-400 to-purple-600', card: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
                        { bg: 'from-pink-400 to-pink-600', card: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-700' },
                        { bg: 'from-orange-400 to-orange-600', card: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
                        { bg: 'from-blue-400 to-blue-600', card: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
                        { bg: 'from-emerald-400 to-emerald-600', card: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
                        { bg: 'from-rose-400 to-rose-600', card: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
                        { bg: 'from-cyan-400 to-cyan-600', card: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700' },
                        { bg: 'from-indigo-400 to-indigo-600', card: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' }
                      ];
                      const colorScheme = colors[index % colors.length];
                      const visitDate = new Date(visit.visitDate);

                      return (
                        <motion.div
                          key={visit.visitId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.03, y: -5 }}
                          onClick={() => {
                            setSelectedVisitDetail(visit);
                            setShowVisitDetailModal(true);
                          }}
                          className={`${colorScheme.card} border-2 ${colorScheme.border} rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer`}
                        >
                          {/* Gradient Header */}
                          <div className={`h-2 bg-gradient-to-r ${colorScheme.bg}`}></div>

                          <div className="p-4">
                            {/* Visit ID Badge */}
                            <div className="flex items-center justify-between mb-3">
                              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${colorScheme.bg} text-white font-bold text-xs shadow-md`}>
                                🆔 Visit #{visit.visitId}
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                visit.paymentStatus === 'Paid' 
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-amber-100 text-amber-700 border border-amber-300'
                              }`}>
                                {visit.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}
                              </div>
                            </div>

                            {/* Visit Details */}
                            <div className="space-y-2">
                              <div className="bg-white rounded-lg p-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">👤</span>
                                  <p className="text-xs text-gray-500 font-semibold">Patient ID</p>
                                </div>
                                <p className="text-sm font-bold text-gray-800 ml-6">{visit.patientId}</p>
                              </div>

                              <div className="bg-white rounded-lg p-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">📅</span>
                                  <p className="text-xs text-gray-500 font-semibold">Visit Date</p>
                                </div>
                                <p className="text-xs font-bold text-gray-800 ml-6">
                                  {visitDate.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>

                              <div className="bg-white rounded-lg p-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">🩺</span>
                                  <p className="text-xs text-gray-500 font-semibold">Reason</p>
                                </div>
                                <p className="text-xs font-bold text-gray-800 ml-6 truncate">
                                  {visit.reasonForVisit || 'N/A'}
                                </p>
                              </div>

                              {visit.diagnoses && (
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🔬</span>
                                    <p className="text-xs text-gray-500 font-semibold">Diagnosis</p>
                                  </div>
                                  <p className="text-xs text-gray-700 ml-6 line-clamp-2">
                                    {visit.diagnoses}
                                  </p>
                                </div>
                              )}

                              {visit.attendingPhysician && (
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">👨‍⚕️</span>
                                    <p className="text-xs text-gray-500 font-semibold">Doctor</p>
                                  </div>
                                  <p className="text-xs font-bold text-gray-800 ml-6">
                                    {visit.attendingPhysician}
                                  </p>
                                </div>
                              )}

                              {visit.billingAmount != null && (
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">💰</span>
                                    <p className="text-xs text-gray-500 font-semibold">Billing</p>
                                  </div>
                                  <p className="text-sm font-bold text-gray-800 ml-6">
                                    ₹{visit.billingAmount.toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Hover hint */}
                            <div className={`mt-3 pt-3 border-t border-gray-200 text-xs font-bold ${colorScheme.text} text-center`}>
                              Click for full details →
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : !loadingVisits && filteredVisits.length === 0 && (visitFilters.clinicId || visitFilters.patientId || visitFilters.visitDate) ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">No Visits Found</h3>
                    <p className="text-gray-500">Try adjusting your search filters</p>
                  </div>
                ) : !loadingVisits && (
                  <div className="text-center py-16">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="text-8xl mb-4"
                    >
                      🔍
                    </motion.div>
                    <h3 className="text-2xl font-bold text-purple-700 mb-2">Ready to Search!</h3>
                    <p className="text-gray-600">Enter at least one filter above to view patient visits</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visit Detail Drawer */}
      <AnimatePresence>
        {showVisitDetailModal && selectedVisitDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
            onClick={() => {
              setShowVisitDetailModal(false);
              setSelectedVisitDetail(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 p-5 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Visit #{selectedVisitDetail.visitId}</p>
                  <h3 className="text-2xl font-bold">Detailed Visit Summary</h3>
                  <p className="text-sm opacity-90">{new Date(selectedVisitDetail.visitDate || Date.now()).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Payment: {selectedVisitDetail.paymentStatus || 'N/A'}</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">Billing: {selectedVisitDetail.billingAmount != null ? `₹${selectedVisitDetail.billingAmount}` : 'N/A'}</span>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-indigo-700">Patient</p>
                    <p className="text-base font-bold text-indigo-900">ID: {selectedVisitDetail.patientId}</p>
                    <p className="text-sm text-indigo-800">Clinic: {selectedVisitDetail.clinicId || 'N/A'}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-emerald-700">Doctor</p>
                    <p className="text-base font-bold text-emerald-900">{selectedVisitDetail.attendingPhysician || 'Not captured'}</p>
                    {selectedVisitDetail.nextAppointmentDate && (
                      <p className="text-sm text-emerald-800">Next visit: {selectedVisitDetail.nextAppointmentDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Reason for Visit</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedVisitDetail.reasonForVisit || 'Not provided'}</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Diagnosis</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedVisitDetail.diagnoses || 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Treatments</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedVisitDetail.treatments || 'Not provided'}</p>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500">Prescription</p>
                    <div className="flex gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          try {
                            const pdf = new jsPDF({
                              orientation: 'portrait',
                              unit: 'mm',
                              format: 'a4'
                            });

                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            let yPosition = 20;

                            // Header
                            pdf.setFillColor(102, 126, 234);
                            pdf.rect(0, 0, pageWidth, 40, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(24);
                            pdf.text('Prescription Report', pageWidth / 2, 20, { align: 'center' });
                            pdf.setFontSize(10);
                            pdf.text('Medical Consultation Summary', pageWidth / 2, 30, { align: 'center' });

                            // Reset text color
                            pdf.setTextColor(50, 50, 50);
                            yPosition = 50;

                            // Patient Info
                            pdf.setFontSize(12);
                            pdf.setFont(undefined, 'bold');
                            pdf.text('Patient Information', 20, yPosition);
                            yPosition += 8;

                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'normal');
                            pdf.text(`Name: ${selectedVisitDetail?.patientFirstName} ${selectedVisitDetail?.patientLastName}`, 20, yPosition);
                            yPosition += 6;
                            pdf.text(`Phone: ${selectedVisitDetail?.patientPhone || 'N/A'}`, 20, yPosition);
                            yPosition += 6;
                            pdf.text(`Email: ${selectedVisitDetail?.patientEmail || 'N/A'}`, 20, yPosition);
                            yPosition += 6;
                            pdf.text(`Visit Date: ${selectedVisitDetail?.visitDate ? new Date(selectedVisitDetail.visitDate).toLocaleDateString() : 'N/A'}`, 20, yPosition);
                            yPosition += 12;

                            // Diagnosis
                            if (selectedVisitDetail?.diagnoses) {
                              pdf.setFontSize(12);
                              pdf.setFont(undefined, 'bold');
                              pdf.text('Diagnosis', 20, yPosition);
                              yPosition += 8;

                              pdf.setFontSize(10);
                              pdf.setFont(undefined, 'normal');
                              const diagnosisLines = pdf.splitTextToSize(selectedVisitDetail.diagnoses, pageWidth - 40);
                              pdf.text(diagnosisLines, 20, yPosition);
                              yPosition += diagnosisLines.length * 6 + 6;
                            }

                            // Medications
                            pdf.setFontSize(12);
                            pdf.setFont(undefined, 'bold');
                            pdf.text('Medications', 20, yPosition);
                            yPosition += 8;

                            try {
                              const presData = typeof selectedVisitDetail?.prescriptions === 'string'
                                ? JSON.parse(selectedVisitDetail.prescriptions)
                                : selectedVisitDetail?.prescriptions;
                              
                              const medications = (Array.isArray(presData) ? presData : [presData]).filter(m => m);

                              pdf.setFontSize(9);
                              pdf.setFont(undefined, 'normal');
                              medications.forEach((med) => {
                                const medText = `• ${med.medicineName || med.name || 'N/A'} - ${med.dosage || 'N/A'} - ${med.frequency || 'N/A'} - ${med.duration || 'N/A'}`;
                                const medLines = pdf.splitTextToSize(medText, pageWidth - 40);
                                if (yPosition + medLines.length * 5 > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.text(medLines, 20, yPosition);
                                yPosition += medLines.length * 5 + 2;
                              });
                            } catch (e) {
                              pdf.text('No medications recorded', 20, yPosition);
                              yPosition += 8;
                            }

                            // Footer
                            pdf.setFontSize(8);
                            pdf.setTextColor(150, 150, 150);
                            pdf.text('This is an automated prescription report from the clinic management system.', pageWidth / 2, pageHeight - 10, { align: 'center' });

                            const patientName = selectedVisitDetail?.patientFirstName || 'Patient';
                            const timestamp = new Date().toISOString().split('T')[0];
                            pdf.save(`Prescription_${patientName}_${timestamp}.pdf`);
                            
                            alert('✅ Prescription PDF downloaded successfully!');
                          } catch (error) {
                            console.error('Error generating PDF:', error);
                            alert('❌ Error generating PDF. Please try again.');
                          }
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow hover:shadow-md"
                        title="Download as PDF"
                      >
                        📥 PDF
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          try {
                            setSendingEmail(true);
                            const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                            
                            const patientEmail = selectedVisitDetail?.patientEmail;
                            if (!patientEmail) {
                              alert('❌ Patient email not available');
                              setSendingEmail(false);
                              return;
                            }

                            let prescriptionContent = '';
                            try {
                              const presData = typeof selectedVisitDetail.prescriptions === 'string'
                                ? JSON.parse(selectedVisitDetail.prescriptions)
                                : selectedVisitDetail.prescriptions;
                              
                              if (Array.isArray(presData) && presData.length > 0) {
                                prescriptionContent = presData.map(m => 
                                  `${m.medicineName || m.name} - ${m.dosage} - ${m.frequency} - ${m.duration}`
                                ).join('\n');
                              } else if (typeof presData === 'object' && presData !== null) {
                                prescriptionContent = JSON.stringify(presData, null, 2);
                              } else {
                                prescriptionContent = selectedVisitDetail.prescriptions || '';
                              }
                            } catch (e) {
                              prescriptionContent = typeof selectedVisitDetail.prescriptions === 'string' ? selectedVisitDetail.prescriptions : 'Prescription data';
                            }

                            const emailHTML = `
                              <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
                                  <h1 style="margin: 0;">Prescription Report</h1>
                                  <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Medical Consultation Summary</p>
                                </div>
                                
                                <div style="padding: 30px 20px;">
                                  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                    <h3 style="color: #333; margin: 0 0 10px;">Patient Information</h3>
                                    <p style="margin: 5px 0;"><strong>Name:</strong> ${selectedVisitDetail?.patientFirstName} ${selectedVisitDetail?.patientLastName}</p>
                                    <p style="margin: 5px 0;"><strong>Email:</strong> ${patientEmail}</p>
                                    <p style="margin: 5px 0;"><strong>Visit Date:</strong> ${selectedVisitDetail?.visitDate ? new Date(selectedVisitDetail.visitDate).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                  
                                  <div style="margin-bottom: 20px;">
                                    <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💊 Prescription</h3>
                                    <pre style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; color: #555; white-space: pre-wrap; font-family: monospace; font-size: 12px;">${prescriptionContent}</pre>
                                  </div>
                                  
                                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
                                    <p>This is an automated prescription report. Please consult with your doctor for any clarifications.</p>
                                  </div>
                                </div>
                              </div>
                            `;

                            const response = await sendEmail({
                              Email: patientEmail,
                              Subject: `Prescription Report from ${userData.clinicName || 'Clinic'}`,
                              HtmlBody: emailHTML
                            });

                            if (response.success) {
                              alert('✅ Email sent successfully!');
                            } else {
                              alert('❌ Failed to send email');
                            }
                            setSendingEmail(false);
                          } catch (error) {
                            console.error('Error sending email:', error);
                            alert('❌ Error sending email. Please try again.');
                            setSendingEmail(false);
                          }
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow hover:shadow-md"
                        title="Send via Email"
                      >
                        📧 Email
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const patientPhone = selectedVisitDetail?.patientPhone;
                          if (!patientPhone) {
                            alert('❌ Patient phone number not available');
                            return;
                          }

                          let prescriptionText = '';
                          try {
                            const presData = typeof selectedVisitDetail?.prescriptions === 'string'
                              ? JSON.parse(selectedVisitDetail.prescriptions)
                              : selectedVisitDetail?.prescriptions;
                            
                            if (Array.isArray(presData) && presData.length > 0) {
                              prescriptionText = presData.map(m => 
                                `• ${m.medicineName || m.name} - ${m.dosage || 'N/A'} - ${m.frequency || 'N/A'}`
                              ).join('\n');
                            } else if (typeof presData === 'object' && presData !== null) {
                              prescriptionText = JSON.stringify(presData, null, 2);
                            } else {
                              prescriptionText = selectedVisitDetail?.prescriptions || 'Prescription data';
                            }
                          } catch (e) {
                            prescriptionText = typeof selectedVisitDetail?.prescriptions === 'string' ? selectedVisitDetail.prescriptions : 'Prescription data';
                          }
                          
                          const messageText = `🏥 *Prescription Report*\n\n` +
                            `👤 *Patient:* ${selectedVisitDetail?.patientFirstName} ${selectedVisitDetail?.patientLastName}\n\n` +
                            `🔬 *Diagnosis:* ${selectedVisitDetail?.diagnoses || 'N/A'}\n\n` +
                            `💊 *Medications:*\n${prescriptionText}\n\n` +
                            `*For queries, please contact the clinic.* ☺️`;
                          
                          const encodedText = encodeURIComponent(messageText);
                          const whatsappURL = `https://api.whatsapp.com/send?phone=${patientPhone}&text=${encodedText}`;
                          window.open(whatsappURL, '_blank');
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 text-white shadow hover:shadow-md"
                        title="Share via WhatsApp"
                      >
                        💬 WhatsApp
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => {
                          const patientFallback = {
                            patientId: selectedVisitDetail.patientId,
                            patientFirstName: selectedVisitDetail.patientFirstName || 'Patient',
                            patientLastName: selectedVisitDetail.patientLastName || `#${selectedVisitDetail.patientId}`,
                            clinicId: selectedVisitDetail.clinicId || '',
                            patientEmail: selectedVisitDetail.patientEmail || '',
                            patientPhone: selectedVisitDetail.patientPhone || ''
                          };
                          setSelectedPatientForVisit((prev) => prev || patientFallback);
                          setNewVisit({
                            ...newVisit,
                            visitDate: selectedVisitDetail.visitDate?.split('T')[0] || newVisit.visitDate,
                            reasonForVisit: selectedVisitDetail.reasonForVisit || newVisit.reasonForVisit,
                            diagnoses: selectedVisitDetail.diagnoses || newVisit.diagnoses,
                            treatments: selectedVisitDetail.treatments || newVisit.treatments,
                            prescriptions: selectedVisitDetail.prescriptions || ""
                          });
                          setPrescriptionText(selectedVisitDetail.prescriptions || "");
                          setMedications([]);
                          setMedicationForm(emptyMedicationForm);
                          setEditingMedicationIndex(null);
                          setShowVisitDetailModal(false);
                          setShowPrescriptionModal(true);
                        }}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow"
                      >
                        Edit / Print Prescription
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-dashed rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {typeof selectedVisitDetail.prescriptions === 'object' && selectedVisitDetail.prescriptions !== null ? (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                        <p className="text-gray-600">📋 {JSON.stringify(selectedVisitDetail.prescriptions, null, 2)}</p>
                      </div>
                    ) : (
                      <p>{selectedVisitDetail.prescriptions || 'No prescription recorded yet.'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500">Billing Amount</p>
                    <p className="text-lg font-bold text-slate-800">{selectedVisitDetail.billingAmount != null ? `₹${selectedVisitDetail.billingAmount}` : 'Not set'}</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500">Payment Status</p>
                    <p className="text-sm font-bold text-slate-800">{selectedVisitDetail.paymentStatus || 'Pending'}</p>
                  </div>
                  <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500">Notes</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedVisitDetail.notes || 'No notes added.'}</p>
                  </div>
                </div>

                {/* Keep prescription authoring action inside the visit detail context */}
                <div className="flex justify-end mt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const patientFallback = {
                        patientId: selectedVisitDetail.patientId,
                        patientFirstName: selectedVisitDetail.patientFirstName || 'Patient',
                        patientLastName: selectedVisitDetail.patientLastName || `#${selectedVisitDetail.patientId}`,
                        clinicId: selectedVisitDetail.clinicId || ''
                      };
                      setSelectedPatientForVisit((prev) => prev || patientFallback);
                      setNewVisit({
                        ...newVisit,
                        visitDate: selectedVisitDetail.visitDate?.split('T')[0] || newVisit.visitDate,
                        reasonForVisit: selectedVisitDetail.reasonForVisit || newVisit.reasonForVisit,
                        diagnoses: selectedVisitDetail.diagnoses || newVisit.diagnoses,
                        treatments: selectedVisitDetail.treatments || newVisit.treatments,
                        prescriptions: selectedVisitDetail.prescriptions || ""
                      });
                      setPrescriptionText(selectedVisitDetail.prescriptions || "");
                      setMedications([]);
                      setMedicationForm(emptyMedicationForm);
                      setEditingMedicationIndex(null);
                      setShowVisitDetailModal(false);
                      setShowPrescriptionModal(true);
                    }}
                    className="px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow hover:shadow-lg"
                  >
                    📝 Write / Edit Prescription
                  </motion.button>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowVisitDetailModal(false);
                    setSelectedVisitDetail(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold bg-white border text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Write Prescription Modal */}
      <AnimatePresence>
        {showPrescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrescriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 text-white" style={{ background: `linear-gradient(135deg, ${prescriptionColor}, ${prescriptionColor}dd)` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold">📋 Medical Prescription</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPrescriptionModal(false)}
                    className="text-white hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>
                
                {/* Doctor Information */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/80 text-sm mb-1">Doctor Name</p>
                      <p className="font-bold text-lg">{CURRENT_DOCTOR.name}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm mb-1">Registration Number</p>
                      <p className="font-bold text-lg">{CURRENT_DOCTOR.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-white/80 text-sm">Specialization: {CURRENT_DOCTOR.specialization}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                {/* Patient Information */}
                {selectedPatientForVisit && (
                  <div className="rounded-lg p-6 mb-6 border" style={{ 
                    background: `linear-gradient(135deg, ${prescriptionColor}15, ${prescriptionColor}05)`,
                    borderColor: `${prescriptionColor}40`
                  }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: prescriptionColor }}>Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Name:</span>
                        <span className="ml-2">{selectedPatientForVisit.patientFirstName} {selectedPatientForVisit.patientLastName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Patient ID:</span>
                        <span className="ml-2">{selectedPatientForVisit.patientId}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Clinic ID:</span>
                        <span className="ml-2">{selectedPatientForVisit.clinicId}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Visit Date:</span>
                        <span className="ml-2">{newVisit.visitDate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Patient's Existing Medical Conditions - Highlighted for Doctor's Reference */}
                {loadingMedicalInfo ? (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-6 text-center">
                    <p className="text-amber-900">⏳ Loading patient medical history...</p>
                  </div>
                ) : patientMedicalInfo ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl p-6 mb-6 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">⚠️</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-900 mb-2">PATIENT'S EXISTING MEDICAL CONDITIONS</h3>
                        <p className="text-sm text-red-800 mb-4 font-semibold">
                          <strong>⚠️ CRITICAL:</strong> Please review these conditions carefully while prescribing medications
                        </p>
                        
                        <div className="space-y-3">
                          {patientMedicalInfo.chronicDiseases && patientMedicalInfo.chronicDiseases !== 'None' && (
                            <div className="p-4 bg-white/70 rounded-lg border-l-4 border-red-500">
                              <p className="text-xs font-bold text-red-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">🫀</span> CHRONIC DISEASES
                              </p>
                              <p className="text-sm text-red-900 font-semibold">{patientMedicalInfo.chronicDiseases}</p>
                            </div>
                          )}
                          
                          {patientMedicalInfo.patientAllergies && patientMedicalInfo.patientAllergies !== 'None' && (
                            <div className="p-4 bg-white/70 rounded-lg border-l-4 border-orange-500">
                              <p className="text-xs font-bold text-orange-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">🚨</span> ALLERGIES
                              </p>
                              <p className="text-sm text-orange-900 font-semibold">{patientMedicalInfo.patientAllergies}</p>
                            </div>
                          )}
                          
                          {patientMedicalInfo.patientCurrentMedications && patientMedicalInfo.patientCurrentMedications !== 'None' && (
                            <div className="p-4 bg-white/70 rounded-lg border-l-4 border-amber-500">
                              <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">💊</span> CURRENT MEDICATIONS
                              </p>
                              <p className="text-sm text-amber-900 font-semibold">{patientMedicalInfo.patientCurrentMedications}</p>
                            </div>
                          )}
                          
                          {patientMedicalInfo.patientMedicalHistory && patientMedicalInfo.patientMedicalHistory !== 'None' && (
                            <div className="p-4 bg-white/70 rounded-lg border-l-4 border-yellow-500">
                              <p className="text-xs font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">📋</span> MEDICAL HISTORY
                              </p>
                              <p className="text-sm text-yellow-900">{patientMedicalInfo.patientMedicalHistory}</p>
                            </div>
                          )}
                        </div>

                        {/* Current Visit Information */}
                        <div className="mt-4 pt-4 border-t-2 border-red-300">
                          <h4 className="text-sm font-bold text-red-900 mb-3">Current Visit Information:</h4>
                          <div className="space-y-2">
                            {newVisit.reasonForVisit && (
                              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <p className="text-xs font-bold text-blue-900 mb-1">🩺 REASON FOR VISIT</p>
                                <p className="text-sm text-blue-900">{newVisit.reasonForVisit}</p>
                              </div>
                            )}
                            
                            {newVisit.diagnoses && (
                              <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                                <p className="text-xs font-bold text-purple-900 mb-1">🔬 TODAY'S DIAGNOSES</p>
                                <p className="text-sm text-purple-900">{newVisit.diagnoses}</p>
                              </div>
                            )}

                            {newVisit.treatments && (
                              <div className="p-3 bg-teal-50 rounded-lg border-l-4 border-teal-500">
                                <p className="text-xs font-bold text-teal-900 mb-1">💉 TREATMENTS PROVIDED</p>
                                <p className="text-sm text-teal-900">{newVisit.treatments}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl p-6 mb-6">
                    <p className="text-gray-600 text-center">No existing medical conditions found for this patient.</p>
                  </div>
                )}

                {/* Color Picker */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Prescription Theme Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { name: 'Purple', color: '#8b5cf6' },
                      { name: 'Blue', color: '#3b82f6' },
                      { name: 'Green', color: '#10b981' },
                      { name: 'Teal', color: '#14b8a6' },
                      { name: 'Pink', color: '#ec4899' },
                      { name: 'Indigo', color: '#6366f1' }
                    ].map((theme) => (
                      <motion.button
                        key={theme.name}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPrescriptionColor(theme.color)}
                        className={`w-16 h-16 rounded-xl transition-all ${ 
                          prescriptionColor === theme.color 
                            ? 'ring-4 ring-offset-2 shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        style={{ 
                          backgroundColor: theme.color,
                          ringColor: theme.color
                        }}
                        title={theme.name}
                      >
                        {prescriptionColor === theme.color && (
                          <span className="text-white text-2xl">✓</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Structured Medication Builder */}
                <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                      <span>💊</span>
                      Medication Builder (with categories)
                    </h3>
                    {editingMedicationIndex !== null && (
                      <span className="text-xs font-semibold text-amber-700">Editing item #{editingMedicationIndex + 1}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      value={medicationForm.name}
                      onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                      placeholder="Medication name"
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                    />
                    <input
                      type="text"
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                      placeholder="Dose (e.g., 500mg)"
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                    />
                    <input
                      type="text"
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                      placeholder="Frequency (e.g., TID after food)"
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <select
                        value={medicationForm.category}
                        onChange={(e) => {
                          const category = e.target.value;
                          const subCats = medicationCategories[category] || [];
                          setMedicationForm({
                            ...medicationForm,
                            category,
                            subCategory: subCats[0] || ""
                          });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="">Select Category</option>
                        {Object.keys(medicationCategories).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={medicationForm.subCategory}
                        onChange={(e) => setMedicationForm({ ...medicationForm, subCategory: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="">Select Sub-category</option>
                        {(medicationCategories[medicationForm.category] || []).map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={medicationForm.duration}
                      onChange={(e) => setMedicationForm({ ...medicationForm, duration: e.target.value })}
                      placeholder="Duration (e.g., 5 days)"
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mb-3">
                    <input
                      type="text"
                      value={medicationForm.instructions}
                      onChange={(e) => setMedicationForm({ ...medicationForm, instructions: e.target.value })}
                      placeholder="Special instructions"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMedicationForm(emptyMedicationForm);
                          setEditingMedicationIndex(null);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold border"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg text-sm font-semibold shadow"
                      >
                        {editingMedicationIndex !== null ? "Update medication" : "Add medication"}
                      </button>
                    </div>
                  </div>

                  {medications.length > 0 && (
                    <div className="space-y-2">
                      {medications.map((med, idx) => (
                        <div
                          key={`${med.name}-${idx}`}
                          className="bg-white border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-sm"
                        >
                          <div className="text-sm text-slate-800">
                            <p className="font-bold">{idx + 1}. {med.name} {med.dosage && `(${med.dosage})`}</p>
                            <p className="text-xs text-slate-600">
                              {med.frequency || "As directed"}{med.duration && ` • ${med.duration}`}{med.category && ` • ${med.category}${med.subCategory ? `/${med.subCategory}` : ""}`}
                            </p>
                            {med.instructions && (
                              <p className="text-xs text-slate-500">{med.instructions}</p>
                            )}
                          </div>
                          <div className="flex gap-2 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => handleEditMedication(idx)}
                              className="px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedication(idx)}
                              className="px-3 py-1 rounded bg-rose-100 text-rose-700 border border-rose-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <p className="text-[11px] text-slate-500">All medications will appear in print/export and will be prefixed in the saved prescription text.</p>
                    </div>
                  )}
                </div>

                {/* Prescription Text Area */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Prescription Details
                  </label>
                  <textarea
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                    placeholder="Enter prescription details here...&#10;&#10;Example:&#10;Rx&#10;1. Amoxicillin 500mg - Take 1 capsule three times daily for 7 days&#10;2. Ibuprofen 400mg - Take as needed for pain, every 6-8 hours&#10;3. Chlorhexidine mouthwash 0.2% - Rinse twice daily after brushing&#10;&#10;Instructions: Avoid hard foods, maintain oral hygiene"
                    rows="10"
                    className="w-full h-64 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:outline-none resize-none font-mono text-sm"
                    style={{ 
                      borderColor: `${prescriptionColor}40`,
                      focusRing: prescriptionColor
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    This prescription will be saved with the patient's visit information.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                  {/* Primary Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        console.group('%c🖨️ PRINT BUTTON CLICKED (Patients Page)', 'color: red; font-weight: bold; font-size: 16px');
                        console.log('%c📋 Print Preparation Data:', 'color: blue; font-weight: bold');
                        console.log('Medications count:', medications.length);
                        console.log('Medications:', medications);
                        console.log('Patient:', selectedPatientForVisit);
                        console.log('Prescription text length:', prescriptionText?.length || 0);
                        
                        // Print functionality - excludes medical conditions
                        const medsBlock = medications.length ? serializeMedications(medications) : "";
                        const medsTable = medications.length ? `
                              <table class="med-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Medication</th>
                                    <th>Plan</th>
                                    <th>Category</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${medications.map((med, idx) => `
                                    <tr>
                                      <td>${idx + 1}</td>
                                      <td>${med.name}${med.dosage ? ` (${med.dosage})` : ''}</td>
                                      <td>${med.frequency || 'As directed'}${med.duration ? ` for ${med.duration}` : ''}${med.instructions ? `<br/><span class="note">${med.instructions}</span>` : ''}</td>
                                      <td>${med.category || ''}${med.subCategory ? ` / ${med.subCategory}` : ''}</td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>
                        ` : '';
                        const combinedPrescription = [medsBlock, prescriptionText || "No prescription provided"].filter(Boolean).join("\n\nNotes:\n");
                        
                        console.log('%c📦 Content Preparation:', 'color: green; font-weight: bold');
                        console.log('medsTable HTML length:', medsTable.length);
                        console.log('combinedPrescription length:', combinedPrescription.length);
                        
                        const printWindow = window.open('', '_blank');
                        
                        console.log('%c🪟 Print Window Status:', 'color: purple; font-weight: bold');
                        console.log('Window opened:', !!printWindow);
                        if (!printWindow) {
                          console.error('❌ BLOCKED: Print window could not be opened. Check popup blocker!');
                        }
                        
                        const prescriptionContent = `
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Prescription - ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}</title>
                              <style>
                                * { font-family: Arial, sans-serif; }
                                body { margin: 0; padding: 16px; background: white; }
                                .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 16px; margin-bottom: 16px; }
                                .header h1 { margin: 0; font-size: 20px; }
                                .header p { margin: 4px 0; font-size: 12px; color: #666; }
                                .section { margin: 20px 0; }
                                .section-title { font-weight: bold; font-size: 14px; border-bottom: 2px solid #999; padding-bottom: 4px; margin-bottom: 8px; }
                                .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
                                .info-item { display: flex; }
                                .info-label { font-weight: bold; width: 120px; }
                                .med-table {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin-bottom: 16px;
                                  font-size: 13px;
                                }
                                .med-table th, .med-table td {
                                  border: 1px solid #ddd;
                                  padding: 8px;
                                  text-align: left;
                                }
                                .med-table thead {
                                  background: ${prescriptionColor}15;
                                  color: #222;
                                }
                                .note { color: #555; font-style: italic; font-size: 12px; }
                                @media print {
                                  body { padding: 20px; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h1>MEDICAL PRESCRIPTION</h1>
                                <p><strong>${CURRENT_DOCTOR.name}</strong></p>
                                <p>${CURRENT_DOCTOR.specialization}</p>
                                <p>Reg. No: ${CURRENT_DOCTOR.registrationNumber}</p>
                                <p>Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>

                              <div class="section">
                                <div class="section-title">PATIENT INFORMATION</div>
                                <div class="patient-info">
                                  <div class="info-item">
                                    <span class="info-label">Name:</span>
                                    <span>${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}</span>
                                  </div>
                                  <div class="info-item">
                                    <span class="info-label">Patient ID:</span>
                                    <span>${selectedPatientForVisit?.patientId}</span>
                                  </div>
                                  <div class="info-item">
                                    <span class="info-label">Clinic ID:</span>
                                    <span>${selectedPatientForVisit?.clinicId}</span>
                                  </div>
                                  <div class="info-item">
                                    <span class="info-label">Visit Date:</span>
                                    <span>${newVisit.visitDate}</span>
                                  </div>
                                </div>
                              </div>

                              <div class="section">
                                <div class="section-title">PRESCRIPTION</div>
                                ${medsTable}
                                <div class="prescription-body">${combinedPrescription}</div>
                              </div>

                              <div class="footer">
                                <div class="signature">
                                  <div class="signature-line"></div>
                                  <p><strong>${CURRENT_DOCTOR.name}</strong></p>
                                  <p>${CURRENT_DOCTOR.specialization}</p>
                                  <p>Reg. No: ${CURRENT_DOCTOR.registrationNumber}</p>
                                </div>
                              </div>
                            </body>
                          </html>
                        `;
                        
                        console.log('%c📄 HTML Content:', 'color: orange; font-weight: bold');
                        console.log('Total HTML length:', prescriptionContent.length);
                        console.log('Content has patient name:', prescriptionContent.includes(selectedPatientForVisit?.patientFirstName));
                        console.log('Content has medications:', prescriptionContent.includes('med-table') && medications.length > 0);
                        
                        printWindow.document.write(prescriptionContent);
                        printWindow.document.close();
                        
                        console.log('%c🎯 Calling printWindow.focus() and printWindow.print()...', 'color: green; font-weight: bold');
                        printWindow.focus();
                        
                        setTimeout(() => {
                          console.log('%c📋 Executing print dialog...', 'color: green; font-weight: bold');
                          console.log('Window document ready:', printWindow.document.readyState);
                          console.log('Window document title:', printWindow.document.title);
                          printWindow.print();
                          console.log('%c✅ Print dialog executed', 'color: green; font-weight: bold');
                          console.groupEnd();
                        }, 250);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🖨️</span>
                      <span>Print</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          await new Promise(resolve => setTimeout(resolve, 100));
                          
                          const prescriptionElement = document.querySelector('.patient-visit-prescription-print-container');
                          if (!prescriptionElement) {
                            alert('❌ Could not find prescription template. Please try again.');
                            return;
                          }

                          const canvas = await html2canvas(prescriptionElement, {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                          });

                          const imgData = canvas.toDataURL('image/png');
                          const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4'
                          });

                          const imgWidth = 210;
                          const pageHeight = 295;
                          const imgHeight = (canvas.height * imgWidth) / canvas.width;
                          let heightLeft = imgHeight;
                          let position = 0;

                          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                          heightLeft -= pageHeight;

                          while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                          }

                          const patientName = selectedPatientForVisit?.patientFirstName || 'Patient';
                          const timestamp = new Date().toISOString().split('T')[0];
                          pdf.save(`Prescription_${patientName}_${timestamp}.pdf`);
                          
                          alert('✅ Prescription PDF downloaded successfully!');
                        } catch (error) {
                          console.error('Error generating PDF:', error);
                          alert('❌ Error generating PDF. Please try again.');
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📥</span>
                      <span>Download PDF</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Download as PDF simulation (would need actual PDF library in production)
                        const medsBlock = medications.length ? `Medications:\n${serializeMedications(medications)}\n\n` : "";
                        const prescriptionContent = `
MEDICAL PRESCRIPTION
${CURRENT_DOCTOR.name}
${CURRENT_DOCTOR.specialization}
Reg. No: ${CURRENT_DOCTOR.registrationNumber}
Date: ${new Date().toLocaleDateString('en-IN')}

PATIENT INFORMATION
Name: ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}
Patient ID: ${selectedPatientForVisit?.patientId}
Visit Date: ${newVisit.visitDate}

${medsBlock}PRESCRIPTION
${prescriptionText || 'No prescription provided'}

_______________________
${CURRENT_DOCTOR.name}
${CURRENT_DOCTOR.specialization}
Reg. No: ${CURRENT_DOCTOR.registrationNumber}
                        `;
                        
                        const blob = new Blob([prescriptionContent], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Prescription_${selectedPatientForVisit?.patientFirstName}_${new Date().toISOString().split('T')[0]}.txt`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📥</span>
                      <span>Download</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={sendingEmail || !selectedPatientForVisit?.patientEmail}
                      onClick={async () => {
                        try {
                          if (!selectedPatientForVisit?.patientEmail) {
                            alert("📧 Patient email not available. Please add email to patient profile.");
                            return;
                          }

                          setSendingEmail(true);
                          const medicationData = medications.map(m => ({
                            name: m.medicationName || m.name,
                            dosage: m.dosage,
                            frequency: m.frequency,
                            duration: m.duration || 'As prescribed',
                            instructions: m.instructions || ''
                          }));

                          // Get doctor name from multiple sources
                          const doctorName = CURRENT_DOCTOR?.name || selectedPatientForVisit?.doctorName || 'Dr. Physician';
                          const doctorId = CURRENT_DOCTOR?.doctorId || selectedPatientForVisit?.doctorId || '';
                          const clinicName = selectedPatientForVisit?.clinicName || CURRENT_DOCTOR?.clinic || 'Dental Clinic';

                          console.log('📧 Sending Email Details:', {
                            to: selectedPatientForVisit.patientEmail,
                            patient: `${selectedPatientForVisit.patientFirstName} ${selectedPatientForVisit.patientLastName}`,
                            doctorName,
                            doctorId,
                            clinicName,
                            medications: medicationData.length
                          });

                          await sendPrescriptionEmail(
                            selectedPatientForVisit.patientEmail,
                            `${selectedPatientForVisit.patientFirstName} ${selectedPatientForVisit.patientLastName}`,
                            doctorName,
                            medicationData,
                            clinicName,
                            doctorId
                          );

                          showCustomPopup('success', '📧 Email Sent!', '🎉 Prescription email delivered successfully! Your patient will find it waiting in their inbox.', '✨');
                          setSendingEmail(false);
                        } catch (error) {
                          console.error('Error sending email:', error);
                          showCustomPopup('error', '❌ Oops!', `Email delivery failed: ${error.message}`, '📧');
                          setSendingEmail(false);
                        }
                      }}
                      className={`px-6 py-3 text-white rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2 ${
                        sendingEmail || !selectedPatientForVisit?.patientEmail
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-lg'
                      }`}
                    >
                      <span className="text-xl">{sendingEmail ? '⏳' : '📧'}</span>
                      <span>{sendingEmail ? 'Sending...' : 'Email to Patient'}</span>
                    </motion.button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // SMS functionality simulation
                        if (selectedPatientForVisit?.patientPhone) {
                          const medsSnippet = medications.length ? serializeMedications(medications).split('\n')[0] : '';
                          const smsText = `Dear ${selectedPatientForVisit.patientFirstName}, your prescription from ${CURRENT_DOCTOR.name}: ${medsSnippet || prescriptionText.substring(0, 120)}... Visit our clinic for full details.`;
                          window.open(`sms:${selectedPatientForVisit.patientPhone}?body=${encodeURIComponent(smsText)}`, '_blank');
                        } else {
                          alert("📱 Patient phone number not available.");
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📱</span>
                      <span>Send via SMS</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // WhatsApp share
                        const medsBlock = medications.length ? `Medications:\n${serializeMedications(medications)}\n\n` : "";
                        const whatsappText = `*Medical Prescription*\n\nFrom: ${CURRENT_DOCTOR.name}\nReg. No: ${CURRENT_DOCTOR.registrationNumber}\n\nPatient: ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}\n\n${medsBlock}*Prescription:*\n${prescriptionText}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">💬</span>
                      <span>Share via WhatsApp</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Copy to clipboard
                        const medsBlock = medications.length ? `Medications:\n${serializeMedications(medications)}\n\n` : "";
                        const prescriptionFull = `MEDICAL PRESCRIPTION\n\n${CURRENT_DOCTOR.name}\n${CURRENT_DOCTOR.specialization}\nReg. No: ${CURRENT_DOCTOR.registrationNumber}\n\nPatient: ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}\nPatient ID: ${selectedPatientForVisit?.patientId}\nDate: ${newVisit.visitDate}\n\n${medsBlock}PRESCRIPTION:\n${prescriptionText}`;
                        navigator.clipboard.writeText(prescriptionFull);
                        alert("✅ Prescription copied to clipboard!");
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📋</span>
                      <span>Copy to Clipboard</span>
                    </motion.button>
                  </div>

                  {/* Printable Prescription Container - Hidden from view but used for PDF generation */}
                  <div className="patient-visit-prescription-print-container hidden" style={{ background: 'white', padding: '40px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #1f2937', paddingBottom: '20px' }}>
                      <div>MEDICAL PRESCRIPTION</div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                      <div style={{ borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>DOCTOR INFORMATION</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{CURRENT_DOCTOR.name}</div>
                        <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>{CURRENT_DOCTOR.specialization}</div>
                        <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '20px' }}>Reg. No: {CURRENT_DOCTOR.registrationNumber}</div>
                      </div>
                      
                      <div style={{ paddingLeft: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>PATIENT INFORMATION</div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Name:</strong> {selectedPatientForVisit?.patientFirstName} {selectedPatientForVisit?.patientLastName}</div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Patient ID:</strong> {selectedPatientForVisit?.patientId}</div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Visit Date:</strong> {newVisit.visitDate}</div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Date of Issue:</strong> {new Date().toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>

                    {medications.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', paddingBottom: '10px', borderBottom: '2px solid #dbeafe' }}>PRESCRIBED MEDICATIONS</div>
                        <div style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 120px', gap: '12px', padding: '12px', backgroundColor: '#1f2937', color: 'white', fontWeight: 'bold', fontSize: '12px', marginBottom: '0' }}>
                            <div>#</div>
                            <div>Medication Name</div>
                            <div>Dosage</div>
                            <div>Frequency</div>
                            <div>Duration</div>
                          </div>
                          {medications.map((med, idx) => (
                            <div key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 120px', gap: '12px', padding: '12px', fontSize: '12px', backgroundColor: idx % 2 === 0 ? '#fce7f3' : 'white' }}>
                                <div style={{ fontWeight: 'bold', color: '#be123c' }}>{idx + 1}</div>
                                <div style={{ fontWeight: 'bold', color: '#111827' }}>{med.name || med.medicationName || 'N/A'}</div>
                                <div style={{ color: '#374151' }}>{med.dosage || '-'}</div>
                                <div style={{ color: '#374151' }}>{med.frequency || '-'}</div>
                                <div style={{ color: '#374151' }}>{med.duration || '-'}</div>
                              </div>
                              {(med.instructions || med.specialInstructions) && (
                                <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', borderBottom: '1px solid #fcd34d', fontSize: '11px' }}>
                                  <span style={{ fontWeight: 'bold', color: '#92400e' }}>⚠️ Special Instructions: </span>
                                  <span style={{ color: '#78350f' }}>{med.instructions || med.specialInstructions}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prescriptionText && (
                      <div style={{ marginBottom: '30px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', paddingBottom: '10px', borderBottom: '2px solid #dbeafe' }}>PRESCRIPTION NOTES</div>
                        <div style={{ fontSize: '12px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{prescriptionText}</div>
                      </div>
                    )}

                    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #1f2937', textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', marginBottom: '50px', marginRight: '20px' }}>Authorized by:</div>
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>{CURRENT_DOCTOR.name}</strong></div>
                      <div style={{ fontSize: '11px', color: '#4b5563' }}>{CURRENT_DOCTOR.specialization}</div>
                      <div style={{ fontSize: '11px', color: '#4b5563' }}>Reg. No: {CURRENT_DOCTOR.registrationNumber}</div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowPrescriptionModal(false);
                        setPrescriptionText("");
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      ❌ Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Save prescription to visit and keep modal open for more actions
                        const medsBlock = medications.length ? `Medications:\n${serializeMedications(medications)}` : "";
                        const combinedPrescription = [medsBlock, prescriptionText].filter(Boolean).join("\n\nNotes:\n");
                        setNewVisit({ ...newVisit, prescriptions: combinedPrescription });
                        alert("✅ Prescription saved to visit information!");
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      💾 Save to Visit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Save and close
                        const medsBlock = medications.length ? `Medications:\n${serializeMedications(medications)}` : "";
                        const combinedPrescription = [medsBlock, prescriptionText].filter(Boolean).join("\n\nNotes:\n");
                        setNewVisit({ ...newVisit, prescriptions: combinedPrescription });
                        setShowPrescriptionModal(false);
                        alert("✅ Prescription saved successfully!");
                      }}
                      className="flex-1 px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-white"
                      style={{ 
                        background: `linear-gradient(135deg, ${prescriptionColor}, ${prescriptionColor}dd)`
                      }}
                    >
                      ✅ Save & Close
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Patients Modal */}
      <AnimatePresence>
        {showViewPatientsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowViewPatientsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-[95vh] max-w-[98vw] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowViewPatientsModal(false)}
                className="absolute top-6 right-6 z-50 w-12 h-12 bg-white hover:bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* ViewPatients Component */}
              <div className="h-full overflow-y-auto">
                <ViewPatients />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showNewAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowNewAppointmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              {/* Header with Calendar Navigation Button */}
              <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                      📅
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">Book New Appointment</h3>
                      <p className="text-cyan-100">Schedule a patient appointment</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowNewAppointmentModal(false);
                      navigate('/calendar');
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>📆</span>
                    <span>Full Calendar</span>
                  </motion.button>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNewAppointmentModal(false)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Form */}
              <div className="p-8 max-h-[90vh] overflow-y-auto space-y-6">
                
                {/* Search Section */}
                {!searchedPatient && !bookingWithoutRegistration && (
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                      <span>🔍</span> Search Patient
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Patient ID</label>
                        <input
                          type="text"
                          placeholder="Enter patient ID..."
                          value={patientSearchForm.patientId}
                          onChange={(e) => { setPatientSearchForm({ ...patientSearchForm, patientId: e.target.value }); setPatientSearchResults([]); setPatientNotFound(false); }}
                          className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                        <input
                          type="text"
                          placeholder="Enter mobile number..."
                          value={patientSearchForm.mobileNumber}
                          onChange={(e) => { setPatientSearchForm({ ...patientSearchForm, mobileNumber: e.target.value }); setPatientSearchResults([]); setPatientNotFound(false); }}
                          className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                        <input
                          type="text"
                          placeholder="Enter first name..."
                          value={patientSearchForm.firstName}
                          onChange={(e) => { setPatientSearchForm({ ...patientSearchForm, firstName: e.target.value }); setPatientSearchResults([]); setPatientNotFound(false); }}
                          className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          placeholder="Enter last name..."
                          value={patientSearchForm.lastName}
                          onChange={(e) => { setPatientSearchForm({ ...patientSearchForm, lastName: e.target.value }); setPatientSearchResults([]); setPatientNotFound(false); }}
                          className="w-full px-4 py-2 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Multiple results dropdown */}
                    {patientSearchResults.length > 1 && (
                      <div className="mb-4 border-2 border-blue-300 rounded-xl overflow-hidden bg-white shadow-lg">
                        <div className="px-4 py-2 bg-blue-100 border-b border-blue-200">
                          <p className="text-sm font-bold text-blue-800">
                            {patientSearchResults.length} patients found — select the correct one:
                          </p>
                        </div>
                        <ul className="divide-y divide-blue-100 max-h-48 overflow-y-auto">
                          {patientSearchResults.map((p) => {
                            const dob = p.patientDOB || p.dateOfBirth;
                            const age = dob
                              ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))
                              : null;
                            return (
                              <li
                                key={p.patientId}
                                onClick={() => {
                                  setSearchedPatient(p);
                                  setPatientSearchResults([]);
                                  setAppointmentForm({
                                    ...appointmentForm,
                                    firstName: p.patientFirstName || '',
                                    lastName: p.patientLastName || '',
                                    phoneNumber: normalizeIndianPhoneDigits(p.patientPhone || ''),
                                    email: p.patientEmail || ''
                                  });
                                }}
                                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                                    {(p.patientFirstName || '?')[0].toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-slate-800">
                                    {p.patientFirstName} {p.patientLastName}
                                    {age !== null && <span className="text-slate-500 font-normal"> ({age} yrs)</span>}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                  ID: {p.patientId}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        whileHover={patientSearchForm.patientId.trim() || patientSearchForm.mobileNumber.trim() || patientSearchForm.firstName.trim() || patientSearchForm.lastName.trim() ? { scale: 1.05 } : {}}
                        whileTap={patientSearchForm.patientId.trim() || patientSearchForm.mobileNumber.trim() || patientSearchForm.firstName.trim() || patientSearchForm.lastName.trim() ? { scale: 0.95 } : {}}
                        disabled={!patientSearchForm.patientId.trim() && !patientSearchForm.mobileNumber.trim() && !patientSearchForm.firstName.trim() && !patientSearchForm.lastName.trim()}
                        onClick={async () => {
                          setPatientSearchResults([]);
                          setPatientNotFound(false);
                          try {
                            const selectedAccessStr = localStorage.getItem('selectedAccess');
                            const selectedAccess = selectedAccessStr ? JSON.parse(selectedAccessStr) : null;

                            if (!selectedAccess || !selectedAccess.enterpriseId || !selectedAccess.clinicId) {
                              alert('❌ Session error: Please login again to get clinic information.');
                              return;
                            }

                            const searchParams = { clinicId: selectedAccess.clinicId };
                            if (patientSearchForm.patientId.trim()) searchParams.patientId = Number(patientSearchForm.patientId);
                            if (patientSearchForm.mobileNumber.trim()) searchParams.mobilenumber = patientSearchForm.mobileNumber;
                            if (patientSearchForm.firstName.trim()) searchParams.firstName = patientSearchForm.firstName;
                            if (patientSearchForm.lastName.trim()) searchParams.lastName = patientSearchForm.lastName;

                            const results = await searchPatients(searchParams);

                            if (results && results.length === 1) {
                              setSearchedPatient(results[0]);
                              setAppointmentForm({
                                ...appointmentForm,
                                firstName: results[0].patientFirstName || '',
                                lastName: results[0].patientLastName || '',
                                phoneNumber: normalizeIndianPhoneDigits(results[0].patientPhone || ''),
                                email: results[0].patientEmail || ''
                              });
                            } else if (results && results.length > 1) {
                              setPatientSearchResults(results);
                            } else {
                              setPatientNotFound(true);
                            }
                          } catch (error) {
                            console.error('Search error:', error);
                            alert('❌ Error searching for patient');
                          }
                        }}
                        className={`flex-1 px-6 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                          patientSearchForm.patientId.trim() || patientSearchForm.mobileNumber.trim() || patientSearchForm.firstName.trim() || patientSearchForm.lastName.trim()
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span>🔍</span>
                        <span>Search Patient</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setBookingWithoutRegistration(true);
                          setPatientSearchForm({ clinicId: "", patientId: "", firstName: "", lastName: "", mobileNumber: "" });
                          setPatientSearchResults([]);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <span>🚶</span>
                        <span>Walk-In</span>
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* No Results Found - Show Options */}
                {patientNotFound && !searchedPatient && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-rose-50 border-2 border-rose-300 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">❌</span>
                      <h4 className="font-bold text-rose-700">No Patient Found</h4>
                    </div>
                    <p className="text-sm text-rose-600 mb-4">
                      We couldn't find a patient with that name. Would you like to:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setPatientNotFound(false);
                          setBookingWithoutRegistration(true);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <span>🚶</span>
                        <span>Book Walk-In Appointment</span>
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowNewAppointmentModal(false);
                          setActiveView('register');
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <span>➕</span>
                        <span>Register New Patient</span>
                      </motion.button>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setPatientNotFound(false);
                        document.getElementById('patientFirstNameSearch').value = '';
                        document.getElementById('patientLastNameSearch').value = '';
                      }}
                      className="w-full mt-3 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all"
                    >
                      Back to Search
                    </motion.button>
                  </motion.div>
                )}

                {/* Searched Patient Info */}
                {searchedPatient && !patientNotFound && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">✅</span>
                        <div>
                          <p className="font-bold text-emerald-700">Patient Found</p>
                          <p className="text-sm text-emerald-600">
                            {searchedPatient.patientFirstName} {searchedPatient.patientLastName} • ID: {searchedPatient.patientId}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        onClick={() => {
                          setSearchedPatient(null);
                          document.getElementById('patientFirstNameSearch').value = '';
                          document.getElementById('patientLastNameSearch').value = '';
                        }}
                        className="px-4 py-2 bg-emerald-200 hover:bg-emerald-300 text-emerald-700 rounded-lg text-sm font-bold transition-all"
                      >
                        Search Again
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Walk-In Mode Indicator */}
                {bookingWithoutRegistration && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🚶</span>
                        <div>
                          <p className="font-bold text-amber-700">Walk-In Appointment Mode</p>
                          <p className="text-sm text-amber-600">Enter patient details below</p>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        onClick={() => {
                          setBookingWithoutRegistration(false);
                          setPatientNotFound(false);
                          document.getElementById('patientFirstNameSearch').value = '';
                          document.getElementById('patientLastNameSearch').value = '';
                        }}
                        className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-700 rounded-lg text-sm font-bold transition-all"
                      >
                        Back
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <form ref={appointmentBookingFormRef} onSubmit={async (e) => {
                  e.preventDefault();
                  
                  try {
                    // Get clinic ID and enterprise ID from selectedAccess (token payload)
                    const selectedAccessStr = localStorage.getItem('selectedAccess');
                    const selectedAccess = selectedAccessStr ? JSON.parse(selectedAccessStr) : null;
                    
                    if (!selectedAccess || !selectedAccess.enterpriseId || !selectedAccess.clinicId) {
                      alert('❌ Session error: Please login again to get the required clinic and enterprise information.');
                      return;
                    }
                    
                    const clinicId = selectedAccess.clinicId;
                    const enterpriseId = selectedAccess.enterpriseId;
                    const userId = localStorage.getItem('userId');
                    
                    // Convert time format from HH:mm to HH:mm:ss for TimeSpan
                    const startTimeSpan = appointmentForm.startTime ? `${appointmentForm.startTime}:00` : null;
                    const endTimeSpan = appointmentForm.endTime ? `${appointmentForm.endTime}:00` : null;

                    if (appointmentForm.startTime && appointmentForm.endTime && appointmentForm.startTime === appointmentForm.endTime) {
                      alert('❌ Start Time and End Time cannot be the same. Please choose a different time.');
                      return;
                    }

                    if (appointmentForm.doctorId) {
                      const conflictCheckResponse = await getDoctorAppointmentsWithCount({
                        clinicId,
                        doctorId: String(appointmentForm.doctorId),
                        appointmentDate: appointmentForm.date,
                        startTime: startTimeSpan,
                        endTime: endTimeSpan
                      });

                      const appointmentCount = Number(
                        conflictCheckResponse?.appointmentsCount ??
                        conflictCheckResponse?.appointmentCount ??
                        conflictCheckResponse?.count ??
                        conflictCheckResponse?.data?.appointmentsCount ??
                        conflictCheckResponse?.data?.appointmentCount ??
                        conflictCheckResponse?.data?.count ??
                        (typeof conflictCheckResponse === 'number' ? conflictCheckResponse : 0)
                      );

                      if (appointmentCount > 0 && !allowConflictBooking) {
                        setBookingConflictCount(appointmentCount);
                        setShowBookingConflictMessage(true);
                        return;
                      }
                    }

                    setShowBookingConflictMessage(false);
                    setBookingConflictCount(0);
                    setAllowConflictBooking(false);
                    
                    // Calculate duration in minutes if both times are provided and not manually entered
                    let durationMinutes = appointmentForm.durationMinutes || null;
                    if (!durationMinutes && appointmentForm.startTime && appointmentForm.endTime) {
                      const [startHour, startMin] = appointmentForm.startTime.split(':').map(Number);
                      const [endHour, endMin] = appointmentForm.endTime.split(':').map(Number);
                      durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                    }
                    
                    // Build appointment model matching backend AppointmentsModel
                    const appointmentPayload = {
                      // References - from token payload (selectedAccess)
                      enterpriseId: enterpriseId,
                      clinicId: clinicId,
                      patientId: searchedPatient ? searchedPatient.patientId : null, // null for walk-in/non-registered
                      doctorId: appointmentForm.doctorId && appointmentForm.doctorId !== "" ? String(appointmentForm.doctorId) : null,
                      attendingPhysician: appointmentForm.attendingPhysician || null,
                      // Patient details (stored in appointments row)
                      firstName: appointmentForm.firstName || null,
                      lastName: appointmentForm.lastName || null,
                      phoneNumber: appointmentForm.phoneNumber || null,
                      email: appointmentForm.email || null,
                      // Scheduling
                      appointmentDate: appointmentForm.date,
                      startTime: startTimeSpan,
                      endTime: endTimeSpan,
                      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
                      // Details
                      appointmentType: appointmentForm.appointmentType || "Consultation",
                      reasonForVisit: appointmentForm.reasonForVisit || "",
                      notes: appointmentForm.notes || "",
                      telehealthLink: appointmentForm.telehealthLink || null,
                      // Audit
                      createdBy: userId ? parseInt(userId) : null
                    };
                    
                    console.log("📋 Appointment Payload:", appointmentPayload);
                    
                    // Call API
                    const result = await createAppointment(appointmentPayload);
                    
                    // Store appointment data and show success modal
                    setCreatedAppointment({
                      ...result,
                      firstName: appointmentForm.firstName,
                      lastName: appointmentForm.lastName,
                      phoneNumber: appointmentForm.phoneNumber,
                      email: appointmentForm.email
                    });
                    setShowNewAppointmentModal(false);
                    setShowAppointmentSuccessModal(true);
                    setAppointmentForm({
                      firstName: "",
                      lastName: "",
                      phoneNumber: "",
                      email: "",
                      date: "",
                      startTime: "",
                      endTime: "",
                      durationMinutes: "",
                      appointmentType: "",
                      reasonForVisit: "",
                      notes: "",
                      telehealthLink: "",
                      attendingPhysician: "",
                      doctorId: ""
                    });
                    setPatientSearchForm({
                      clinicId: "",
                      patientId: "",
                      firstName: "",
                      lastName: "",
                      mobileNumber: ""
                    });
                    setSearchedPatient(null);
                    setPatientNotFound(false);
                    setBookingWithoutRegistration(false);
                    setShowBookingConflictMessage(false);
                    setBookingConflictCount(0);
                    setAllowConflictBooking(false);
                  } catch (error) {
                    console.error('Failed to create appointment:', error);
                    alert('❌ Failed to book appointment. Please try again.');
                  }
                }} className="space-y-6">
                  {/* Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>👤</span> First Name * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        readOnly={searchedPatient ? true : false}
                        value={appointmentForm.firstName}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, firstName: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : searchedPatient ? 'border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>👤</span> Last Name * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        readOnly={searchedPatient ? true : false}
                        value={appointmentForm.lastName}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, lastName: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : searchedPatient ? 'border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Walk-in patient fields: DOB and Age */}
                  {bookingWithoutRegistration && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div>
                        <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
                          <span>🎂</span> Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          value={appointmentForm.dateOfBirth}
                          onChange={(e) => {
                            const dob = e.target.value;
                            if (!isYearLengthValid(dob)) return;
                            setAppointmentForm({ ...appointmentForm, dateOfBirth: dob });
                            // Calculate age
                            if (dob) {
                              const birth = new Date(dob);
                              const today = new Date();
                              let age = today.getFullYear() - birth.getFullYear();
                              const monthDiff = today.getMonth() - birth.getMonth();
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                age--;
                              }
                              setAppointmentForm(prev => ({ ...prev, age: age.toString() }));
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-slate-700">
                          <span>📊</span> Age (Auto-calculated)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={appointmentForm.age}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-700"
                          placeholder="Auto-calculated from DOB"
                        />
                      </div>
                    </div>
                  )}



                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>📞</span> Phone Number * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <div className={`flex rounded-xl border-2 overflow-hidden transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 cursor-not-allowed' : appointmentPhoneError ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-100' : 'border-cyan-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100'}`}>
                        <span className={`flex items-center px-3 font-semibold text-sm border-r-2 select-none ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 text-gray-400 bg-gray-100' : appointmentPhoneError ? 'border-red-300 text-red-500 bg-red-50' : 'border-cyan-200 text-cyan-700 bg-cyan-50'}`}>+91</span>
                        <input
                          type="tel"
                          required
                          disabled={!searchedPatient && !bookingWithoutRegistration}
                          value={appointmentForm.phoneNumber}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setAppointmentForm({ ...appointmentForm, phoneNumber: digits });
                            if (digits.length > 0 && digits.length < 10) {
                              setAppointmentPhoneError('Enter exactly 10 digits');
                            } else {
                              setAppointmentPhoneError('');
                            }
                          }}
                          onBlur={() => {
                            if (appointmentForm.phoneNumber && appointmentForm.phoneNumber.length !== 10) {
                              setAppointmentPhoneError('Phone number must be exactly 10 digits');
                            }
                          }}
                          inputMode="numeric"
                          maxLength={10}
                          className={`flex-1 px-3 py-3 outline-none text-sm ${!searchedPatient && !bookingWithoutRegistration ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-slate-800'}`}
                          placeholder="9876543210"
                        />
                        {appointmentForm.phoneNumber.length > 0 && (
                          <span className={`flex items-center pr-3 text-xs font-bold ${appointmentForm.phoneNumber.length === 10 ? 'text-green-500' : 'text-red-400'}`}>
                            {appointmentForm.phoneNumber.length}/10
                          </span>
                        )}
                      </div>
                      {appointmentPhoneError && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <span>⚠️</span> {appointmentPhoneError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>📧</span> Email Address {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="email"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.email}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="patient@email.com"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>📅</span> Date * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="date"
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        min={new Date().toISOString().split('T')[0]}
                        value={appointmentForm.date}
                        onChange={(e) => {
                          const appointmentDate = e.target.value;
                          if (!isYearLengthValid(appointmentDate)) return;
                          setAppointmentForm({ ...appointmentForm, date: appointmentDate });
                        }}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>⏰</span> Start Time * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <select
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.startTime}
                        onChange={(e) => {
                          const newStartTime = e.target.value;
                          if (newStartTime && appointmentForm.endTime && newStartTime === appointmentForm.endTime) {
                            return;
                          }
                          let calculatedDuration = appointmentForm.durationMinutes;
                          
                          // Auto-calculate duration if end time is set
                          if (newStartTime && appointmentForm.endTime) {
                            const [startHour, startMin] = newStartTime.split(':').map(Number);
                            const [endHour, endMin] = appointmentForm.endTime.split(':').map(Number);
                            calculatedDuration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                          }
                          
                          setAppointmentForm({ ...appointmentForm, startTime: newStartTime, durationMinutes: calculatedDuration });
                        }}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      >
                        <option value="">Select time</option>
                        {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map(time => (
                          <option key={time} value={time} disabled={appointmentForm.endTime === time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>⏰</span> End Time * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <select
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.endTime}
                        onChange={(e) => {
                          const newEndTime = e.target.value;
                          if (appointmentForm.startTime && newEndTime && appointmentForm.startTime === newEndTime) {
                            return;
                          }
                          let calculatedDuration = appointmentForm.durationMinutes;
                          
                          // Auto-calculate duration if start time is set
                          if (appointmentForm.startTime && newEndTime) {
                            const [startHour, startMin] = appointmentForm.startTime.split(':').map(Number);
                            const [endHour, endMin] = newEndTime.split(':').map(Number);
                            calculatedDuration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                          }
                          
                          setAppointmentForm({ ...appointmentForm, endTime: newEndTime, durationMinutes: calculatedDuration });
                        }}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      >
                        <option value="">Select time</option>
                        {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map(time => (
                          <option key={time} value={time} disabled={appointmentForm.startTime === time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Appointment Type & Doctor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>🦷</span> Appointment Type * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <select
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.appointmentType}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentType: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      >
                        <option value="">Select type</option>
                        {appointmentTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        {appointmentForm.appointmentType && !appointmentTypeOptions.includes(appointmentForm.appointmentType) && (
                          <option value={appointmentForm.appointmentType}>{appointmentForm.appointmentType} (current)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Attending Physician */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                      <span>🩺</span> Attending Physician {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                    </label>
                    <select
                      disabled={!searchedPatient && !bookingWithoutRegistration}
                      value={appointmentForm.doctorId?.toString() || ""}
                      onChange={(e) => {
                        const selectedDocIdStr = e.target.value;
                        const selectedDoc = appointmentDoctors.find(doc => {
                          const docId = doc.doctorId || doc.id;
                          return docId ? docId.toString() === selectedDocIdStr : false;
                        });
                        if (selectedDoc) {
                          const doctorIdValue = selectedDoc.doctorId || selectedDoc.id;
                          const physicianName = selectedDoc.name || `${selectedDoc.firstName || ""} ${selectedDoc.lastName || ""}`.trim();
                          setAppointmentForm({ 
                            ...appointmentForm, 
                            doctorId: doctorIdValue,
                            attendingPhysician: physicianName
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                    >
                      <option value="">
                        {!searchedPatient && !bookingWithoutRegistration
                          ? "Select patient first"
                          : appointmentDoctorsLoading
                            ? "Loading doctors..."
                            : appointmentDoctors.length === 0
                              ? "No doctors available"
                              : "Select physician"}
                      </option>
                      {appointmentDoctors.map((doc) => {
                        const name = doc.name || doc.doctorName || `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || `Doctor ${doc.doctorId || doc.id}`;
                        const doctorId = doc.doctorId || doc.id;
                        return doctorId ? (
                          <option key={doctorId} value={doctorId.toString()}>
                            {name}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  {/* Duration (Auto-calculated) */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                      <span>⏱️</span> Duration (minutes) - Auto-calculated {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                    </label>
                    <input
                      type="number"
                      readOnly
                      disabled={!searchedPatient && !bookingWithoutRegistration}
                      value={appointmentForm.durationMinutes || ''}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed'}`}
                      placeholder="Select start and end time"
                    />
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                      <span>🩺</span> Reason for Visit {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                    </label>
                    <input
                      type="text"
                      disabled={!searchedPatient && !bookingWithoutRegistration}
                      value={appointmentForm.reasonForVisit}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reasonForVisit: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      placeholder="E.g., Tooth pain, Routine cleaning, Follow-up"
                    />
                  </div>



                  {/* Telehealth Link (only for Telehealth appointments) */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${(!searchedPatient && !bookingWithoutRegistration) || appointmentForm.appointmentType !== 'Telehealth' ? 'text-slate-400' : 'text-slate-700'}`}>
                      <span>🔗</span> Telehealth Link {appointmentForm.appointmentType !== 'Telehealth' && '(Only for Telehealth appointments)'} {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                    </label>
                    <input
                      type="url"
                      disabled={(!searchedPatient && !bookingWithoutRegistration) || appointmentForm.appointmentType !== 'Telehealth'}
                      value={appointmentForm.telehealthLink}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, telehealthLink: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${(!searchedPatient && !bookingWithoutRegistration) || appointmentForm.appointmentType !== 'Telehealth' ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      placeholder={appointmentForm.appointmentType === 'Telehealth' ? 'https://meet.example.com/...' : 'Select Telehealth appointment type'}
                    />
                  </div>



                  {/* Notes */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                      <span>📝</span> Additional Notes {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                    </label>
                    <textarea
                      disabled={!searchedPatient && !bookingWithoutRegistration}
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      placeholder="Any additional notes or special instructions..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      ✅ Book Appointment
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowNewAppointmentModal(false)}
                      className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>

                <AnimatePresence>
                  {showBookingConflictMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4"
                    >
                      <motion.div
                        initial={{ scale: 0.95, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-amber-200 p-6"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl">⚠️</div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-800">Booking Conflict</h4>
                            <p className="text-sm text-slate-600 mt-1">already there is booking for this time, do you want to continue booking</p>
                            <p className="text-sm text-amber-700 mt-2">Found {bookingConflictCount} existing appointment(s) for this doctor in the selected time range.</p>
                          </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setAllowConflictBooking(true);
                              setShowBookingConflictMessage(false);
                              setTimeout(() => {
                                appointmentBookingFormRef.current?.requestSubmit();
                              }, 0);
                            }}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold"
                          >
                            Yes, Continue Booking
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setAllowConflictBooking(false);
                              setShowBookingConflictMessage(false);
                            }}
                            className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-semibold"
                          >
                            No, Change Time
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Appointments Modal */}
      <AnimatePresence>
        {showViewAppointmentsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowViewAppointmentsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-[90vh] max-w-6xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowViewAppointmentsModal(false)}
                className="absolute top-6 right-6 z-50 w-12 h-12 bg-white hover:bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Appointments Content */}
              <div className="h-full overflow-y-auto p-8">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                    <span className="text-5xl">📅</span>
                    Appointments Overview
                  </h2>
                  <p className="text-slate-600 text-lg">View and manage all scheduled appointments</p>
                </motion.div>

                {/* Filter Section */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-lg mb-6"
                >
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>🔍</span>
                    Filter Appointments
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Clinic ID - Dropdown (Mandatory) */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>🏥</span> Clinic *
                      </label>
                      <select
                        required
                        value={appointmentFilter.clinicId}
                        onChange={(e) => setAppointmentFilter({ ...appointmentFilter, clinicId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all bg-white"
                      >
                        <option value="">Select Clinic</option>
                        {clinicList.map((clinic) => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            {clinic.clinicName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>👤</span> First Name
                      </label>
                      <input
                        type="text"
                        value={appointmentFilter.firstName}
                        onChange={(e) => setAppointmentFilter({ ...appointmentFilter, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="Patient's first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>👤</span> Last Name
                      </label>
                      <input
                        type="text"
                        value={appointmentFilter.lastName}
                        onChange={(e) => setAppointmentFilter({ ...appointmentFilter, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="Patient's last name"
                      />
                    </div>

                    {/* Doctor ID */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>👨‍⚕️</span> Doctor ID
                      </label>
                      <input
                        type="number"
                        value={appointmentFilter.doctorId}
                        onChange={(e) => setAppointmentFilter({ ...appointmentFilter, doctorId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="Doctor ID"
                      />
                    </div>

                    {/* Patient ID */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>🆔</span> Patient ID
                      </label>
                      <input
                        type="text"
                        value={appointmentFilter.patientId}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^\d]/g, '');
                          setAppointmentFilter({ ...appointmentFilter, patientId: value });
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Patient ID (numbers only)"
                        inputMode="numeric"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>📱</span> Mobile Number
                      </label>
                      <input
                        type="text"
                        value={appointmentFilter.mobilenumber}
                        onChange={(e) => {
                          // Only allow numbers and limit to 10 digits
                          const value = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                          setAppointmentFilter({ ...appointmentFilter, mobilenumber: value });
                          // Clear error when user starts typing
                          if (mobileNumberError) {
                            setMobileNumberError("");
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                          mobileNumberError ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100" : "border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        }`}
                        placeholder="Mobile number (exactly 10 digits)"
                        inputMode="numeric"
                        maxLength="10"
                      />
                      {mobileNumberError && (
                        <p className="text-sm text-red-600 mt-1">{mobileNumberError}</p>
                      )}
                    </div>

                    {/* From Date (Date Range Filter) */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>📅</span> From Date *
                      </label>
                      <input
                        type="date"
                        value={appointmentFilter.fromDate}
                        onChange={(e) => {
                          setAppointmentFilter({ ...appointmentFilter, fromDate: e.target.value });
                          setAppointmentDateValidationError("");
                          // Auto-clear To Date if it becomes invalid
                          if (appointmentFilter.toDate && new Date(e.target.value) > new Date(appointmentFilter.toDate)) {
                            setAppointmentFilter(prev => ({ ...prev, toDate: "" }));
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all font-medium"
                      />
                      <p className="text-xs text-purple-600 mt-1">✓ Default: Today</p>
                    </div>

                    {/* To Date (Date Range Filter) */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>📅</span> To Date <span className="text-purple-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={appointmentFilter.toDate}
                        onChange={(e) => {
                          setAppointmentFilter({ ...appointmentFilter, toDate: e.target.value });
                          setAppointmentDateValidationError("");
                        }}
                        min={appointmentFilter.fromDate}
                        disabled={!appointmentFilter.fromDate}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
                          !appointmentFilter.fromDate
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Date Validation Error */}
                  {appointmentDateValidationError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-semibold mb-4">
                      {appointmentDateValidationError}
                    </div>
                  )}

                  {/* Filter Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={filterAppointments}
                      disabled={!appointmentFilter.clinicId}
                      className={`flex-1 px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                        appointmentFilter.clinicId
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>🔍</span>
                      <span>Search Appointments</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetAppointmentFilters}
                      className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>🔄</span>
                      <span>Reset</span>
                    </motion.button>
                  </div>

                  {/* Info message */}
                  {!appointmentFilter.clinicId && (
                    <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Clinic ID is required to search appointments</span>
                    </p>
                  )}
                </motion.div>

                {/* Loading State */}
                {loadingAppointments && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading appointments...</p>
                  </div>
                )}

                {/* Results Summary */}
                {!loadingAppointments && filteredAppointmentsList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {filteredAppointmentsList.length}
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Search Results</p>
                        <p className="text-xs text-slate-500">
                          {filteredAppointmentsList.length} appointment{filteredAppointmentsList.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>🏥</span>
                      <span className="font-medium">Clinic ID: {appointmentFilter.clinicId}</span>
                    </div>
                  </motion.div>
                )}

                {/* Quick Filters Bar - Only visible when appointments exist */}
                {!loadingAppointments && filteredAppointmentsList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 bg-gradient-to-r from-slate-50 via-purple-50 to-blue-50 rounded-2xl p-5 border-2 border-purple-100 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🎯</span>
                      <h4 className="text-lg font-bold text-slate-800">Quick Filter</h4>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-300 via-pink-300 to-transparent ml-2"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                          <span>📊</span>
                          <span>Status</span>
                          {appointmentFilter.status !== 'All' && (
                            <span className="ml-auto px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full font-bold">
                              {appointmentFilter.status}
                            </span>
                          )}
                        </label>
                        <select
                          value={appointmentFilter.status}
                          onChange={(e) => setAppointmentFilter({ ...appointmentFilter, status: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all bg-white font-medium text-slate-800 hover:border-purple-400"
                        >
                          <option value="All">📋 All Statuses</option>
                          {distinctStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status === 'Scheduled' && '📅'} 
                              {status === 'Completed' && '✅'} 
                              {status === 'Cancelled' && '❌'} 
                              {' '}{status}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Appointment Type Filter */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                          <span>🦷</span>
                          <span>Appointment Type</span>
                          {appointmentFilter.appointmentType !== 'All' && (
                            <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                              {appointmentFilter.appointmentType}
                            </span>
                          )}
                        </label>
                        <select
                          value={appointmentFilter.appointmentType}
                          onChange={(e) => setAppointmentFilter({ ...appointmentFilter, appointmentType: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white font-medium text-slate-800 hover:border-blue-400"
                        >
                          <option value="All">🎯 All Types</option>
                          {distinctAppointmentTypes.map((type) => (
                            <option key={type} value={type}>
                              🦷 {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Active Filters Info */}
                    {(appointmentFilter.status !== 'All' || appointmentFilter.appointmentType !== 'All') && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-xs text-slate-600 flex items-center gap-2"
                      >
                        <span>✨</span>
                        <span>Showing {filteredAppointmentsList.length} result{filteredAppointmentsList.length !== 1 ? 's' : ''}</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Appointments Grid - Enhanced Design */}
                {!loadingAppointments && filteredAppointmentsList.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredAppointmentsList.map((appointment, index) => {
                      const colors = [
                        { name: 'emerald', from: 'from-emerald-400', to: 'to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
                        { name: 'rose', from: 'from-rose-400', to: 'to-rose-600', bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
                        { name: 'blue', from: 'from-blue-400', to: 'to-blue-600', bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
                        { name: 'amber', from: 'from-amber-400', to: 'to-amber-600', bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
                        { name: 'violet', from: 'from-violet-400', to: 'to-violet-600', bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-700' },
                        { name: 'cyan', from: 'from-cyan-400', to: 'to-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700' },
                        { name: 'pink', from: 'from-pink-400', to: 'to-pink-600', bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-700' },
                        { name: 'indigo', from: 'from-indigo-400', to: 'to-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' }
                      ];
                      const colorScheme = colors[index % colors.length];
                      const firstName = appointment.firstName;
                      const lastName = appointment.lastName;
                      const patientName = (firstName && lastName) ? `${firstName} ${lastName}` : 
                                         (firstName || lastName || 'Walk-in Patient');
                      const initials = (firstName && lastName) ? `${firstName[0]}${lastName[0]}`.toUpperCase() : 
                                      (firstName ? firstName[0].toUpperCase() : 'W');
                      const appointmentDate = new Date(appointment.appointmentDate);
                      const startTime = appointment.startTime ? appointment.startTime.substring(0, 5) : 'N/A';
                      const endTime = appointment.endTime ? appointment.endTime.substring(0, 5) : 'N/A';
                      const duration = appointment.durationMinutes || 
                                      (appointment.startTime && appointment.endTime ? 
                                        (() => {
                                          const [sh, sm] = appointment.startTime.split(':').map(Number);
                                          const [eh, em] = appointment.endTime.split(':').map(Number);
                                          return (eh * 60 + em) - (sh * 60 + sm);
                                        })() : 0);
                      
                      return (
                        <motion.div
                          key={appointment.appointmentId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.03, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                          onClick={() => setSelectedAppointmentDetails(appointment)}
                          className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer relative group`}
                        >
                          {/* Decorative top stripe */}
                          <div className={`h-2 bg-gradient-to-r ${colorScheme.from} ${colorScheme.to}`}></div>
                          
                          <div className="p-6">
                            {/* Header with Avatar and Status */}
                            <div className="flex items-start justify-between mb-5">
                              <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorScheme.from} ${colorScheme.to} flex items-center justify-center text-white font-bold text-2xl shadow-xl transform group-hover:scale-110 transition-transform`}>
                                  {initials}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-slate-800 mb-1">{patientName}</h3>
                                  <div className="flex flex-col gap-1 text-xs text-slate-600">
                                    {appointment.phoneNumber && (
                                      <div className="flex items-center gap-1">
                                        <span>📞</span>
                                        <span className="font-medium">{appointment.phoneNumber}</span>
                                      </div>
                                    )}
                                    {appointment.email && (
                                      <div className="flex items-center gap-1">
                                        <span>📧</span>
                                        <span className="font-medium truncate max-w-[180px]">{appointment.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md ${
                                appointment.status === 'Confirmed' || appointment.isConfirmed
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                              }`}>
                                {appointment.status === 'Confirmed' || appointment.isConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                              </span>
                            </div>

                            {/* Appointment Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">📅</span>
                                  <p className="text-xs text-slate-500 font-semibold">Date</p>
                                </div>
                                <p className="text-sm font-bold text-slate-800 ml-7">
                                  {appointmentDate.toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">⏰</span>
                                  <p className="text-xs text-slate-500 font-semibold">Time</p>
                                </div>
                                <p className="text-sm font-bold text-slate-800 ml-7">{startTime} - {endTime}</p>
                              </div>

                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">🦷</span>
                                  <p className="text-xs text-slate-500 font-semibold">Treatment</p>
                                </div>
                                <p className="text-sm font-bold text-slate-800 ml-7 truncate">
                                  {appointment.appointmentType || appointment.reasonForVisit || 'General'}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">⏱️</span>
                                  <p className="text-xs text-slate-500 font-semibold">Duration</p>
                                </div>
                                <p className="text-sm font-bold text-slate-800 ml-7">{duration} min</p>
                              </div>
                            </div>

                            {/* Appointment ID Footer */}
                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>🆔</span>
                                <span className="font-semibold">ID: #{appointment.appointmentId}</span>
                              </div>
                              <div className={`text-xs font-bold ${colorScheme.text} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                <span>Click for details</span>
                                <span>→</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!loadingAppointments && filteredAppointmentsList.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <div className="text-8xl mb-4">📅</div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">No Appointments Yet</h3>
                    <p className="text-slate-500 mb-6">Schedule your first appointment to get started</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowViewAppointmentsModal(false);
                        navigate('/calendar');
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      📅 Book New Appointment
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment Success Modal */}
      <AnimatePresence>
        {showAppointmentSuccessModal && createdAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setShowAppointmentSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Success Animation Header - Compact */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-4xl">✅</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-white"
                >
                  Appointment Booked!
                </motion.h2>
              </div>

              {/* Appointment Details - Compact */}
              <div className="p-5 space-y-3">
                {/* Row 1: ID & Patient */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">ID</p>
                    <p className="text-sm font-bold text-slate-800">#{createdAppointment.appointmentId}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Patient</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{createdAppointment.patientName || 'Walk-in'}</p>
                  </div>
                </div>

                {/* Row 2: Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">📅 Date</p>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(createdAppointment.appointmentDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">⏰ Time</p>
                    <p className="text-sm font-bold text-slate-800">
                      {createdAppointment.startTime?.substring(0, 5)} - {createdAppointment.endTime?.substring(0, 5)}
                    </p>
                  </div>
                </div>

                {/* Row 3: Type & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">🦷 Type</p>
                    <p className="text-sm font-bold text-slate-800">{createdAppointment.appointmentType || 'General'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">⏱️ Duration</p>
                    <p className="text-sm font-bold text-slate-800">{createdAppointment.durationMinutes || 0}m</p>
                  </div>
                </div>

                {/* Contact if available */}
                {createdAppointment.patientPhone && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">📞 Contact</p>
                    <p className="text-sm font-bold text-slate-800">{createdAppointment.patientPhone}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowAppointmentSuccessModal(false);
                      setShowViewAppointmentsModal(true);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    📅 View All
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAppointmentSuccessModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-lg font-bold shadow-sm hover:shadow-md transition-all"
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment Details Modal with Edit */}
      <AnimatePresence mode="wait">
        {selectedAppointmentDetails && (
          <motion.div
            key={`appointment-details-${selectedAppointmentDetails.appointmentId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
            onClick={handleCloseAppointmentDetails}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl shadow-2xl relative"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseAppointmentDetails}
                className="absolute top-6 right-6 z-50 w-12 h-12 bg-white hover:bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white sticky top-0 z-40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                      <span className="text-3xl">📋</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">
                        {isEditingAppointment ? 'Edit Appointment' : 'Appointment Details'}
                      </h2>
                      <p className="text-blue-100">ID: #{selectedAppointmentDetails.appointmentId}</p>
                    </div>
                  </div>
                  {!isEditingAppointment && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsEditingAppointment(true);
                        setEditAppointmentForm({
                          ...selectedAppointmentDetails,
                          date: selectedAppointmentDetails.appointmentDate?.split('T')[0] || '',
                          startTime: selectedAppointmentDetails.startTime?.substring(0, 5) || '',
                          endTime: selectedAppointmentDetails.endTime?.substring(0, 5) || '',
                          appointmentType: selectedAppointmentDetails.appointmentType || 'Consultation',
                          status: selectedAppointmentDetails.status || 'Scheduled',
                          paymentStatus: selectedAppointmentDetails.paymentStatus || 'Pending',
                          firstName: selectedAppointmentDetails.firstName || '',
                          lastName: selectedAppointmentDetails.lastName || '',
                          phoneNumber: selectedAppointmentDetails.phoneNumber || '',
                          email: selectedAppointmentDetails.email || '',
                          doctorId: selectedAppointmentDetails.doctorId || '',
                          reasonForVisit: selectedAppointmentDetails.reasonForVisit || '',
                          notes: selectedAppointmentDetails.notes || '',
                          roomNumber: selectedAppointmentDetails.roomNumber || '',
                          attendingPhysician: selectedAppointmentDetails.attendingPhysician || '',
                          telehealthLink: selectedAppointmentDetails.telehealthLink || '',
                          paidAmount: selectedAppointmentDetails.paidAmount || 0,
                          pendingAmount: selectedAppointmentDetails.pendingAmount || 0,
                          billableAmount: selectedAppointmentDetails.billableAmount || 0,
                          visitId: selectedAppointmentDetails.visitId || '',
                          clinicId: selectedAppointmentDetails.clinicId || '',
                          enterpriseId: selectedAppointmentDetails.enterpriseId || '',
                          isConfirmed: selectedAppointmentDetails.isConfirmed || false,
                          durationMinutes: selectedAppointmentDetails.durationMinutes || 0
                        });
                      }}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-2 transition-all"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </motion.button>
                  )}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  selectedAppointmentDetails.status === 'Confirmed' || selectedAppointmentDetails.isConfirmed
                    ? 'bg-green-400 text-green-900' 
                    : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {selectedAppointmentDetails.status === 'Confirmed' || selectedAppointmentDetails.isConfirmed ? '✅ Confirmed' : '⏳ Pending'}
                </div>
              </div>

              {/* Meta identifiers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-4">
                {[{label:"Appointment ID", value:selectedAppointmentDetails.appointmentId},
                  {label:"Visit ID", value:selectedAppointmentDetails.visitId || '—'},
                  {label:"Patient ID", value:selectedAppointmentDetails.patientId},
                  {label:"Clinic ID", value:selectedAppointmentDetails.clinicId || '—'},
                  {label:"Enterprise ID", value:selectedAppointmentDetails.enterpriseId || '—'},
                  {label:"Doctor ID", value:selectedAppointmentDetails.doctorId || '—'}].map((item) => (
                  <div key={item.label} className="bg-white/60 backdrop-blur border border-white/70 rounded-xl px-3 py-2 shadow-sm">
                    <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Content - Combined View/Edit Form */}
              <div className="p-8">
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  if (isEditingAppointment) {
                    alert('Save functionality to be implemented');
                  }
                }}>
                  {/* Patient Information */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>👤</span>
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">First Name</label>
                        {isEditingAppointment ? (
                          <input
                            type="text"
                            value={editAppointmentForm?.firstName || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, firstName: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Enter first name"
                          />
                        ) : (
                          <p className="text-lg font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.firstName || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Last Name</label>
                        {isEditingAppointment ? (
                          <input
                            type="text"
                            value={editAppointmentForm?.lastName || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, lastName: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Enter last name"
                          />
                        ) : (
                          <p className="text-lg font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.lastName || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Phone Number</label>
                        {isEditingAppointment ? (
                          <input
                            type="tel"
                            value={editAppointmentForm?.phoneNumber || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, phoneNumber: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.phoneNumber || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Email</label>
                        {isEditingAppointment ? (
                          <input
                            type="email"
                            value={editAppointmentForm?.email || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, email: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Enter email"
                          />
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.email || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Patient ID</label>
                        <p className="text-base font-bold text-slate-800 px-4 py-2 bg-slate-50 rounded-lg">#{selectedAppointmentDetails.patientId || 0}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Doctor ID</label>
                        {isEditingAppointment ? (
                          <input
                            type="number"
                            value={editAppointmentForm?.doctorId || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, doctorId: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Enter doctor ID"
                          />
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.doctorId || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Scheduling */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>📅</span>
                      Scheduling Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Date</label>
                        {isEditingAppointment ? (
                          <input
                            type="date"
                            value={editAppointmentForm?.date || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, date: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        ) : (
                          <p className="text-lg font-bold text-slate-800 px-4 py-2">
                            {new Date(selectedAppointmentDetails.appointmentDate).toLocaleDateString('en-US', { 
                              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Start Time</label>
                        {isEditingAppointment ? (
                          <select
                            value={editAppointmentForm?.startTime || ''}
                            onChange={(e) => {
                              const newStartTime = e.target.value;
                              let calculatedDuration = editAppointmentForm?.durationMinutes;
                              if (newStartTime && editAppointmentForm?.endTime) {
                                const [sh, sm] = newStartTime.split(':').map(Number);
                                const [eh, em] = editAppointmentForm.endTime.split(':').map(Number);
                                calculatedDuration = (eh * 60 + em) - (sh * 60 + sm);
                              }
                              setEditAppointmentForm({...editAppointmentForm, startTime: newStartTime, durationMinutes: calculatedDuration});
                            }}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          >
                            <option value="">Select time</option>
                            {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.startTime?.substring(0, 5) || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">End Time</label>
                        {isEditingAppointment ? (
                          <select
                            value={editAppointmentForm?.endTime || ''}
                            onChange={(e) => {
                              const newEndTime = e.target.value;
                              let calculatedDuration = editAppointmentForm?.durationMinutes;
                              if (editAppointmentForm?.startTime && newEndTime) {
                                const [sh, sm] = editAppointmentForm.startTime.split(':').map(Number);
                                const [eh, em] = newEndTime.split(':').map(Number);
                                calculatedDuration = (eh * 60 + em) - (sh * 60 + sm);
                              }
                              setEditAppointmentForm({...editAppointmentForm, endTime: newEndTime, durationMinutes: calculatedDuration});
                            }}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          >
                            <option value="">Select time</option>
                            {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.endTime?.substring(0, 5) || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Duration</label>
                        <p className="text-base font-bold text-slate-800 px-4 py-2 bg-slate-50 rounded-lg">
                          {isEditingAppointment ? (editAppointmentForm?.durationMinutes || 0) : (selectedAppointmentDetails.durationMinutes || 0)} minutes
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Appointment Type</label>
                        {isEditingAppointment ? (
                          <select
                            value={editAppointmentForm?.appointmentType || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, appointmentType: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                          >
                            <option value="">Select type</option>
                            {appointmentTypeOptions.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                            {editAppointmentForm?.appointmentType && !appointmentTypeOptions.includes(editAppointmentForm.appointmentType) && (
                              <option value={editAppointmentForm.appointmentType}>{editAppointmentForm.appointmentType} (current)</option>
                            )}
                          </select>
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.appointmentType || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Room Number</label>
                        {isEditingAppointment ? (
                          <input
                            type="text"
                            value={editAppointmentForm?.roomNumber || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, roomNumber: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Room number"
                          />
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.roomNumber || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Attending Physician</label>
                        {isEditingAppointment ? (
                          <input
                            type="text"
                            value={editAppointmentForm?.attendingPhysician || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, attendingPhysician: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Dr. Name"
                          />
                        ) : (
                          <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.attendingPhysician || 'N/A'}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-slate-500 font-medium mb-2">Status</label>
                        {isEditingAppointment ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { value: 'Scheduled', icon: '📅', color: 'from-blue-400 to-blue-600', ring: 'ring-blue-400' },
                              { value: 'Completed', icon: '✅', color: 'from-green-400 to-green-600', ring: 'ring-green-400' },
                              { value: 'Cancelled', icon: '❌', color: 'from-red-400 to-red-600', ring: 'ring-red-400' },
                              { value: 'NoShow', icon: '👻', color: 'from-gray-400 to-gray-600', ring: 'ring-gray-400' }
                            ].map((statusOption) => (
                              <motion.button
                                key={statusOption.value}
                                type="button"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditAppointmentForm({...editAppointmentForm, status: statusOption.value})}
                                className={`relative p-4 rounded-xl font-bold text-white transition-all duration-300 ${
                                  editAppointmentForm?.status === statusOption.value
                                    ? `bg-gradient-to-br ${statusOption.color} ring-4 ${statusOption.ring} shadow-xl scale-105`
                                    : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 hover:from-slate-300 hover:to-slate-400'
                                }`}
                              >
                                {editAppointmentForm?.status === statusOption.value && (
                                  <motion.div
                                    layoutId="statusSelector"
                                    className="absolute inset-0 bg-white/20 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                )}
                                <div className="relative flex flex-col items-center gap-1">
                                  <span className="text-2xl">{statusOption.icon}</span>
                                  <span className="text-xs">{statusOption.value}</span>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
                            <span className="text-xl">
                              {selectedAppointmentDetails.status === 'Scheduled' ? '📅' :
                               selectedAppointmentDetails.status === 'Completed' ? '✅' :
                               selectedAppointmentDetails.status === 'Cancelled' ? '❌' : '👻'}
                            </span>
                            <p className="text-base text-slate-800">{selectedAppointmentDetails.status || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Treatment Details */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>🦷</span>
                      Treatment Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Reason for Visit</label>
                        {isEditingAppointment ? (
                          <input
                            type="text"
                            value={editAppointmentForm?.reasonForVisit || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, reasonForVisit: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="Reason for visit"
                          />
                        ) : (
                          <p className="text-base text-slate-700 px-4 py-2">{selectedAppointmentDetails.reasonForVisit || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Notes</label>
                        {isEditingAppointment ? (
                          <textarea
                            value={editAppointmentForm?.notes || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, notes: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                            placeholder="Additional notes"
                          />
                        ) : (
                          <p className="text-base text-slate-700 px-4 py-2 whitespace-pre-wrap">{selectedAppointmentDetails.notes || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Telehealth Link</label>
                        {isEditingAppointment ? (
                          <input
                            type="url"
                            value={editAppointmentForm?.telehealthLink || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, telehealthLink: e.target.value})}
                            disabled={editAppointmentForm?.appointmentType !== 'Telehealth'}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder={editAppointmentForm?.appointmentType === 'Telehealth' ? 'https://meet.example.com/...' : 'Only for Telehealth appointments'}
                          />
                        ) : (
                          <p className="text-base text-slate-700 px-4 py-2">{selectedAppointmentDetails.telehealthLink || 'N/A'}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Visit ID</label>
                        <p className="text-base font-bold text-slate-800 px-4 py-2">{selectedAppointmentDetails.visitId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Appointment Status</label>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                          selectedAppointmentDetails.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-300' :
                          selectedAppointmentDetails.status === 'Cancelled' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                          selectedAppointmentDetails.status === 'NoShow' ? 'bg-gray-100 text-gray-700 border border-gray-300' :
                          'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}>
                          {selectedAppointmentDetails.status || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isEditingAppointment && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-400 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={editAppointmentForm?.isConfirmed || false}
                          onChange={(e) => setEditAppointmentForm({...editAppointmentForm, isConfirmed: e.target.checked})}
                          className="w-6 h-6 rounded-lg border-2 border-blue-300 text-blue-600 focus:ring-4 focus:ring-blue-100 cursor-pointer"
                        />
                        <span className="text-base font-bold text-slate-700 flex items-center gap-2">
                          <span className="text-xl">✅</span>
                          <span>Confirmed Appointment</span>
                        </span>
                      </motion.label>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer Action Buttons */}
              <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-t-2 border-slate-200 flex gap-4">
                {isEditingAppointment ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCloseEditAppointment}
                      type="button"
                      className="flex-1 px-6 py-4 bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      ✖️ Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        if (editAppointmentForm?.status === 'Completed' && !((editAppointmentForm?.reasonForVisit || '').trim()) && !((editAppointmentForm?.notes || '').trim())) {
                          const confirmClose = window.confirm("No diagnosis/visit info is captured. Close this appointment anyway? 🦷🤔");
                          if (!confirmClose) {
                            return;
                          }
                        }
                        try {
                          const userId = localStorage.getItem('userId');
                          
                          // Use actual appointment data, fallback to localStorage
                          const clinicId = parseInt(selectedAppointmentDetails.clinicId) || parseInt(localStorage.getItem('clinicId')) || 0;
                          const enterpriseId = parseInt(selectedAppointmentDetails.enterpriseId) || parseInt(localStorage.getItem('enterpriseId')) || 0;
                          
                          // Prepare complete appointment payload matching backend model
                          const updatedAppointment = {
                            appointmentId: selectedAppointmentDetails.appointmentId,
                            patientId: parseInt(selectedAppointmentDetails.patientId) || parseInt(editAppointmentForm.patientId) || 0,
                            clinicId: clinicId,
                            doctorId: editAppointmentForm.doctorId ? String(editAppointmentForm.doctorId) : (selectedAppointmentDetails.doctorId ? String(selectedAppointmentDetails.doctorId) : null),
                            attendingPhysician: editAppointmentForm.attendingPhysician || '',
                            enterpriseId: enterpriseId,
                            firstName: editAppointmentForm.firstName || '',
                            lastName: editAppointmentForm.lastName || '',
                            phoneNumber: editAppointmentForm.phoneNumber || '',
                            email: editAppointmentForm.email || '',
                            appointmentDate: editAppointmentForm.date,
                            startTime: `${editAppointmentForm.startTime}:00`,
                            endTime: `${editAppointmentForm.endTime}:00`,
                            durationMinutes: parseInt(editAppointmentForm.durationMinutes) || 0,
                            appointmentType: editAppointmentForm.appointmentType || 'Consultation',
                            reasonForVisit: editAppointmentForm.reasonForVisit || '',
                            notes: editAppointmentForm.notes || '',
                            roomNumber: editAppointmentForm.roomNumber || '',
                            telehealthLink: editAppointmentForm.telehealthLink || '',
                            status: editAppointmentForm.status || 'Scheduled',
                            isConfirmed: editAppointmentForm.isConfirmed || false,
                            billableAmount: parseFloat(editAppointmentForm.billableAmount) || 0,
                            paidAmount: parseFloat(editAppointmentForm.paidAmount) || 0,
                            pendingAmount: parseFloat(editAppointmentForm.pendingAmount) || 0,
                            paymentStatus: editAppointmentForm.paymentStatus || 'Pending',
                            visitId: editAppointmentForm.visitId || selectedAppointmentDetails.visitId || null,
                            createdAt: selectedAppointmentDetails.createdAt,
                            updatedAt: new Date().toISOString(),
                            createdBy: parseInt(selectedAppointmentDetails.createdBy) || 0,
                            updatedBy: parseInt(userId) || 0
                          };
                          
                          console.log('Updating appointment with payload:', updatedAppointment);
                          
                          // Call update API with just the appointment object
                          const response = await updateAppointment(updatedAppointment);
                          console.log('Update response:', response);
                          
                          // Batch all state updates together
                          // Update the list first
                          setFilteredAppointmentsList(prev => 
                            prev.map(apt => 
                              apt.appointmentId === selectedAppointmentDetails.appointmentId 
                                ? { ...apt, ...updatedAppointment }
                                : apt
                            )
                          );
                          
                          // Update selected details and exit edit mode in single update
                          setSelectedAppointmentDetails({
                            ...selectedAppointmentDetails,
                            ...updatedAppointment
                          });
                          
                          // Exit edit mode - using batched state updates
                          setIsEditingAppointment(false);
                          setEditAppointmentForm(null);
                          setShowAppointmentUpdateSuccess(true);
                          
                          setTimeout(() => setShowAppointmentUpdateSuccess(false), 4000);
                        } catch (error) {
                          console.error('Error updating appointment:', error);
                          alert('❌ Oops! Something went wrong. Even dentists make mistakes! 🦷💥');
                        }
                      }}
                      type="button"
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      ✅ Update Appointment
                    </motion.button>
                  </>
                ) : (
                  <>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => loadDiagnosisDetails(selectedAppointmentDetails.appointmentId)}
                      type="button"
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🩺</span>
                      <span>View Diagnosis</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCloseAppointmentDetails}
                      type="button"
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      Close
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment Update Success Popup */}
      <AnimatePresence>
        {showAppointmentUpdateSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden"
            >
              {/* Animated Background Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -100, x: Math.random() * 400 - 200, opacity: 1 }}
                  animate={{ 
                    y: 600,
                    rotate: Math.random() * 720,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: "easeIn"
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'][i % 5],
                    left: `${Math.random() * 100}%`
                  }}
                />
              ))}

              {/* Success Icon with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="text-center mb-6"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.8,
                    delay: 0.5,
                    repeat: 1
                  }}
                  className="inline-block text-9xl mb-4"
                >
                  🎉
                </motion.div>
              </motion.div>

              {/* Funny Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-4"
              >
                <h2 className="text-4xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Boom! Updated! 💥
                </h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-lg text-slate-700 font-semibold"
                >
                  That appointment got a glow-up! ✨
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-green-200 shadow-lg"
                >
                  <p className="text-2xl font-bold text-slate-800 mb-2">
                    🦷 Appointment #{selectedAppointmentDetails?.appointmentId}
                  </p>
                  <p className="text-sm text-slate-600 italic">
                    "Thanks for keeping me up to date! My teeth are smiling! 😁"
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center justify-center gap-2 text-sm text-slate-500"
                >
                  <span className="animate-pulse">✅</span>
                  <span>Changes saved faster than you can say "cheese"!</span>
                  <span className="animate-pulse">🧀</span>
                </motion.div>
              </motion.div>

              {/* Auto-close indicator */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-full origin-left"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not Logged In Modal - Funny Message */}
      <AnimatePresence>
        {showNotLoggedInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotLoggedInModal(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-3 border-orange-300"
            >
              {/* Colorful Header */}
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 text-center relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="text-6xl mb-4"
                >
                  🔐
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">Oops! 🚫</h3>
                <p className="text-orange-50 font-semibold">You need to login first!</p>
              </div>

              {/* Funny Message */}
              <div className="p-8 text-center space-y-6">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl"
                >
                  😅
                </motion.div>

                <div className="space-y-3">
                  <p className="text-slate-700 text-lg font-bold">
                    "Hold up! We can't let you book appointments while flying under the radar!"
                  </p>
                  <p className="text-slate-600 text-sm">
                    It's like trying to book a dental appointment without showing your teeth! 🦷
                  </p>
                </div>

                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 text-left">
                  <p className="text-yellow-800 font-semibold text-sm">
                    💡 <span className="font-bold">Pro Tip:</span> Login to unlock the magic of appointment scheduling!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowNotLoggedInModal(false);
                      navigate("/login");
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔓</span>
                    <span>Login Now</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotLoggedInModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-bold shadow-md transition-all"
                  >
                    Close
                  </motion.button>
                </div>

                <p className="text-xs text-slate-500 italic">
                  "We're just trying to keep the teeth thieves away! 😄"
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnosis Details Modal */}
      <AnimatePresence>
        {showDiagnosisModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowDiagnosisModal(false)}
            style={{ overflow: 'auto' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-8 border-2 border-yellow-400/70 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-8 py-6 border-b-2 border-yellow-400/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-gradient-to-br from-yellow-300/40 to-amber-400/50 border-2 border-yellow-300/70 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/40"
                    >
                      <span className="text-3xl">🩺</span>
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Diagnosis & Prescription
                      </h2>
                      <p className="text-yellow-100 text-sm mt-1">
                        View & Print Complete Report
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDiagnosisModal(false)}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                {loadingDiagnosis ? (
                  <div className="text-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-6xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-indigo-700 text-lg font-semibold">Loading diagnosis details...</p>
                  </div>
                ) : !selectedDiagnosis ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🩺</div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Diagnostic Details Found</h3>
                    <p className="text-slate-500 text-sm">No diagnosis or prescription has been recorded for this appointment yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Clinic Header - Only visible in print */}
                    <div className="hidden print:block text-center border-b-4 border-gray-800 pb-6 mb-6">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">Clinic Name</h1>
                      <p className="text-gray-600 text-sm">Address | Phone | Email</p>
                    </div>

                    {/* Patient & Doctor Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-5 border-2 border-blue-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-blue-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                          <h3 className="text-lg font-bold text-blue-900">Patient Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-blue-700 uppercase">Name</label>
                            <p className="text-base font-bold text-gray-900">{selectedDiagnosis.patientName || 'N/A'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-blue-700 uppercase">Patient ID</label>
                              <p className="text-sm font-semibold text-gray-800">{selectedDiagnosis.patientId || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-blue-700 uppercase">Gender</label>
                              <p className="text-sm font-semibold text-gray-800">{selectedDiagnosis.patientGender || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-5 border-2 border-purple-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-purple-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">👨‍⚕️</span>
                          </div>
                          <h3 className="text-lg font-bold text-purple-900">Doctor Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-purple-700 uppercase">Attending Physician</label>
                            <p className="text-base font-bold text-gray-900">{selectedDiagnosis.attendingPhysician || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-purple-700 uppercase">Visit Date</label>
                            <p className="text-sm font-semibold text-gray-800">
                              {selectedDiagnosis.visitDate ? new Date(selectedDiagnosis.visitDate).toLocaleDateString('en-US', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                              }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Visit Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 border-2 border-yellow-400 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-yellow-400">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                          <span className="text-xl">📋</span>
                        </div>
                        <h3 className="text-lg font-bold text-yellow-900">Visit Details</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedDiagnosis.nextAppointmentDate && (
                          <div className="bg-white p-3 rounded-xl border border-yellow-400">
                            <label className="text-xs font-semibold text-yellow-700 uppercase">📅 Next Appointment</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">
                              {new Date(selectedDiagnosis.nextAppointmentDate).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </p>
                          </div>
                        )}
                        <div className="bg-white p-3 rounded-xl border border-amber-400">
                          <label className="text-xs font-semibold text-amber-700 uppercase">💰 Payment Status</label>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedDiagnosis.paymentStatus || 'Pending'}</p>
                        </div>
                        {selectedDiagnosis.billingAmount && (
                          <div className="bg-white p-3 rounded-xl border border-green-400">
                            <label className="text-xs font-semibold text-green-700 uppercase">💵 Amount</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">₹{selectedDiagnosis.billingAmount}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Reason for Visit */}
                    {selectedDiagnosis.reasonForVisit && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-5 border-2 border-cyan-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-cyan-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">📝</span>
                          </div>
                          <h3 className="text-base font-bold text-cyan-900">Reason for Visit</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.reasonForVisit}
                        </p>
                      </motion.div>
                    )}

                    {/* Diagnosis */}
                    {selectedDiagnosis.diagnoses && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-5 border-2 border-indigo-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-indigo-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🩺</span>
                          </div>
                          <h3 className="text-base font-bold text-indigo-900">Diagnosis</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.diagnoses}
                        </p>
                      </motion.div>
                    )}

                    {/* Treatments */}
                    {selectedDiagnosis.treatments && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-5 border-2 border-green-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-green-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">💉</span>
                          </div>
                          <h3 className="text-base font-bold text-green-900">Treatments Provided</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.treatments}
                        </p>
                      </motion.div>
                    )}

                    {/* Prescriptions - Main Section with Grid for Print */}
                    {selectedDiagnosis.prescriptions && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-400"
                      >
                        {(() => {
                          try {
                            const prescriptionData = typeof selectedDiagnosis.prescriptions === 'string' 
                              ? JSON.parse(selectedDiagnosis.prescriptions) 
                              : selectedDiagnosis.prescriptions;
                            
                            if (Array.isArray(prescriptionData) && prescriptionData.length > 0) {
                              return (
                                <>
                                  {/* Prescription Header with Action Buttons */}
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                                          <span className="text-2xl">💊</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Prescription</h3>
                                      </div>
                                    </div>

                                    {/* Action Buttons Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowPrintPreviewModal(true)}
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-blue-400 text-blue-700 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-600 hover:shadow-md transition text-sm"
                                      >
                                        <span className="text-3xl">📥</span>
                                        <span>Download PDF</span>
                                      </motion.button>

                                      <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowEmailModal(true)}
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-green-400 text-green-700 rounded-xl font-bold hover:bg-green-50 hover:border-green-600 hover:shadow-md transition text-sm"
                                      >
                                        <span className="text-3xl">📧</span>
                                        <span>Email</span>
                                      </motion.button>

                                      <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSendDiagnosisWhatsApp}
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-green-500 text-green-700 rounded-xl font-bold hover:bg-green-50 hover:border-green-700 hover:shadow-md transition text-sm"
                                      >
                                        <span className="text-3xl">💬</span>
                                        <span>WhatsApp</span>
                                      </motion.button>
                                    </div>
                                  </div>

                                  {/* Prescription Header */}
                                  <div className="flex items-center justify-between pb-4 border-b-3 border-pink-300">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-lg font-bold text-gray-900">Medications</h3>
                                    </div>
                                  </div>

                                  {/* Printable Prescription Container */}
                                  <div className="patient-diagnosis-print-container bg-white p-8 w-full">
                                    {/* Medications Grid */}
                                    <div>
                                    <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                      <span>💊</span> Prescribed Medications
                                    </h4>
                                    
                                    {/* Grid Header */}
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: '40px 1fr 80px 80px 100px',
                                      gap: '8px',
                                      backgroundColor: '#1f2937',
                                      color: 'white',
                                      padding: '12px',
                                      borderRadius: '8px 8px 0 0',
                                      fontWeight: 'bold',
                                      fontSize: '12px',
                                      textAlign: 'center'
                                    }}>
                                      <div>#</div>
                                      <div style={{ textAlign: 'left' }}>Medicine Name</div>
                                      <div>Dosage</div>
                                      <div>Frequency</div>
                                      <div>Duration</div>
                                    </div>
                                    
                                    {/* Grid Rows */}
                                    <div style={{
                                      border: '2px solid #d1d5db',
                                      borderRadius: '0 0 8px 8px',
                                      overflow: 'hidden'
                                    }}>
                                      {prescriptionData.map((med, idx) => (
                                        <div key={idx}>
                                          <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '40px 1fr 80px 80px 100px',
                                            gap: '8px',
                                            padding: '12px',
                                            fontSize: '12px',
                                            borderBottom: '1px solid #e5e7eb',
                                            backgroundColor: idx % 2 === 0 ? '#fce7f3' : 'white',
                                            textAlign: 'center'
                                          }}>
                                            <div style={{ fontWeight: 'bold', color: '#be123c' }}>{idx + 1}</div>
                                            <div style={{ fontWeight: 'bold', color: '#111827', textAlign: 'left' }}>{med.medicineName || 'N/A'}</div>
                                            <div style={{ color: '#374151' }}>{med.dosage || '-'}</div>
                                            <div style={{ color: '#374151' }}>{med.frequency || '-'}</div>
                                            <div style={{ color: '#374151' }}>{med.duration || '-'}</div>
                                          </div>
                                          {med.specialInstructions && (
                                            <div style={{
                                              padding: '8px 12px',
                                              backgroundColor: '#fef3c7',
                                              borderBottom: '1px solid #fcd34d',
                                              fontSize: '12px'
                                            }}>
                                              <span style={{ fontWeight: 'bold', color: '#92400e' }}>⚠️ Special Instructions: </span>
                                              <span style={{ color: '#78350f' }}>{med.specialInstructions}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* General Notes */}
                                    {prescriptionData[0]?.generalPrescriptionNotes && (
                                      <div className="mt-4 p-4 bg-white rounded-xl border-2 border-indigo-400">
                                        <span className="text-indigo-900 font-bold text-sm">📝 General Instructions: </span>
                                        <p className="text-gray-800 text-sm mt-2">{prescriptionData[0].generalPrescriptionNotes}</p>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="mt-6 grid grid-cols-3 gap-3">
                                      <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => generateDiagnosisPDF()}
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-blue-400 text-blue-700 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-600 hover:shadow-md transition text-sm"
                                      >
                                        <span className="text-3xl">📥</span>
                                        <span>Download PDF</span>
                                      </motion.button>

                                      <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowEmailModal(true)}
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-green-400 text-green-700 rounded-xl font-bold hover:bg-green-50 hover:border-green-600 hover:shadow-md transition text-sm"
                                      >
                                        <span className="text-3xl">📧</span>
                                        <span>Email</span>
                                      </motion.button>

                                      <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSendDiagnosisWhatsApp}
                                        className="flex flex-col items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-green-500 text-green-700 rounded-xl font-bold hover:bg-green-50 hover:border-green-700 hover:shadow-md transition text-sm"
                                      >
                                        <span className="text-3xl">💬</span>
                                        <span>WhatsApp</span>
                                      </motion.button>
                                    </div>
                                  </div>

                                  {/* Footer Note */}
                                  <div className="pt-4 border-t-2 border-yellow-400 text-center">
                                    <p className="text-xs text-gray-600">⚕️ This prescription is valid for 90 days from the date of issue.</p>
                                  </div>
                                </div>
                                {/* End of Printable Container */}
                                </>
                              );
                            }
                          } catch (e) {
                            console.error('Error parsing prescription:', e);
                          }
                          return (
                            <>
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-pink-300">
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
                                <span className="text-xl">💊</span>
                              </div>
                              <h3 className="text-base font-bold text-pink-900">Prescription Notes</h3>
                            </div>
                            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mt-3">
                              {typeof selectedDiagnosis.prescriptions === 'object' && selectedDiagnosis.prescriptions !== null ? (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                                  <p className="text-gray-600">📋 {JSON.stringify(selectedDiagnosis.prescriptions, null, 2)}</p>
                                </div>
                              ) : (
                                <p>{selectedDiagnosis.prescriptions || 'No prescription notes'}</p>
                              )}
                            </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}

                    {/* Notes */}
                    {selectedDiagnosis.notes && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-5 border-2 border-orange-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-orange-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">📄</span>
                          </div>
                          <h3 className="text-base font-bold text-orange-900">Additional Notes</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.notes}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-4 flex justify-end border-t-2 border-yellow-400/50 print:hidden">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDiagnosisModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPrintPreviewModal && selectedDiagnosis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowPrintPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sticky top-0 flex items-center justify-between text-white">
                <h2 className="text-2xl font-bold">📋 Diagnosis & Prescription</h2>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      generateDiagnosisPDF();
                    }}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition text-sm"
                  >
                    📥 Download PDF
                  </motion.button>
                  <button
                    onClick={() => setShowPrintPreviewModal(false)}
                    className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <div className="patient-diagnosis-print-container bg-white">
                  <div className="mb-8 pb-6 border-b-4 border-stone-800">
                    <h1 className="text-4xl font-bold text-stone-900">Diagnosis & Prescription Report</h1>
                    <p className="text-sm text-stone-600 mt-1">Medical Consultation Record</p>
                  </div>

                  {/* Patient Info */}
                  <div className="bg-stone-50 rounded-lg p-4 mb-8 border border-stone-300">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">Patient Name</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{selectedDiagnosis?.patientName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">Patient ID</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">{selectedDiagnosis?.patientId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">Visit Date</p>
                        <p className="text-sm font-bold text-stone-900 mt-1">
                          {selectedDiagnosis?.visitDate ? new Date(selectedDiagnosis.visitDate).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {selectedDiagnosis?.diagnoses && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-2">🩺 Diagnosis</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedDiagnosis.diagnoses}</p>
                    </div>
                  )}

                  {/* Treatment */}
                  {selectedDiagnosis?.treatments && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <p className="text-xs uppercase tracking-wider text-green-600 font-semibold mb-2">💉 Treatments</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedDiagnosis.treatments}</p>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {selectedDiagnosis?.prescriptions && (
                    <div className="mb-6 p-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                      <p className="text-xs uppercase tracking-wider text-pink-600 font-semibold mb-2">💊 Prescriptions</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedDiagnosis.prescriptions}</p>
                    </div>
                  )}

                  <div className="mt-8 pt-4 border-t border-stone-300 text-center text-xs text-stone-600">
                    <p>⚕️ This document is valid as per the prescription validity period.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && selectedDiagnosis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-green-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <h2 className="text-2xl font-bold">📧 Send Diagnosis via Email</h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Patient Email</label>
                  <input
                    type="email"
                    value={selectedDiagnosis?.email || ''}
                    readOnly
                    className="w-full px-4 py-2 border-2 border-green-200 rounded-lg bg-gray-50 text-gray-800"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p>The diagnosis report, treatment details, and prescribed medications will be sent to the patient's email.</p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendDiagnosisEmail}
                    disabled={sendingEmail}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold text-white transition ${
                      sendingEmail
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    {sendingEmail ? '📤 Sending...' : '📤 Send Email'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


