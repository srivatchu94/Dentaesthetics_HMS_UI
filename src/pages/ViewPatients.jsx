import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { searchPatients, getFullPatientProfile, updateFullPatientProfile } from "../api/hmsApi";
import { getUserAccess, getSelectedAccess } from "../services/authService";
import { listClinics } from "../api/hmsApi";
import FancyDatePicker from "../components/FancyDatePicker";

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
    clinicId: ""
  });
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

  const smokingStatusOptions = [
    { value: "Never", label: "Never" },
    { value: "Former", label: "Former" },
    { value: "Current", label: "Current" }
  ];

  const exerciseFrequencyOptions = [
    { value: "Daily", label: "Daily" },
    { value: "3-4 times a week", label: "3-4 times a week" },
    { value: "1-2 times a week", label: "1-2 times a week" },
    { value: "Rarely", label: "Rarely" },
    { value: "Never", label: "Never" }
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

  const handleSearchClick = async () => {
    setIsLoading(true);
    try {
      const params = {
        firstName: filterData.firstName || undefined,
        lastName: filterData.lastName || undefined,
        dob: filterData.dateOfBirth || undefined,
        patientId: filterData.patientId ? parseInt(filterData.patientId) : undefined,
        clinicId: filterData.clinicId ? parseInt(filterData.clinicId) : undefined
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
      clinicId: clinics.length > 0 ? clinics[0].clinicId.toString() : ""
    });
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
        pastSurgeries: medicalInfo.medicalHistory ? medicalInfo.medicalHistory.split(';')[0] : "",
        familyMedicalHistory: medicalInfo.patientPrimaryPhysician || "",
        smokingStatus: medicalInfo.medicalHistory && medicalInfo.medicalHistory.includes('Smoking:') ? medicalInfo.medicalHistory.split('Smoking:')[1].split(';')[0].trim() : "",
        alcoholConsumption: medicalInfo.medicalHistory && medicalInfo.medicalHistory.includes('Alcohol:') ? medicalInfo.medicalHistory.split('Alcohol:')[1].split(';')[0].trim() : "",
        exerciseFrequency: medicalInfo.medicalHistory && medicalInfo.medicalHistory.includes('Exercise:') ? medicalInfo.medicalHistory.split('Exercise:')[1].split(';')[0].trim() : "",
        dietaryRestrictions: medicalInfo.medicalHistory && medicalInfo.medicalHistory.includes('Diet:') ? medicalInfo.medicalHistory.split('Diet:')[1].split(';')[0].trim() : "",
        lastDentalVisit: medicalInfo.lastVisitedDate ? medicalInfo.lastVisitedDate.split('T')[0] : "",
        notes: medicalInfo.medicalHistory || "",
        noOfVisits: medicalInfo.noOfVisits || 0,
        lastVisitedDate: medicalInfo.lastVisitedDate ? medicalInfo.lastVisitedDate.split('T')[0] : ""
      };

      const newInsuranceData = {
        insuranceProvider: insuranceInfo.patientInsuranceProvider || "",
        policyNumber: insuranceInfo.patientPolicyNumber || "",
        groupNumber: insuranceInfo.patientGroupNumber || "",
        policyHolderName: insuranceInfo.patientPolicyHolderName || "",
        policyHolderRelation: insuranceInfo.patientPolicyHolderRelation || "",
        coverageStartDate: insuranceInfo.patientCoverageStartDate ? insuranceInfo.patientCoverageStartDate.split('T')[0] : "",
        coverageEndDate: insuranceInfo.patientCoverageEndDate ? insuranceInfo.patientCoverageEndDate.split('T')[0] : "",
        isPrimaryInsurance: insuranceInfo.patientIsPrimaryInsurance !== false,
        copayAmount: insuranceInfo.patientCopayAmount || ""
      };

      console.log('✅ FINAL MAPPED STATE TO BE SET:');
      console.table(newPatientData);
      console.log('Contact Data:', newContactData);
      console.log('Medical Data:', newMedicalData);
      console.log('Insurance Data:', newInsuranceData);

      // SET THE STATE
      setEditPatientData(newPatientData);
      setEditContactData(newContactData);
      setEditMedicalData(newMedicalData);
      setEditInsuranceData(newInsuranceData);
      setEditingPatientId(patientId);
      
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
      
      if (!editMedicalData.medicalHistory || editMedicalData.medicalHistory.trim() === "") {
        setEditError("Medical History (PatientMedicalInfo.MedicalHistory) is required. Please fill in the Medical History field.");
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
          medicalHistory: editMedicalData.medicalHistory,
          noOfVisits: editMedicalData.noOfVisits,
          lastVisitedDate: editMedicalData.lastVisitedDate
        },
        patientInsurance: {
          patientId: editPatientData.patientId,
          patientInsuranceProvider: editInsuranceData.insuranceProvider,
          patientPolicyNumber: editInsuranceData.policyNumber,
          patientGroupNumber: editInsuranceData.groupNumber,
          patientPolicyHolderName: editInsuranceData.policyHolderName,
          patientPolicyHolderRelation: editInsuranceData.policyHolderRelation,
          patientCoverageStartDate: editInsuranceData.coverageStartDate,
          patientCoverageEndDate: editInsuranceData.coverageEndDate,
          patientIsPrimaryInsurance: editInsuranceData.isPrimaryInsurance,
          patientCopayAmount: editInsuranceData.copayAmount
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
        // Optionally refresh the patient data in the list if you want
        handleSearchClick();
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to update patient:", error);
      setEditError(error.message || "Failed to update patient. Please try again.");
    } finally {
      setEditIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">View Patients</h1>
              <p className="text-amber-50">Search and manage patient records</p>
            </div>
            <button
              onClick={() => navigate("/patients")}
              className="px-6 py-3 bg-white text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition shadow-lg"
            >
              ← Back to Patients
            </button>
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
                  type="number"
                  value={filterData.patientId}
                  onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                  placeholder="Enter patient ID"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Clinic</th>
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
                      <td className="px-4 py-3 text-sm text-stone-700">{patient.clinicID}</td>
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
                  {isEditMode && (
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setIsEditMode(false);
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
                onClick={() => setEditActiveTab("insurance")}
                className={`px-6 py-3 font-semibold transition-all ${
                  editActiveTab === "insurance"
                    ? "text-amber-700 border-b-2 border-amber-600"
                    : "text-stone-500 hover:text-amber-600"
                }`}
              >
                Insurance
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
                    label="Medical History (Required)"
                    name="medicalHistory"
                    type="textarea"
                    value={editMedicalData.medicalHistory}
                    onChange={(e) => setEditMedicalData({...editMedicalData, medicalHistory: e.target.value})}
                    placeholder="Enter medical history (required)"
                    required
                    disabled={!isEditMode}
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
                    placeholder="Enter alcohol consumption"
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
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 p-6 border-t border-stone-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setIsEditMode(false);
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
    </div>
  );
}
