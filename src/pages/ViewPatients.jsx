import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { searchPatients } from "../services/patientService";
import { getFullPatientProfile, updateFullPatientProfile, listClinics } from "../api/hmsApi";
import { getUserAccess, getSelectedAccess } from "../services/authService";
import { getAppointmentsByFilters } from "../services/appointmentService";
import { request } from "../services/apiClient";
import FancyDatePicker from "../components/FancyDatePicker";
import { ServiceBillingModal } from "../components/ServiceBillingModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dantaLogo from "../assets/danta-logo.jpg";

// Extracts a single "Label: value" segment out of the packed medicalHistory
// string built by RegisterPatient.jsx (e.g. "Past Surgeries: X; Smoking: Y; ...").
// Returns "" if the label isn't present (e.g. records saved before a field existed).
const extractMedicalHistoryField = (historyStr, label) => {
  if (!historyStr || !historyStr.includes(`${label}:`)) return "";
  return historyStr.split(`${label}:`)[1].split(';')[0].trim();
};

// Rebuilds the packed medicalHistory string from the granular fields, in the
// exact same format RegisterPatient.jsx uses, so edits to the dropdowns/fields
// stay in sync with what's persisted.
const buildMedicalHistoryString = (data) => (
  `Past Surgeries: ${data.pastSurgeries || 'None'}; Smoking: ${data.smokingStatus || 'Unknown'}; Alcohol: ${data.alcoholConsumption || 'Unknown'}; Chewing Tobacco: ${data.chewingTobaccoStatus || 'Unknown'}; Exercise: ${data.exerciseFrequency || 'Unknown'}; Diet: ${data.dietaryRestrictions || 'None'}; Notes: ${data.notes || 'None'}`
);

// Reusable InputField component (similar to RegisterPatient)
const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", options = null, disabled = false }) => {
  // Debug logging for select fields
  if (options && name === "maritalStatus") {
    console.log(`🔧 InputField [${name}] value="${value}" options=${JSON.stringify(options.map(o => o.value))} disabled=${disabled}`);
  }
  
  return (
  <div className="mb-3">
    {type === "date" ? (
      <>
        <label className={`block text-xs font-medium mb-1 transition ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg transition ${
            disabled 
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
          }`}
        />
      </>
    ) : options ? (
      <>
        <label className={`block text-xs font-medium mb-1 transition ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg transition ${
            disabled 
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
          }`}
        >
          <option value="">Select {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </>
    ) : type === "textarea" ? (
      <>
        <label className={`block text-xs font-medium mb-1 transition ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg transition resize-none ${
            disabled 
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
          }`}
        />
      </>
    ) : (
      <>
        <label className={`block text-xs font-medium mb-1 transition ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg transition ${
            disabled 
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-stone-300 focus:ring-1 focus:ring-amber-400 focus:border-transparent"
          }`}
        />
      </>
    )}
  </div>
  );
};

export default function ViewPatients() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: "",
    mobileNumber: ""
  });
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editActiveTab, setEditActiveTab] = useState("patient");
  const [editIsLoading, setEditIsLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Edit form state (with all tabs like RegisterPatient)
  const [editPatientData, setEditPatientData] = useState({
    patientId: 0,
    patientFirstName: "",
    patientLastName: "",
    patientDOB: "",
    patientGender: "",
    patientBloodType: "",
    maritalStatus: "",
    enterpriseId: "",
    clinicID: "",
    isActive: true
  });

  const [editContactData, setEditContactData] = useState({
    patientPhoneNumber: "",
    patientAlternatePhoneNumber: "",
    patientEmail: "",
    patientAddressLine1: "",
    patientAddressLine2: "",
    patientCity: "",
    patientState: "",
    patientPostalCode: "",
    patientCountry: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: ""
  });

  const [editMedicalData, setEditMedicalData] = useState({
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    medicalHistory: "",
    patientMedicalHistory: "",
    pastSurgeries: "",
    familyMedicalHistory: "",
    smokingStatus: "",
    alcoholConsumption: "",
    chewingTobaccoStatus: "",
    exerciseFrequency: "",
    dietaryRestrictions: "",
    lastDentalVisit: "",
    notes: "",
    noOfVisits: 0,
    lastVisitedDate: ""
  });

  const [editInsuranceData, setEditInsuranceData] = useState({
    insuranceProvider: "",
    policyNumber: "",
    groupNumber: "",
    policyHolderName: "",
    policyHolderRelation: "",
    coverageStartDate: "",
    coverageEndDate: "",
    isPrimaryInsurance: true,
    copayAmount: ""
  });

  const [editVitalsData, setEditVitalsData] = useState({
    bloodsugar: "",
    bloodpressure: "",
    temperature: "",
    heartRate: "",
    weight: "",
    height: "",
    oxygenSaturation: ""
  });

  // Appointments viewing state
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [appointmentFromDate, setAppointmentFromDate] = useState("");
  const [appointmentToDate, setAppointmentToDate] = useState("");

  // Billing viewing state
  const [billingAppointments, setBillingAppointments] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");
  
  // Invoice details state
  const [selectedAppointmentForInvoices, setSelectedAppointmentForInvoices] = useState(null);
  const [invoicesList, setInvoicesList] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  
  // Invoice line items modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [lineItemsList, setLineItemsList] = useState([]);
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [showLineItemsModal, setShowLineItemsModal] = useState(false);

  // Appointment Detail Modal state
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [appointmentDetailLoading, setAppointmentDetailLoading] = useState(false);
  const [appointmentDetailError, setAppointmentDetailError] = useState("");
  const [showDetailInvoices, setShowDetailInvoices] = useState(false);
  const [detailInvoices, setDetailInvoices] = useState([]);
  const [detailInvoicesLoading, setDetailInvoicesLoading] = useState(false);
  
  // ServiceBillingModal state
  const [showServiceBillingModal, setShowServiceBillingModal] = useState(false);
  const [serviceBillingAppointment, setServiceBillingAppointment] = useState(null);
  const [serviceBillingInvoiceNumber, setServiceBillingInvoiceNumber] = useState(null);

  // Diagnostics Modal state
  const [diagnosticsData, setDiagnosticsData] = useState(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState("");

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" }
  ];

  const bloodGroupOptions = [
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" }
  ];

  const maritalStatusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Widowed", label: "Widowed" }
  ];

  // These option values must exactly match what RegisterPatient.jsx saves into
  // the packed medicalHistory string, otherwise the <select> shows blank even
  // though the value was parsed correctly.
  const smokingStatusOptions = [
    { value: "Non-smoker", label: "Non-smoker" },
    { value: "Former smoker", label: "Former smoker" },
    { value: "Current smoker", label: "Current smoker" }
  ];

  const alcoholConsumptionOptions = [
    { value: "Never", label: "Never" },
    { value: "Occasionally", label: "Occasionally" },
    { value: "Regularly", label: "Regularly" }
  ];

  const chewingTobaccoOptions = [
    { value: "Never", label: "Never" },
    { value: "Occasionally", label: "Occasionally" },
    { value: "Regularly", label: "Regularly" },
    { value: "Daily", label: "Daily" }
  ];

  const exerciseFrequencyOptions = [
    { value: "Sedentary", label: "Sedentary" },
    { value: "1-2 times/week", label: "1-2 times/week" },
    { value: "3-4 times/week", label: "3-4 times/week" },
    { value: "5+ times/week", label: "5+ times/week" }
  ];

  // Fetch clinics from token on mount
  useEffect(() => {
    const loadClinics = async () => {
      try {
        const userAccess = getUserAccess();
        const selectedAccess = getSelectedAccess();
        
        if (userAccess && userAccess.length > 0) {
          // Get clinics for the selected or first enterprise
          const currentAccess = selectedAccess || userAccess[0];
          
          // Extract unique clinic IDs from user access
          const clinicIds = [...new Set(userAccess.map(a => a.clinicId))];
          
          // Create clinic list from user access
          const userClinics = userAccess.map((access, idx) => ({
            clinicId: access.clinicId,
            clinicName: `Clinic ${access.clinicId}`
          }));
          
          // Remove duplicates
          const uniqueClinics = Array.from(new Map(userClinics.map(c => [c.clinicId, c])).values());
          setClinics(uniqueClinics);
          
          // Pre-select first clinic
          if (uniqueClinics.length > 0) {
            setFilterData(prev => ({...prev, clinicId: uniqueClinics[0].clinicId.toString()}));
          }
        }
      } catch (error) {
        console.error("Failed to load clinics:", error);
      }
    };
    
    loadClinics();
  }, []);

  // Prevent page scroll when modal is open
  useEffect(() => {
    if (showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal]);

  // Validate mobile number (expects 10 digits, country code added separately)
  const validateMobileNumber = (mobileNumber) => {
    // If empty, it's optional - no validation needed
    if (!mobileNumber || mobileNumber.trim() === "") {
      setMobileNumberError("");
      return true;
    }

    // Check if only numbers
    if (!/^\d+$/.test(mobileNumber)) {
      setMobileNumberError("⚠️ Mobile number should contain only digits");
      return false;
    }

    // Exactly 10 digits
    if (mobileNumber.length !== 10) {
      setMobileNumberError(`⚠️ Enter exactly 10 digits (${mobileNumber.length}/10)`);
      return false;
    }

    // Validation passed
    setMobileNumberError("");
    return true;
  };

  const handleSearchClick = async () => {
    // Validate mobile number before search
    if (!validateMobileNumber(filterData.mobileNumber)) {
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        firstName: filterData.firstName || undefined,
        lastName: filterData.lastName || undefined,
        dob: filterData.dateOfBirth || undefined,
        patientId: filterData.patientId ? parseInt(filterData.patientId) : undefined,
        clinicId: filterData.clinicId ? parseInt(filterData.clinicId) : undefined,
        mobilenumber: filterData.mobileNumber ? `+91${filterData.mobileNumber}` : undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      console.log('🔍 PATIENT SEARCH INITIATED with filters:', filterData);
      console.log('📝 Cleaned params:', params);
      const results = await searchPatients(params);
      console.log('📋 API SEARCH RESULTS:', results);
      console.log('📋 First result structure:', results?.[0]);
      setSearchResults(results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      patientId: "",
      clinicId: clinics.length > 0 ? clinics[0].clinicId.toString() : "",
      mobileNumber: ""
    });
    setMobileNumberError("");
    setSearchResults([]);
  };

  const handleEditClick = async (patientId) => {
    setEditIsLoading(true);
    setEditError("");
    setIsEditMode(false);
    try {
      let response = await getFullPatientProfile(patientId);
      console.log('═══════════════════════════════════════════');
      console.log('📋 FULL API RESPONSE (RAW):', response);
      console.log('═══════════════════════════════════════════');
      
      // Handle array response - API returns [{ patient, patientContact, ... }]
      if (Array.isArray(response) && response.length > 0) {
        response = response[0];
        console.log('📦 Extracted first element from array:', response);
      }
      
      // Extract nested objects from the response
      const patientInfo = response.patient || response;
      const contactInfo = response.patientContact || {};
      const medicalInfo = response.patientMedicalInfo || {};
      const insuranceInfo = response.patientInsurance || {};
      
      console.log('� EXTRACTED OBJECTS FROM API RESPONSE:');
      console.log('  Patient Info:', JSON.stringify(patientInfo, null, 2));
      console.log('  Contact Info:', JSON.stringify(contactInfo, null, 2));
      console.log('  Medical Info:', JSON.stringify(medicalInfo, null, 2));
      console.log('  Insurance Info:', JSON.stringify(insuranceInfo, null, 2));
      
      // Populate edit forms with correct field mapping
      const newPatientData = {
        patientId: patientInfo.patientId || 0,
        patientFirstName: patientInfo.patientFirstName || "",
        patientLastName: patientInfo.patientLastName || "",
        patientDOB: patientInfo.patientDOB ? patientInfo.patientDOB.split('T')[0] : "", // Extract date from datetime
        patientGender: patientInfo.patientGender || "",
        patientBloodType: patientInfo.patientBloodType || "",
        maritalStatus: patientInfo.maritalStatus || "",
        enterpriseId: patientInfo.enterpriseId || "",
        clinicID: patientInfo.clinicID || "",
        isActive: patientInfo.isActive !== false
      };
      
      console.log('🔍 PATIENT FIELD MAPPING:');
      console.log('  maritalStatus [CRITICAL]:', patientInfo.maritalStatus, '| TYPE:', typeof patientInfo.maritalStatus);
      console.log('  Available options:', maritalStatusOptions.map(m => m.value));
      const maritalMatch = maritalStatusOptions.find(m => m.value === patientInfo.maritalStatus);
      console.log('  Match found in options?', maritalMatch ? 'YES ✅ ' + maritalMatch.label : 'NO ❌ Value mismatch!');
      
      const newContactData = {
        patientPhoneNumber: contactInfo.patientPhone || "",
        patientAlternatePhoneNumber: contactInfo.patientAlternatePhone || "",
        patientEmail: contactInfo.patientEmail || "",
        patientAddressLine1: contactInfo.patientAddress || "",
        patientAddressLine2: contactInfo.patientAddressLine2 || "",
        patientCity: contactInfo.patientCity || "",
        patientState: contactInfo.patientState || "",
        patientPostalCode: contactInfo.patientPostalCode || "",
        patientCountry: contactInfo.patientCountry || "",
        emergencyContactName: contactInfo.patientEmergencyContact || "",
        emergencyContactPhone: contactInfo.emergencyContactPhone || "",
        emergencyContactRelation: contactInfo.emergencyContactRelation || ""
      };

      console.log('🏥 ALL MEDICAL INFO FIELDS FROM API:');
      Object.keys(medicalInfo).forEach(key => {
        console.log(`  ${key}:`, medicalInfo[key]);
      });
      
      const newMedicalData = {
        allergies: medicalInfo.patientAllergies || "",
        chronicConditions: medicalInfo.chronicDiseases || "",
        currentMedications: medicalInfo.patientCurrentMedications || "",
        medicalHistory: medicalInfo.medicalHistory || "",
        patientMedicalHistory: medicalInfo.patientMedicalHistory || "",
        pastSurgeries: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Past Surgeries'),
        familyMedicalHistory: medicalInfo.patientPrimaryPhysician || "",
        smokingStatus: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Smoking'),
        alcoholConsumption: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Alcohol'),
        chewingTobaccoStatus: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Chewing Tobacco'),
        exerciseFrequency: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Exercise'),
        dietaryRestrictions: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Diet'),
        lastDentalVisit: medicalInfo.lastVisitedDate ? medicalInfo.lastVisitedDate.split('T')[0] : "",
        notes: extractMedicalHistoryField(medicalInfo.medicalHistory, 'Notes'),
        noOfVisits: medicalInfo.noOfVisits || 0,
        lastVisitedDate: medicalInfo.lastVisitedDate ? medicalInfo.lastVisitedDate.split('T')[0] : ""
      };

      const newInsuranceData = {
        patientInsuranceProvider: insuranceInfo.patientInsuranceProvider || "",
        insuranceProviderId: insuranceInfo.insuranceProviderId || "",
        policyNumber: insuranceInfo.policyNumber || "",
        groupNumber: insuranceInfo.groupNumber || "",
        policyHolderName: insuranceInfo.policyHolderName || "",
        relationshipToPolicyHolder: insuranceInfo.relationshipToPolicyHolder || "",
        coverageStartDate: insuranceInfo.coverageStartDate ? insuranceInfo.coverageStartDate.split('T')[0] : "",
        coverageEndDate: insuranceInfo.coverageEndDate ? insuranceInfo.coverageEndDate.split('T')[0] : "",
        isPrimary: insuranceInfo.isPrimary !== false,
        copayAmount: insuranceInfo.copayAmount || "",
        deductibleAmount: insuranceInfo.deductibleAmount || "",
        coveragePercentage: insuranceInfo.coveragePercentage || "",
        insurancePhone: insuranceInfo.insurancePhone || "",
        providerEmail: insuranceInfo.providerEmail || "",
        providerAddress: insuranceInfo.providerAddress || ""
      };

      const vitalsInfo = response.patientVitals || {};
      const newVitalsData = {
        bloodsugar: vitalsInfo.bloodsugar || "",
        bloodpressure: vitalsInfo.bloodpressure || "",
        temperature: vitalsInfo.temperature || "",
        heartRate: vitalsInfo.heartRate || "",
        weight: vitalsInfo.weight || "",
        height: vitalsInfo.height || "",
        oxygenSaturation: vitalsInfo.oxygenSaturation || ""
      };

      console.log('✅ FINAL MAPPED STATE TO BE SET:');
      console.table(newPatientData);
      console.log('Contact Data:', newContactData);
      console.log('Medical Data:', newMedicalData);
      console.log('Insurance Data:', newInsuranceData);
      console.log('Vitals Data:', newVitalsData);

      // SET THE STATE
      setEditPatientData(newPatientData);
      setEditContactData(newContactData);
      setEditMedicalData(newMedicalData);
      setEditInsuranceData(newInsuranceData);
      setEditVitalsData(newVitalsData);
      setEditingPatientId(patientId);
      setIsEditMode(true);
      
      // Log after state is being set - verify what will be rendered
      setTimeout(() => {
        console.log('🎯 STATE AFTER SET (verify in next render):');
        console.log('editPatientData.maritalStatus:', newPatientData.maritalStatus);
        console.log('maritalStatusOptions:', maritalStatusOptions.map(m => m.value));
        console.log('Will dropdown show selected value?', maritalStatusOptions.find(m => m.value === newPatientData.maritalStatus) ? 'YES ✅' : 'NO ❌');
      }, 0);
      
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to load patient profile:", error);
      setEditError("Failed to load patient profile. Please try again.");
    } finally {
      setEditIsLoading(false);
    }
  };

  const handleSavePatient = async () => {
    setEditIsLoading(true);
    setEditError("");
    try {
      // Validate required fields
      if (!editPatientData.patientFirstName || !editPatientData.patientLastName) {
        setEditError("First Name and Last Name are required.");
        setEditIsLoading(false);
        return;
      }
      

      // Build payload in the nested structure that API expects (PatientDataModel)
      const updatePayload = {
        patient: {
          patientId: editPatientData.patientId,
          patientFirstName: editPatientData.patientFirstName,
          patientLastName: editPatientData.patientLastName,
          patientDOB: editPatientData.patientDOB,
          patientGender: editPatientData.patientGender,
          patientBloodType: editPatientData.patientBloodType,
          maritalStatus: editPatientData.maritalStatus,
          enterpriseId: editPatientData.enterpriseId,
          clinicID: editPatientData.clinicID,
          isActive: editPatientData.isActive
        },
        patientContact: {
          patientId: editPatientData.patientId,
          patientPhone: editContactData.patientPhoneNumber,
          patientAlternatePhone: editContactData.patientAlternatePhoneNumber,
          patientEmail: editContactData.patientEmail,
          patientAddress: editContactData.patientAddressLine1,
          patientAddressLine2: editContactData.patientAddressLine2,
          patientCity: editContactData.patientCity,
          patientState: editContactData.patientState,
          patientPostalCode: editContactData.patientPostalCode,
          patientCountry: editContactData.patientCountry,
          patientEmergencyContact: editContactData.emergencyContactName || ""
        },
        patientMedicalInfo: {
          patientId: editPatientData.patientId,
          patientAllergies: editMedicalData.allergies,
          chronicDiseases: editMedicalData.chronicConditions,
          patientCurrentMedications: editMedicalData.currentMedications,
          patientPrimaryPhysician: editMedicalData.familyMedicalHistory,
          patientMedicalHistory: editMedicalData.patientMedicalHistory,
          medicalHistory: buildMedicalHistoryString(editMedicalData),
          noOfVisits: editMedicalData.noOfVisits,
          lastVisitedDate: editMedicalData.lastVisitedDate
        },
        patientInsurance: {
          patientId: editPatientData.patientId,
          patientInsuranceProvider: editInsuranceData.patientInsuranceProvider,
          insuranceProviderId: editInsuranceData.insuranceProviderId ? parseInt(editInsuranceData.insuranceProviderId) : null,
          policyNumber: editInsuranceData.policyNumber,
          groupNumber: editInsuranceData.groupNumber,
          policyHolderName: editInsuranceData.policyHolderName,
          relationshipToPolicyHolder: editInsuranceData.relationshipToPolicyHolder,
          coverageStartDate: editInsuranceData.coverageStartDate ? new Date(editInsuranceData.coverageStartDate).toISOString() : null,
          coverageEndDate: editInsuranceData.coverageEndDate ? new Date(editInsuranceData.coverageEndDate).toISOString() : null,
          isPrimary: editInsuranceData.isPrimary !== false,
          copayAmount: editInsuranceData.copayAmount ? parseFloat(editInsuranceData.copayAmount) : null,
          deductibleAmount: editInsuranceData.deductibleAmount ? parseFloat(editInsuranceData.deductibleAmount) : null,
          coveragePercentage: editInsuranceData.coveragePercentage ? parseFloat(editInsuranceData.coveragePercentage) : null,
          insurancePhone: editInsuranceData.insurancePhone,
          providerEmail: editInsuranceData.providerEmail,
          providerAddress: editInsuranceData.providerAddress,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        patientVitals: {
          patientId: editPatientData.patientId,
          bloodsugar: editVitalsData.bloodsugar ? parseFloat(editVitalsData.bloodsugar) : null,
          bloodpressure: editVitalsData.bloodpressure || "",
          temperature: editVitalsData.temperature ? parseFloat(editVitalsData.temperature) : null,
          heartRate: editVitalsData.heartRate ? parseInt(editVitalsData.heartRate) : null,
          weight: editVitalsData.weight ? parseFloat(editVitalsData.weight) : null,
          height: editVitalsData.height ? parseFloat(editVitalsData.height) : null,
          oxygenSaturation: editVitalsData.oxygenSaturation ? parseFloat(editVitalsData.oxygenSaturation) : null
        }
      };

      console.log('═══════════════════════════════════════════');
      console.log('📤 SENDING UPDATE PAYLOAD TO API:');
      console.log('   PUT /Patient/details/UpdatefullProfile');
      console.log('   Payload Structure:', updatePayload);
      console.log('═══════════════════════════════════════════');
      
      const response = await updateFullPatientProfile(updatePayload);
      console.log('✅ API RESPONSE:', response);
      
      // Show success popup with funny message
      const funnyMessages = [
        `🎉 Patient info updated! The dentist is proud of you!`,
        `✨ Data saved successfully! Your teeth are in good hands!`,
        `🦷 Patient details updated! No cavities in your database!`,
        `💫 Success! Your dental records are now shinier!`,
        `🎊 Patient info saved! We promise not to tell anyone!`,
        `✅ Updated with 99.9% accuracy (and 100% swagger)!`,
      ];
      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setSuccessMessage(randomMessage);
      setShowSuccessModal(true);
      
      setTimeout(() => {
        setShowSuccessModal(false);
        setShowEditModal(false);
        setIsEditMode(false);
        setEditActiveTab("patient");
        setAppointmentFromDate("");
        setAppointmentToDate("");
        setAppointmentsList([]);
        setAppointmentsError("");
        handleSearchClick();
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to update patient:", error);
      setEditError(error.message || "Failed to update patient. Please try again.");
    } finally {
      setEditIsLoading(false);
    }
  };

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError("");
    setAppointmentsList([]);
    
    try {
      // Get clinic ID from current context or use the patient's clinic
      const selectedAccess = getSelectedAccess();
      const clinicId = selectedAccess?.clinicId || editPatientData.clinicID;
      
      if (!clinicId) {
        setAppointmentsError("Clinic ID not found. Please ensure you are logged in with clinic access.");
        setAppointmentsLoading(false);
        return;
      }

      console.log('🔍 LOADING APPOINTMENTS for patient:', {
        patientId: editPatientData.patientId,
        firstName: editPatientData.patientFirstName,
        lastName: editPatientData.patientLastName,
        clinicId: clinicId,
        fromDate: appointmentFromDate,
        toDate: appointmentToDate
      });

      // Build filter params for API call
      const appointmentParams = {
        clinicId: clinicId.toString(),
        patientId: editPatientData.patientId,
        firstName: editPatientData.patientFirstName || undefined,
        lastName: editPatientData.patientLastName || undefined,
        fromDate: appointmentFromDate || undefined,
        toDate: appointmentToDate || undefined
      };

      // Remove undefined values
      Object.keys(appointmentParams).forEach(
        key => appointmentParams[key] === undefined && delete appointmentParams[key]
      );

      console.log('📤 Calling getAppointmentsByFilters with params:', appointmentParams);
      
      const appointments = await getAppointmentsByFilters(appointmentParams);
      console.log('✅ APPOINTMENTS FETCHED:', appointments);
      
      setAppointmentsList(appointments || []);
      // If no appointments, don't show error - just show empty state
      if (!appointments || appointments.length === 0) {
        setAppointmentsError("");
      }
    } catch (error) {
      console.error("❌ Failed to load appointments:", error);
      // Check if it's a 404 error - if so, treat as "no data found" instead of error
      if (error.status === 404 || error.message?.includes('404')) {
        setAppointmentsError("");
        setAppointmentsList([]);
      } else {
        setAppointmentsError("Unable to load appointments at this time.");
        setAppointmentsList([]);
      }
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const loadBilling = async () => {
    setBillingLoading(true);
    setBillingError("");
    setBillingAppointments([]);
    
    try {
      const selectedAccess = getSelectedAccess();
      const clinicId = selectedAccess?.clinicId || editPatientData.clinicID;
      
      if (!clinicId) {
        setBillingError("Clinic ID not found. Please ensure you are logged in with clinic access.");
        setBillingLoading(false);
        return;
      }

      console.log('💳 LOADING APPOINTMENTS for billing:', {
        patientId: editPatientData.patientId,
        clinicId: clinicId
      });

      const billingParams = {
        clinicId: clinicId.toString(),
        patientId: editPatientData.patientId
      };

      const appointments = await getAppointmentsByFilters(billingParams);
      console.log('✅ BILLING APPOINTMENTS RAW RESPONSE:', appointments);
      console.log('📋 Sample appointment fields:', appointments?.[0] ? Object.keys(appointments[0]) : 'empty');
      setBillingAppointments(appointments || []);
      // If no appointments, don't show error
      if (!appointments || appointments.length === 0) {
        setBillingError("");
      }
    } catch (error) {
      console.error("❌ Failed to load appointments for billing:", error);
      // Check if it's a 404 error - if so, treat as "no data found"
      if (error.status === 404 || error.message?.includes('404')) {
        setBillingError("");
        setBillingAppointments([]);
      } else {
        setBillingError("Unable to load appointments at this time.");
        setBillingAppointments([]);
      }
    } finally {
      setBillingLoading(false);
    }
  };

  const generateInvoiceHTML = (invoice) => {
    const lineItemsHTML = (invoice.lineItems || []).map((item, idx) => `
      <tr style="border-bottom:1px solid #e5e7eb; background:${idx % 2 === 0 ? '#fff' : '#f8f9ff'}">
        <td style="padding:10px 14px; color:#64748b; font-weight:600">${item.lineItemNumber || idx + 1}</td>
        <td style="padding:10px 14px; color:#1e293b; font-weight:500">${item.serviceDescription || '—'}</td>
        <td style="padding:10px 14px; text-align:right; color:#475569">₹${(item.serviceCost || 0).toLocaleString('en-IN')}</td>
        <td style="padding:10px 14px; text-align:right; color:#64748b">${item.gst ?? 0}%</td>
        <td style="padding:10px 14px; text-align:right; font-weight:700; color:#7c3aed">₹${(item.totalAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    return `
      <div style="font-family:Arial,sans-serif; max-width:750px; margin:0 auto; background:#fff; padding:32px; color:#1e293b">
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #7c3aed; padding-bottom:20px; margin-bottom:24px">
          <div style="display:flex; align-items:center; gap:14px">
            <img src="${dantaLogo}" style="width:56px; height:56px; border-radius:50%; object-fit:cover; border:2px solid #e2e8f0" />
            <div>
              <div style="font-size:18px; font-weight:900; letter-spacing:1px; color:#1e293b">DENTAESTHETICS</div>
              <div style="font-size:10px; color:#94a3b8; font-weight:600; letter-spacing:2px; text-transform:uppercase">The Dental Company</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px; font-weight:900; color:#7c3aed; letter-spacing:2px">INVOICE</div>
            <div style="font-size:12px; color:#64748b; margin-top:2px">#${invoice.header?.invoiceNumber || '—'}</div>
            <div style="font-size:12px; color:#64748b">${invoice.header?.billDate ? new Date(invoice.header.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#f5f3ff; border:1px solid #ede9fe; border-radius:12px; padding:16px; margin-bottom:24px">
          <div><div style="font-size:10px; font-weight:700; color:#7c3aed; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Doctor</div><div style="font-size:13px; font-weight:600">${invoice.header?.doctorName || '—'}</div></div>
          <div><div style="font-size:10px; font-weight:700; color:#7c3aed; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Mode of Payment</div><div style="font-size:13px; font-weight:600">${invoice.header?.modeOfPayment || '—'}</div></div>
          <div><div style="font-size:10px; font-weight:700; color:#7c3aed; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Total Amount</div><div style="font-size:15px; font-weight:900; color:#7c3aed">₹${(invoice.header?.totalAmount || 0).toLocaleString('en-IN')}</div></div>
          <div><div style="font-size:10px; font-weight:700; color:#059669; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Net Amount</div><div style="font-size:15px; font-weight:900; color:#059669">₹${(invoice.header?.netAmount || 0).toLocaleString('en-IN')}</div></div>
        </div>
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#64748b; margin-bottom:10px">Services</div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden">
          <thead><tr style="background:#1e293b; color:#fff">
            <th style="padding:12px 14px; text-align:left; font-size:12px">#</th>
            <th style="padding:12px 14px; text-align:left; font-size:12px">Service</th>
            <th style="padding:12px 14px; text-align:right; font-size:12px">Cost</th>
            <th style="padding:12px 14px; text-align:right; font-size:12px">GST</th>
            <th style="padding:12px 14px; text-align:right; font-size:12px">Total</th>
          </tr></thead>
          <tbody>${lineItemsHTML}</tbody>
          <tfoot><tr style="background:#7c3aed; color:#fff">
            <td colspan="4" style="padding:12px 14px; text-align:right; font-weight:700; font-size:13px">Net Amount</td>
            <td style="padding:12px 14px; text-align:right; font-weight:900; font-size:16px">₹${(invoice.header?.netAmount || 0).toLocaleString('en-IN')}</td>
          </tr></tfoot>
        </table>
        <div style="margin-top:32px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px">
          Computer generated invoice · Valid without signature
        </div>
      </div>`;
  };

  const generateBWInvoiceHTML = (invoice) => {
    const lineItemsHTML = (invoice.lineItems || []).map((item, idx) => `
      <tr style="border-bottom:1px solid #ccc; background:${idx % 2 === 0 ? '#fff' : '#f5f5f5'}">
        <td style="padding:10px 14px; color:#333; font-weight:600">${item.lineItemNumber || idx + 1}</td>
        <td style="padding:10px 14px; color:#111; font-weight:500">${item.serviceDescription || '—'}</td>
        <td style="padding:10px 14px; text-align:right; color:#333">₹${(item.serviceCost || 0).toLocaleString('en-IN')}</td>
        <td style="padding:10px 14px; text-align:right; color:#555">${item.gst ?? 0}%</td>
        <td style="padding:10px 14px; text-align:right; font-weight:700; color:#000">₹${(item.totalAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    return `
      <div style="font-family:Arial,sans-serif; max-width:750px; margin:0 auto; background:#fff; padding:32px; color:#111">
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #000; padding-bottom:20px; margin-bottom:24px">
          <div style="display:flex; align-items:center; gap:14px">
            <img src="${dantaLogo}" style="width:56px; height:56px; border-radius:50%; object-fit:cover; border:2px solid #ccc" />
            <div>
              <div style="font-size:18px; font-weight:900; letter-spacing:1px; color:#000">DENTAESTHETICS</div>
              <div style="font-size:10px; color:#555; font-weight:600; letter-spacing:2px; text-transform:uppercase">The Dental Company</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px; font-weight:900; color:#000; letter-spacing:2px">INVOICE</div>
            <div style="font-size:12px; color:#444; margin-top:2px">#${invoice.header?.invoiceNumber || '—'}</div>
            <div style="font-size:12px; color:#444">${invoice.header?.billDate ? new Date(invoice.header.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#f5f5f5; border:1px solid #ccc; border-radius:4px; padding:16px; margin-bottom:24px">
          <div><div style="font-size:10px; font-weight:700; color:#000; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Doctor</div><div style="font-size:13px; font-weight:600">${invoice.header?.doctorName || '—'}</div></div>
          <div><div style="font-size:10px; font-weight:700; color:#000; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Mode of Payment</div><div style="font-size:13px; font-weight:600">${invoice.header?.modeOfPayment || '—'}</div></div>
          <div><div style="font-size:10px; font-weight:700; color:#000; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Total Amount</div><div style="font-size:15px; font-weight:900; color:#000">₹${(invoice.header?.totalAmount || 0).toLocaleString('en-IN')}</div></div>
          <div><div style="font-size:10px; font-weight:700; color:#000; text-transform:uppercase; letter-spacing:2px; margin-bottom:2px">Net Amount</div><div style="font-size:15px; font-weight:900; color:#000">₹${(invoice.header?.netAmount || 0).toLocaleString('en-IN')}</div></div>
        </div>
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#333; margin-bottom:10px">Services</div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #ccc">
          <thead><tr style="background:#222; color:#fff">
            <th style="padding:12px 14px; text-align:left; font-size:12px">#</th>
            <th style="padding:12px 14px; text-align:left; font-size:12px">Service</th>
            <th style="padding:12px 14px; text-align:right; font-size:12px">Cost</th>
            <th style="padding:12px 14px; text-align:right; font-size:12px">GST</th>
            <th style="padding:12px 14px; text-align:right; font-size:12px">Total</th>
          </tr></thead>
          <tbody>${lineItemsHTML}</tbody>
          <tfoot><tr style="background:#000; color:#fff">
            <td colspan="4" style="padding:12px 14px; text-align:right; font-weight:700; font-size:13px">Net Amount</td>
            <td style="padding:12px 14px; text-align:right; font-weight:900; font-size:16px">₹${(invoice.header?.netAmount || 0).toLocaleString('en-IN')}</td>
          </tr></tfoot>
        </table>
        <div style="margin-top:32px; text-align:center; font-size:11px; color:#666; border-top:1px solid #ccc; padding-top:16px">
          Computer generated invoice · Valid without signature
        </div>
      </div>`;
  };

  const downloadInvoicePDF = (invoice) => {
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute; left:-9999px; top:-9999px; width:800px';
      el.innerHTML = generateBWInvoiceHTML(invoice);
      document.body.appendChild(el);
      html2canvas(el, { scale: 2, logging: false, backgroundColor: '#ffffff', useCORS: true })
        .then(canvas => {
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`Invoice-${invoice.header?.invoiceNumber || 'download'}.pdf`);
          document.body.removeChild(el);
        })
        .catch(err => { document.body.removeChild(el); alert('PDF generation failed: ' + err.message); });
    } catch (e) { alert('PDF generation failed: ' + e.message); }
  };

  const printInvoice = (invoice) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.header?.invoiceNumber || ''}</title><style>body{margin:0;padding:0} @media print{@page{margin:15mm} * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }}</style></head><body>${generateBWInvoiceHTML(invoice)}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const loadInvoicesForAppointment = async (appointmentId) => {
    setInvoicesLoading(true);
    setInvoicesError("");
    setInvoicesList([]);
    setSelectedAppointmentForInvoices(appointmentId);

    try {
      const invoices = await request(`/Services/GetInvoicesByAppointmentComplete?appointmentId=${appointmentId}`);
      setInvoicesList(Array.isArray(invoices) ? invoices : []);
    } catch (error) {
      console.error("❌ Failed to load invoices:", error);
      setInvoicesList([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadLineItems = async (invoiceNumber) => {
    setLineItemsLoading(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";
      
      console.log('📋 FETCHING LINE ITEMS for invoice:', invoiceNumber);
      
      const response = await fetch(`${API_BASE_URL}/Services/invoice/${invoiceNumber}/lineitems`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem('accessToken_session')}`
        }
      });

      if (response.ok) {
        const lineItems = await response.json();
        console.log('✅ LINE ITEMS FETCHED:', lineItems);
        setLineItemsList(lineItems || []);
        setSelectedInvoice(invoiceNumber);
        setShowLineItemsModal(true);
      } else {
        console.error('Failed to fetch line items:', response.status);
      }
    } catch (error) {
      console.error("❌ Failed to load line items:", error);
    } finally {
      setLineItemsLoading(false);
    }
  };

  const loadAppointmentDetail = async (appointmentId) => {
    setAppointmentDetailLoading(true);
    setAppointmentDetailError("");
    setSelectedAppointmentDetail(null);
    setShowDetailInvoices(false);
    setDetailInvoices([]);

    try {
      console.log('📋 FETCHING APPOINTMENT DETAIL:', appointmentId);
      const raw = await request(`/Appointments/GetAppointmentbyAppointmentID?appointmentId=${appointmentId}`);
      const appointmentDetail = Array.isArray(raw) ? raw[0] : raw;
      console.log('✅ APPOINTMENT DETAIL:', appointmentDetail);
      setSelectedAppointmentDetail(appointmentDetail);
      setShowAppointmentDetailModal(true);
    } catch (error) {
      console.error("❌ Failed to load appointment detail:", error);
      setAppointmentDetailError("Unable to load appointment details.");
    } finally {
      setAppointmentDetailLoading(false);
    }
  };

  const loadDetailInvoices = async (appointmentId) => {
    setDetailInvoicesLoading(true);
    setDetailInvoices([]);

    try {
      console.log('🧾 FETCHING INVOICES for appointment:', appointmentId);
      const invoices = await request(`/Services/GetInvoicesByAppointmentComplete?appointmentId=${appointmentId}`);
      console.log('✅ INVOICES FETCHED:', invoices);
      setDetailInvoices(Array.isArray(invoices) ? invoices : []);
      setShowDetailInvoices(true);
    } catch (error) {
      console.error("❌ Failed to load invoices:", error);
      setDetailInvoices([]);
      setShowDetailInvoices(true);
    } finally {
      setDetailInvoicesLoading(false);
    }
  };

  const loadDiagnostics = async (appointmentId) => {
    setDiagnosticsLoading(true);
    setDiagnosticsError("");
    setDiagnosticsData(null);
    setShowDiagnosticsModal(true);

    try {
      console.log('📋 FETCHING PATIENT VISIT/DIAGNOSTICS:', appointmentId);
      const diagnostics = await request(`/Patient/GetPatientVisit?AppointmentID=${appointmentId}`, { method: "POST" });
      console.log('✅ PATIENT VISIT FETCHED:', diagnostics);
      setDiagnosticsData(diagnostics);
    } catch (error) {
      console.error("❌ Failed to load diagnostics:", error);
      setDiagnosticsError("No diagnostic records found for this appointment.");
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-lg p-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">View Patients</h1>
            <p className="text-amber-50">Search and manage patient records</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Search Section */}
          <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">Search Patients</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={filterData.firstName}
                  onChange={(e) => setFilterData({ ...filterData, firstName: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Patient ID</label>
                <input
                  type="number"
                  value={filterData.patientId}
                  onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                  placeholder="Enter patient ID"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Mobile Number</label>
                <div className={`flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 transition ${mobileNumberError ? "border-red-500 focus-within:ring-red-400" : "border-stone-300"}`}>
                  <span className="px-3 py-2 bg-stone-100 border-r border-stone-300 text-stone-600 font-semibold text-sm select-none">+91</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={filterData.mobileNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFilterData({ ...filterData, mobileNumber: digits });
                      if (mobileNumberError) setMobileNumberError("");
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="flex-1 px-3 py-2 bg-white focus:outline-none text-sm"
                  />
                  <span className={`px-2 py-2 text-xs font-medium select-none ${filterData.mobileNumber.length === 10 ? 'text-green-600' : 'text-stone-400'}`}>
                    {filterData.mobileNumber.length}/10
                  </span>
                </div>
                {mobileNumberError && (
                  <p className="text-sm text-red-600 mt-1">{mobileNumberError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Clinic</label>
                <select
                  value={filterData.clinicId}
                  onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                >
                  <option value="">Select a clinic</option>
                  {clinics.map(clinic => (
                    <option key={clinic.clinicId} value={clinic.clinicId}>
                      {clinic.clinicName || `Clinic ${clinic.clinicId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleSearchClick}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:bg-amber-400"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
                <button
                  onClick={handleClearFilters}
                  className="flex-1 px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {searchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-stone-600">
                  Showing <span className="font-semibold text-amber-700">{searchResults.length}</span> patient(s)
                </p>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-50 border-b-2 border-amber-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Patient ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Date of Birth</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Gender</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((patient, idx) => {
                    console.log(`📍 Rendering patient row ${idx}:`, patient);
                    return (
                    <tr key={patient.patientId} className={`border-b border-stone-200 hover:bg-amber-25 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
                      <td className="px-4 py-3 text-sm text-stone-700">{patient.patientId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-stone-900">{patient.patientFirstName} {patient.patientLastName}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{patient.patientDOB ? new Date(patient.patientDOB).toLocaleDateString() : "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{patient.patientGender || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{patient.patientPhoneNumber || patient.patientContact?.phoneNumber || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{patient.patientEmail || patient.patientContact?.email || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">
                        <button 
                          onClick={() => handleEditClick(patient.patientId)}
                          className="text-amber-600 hover:text-amber-800 font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : searchResults.length === 0 && (searchResults.length !== null) ? (
            <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-stone-500 text-lg">No patients found</p>
              <p className="text-stone-400 text-sm mt-2">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-stone-500 text-lg">Click Search to find patients</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{isEditMode ? "Edit Patient" : "View Patient"}</h2>
                <div className="flex items-center gap-3">
                  {!isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-all"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setIsEditMode(false);
                      setEditActiveTab("patient");
                      setAppointmentFromDate("");
                      setAppointmentToDate("");
                      setAppointmentsList([]);
                      setAppointmentsError("");
                    }}
                    className="text-white hover:text-amber-100 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 m-6 rounded-lg">
                {editError}
              </div>
            )}

            {/* Tab Selector */}
            <div className="flex gap-4 p-6 border-b border-stone-200 bg-stone-50">
              <button
                onClick={() => setEditActiveTab("patient")}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "patient"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                Patient Info
              </button>
              <button
                onClick={() => setEditActiveTab("contact")}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "contact"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                Contact Info
              </button>
              <button
                onClick={() => setEditActiveTab("medical")}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "medical"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                Medical Info
              </button>
              <button
                onClick={() => setEditActiveTab("vitals")}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "vitals"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                💉 Patient Vitals
              </button>
              <button
                onClick={() => setEditActiveTab("insurance")}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "insurance"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                Insurance
              </button>
              <button
                onClick={() => {
                  setEditActiveTab("appointments");
                  loadAppointments();
                }}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "appointments"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                📅 Appointments
              </button>
              <button
                onClick={() => {
                  setEditActiveTab("billing");
                  loadBilling();
                }}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "billing"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                💳 Billing & Invoices
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {editActiveTab === "patient" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Patient ID (Read-only)</label>
                    <input
                      type="text"
                      disabled
                      value={editPatientData.patientId}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-gray-50 text-stone-500 cursor-not-allowed"
                    />
                  </div>
                  <InputField
                    label="First Name"
                    name="patientFirstName"
                    value={editPatientData.patientFirstName}
                    onChange={(e) => setEditPatientData({...editPatientData, patientFirstName: e.target.value})}
                    placeholder="Enter first name"
                    required
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Last Name"
                    name="patientLastName"
                    value={editPatientData.patientLastName}
                    onChange={(e) => setEditPatientData({...editPatientData, patientLastName: e.target.value})}
                    placeholder="Enter last name"
                    required
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Date of Birth"
                    name="patientDOB"
                    type="date"
                    value={editPatientData.patientDOB}
                    onChange={(e) => setEditPatientData({...editPatientData, patientDOB: e.target.value})}
                    required
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Gender"
                    name="patientGender"
                    value={editPatientData.patientGender}
                    onChange={(e) => setEditPatientData({...editPatientData, patientGender: e.target.value})}
                    options={genderOptions}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Blood Type"
                    name="patientBloodType"
                    value={editPatientData.patientBloodType}
                    onChange={(e) => setEditPatientData({...editPatientData, patientBloodType: e.target.value})}
                    options={bloodGroupOptions}
                    disabled={!isEditMode}
                  />
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Clinic (Read-only)</label>
                    <input
                      type="text"
                      disabled
                      value={editPatientData.clinicID}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-gray-50 text-stone-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {editActiveTab === "contact" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Phone Number"
                    name="patientPhoneNumber"
                    value={editContactData.patientPhoneNumber}
                    onChange={(e) => setEditContactData({...editContactData, patientPhoneNumber: e.target.value})}
                    placeholder="Enter phone number"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Alternate Phone"
                    name="patientAlternatePhoneNumber"
                    value={editContactData.patientAlternatePhoneNumber}
                    onChange={(e) => setEditContactData({...editContactData, patientAlternatePhoneNumber: e.target.value})}
                    placeholder="Enter alternate phone"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Email"
                    name="patientEmail"
                    type="email"
                    value={editContactData.patientEmail}
                    onChange={(e) => setEditContactData({...editContactData, patientEmail: e.target.value})}
                    placeholder="Enter email"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Address Line 1"
                    name="patientAddressLine1"
                    value={editContactData.patientAddressLine1}
                    onChange={(e) => setEditContactData({...editContactData, patientAddressLine1: e.target.value})}
                    placeholder="Enter address line 1"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Address Line 2"
                    name="patientAddressLine2"
                    value={editContactData.patientAddressLine2}
                    onChange={(e) => setEditContactData({...editContactData, patientAddressLine2: e.target.value})}
                    placeholder="Enter address line 2"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="City"
                    name="patientCity"
                    value={editContactData.patientCity}
                    onChange={(e) => setEditContactData({...editContactData, patientCity: e.target.value})}
                    placeholder="Enter city"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="State"
                    name="patientState"
                    value={editContactData.patientState}
                    onChange={(e) => setEditContactData({...editContactData, patientState: e.target.value})}
                    placeholder="Enter state"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Postal Code"
                    name="patientPostalCode"
                    value={editContactData.patientPostalCode}
                    onChange={(e) => setEditContactData({...editContactData, patientPostalCode: e.target.value})}
                    placeholder="Enter postal code"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Country"
                    name="patientCountry"
                    value={editContactData.patientCountry}
                    onChange={(e) => setEditContactData({...editContactData, patientCountry: e.target.value})}
                    placeholder="Enter country"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={editContactData.emergencyContactName}
                    onChange={(e) => setEditContactData({...editContactData, emergencyContactName: e.target.value})}
                    placeholder="Enter emergency contact name"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Emergency Contact Phone"
                    name="emergencyContactPhone"
                    value={editContactData.emergencyContactPhone}
                    onChange={(e) => setEditContactData({...editContactData, emergencyContactPhone: e.target.value})}
                    placeholder="Enter emergency contact phone"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Emergency Contact Relation"
                    name="emergencyContactRelation"
                    value={editContactData.emergencyContactRelation}
                    onChange={(e) => setEditContactData({...editContactData, emergencyContactRelation: e.target.value})}
                    placeholder="Enter relation"
                    disabled={!isEditMode}
                  />
                </div>
              )}

              {editActiveTab === "medical" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Medical History Summary (auto-generated from fields below)"
                    name="medicalHistorySummary"
                    type="textarea"
                    value={buildMedicalHistoryString(editMedicalData)}
                    onChange={() => {}}
                    disabled={true}
                  />
                  <InputField
                    label="Patient Medical History"
                    name="patientMedicalHistory"
                    type="textarea"
                    value={editMedicalData.patientMedicalHistory}
                    onChange={(e) => setEditMedicalData({...editMedicalData, patientMedicalHistory: e.target.value})}
                    placeholder="Enter patient medical history"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Allergies"
                    name="allergies"
                    type="textarea"
                    value={editMedicalData.allergies}
                    onChange={(e) => setEditMedicalData({...editMedicalData, allergies: e.target.value})}
                    placeholder="Enter allergies"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Chronic Conditions"
                    name="chronicConditions"
                    type="textarea"
                    value={editMedicalData.chronicConditions}
                    onChange={(e) => setEditMedicalData({...editMedicalData, chronicConditions: e.target.value})}
                    placeholder="Enter chronic conditions"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Current Medications"
                    name="currentMedications"
                    type="textarea"
                    value={editMedicalData.currentMedications}
                    onChange={(e) => setEditMedicalData({...editMedicalData, currentMedications: e.target.value})}
                    placeholder="Enter current medications"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Past Surgeries"
                    name="pastSurgeries"
                    type="textarea"
                    value={editMedicalData.pastSurgeries}
                    onChange={(e) => setEditMedicalData({...editMedicalData, pastSurgeries: e.target.value})}
                    placeholder="Enter past surgeries"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Family Medical History"
                    name="familyMedicalHistory"
                    type="textarea"
                    value={editMedicalData.familyMedicalHistory}
                    onChange={(e) => setEditMedicalData({...editMedicalData, familyMedicalHistory: e.target.value})}
                    placeholder="Enter family medical history"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Smoking Status"
                    name="smokingStatus"
                    value={editMedicalData.smokingStatus}
                    onChange={(e) => setEditMedicalData({...editMedicalData, smokingStatus: e.target.value})}
                    options={smokingStatusOptions}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Alcohol Consumption"
                    name="alcoholConsumption"
                    value={editMedicalData.alcoholConsumption}
                    onChange={(e) => setEditMedicalData({...editMedicalData, alcoholConsumption: e.target.value})}
                    options={alcoholConsumptionOptions}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Chewing Tobacco"
                    name="chewingTobaccoStatus"
                    value={editMedicalData.chewingTobaccoStatus}
                    onChange={(e) => setEditMedicalData({...editMedicalData, chewingTobaccoStatus: e.target.value})}
                    options={chewingTobaccoOptions}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Exercise Frequency"
                    name="exerciseFrequency"
                    value={editMedicalData.exerciseFrequency}
                    onChange={(e) => setEditMedicalData({...editMedicalData, exerciseFrequency: e.target.value})}
                    options={exerciseFrequencyOptions}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Dietary Restrictions"
                    name="dietaryRestrictions"
                    value={editMedicalData.dietaryRestrictions}
                    onChange={(e) => setEditMedicalData({...editMedicalData, dietaryRestrictions: e.target.value})}
                    placeholder="Enter dietary restrictions"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Last Dental Visit"
                    name="lastDentalVisit"
                    type="date"
                    value={editMedicalData.lastDentalVisit}
                    onChange={(e) => setEditMedicalData({...editMedicalData, lastDentalVisit: e.target.value})}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Notes"
                    name="notes"
                    type="textarea"
                    value={editMedicalData.notes}
                    onChange={(e) => setEditMedicalData({...editMedicalData, notes: e.target.value})}
                    placeholder="Enter notes"
                    disabled={!isEditMode}
                  />
                </div>
              )}

              {editActiveTab === "vitals" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Blood Sugar"
                    name="bloodsugar"
                    type="number"
                    value={editVitalsData.bloodsugar}
                    onChange={(e) => setEditVitalsData({...editVitalsData, bloodsugar: e.target.value})}
                    placeholder="mg/dL"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Blood Pressure"
                    name="bloodpressure"
                    value={editVitalsData.bloodpressure}
                    onChange={(e) => setEditVitalsData({...editVitalsData, bloodpressure: e.target.value})}
                    placeholder="e.g., 120/80 mmHg"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Temperature"
                    name="temperature"
                    type="number"
                    value={editVitalsData.temperature}
                    onChange={(e) => setEditVitalsData({...editVitalsData, temperature: e.target.value})}
                    placeholder="°C"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Heart Rate"
                    name="heartRate"
                    type="number"
                    value={editVitalsData.heartRate}
                    onChange={(e) => setEditVitalsData({...editVitalsData, heartRate: e.target.value})}
                    placeholder="bpm"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Weight"
                    name="weight"
                    type="number"
                    value={editVitalsData.weight}
                    onChange={(e) => setEditVitalsData({...editVitalsData, weight: e.target.value})}
                    placeholder="kg"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Height"
                    name="height"
                    type="number"
                    value={editVitalsData.height}
                    onChange={(e) => setEditVitalsData({...editVitalsData, height: e.target.value})}
                    placeholder="cm"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Oxygen Saturation"
                    name="oxygenSaturation"
                    type="number"
                    value={editVitalsData.oxygenSaturation}
                    onChange={(e) => setEditVitalsData({...editVitalsData, oxygenSaturation: e.target.value})}
                    placeholder="%"
                    disabled={!isEditMode}
                  />
                </div>
              )}

              {editActiveTab === "insurance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Insurance Provider"
                    name="insuranceProvider"
                    value={editInsuranceData.insuranceProvider}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, insuranceProvider: e.target.value})}
                    placeholder="Enter insurance provider"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Policy Number"
                    name="policyNumber"
                    value={editInsuranceData.policyNumber}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, policyNumber: e.target.value})}
                    placeholder="Enter policy number"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Group Number"
                    name="groupNumber"
                    value={editInsuranceData.groupNumber}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, groupNumber: e.target.value})}
                    placeholder="Enter group number"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Policy Holder Name"
                    name="policyHolderName"
                    value={editInsuranceData.policyHolderName}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, policyHolderName: e.target.value})}
                    placeholder="Enter policy holder name"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Policy Holder Relation"
                    name="policyHolderRelation"
                    value={editInsuranceData.policyHolderRelation}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, policyHolderRelation: e.target.value})}
                    placeholder="Enter relation"
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Coverage Start Date"
                    name="coverageStartDate"
                    type="date"
                    value={editInsuranceData.coverageStartDate}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, coverageStartDate: e.target.value})}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Coverage End Date"
                    name="coverageEndDate"
                    type="date"
                    value={editInsuranceData.coverageEndDate}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, coverageEndDate: e.target.value})}
                    disabled={!isEditMode}
                  />
                  <InputField
                    label="Copay Amount"
                    name="copayAmount"
                    value={editInsuranceData.copayAmount}
                    onChange={(e) => setEditInsuranceData({...editInsuranceData, copayAmount: e.target.value})}
                    placeholder="Enter copay amount"
                    disabled={!isEditMode}
                  />
                </div>
              )}

              {editActiveTab === "appointments" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      📅 View appointments for {editPatientData.patientFirstName} {editPatientData.patientLastName}
                    </p>
                  </div>

                  {/* Date Range Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                    <InputField
                      label="From Date (Optional)"
                      name="appointmentFromDate"
                      type="date"
                      value={appointmentFromDate}
                      onChange={(e) => setAppointmentFromDate(e.target.value)}
                      placeholder="Leave empty for all dates"
                    />
                    <InputField
                      label="To Date (Optional)"
                      name="appointmentToDate"
                      type="date"
                      value={appointmentToDate}
                      onChange={(e) => setAppointmentToDate(e.target.value)}
                      placeholder="Leave empty for all dates"
                    />
                    <button
                      onClick={loadAppointments}
                      disabled={appointmentsLoading}
                      className="col-span-1 md:col-span-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
                    >
                      {appointmentsLoading ? "Loading..." : "Search Appointments"}
                    </button>
                  </div>

                  {appointmentsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      <p className="font-semibold">❌ Error</p>
                      <p className="text-sm">{appointmentsError}</p>
                    </div>
                  )}

                  {/* Appointments Tiles */}
                  {appointmentsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-stone-600">Loading appointments...</p>
                    </div>
                  ) : appointmentsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {appointmentsList.map((appointment, idx) => (
                        <motion.div
                          key={appointment.appointmentId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => loadAppointmentDetail(appointment.appointmentId)}
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-5 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="text-2xl">📅</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              appointment.appointmentStatus === "Completed" ? "bg-green-100 text-green-800" :
                              appointment.appointmentStatus === "Cancelled" ? "bg-red-100 text-red-800" :
                              appointment.appointmentStatus === "Scheduled" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {appointment.appointmentStatus || "Pending"}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 mb-2">Appointment #{appointment.appointmentId}</h3>
                          <div className="space-y-2 text-sm">
                            <p className="text-slate-700"><span className="font-semibold">Date:</span> {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Time:</span> {appointment.startTime || "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Doctor ID:</span> {appointment.doctorId || "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Type:</span> {appointment.appointmentType || "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Status:</span> {appointment.status || "N/A"}</p>
                            {appointment.notes && <p className="text-slate-600 italic mt-3">💬 {appointment.notes}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="text-stone-600">No appointments found</p>
                      <p className="text-stone-400 text-sm mt-2">Click "Search Appointments" to load data</p>
                    </div>
                  )}
                </div>
              )}

              {editActiveTab === "billing" && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-purple-800 text-sm">
                      💳 View appointments and invoices for {editPatientData.patientFirstName} {editPatientData.patientLastName}
                    </p>
                  </div>

                  {/* Load Billing Button */}
                  {billingAppointments.length === 0 && !selectedAppointmentForInvoices && (
                    <button
                      onClick={loadBilling}
                      disabled={billingLoading}
                      className="mb-6 px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-purple-400"
                    >
                      {billingLoading ? "Loading..." : "Load Appointments for Billing"}
                    </button>
                  )}

                  {billingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      <p className="font-semibold">⚠️ Info</p>
                      <p className="text-sm">{billingError || "No appointments found"}</p>
                    </div>
                  )}

                  {/* Show Appointments List or Invoices List */}
                  {billingLoading ? (
                    <div className="text-center py-8">
                      <p className="text-stone-600">Loading appointments...</p>
                    </div>
                  ) : selectedAppointmentForInvoices ? (
                    // Show Invoices for Selected Appointment
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="text-blue-800 font-semibold text-sm">Invoices for Appointment #{selectedAppointmentForInvoices}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointmentForInvoices(null);
                            setInvoicesList([]);
                            setInvoicesError("");
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          ← Back to Appointments
                        </button>
                      </div>

                      {invoicesError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                          <p>{invoicesError || "No invoices found for this appointment"}</p>
                        </div>
                      )}

                      {invoicesLoading ? (
                        <div className="text-center py-8">
                          <p className="text-stone-600">Loading invoices...</p>
                        </div>
                      ) : invoicesList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {invoicesList.map((invoice, idx) => (
                            <motion.div
                              key={invoice.invoiceNumber || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-5 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-2xl">🧾</span>
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {invoice.header?.modeOfPayment || "—"}
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-800 mb-2">Invoice #{invoice.header?.invoiceNumber}</h3>
                              <div className="space-y-1.5 text-sm mb-4">
                                <p className="text-slate-700"><span className="font-semibold">Date:</span> {invoice.header?.billDate ? new Date(invoice.header.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</p>
                                <p className="text-slate-700"><span className="font-semibold">Doctor:</span> {invoice.header?.doctorName || "N/A"}</p>
                                <p className="text-slate-700"><span className="font-semibold">Services:</span> {invoice.lineItems?.length || 0}</p>
                                <div className="mt-3 pt-3 border-t border-purple-300">
                                  <p className="text-lg font-bold text-purple-700">₹{invoice.header?.netAmount?.toLocaleString('en-IN') ?? 0}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => { setSelectedInvoice(invoice); setShowLineItemsModal(true); }}
                                className="w-full px-3 py-2 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 transition text-sm"
                              >
                                View Invoice
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-stone-50 rounded-lg border border-stone-200">
                          <p className="text-stone-600">No invoices found for this appointment</p>
                        </div>
                      )}
                    </div>
                  ) : billingAppointments.length > 0 ? (
                    // Show Appointments List
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {billingAppointments.map((appointment, idx) => (
                        <motion.div
                          key={appointment.appointmentId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-5 hover:shadow-lg transition-all hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="text-2xl">📅</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              appointment.appointmentStatus === "Completed" ? "bg-green-100 text-green-800" :
                              appointment.appointmentStatus === "Cancelled" ? "bg-red-100 text-red-800" :
                              appointment.appointmentStatus === "Scheduled" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {appointment.appointmentStatus || "Pending"}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 mb-2">Appointment #{appointment.appointmentId}</h3>
                          <div className="space-y-2 text-sm mb-4">
                            <p className="text-slate-700"><span className="font-semibold">Date:</span> {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Time:</span> {appointment.startTime || "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Doctor ID:</span> {appointment.doctorId || "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Type:</span> {appointment.appointmentType || "N/A"}</p>
                            <p className="text-slate-700"><span className="font-semibold">Status:</span> {appointment.status || "N/A"}</p>
                          </div>
                          <button
                            onClick={() => loadInvoicesForAppointment(appointment.appointmentId)}
                            disabled={invoicesLoading && selectedAppointmentForInvoices === appointment.appointmentId}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-purple-400"
                          >
                            {invoicesLoading && selectedAppointmentForInvoices === appointment.appointmentId ? "Loading..." : "Show Invoices"}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="text-stone-600">No appointments found</p>
                      <p className="text-stone-400 text-sm mt-2">Click "Load Appointments for Billing" to fetch data</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 p-6 border-t border-stone-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setIsEditMode(false);
                  setEditActiveTab("patient");
                  setAppointmentFromDate("");
                  setAppointmentToDate("");
                  setAppointmentsList([]);
                  setAppointmentsError("");
                  // Reset all invoice-related states
                  setSelectedAppointmentForInvoices(null);
                  setInvoicesList([]);
                  setInvoicesError("");
                  setLineItemsList([]);
                  setSelectedInvoice(null);
                  setShowLineItemsModal(false);
                }}
                disabled={editIsLoading}
                className="px-6 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition disabled:opacity-50"
              >
                Close
              </button>
              {isEditMode && (
                <button
                  onClick={handleSavePatient}
                  disabled={editIsLoading}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:bg-amber-400"
                >
                  {editIsLoading ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showLineItemsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Invoice #{selectedInvoice.header?.invoiceNumber}</h2>
                <p className="text-purple-200 text-xs mt-0.5 font-medium">
                  {selectedInvoice.header?.billDate ? new Date(selectedInvoice.header.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ""}
                </p>
              </div>
              <button
                onClick={() => { setShowLineItemsModal(false); setSelectedInvoice(null); }}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Invoice Header Info */}
            <div className="px-6 pt-5 pb-4">
              <div className="grid grid-cols-2 gap-3 bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-0.5">Doctor</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvoice.header?.doctorName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-0.5">Mode of Payment</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedInvoice.header?.modeOfPayment || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-0.5">Total Amount</p>
                  <p className="text-base font-black text-purple-700">₹{selectedInvoice.header?.totalAmount?.toLocaleString('en-IN') ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-0.5">Net Amount</p>
                  <p className="text-base font-black text-green-700">₹{selectedInvoice.header?.netAmount?.toLocaleString('en-IN') ?? 0}</p>
                </div>
              </div>

              {/* Line Items */}
              <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Services</h3>
              {selectedInvoice.lineItems?.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="px-4 py-3 text-left font-semibold">#</th>
                        <th className="px-4 py-3 text-left font-semibold">Service</th>
                        <th className="px-4 py-3 text-right font-semibold">Cost</th>
                        <th className="px-4 py-3 text-right font-semibold">GST</th>
                        <th className="px-4 py-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lineItems.map((item, idx) => (
                        <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                          <td className="px-4 py-3 text-slate-500 font-medium">{item.lineItemNumber}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{item.serviceDescription || "—"}</td>
                          <td className="px-4 py-3 text-right text-slate-700">₹{item.serviceCost?.toLocaleString('en-IN') ?? 0}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{item.gst ?? 0}%</td>
                          <td className="px-4 py-3 text-right font-bold text-purple-700">₹{item.totalAmount?.toLocaleString('en-IN') ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-purple-700 text-white">
                        <td colSpan={4} className="px-4 py-3 font-bold text-right">Net Amount</td>
                        <td className="px-4 py-3 text-right font-black text-lg">₹{selectedInvoice.header?.netAmount?.toLocaleString('en-IN') ?? 0}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-500">No line items found</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => downloadInvoicePDF(selectedInvoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PDF
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => printInvoice(selectedInvoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </motion.button>
              </div>
              <button
                onClick={() => { setShowLineItemsModal(false); setSelectedInvoice(null); }}
                className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {showAppointmentDetailModal && selectedAppointmentDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">📅 Appointment Details</h2>
                <p className="text-blue-100 text-sm mt-1">Appointment #{selectedAppointmentDetail.appointmentId || selectedAppointmentDetail.AppointmentId || "—"}</p>
              </div>
              <button
                onClick={() => {
                  setShowAppointmentDetailModal(false);
                  setSelectedAppointmentDetail(null);
                  setShowDetailInvoices(false);
                  setDetailInvoices([]);
                }}
                className="text-white hover:bg-blue-700 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {appointmentDetailError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
                  <p className="font-semibold">⚠️ Error</p>
                  <p className="text-sm">{appointmentDetailError}</p>
                </div>
              )}

              {/* Appointment Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Patient</p>
                    <p className="text-base text-stone-800 font-semibold">
                      {[selectedAppointmentDetail.firstName, selectedAppointmentDetail.lastName].filter(Boolean).join(' ') || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedAppointmentDetail.status === "Completed" ? "bg-green-100 text-green-800" :
                      selectedAppointmentDetail.status === "Cancelled" ? "bg-red-100 text-red-800" :
                      selectedAppointmentDetail.status === "Scheduled" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {selectedAppointmentDetail.status || "Pending"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Appointment Date</p>
                    <p className="text-base text-stone-800">{selectedAppointmentDetail.appointmentDate ? new Date(selectedAppointmentDetail.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Time</p>
                    <p className="text-base text-stone-800">
                      {selectedAppointmentDetail.startTime || "N/A"}
                      {selectedAppointmentDetail.endTime ? ` – ${selectedAppointmentDetail.endTime}` : ""}
                      {selectedAppointmentDetail.durationMinutes ? ` (${selectedAppointmentDetail.durationMinutes} min)` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Appointment Type</p>
                    <p className="text-base text-stone-800">{selectedAppointmentDetail.appointmentType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Confirmed</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${selectedAppointmentDetail.isConfirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {selectedAppointmentDetail.isConfirmed ? "Yes" : "Not Yet"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Phone</p>
                    <p className="text-base text-stone-800">{selectedAppointmentDetail.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Email</p>
                    <p className="text-base text-stone-800">{selectedAppointmentDetail.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Doctor</p>
                    <p className="text-base text-stone-800">{selectedAppointmentDetail.attendingPhysician || selectedAppointmentDetail.doctorId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Clinic ID</p>
                    <p className="text-base text-stone-800">{selectedAppointmentDetail.clinicId || "N/A"}</p>
                  </div>
                </div>

                {selectedAppointmentDetail.reasonForVisit && (
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Reason for Visit</p>
                    <p className="text-stone-700">{selectedAppointmentDetail.reasonForVisit}</p>
                  </div>
                )}
                {selectedAppointmentDetail.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Notes</p>
                    <p className="text-stone-700 italic">💬 {selectedAppointmentDetail.notes}</p>
                  </div>
                )}
              </div>

              {/* Invoices Section */}
              {showDetailInvoices ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-purple-900">🧾 Invoices</h3>
                    <button
                      onClick={() => {
                        setShowDetailInvoices(false);
                        setDetailInvoices([]);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                    >
                      ← Back
                    </button>
                  </div>

                  {detailInvoicesLoading ? (
                    <div className="text-center py-6">
                      <p className="text-stone-600">Loading invoices...</p>
                    </div>
                  ) : detailInvoices.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {detailInvoices.map((invoice, idx) => (
                        <motion.div
                          key={invoice.header?.invoiceNumber || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => { setSelectedInvoice(invoice); setShowLineItemsModal(true); }}
                          className="flex items-center justify-between px-4 py-3 bg-white border border-purple-200 rounded-lg cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🧾</span>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">Invoice #{invoice.header?.invoiceNumber}</p>
                              <p className="text-xs text-slate-500">{invoice.header?.billDate ? new Date(invoice.header.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700">₹{invoice.header?.netAmount?.toLocaleString('en-IN') ?? 0}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{invoice.header?.modeOfPayment || "—"}</span>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-stone-600">No invoices found for this appointment</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => loadDetailInvoices(selectedAppointmentDetail.appointmentId)}
                  disabled={detailInvoicesLoading || showDetailInvoices}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-purple-400"
                >
                  {detailInvoicesLoading ? "Loading..." : "💳 View Invoices"}
                </button>
                <button
                  onClick={() => loadDiagnostics(selectedAppointmentDetail.appointmentId)}
                  disabled={diagnosticsLoading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400"
                >
                  {diagnosticsLoading ? "Loading..." : "📋 View Diagnostics"}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAppointmentDetailModal(false);
                  setSelectedAppointmentDetail(null);
                  setShowDetailInvoices(false);
                  setDetailInvoices([]);
                }}
                className="px-6 py-2 bg-stone-300 text-stone-700 rounded-lg font-semibold hover:bg-stone-400 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 sticky top-0 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">📋 Diagnostic Information</h2>
                <p className="text-green-100 text-sm mt-1">Patient Visit Details</p>
              </div>
              <button
                onClick={() => {
                  setShowDiagnosticsModal(false);
                  setDiagnosticsData(null);
                }}
                className="text-white hover:bg-green-700 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {diagnosticsLoading ? (
                <div className="text-center py-12">
                  <p className="text-2xl mb-3">🔍</p>
                  <p className="text-stone-600 font-medium">Fetching diagnostic records...</p>
                </div>
              ) : (diagnosticsError || !diagnosticsData) ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">📋</p>
                  <p className="text-lg font-semibold text-stone-700 mb-2">No Diagnostic Records Found</p>
                  <p className="text-stone-500 text-sm">No visit notes or diagnostic information has been recorded for this appointment yet. The doctor may add these during or after the consultation.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diagnosticsData.chiefComplaint && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-green-900 mb-2">Chief Complaint</h3>
                      <p className="text-stone-800">{diagnosticsData.chiefComplaint}</p>
                    </div>
                  )}
                  {diagnosticsData.diagnosis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-blue-900 mb-2">Diagnosis</h3>
                      <p className="text-stone-800">{diagnosticsData.diagnosis}</p>
                    </div>
                  )}
                  {diagnosticsData.treatmentPlan && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-amber-900 mb-2">Treatment Plan</h3>
                      <p className="text-stone-800">{diagnosticsData.treatmentPlan}</p>
                    </div>
                  )}
                  {diagnosticsData.prescription && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-purple-900 mb-2">💊 Prescription</h3>
                      <div className="text-stone-800 whitespace-pre-wrap">{diagnosticsData.prescription}</div>
                    </div>
                  )}
                  {diagnosticsData.notes && (
                    <div className="bg-stone-100 border border-stone-300 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-stone-900 mb-2">Additional Notes</h3>
                      <p className="text-stone-800 italic">{diagnosticsData.notes}</p>
                    </div>
                  )}
                  {!diagnosticsData.chiefComplaint && !diagnosticsData.diagnosis && !diagnosticsData.treatmentPlan && !diagnosticsData.prescription && !diagnosticsData.notes && (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-4">📋</p>
                      <p className="text-lg font-semibold text-stone-700 mb-2">No Diagnostic Records Found</p>
                      <p className="text-stone-500 text-sm">No visit notes have been recorded for this appointment yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDiagnosticsModal(false);
                  setDiagnosticsData(null);
                }}
                className="px-4 py-2 bg-stone-300 text-stone-700 rounded-lg font-semibold hover:bg-stone-400 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-lg shadow-2xl p-12 max-w-md w-full text-center"
          >
            <div className="mb-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="inline-block"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Success!</h3>
            <p className="text-stone-600 text-lg mb-8">{successMessage}</p>
            <p className="text-stone-400 text-sm">Redirecting to view patients...</p>
          </motion.div>
        </div>
      )}

      {/* Service Billing Modal */}
      {showServiceBillingModal && serviceBillingAppointment && (
        <ServiceBillingModal
          show={showServiceBillingModal}
          onClose={() => {
            setShowServiceBillingModal(false);
            setServiceBillingAppointment(null);
            setServiceBillingInvoiceNumber(null);
          }}
          appointmentId={serviceBillingAppointment.appointmentId}
          appointmentDetails={serviceBillingAppointment}
          invoiceNumber={serviceBillingInvoiceNumber}
          onSuccess={() => {
            setShowServiceBillingModal(false);
            setServiceBillingAppointment(null);
            setServiceBillingInvoiceNumber(null);
          }}
          initialMode="view"
        />
      )}
    </div>
  );
}
