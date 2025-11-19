import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { createPatient } from "../services/patientService";

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

  // Filter patients by selected clinic
  const clinicPatients = selectedClinicId 
    ? mockPatients.filter(p => p.clinicId === parseInt(selectedClinicId))
    : [];

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
      alert("✅ Patient registration successful! Patient ID: " + response.patient.patientId);
      
      // Clear form after successful submission
      setPatientData({ firstName: "", lastName: "", dateOfBirth: "", gender: "", bloodGroup: "", maritalStatus: "", isActive: true });
      setContactData({ phoneNumber: "", alternatePhoneNumber: "", email: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "", emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "" });
      setMedicalData({ allergies: "", chronicConditions: "", currentMedications: "", pastSurgeries: "", familyMedicalHistory: "", smokingStatus: "", alcoholConsumption: "", exerciseFrequency: "", dietaryRestrictions: "", lastDentalVisit: "", notes: "" });
      setInsuranceData({ insuranceProvider: "", policyNumber: "", groupNumber: "", policyHolderName: "", policyHolderRelation: "", coverageStartDate: "", coverageEndDate: "", isPrimaryInsurance: true, copayAmount: "", deductibleAmount: "", coveragePercentage: "", insurancePhone: "", isActive: true });
      
      // Optionally switch to list view
      setActiveView("list");
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
                ? "bg-amber-600 text-white shadow-lg"
                : "bg-white text-stone-700 hover:bg-stone-50 shadow"
            }`}
          >
            📝 Register Patient
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeView === "list"
                ? "bg-amber-600 text-white shadow-lg"
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
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition flex items-center gap-2"
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

            {/* Results Summary */}
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-stone-600">
                Showing <span className="font-semibold text-amber-700">{filteredPatients.length}</span> of <span className="font-semibold">{SAMPLE_PATIENTS_LIST.length}</span> patients
              </p>
            </div>

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
                            className={`border-b border-stone-200 hover:bg-amber-50 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}
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
                          className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
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
                <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">Select Clinic</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Clinic</label>
                      <select
                        value={selectedClinicId}
                        onChange={(e) => setSelectedClinicId(e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      >
                        <option value="">Select a clinic</option>
                        {mockClinics.map(clinic => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            {clinic.clinicName} (ID: {clinic.clinicId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Patients Grid */}
                {selectedClinicId ? (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-amber-900">
                        Patients at {mockClinics.find(c => c.clinicId === parseInt(selectedClinicId))?.clinicName}
                      </h3>
                      <p className="text-sm text-stone-600">
                        Total: <span className="font-semibold text-amber-700">{clinicPatients.length}</span> patient(s)
                      </p>
                    </div>

                    {clinicPatients.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clinicPatients.map((patient) => (
                          <motion.div
                            key={patient.patientId}
                            whileHover={{ scale: 1.02, y: -4 }}
                            className="bg-white border-2 border-stone-200 rounded-lg p-6 shadow-md hover:shadow-xl hover:border-amber-300 transition-all"
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-coral-400 to-peach-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-amber-900">{patient.firstName} {patient.lastName}</h4>
                                <p className="text-sm text-stone-500">ID: {patient.patientId}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">DOB:</span>
                                <span className="font-medium text-stone-800">{patient.dateOfBirth}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">Gender:</span>
                                <span className="font-medium text-stone-800">{patient.gender}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">Phone:</span>
                                <span className="font-medium text-stone-800">{patient.phoneNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">Registered:</span>
                                <span className="font-medium text-stone-800">{patient.registrationDate}</span>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-stone-200 flex gap-2">
                              <button className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition text-sm">
                                View Details
                              </button>
                              <button className="flex-1 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg font-semibold hover:bg-stone-200 transition text-sm">
                                Edit
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                        <p className="text-stone-500 text-lg">No patients registered at this clinic</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                    <p className="text-stone-500 text-lg">Please select a clinic to view patients</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
