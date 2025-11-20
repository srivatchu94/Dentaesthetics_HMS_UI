import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { createPatient, getPatientsByClinic } from "../services/patientService";

// Reusable InputField component - moved outside to prevent re-creation on renders
const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", options = null }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
      >
        <option value="">Select {label}</option>
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
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
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
  const [activeView, setActiveView] = useState("list");
  
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
  
  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    patient: true,
    contact: false,
    medical: false,
    insurance: false
  });

  // Form state for all four models
  const [patientData, setPatientData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
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

  // Fetch patients by clinic ID (manual search)
  const fetchClinicPatients = async () => {
    if (!selectedClinicId || selectedClinicId.trim() === "") {
      setClinicError("Please enter a clinic ID");
      return;
    }

    setLoadingClinicPatients(true);
    setClinicError("");

    try {
      const clinicId = parseInt(selectedClinicId);
      if (isNaN(clinicId)) {
        setClinicError("Please enter a valid clinic ID");
        setClinicPatientsData([]);
        setLoadingClinicPatients(false);
        return;
      }

      const patients = await getPatientsByClinic(clinicId);
      console.log("API Response:", patients);
      console.log("First patient:", patients[0]);
      setClinicPatientsData(patients);
      setClinicError("");
    } catch (error) {
      console.error("Error fetching clinic patients:", error);
      setClinicError(error.message || "Failed to fetch patients for this clinic. Please check the clinic ID.");
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
        patientBloodType: patientData.bloodGroup || ""
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

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-coral-500 to-peach-500 rounded-lg shadow-coral p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Patient Management</h1>
          <p className="text-amber-50">Register, view, and manage patient information</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {/* View Selector */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveView("register")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeView === "register"
                ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-white text-stone-700 hover:bg-stone-50 shadow"
            }`}
          >
            📝 Register Patient
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeView === "list"
                ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-lg"
                : "bg-white text-stone-700 hover:bg-stone-50 shadow"
            }`}
          >
            📋 View Patients
          </button>
        </div>

        {/* Registration Form */}
        {activeView === "register" && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">New Patient Registration</h2>
            
            {/* Patient Basic Information */}
            <CollapsibleSection
              title="Patient Information"
              icon="👤"
              isOpen={openSections.patient}
              onToggle={() => toggleSection("patient")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </CollapsibleSection>

            {/* Contact Information */}
            <CollapsibleSection
              title="Contact Information"
              icon="📞"
              isOpen={openSections.contact}
              onToggle={() => toggleSection("contact")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="md:col-span-2">
                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    placeholder="patient@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <InputField
                    label="Address Line 1"
                    name="addressLine1"
                    value={contactData.addressLine1}
                    onChange={(e) => setContactData({ ...contactData, addressLine1: e.target.value })}
                    required
                    placeholder="Street address"
                  />
                </div>
                <div className="md:col-span-2">
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
                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </CollapsibleSection>

            {/* Medical Information */}
            <CollapsibleSection
              title="Medical Information"
              icon="🏥"
              isOpen={openSections.medical}
              onToggle={() => toggleSection("medical")}
            >
              <div className="grid grid-cols-1 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CollapsibleSection>

            {/* Insurance Information */}
            <CollapsibleSection
              title="Insurance Information"
              icon="💳"
              isOpen={openSections.insurance}
              onToggle={() => toggleSection("insurance")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CollapsibleSection>

            {/* Submit Button */}
            <div className="mt-8 flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setPatientData({ firstName: "", lastName: "", dateOfBirth: "", gender: "", bloodGroup: "", maritalStatus: "", isActive: true });
                  setContactData({ phoneNumber: "", alternatePhoneNumber: "", email: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "" });
                  setMedicalData({ allergies: "", chronicConditions: "", currentMedications: "", pastSurgeries: "", familyMedicalHistory: "", smokingStatus: "", alcoholConsumption: "", exerciseFrequency: "", dietaryRestrictions: "", lastDentalVisit: "", notes: "" });
                  setInsuranceData({ insuranceProvider: "", policyNumber: "", groupNumber: "", policyHolderName: "", policyHolderRelation: "", coverageStartDate: "", coverageEndDate: "", isPrimaryInsurance: true, copayAmount: "", deductibleAmount: "", coveragePercentage: "", insurancePhone: "", isActive: true });
                }}
                className="px-6 py-3 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-coral-500 to-peach-500 text-white rounded-lg font-semibold hover:from-coral-600 hover:to-peach-600 shadow-coral transition"
              >
                Register Patient
              </button>
            </div>
          </form>
        )}

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

            {/* View Tab Selector */}
            <div className="mb-6 flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewTab("search")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  viewTab === "search"
                    ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50 shadow border border-slate-200"
                }`}
              >
                <span>🔍</span> Search All Patients
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewTab("clinic")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  viewTab === "clinic"
                    ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50 shadow border border-slate-200"
                }`}
              >
                <span>🏥</span> View by Clinic ID
              </motion.button>
            </div>

            {/* Results Summary - Only show for search tab */}
            {viewTab === "search" && (
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-stone-600">
                  Showing <span className="font-semibold text-amber-700">{filteredPatients.length}</span> of <span className="font-semibold">{SAMPLE_PATIENTS_LIST.length}</span> patients
                </p>
              </div>
            )}

            {/* Results Table */}
            {viewTab === "search" && (
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
                        type="number"
                        value={filterData.patientId}
                        onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                        placeholder="Enter patient ID"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Clinic ID</label>
                      <input
                        type="number"
                        value={filterData.clinicId}
                        onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                        placeholder="Enter clinic ID"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" })}
                        className="w-full px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredPatients.length > 0 ? (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-coral-100 to-peach-100 border-b-2 border-coral-300">
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">ID</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Date of Birth</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Gender</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Phone</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">City</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-amber-900">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map((patient, idx) => (
                          <motion.tr
                            key={patient.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`border-b border-stone-200 hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-cyan-50/30 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}
                          >
                            <td className="px-6 py-4 text-sm text-stone-700 font-medium">#{patient.id}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-stone-900">
                              {patient.firstName} {patient.lastName}
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-700">{patient.dateOfBirth}</td>
                            <td className="px-6 py-4 text-sm text-stone-700">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                patient.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                              }`}>
                                {patient.gender}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-700">{patient.phoneNumber}</td>
                            <td className="px-6 py-4 text-sm text-stone-600">{patient.email}</td>
                            <td className="px-6 py-4 text-sm text-stone-700">{patient.city}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                patient.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {patient.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-700">{patient.lastVisit}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-cream-50 to-peach-50 rounded-xl border-2 border-dashed border-coral-300">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-stone-600 text-lg font-semibold">No patients found</p>
                      <p className="text-stone-500 text-sm mt-2">Try adjusting your search or filters</p>
                      {(searchQuery || Object.values(filters).some(v => v !== "")) && (
                        <button
                          onClick={clearFilters}
                          className="mt-4 px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-700 transition shadow-md hover:shadow-lg"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clinic-Based Grid Tab */}
            {viewTab === "clinic" && (
              <div>
                {/* Clinic Selector */}
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 mb-6 border-2 border-teal-200 shadow-md">
                  <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
                    <span>🏥</span> Search Patients by Clinic ID
                  </h3>
                  <div className="flex gap-4 items-end">
                    <div className="w-80">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Clinic ID</label>
                      <input
                        type="text"
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            fetchClinicPatients();
                          }
                        }}
                        placeholder="Enter clinic ID..."
                        className="w-full px-4 py-2.5 border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchClinicPatients}
                      disabled={loadingClinicPatients || !selectedClinicId.trim()}
                      className={`px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all whitespace-nowrap ${
                        loadingClinicPatients || !selectedClinicId.trim()
                          ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 hover:shadow-xl'
                      }`}
                    >
                      {loadingClinicPatients ? '⏳ Searching...' : '🔍 Search'}
                    </motion.button>
                    <p className="text-xs text-slate-600 pb-1">
                      💡 Enter clinic ID and click Search or press Enter
                    </p>
                  </div>
                </div>

                {/* Loading State */}
                {loadingClinicPatients && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200"
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

                {/* Error State */}
                {clinicError && !loadingClinicPatients && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6 text-center"
                  >
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-900 mb-2">Unable to Load Patients</h3>
                    <p className="text-red-700">{clinicError}</p>
                    <button
                      onClick={() => {
                        setSelectedClinicId("");
                        setClinicError("");
                      }}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-rose-600 transition shadow-md"
                    >
                      Try Another Clinic
                    </button>
                  </motion.div>
                )}

                {/* Patients Grid */}
                {selectedClinicId && !loadingClinicPatients && !clinicError && (
                  <div>
                    {/* Results Header */}
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

                    {clinicPatients.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clinicPatients.map((patientData, idx) => {
                          // API returns flat patient objects
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
                            {/* Decorative gradient overlay */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                            
                            {/* Patient Header */}
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
                            </div>
                            
                            {/* Patient Info Grid */}
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

                            {/* Action Buttons */}
                            <div className="relative flex gap-2 pt-4 border-t-2 border-indigo-200">
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition shadow-md hover:shadow-lg text-sm"
                              >
                                👁️ View
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg text-sm"
                              >
                                ✏️ Edit
                              </motion.button>
                            </div>
                          </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border-2 border-slate-200"
                      >
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-slate-600 text-lg font-semibold">No Patients Found</p>
                        <p className="text-slate-500 text-sm mt-2">There are no patients registered at Clinic #{selectedClinicId}</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Empty State - No Clinic Selected */}
                {!selectedClinicId && !loadingClinicPatients && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-7xl mb-4"
                    >
                      🏥
                    </motion.div>
                    <h3 className="text-xl font-bold text-purple-900 mb-2">Enter a Clinic ID</h3>
                    <p className="text-purple-700">Type a clinic ID above to view all patients registered at that clinic</p>
                    <p className="text-purple-600 text-sm mt-2">Real-time data will be fetched from the server</p>
                  </motion.div>
                )}
              </div>
            )}
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
    </div>
  );
}
