import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPatient, getPatientsByClinic, getPatientFullProfile, updatePatientFullProfile, searchPatients, deletePatient } from "../services/patientService";
import { visitService } from "../services/visitService";
import { getClinicsByEnterpriseId } from "../services/doctorService";
import { createAppointment, listAppointments, getAppointmentsByFilters, updateAppointment } from "../services/appointmentService";
import ViewPatients from "./ViewPatients";

// Reusable InputField component - moved outside to prevent re-creation on renders
const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", options = null, disabled = false }) => (
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
          disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
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
          disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
        }`}
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
          disabled 
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
        }`}
      />
    )}
  </div>
);

// Reusable CollapsibleSection component - moved outside to prevent re-creation on renders
const CollapsibleSection = ({ title, isOpen, onToggle, children, icon }) => (
  <div className="mb-4 border border-stone-200 rounded-lg overflow-hidden shadow-sm">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-6 py-4 bg-gradient-to-r from-cream-50 to-peach-50 hover:from-cream-100 hover:to-peach-100 flex items-center justify-between transition-all"
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
  const [searchParams] = useSearchParams();
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
  
  // View Patients modal state
  const [showViewPatientsModal, setShowViewPatientsModal] = useState(false);
  
  // Appointments modal states
  const [showViewAppointmentsModal, setShowViewAppointmentsModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  
  // Appointment booking form state
  const [appointmentForm, setAppointmentForm] = useState({
    // Patient details
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    // Scheduling
    date: "",
    startTime: "",
    endTime: "",
    durationMinutes: "",
    // Details
    appointmentType: "",
    reasonForVisit: "",
    notes: "",
    roomNumber: "",
    telehealthLink: "",
    attendingPhysician: "",
    // Status & billing
    status: "Scheduled",
    isConfirmed: false,
    billableAmount: "",
    paidAmount: "",
    pendingAmount: "",
    paymentStatus: "Pending",
    // References
    doctorId: ""
  });
  
  // Patient search state for appointment booking
  const [patientSearchForm, setPatientSearchForm] = useState({
    clinicId: "",
    patientId: "",
    firstName: "",
    lastName: ""
  });
  const [searchedPatient, setSearchedPatient] = useState(null);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientNotFound, setPatientNotFound] = useState(false);
  const [bookingWithoutRegistration, setBookingWithoutRegistration] = useState(false);
  const [clinicsList, setClinicsList] = useState([]);
  const [showAppointmentSuccessModal, setShowAppointmentSuccessModal] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editAppointmentForm, setEditAppointmentForm] = useState(null);
  const [showAppointmentUpdateSuccess, setShowAppointmentUpdateSuccess] = useState(false);
  const [showNotLoggedInModal, setShowNotLoggedInModal] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(!!localStorage.getItem('accessToken'));
  
  // Appointment filter state
  const [appointmentFilter, setAppointmentFilter] = useState({
    clinicId: "",
    firstName: "",
    lastName: "",
    doctorId: "",
    appointmentDate: ""
  });
  const [filteredAppointmentsList, setFilteredAppointmentsList] = useState([]);
  
  // Load clinics on mount
  useEffect(() => {
    const enterpriseId = localStorage.getItem('enterpriseId') || '1';
    getClinicsByEnterpriseId(parseInt(enterpriseId))
      .then(clinics => setClinicsList(clinics))
      .catch(err => console.error('Failed to load clinics:', err));
  }, []);

  // Check login status on mount and when active view changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsUserLoggedIn(!!token);
    console.log('✅ Login status updated:', !!token);
  }, [activeView]);

  // Also check on initial mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsUserLoggedIn(!!token);
    console.log('✅ Initial login check:', !!token);
  }, []);
  
  // Function to load appointments
  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const appointments = await listAppointments();
      setAppointmentsList(appointments);
      setFilteredAppointmentsList(appointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  // Function to filter appointments via API
  const filterAppointments = async () => {
    if (!appointmentFilter.clinicId) {
      alert('⚠️ Clinic ID is required to search appointments');
      return;
    }
    
    setLoadingAppointments(true);
    try {
      const filterParams = {
        clinicId: appointmentFilter.clinicId,
        firstName: appointmentFilter.firstName || undefined,
        lastName: appointmentFilter.lastName || undefined,
        doctorId: appointmentFilter.doctorId || undefined,
        appointmentDate: appointmentFilter.appointmentDate || undefined
      };
      
      const results = await getAppointmentsByFilters(filterParams);
      setFilteredAppointmentsList(results);
      
      if (results.length === 0) {
        alert('ℹ️ No appointments found matching the search criteria');
      }
    } catch (error) {
      console.error('Failed to filter appointments:', error);
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
      appointmentDate: ""
    });
    setFilteredAppointmentsList(appointmentsList);
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
      // Reset filters when modal opens
      setAppointmentFilter({
        clinicId: localStorage.getItem('clinicId') || "",
        firstName: "",
        lastName: "",
        doctorId: "",
        appointmentDate: ""
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
  
  // Prescription Modal States
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionColor, setPrescriptionColor] = useState("#8b5cf6"); // Default purple
  const [patientMedicalInfo, setPatientMedicalInfo] = useState(null);
  const [loadingMedicalInfo, setLoadingMedicalInfo] = useState(false);
  
  // Doctor information - should come from authentication context
  const CURRENT_DOCTOR = {
    doctorId: 1,
    name: "Dr. Rajesh Kumar",
    registrationNumber: "MCI-A-12345-MH",
    specialization: "General Dentistry & Oral Medicine"
  };

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
    insuranceProvider: "",
    policyNumber: "",
    groupNumber: "",
    policyHolderName: "",
    policyHolderRelation: "",
    coverageStartDate: "",
    coverageEndDate: "",
    isPrimaryInsurance: true,
    copayAmount: "",
    deductibleAmount: "",
    coveragePercentage: "",
    insurancePhone: "",
    isActive: true
  });

  // View/Filter states
  const [viewTab, setViewTab] = useState("search");
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: ""
  });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [clinicPatientsData, setClinicPatientsData] = useState([]);
  const [loadingClinicPatients, setLoadingClinicPatients] = useState(false);
  const [clinicError, setClinicError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Patient details modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  
  // Delete modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(false);

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

  // Filter patients based on old search criteria (for register/edit views)
  const filteredPatientsOld = mockPatients.filter(patient => {
    if (filterData.firstName && !patient.firstName.toLowerCase().includes(filterData.firstName.toLowerCase())) return false;
    if (filterData.lastName && !patient.lastName.toLowerCase().includes(filterData.lastName.toLowerCase())) return false;
    if (filterData.dateOfBirth && patient.dateOfBirth !== filterData.dateOfBirth) return false;
    if (filterData.patientId && patient.patientId !== parseInt(filterData.patientId)) return false;
    if (filterData.clinicId && patient.clinicId !== parseInt(filterData.clinicId)) return false;
    return true;
  });

  // Fetch patients using search API with multiple optional parameters
  const fetchClinicPatients = async () => {
    // Check if at least one search parameter is provided
    const hasSearchParams = selectedClinicId.trim() || 
                           filterData.patientId.trim() || 
                           filterData.firstName.trim() || 
                           filterData.lastName.trim() || 
                           filterData.dateOfBirth.trim();
    
    if (!hasSearchParams) {
      setClinicError("Please enter at least one search parameter");
      return;
    }

    setLoadingClinicPatients(true);
    setClinicError("");
    setSearchPerformed(true);

    try {
      // Build search parameters object
      const searchParams = {};
      
      if (selectedClinicId.trim()) {
        const clinicId = parseInt(selectedClinicId);
        if (!isNaN(clinicId)) {
          searchParams.clinicId = clinicId;
        }
      }
      
      if (filterData.patientId.trim()) {
        const patientId = parseInt(filterData.patientId);
        if (!isNaN(patientId)) {
          searchParams.patientId = patientId;
        }
      }
      
      if (filterData.firstName.trim()) {
        searchParams.firstName = filterData.firstName.trim();
      }
      
      if (filterData.lastName.trim()) {
        searchParams.lastName = filterData.lastName.trim();
      }
      
      if (filterData.dateOfBirth.trim()) {
        searchParams.dob = filterData.dateOfBirth.trim();
      }

      const patients = await searchPatients(searchParams);
      console.log("Patient Search Response:", patients);
      console.log("Search Parameters:", searchParams);
      setClinicPatientsData(patients);
      setClinicError("");
    } catch (error) {
      console.error("Error searching patients:", error);
      setClinicError(error.message || "Failed to find patients. Please check your search criteria.");
      setClinicPatientsData([]);
    } finally {
      setLoadingClinicPatients(false);
    }
  };

  // Filter patients by selected clinic (using real-time API data)
  const clinicPatients = Array.isArray(clinicPatientsData) ? clinicPatientsData : [];

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        patientPhone: contactData.phoneNumber,
        patientEmail: contactData.email || "",
        patientEmergencyContact: contactData.emergencyContactName 
          ? `${contactData.emergencyContactName} - ${contactData.emergencyContactPhone} (${contactData.emergencyContactRelation})`
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
        patientId: 0, // Will be assigned by backend
        patientInsuranceProvider: insuranceData.insuranceProvider || ""
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
        phone: contactData.phoneNumber
      });
      setShowSuccessModal(true);
      
      // Clear form after successful submission
      setPatientData({ firstName: "", lastName: "", dateOfBirth: "", gender: "", bloodGroup: "", maritalStatus: "", isActive: true });
      setContactData({ phoneNumber: "", alternatePhoneNumber: "", email: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "" });
      setMedicalData({ allergies: "", chronicConditions: "", currentMedications: "", pastSurgeries: "", familyMedicalHistory: "", smokingStatus: "", alcoholConsumption: "", exerciseFrequency: "", dietaryRestrictions: "", lastDentalVisit: "", notes: "" });
      setInsuranceData({ insuranceProvider: "", policyNumber: "", groupNumber: "", policyHolderName: "", policyHolderRelation: "", coverageStartDate: "", coverageEndDate: "", isPrimaryInsurance: true, copayAmount: "", deductibleAmount: "", coveragePercentage: "", insurancePhone: "", isActive: true });
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
    return contactData.phoneNumber && contactData.addressLine1 && 
           contactData.city && contactData.state && contactData.postalCode && contactData.country;
  };

  const isAllTabsValid = () => {
    return isPatientTabValid() && isContactTabValid();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'register', title: '📝 Register Patient', description: 'Add new patient records', icon: '📝', color: 'from-teal-400 to-cyan-400', action: () => setActiveView('register') },
              { id: 'list', title: '📋 View Patients', description: 'Browse patient records', icon: '📋', color: 'from-blue-400 to-indigo-400', action: () => setShowViewPatientsModal(true) },
              { id: 'edit', title: '✏️ Edit Records', description: 'Update patient info', icon: '✏️', color: 'from-indigo-400 to-purple-400', action: () => navigate('/patients/edit') },
              { id: 'remove', title: '🗑️ Remove Patient', description: 'Delete patient records', icon: '🗑️', color: 'from-rose-400 to-rose-500', action: () => navigate('/patients/delete') }
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
                      className="text-3xl mb-2"
                    >
                      {tile.icon}
                    </motion.div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {tile.title}
                    </h3>
                    <p className="text-white/90 text-xs">
                      {tile.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Visits Management Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            Visits Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'add-visit', title: '📝 Add Visit', description: 'Record new patient visit', icon: '📝', color: 'from-emerald-400 to-teal-400', action: () => setShowAddVisitModal(true) },
              { id: 'view-visits', title: '📋 View Visits', description: 'Browse visit history', icon: '📋', color: 'from-violet-400 to-purple-400', action: () => setShowViewVisitsModal(true) }
            ].map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'new-appointment', title: '📅 New Appointment', description: 'Book patient appointment', icon: '📅', color: 'from-cyan-400 to-blue-400', action: () => {
                // Real-time token check - using correct accessToken key
                const currentToken = localStorage.getItem('accessToken');
                if (!currentToken) {
                  setShowNotLoggedInModal(true);
                } else {
                  setIsUserLoggedIn(true);
                  setShowNewAppointmentModal(true);
                }
              } },
              { id: 'view-appointments', title: '📋 View Appointments', description: 'Browse appointments', icon: '📋', color: 'from-purple-400 to-pink-400', action: () => setShowViewAppointmentsModal(true) }
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

        {/* Registration Modal */}
        <AnimatePresence>
        {activeView === "register" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setActiveView(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">📝 Register New Patient</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveView(null)}
                    type="button"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50">
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
                    className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
                      registerActiveTab === tab.key
                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg scale-105"
                        : "bg-white text-slate-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-600 border-2 border-slate-200"
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Modal Content - Fixed Height */}
              <div className="h-[calc(90vh-180px)] overflow-y-auto p-4">
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
                  onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })}
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
                <InputField
                  label="Clinic ID"
                  name="clinicId"
                  type="text"
                  value={patientData.clinicId}
                  onChange={(e) => setPatientData({ ...patientData, clinicId: e.target.value })}
                  required
                  placeholder="Enter clinic ID"
                />
              </div>
              </motion.div>
            )}

            {/* Contact Information - Tab */}
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
                <InputField
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={contactData.phoneNumber}
                  onChange={(e) => setContactData({ ...contactData, phoneNumber: e.target.value })}
                  required
                  placeholder="+1 (555) 123-4567"
                />
                <InputField
                  label="Alternate Phone"
                  name="alternatePhoneNumber"
                  type="tel"
                  value={contactData.alternatePhoneNumber}
                  onChange={(e) => setContactData({ ...contactData, alternatePhoneNumber: e.target.value })}
                  placeholder="Optional"
                />
                <div className="md:col-span-3">
                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    placeholder="patient@example.com"
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
                <InputField
                  label="City"
                  name="city"
                  value={contactData.city}
                  onChange={(e) => setContactData({ ...contactData, city: e.target.value })}
                  required
                  placeholder="City"
                />
                <InputField
                  label="State/Province"
                  name="state"
                  value={contactData.state}
                  onChange={(e) => setContactData({ ...contactData, state: e.target.value })}
                  required
                  placeholder="State"
                />
                <InputField
                  label="Postal Code"
                  name="postalCode"
                  value={contactData.postalCode}
                  onChange={(e) => setContactData({ ...contactData, postalCode: e.target.value })}
                  required
                  placeholder="12345"
                />
                <InputField
                  label="Country"
                  name="country"
                  value={contactData.country}
                  onChange={(e) => setContactData({ ...contactData, country: e.target.value })}
                  required
                  placeholder="Country"
                />
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
                    <InputField
                      label="Phone"
                      name="emergencyContactPhone"
                      type="tel"
                      value={contactData.emergencyContactPhone}
                      onChange={(e) => setContactData({ ...contactData, emergencyContactPhone: e.target.value })}
                      placeholder="Emergency phone"
                    />
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
                <InputField
                  label="Chronic Conditions"
                  name="chronicConditions"
                  type="textarea"
                  value={medicalData.chronicConditions}
                  onChange={(e) => setMedicalData({ ...medicalData, chronicConditions: e.target.value })}
                  placeholder="Diabetes, hypertension, asthma, etc."
                />
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
                  name="insuranceProvider"
                  value={insuranceData.insuranceProvider}
                  onChange={(e) => setInsuranceData({ ...insuranceData, insuranceProvider: e.target.value })}
                  placeholder="Insurance company name"
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
                  label="Policy Holder Name"
                  name="policyHolderName"
                  value={insuranceData.policyHolderName}
                  onChange={(e) => setInsuranceData({ ...insuranceData, policyHolderName: e.target.value })}
                  placeholder="Name on insurance policy"
                />
                <InputField
                  label="Relationship to Policy Holder"
                  name="policyHolderRelation"
                  value={insuranceData.policyHolderRelation}
                  onChange={(e) => setInsuranceData({ ...insuranceData, policyHolderRelation: e.target.value })}
                  options={["Self", "Spouse", "Child", "Parent", "Other"]}
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
                      checked={insuranceData.isPrimaryInsurance}
                      onChange={(e) => setInsuranceData({ ...insuranceData, isPrimaryInsurance: e.target.checked })}
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

              {/* Modal Footer with Tab Navigation */}
              <div className="bg-slate-100 p-3 border-t-2 border-slate-200 flex justify-between items-center gap-3">
                {/* Previous/Next Tab Buttons */}
                <div className="flex gap-2">
                  {registerActiveTab !== "patient" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const tabs = ["patient", "contact", "medical", "insurance"];
                        const currentIndex = tabs.indexOf(registerActiveTab);
                        if (currentIndex > 0) setRegisterActiveTab(tabs[currentIndex - 1]);
                      }}
                      className="px-4 py-2 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition border-2 border-slate-300"
                    >
                      ← Previous
                    </motion.button>
                  )}
                  {registerActiveTab !== "insurance" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const tabs = ["patient", "contact", "medical", "insurance"];
                        const currentIndex = tabs.indexOf(registerActiveTab);
                        if (currentIndex < tabs.length - 1) setRegisterActiveTab(tabs[currentIndex + 1]);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition"
                    >
                      Next →
                    </motion.button>
                  )}
                </div>

                {/* Register Button (only show on last tab when valid) */}
                <div className="flex gap-2">
                  {registerActiveTab === "insurance" && (
                    <motion.button
                      whileHover={{ scale: isAllTabsValid() ? 1.02 : 1 }}
                      whileTap={{ scale: isAllTabsValid() ? 0.98 : 1 }}
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
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Patients List View */}
        {activeView === "list" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-900">Patients List</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 rounded-lg font-semibold hover:from-teal-100 hover:to-cyan-100 transition flex items-center gap-2"
              >
                {showFilters ? "🔼 Hide Filters" : "🔽 Show Filters"}
              </motion.button>
            </div>

            {/* Global Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by name, email, or phone number..."
                  className="w-full px-4 py-3 pl-12 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-coral-50 to-peach-50 rounded-xl p-6 mb-6 border-2 border-coral-200">
                    <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                      <span>🎯</span> Advanced Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={filters.firstName}
                          onChange={(e) => setFilters({ ...filters, firstName: e.target.value })}
                          placeholder="Filter by first name"
                          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={filters.lastName}
                          onChange={(e) => setFilters({ ...filters, lastName: e.target.value })}
                          placeholder="Filter by last name"
                          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={filters.dateOfBirth}
                          onChange={(e) => setFilters({ ...filters, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Gender</label>
                        <select
                          value={filters.gender}
                          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                        >
                          <option value="">All Genders</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                          className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                        >
                          <option value="">All Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={clearFilters}
                          className="w-full px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Table */}
              <div>
                {/* Filter Section */}
                <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">Filter Patients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={filterData.firstName}
                        onChange={(e) => setFilterData({ ...filterData, firstName: e.target.value })}
                        placeholder="Search by first name"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={filterData.lastName}
                        onChange={(e) => setFilterData({ ...filterData, lastName: e.target.value })}
                        placeholder="Search by last name"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={filterData.dateOfBirth}
                        onChange={(e) => setFilterData({ ...filterData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Patient ID</label>
                      <input
                        type="text"
                        value={filterData.patientId}
                        onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                        placeholder="Enter patient ID"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Clinic ID</label>
                      <input
                        type="text"
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            fetchClinicPatients();
                          }
                        }}
                        placeholder="Enter clinic ID"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchClinicPatients}
                        disabled={loadingClinicPatients || (!selectedClinicId.trim() && !filterData.patientId.trim() && !filterData.firstName.trim() && !filterData.lastName.trim() && !filterData.dateOfBirth.trim())}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition shadow-md ${
                          loadingClinicPatients || (!selectedClinicId.trim() && !filterData.patientId.trim() && !filterData.firstName.trim() && !filterData.lastName.trim() && !filterData.dateOfBirth.trim())
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg'
                        }`}
                      >
                        {loadingClinicPatients ? '⏳ Searching...' : '🔍 Search'}
                      </motion.button>
                      <button
                        onClick={() => {
                          setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" });
                          setSelectedClinicId("");
                          setClinicPatientsData([]);
                          setClinicError("");
                          setSearchPerformed(false);
                        }}
                        className="flex-1 px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clinic Search Results */}
                {loadingClinicPatients && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 mb-6"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block text-6xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-blue-700 text-lg font-semibold">Loading patients...</p>
                    <p className="text-blue-600 text-sm mt-2">Fetching data for Clinic ID: {selectedClinicId}</p>
                  </motion.div>
                )}

                {clinicError && !loadingClinicPatients && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6 text-center mb-6"
                  >
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-900 mb-2">Unable to Load Patients</h3>
                    <p className="text-red-700">{clinicError}</p>
                  </motion.div>
                )}

                {/* No Results Found Message */}
                {!loadingClinicPatients && !clinicError && clinicPatients.length === 0 && searchPerformed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-300 p-10 text-center shadow-lg mb-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="text-8xl mb-6"
                    >
                      🔍❌
                    </motion.div>
                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-4">
                      Oops! No Patients Found
                    </h3>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-4 border-2 border-amber-200">
                      <p className="text-lg font-semibold text-amber-900 mb-3">
                        We searched high and low, but couldn't find any patients matching:
                      </p>
                      <div className="space-y-2 text-left max-w-md mx-auto">
                        {selectedClinicId && (
                          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
                            <span className="text-amber-700 font-semibold">🏥 Clinic ID:</span>
                            <span className="text-amber-900 font-bold">{selectedClinicId}</span>
                          </div>
                        )}
                        {filterData.patientId && (
                          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
                            <span className="text-amber-700 font-semibold">🆔 Patient ID:</span>
                            <span className="text-amber-900 font-bold">{filterData.patientId}</span>
                          </div>
                        )}
                        {filterData.firstName && (
                          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
                            <span className="text-amber-700 font-semibold">👤 First Name:</span>
                            <span className="text-amber-900 font-bold">{filterData.firstName}</span>
                          </div>
                        )}
                        {filterData.lastName && (
                          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
                            <span className="text-amber-700 font-semibold">👥 Last Name:</span>
                            <span className="text-amber-900 font-bold">{filterData.lastName}</span>
                          </div>
                        )}
                        {filterData.dateOfBirth && (
                          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
                            <span className="text-amber-700 font-semibold">🎂 Date of Birth:</span>
                            <span className="text-amber-900 font-bold">{filterData.dateOfBirth}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-600 text-lg mb-3">
                      Maybe they're playing hide and seek? 🙈
                    </p>
                    <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed mb-4">
                      Try adjusting your search criteria or double-check the information. 
                      Perhaps the patient is registered under a different clinic?
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" });
                        setSelectedClinicId("");
                        setClinicPatientsData([]);
                        setClinicError("");
                        setSearchPerformed(false);
                      }}
                      className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      🔄 Clear Search & Try Again
                    </motion.button>
                  </motion.div>
                )}

                {clinicPatients.length > 0 && !loadingClinicPatients && (
                  <div className="mb-6">
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 flex justify-between items-center bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-5 border-2 border-emerald-200 shadow-md"
                    >
                      <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                        <span className="text-2xl">👥</span> 
                        <span>Patients at Clinic <span className="text-teal-600">#{selectedClinicId}</span></span>
                      </h3>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-emerald-300 shadow-sm">
                        <span className="text-sm text-emerald-700 font-medium">Total:</span>
                        <span className="font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">{clinicPatients.length}</span>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {clinicPatients.map((patientData, idx) => {
                        const patient = patientData || {};
                        
                        return (
                        <motion.div
                          key={patient.patientId || patient.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.03, y: -8 }}
                          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                          
                          <div className="relative flex items-center gap-4 mb-5">
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.6 }}
                              className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white"
                            >
                              {(patient.patientFirstName || 'P').charAt(0)}{(patient.patientLastName || 'N').charAt(0)}
                            </motion.div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-700">
                                {patient.patientFirstName || ''} {patient.patientLastName || ''}
                              </h4>
                              <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full inline-block">
                                ID: {patient.patientId || 'N/A'}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 10 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate('/calendar', { 
                                state: { 
                                  patientData: {
                                    patientId: patient.patientId,
                                    patientName: `${patient.patientFirstName || ''} ${patient.patientLastName || ''}`.trim(),
                                    patientFirstName: patient.patientFirstName,
                                    patientLastName: patient.patientLastName,
                                    patientPhone: patient.patientPhone || '',
                                    patientEmail: patient.patientEmail || '',
                                    patientDOB: patient.patientDOB,
                                    patientGender: patient.patientGender,
                                    patientBloodType: patient.patientBloodType
                                  }
                                } 
                              })}
                              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                              title="Book Appointment"
                            >
                              📅
                            </motion.button>
                          </div>
                          
                          <div className="relative space-y-3 mb-5">
                            <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-indigo-200">
                              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                                🆔 Entity ID:
                              </span>
                              <span className="text-sm font-bold text-indigo-900">{patient.patientEntityID || ''}</span>
                            </div>
                            <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-indigo-200">
                              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                                🎂 DOB:
                              </span>
                              <span className="text-sm font-bold text-indigo-900">
                                {patient.patientDOB ? new Date(patient.patientDOB).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-indigo-200">
                              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                                {patient.patientGender === 'Male' ? '👨' : '👩'} Gender:
                              </span>
                              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                patient.patientGender === 'Male' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-pink-100 text-pink-700'
                              }`}>
                                {patient.patientGender || ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-indigo-200">
                              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                                🩸 Blood Type:
                              </span>
                              <span className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full">{patient.patientBloodType || ''}</span>
                            </div>
                          </div>

                          <div className="relative flex gap-2 pt-4 border-t-2 border-indigo-200">
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                setLoadingPatientDetails(true);
                                setShowPatientModal(true);
                                setIsEditMode(false);
                                try {
                                  const fullProfile = await getPatientFullProfile(patient.patientId);
                                  console.log("Full Patient Profile Response:", fullProfile);
                                  console.log("Patient:", fullProfile?.patient);
                                  console.log("Contact:", fullProfile?.patientContact);
                                  console.log("Medical Info:", fullProfile?.patientMedicalInfo);
                                  console.log("Insurance:", fullProfile?.patientInsurance);
                                  setSelectedPatient(fullProfile);
                                  setEditedPatient(fullProfile);
                                } catch (error) {
                                  console.error("Error fetching patient profile:", error);
                                } finally {
                                  setLoadingPatientDetails(false);
                                }
                              }}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition shadow-md hover:shadow-lg text-sm"
                            >
                              👁️ View
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                setLoadingPatientDetails(true);
                                setShowPatientModal(true);
                                setIsEditMode(true);
                                try {
                                  const fullProfile = await getPatientFullProfile(patient.patientId);
                                  console.log("Full Patient Profile Response (Edit):", fullProfile);
                                  console.log("Patient:", fullProfile?.patient);
                                  console.log("Contact:", fullProfile?.patientContact);
                                  console.log("Medical Info:", fullProfile?.patientMedicalInfo);
                                  console.log("Insurance:", fullProfile?.patientInsurance);
                                  setSelectedPatient(fullProfile);
                                  setEditedPatient(fullProfile);
                                } catch (error) {
                                  console.error("Error fetching patient profile:", error);
                                } finally {
                                  setLoadingPatientDetails(false);
                                }
                              }}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg text-sm"
                            >
                              ✏️ Edit
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setPatientToDelete(patient);
                                setShowDeleteConfirmModal(true);
                              }}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-rose-700 transition shadow-md hover:shadow-lg text-sm"
                            >
                              🗑️ Delete
                            </motion.button>
                          </div>
                        </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Funny Empty State Message - Only show when no clinic selected */}
                {!selectedClinicId && !loadingClinicPatients && clinicPatients.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl border-2 border-dashed border-purple-300 shadow-lg"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, -10, 10, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                      className="text-8xl mb-6"
                    >
                      🕵️
                    </motion.div>
                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
                      Ready to Find Your Patients?
                    </h3>
                    <p className="text-slate-600 text-lg mb-2">
                      🎯 Enter a <span className="font-bold text-purple-600">Clinic ID</span> above and hit that Search button!
                    </p>
                    <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                      Our super-powered search will fetch real-time patient data faster than you can say "dental hygiene"! 🦷✨
                    </p>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="mt-8 text-4xl"
                    >
                      👆
                    </motion.div>
                  </motion.div>
                )}
              </div>
          </div>
        )}
      </div>

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
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSuccessModal(false);
                      setActiveView("list");
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Add Another
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
            onClick={() => setShowPatientModal(false)}
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
                    onClick={() => setShowPatientModal(false)}
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
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-cream-50 to-peach-50">
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
                    {/* Basic Information */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-coral-200">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-coral-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-coral-100 to-peach-100 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-amber-900">Basic Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">First Name</label>
                          <input
                            type="text"
                            value={isEditMode ? editedPatient?.patient?.patientFirstName || '' : selectedPatient?.patient?.patientFirstName || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patient: { ...editedPatient.patient, patientFirstName: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 text-slate-700 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Last Name</label>
                          <input
                            type="text"
                            value={isEditMode ? editedPatient?.patient?.patientLastName || '' : selectedPatient?.patient?.patientLastName || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patient: { ...editedPatient.patient, patientLastName: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 text-slate-700 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Clinic ID</label>
                          <input
                            type="text"
                            value={selectedPatient?.patient?.clinicID || selectedPatient?.patient?.patientEntityID || ''}
                            disabled
                            className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Date of Birth</label>
                          <input
                            type="date"
                            value={isEditMode ? editedPatient?.patient?.patientDOB?.split('T')[0] || '' : selectedPatient?.patient?.patientDOB?.split('T')[0] || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patient: { ...editedPatient.patient, patientDOB: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 text-slate-700 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Gender</label>
                          {isEditMode ? (
                            <select
                              value={editedPatient?.patient?.patientGender || ''}
                              onChange={(e) => setEditedPatient({
                                ...editedPatient,
                                patient: { ...editedPatient.patient, patientGender: e.target.value }
                              })}
                              className="w-full mt-1.5 px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-stone-700 transition-colors"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={selectedPatient?.patient?.patientGender || ''}
                              disabled
                              className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-lg disabled:bg-slate-50 disabled:text-slate-500 text-slate-700 transition-colors"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Blood Type</label>
                          {isEditMode ? (
                            <select
                              value={editedPatient?.patient?.patientBloodType || ''}
                              onChange={(e) => setEditedPatient({
                                ...editedPatient,
                                patient: { ...editedPatient.patient, patientBloodType: e.target.value }
                              })}
                              className="w-full mt-1.5 px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-stone-700 transition-colors"
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
                              value={selectedPatient?.patient?.patientBloodType || ''}
                              disabled
                              className="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-lg disabled:bg-slate-50 disabled:text-slate-500 text-slate-700 transition-colors"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-teal-200">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-teal-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-amber-900">Contact Information</h3>
                      </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Phone Number</label>
                            <input
                              type="text"
                              value={isEditMode ? editedPatient?.patientContact?.patientPhone || '' : selectedPatient?.patientContact?.patientPhone || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientPhone: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Email Address</label>
                            <input
                              type="email"
                              value={isEditMode ? editedPatient?.patientContact?.patientEmail || '' : selectedPatient?.patientContact?.patientEmail || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientEmail: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-slate-600">Address</label>
                            <input
                              type="text"
                              value={isEditMode ? editedPatient?.patientContact?.patientAddress || '' : selectedPatient?.patientContact?.patientAddress || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientAddress: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">City</label>
                            <input
                              type="text"
                              value={isEditMode ? editedPatient?.patientContact?.patientCity || '' : selectedPatient?.patientContact?.patientCity || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientCity: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Emergency Contact</label>
                            <input
                              type="text"
                              value={isEditMode ? editedPatient?.patientContact?.patientEmergencyContact || '' : selectedPatient?.patientContact?.patientEmergencyContact || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientContact: { ...editedPatient.patientContact, patientEmergencyContact: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                    {/* Medical Information */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-amber-200">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-amber-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-amber-900">Medical Information</h3>
                      </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Allergies</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.patientAllergies || '' : selectedPatient?.patientMedicalInfo?.patientAllergies || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, patientAllergies: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Current Medications</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.patientCurrentMedications || '' : selectedPatient?.patientMedicalInfo?.patientCurrentMedications || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, patientCurrentMedications: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Chronic Diseases</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.chronicDiseases || '' : selectedPatient?.patientMedicalInfo?.chronicDiseases || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, chronicDiseases: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Medical History</label>
                            <textarea
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.medicalHistory || '' : selectedPatient?.patientMedicalInfo?.medicalHistory || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, medicalHistory: e.target.value }
                              })}
                              disabled={!isEditMode}
                              rows="2"
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Primary Physician</label>
                            <input
                              type="text"
                              value={isEditMode ? editedPatient?.patientMedicalInfo?.patientPrimaryPhysician || '' : selectedPatient?.patientMedicalInfo?.patientPrimaryPhysician || ''}
                              onChange={(e) => isEditMode && setEditedPatient({
                                ...editedPatient,
                                patientMedicalInfo: { ...editedPatient.patientMedicalInfo, patientPrimaryPhysician: e.target.value }
                              })}
                              disabled={!isEditMode}
                              className="w-full mt-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-stone-100 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-600">Number of Visits</label>
                            <input
                              type="number"
                              value={selectedPatient?.patientMedicalInfo?.no_of_visits || 0}
                              disabled
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-100"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-slate-600">Last Visited Date</label>
                            <input
                              type="date"
                              value={selectedPatient?.patientMedicalInfo?.lastVisitedDate?.split('T')[0] || ''}
                              disabled
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-100"
                            />
                          </div>
                        </div>
                      </div>

                    {/* Insurance Information */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-cyan-200">
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-cyan-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-amber-900">Insurance Information</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-600">Insurance Provider</label>
                          <input
                            type="text"
                            value={isEditMode ? editedPatient?.patientInsurance?.patientInsuranceProvider || '' : selectedPatient?.patientInsurance?.patientInsuranceProvider || ''}
                            onChange={(e) => isEditMode && setEditedPatient({
                              ...editedPatient,
                              patientInsurance: { ...editedPatient.patientInsurance, patientInsuranceProvider: e.target.value }
                            })}
                            disabled={!isEditMode}
                            className="w-full mt-1.5 px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:bg-stone-100 disabled:text-stone-500 text-stone-700 transition-colors"
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
                            
                            // Reload patients using the same search criteria
                            const searchParams = {};
                            
                            if (selectedClinicId.trim()) {
                              const clinicId = parseInt(selectedClinicId);
                              if (!isNaN(clinicId)) {
                                searchParams.clinicId = clinicId;
                              }
                            }
                            
                            if (filterData.patientId.trim()) {
                              const patientId = parseInt(filterData.patientId);
                              if (!isNaN(patientId)) {
                                searchParams.patientId = patientId;
                              }
                            }
                            
                            if (filterData.firstName.trim()) {
                              searchParams.firstName = filterData.firstName.trim();
                            }
                            
                            if (filterData.lastName.trim()) {
                              searchParams.lastName = filterData.lastName.trim();
                            }
                            
                            if (filterData.dateOfBirth.trim()) {
                              searchParams.dob = filterData.dateOfBirth.trim();
                            }
                            
                            // Only refresh if there are search parameters
                            if (Object.keys(searchParams).length > 0) {
                              const patientsData = await searchPatients(searchParams);
                              setClinicPatientsData(patientsData);
                            }
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
                          setShowPatientModal(false);
                          setIsEditMode(false);
                          setEditedPatient(null);
                          setSelectedPatient(null);
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
                        onClick={() => setShowPatientModal(false)}
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
              // Redirect back to clinic-based patient list
              if (selectedClinicId) {
                // Stay on same page but reset search
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
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
                    if (selectedClinicId) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
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
                        
                        // Refresh patient list using the same search criteria
                        const searchParams = {};
                        
                        if (selectedClinicId.trim()) {
                          const clinicId = parseInt(selectedClinicId);
                          if (!isNaN(clinicId)) {
                            searchParams.clinicId = clinicId;
                          }
                        }
                        
                        if (filterData.patientId.trim()) {
                          const patientId = parseInt(filterData.patientId);
                          if (!isNaN(patientId)) {
                            searchParams.patientId = patientId;
                          }
                        }
                        
                        if (filterData.firstName.trim()) {
                          searchParams.firstName = filterData.firstName.trim();
                        }
                        
                        if (filterData.lastName.trim()) {
                          searchParams.lastName = filterData.lastName.trim();
                        }
                        
                        if (filterData.dateOfBirth.trim()) {
                          searchParams.dob = filterData.dateOfBirth.trim();
                        }
                        
                        // Only refresh if there are search parameters
                        if (Object.keys(searchParams).length > 0) {
                          const patients = await searchPatients(searchParams);
                          setClinicPatientsData(patients);
                        }
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
                  <h2 className="text-2xl font-bold">📝 Add Patient Visit</h2>
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
                <form onSubmit={async (e) => {
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
                          📝 Write Prescription
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
                      {savingVisit ? "💾 Saving..." : selectedPatientForVisit ? "💾 Save Visit" : "🔒 Select Patient First"}
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
                        // Print functionality - excludes medical conditions
                        const printWindow = window.open('', '_blank');
                        const prescriptionContent = `
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Prescription - ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}</title>
                              <style>
                                body {
                                  font-family: 'Times New Roman', serif;
                                  padding: 40px;
                                  max-width: 800px;
                                  margin: 0 auto;
                                }
                                .header {
                                  text-align: center;
                                  border-bottom: 3px double #333;
                                  padding-bottom: 20px;
                                  margin-bottom: 30px;
                                }
                                .header h1 {
                                  margin: 0;
                                  color: ${prescriptionColor};
                                  font-size: 28px;
                                }
                                .header p {
                                  margin: 5px 0;
                                  color: #666;
                                }
                                .section {
                                  margin-bottom: 20px;
                                }
                                .section-title {
                                  font-weight: bold;
                                  color: ${prescriptionColor};
                                  border-bottom: 1px solid #ddd;
                                  padding-bottom: 5px;
                                  margin-bottom: 10px;
                                  font-size: 16px;
                                }
                                .patient-info {
                                  display: grid;
                                  grid-template-columns: 1fr 1fr;
                                  gap: 10px;
                                  margin-bottom: 20px;
                                }
                                .info-item {
                                  padding: 5px 0;
                                }
                                .info-label {
                                  font-weight: bold;
                                  color: #333;
                                }
                                .prescription-body {
                                  white-space: pre-wrap;
                                  font-family: 'Courier New', monospace;
                                  background: #f9f9f9;
                                  padding: 20px;
                                  border-radius: 8px;
                                  border-left: 4px solid ${prescriptionColor};
                                  min-height: 200px;
                                }
                                .footer {
                                  margin-top: 60px;
                                  text-align: right;
                                }
                                .signature {
                                  display: inline-block;
                                  text-align: center;
                                }
                                .signature-line {
                                  width: 250px;
                                  border-top: 2px solid #333;
                                  margin-bottom: 10px;
                                }
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
                                <div class="prescription-body">${prescriptionText || 'No prescription provided'}</div>
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
                        printWindow.document.write(prescriptionContent);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🖨️</span>
                      <span>Print</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Download as PDF simulation (would need actual PDF library in production)
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

PRESCRIPTION
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
                      onClick={() => {
                        if (selectedPatientForVisit?.patientEmail) {
                          // Simulate email send - would integrate with backend email service
                          const mailtoLink = `mailto:${selectedPatientForVisit.patientEmail}?subject=Your Medical Prescription from ${CURRENT_DOCTOR.name}&body=Dear ${selectedPatientForVisit.patientFirstName},\n\nPlease find your prescription below:\n\n${prescriptionText}\n\nBest regards,\n${CURRENT_DOCTOR.name}\n${CURRENT_DOCTOR.registrationNumber}`;
                          window.location.href = mailtoLink;
                        } else {
                          alert("📧 Patient email not available. Please add email to patient profile.");
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📧</span>
                      <span>Email to Patient</span>
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
                          const smsText = `Dear ${selectedPatientForVisit.patientFirstName}, your prescription from ${CURRENT_DOCTOR.name}: ${prescriptionText.substring(0, 100)}... Visit our clinic for full details.`;
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
                        const whatsappText = `*Medical Prescription*\n\nFrom: ${CURRENT_DOCTOR.name}\nReg. No: ${CURRENT_DOCTOR.registrationNumber}\n\nPatient: ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}\n\n*Prescription:*\n${prescriptionText}`;
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
                        const prescriptionFull = `MEDICAL PRESCRIPTION\n\n${CURRENT_DOCTOR.name}\n${CURRENT_DOCTOR.specialization}\nReg. No: ${CURRENT_DOCTOR.registrationNumber}\n\nPatient: ${selectedPatientForVisit?.patientFirstName} ${selectedPatientForVisit?.patientLastName}\nPatient ID: ${selectedPatientForVisit?.patientId}\nDate: ${newVisit.visitDate}\n\nPRESCRIPTION:\n${prescriptionText}`;
                        navigator.clipboard.writeText(prescriptionFull);
                        alert("✅ Prescription copied to clipboard!");
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📋</span>
                      <span>Copy to Clipboard</span>
                    </motion.button>
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
                        setNewVisit({ ...newVisit, prescriptions: prescriptionText });
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
                        setNewVisit({ ...newVisit, prescriptions: prescriptionText });
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
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                {/* Patient Search Section */}
                <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
                  <h4 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <span>🔍</span> Search Patient
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                        <span>🏥</span> Clinic (Disabled for now)
                      </label>
                      <select
                        disabled
                        value={patientSearchForm.clinicId}
                        onChange={(e) => setPatientSearchForm({ ...patientSearchForm, clinicId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed outline-none"
                      >
                        <option value="">Select Clinic</option>
                        {clinicsList.map(clinic => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            {clinic.clinicName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span>🆔</span> Patient ID
                      </label>
                      <input
                        type="number"
                        value={patientSearchForm.patientId}
                        onChange={(e) => setPatientSearchForm({ ...patientSearchForm, patientId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Enter Patient ID"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span>👤</span> First Name
                      </label>
                      <input
                        type="text"
                        value={patientSearchForm.firstName}
                        onChange={(e) => setPatientSearchForm({ ...patientSearchForm, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Enter First Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <span>👤</span> Last Name
                      </label>
                      <input
                        type="text"
                        value={patientSearchForm.lastName}
                        onChange={(e) => setPatientSearchForm({ ...patientSearchForm, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Enter Last Name"
                      />
                    </div>
                  </div>
                  
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={patientSearchLoading || (!patientSearchForm.patientId && !patientSearchForm.firstName && !patientSearchForm.lastName)}
                    onClick={async () => {
                      setPatientSearchLoading(true);
                      setPatientNotFound(false);
                      setSearchedPatient(null);
                      
                      try {
                        const searchParams = {};
                        if (patientSearchForm.patientId) searchParams.patientId = parseInt(patientSearchForm.patientId);
                        if (patientSearchForm.firstName) searchParams.firstName = patientSearchForm.firstName;
                        if (patientSearchForm.lastName) searchParams.lastName = patientSearchForm.lastName;
                        
                        const results = await searchPatients(searchParams);
                        
                        if (results && results.length > 0) {
                          const patient = results[0];
                          setSearchedPatient(patient);
                          setPatientNotFound(false);
                          setBookingWithoutRegistration(false);
                          
                          // Auto-fill appointment form - API returns direct patient object
                          setAppointmentForm({
                            ...appointmentForm,
                            firstName: patient.patientFirstName || '',
                            lastName: patient.patientLastName || '',
                            phoneNumber: patient.patientPhone || '',
                            email: patient.patientEmail || ''
                          });
                        } else {
                          setPatientNotFound(true);
                          setSearchedPatient(null);
                          setBookingWithoutRegistration(false);
                        }
                      } catch (error) {
                        console.error('Patient search error:', error);
                        setPatientNotFound(true);
                        setSearchedPatient(null);
                      } finally {
                        setPatientSearchLoading(false);
                      }
                    }}
                    className={`w-full px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                      patientSearchLoading || (!patientSearchForm.patientId && !patientSearchForm.firstName && !patientSearchForm.lastName)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                    }`}
                  >
                    {patientSearchLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Search Patient</span>
                      </>
                    )}
                  </motion.button>
                  
                  {/* Patient Found Message */}
                  {searchedPatient && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl"
                    >
                      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                        <span>✅</span>
                        <span>Patient Found!</span>
                      </div>
                      <p className="text-sm text-emerald-600">
                        {searchedPatient.patientFirstName} {searchedPatient.patientLastName} - 
                        ID: {searchedPatient.patientId} | DOB: {searchedPatient.patientDOB ? new Date(searchedPatient.patientDOB).toLocaleDateString() : 'N/A'} | Gender: {searchedPatient.patientGender || 'N/A'}
                      </p>
                    </motion.div>
                  )}
                  
                  {/* Patient Not Found Message */}
                  {patientNotFound && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl"
                    >
                      <div className="flex items-center gap-2 text-rose-700 font-bold mb-3">
                        <span>❌</span>
                        <span>Patient Not Found</span>
                      </div>
                      <p className="text-sm text-rose-600 mb-3">
                        No patient found with the provided search criteria.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowNewAppointmentModal(false);
                            setActiveView('register');
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <span>➕</span>
                          <span>Register Patient</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setBookingWithoutRegistration(true);
                            setPatientNotFound(false);
                            // Clear the form for manual entry
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
                              roomNumber: "",
                              telehealthLink: "",
                              attendingPhysician: "",
                              status: "Scheduled",
                              isConfirmed: false,
                              billableAmount: "",
                              paidAmount: "",
                              pendingAmount: "",
                              paymentStatus: "Pending",
                              doctorId: ""
                            });
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <span>📝</span>
                          <span>Book Without Registration</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  try {
                    // Get default clinic ID (you may want to make this selectable)
                    const defaultClinicId = parseInt(localStorage.getItem('clinicId') || '1');
                    const enterpriseId = parseInt(localStorage.getItem('enterpriseId') || '1');
                    const userId = parseInt(localStorage.getItem('userId') || '1');
                    
                    // Convert time format from HH:mm to HH:mm:ss for TimeSpan
                    const startTimeSpan = appointmentForm.startTime ? `${appointmentForm.startTime}:00` : null;
                    const endTimeSpan = appointmentForm.endTime ? `${appointmentForm.endTime}:00` : null;
                    
                    // Calculate duration in minutes if both times are provided and not manually entered
                    let durationMinutes = appointmentForm.durationMinutes || null;
                    if (!durationMinutes && appointmentForm.startTime && appointmentForm.endTime) {
                      const [startHour, startMin] = appointmentForm.startTime.split(':').map(Number);
                      const [endHour, endMin] = appointmentForm.endTime.split(':').map(Number);
                      durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                    }
                    
                    // Build appointment model matching backend AppointmentsModel
                    const appointmentPayload = {
                      // References
                      enterpriseId: enterpriseId,
                      patientId: searchedPatient ? searchedPatient.patientId : 0, // 0 for walk-in/non-registered
                      clinicId: defaultClinicId,
                      doctorId: appointmentForm.doctorId ? parseInt(appointmentForm.doctorId) : null,
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
                      roomNumber: appointmentForm.roomNumber || null,
                      telehealthLink: appointmentForm.telehealthLink || null,
                      // Status & billing
                      status: appointmentForm.status || "Scheduled",
                      isConfirmed: appointmentForm.isConfirmed || false,
                      billableAmount: appointmentForm.billableAmount ? parseFloat(appointmentForm.billableAmount) : null,
                      paidAmount: appointmentForm.paidAmount ? parseFloat(appointmentForm.paidAmount) : null,
                      pendingAmount: appointmentForm.pendingAmount ? parseFloat(appointmentForm.pendingAmount) : null,
                      paymentStatus: appointmentForm.paymentStatus || "Pending",
                      // Audit
                      createdBy: userId
                    };
                    
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
                      roomNumber: "",
                      telehealthLink: "",
                      attendingPhysician: "",
                      status: "Scheduled",
                      isConfirmed: false,
                      billableAmount: "",
                      paidAmount: "",
                      pendingAmount: "",
                      paymentStatus: "Pending",
                      doctorId: ""
                    });
                    setPatientSearchForm({
                      clinicId: "",
                      patientId: "",
                      firstName: "",
                      lastName: ""
                    });
                    setSearchedPatient(null);
                    setPatientNotFound(false);
                    setBookingWithoutRegistration(false);
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>📞</span> Phone Number * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="tel"
                        required
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.phoneNumber}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, phoneNumber: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="555-0123"
                      />
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
                        value={appointmentForm.date}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
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
                          <option key={time} value={time}>{time}</option>
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
                          <option key={time} value={time}>{time}</option>
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
                        {["Consultation", "Follow-up", "Telehealth", "Emergency", "Routine Checkup", "Treatment", "Surgery"].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>👨‍⚕️</span> Doctor ID {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="number"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.doctorId}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="Enter doctor ID (optional)"
                      />
                    </div>
                  </div>

                  {/* Attending Physician & Room Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>🩺</span> Attending Physician {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="text"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.attendingPhysician}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, attendingPhysician: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="Dr. Smith"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>🚪</span> Room Number {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="text"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.roomNumber}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, roomNumber: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="Room 101"
                      />
                    </div>
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
                      <span>🩺</span> Reason for Visit * {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!searchedPatient && !bookingWithoutRegistration}
                      value={appointmentForm.reasonForVisit}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reasonForVisit: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                      placeholder="E.g., Tooth pain, Routine cleaning, Follow-up"
                    />
                  </div>

                  {/* Status & Payment - Animated Selectors */}
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-bold mb-3 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>📊</span> Appointment Status {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!searchedPatient && !bookingWithoutRegistration ? 'opacity-50 pointer-events-none' : ''}`}>
                        {[
                          { value: 'Scheduled', icon: '📅', color: 'from-blue-400 to-blue-600', ring: 'ring-blue-300' },
                          { value: 'Completed', icon: '✅', color: 'from-green-400 to-green-600', ring: 'ring-green-300' },
                          { value: 'Cancelled', icon: '❌', color: 'from-red-400 to-red-600', ring: 'ring-red-300' },
                          { value: 'NoShow', icon: '👻', color: 'from-gray-400 to-gray-600', ring: 'ring-gray-300' }
                        ].map((statusOpt) => (
                          <motion.button
                            key={statusOpt.value}
                            type="button"
                            disabled={!searchedPatient && !bookingWithoutRegistration}
                            whileHover={searchedPatient || bookingWithoutRegistration ? { scale: 1.05, y: -3 } : {}}
                            whileTap={searchedPatient || bookingWithoutRegistration ? { scale: 0.95 } : {}}
                            onClick={() => setAppointmentForm({ ...appointmentForm, status: statusOpt.value })}
                            className={`relative p-4 rounded-xl font-bold text-white transition-all duration-300 ${
                              appointmentForm.status === statusOpt.value
                                ? `bg-gradient-to-br ${statusOpt.color} ring-4 ${statusOpt.ring} shadow-xl`
                                : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 hover:from-slate-300 hover:to-slate-400'
                            }`}
                          >
                            {appointmentForm.status === statusOpt.value && (
                              <motion.div
                                layoutId="newAppointmentStatusSelector"
                                className="absolute inset-0 bg-white/20 rounded-xl"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <div className="relative flex flex-col items-center gap-1">
                              <motion.span 
                                className="text-2xl"
                                animate={appointmentForm.status === statusOpt.value ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                              >
                                {statusOpt.icon}
                              </motion.span>
                              <span className="text-xs">{statusOpt.value}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-3 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>💳</span> Payment Status {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!searchedPatient && !bookingWithoutRegistration ? 'opacity-50 pointer-events-none' : ''}`}>
                        {[
                          { value: 'Pending', icon: '⏳', color: 'from-amber-400 to-orange-500', ring: 'ring-amber-300' },
                          { value: 'Paid', icon: '💚', color: 'from-green-400 to-emerald-600', ring: 'ring-green-300' },
                          { value: 'Partial', icon: '💛', color: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-300' },
                          { value: 'Invoice', icon: '📄', color: 'from-blue-400 to-indigo-500', ring: 'ring-blue-300' }
                        ].map((paymentOpt) => (
                          <motion.button
                            key={paymentOpt.value}
                            type="button"
                            disabled={!searchedPatient && !bookingWithoutRegistration}
                            whileHover={searchedPatient || bookingWithoutRegistration ? { scale: 1.05, y: -3 } : {}}
                            whileTap={searchedPatient || bookingWithoutRegistration ? { scale: 0.95 } : {}}
                            onClick={() => setAppointmentForm({ ...appointmentForm, paymentStatus: paymentOpt.value })}
                            className={`relative p-4 rounded-xl font-bold text-white transition-all duration-300 ${
                              appointmentForm.paymentStatus === paymentOpt.value
                                ? `bg-gradient-to-br ${paymentOpt.color} ring-4 ${paymentOpt.ring} shadow-xl`
                                : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 hover:from-slate-300 hover:to-slate-400'
                            }`}
                          >
                            {appointmentForm.paymentStatus === paymentOpt.value && (
                              <motion.div
                                layoutId="newAppointmentPaymentSelector"
                                className="absolute inset-0 bg-white/20 rounded-xl"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <div className="relative flex flex-col items-center gap-1">
                              <motion.span 
                                className="text-2xl"
                                animate={appointmentForm.paymentStatus === paymentOpt.value ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                              >
                                {paymentOpt.icon}
                              </motion.span>
                              <span className="text-xs">{paymentOpt.value}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Amounts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>💳</span> Billable Amount (₹) {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.billableAmount}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, billableAmount: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>💰</span> Paid Amount (₹) {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.paidAmount}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, paidAmount: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${!searchedPatient && !bookingWithoutRegistration ? 'text-slate-400' : 'text-slate-700'}`}>
                        <span>💵</span> Pending Amount (₹) {!searchedPatient && !bookingWithoutRegistration && '(Search patient first)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        value={appointmentForm.pendingAmount}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, pendingAmount: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${!searchedPatient && !bookingWithoutRegistration ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-cyan-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'}`}
                        placeholder="0.00"
                      />
                    </div>
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

                  {/* Confirmation Status */}
                  <div>
                    <label className={`flex items-center gap-3 cursor-pointer ${!searchedPatient && !bookingWithoutRegistration ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        disabled={!searchedPatient && !bookingWithoutRegistration}
                        checked={appointmentForm.isConfirmed}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, isConfirmed: e.target.checked })}
                        className="w-5 h-5 rounded border-2 border-cyan-300 text-cyan-600 focus:ring-4 focus:ring-cyan-100"
                      />
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span>✅</span> Mark as Confirmed
                      </span>
                    </label>
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
                    {/* Clinic ID - Mandatory */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>🏥</span> Clinic ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={appointmentFilter.clinicId}
                        onChange={(e) => setAppointmentFilter({ ...appointmentFilter, clinicId: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="Enter Clinic ID"
                      />
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

                    {/* Appointment Date */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <span>📅</span> Appointment Date
                      </label>
                      <input
                        type="date"
                        value={appointmentFilter.appointmentDate}
                        onChange={(e) => setAppointmentFilter({ ...appointmentFilter, appointmentDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      />
                    </div>
                  </div>

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
      <AnimatePresence>
        {selectedAppointmentDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
            onClick={() => {
              setSelectedAppointmentDetails(null);
              setIsEditingAppointment(false);
              setEditAppointmentForm(null);
            }}
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
                onClick={() => {
                  setSelectedAppointmentDetails(null);
                  setIsEditingAppointment(false);
                  setEditAppointmentForm(null);
                }}
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
                            {["Consultation", "Follow-up", "Telehealth", "Emergency", "Routine Checkup", "Treatment", "Surgery"].map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
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
                  </div>

                  {/* Billing Information */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>💰</span>
                      Billing Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Paid Amount</label>
                        {isEditingAppointment ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editAppointmentForm?.paidAmount || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, paidAmount: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="0.00"
                          />
                        ) : (
                          <p className="text-xl font-bold text-green-600 px-4 py-2">₹{selectedAppointmentDetails.paidAmount || 0}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 font-medium mb-1">Pending Amount</label>
                        {isEditingAppointment ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editAppointmentForm?.pendingAmount || ''}
                            onChange={(e) => setEditAppointmentForm({...editAppointmentForm, pendingAmount: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="0.00"
                          />
                        ) : (
                          <p className="text-xl font-bold text-amber-600 px-4 py-2">₹{selectedAppointmentDetails.pendingAmount || 0}</p>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm text-slate-500 font-medium mb-2">Payment Status</label>
                        {isEditingAppointment ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { value: 'Pending', icon: '⏳', color: 'from-amber-400 to-orange-500', ring: 'ring-amber-400' },
                              { value: 'Paid', icon: '💚', color: 'from-green-400 to-emerald-600', ring: 'ring-green-400' },
                              { value: 'Partial', icon: '💛', color: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400' },
                              { value: 'Invoice', icon: '📄', color: 'from-blue-400 to-indigo-500', ring: 'ring-blue-400' }
                            ].map((paymentOption) => (
                              <motion.button
                                key={paymentOption.value}
                                type="button"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditAppointmentForm({...editAppointmentForm, paymentStatus: paymentOption.value})}
                                className={`relative p-4 rounded-xl font-bold text-white transition-all duration-300 ${
                                  editAppointmentForm?.paymentStatus === paymentOption.value
                                    ? `bg-gradient-to-br ${paymentOption.color} ring-4 ${paymentOption.ring} shadow-xl scale-105`
                                    : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 hover:from-slate-300 hover:to-slate-400'
                                }`}
                              >
                                {editAppointmentForm?.paymentStatus === paymentOption.value && (
                                  <motion.div
                                    layoutId="paymentSelector"
                                    className="absolute inset-0 bg-white/20 rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                )}
                                <div className="relative flex flex-col items-center gap-1">
                                  <span className="text-2xl">{paymentOption.icon}</span>
                                  <span className="text-xs">{paymentOption.value}</span>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                            selectedAppointmentDetails.paymentStatus === 'Paid'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : selectedAppointmentDetails.paymentStatus === 'Partial'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              : 'bg-amber-100 text-amber-700 border border-amber-300'
                          }`}>
                            <span className="text-base">
                              {selectedAppointmentDetails.paymentStatus === 'Paid' ? '💚' :
                               selectedAppointmentDetails.paymentStatus === 'Partial' ? '💛' :
                               selectedAppointmentDetails.paymentStatus === 'Invoice' ? '📄' : '⏳'}
                            </span>
                            {selectedAppointmentDetails.paymentStatus || 'Pending'}
                          </span>
                        )}
                      </div>
                      {isEditingAppointment && (
                        <div className="md:col-span-3 mt-4">
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
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer Action Buttons */}
              <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-t-2 border-slate-200 flex gap-4">
                {isEditingAppointment ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsEditingAppointment(false);
                        setEditAppointmentForm(null);
                      }}
                      type="button"
                      className="flex-1 px-6 py-4 bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      ✖️ Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          const userId = localStorage.getItem('userId');
                          const enterpriseId = localStorage.getItem('enterpriseId');
                          const clinicId = localStorage.getItem('clinicId');
                          
                          // Prepare complete appointment payload matching backend model
                          const updatedAppointment = {
                            appointmentId: selectedAppointmentDetails.appointmentId,
                            patientId: parseInt(selectedAppointmentDetails.patientId) || parseInt(editAppointmentForm.patientId) || 0,
                            clinicId: parseInt(clinicId) || 0,
                            doctorId: parseInt(editAppointmentForm.doctorId) || parseInt(selectedAppointmentDetails.doctorId) || 0,
                            attendingPhysician: editAppointmentForm.attendingPhysician || '',
                            enterpriseId: parseInt(enterpriseId) || 0,
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
                            paidAmount: parseFloat(editAppointmentForm.paidAmount) || 0,
                            pendingAmount: parseFloat(editAppointmentForm.pendingAmount) || 0,
                            paymentStatus: editAppointmentForm.paymentStatus || 'Pending',
                            createdAt: selectedAppointmentDetails.createdAt,
                            updatedAt: new Date().toISOString(),
                            createdBy: parseInt(selectedAppointmentDetails.createdBy) || 0,
                            updatedBy: parseInt(userId) || 0
                          };
                          
                          console.log('Updating appointment with payload:', updatedAppointment);
                          
                          // Call update API with just the appointment object
                          const response = await updateAppointment(updatedAppointment);
                          console.log('Update response:', response);
                          
                          // Update the selected details
                          setSelectedAppointmentDetails({
                            ...selectedAppointmentDetails,
                            ...updatedAppointment
                          });
                          
                          // Update the list
                          setFilteredAppointmentsList(prev => 
                            prev.map(apt => 
                              apt.appointmentId === selectedAppointmentDetails.appointmentId 
                                ? { ...apt, ...updatedAppointment }
                                : apt
                            )
                          );
                          
                          // Exit edit mode
                          setIsEditingAppointment(false);
                          setEditAppointmentForm(null);
                          
                          // Show success popup
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedAppointmentDetails(null);
                      setIsEditingAppointment(false);
                      setEditAppointmentForm(null);
                    }}
                    type="button"
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Close
                  </motion.button>
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
    </div>
  );
}
