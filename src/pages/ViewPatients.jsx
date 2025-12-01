import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { searchPatients, getPatientsByClinic, getPatientFullProfile } from "../services/patientService";
import { getClinicsByEnterpriseId } from "../services/doctorService";

export default function ViewPatients() {
  const navigate = useNavigate();
  const location = useLocation();
  const isModal = location.state?.isModal;
  const [viewTab, setViewTab] = useState("search");
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: ""
  });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicPatients, setClinicPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // Load clinics on component mount
  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      // Using enterprise ID 1 as default - adjust based on user's enterprise
      const enterpriseId = parseInt(localStorage.getItem('enterpriseId')) || 1;
      const clinicsData = await getClinicsByEnterpriseId(enterpriseId);
      setClinics(clinicsData || []);
    } catch (error) {
      console.error("Error loading clinics:", error);
      alert("Unable to load clinics. Please try again.");
    }
  };

  const handleSearch = async () => {
    if (!filterData.firstName && !filterData.lastName && !filterData.dateOfBirth && !filterData.patientId && !filterData.clinicId) {
      alert("Please enter at least one search criterion");
      return;
    }

    setSearching(true);
    try {
      const searchParams = {};
      if (filterData.patientId) searchParams.patientId = parseInt(filterData.patientId);
      if (filterData.firstName) searchParams.firstName = filterData.firstName;
      if (filterData.lastName) searchParams.lastName = filterData.lastName;
      if (filterData.dateOfBirth) searchParams.dateOfBirth = filterData.dateOfBirth;
      if (filterData.clinicId) searchParams.clinicId = parseInt(filterData.clinicId);

      const results = await searchPatients(searchParams);
      setPatients(results || []);
    } catch (error) {
      console.error("Error searching patients:", error);
      alert("Error searching patients. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleClinicSelect = async (clinicId) => {
    setSelectedClinicId(clinicId);
    if (!clinicId) {
      setClinicPatients([]);
      return;
    }

    setLoading(true);
    try {
      const patients = await getPatientsByClinic(parseInt(clinicId));
      setClinicPatients(patients || []);
    } catch (error) {
      console.error("Error loading patients for clinic:", error);
      alert("Error loading patients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patient) => {
    setShowPatientModal(true);
    setLoadingPatientDetails(true);
    try {
      const fullProfile = await getPatientFullProfile(patient.patientId);
      setSelectedPatient(fullProfile);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      alert("Error loading patient details. Please try again.");
      setShowPatientModal(false);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-8"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
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
            <div className="flex items-center justify-between">
              <div>
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
                    🔍
                  </motion.span>
                  Patient Search Hub
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-indigo-50"
                >
                  Find and view patient records with powerful search
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          {/* Tab Selector with Modern Design */}
          <div className="flex gap-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewTab("search")}
              className={`flex-1 px-6 py-4 font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${
                viewTab === "search"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600"
              }`}
            >
              <span className="text-2xl">🔍</span>
              <span>Search Patients</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewTab("clinic")}
              className={`flex-1 px-6 py-4 font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${
                viewTab === "clinic"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600"
              }`}
            >
              <span className="text-2xl">🏥</span>
              <span>By Clinic</span>
            </motion.button>
          </div>

          {/* Search Patients Tab */}
          {viewTab === "search" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Filter Section with Vibrant Design */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border-2 border-indigo-200 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-700">
                      Search Filters
                    </h3>
                    <p className="text-sm text-indigo-600">Enter at least one search criterion</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <motion.div whileHover={{ scale: 1.02 }} className="relative">
                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span>👤</span> First Name
                    </label>
                    <input
                      type="text"
                      value={filterData.firstName}
                      onChange={(e) => setFilterData({ ...filterData, firstName: e.target.value })}
                      placeholder="e.g., John"
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white shadow-sm"
                    />
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} className="relative">
                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span>👥</span> Last Name
                    </label>
                    <input
                      type="text"
                      value={filterData.lastName}
                      onChange={(e) => setFilterData({ ...filterData, lastName: e.target.value })}
                      placeholder="e.g., Doe"
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white shadow-sm"
                    />
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} className="relative">
                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span>🎂</span> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={filterData.dateOfBirth}
                      onChange={(e) => setFilterData({ ...filterData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white shadow-sm"
                    />
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} className="relative">
                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span>🆔</span> Patient ID
                    </label>
                    <input
                      type="number"
                      value={filterData.patientId}
                      onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                      placeholder="Enter patient ID"
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white shadow-sm"
                    />
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} className="relative">
                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <span>🏥</span> Clinic ID
                    </label>
                    <input
                      type="number"
                      value={filterData.clinicId}
                      onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                      placeholder="Enter clinic ID"
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white shadow-sm"
                    />
                  </motion.div>
                  
                  <div className="flex items-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" })}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-xl font-bold hover:from-slate-300 hover:to-slate-400 transition shadow-md"
                    >
                      🔄 Clear
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSearch}
                      disabled={searching}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searching ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block mr-2"
                          >
                            ⏳
                          </motion.span>
                          Searching...
                        </>
                      ) : (
                        <>🔍 Search</>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Results Section with Cards */}
              <AnimatePresence mode="wait">
                {searching ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block text-6xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-indigo-700 text-xl font-bold">Searching...</p>
                  </motion.div>
                ) : patients.length > 0 ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="mb-6 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                      <h3 className="text-xl font-bold text-green-900 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Search Results
                      </h3>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-green-300 shadow-sm">
                        <span className="text-sm text-green-700 font-medium">Found:</span>
                        <span className="font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">{patients.length}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {patients.map((patient, idx) => (
                        <motion.div
                          key={patient.patientId || idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.03, y: -5 }}
                          className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-purple-300 transition-all duration-300"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                              {(patient.firstName || patient.patientFirstName || 'P').charAt(0)}
                              {(patient.lastName || patient.patientLastName || 'N').charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-700">
                                {patient.firstName || patient.patientFirstName} {patient.lastName || patient.patientLastName}
                              </h4>
                              <p className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full inline-block">
                                ID: {patient.patientId}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between bg-white/60 px-3 py-2 rounded-lg">
                              <span className="text-xs font-semibold text-indigo-700">🎂 DOB:</span>
                              <span className="text-sm font-bold text-indigo-900">
                                {patient.dateOfBirth || patient.patientDOB}
                              </span>
                            </div>
                            <div className="flex justify-between bg-white/60 px-3 py-2 rounded-lg">
                              <span className="text-xs font-semibold text-indigo-700">
                                {(patient.gender || patient.patientGender) === 'Male' ? '👨' : '👩'} Gender:
                              </span>
                              <span className="text-sm font-bold text-indigo-900">
                                {patient.gender || patient.patientGender}
                              </span>
                            </div>
                            <div className="flex justify-between bg-white/60 px-3 py-2 rounded-lg">
                              <span className="text-xs font-semibold text-indigo-700">🏥 Clinic:</span>
                              <span className="text-sm font-bold text-indigo-900">
                                {patient.clinicId || patient.clinicID}
                              </span>
                            </div>
                            <div className="flex justify-between bg-white/60 px-3 py-2 rounded-lg">
                              <span className="text-xs font-semibold text-indigo-700">📞 Phone:</span>
                              <span className="text-sm font-medium text-indigo-900">
                                {patient.contactInfo?.primaryPhone || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t-2 border-indigo-200">
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate('/calendar', {
                                state: { patientData: patient }
                              })}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition shadow-md"
                            >
                              📅 Book
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewPatient(patient)}
                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition shadow-md"
                            >
                              👁️ View
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      className="text-8xl mb-6"
                    >
                      🔍
                    </motion.div>
                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
                      Ready to Search?
                    </h3>
                    <p className="text-slate-600 text-lg mb-2">
                      Enter your search criteria above and click <span className="font-bold text-indigo-600">🔍 Search</span>
                    </p>
                    <p className="text-slate-500 text-base max-w-md mx-auto">
                      Find patients by name, ID, date of birth, or clinic
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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
                      onChange={(e) => handleClinicSelect(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    >
                      <option value="">Select a clinic</option>
                      {clinics.map(clinic => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>
                          {clinic.clinicName} - {clinic.clinicCity}
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
                      Patients at {clinics.find(c => c.clinicId === parseInt(selectedClinicId))?.clinicName}
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
                              {patient.firstName?.charAt(0) || patient.patientFirstName?.charAt(0)}{patient.lastName?.charAt(0) || patient.patientLastName?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-amber-900">{patient.firstName || patient.patientFirstName} {patient.lastName || patient.patientLastName}</h4>
                              <p className="text-sm text-stone-500">ID: {patient.patientId}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-stone-600">DOB:</span>
                              <span className="font-medium text-stone-800">{patient.dateOfBirth || patient.patientDOB}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Gender:</span>
                              <span className="font-medium text-stone-800">{patient.gender || patient.patientGender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Phone:</span>
                              <span className="font-medium text-stone-800">{patient.contactInfo?.primaryPhone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Blood Type:</span>
                              <span className="font-medium text-stone-800">{patient.bloodType || patient.patientBloodType || 'N/A'}</span>
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
        </motion.div>
      </div>

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowPatientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-8 border-2 border-indigo-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                      <span className="text-4xl">👤</span>
                      Patient Medical Record
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      Complete patient profile and medical history
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPatientModal(false)}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all duration-200"
                    title="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-indigo-50 to-purple-50">
                {loadingPatientDetails ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-indigo-200">
                    <div className="flex justify-center mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent"
                      />
                    </div>
                    <p className="text-indigo-800 text-lg font-semibold">Loading patient information...</p>
                    <p className="text-indigo-600 text-sm mt-2">Please wait</p>
                  </div>
                ) : selectedPatient ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-indigo-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">👤</span>
                        </div>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-700">
                          Basic Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">First Name</label>
                          <p className="text-lg font-bold text-indigo-900">{selectedPatient?.patient?.patientFirstName || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">Last Name</label>
                          <p className="text-lg font-bold text-indigo-900">{selectedPatient?.patient?.patientLastName || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">Patient ID</label>
                          <p className="text-lg font-bold text-indigo-900">{selectedPatient?.patient?.patientId || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-pink-700 uppercase tracking-wide mb-2">Date of Birth</label>
                          <p className="text-lg font-bold text-pink-900">{selectedPatient?.patient?.patientDOB?.split('T')[0] || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Gender</label>
                          <p className="text-lg font-bold text-blue-900">{selectedPatient?.patient?.patientGender || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Blood Type</label>
                          <p className="text-lg font-bold text-red-900">{selectedPatient?.patient?.patientBloodType || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-teal-200"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-teal-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">📞</span>
                        </div>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-cyan-700">
                          Contact Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-teal-700 uppercase tracking-wide">📱 Phone Number</label>
                          <p className="text-base font-semibold text-teal-900 mt-2">{selectedPatient?.patientContact?.patientPhone || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-teal-700 uppercase tracking-wide">📧 Email Address</label>
                          <p className="text-base font-semibold text-teal-900 mt-2">{selectedPatient?.patientContact?.patientEmail || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-teal-700 uppercase tracking-wide">🏠 Address</label>
                          <p className="text-base font-semibold text-teal-900 mt-2">{selectedPatient?.patientContact?.patientAddress || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-teal-700 uppercase tracking-wide">🌆 City</label>
                          <p className="text-base font-semibold text-teal-900 mt-2">{selectedPatient?.patientContact?.patientCity || 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-teal-700 uppercase tracking-wide">🚨 Emergency Contact</label>
                          <p className="text-base font-semibold text-teal-900 mt-2">{selectedPatient?.patientContact?.patientEmergencyContact || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Medical Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-200"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-amber-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">🏥</span>
                        </div>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-900 to-orange-700">
                          Medical Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-amber-700 uppercase tracking-wide">⚠️ Allergies</label>
                          <p className="text-sm text-amber-900 mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.patientAllergies || 'None reported'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-amber-700 uppercase tracking-wide">💊 Current Medications</label>
                          <p className="text-sm text-amber-900 mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.patientCurrentMedications || 'None'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-amber-700 uppercase tracking-wide">🩺 Chronic Diseases</label>
                          <p className="text-sm text-amber-900 mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.chronicDiseases || 'None'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-amber-700 uppercase tracking-wide">👨‍⚕️ Primary Physician</label>
                          <p className="text-sm text-amber-900 mt-2">{selectedPatient?.patientMedicalInfo?.patientPrimaryPhysician || 'Not assigned'}</p>
                        </div>
                        <div className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-amber-700 uppercase tracking-wide">📋 Medical History</label>
                          <p className="text-sm text-amber-900 mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.medicalHistory || 'No history available'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-green-700 uppercase tracking-wide">📊 Number of Visits</label>
                          <p className="text-2xl font-bold text-green-900 mt-2">{selectedPatient?.patientMedicalInfo?.no_of_visits || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                          <label className="text-sm font-bold text-green-700 uppercase tracking-wide">📅 Last Visit</label>
                          <p className="text-base font-semibold text-green-900 mt-2">
                            {selectedPatient?.patientMedicalInfo?.lastVisitedDate?.split('T')[0] || 'Never'}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Insurance Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-cyan-200"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-cyan-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl">💳</span>
                        </div>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-900 to-blue-700">
                          Insurance Information
                        </h3>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl">
                        <label className="text-sm font-bold text-cyan-700 uppercase tracking-wide">🏢 Insurance Provider</label>
                        <p className="text-lg font-bold text-cyan-900 mt-2">
                          {selectedPatient?.patientInsurance?.patientInsuranceProvider || 'No insurance on file'}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-red-200">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-red-600 text-lg font-semibold">Unable to load patient information</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-8 py-4 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPatientModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
