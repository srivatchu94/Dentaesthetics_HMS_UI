import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function EditPatients() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("patient");

  // Filter states
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: ""
  });

  // Mock patient data with full details
  const mockPatients = [
    { 
      patientId: 1, 
      firstName: "John", 
      lastName: "Doe", 
      dateOfBirth: "1990-05-15", 
      gender: "Male", 
      clinicId: 1,
      bloodGroup: "A+",
      maritalStatus: "Married",
      phoneNumber: "+1 555-0101",
      alternatePhoneNumber: "+1 555-0199",
      email: "john.doe@email.com",
      addressLine1: "123 Main Street",
      addressLine2: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "USA",
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "+1 555-0102",
      emergencyContactRelation: "Spouse",
      allergies: "Penicillin, Pollen",
      chronicConditions: "Hypertension",
      currentMedications: "Lisinopril 10mg daily",
      pastSurgeries: "Appendectomy (2015)",
      familyMedicalHistory: "Father - Heart Disease",
      smokingStatus: "Never",
      alcoholConsumption: "Occasional",
      exerciseFrequency: "Moderate",
      dietaryRestrictions: "None",
      lastDentalVisit: "2024-09-15",
      notes: "Regular checkups recommended",
      insuranceProvider: "BlueCross BlueShield",
      policyNumber: "BC12345678",
      groupNumber: "GRP001",
      policyHolderName: "John Doe",
      policyHolderRelation: "Self",
      coverageStartDate: "2023-01-01",
      coverageEndDate: "2024-12-31",
      isPrimaryInsurance: true,
      copayAmount: 25,
      deductibleAmount: 1000,
      coveragePercentage: 80,
      insurancePhone: "+1 800-555-0100"
    },
    { 
      patientId: 2, 
      firstName: "Jane", 
      lastName: "Smith", 
      dateOfBirth: "1985-08-22", 
      gender: "Female", 
      clinicId: 1,
      bloodGroup: "O-",
      maritalStatus: "Single",
      phoneNumber: "+1 555-0102",
      alternatePhoneNumber: "",
      email: "jane.smith@email.com",
      addressLine1: "456 Oak Avenue",
      addressLine2: "",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11201",
      country: "USA",
      emergencyContactName: "Robert Smith",
      emergencyContactPhone: "+1 555-0201",
      emergencyContactRelation: "Brother",
      allergies: "Latex",
      chronicConditions: "Asthma",
      currentMedications: "Albuterol inhaler as needed",
      pastSurgeries: "None",
      familyMedicalHistory: "Mother - Diabetes Type 2",
      smokingStatus: "Never",
      alcoholConsumption: "None",
      exerciseFrequency: "Active",
      dietaryRestrictions: "Vegetarian",
      lastDentalVisit: "2024-10-20",
      notes: "Prefers morning appointments",
      insuranceProvider: "Aetna",
      policyNumber: "AET98765432",
      groupNumber: "GRP002",
      policyHolderName: "Jane Smith",
      policyHolderRelation: "Self",
      coverageStartDate: "2024-01-01",
      coverageEndDate: "2025-12-31",
      isPrimaryInsurance: true,
      copayAmount: 30,
      deductibleAmount: 1500,
      coveragePercentage: 70,
      insurancePhone: "+1 800-555-0200"
    }
  ];

  // Editable patient data state
  const [editData, setEditData] = useState({});

  // Filter patients
  const filteredPatients = mockPatients.filter(patient => {
    if (filterData.firstName && !patient.firstName.toLowerCase().includes(filterData.firstName.toLowerCase())) return false;
    if (filterData.lastName && !patient.lastName.toLowerCase().includes(filterData.lastName.toLowerCase())) return false;
    if (filterData.dateOfBirth && patient.dateOfBirth !== filterData.dateOfBirth) return false;
    if (filterData.patientId && patient.patientId !== parseInt(filterData.patientId)) return false;
    if (filterData.clinicId && patient.clinicId !== parseInt(filterData.clinicId)) return false;
    return true;
  });

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setEditData({...patient}); // Clone patient data for editing
    setShowSearch(false);
  };

  const handleBack = () => {
    setShowSearch(true);
    setSelectedPatient(null);
    setEditData({});
    setActiveTab("patient");
  };

  const handleSave = () => {
    console.log("Saving patient data:", editData);
    alert("Patient information updated successfully!");
    handleBack();
  };

  const updateEditData = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", options = null }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          name={name}
          value={value || ""}
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
          value={value || ""}
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
          value={value || ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Edit Patient Information</h1>
              <p className="text-amber-50">Search and update patient records</p>
            </div>
            {showSearch && (
              <button
                onClick={() => navigate("/patients")}
                className="px-6 py-3 bg-white text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition shadow-lg"
              >
                ← Back to Patients
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {/* Search View */}
          {showSearch && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-amber-900 mb-6">Search Patient to Edit</h2>
              
              {/* Filter Section */}
              <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-4">Filter Patients</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Patient Grid */}
              <div>
                <div className="mb-4">
                  <p className="text-sm text-stone-600">
                    Found <span className="font-semibold text-amber-700">{filteredPatients.length}</span> patient(s)
                  </p>
                </div>

                {filteredPatients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                      <motion.div
                        key={patient.patientId}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-white border-2 border-stone-200 rounded-lg p-6 shadow-md hover:shadow-xl hover:border-amber-300 transition-all cursor-pointer"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
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
                            <span className="text-stone-600">Clinic ID:</span>
                            <span className="font-medium text-stone-800">{patient.clinicId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-600">Phone:</span>
                            <span className="font-medium text-stone-800">{patient.phoneNumber}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-stone-200">
                          <button className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition text-sm">
                            Select to Edit
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                    <p className="text-stone-500 text-lg">No patients found matching your criteria</p>
                    <p className="text-stone-400 text-sm mt-2">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Edit View */}
          {!showSearch && selectedPatient && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-lg shadow-lg"
            >
              {/* Action Bar */}
              <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition flex items-center gap-2"
                >
                  ← Back to Search
                </button>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-amber-900">
                    Editing: {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-sm text-stone-600">Patient ID: {selectedPatient.patientId}</p>
                </div>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-6 border-b border-stone-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("patient")}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === "patient"
                      ? "bg-amber-600 text-white shadow-lg"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  👤 Patient Info
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === "contact"
                      ? "bg-amber-600 text-white shadow-lg"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  📞 Contact
                </button>
                <button
                  onClick={() => setActiveTab("medical")}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === "medical"
                      ? "bg-amber-600 text-white shadow-lg"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  🏥 Medical Info
                </button>
                <button
                  onClick={() => setActiveTab("insurance")}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === "insurance"
                      ? "bg-amber-600 text-white shadow-lg"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  💳 Insurance
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {/* Patient Info Tab */}
                  {activeTab === "patient" && (
                    <motion.div
                      key="patient-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <h3 className="text-xl font-bold text-amber-900 mb-6">Patient Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="First Name"
                          name="firstName"
                          value={editData.firstName}
                          onChange={(e) => updateEditData("firstName", e.target.value)}
                          required
                        />
                        <InputField
                          label="Last Name"
                          name="lastName"
                          value={editData.lastName}
                          onChange={(e) => updateEditData("lastName", e.target.value)}
                          required
                        />
                        <InputField
                          label="Date of Birth"
                          name="dateOfBirth"
                          type="date"
                          value={editData.dateOfBirth}
                          onChange={(e) => updateEditData("dateOfBirth", e.target.value)}
                          required
                        />
                        <InputField
                          label="Gender"
                          name="gender"
                          value={editData.gender}
                          onChange={(e) => updateEditData("gender", e.target.value)}
                          required
                          options={["Male", "Female", "Other"]}
                        />
                        <InputField
                          label="Blood Group"
                          name="bloodGroup"
                          value={editData.bloodGroup}
                          onChange={(e) => updateEditData("bloodGroup", e.target.value)}
                          options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                        />
                        <InputField
                          label="Marital Status"
                          name="maritalStatus"
                          value={editData.maritalStatus}
                          onChange={(e) => updateEditData("maritalStatus", e.target.value)}
                          options={["Single", "Married", "Divorced", "Widowed"]}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Contact Tab */}
                  {activeTab === "contact" && (
                    <motion.div
                      key="contact-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <h3 className="text-xl font-bold text-amber-900 mb-6">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Phone Number"
                          name="phoneNumber"
                          type="tel"
                          value={editData.phoneNumber}
                          onChange={(e) => updateEditData("phoneNumber", e.target.value)}
                          required
                        />
                        <InputField
                          label="Alternate Phone"
                          name="alternatePhoneNumber"
                          type="tel"
                          value={editData.alternatePhoneNumber}
                          onChange={(e) => updateEditData("alternatePhoneNumber", e.target.value)}
                        />
                        <div className="md:col-span-2">
                          <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            value={editData.email}
                            onChange={(e) => updateEditData("email", e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <InputField
                            label="Address Line 1"
                            name="addressLine1"
                            value={editData.addressLine1}
                            onChange={(e) => updateEditData("addressLine1", e.target.value)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <InputField
                            label="Address Line 2"
                            name="addressLine2"
                            value={editData.addressLine2}
                            onChange={(e) => updateEditData("addressLine2", e.target.value)}
                          />
                        </div>
                        <InputField
                          label="City"
                          name="city"
                          value={editData.city}
                          onChange={(e) => updateEditData("city", e.target.value)}
                          required
                        />
                        <InputField
                          label="State/Province"
                          name="state"
                          value={editData.state}
                          onChange={(e) => updateEditData("state", e.target.value)}
                          required
                        />
                        <InputField
                          label="Postal Code"
                          name="postalCode"
                          value={editData.postalCode}
                          onChange={(e) => updateEditData("postalCode", e.target.value)}
                          required
                        />
                        <InputField
                          label="Country"
                          name="country"
                          value={editData.country}
                          onChange={(e) => updateEditData("country", e.target.value)}
                          required
                        />
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-stone-200">
                          <h4 className="font-semibold text-amber-900 mb-4">Emergency Contact</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField
                              label="Name"
                              name="emergencyContactName"
                              value={editData.emergencyContactName}
                              onChange={(e) => updateEditData("emergencyContactName", e.target.value)}
                            />
                            <InputField
                              label="Phone"
                              name="emergencyContactPhone"
                              type="tel"
                              value={editData.emergencyContactPhone}
                              onChange={(e) => updateEditData("emergencyContactPhone", e.target.value)}
                            />
                            <InputField
                              label="Relation"
                              name="emergencyContactRelation"
                              value={editData.emergencyContactRelation}
                              onChange={(e) => updateEditData("emergencyContactRelation", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Medical Info Tab */}
                  {activeTab === "medical" && (
                    <motion.div
                      key="medical-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <h3 className="text-xl font-bold text-amber-900 mb-6">Medical Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <InputField
                          label="Allergies"
                          name="allergies"
                          type="textarea"
                          value={editData.allergies}
                          onChange={(e) => updateEditData("allergies", e.target.value)}
                        />
                        <InputField
                          label="Chronic Conditions"
                          name="chronicConditions"
                          type="textarea"
                          value={editData.chronicConditions}
                          onChange={(e) => updateEditData("chronicConditions", e.target.value)}
                        />
                        <InputField
                          label="Current Medications"
                          name="currentMedications"
                          type="textarea"
                          value={editData.currentMedications}
                          onChange={(e) => updateEditData("currentMedications", e.target.value)}
                        />
                        <InputField
                          label="Past Surgeries"
                          name="pastSurgeries"
                          type="textarea"
                          value={editData.pastSurgeries}
                          onChange={(e) => updateEditData("pastSurgeries", e.target.value)}
                        />
                        <InputField
                          label="Family Medical History"
                          name="familyMedicalHistory"
                          type="textarea"
                          value={editData.familyMedicalHistory}
                          onChange={(e) => updateEditData("familyMedicalHistory", e.target.value)}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField
                            label="Smoking Status"
                            name="smokingStatus"
                            value={editData.smokingStatus}
                            onChange={(e) => updateEditData("smokingStatus", e.target.value)}
                            options={["Never", "Former", "Current"]}
                          />
                          <InputField
                            label="Alcohol Consumption"
                            name="alcoholConsumption"
                            value={editData.alcoholConsumption}
                            onChange={(e) => updateEditData("alcoholConsumption", e.target.value)}
                            options={["None", "Occasional", "Moderate", "Heavy"]}
                          />
                          <InputField
                            label="Exercise Frequency"
                            name="exerciseFrequency"
                            value={editData.exerciseFrequency}
                            onChange={(e) => updateEditData("exerciseFrequency", e.target.value)}
                            options={["Sedentary", "Light", "Moderate", "Active", "Very Active"]}
                          />
                          <InputField
                            label="Last Dental Visit"
                            name="lastDentalVisit"
                            type="date"
                            value={editData.lastDentalVisit}
                            onChange={(e) => updateEditData("lastDentalVisit", e.target.value)}
                          />
                        </div>
                        <InputField
                          label="Dietary Restrictions"
                          name="dietaryRestrictions"
                          type="textarea"
                          value={editData.dietaryRestrictions}
                          onChange={(e) => updateEditData("dietaryRestrictions", e.target.value)}
                        />
                        <InputField
                          label="Additional Notes"
                          name="notes"
                          type="textarea"
                          value={editData.notes}
                          onChange={(e) => updateEditData("notes", e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Insurance Tab */}
                  {activeTab === "insurance" && (
                    <motion.div
                      key="insurance-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <h3 className="text-xl font-bold text-amber-900 mb-6">Insurance Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Insurance Provider"
                          name="insuranceProvider"
                          value={editData.insuranceProvider}
                          onChange={(e) => updateEditData("insuranceProvider", e.target.value)}
                        />
                        <InputField
                          label="Policy Number"
                          name="policyNumber"
                          value={editData.policyNumber}
                          onChange={(e) => updateEditData("policyNumber", e.target.value)}
                        />
                        <InputField
                          label="Group Number"
                          name="groupNumber"
                          value={editData.groupNumber}
                          onChange={(e) => updateEditData("groupNumber", e.target.value)}
                        />
                        <InputField
                          label="Insurance Phone"
                          name="insurancePhone"
                          type="tel"
                          value={editData.insurancePhone}
                          onChange={(e) => updateEditData("insurancePhone", e.target.value)}
                        />
                        <InputField
                          label="Policy Holder Name"
                          name="policyHolderName"
                          value={editData.policyHolderName}
                          onChange={(e) => updateEditData("policyHolderName", e.target.value)}
                        />
                        <InputField
                          label="Relationship to Policy Holder"
                          name="policyHolderRelation"
                          value={editData.policyHolderRelation}
                          onChange={(e) => updateEditData("policyHolderRelation", e.target.value)}
                          options={["Self", "Spouse", "Child", "Parent", "Other"]}
                        />
                        <InputField
                          label="Coverage Start Date"
                          name="coverageStartDate"
                          type="date"
                          value={editData.coverageStartDate}
                          onChange={(e) => updateEditData("coverageStartDate", e.target.value)}
                        />
                        <InputField
                          label="Coverage End Date"
                          name="coverageEndDate"
                          type="date"
                          value={editData.coverageEndDate}
                          onChange={(e) => updateEditData("coverageEndDate", e.target.value)}
                        />
                        <InputField
                          label="Copay Amount"
                          name="copayAmount"
                          type="number"
                          value={editData.copayAmount}
                          onChange={(e) => updateEditData("copayAmount", e.target.value)}
                        />
                        <InputField
                          label="Deductible Amount"
                          name="deductibleAmount"
                          type="number"
                          value={editData.deductibleAmount}
                          onChange={(e) => updateEditData("deductibleAmount", e.target.value)}
                        />
                        <InputField
                          label="Coverage Percentage"
                          name="coveragePercentage"
                          type="number"
                          value={editData.coveragePercentage}
                          onChange={(e) => updateEditData("coveragePercentage", e.target.value)}
                        />
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData.isPrimaryInsurance}
                              onChange={(e) => updateEditData("isPrimaryInsurance", e.target.checked)}
                              className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-400"
                            />
                            <span className="text-sm font-medium text-stone-700">Primary Insurance</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
