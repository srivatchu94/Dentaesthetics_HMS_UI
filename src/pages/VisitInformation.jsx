import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { searchPatients } from "../services/patientService";
import { visitService } from "../services/visitService";

export default function VisitInformation() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("home"); // home, enter, view
  const [searchFilters, setSearchFilters] = useState({
    patientId: "",
    clinicId: "",
    firstName: "",
    lastName: ""
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showAddVisitForm, setShowAddVisitForm] = useState(false);
  const [patientVisits, setPatientVisits] = useState([]);
  
  // Visit filter states
  const [visitFilters, setVisitFilters] = useState({
    clinicId: "",
    patientId: "",
    visitDate: ""
  });
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  
  // New visit form state
  const [newVisit, setNewVisit] = useState({
    patientId: "",
    clinicId: "",
    visitDate: "",
    reasonForVisit: "",
    diagnoses: "",
    treatments: "",
    prescriptions: "",
    notes: "",
    nextAppointmentDate: "",
    attendingPhysician: "",
    billingAmount: "",
    paymentStatus: "Pending"
  });

  // Sample visits data for demonstration
  const SAMPLE_VISITS = [
    {
      visitId: 1,
      patientId: 1,
      visitDate: "2025-01-15",
      reasonForVisit: "Routine Checkup",
      diagnoses: "Mild gingivitis, Early stage cavity on tooth #18",
      treatments: "Dental cleaning, Fluoride treatment",
      prescriptions: "Chlorhexidine mouthwash 0.2% - Use twice daily",
      notes: "Patient reports sensitivity to cold",
      nextAppointmentDate: "2025-04-15",
      attendingPhysician: "Dr. Rajesh Kumar",
      billingAmount: 20750.00,
      paymentStatus: "Paid"
    }
  ];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        ...(searchFilters.patientId && { patientId: parseInt(searchFilters.patientId) }),
        ...(searchFilters.clinicId && { clinicId: parseInt(searchFilters.clinicId) }),
        ...(searchFilters.firstName && { firstName: searchFilters.firstName }),
        ...(searchFilters.lastName && { lastName: searchFilters.lastName })
      };

      const response = await searchPatients(params);
      setSearchResults(response || []);
    } catch (error) {
      console.error("Error searching patients:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVisits = (patient) => {
    setSelectedPatient(patient);
    const visits = SAMPLE_VISITS.filter(v => v.patientId === patient.patientId);
    setPatientVisits(visits);
    setShowVisitModal(true);
  };

  const handleAddVisit = () => {
    setShowAddVisitForm(!showAddVisitForm);
    if (!showAddVisitForm) {
      setNewVisit({
        patientId: selectedPatient?.patientId || "",
        clinicId: selectedPatient?.clinicId || "",
        visitDate: new Date().toISOString().split('T')[0],
        reasonForVisit: "",
        diagnoses: "",
        treatments: "",
        prescriptions: "",
        notes: "",
        nextAppointmentDate: "",
        attendingPhysician: "",
        billingAmount: "",
        paymentStatus: "Pending"
      });
    }
  };

  const handleFilterVisits = async () => {
    if (!visitFilters.clinicId && !visitFilters.patientId && !visitFilters.visitDate) {
      alert("⚠️ Please enter at least one filter criteria (Clinic ID, Patient ID, or Visit Date)");
      return;
    }

    setLoadingVisits(true);
    try {
      let visits = [];
      
      // Priority: Patient ID > Clinic ID > Date
      if (visitFilters.patientId) {
        visits = await visitService.getVisitsByPatientId(parseInt(visitFilters.patientId));
      } else if (visitFilters.clinicId) {
        visits = await visitService.getVisitsByClinicId(parseInt(visitFilters.clinicId));
      } else if (visitFilters.visitDate) {
        const endDate = visitFilters.visitDate; // Same date for single day
        visits = await visitService.getVisitsByDateRange(visitFilters.visitDate, endDate);
      }
      
      // Apply additional filters if multiple criteria provided
      let filtered = visits;
      if (visitFilters.clinicId && visitFilters.patientId) {
        filtered = filtered.filter(v => v.clinicId === parseInt(visitFilters.clinicId));
      }
      if (visitFilters.visitDate) {
        filtered = filtered.filter(v => v.visitDate.split('T')[0] === visitFilters.visitDate);
      }
      
      setFilteredVisits(filtered);
      
      if (filtered.length === 0) {
        alert('ℹ️ No visits found matching the search criteria');
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error);
      alert('❌ Failed to fetch visits. Please try again.');
      setFilteredVisits([]);
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
  };

  const handleSaveVisit = async () => {
    // Validation
    if (!newVisit.visitDate) {
      alert("Please enter a visit date");
      return;
    }
    if (!newVisit.reasonForVisit) {
      alert("Please enter a reason for visit");
      return;
    }

    setSavingVisit(true);
    try {
      // Build the PatientVisitInformation model from user input
      const visitPayload = {
        patientId: selectedPatient.patientId,
        clinicId: selectedPatient.clinicId || 1, // Use patient's clinic or default to 1
        visitDate: newVisit.visitDate,
        reasonForVisit: newVisit.reasonForVisit,
        diagnoses: newVisit.diagnoses || "",
        treatments: newVisit.treatments || "",
        prescriptions: newVisit.prescriptions || "",
        notes: newVisit.notes || "",
        nextAppointmentDate: newVisit.nextAppointmentDate || "",
        attendingPhysician: newVisit.attendingPhysician || "",
        billingAmount: parseFloat(newVisit.billingAmount) || 0,
        paymentStatus: newVisit.paymentStatus
      };

      // Call the API to add patient visit
      const savedVisit = await visitService.createVisit(visitPayload);
      
      // Update local state with the saved visit
      setPatientVisits([savedVisit, ...patientVisits]);
      setShowAddVisitForm(false);
      
      // Reset form
      setNewVisit({
        visitDate: "",
        reasonForVisit: "",
        diagnoses: "",
        treatments: "",
        prescriptions: "",
        notes: "",
        nextAppointmentDate: "",
        attendingPhysician: "",
        billingAmount: "",
        paymentStatus: "Pending"
      });
      
      // Show success message
      alert(`✅ Visit information saved successfully! Visit ID: ${savedVisit.visitId}`);
    } catch (error) {
      console.error("Error saving visit:", error);
      const errorMessage = error.message || "Failed to save visit information. Please try again.";
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSavingVisit(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // === HOME VIEW ===
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-6xl"
              >
                🏥
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Visit Information
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Manage patient visits and medical records</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Enter Visit Info Tile */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotateY: 5, rotateZ: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView("enter")}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-all duration-500 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-white to-blue-50 rounded-3xl p-10 shadow-2xl overflow-hidden border-2 border-blue-200/50 hover:border-blue-400/80 transition-all duration-300">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shine"></div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-300 to-purple-400 rounded-full opacity-20"
                ></motion.div>
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full opacity-20"
                ></motion.div>

                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{
                      y: [0, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-7xl mb-6"
                  >
                    📝
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Enter Visit Info</h2>
                  <p className="text-gray-600 mb-6">Record new patient visit details and medical information</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-blue-600 font-semibold">Get Started</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* View Visits Tile */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotateY: -5, rotateZ: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView("view")}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-all duration-500 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-white to-purple-50 rounded-3xl p-10 shadow-2xl overflow-hidden border-2 border-purple-200/50 hover:border-purple-400/80 transition-all duration-300">
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shine"></div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [360, 180, 0]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full opacity-20"
                ></motion.div>
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-pink-300 to-red-400 rounded-full opacity-20"
                ></motion.div>

                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{
                      y: [0, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: 0.5
                    }}
                    className="text-7xl mb-6"
                  >
                    👁️
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">View Visits</h2>
                  <p className="text-gray-600 mb-6">Search and review patient visit history and records</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-purple-600 font-semibold">Browse Records</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // === RENDER SEARCH FORM (shared by both enter and view) ===
  const renderSearchForm = (colorScheme) => (
    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Patient</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Patient ID"
          value={searchFilters.patientId}
          onChange={(e) => setSearchFilters({ ...searchFilters, patientId: e.target.value })}
          className={`px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${colorScheme}-500 focus:border-transparent`}
        />
        <input
          type="text"
          placeholder="Clinic ID"
          value={searchFilters.clinicId}
          onChange={(e) => setSearchFilters({ ...searchFilters, clinicId: e.target.value })}
          className={`px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${colorScheme}-500 focus:border-transparent`}
        />
        <input
          type="text"
          placeholder="First Name"
          value={searchFilters.firstName}
          onChange={(e) => setSearchFilters({ ...searchFilters, firstName: e.target.value })}
          className={`px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${colorScheme}-500 focus:border-transparent`}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={searchFilters.lastName}
          onChange={(e) => setSearchFilters({ ...searchFilters, lastName: e.target.value })}
          className={`px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${colorScheme}-500 focus:border-transparent`}
        />
      </div>
      <button
        onClick={handleSearch}
        disabled={loading}
        className={`w-full px-6 py-4 bg-gradient-to-r from-${colorScheme}-600 to-${colorScheme === 'blue' ? 'purple' : 'pink'}-600 text-white rounded-xl font-semibold hover:from-${colorScheme}-700 hover:to-${colorScheme === 'blue' ? 'purple' : 'pink'}-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50`}
      >
        {loading ? "Searching..." : "🔍 Search Patient"}
      </button>
    </div>
  );

  // === RENDER SEARCH RESULTS (shared by both enter and view) ===
  const renderSearchResults = (buttonText, buttonColor, onClickHandler) => (
    searchResults.length > 0 && (
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((patient) => (
            <motion.div
              key={patient.patientId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className={`bg-gradient-to-br from-${buttonColor}-50 to-${buttonColor === 'blue' ? 'purple' : 'pink'}-50 rounded-2xl p-6 shadow-lg`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br from-${buttonColor}-400 to-${buttonColor === 'blue' ? 'purple' : 'pink'}-600 rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                  {patient.patientFirstName?.[0]}{patient.patientLastName?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{patient.patientFirstName} {patient.patientLastName}</h3>
                  <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-gray-600">📧 {patient.patientEmail}</p>
                <p className="text-gray-600">📞 {patient.patientPhone}</p>
                <p className="text-gray-600">🎂 {patient.patientDOB}</p>
                <p className="text-gray-600">⚥ {patient.patientGender}</p>
              </div>
              <button
                onClick={() => onClickHandler(patient)}
                className={`w-full px-4 py-2 bg-gradient-to-r from-${buttonColor}-600 to-${buttonColor === 'blue' ? 'purple' : 'pink'}-600 text-white rounded-xl font-semibold hover:from-${buttonColor}-700 hover:to-${buttonColor === 'blue' ? 'purple' : 'pink'}-700 transition-all duration-300`}
              >
                {buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    )
  );

  // === ENTER VIEW ===
  if (currentView === "enter") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView("home")}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 font-semibold"
          >
            <span>←</span>
            <span>Back to Home</span>
          </motion.button>

          {/* Header Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full opacity-10"
            ></motion.div>
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 270, 180, 90, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-white rounded-full opacity-10"
            ></motion.div>
            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl"
              >
                📝
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Enter Visit Information
                </h1>
                <p className="text-blue-100 text-lg">Record patient visit details and medical information</p>
              </div>
            </div>
          </motion.div>

          {/* Visit Entry Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-indigo-100"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Patient Visit Details</h2>
              <p className="text-gray-600">Fill in the information below to record a new patient visit</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Patient ID *</label>
                <input
                  type="number"
                  value={newVisit.patientId || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, patientId: e.target.value })}
                  placeholder="Enter patient ID"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Clinic ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Clinic ID *</label>
                <input
                  type="number"
                  value={newVisit.clinicId || ''}
                  onChange={(e) => setNewVisit({ ...newVisit, clinicId: e.target.value })}
                  placeholder="Enter clinic ID"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Visit Date *</label>
                <input
                  type="date"
                  value={newVisit.visitDate}
                  onChange={(e) => setNewVisit({ ...newVisit, visitDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Attending Physician */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Attending Physician</label>
                <input
                  type="text"
                  value={newVisit.attendingPhysician}
                  onChange={(e) => setNewVisit({ ...newVisit, attendingPhysician: e.target.value })}
                  placeholder="Dr. Name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Reason for Visit */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Visit *</label>
                <input
                  type="text"
                  value={newVisit.reasonForVisit}
                  onChange={(e) => setNewVisit({ ...newVisit, reasonForVisit: e.target.value })}
                  placeholder="e.g., Routine checkup, Toothache, Follow-up"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Diagnoses */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Diagnoses</label>
                <textarea
                  value={newVisit.diagnoses}
                  onChange={(e) => setNewVisit({ ...newVisit, diagnoses: e.target.value })}
                  placeholder="Medical diagnoses and observations..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Treatments */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Treatments</label>
                <textarea
                  value={newVisit.treatments}
                  onChange={(e) => setNewVisit({ ...newVisit, treatments: e.target.value })}
                  placeholder="Treatments provided during the visit..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Prescriptions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Prescriptions</label>
                <textarea
                  value={newVisit.prescriptions}
                  onChange={(e) => setNewVisit({ ...newVisit, prescriptions: e.target.value })}
                  placeholder="Medications prescribed..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                  placeholder="Additional notes and observations..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Next Appointment */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Next Appointment Date</label>
                <input
                  type="date"
                  value={newVisit.nextAppointmentDate}
                  onChange={(e) => setNewVisit({ ...newVisit, nextAppointmentDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Billing Amount */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Billing Amount (₹)</label>
                <input
                  type="number"
                  value={newVisit.billingAmount}
                  onChange={(e) => setNewVisit({ ...newVisit, billingAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Payment Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Status</label>
                <div className="grid grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNewVisit({ ...newVisit, paymentStatus: 'Pending' })}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      newVisit.paymentStatus === 'Pending'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ⏳ Pending
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNewVisit({ ...newVisit, paymentStatus: 'Paid' })}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      newVisit.paymentStatus === 'Paid'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Paid
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNewVisit({ ...newVisit, paymentStatus: 'Partial' })}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      newVisit.paymentStatus === 'Partial'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ◐ Partial
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setNewVisit({
                    visitDate: "",
                    reasonForVisit: "",
                    diagnoses: "",
                    treatments: "",
                    prescriptions: "",
                    notes: "",
                    nextAppointmentDate: "",
                    attendingPhysician: "",
                    billingAmount: "",
                    paymentStatus: "Pending",
                    patientId: "",
                    clinicId: ""
                  });
                }}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                🔄 Reset Form
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  // Validation
                  if (!newVisit.patientId || !newVisit.clinicId) {
                    alert('Please enter Patient ID and Clinic ID');
                    return;
                  }
                  if (!newVisit.visitDate) {
                    alert('Please enter a visit date');
                    return;
                  }
                  if (!newVisit.reasonForVisit) {
                    alert('Please enter a reason for visit');
                    return;
                  }

                  setSavingVisit(true);
                  try {
                    const visitPayload = {
                      patientId: parseInt(newVisit.patientId),
                      clinicId: parseInt(newVisit.clinicId),
                      visitDate: newVisit.visitDate,
                      reasonForVisit: newVisit.reasonForVisit,
                      diagnoses: newVisit.diagnoses || "",
                      treatments: newVisit.treatments || "",
                      prescriptions: newVisit.prescriptions || "",
                      notes: newVisit.notes || "",
                      nextAppointmentDate: newVisit.nextAppointmentDate || "",
                      attendingPhysician: newVisit.attendingPhysician || "",
                      billingAmount: parseFloat(newVisit.billingAmount) || 0,
                      paymentStatus: newVisit.paymentStatus
                    };

                    const savedVisit = await visitService.createVisit(visitPayload);
                    alert(`✅ Visit saved successfully! Visit ID: ${savedVisit.visitId}`);
                    
                    // Reset form
                    setNewVisit({
                      visitDate: "",
                      reasonForVisit: "",
                      diagnoses: "",
                      treatments: "",
                      prescriptions: "",
                      notes: "",
                      nextAppointmentDate: "",
                      attendingPhysician: "",
                      billingAmount: "",
                      paymentStatus: "Pending",
                      patientId: "",
                      clinicId: ""
                    });
                  } catch (error) {
                    console.error('Error saving visit:', error);
                    alert(`❌ Error: ${error.message || 'Failed to save visit'}`);
                  } finally {
                    setSavingVisit(false);
                  }
                }}
                disabled={savingVisit || !newVisit.patientId || !newVisit.clinicId || !newVisit.visitDate || !newVisit.reasonForVisit}
                className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${
                  savingVisit || !newVisit.patientId || !newVisit.clinicId || !newVisit.visitDate || !newVisit.reasonForVisit
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white hover:shadow-2xl'
                }`}
              >
                {savingVisit ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Visit Information'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // === VIEW VIEW ===
  if (currentView === "view") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setCurrentView("home")}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-gray-700 font-semibold hover:scale-105"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>

          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <span className="text-6xl">🏥</span>
              View Patient Visits
            </h1>
            <p className="text-gray-600 text-lg">Search by clinic, patient, or date to view visit records</p>
          </div>

          {/* Filter Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🔍</span>
              Filter Visits
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Clinic ID */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
                  <span>🏥</span> Clinic ID
                </label>
                <input
                  type="text"
                  value={visitFilters.clinicId}
                  onChange={(e) => setVisitFilters({ ...visitFilters, clinicId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  placeholder="Enter Clinic ID"
                />
              </div>

              {/* Patient ID */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
                  <span>👤</span> Patient ID
                </label>
                <input
                  type="number"
                  value={visitFilters.patientId}
                  onChange={(e) => setVisitFilters({ ...visitFilters, patientId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition-all"
                  placeholder="Enter Patient ID"
                />
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
                  <span>📅</span> Visit Date
                </label>
                <input
                  type="date"
                  value={visitFilters.visitDate}
                  onChange={(e) => setVisitFilters({ ...visitFilters, visitDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFilterVisits}
                disabled={!visitFilters.clinicId && !visitFilters.patientId && !visitFilters.visitDate}
                className={`flex-1 px-8 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  visitFilters.clinicId || visitFilters.patientId || visitFilters.visitDate
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>🔍</span>
                <span>Search Visits</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetVisitFilters}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Reset</span>
              </motion.button>
            </div>

            {!visitFilters.clinicId && !visitFilters.patientId && !visitFilters.visitDate && (
              <p className="text-sm text-amber-600 mt-4 flex items-center gap-2">
                <span>⚠️</span>
                <span>At least one filter is required to search</span>
              </p>
            )}
          </motion.div>

          {/* Loading State */}
          {loadingVisits && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-white text-lg font-bold">Loading visits...</p>
            </div>
          )}

          {/* Results Summary */}
          {!loadingVisits && filteredVisits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold text-2xl shadow-lg">
                    {filteredVisits.length}
                  </div>
                  <div>
                    <p className="text-lg font-bold">Search Results</p>
                    <p className="text-sm opacity-90">
                      {filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {visitFilters.clinicId && <p className="text-sm">🏥 Clinic: {visitFilters.clinicId}</p>}
                  {visitFilters.patientId && <p className="text-sm">👤 Patient: {visitFilters.patientId}</p>}
                  {visitFilters.visitDate && <p className="text-sm">📅 Date: {visitFilters.visitDate}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Visit Tiles Grid */}
          {!loadingVisits && filteredVisits.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    whileHover={{ scale: 1.05, y: -8, boxShadow: "0 25px 50px rgba(0,0,0,0.2)" }}
                    className={`${colorScheme.card} border-2 ${colorScheme.border} rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer relative group`}
                  >
                    {/* Gradient Header */}
                    <div className={`h-3 bg-gradient-to-r ${colorScheme.bg}`}></div>

                    <div className="p-6">
                      {/* Visit ID Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${colorScheme.bg} text-white font-bold text-sm shadow-md`}>
                          🆔 Visit #{visit.visitId}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          visit.paymentStatus === 'Paid' 
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-amber-100 text-amber-700 border border-amber-300'
                        }`}>
                          {visit.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}
                        </div>
                      </div>

                      {/* Visit Details */}
                      <div className="space-y-3">
                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">👤</span>
                            <p className="text-xs text-gray-500 font-semibold">Patient ID</p>
                          </div>
                          <p className="text-lg font-bold text-gray-800 ml-7">{visit.patientId}</p>
                        </div>

                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">📅</span>
                            <p className="text-xs text-gray-500 font-semibold">Visit Date</p>
                          </div>
                          <p className="text-sm font-bold text-gray-800 ml-7">
                            {visitDate.toLocaleDateString('en-US', { 
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">🩺</span>
                            <p className="text-xs text-gray-500 font-semibold">Reason</p>
                          </div>
                          <p className="text-sm font-bold text-gray-800 ml-7 truncate">
                            {visit.reasonForVisit || 'N/A'}
                          </p>
                        </div>

                        {visit.diagnoses && (
                          <div className="bg-white rounded-xl p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">🔬</span>
                              <p className="text-xs text-gray-500 font-semibold">Diagnosis</p>
                            </div>
                            <p className="text-xs text-gray-700 ml-7 line-clamp-2">
                              {visit.diagnoses}
                            </p>
                          </div>
                        )}

                        {visit.attendingPhysician && (
                          <div className="bg-white rounded-xl p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">👨‍⚕️</span>
                              <p className="text-xs text-gray-500 font-semibold">Doctor</p>
                            </div>
                            <p className="text-sm font-bold text-gray-800 ml-7">
                              {visit.attendingPhysician}
                            </p>
                          </div>
                        )}

                        {visit.billingAmount && (
                          <div className="bg-white rounded-xl p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">💰</span>
                              <p className="text-xs text-gray-500 font-semibold">Billing</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 ml-7">
                              ₹{visit.billingAmount.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Hover hint */}
                      <div className={`mt-4 pt-4 border-t border-gray-200 text-xs font-bold ${colorScheme.text} opacity-0 group-hover:opacity-100 transition-opacity text-center`}>
                        Click for full details →
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State - No Search Done Yet */}
          {!loadingVisits && filteredVisits.length === 0 && !visitFilters.clinicId && !visitFilters.patientId && !visitFilters.visitDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
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
                className="text-9xl mb-6"
              >
                🔍
              </motion.div>
              <h3 className="text-4xl font-bold text-white mb-3">Ready to Search!</h3>
              <p className="text-xl text-white opacity-90 mb-2">Enter at least one filter above to view patient visits</p>
              <p className="text-lg text-white opacity-75">Use Clinic ID, Patient ID, or Visit Date</p>
            </motion.div>
          )}

          {/* Empty State - No Results After Search */}
          {!loadingVisits && filteredVisits.length === 0 && (visitFilters.clinicId || visitFilters.patientId || visitFilters.visitDate) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 text-white"
            >
              <div className="text-8xl mb-4">📭</div>
              <h3 className="text-3xl font-bold mb-2">No Visits Found</h3>
              <p className="text-lg opacity-90">Try adjusting your search filters</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // === VISIT MODAL ===
  return (
    <AnimatePresence>
      {showVisitModal && selectedPatient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVisitModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Patient Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg">
                    {selectedPatient.patientFirstName?.[0]}{selectedPatient.patientLastName?.[0]}
                  </div>
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-2">
                      {selectedPatient.patientFirstName} {selectedPatient.patientLastName}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span>📋 ID: {selectedPatient.patientId}</span>
                      <span>🎂 DOB: {selectedPatient.patientDOB}</span>
                      <span>⚥ {selectedPatient.patientGender}</span>
                      <span>🩸 {selectedPatient.patientBloodType || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowVisitModal(false)}
                  className="text-white text-4xl hover:rotate-90 transition-transform duration-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Add Visit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddVisit}
                className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                {showAddVisitForm ? "✖️ Cancel" : "➕ Add New Visit"}
              </motion.button>

              {/* Add Visit Form */}
              <AnimatePresence>
                {showAddVisitForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6">New Visit Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Date *</label>
                          <input
                            type="date"
                            value={newVisit.visitDate}
                            onChange={(e) => setNewVisit({ ...newVisit, visitDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Attending Physician</label>
                          <input
                            type="text"
                            value={newVisit.attendingPhysician}
                            onChange={(e) => setNewVisit({ ...newVisit, attendingPhysician: e.target.value })}
                            placeholder="Dr. Name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Visit *</label>
                          <input
                            type="text"
                            value={newVisit.reasonForVisit}
                            onChange={(e) => setNewVisit({ ...newVisit, reasonForVisit: e.target.value })}
                            placeholder="e.g., Routine checkup, Toothache, etc."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnoses</label>
                          <textarea
                            value={newVisit.diagnoses}
                            onChange={(e) => setNewVisit({ ...newVisit, diagnoses: e.target.value })}
                            placeholder="Medical diagnoses..."
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Treatments</label>
                          <textarea
                            value={newVisit.treatments}
                            onChange={(e) => setNewVisit({ ...newVisit, treatments: e.target.value })}
                            placeholder="Treatments provided..."
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Prescriptions</label>
                          <textarea
                            value={newVisit.prescriptions}
                            onChange={(e) => setNewVisit({ ...newVisit, prescriptions: e.target.value })}
                            placeholder="Medications prescribed..."
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                          <textarea
                            value={newVisit.notes}
                            onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                            placeholder="Additional notes..."
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Next Appointment</label>
                          <input
                            type="date"
                            value={newVisit.nextAppointmentDate}
                            onChange={(e) => setNewVisit({ ...newVisit, nextAppointmentDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Amount (₹)</label>
                          <input
                            type="number"
                            value={newVisit.billingAmount}
                            onChange={(e) => setNewVisit({ ...newVisit, billingAmount: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                          <select
                            value={newVisit.paymentStatus}
                            onChange={(e) => setNewVisit({ ...newVisit, paymentStatus: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveVisit}
                        disabled={savingVisit || !newVisit.visitDate || !newVisit.reasonForVisit}
                        className={`w-full mt-6 px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                          savingVisit || !newVisit.visitDate || !newVisit.reasonForVisit
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                        }`}
                      >
                        {savingVisit ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          '💾 Save Visit Information'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visit History */}
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Visit History ({patientVisits.length})</h3>
              {patientVisits.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-6xl mb-4">📋</p>
                  <p className="text-xl">No visits recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientVisits.map((visit) => (
                    <motion.div
                      key={visit.visitId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{visit.reasonForVisit}</h4>
                          <p className="text-gray-600">📅 {visit.visitDate}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-xl font-semibold ${
                          visit.paymentStatus === "Paid" ? "bg-green-100 text-green-700" :
                          visit.paymentStatus === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {visit.paymentStatus}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Diagnoses:</p>
                          <p className="text-sm text-gray-600">{visit.diagnoses || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Treatments:</p>
                          <p className="text-sm text-gray-600">{visit.treatments || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Prescriptions:</p>
                          <p className="text-sm text-gray-600">{visit.prescriptions || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Attending Physician:</p>
                          <p className="text-sm text-gray-600">{visit.attendingPhysician || "N/A"}</p>
                        </div>
                      </div>

                      {visit.notes && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{visit.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                        <div className="text-sm text-gray-600">
                          {visit.nextAppointmentDate && (
                            <span>🗓️ Next: {visit.nextAppointmentDate}</span>
                          )}
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          ₹{visit.billingAmount?.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
