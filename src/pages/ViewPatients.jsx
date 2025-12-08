import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { searchPatients, getPatientsByClinic, getPatientFullProfile } from "../services/patientService";
import { getClinicsByEnterpriseId } from "../services/doctorService";
import { getAppointmentsByPatient, createAppointment, updateAppointment } from "../services/appointmentService";

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
  
  // Appointment states
  const [showAppointmentHistory, setShowAppointmentHistory] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({});
  
  // Custom popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ type: 'error', title: '', message: '', emoji: '🤔' });
  
  // Show custom popup function
  const showCustomPopup = (type, title, message, emoji) => {
    setPopupConfig({ type, title, message, emoji });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 4000);
  };

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
      showCustomPopup('error', 'Oops!', 'The clinics seem to be playing hide and seek! 🙈 Please try again.', '🏥');
    }
  };

  const handleSearch = async () => {
    if (!filterData.firstName && !filterData.lastName && !filterData.dateOfBirth && !filterData.patientId && !filterData.clinicId) {
      showCustomPopup('warning', 'Hold On!', 'We need at least one clue to find your patient! 🕵️‍♂️ Try adding a name or ID.', '🔍');
      return;
    }

    setSearching(true);
    
    // Build search params outside try block so it's accessible in catch
    const searchParams = {};
    if (filterData.patientId) searchParams.patientId = parseInt(filterData.patientId);
    if (filterData.firstName) searchParams.firstName = filterData.firstName;
    if (filterData.lastName) searchParams.lastName = filterData.lastName;
    if (filterData.dateOfBirth) searchParams.dateOfBirth = filterData.dateOfBirth;
    if (filterData.clinicId) searchParams.clinicId = parseInt(filterData.clinicId);
    
    try {
      const results = await searchPatients(searchParams);
      setPatients(results || []);
      
      if (results && results.length === 0) {
        showCustomPopup('info', 'No Matches!', 'Looks like this patient is taking a vacation! 🏖️ Try different search terms.', '🤷‍♂️');
      }
    } catch (error) {
      console.error("❌ ========== PATIENT SEARCH ERROR ==========");
      console.error("🛑 PREVENTING ANY NAVIGATION/LOGOUT - ERROR WILL BE DISPLAYED HERE");
      console.error("📍 Search Parameters:", searchParams);
      console.error("🔴 Error Object:", error);
      console.error("📊 Error Status:", error?.status);
      console.error("📄 Error Message:", error?.message);
      console.error("📦 Error Response:", error?.response);
      
      // Log full error details if response exists
      if (error?.response) {
        console.error("🔍 Full API Response:");
        console.error("   Status:", error.response.status);
        console.error("   Status Text:", error.response.statusText);
        console.error("   Response Body:", error.response.data);
        
        // Try to parse if it's JSON
        try {
          const parsedError = JSON.parse(error.response.data);
          console.error("   Parsed Error:", parsedError);
        } catch (e) {
          console.error("   (Response is not JSON)");
        }
      }
      
      // Log session storage state
      console.error("🔐 Local Storage State:");
      console.error("   Access Token:", localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
      console.error("   Refresh Token:", localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING');
      console.error("   Selected Access:", localStorage.getItem('selectedAccess'));
      console.error("==========================================");
      
      // Check if it's an authentication error - SHOW ERROR BUT DON'T LOGOUT/REDIRECT
      if (error.status === 401 || error.status === 403) {
        console.error('🚨🚨🚨 ========== AUTHENTICATION ERROR DETECTED ========== 🚨🚨🚨');
        console.error('⏸️ SYSTEM PAUSED - DO NOT REDIRECT OR LOGOUT');
        console.error('📊 Error Status:', error.status);
        console.error('📄 Error Message:', error.message);
        console.error('📦 Error Response Data:', error?.response?.data);
        console.error('🔍 Full Error Object:', error);
        console.error('💡 TIP: Review all the logs above to understand why authentication failed');
        console.error('🔧 Check: Token validity, role permissions, backend logs');
        console.error('===============================================================');
        
        const errorMsg = error?.response?.data || error?.message || 'Access Denied';
        
        // Create persistent error message
        const errorDetails = `
🚫 AUTHENTICATION ERROR (${error.status})

API Response: ${errorMsg}

⚠️ IMPORTANT: 
- The console (F12) has detailed logs
- DO NOT close this alert yet
- Review the console logs first
- Token and permission details are logged above

Click OK after reviewing the console logs.`;
        
        alert(errorDetails);
        
        // Show popup but DON'T navigate away
        showCustomPopup('error', 'Access Denied!', `${error.status}: ${errorMsg}`, '🚫');
      } else if (error.message) {
        showCustomPopup('error', 'Whoopsie!', `Our search hamster fell off the wheel! 🐹 ${error.message}`, '⚠️');
      } else {
        showCustomPopup('error', 'Uh-oh!', 'The search elves are on strike! 🧝‍♂️ Give it another shot.', '🔧');
      }
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
      showCustomPopup('error', 'Clinic Hiccup!', 'The patient list is doing yoga stretches! 🧘‍♀️ Try again in a moment.', '🏥');
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
      showCustomPopup('error', 'Profile Shy!', 'This patient profile is playing peek-a-boo! 👻 Let\'s try again.', '📋');
      setShowPatientModal(false);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Load appointment history for a patient
  const loadAppointmentHistory = async (patientId) => {
    setLoadingAppointments(true);
    try {
      const appointmentsData = await getAppointmentsByPatient(patientId);
      setAppointments(appointmentsData || []);
      setShowAppointmentHistory(true);
    } catch (error) {
      console.error("Error loading appointments:", error);
      showCustomPopup('error', 'Oops!', 'Could not load appointment history. Please try again! 📅', '❌');
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Open book appointment modal
  const openBookAppointment = () => {
    const enterpriseId = parseInt(localStorage.getItem('enterpriseId')) || 1;
    const clinicId = parseInt(localStorage.getItem('clinicId')) || selectedPatient?.patient?.patientClinicId || 1;
    
    setAppointmentForm({
      patientId: selectedPatient?.patient?.patientId,
      clinicId: clinicId,
      enterpriseId: enterpriseId,
      firstName: selectedPatient?.patient?.patientFirstName,
      lastName: selectedPatient?.patient?.patientLastName,
      phoneNumber: selectedPatient?.patientContact?.patientPhone,
      email: selectedPatient?.patientContact?.patientEmail,
      appointmentDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      appointmentType: 'Consultation',
      status: 'Scheduled',
      isConfirmed: false,
      paymentStatus: 'Pending',
      paidAmount: 0,
      pendingAmount: 0
    });
    setShowBookAppointment(true);
  };

  // Save appointment
  const handleSaveAppointment = async () => {
    try {
      if (editingAppointment) {
        await updateAppointment({ ...editingAppointment, ...appointmentForm });
        showCustomPopup('success', 'Updated!', 'The appointment has been updated successfully! 🎉', '✅');
        setEditingAppointment(null);
        loadAppointmentHistory(selectedPatient?.patient?.patientId);
      } else {
        await createAppointment(appointmentForm);
        showCustomPopup('success', 'Booked!', '🎊 Woohoo! Your appointment is locked and loaded! The patient will be notified faster than you can say "cheese"! 😁', '🎉');
      }
      setShowBookAppointment(false);
      setAppointmentForm({});
    } catch (error) {
      console.error("Error saving appointment:", error);
      showCustomPopup('error', 'Failed!', 'Could not save appointment. Please try again! 😢', '❌');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Compact Professional Header - White with Vibrant Accents */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-xl border-b-4 border-purple-500 shadow-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/50"
              >
                <span className="text-xl">🔍</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Patient Search Hub
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold shadow-lg">Elite</span>
                </h1>
                <p className="text-xs text-gray-600">Professional Patient Discovery System</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="h-[calc(100vh-72px)] max-w-7xl mx-auto px-6 py-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-4 h-full flex flex-col"
        >
          {/* Compact Chip Tabs - Royal Blue & Gold Theme */}
          <div className="flex gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewTab("search")}
              className={`px-4 py-2 font-semibold text-sm transition-all rounded-full flex items-center gap-2 ${
                viewTab === "search"
                  ? "bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/40"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🔍</span>
              <span>Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewTab("clinic")}
              className={`px-4 py-2 font-semibold text-sm transition-all rounded-full flex items-center gap-2 ${
                viewTab === "clinic"
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/40"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🏥</span>
              <span>Clinic</span>
            </motion.button>
          </div>

          {/* Search Patients Tab */}
          {viewTab === "search" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Improved Readable Search Grid */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 mb-4 border-2 border-indigo-300 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-blue-600 mb-1 block uppercase tracking-wide">👤 First Name</label>
                    <input
                      type="text"
                      value={filterData.firstName}
                      onChange={(e) => setFilterData({ ...filterData, firstName: e.target.value })}
                      placeholder="John"
                      className="w-full px-3 py-2.5 bg-white border-2 border-blue-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-600 mb-1 block uppercase tracking-wide">👥 Last Name</label>
                    <input
                      type="text"
                      value={filterData.lastName}
                      onChange={(e) => setFilterData({ ...filterData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="w-full px-3 py-2.5 bg-white border-2 border-indigo-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-600 mb-1 block uppercase tracking-wide">🎂 Birth Date</label>
                    <input
                      type="date"
                      value={filterData.dateOfBirth}
                      onChange={(e) => setFilterData({ ...filterData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border-2 border-purple-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-pink-600 mb-1 block uppercase tracking-wide">🆔 Patient ID</label>
                    <input
                      type="number"
                      value={filterData.patientId}
                      onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                      placeholder="1005"
                      className="w-full px-3 py-2.5 bg-white border-2 border-pink-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-rose-600 mb-1 block uppercase tracking-wide">🏥 Clinic ID</label>
                    <input
                      type="number"
                      value={filterData.clinicId}
                      onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                      placeholder="1005"
                      className="w-full px-3 py-2.5 bg-white border-2 border-rose-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" })}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition text-sm font-semibold shadow-md"
                  >
                    ↻ Clear
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searching ? "⏳ Searching..." : "🔍 Search Patients"}
                  </motion.button>
                </div>
              </div>

              {/* Compact Results Grid */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {searching ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="text-6xl mb-3"
                        >
                          🔮
                        </motion.div>
                        <p className="text-blue-300 font-bold text-lg">Searching dimensions...</p>
                      </div>
                    </motion.div>
                  ) : patients.length > 0 ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3 px-2">
                        <span className="text-pink-200 font-semibold text-sm">
                          ✨ Found {patients.length} patient{patients.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                        {patients.map((patient, idx) => (
                          <motion.div
                            key={patient.patientId || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            onClick={() => handleViewPatient(patient)}
                            className="backdrop-blur-md bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-pink-500/30 border-2 border-indigo-400/40 hover:border-pink-400/60 rounded-xl p-3 cursor-pointer transition-all shadow-lg hover:shadow-purple-500/30 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0">
                                {(patient.firstName || patient.patientFirstName || 'P').charAt(0)}
                                {(patient.lastName || patient.patientLastName || 'N').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate group-hover:text-pink-200 transition">
                                  {patient.firstName || patient.patientFirstName} {patient.lastName || patient.patientLastName}
                                </h4>
                                <p className="text-indigo-200/70 text-xs truncate">
                                  ID: {patient.patientId}
                                </p>
                                <div className="flex gap-1.5 mt-1">
                                  <span className="text-[10px] px-2 py-0.5 bg-indigo-400/30 text-indigo-200 rounded-full border border-indigo-400/50">
                                    {(patient.gender || patient.patientGender) === 'Male' ? '👨 M' : '👩 F'}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 bg-purple-400/30 text-purple-200 rounded-full border border-purple-400/50">
                                    🎂 {new Date(patient.dateOfBirth || patient.patientDOB).getFullYear()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/calendar', { state: { patientData: patient }});
                                  }}
                                  className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center text-white shadow-lg hover:shadow-pink-500/50 transition"
                                >
                                  📅
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-7xl mb-4"
                        >
                          🔮
                        </motion.div>
                        <h3 className="text-xl font-bold text-pink-300 mb-2">
                          Ready to Search?
                        </h3>
                        <p className="text-purple-200/60 text-sm">
                          Enter criteria above and hit search
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
            className="fixed inset-0 bg-gradient-to-br from-indigo-700/95 via-purple-700/95 to-pink-800/95 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowPatientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl max-w-5xl w-full my-8 border-2 border-pink-400/70 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-600/90 backdrop-blur-xl px-8 py-5 border-b-2 border-pink-400/60">
                <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-300/40 to-rose-400/40 border border-pink-300/60 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🩺</span>
                      </div>
                      Patient Medical Record
                    </h2>
                    <p className="text-pink-100 text-xs mt-1 ml-13">
                      Complete profile and medical history
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
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c084fc transparent' }}>
                {loadingPatientDetails ? (
                  <div className="text-center py-20 backdrop-blur-xl bg-white/10 rounded-2xl border-2 border-pink-400/50">
                    <div className="flex justify-center mb-6">
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-6xl"
                      >
                        🔮
                      </motion.div>
                    </div>
                    <p className="text-pink-200 text-lg font-semibold">Loading patient information...</p>
                    <p className="text-purple-300/60 text-sm mt-2">Please wait</p>
                  </div>
                ) : selectedPatient ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 shadow-lg border-2 border-indigo-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-indigo-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                          <span className="text-2xl">👤</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Basic Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-indigo-400/30">
                          <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-2">👤 First Name</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientFirstName || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-indigo-400/30">
                          <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-2">👥 Last Name</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientLastName || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-purple-400/30">
                          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-2">🆔 Patient ID</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientId || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-purple-400/30">
                          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-2">🎂 Date of Birth</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientDOB?.split('T')[0] || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-pink-400/30">
                          <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wide mb-2">⚧ Gender</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientGender || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-rose-400/30">
                          <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-wide mb-2">🩸 Blood Type</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientBloodType || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 shadow-lg border-2 border-purple-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-purple-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/40">
                          <span className="text-2xl">📞</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Contact Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📱 Phone Number</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientPhone || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📧 Email Address</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientEmail || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2 backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">🏠 Address</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientAddress || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">🌆 City</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientCity || 'N/A'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-rose-400/30">
                          <label className="text-[10px] font-bold text-rose-300 uppercase tracking-wide">🚨 Emergency Contact</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientEmergencyContact || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Medical Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 shadow-lg border-2 border-pink-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-pink-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/40">
                          <span className="text-2xl">🏥</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Medical Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-rose-400/30">
                          <label className="text-[10px] font-bold text-rose-300 uppercase tracking-wide">⚠️ Allergies</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.patientAllergies || 'None reported'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-indigo-400/30">
                          <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">💊 Current Medications</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.patientCurrentMedications || 'None'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">🩺 Chronic Diseases</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.chronicDiseases || 'None'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">👨‍⚕️ Primary Physician</label>
                          <p className="text-xs text-white mt-2">{selectedPatient?.patientMedicalInfo?.patientPrimaryPhysician || 'Not assigned'}</p>
                        </div>
                        <div className="md:col-span-2 backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-indigo-400/30">
                          <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">📋 Medical History</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.medicalHistory || 'No history available'}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📊 Number of Visits</label>
                          <p className="text-2xl font-bold text-white mt-2">{selectedPatient?.patientMedicalInfo?.no_of_visits || 0}</p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">📅 Last Visit</label>
                          <p className="text-sm font-semibold text-white mt-2">
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
                      className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 shadow-lg border-2 border-yellow-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-yellow-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/40">
                          <span className="text-2xl">💳</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Insurance Information
                        </h3>
                      </div>
                      <div className="backdrop-blur-lg bg-white/10 p-4 rounded-xl border border-yellow-400/30">
                        <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">🏢 Insurance Provider</label>
                        <p className="text-base font-bold text-white mt-2">
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

              {/* Modal Footer with Action Buttons */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-5 flex justify-between items-center border-t-2 border-yellow-400/50">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      openBookAppointment();
                      setShowPatientModal(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-400/60 hover:shadow-yellow-400/80 transition-all flex items-center gap-2 border-2 border-yellow-200"
                  >
                    <span className="text-lg">📅</span>
                    <span>Book Appointment</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      loadAppointmentHistory(selectedPatient?.patient?.patientId);
                      setShowPatientModal(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-400/60 hover:shadow-blue-400/80 transition-all flex items-center gap-2 border-2 border-blue-200"
                  >
                    <span className="text-lg">📋</span>
                    <span>Appointment History</span>
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPatientModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition shadow-lg"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Animated Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-20 right-8 z-[99999] max-w-md"
          >
            <div className={`rounded-2xl shadow-2xl overflow-hidden ${
              popupConfig.type === 'error' ? 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500' :
              popupConfig.type === 'warning' ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400' :
              popupConfig.type === 'info' ? 'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400' :
              'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400'
            }`}>
              <div className="p-6 relative">
                {/* Animated background elements */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="text-5xl"
                    >
                      {popupConfig.emoji}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-2">
                        {popupConfig.title}
                      </h3>
                      <p className="text-white/95 text-sm leading-relaxed">
                        {popupConfig.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPopup(false)}
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
                    transition={{ duration: 4, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment History Modal */}
      <AnimatePresence>
        {showAppointmentHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-blue-700/95 via-indigo-700/95 to-purple-800/95 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowAppointmentHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl max-w-6xl w-full my-8 border-2 border-yellow-400/70 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-purple-600/90 backdrop-blur-xl px-8 py-6 border-b-2 border-yellow-400/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-gradient-to-br from-yellow-300/40 to-amber-400/50 border-2 border-yellow-300/70 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/40"
                    >
                      <span className="text-3xl">📋</span>
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Appointment History
                      </h2>
                      <p className="text-yellow-100 text-sm mt-1">
                        {selectedPatient?.patient?.patientFirstName} {selectedPatient?.patient?.patientLastName}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAppointmentHistory(false)}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                {loadingAppointments ? (
                  <div className="text-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-6xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-blue-200 text-lg font-semibold">Loading appointments...</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appt, index) => (
                      <motion.div
                        key={appt.appointmentId || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-400/40">
                                <span className="text-2xl">🗓️</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white">
                                  {appt.appointmentType || 'Consultation'}
                                </h3>
                                <p className="text-sm text-blue-200">
                                  {new Date(appt.appointmentDate).toLocaleDateString('en-US', { 
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              <div className="backdrop-blur-lg bg-white/10 p-3 rounded-xl border border-white/20">
                                <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">⏰ Time</label>
                                <p className="text-sm font-semibold text-white mt-1">
                                  {appt.startTime?.substring(0, 5) || 'N/A'} - {appt.endTime?.substring(0, 5) || 'N/A'}
                                </p>
                              </div>
                              <div className="backdrop-blur-lg bg-white/10 p-3 rounded-xl border border-white/20">
                                <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">⏱️ Duration</label>
                                <p className="text-sm font-semibold text-white mt-1">{appt.durationMinutes || 0} min</p>
                              </div>
                              <div className="backdrop-blur-lg bg-white/10 p-3 rounded-xl border border-white/20">
                                <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">👨‍⚕️ Doctor</label>
                                <p className="text-sm font-semibold text-white mt-1">{appt.attendingPhysician || 'TBA'}</p>
                              </div>
                            </div>

                            {appt.reasonForVisit && (
                              <div className="backdrop-blur-lg bg-white/10 p-3 rounded-xl border border-white/20 mb-3">
                                <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📝 Reason</label>
                                <p className="text-sm text-white mt-1">{appt.reasonForVisit}</p>
                              </div>
                            )}

                            {/* Status Badges - Highlighted */}
                            <div className="flex gap-2 flex-wrap">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg ${
                                  appt.status === 'Completed' ? 'bg-green-500/90 text-white border-2 border-green-300' :
                                  appt.status === 'Cancelled' ? 'bg-red-500/90 text-white border-2 border-red-300' :
                                  appt.status === 'NoShow' ? 'bg-orange-500/90 text-white border-2 border-orange-300' :
                                  'bg-blue-500/90 text-white border-2 border-blue-300'
                                }`}
                              >
                                <span>{appt.status === 'Completed' ? '✅' : appt.status === 'Cancelled' ? '❌' : appt.status === 'NoShow' ? '⚠️' : '🕐'}</span>
                                <span>{appt.status || 'Scheduled'}</span>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg ${
                                  appt.paymentStatus === 'Paid' ? 'bg-emerald-500/90 text-white border-2 border-emerald-300' :
                                  appt.paymentStatus === 'Partial' ? 'bg-yellow-500/90 text-white border-2 border-yellow-300' :
                                  'bg-rose-500/90 text-white border-2 border-rose-300'
                                }`}
                              >
                                <span>{appt.paymentStatus === 'Paid' ? '💳' : appt.paymentStatus === 'Partial' ? '💰' : '⏳'}</span>
                                <span>{appt.paymentStatus || 'Pending'}</span>
                              </motion.div>

                              {appt.isConfirmed && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="px-4 py-2 rounded-full font-bold text-xs bg-cyan-500/90 text-white border-2 border-cyan-300 shadow-lg flex items-center gap-2"
                                >
                                  <span>✓</span>
                                  <span>Confirmed</span>
                                </motion.div>
                              )}
                            </div>

                            {(appt.paidAmount > 0 || appt.pendingAmount > 0) && (
                              <div className="mt-3 flex gap-3">
                                {appt.paidAmount > 0 && (
                                  <div className="backdrop-blur-lg bg-green-500/20 p-2 rounded-lg border border-green-400/30">
                                    <span className="text-[10px] font-bold text-green-300 uppercase">Paid: </span>
                                    <span className="text-sm font-bold text-white">${appt.paidAmount}</span>
                                  </div>
                                )}
                                {appt.pendingAmount > 0 && (
                                  <div className="backdrop-blur-lg bg-rose-500/20 p-2 rounded-lg border border-rose-400/30">
                                    <span className="text-[10px] font-bold text-rose-300 uppercase">Pending: </span>
                                    <span className="text-sm font-bold text-white">${appt.pendingAmount}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Edit Button */}
                          <motion.button
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingAppointment(appt);
                              setAppointmentForm(appt);
                              setShowAppointmentHistory(false);
                              setShowBookAppointment(true);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-bold shadow-lg hover:shadow-yellow-500/50 transition-all flex items-center gap-2"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-white text-lg font-semibold">No appointments found</p>
                    <p className="text-blue-300 text-sm mt-2">This patient has no appointment history yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-4 flex justify-end border-t-2 border-yellow-400/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAppointmentHistory(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Appointment Modal */}
      <AnimatePresence>
        {showBookAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-blue-700/95 via-indigo-700/95 to-purple-800/95 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => {
              setShowBookAppointment(false);
              setEditingAppointment(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl max-w-4xl w-full my-8 border-2 border-yellow-400/70 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-200/90 via-amber-300/90 to-orange-400/90 backdrop-blur-xl px-8 py-6 border-b-2 border-yellow-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-white/30 border-2 border-white/50 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <span className="text-3xl">📅</span>
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
                      </h2>
                      <p className="text-white/90 text-sm mt-1">
                        {appointmentForm.firstName} {appointmentForm.lastName}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowBookAppointment(false);
                      setEditingAppointment(null);
                    }}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                <div className="space-y-4">
                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">📅 Appointment Date</label>
                      <input
                        type="date"
                        value={appointmentForm.appointmentDate || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">🕐 Start Time</label>
                      <input
                        type="time"
                        value={appointmentForm.startTime || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-purple-600 uppercase tracking-wide mb-2">🕑 End Time</label>
                      <input
                        type="time"
                        value={appointmentForm.endTime || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, endTime: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-pink-600 uppercase tracking-wide mb-2">⏱️ Duration (min)</label>
                      <input
                        type="number"
                        value={appointmentForm.durationMinutes || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, durationMinutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-white border-2 border-pink-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Appointment Type and Doctor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-teal-600 uppercase tracking-wide mb-2">🩺 Appointment Type</label>
                      <select
                        value={appointmentForm.appointmentType || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentType: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-teal-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-sm"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Checkup">Checkup</option>
                        <option value="Treatment">Treatment</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Telehealth">Telehealth</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-600 uppercase tracking-wide mb-2">👨‍⚕️ Attending Physician</label>
                      <input
                        type="text"
                        value={appointmentForm.attendingPhysician || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, attendingPhysician: e.target.value })}
                        placeholder="Dr. Smith"
                        className="w-full px-4 py-3 bg-white border-2 border-cyan-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">📝 Reason for Visit</label>
                    <textarea
                      value={appointmentForm.reasonForVisit || ''}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reasonForVisit: e.target.value })}
                      placeholder="Describe the reason for this appointment..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm resize-none"
                    />
                  </div>

                  {/* Status and Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">📊 Status</label>
                      <select
                        value={appointmentForm.status || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="NoShow">No Show</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-purple-600 uppercase tracking-wide mb-2">💳 Payment Status</label>
                      <select
                        value={appointmentForm.paymentStatus || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, paymentStatus: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Invoice">Invoice</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/90 px-3 py-3 rounded-xl border-2 border-emerald-300 shadow-sm hover:bg-white transition">
                        <input
                          type="checkbox"
                          checked={appointmentForm.isConfirmed || false}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, isConfirmed: e.target.checked })}
                          className="w-5 h-5 rounded border-2 border-emerald-400 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-bold text-emerald-700 uppercase">✓ Confirmed</span>
                      </label>
                    </div>
                  </div>

                  {/* Payment Amounts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-green-600 uppercase tracking-wide mb-2">💵 Paid Amount</label>
                      <input
                        type="number"
                        value={appointmentForm.paidAmount || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, paidAmount: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-orange-600 uppercase tracking-wide mb-2">⏳ Pending Amount</label>
                      <input
                        type="number"
                        value={appointmentForm.pendingAmount || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, pendingAmount: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border-2 border-orange-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">📄 Additional Notes</label>
                    <textarea
                      value={appointmentForm.notes || ''}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      placeholder="Any additional notes or instructions..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition shadow-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-5 flex justify-end gap-3 border-t-2 border-yellow-400/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowBookAppointment(false);
                    setEditingAppointment(null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveAppointment}
                  className="px-8 py-3 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-400/60 hover:shadow-blue-400/80 transition-all border-2 border-blue-200"
                >
                  {editingAppointment ? '💾 Save Changes' : '✨ Book Appointment'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
