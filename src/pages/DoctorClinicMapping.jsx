import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listDoctorProfiles, searchDoctors, mapDoctorToClinics, listClinicalSpecialties, getDoctorsByEnterpriseId, getClinicsByEnterpriseId } from "../services/doctorService";
import { listClinics } from "../services/clinicService";

export default function DoctorClinicMapping() {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedClinics, setSelectedClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    enterpriseId: "",
    doctorId: "",
    firstName: "",
    lastName: "",
    specialtyId: ""
  });
  // Store mapping configuration for each clinic individually
  const [clinicMappings, setClinicMappings] = useState({});
  // Active tab for clinic configuration
  const [activeClinicTab, setActiveClinicTab] = useState(null);
  // Show guidance tooltips
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidanceStep, setGuidanceStep] = useState(0);
  // Primary clinic warning modal
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [primaryClinicWarning, setPrimaryClinicWarning] = useState({ clinicName: '', clinicAddress: '' });
  // Success and Error modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successData, setSuccessData] = useState({ doctorName: '', clinicCount: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load only specialties on page load
      // Clinics will be loaded when a doctor is selected
      const specialtiesData = await listClinicalSpecialties();
      setSpecialties(specialtiesData);
      
      // Don't load doctors or clinics initially - wait for search
      setDoctors([]);
      setClinics([]);
    } catch (error) {
      console.error("Error loading data:", error);
      // Set empty arrays if API fails
      setSpecialties([]);
      setClinics([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDoctors = async () => {
    // Check if user has entered any search criteria
    const hasOtherFilters = searchFilters.doctorId || searchFilters.firstName || searchFilters.lastName || searchFilters.specialtyId;
    
    // Only show enterprise ID warning if user has filled other fields
    if (!searchFilters.enterpriseId && hasOtherFilters) {
      alert("⚠️ Enterprise ID is required. Please enter Enterprise ID first.");
      return;
    }
    
    if (!searchFilters.enterpriseId) {
      alert("Please enter Enterprise ID to search.");
      return;
    }

    setSearching(true);
    try {
      const enterpriseId = parseInt(searchFilters.enterpriseId);
      
      // Call GetDoctorsByEnterpriseID API
      const doctors = await getDoctorsByEnterpriseId(enterpriseId);
      
      let filteredDoctors = doctors || [];
      
      // Apply additional filters if provided
      if (searchFilters.doctorId) {
        filteredDoctors = filteredDoctors.filter(doc => doc.staffId === parseInt(searchFilters.doctorId));
      }
      if (searchFilters.firstName) {
        filteredDoctors = filteredDoctors.filter(doc => 
          doc.firstName.toLowerCase().includes(searchFilters.firstName.toLowerCase())
        );
      }
      if (searchFilters.lastName) {
        filteredDoctors = filteredDoctors.filter(doc => 
          doc.lastName.toLowerCase().includes(searchFilters.lastName.toLowerCase())
        );
      }
      if (searchFilters.specialtyId) {
        filteredDoctors = filteredDoctors.filter(doc => doc.specialtyId === parseInt(searchFilters.specialtyId));
      }
      
      setDoctors(filteredDoctors);
      
      if (filteredDoctors.length === 0) {
        alert("No doctors found matching your search criteria for this enterprise.");
      }
    } catch (error) {
      console.error("Error searching doctors:", error);
      alert("Failed to search doctors. Please try again.");
      setDoctors([]);
    } finally {
      setSearching(false);
    }
  };

  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor);
    // Pre-select doctor's current clinic
    setSelectedClinics([doctor.branchId]);
    
    // Fetch clinics for the enterprise when doctor is selected
    if (searchFilters.enterpriseId) {
      try {
        const enterpriseId = parseInt(searchFilters.enterpriseId);
        const clinics = await getClinicsByEnterpriseId(enterpriseId);
        setClinics(clinics || []);
      } catch (error) {
        console.error("Error fetching clinics for enterprise:", error);
        alert("Failed to load clinics for this enterprise.");
      }
    }
  };

  const toggleClinicSelection = (clinicId) => {
    // Validate clinic ID
    if (!clinicId || parseInt(clinicId) <= 0) {
      console.error('Invalid clinic ID:', clinicId);
      return;
    }
    
    setSelectedClinics(prev => {
      if (prev.includes(clinicId)) {
        // Remove clinic and its configuration
        const newMappings = { ...clinicMappings };
        delete newMappings[clinicId];
        setClinicMappings(newMappings);
        
        // If removing the active clinic, switch to another or set to null
        if (activeClinicTab === clinicId) {
          const remainingClinics = prev.filter(id => id !== clinicId);
          setActiveClinicTab(remainingClinics.length > 0 ? remainingClinics[0] : null);
        }
        
        return prev.filter(id => id !== clinicId);
      } else {
        // Add clinic with default configuration
        setClinicMappings(prev => ({
          ...prev,
          [clinicId]: {
            doctorRole: "Consultant",
            specialty: "",
            startDate: new Date().toISOString().split('T')[0],
            endDate: "",
            availableDays: "",
            isPrimaryClinic: false,
            consultationType: "In-person",
            isActive: true
          }
        }));
        // Always set newly selected clinic as active tab to show configuration immediately
        setActiveClinicTab(clinicId);
        return [...prev, clinicId];
      }
    });
  };

  const updateClinicMapping = (clinicId, field, value) => {
    // Check if user is trying to set another clinic as primary
    if (field === 'isPrimaryClinic' && value === true) {
      // Find if there's already a primary clinic selected
      const currentPrimaryClinic = Object.entries(clinicMappings).find(
        ([id, config]) => id !== clinicId.toString() && config.isPrimaryClinic === true
      );
      
      if (currentPrimaryClinic) {
        const [primaryClinicId] = currentPrimaryClinic;
        const primaryClinic = clinics.find(c => c.clinicId === parseInt(primaryClinicId));
        
        setPrimaryClinicWarning({ 
          clinicName: primaryClinic?.clinicName || 'Another clinic',
          clinicAddress: primaryClinic?.clinicAddress || primaryClinic?.clinicCity || 'No address available'
        });
        setShowPrimaryWarning(true);
        return; // Don't update if there's already a primary clinic
      }
    }
    
    setClinicMappings(prev => ({
      ...prev,
      [clinicId]: {
        ...prev[clinicId],
        [field]: value
      }
    }));
  };

  const handleSaveMapping = async () => {
    if (!selectedDoctor) {
      alert("Please select a doctor first.");
      return;
    }

    if (selectedClinics.length === 0) {
      alert("Please select at least one clinic.");
      return;
    }

    // Validate that at least one clinic has configuration
    const hasAnyConfiguration = selectedClinics.some(clinicId => {
      const config = clinicMappings[clinicId];
      return config && (config.doctorRole || config.consultationType || config.startDate);
    });

    if (!hasAnyConfiguration) {
      alert("⚠️ Please configure at least one clinic before saving.");
      return;
    }

    try {
      // Build array of all mappings for selected clinics, filtering out invalid clinic IDs
      const mappings = selectedClinics
        .filter(clinicId => clinicId && parseInt(clinicId) > 0) // Only valid clinic IDs
        .map(clinicId => {
          const clinicConfig = clinicMappings[clinicId] || {};
          
          console.log('Building mapping for clinic:', clinicId, 'Config:', clinicConfig);
          
          // Build the model matching C# backend DoctorClinicMapping structure
          return {
            // Foreign Keys (required)
            doctorId: selectedDoctor.staffId || selectedDoctor.doctorId, // Use staffId from doctor profile
            clinicId: parseInt(clinicId),
          
          // Flags
          isActive: true, // Default to active
          
          // Context / Role
          doctorRole: clinicConfig.doctorRole || "Consultant",
          specialty: selectedDoctor.specialty || clinicConfig.specialty || null,
          
          // Schedule / Availability
          startDate: clinicConfig.startDate ? new Date(clinicConfig.startDate).toISOString() : new Date().toISOString(),
          endDate: clinicConfig.endDate ? new Date(clinicConfig.endDate).toISOString() : null,
          availableDays: clinicConfig.availableDays || null,
          
          // Operational Flags
          isPrimaryClinic: clinicConfig.isPrimaryClinic || false,
          consultationType: clinicConfig.consultationType || "In-person",
          
          // Audit Columns
          createdBy: "System", // TODO: Get from auth context
          createdAt: new Date().toISOString(),
          updatedBy: "System",
          updatedAt: new Date().toISOString()
        };
        });

      console.log('Sending mappings to API:', JSON.stringify(mappings, null, 2));
      
      if (mappings.length === 0) {
        setErrorMessage("No valid clinic mappings found. Did you forget to select clinics?");
        setShowErrorModal(true);
        return;
      }

      // Send all mappings in a single API call as List<DoctorClinicMapping>
      const response = await mapDoctorToClinics(mappings);
      
      console.log('API Response:', response);
      
      // Show success modal and keep selections
      setSuccessData({
        doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        clinicCount: mappings.length
      });
      setShowSuccessModal(true);
      
      // Keep selections visible - don't reset
      // User can see what was just saved
      
    } catch (error) {
      console.error("Error saving mapping:", error);
      const errorMsg = error.message || "Something went wrong";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.staffId.toString().includes(searchTerm)
  );

  // Guidance messages - skip welcome, start with step 1
  const guidanceMessages = [
    { icon: "🏭", title: "Step 1", message: "Enter your Enterprise ID to get started", color: "from-blue-500 to-cyan-500" },
    { icon: "👨‍⚕️", title: "Step 2", message: "Search and select a doctor from the list", color: "from-green-500 to-emerald-500" },
    { icon: "🏥", title: "Step 3", message: "Pick clinics and configure each mapping", color: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Interactive Guidance Tooltip */}
      <AnimatePresence>
        {showGuidance && guidanceStep < guidanceMessages.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`fixed z-50 ${
              guidanceStep === 0 ? 'top-32 left-1/2 transform -translate-x-1/2' : // Enterprise ID - near filters
              guidanceStep === 1 ? 'top-1/2 left-8 transform -translate-y-1/2' : // Doctors - left side
              'top-1/2 right-8 transform -translate-y-1/2' // Clinics - right side
            }`}
          >
            <div className={`bg-gradient-to-r ${guidanceMessages[guidanceStep].color} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[400px]`}>
              <span className="text-4xl">{guidanceMessages[guidanceStep].icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{guidanceMessages[guidanceStep].title}</h3>
                <p className="text-sm opacity-90">{guidanceMessages[guidanceStep].message}</p>
              </div>
              <div className="flex gap-2">
                {guidanceStep < guidanceMessages.length - 1 && (
                  <button
                    onClick={() => setGuidanceStep(guidanceStep + 1)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                  >
                    Next →
                  </button>
                )}
                <button
                  onClick={() => setShowGuidance(false)}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                >
                  Got it! ✔️
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Clinic Warning Modal */}
      <AnimatePresence>
        {showPrimaryWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrimaryWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <span className="text-4xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Primary Clinic Already Set</h3>
                    <p className="text-amber-100 text-sm mt-1">Please review your selection</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">🏥</span>
                    <div>
                      <p className="font-bold text-amber-700 text-lg mb-1">{primaryClinicWarning.clinicName}</p>
                      <p className="text-gray-600 text-sm">{primaryClinicWarning.clinicAddress}</p>
                      <p className="text-gray-700 mt-3">
                        This clinic has already been selected as the primary clinic.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  To set a different clinic as primary, please first uncheck the current primary clinic, then select the new one.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowPrimaryWarning(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Got it! ✓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 text-9xl opacity-20">🎉</div>
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    🎆✨
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-2">Woohoo! Mission Accomplished!</h3>
                  <p className="text-green-100 text-lg">The doctor is in... multiple places now! 🚀</p>
                </div>
              </div>

              {/* Success Body */}
              <div className="p-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
                      {successData.clinicCount}
                    </div>
                    <div>
                      <p className="text-gray-700 text-lg">
                        <span className="font-bold text-green-700">Dr. {successData.doctorName}</span>
                      </p>
                      <p className="text-gray-600 text-sm">is now mapped to {successData.clinicCount} clinic{successData.clinicCount > 1 ? 's' : ''}!</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <p className="text-gray-600 text-sm italic">
                      🎯 "Great! Now patients have more chances to find me... or avoid me, depending on their last visit!" 😄
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>✅</span>
                  <span>All configurations saved successfully</span>
                </div>
              </div>

              {/* Success Footer */}
              <div className="bg-gradient-to-r from-gray-50 to-green-50 px-8 py-6 flex justify-between items-center">
                <p className="text-sm text-gray-600">👍 Keep up the great work!</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Awesome! 🎉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowErrorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Error Header */}
              <div className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 text-9xl opacity-20">😅</div>
                <div className="relative z-10">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="text-6xl mb-4"
                  >
                    🙈💥
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-2">Oops! Houston, We Have a Problem!</h3>
                  <p className="text-pink-100 text-lg">The mapping spaceship hit a snag! 🚀🚫</p>
                </div>
              </div>

              {/* Error Body */}
              <div className="p-8">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0">
                      !
                    </div>
                    <div>
                      <p className="font-bold text-red-700 mb-2">What Happened?</p>
                      <p className="text-gray-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <p className="font-bold text-yellow-700 mb-2 flex items-center gap-2">
                    <span>🔍</span> Quick Checklist:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• Did you select at least one clinic?</li>
                    <li>• Are all required fields filled?</li>
                    <li>• Is your internet connection stable?</li>
                    <li>• Have you tried turning it off and on again? 😄</li>
                  </ul>
                </div>
              </div>

              {/* Error Footer */}
              <div className="bg-gradient-to-r from-gray-50 to-red-50 px-8 py-6 flex justify-between items-center">
                <p className="text-sm text-gray-600">💪 Don't worry, try again!</p>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Got it! 👌
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col p-4">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-4 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔗</span>
            <div>
              <h1 className="text-2xl font-bold text-white">Doctor-Clinic Mapping</h1>
              <p className="text-purple-100 text-sm">Map doctors to multiple clinic locations</p>
            </div>
          </div>
          {!showGuidance && (
            <button
              onClick={() => { setShowGuidance(true); setGuidanceStep(0); }}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-semibold transition-all flex items-center gap-2"
            >
              <span>💡</span> Show Guide
            </button>
          )}
        </motion.div>

        {/* Compact Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="🏭 Enterprise ID"
              value={searchFilters.enterpriseId}
              onChange={(e) => setSearchFilters({ ...searchFilters, enterpriseId: e.target.value })}
              className="flex-1 px-4 py-2.5 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
            <input
              type="text"
              placeholder="🆔 Doctor ID"
              value={searchFilters.doctorId}
              onChange={(e) => setSearchFilters({ ...searchFilters, doctorId: e.target.value })}
              disabled={!searchFilters.enterpriseId}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              placeholder="👤 First Name"
              value={searchFilters.firstName}
              onChange={(e) => setSearchFilters({ ...searchFilters, firstName: e.target.value })}
              disabled={!searchFilters.enterpriseId}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              placeholder="📝 Last Name"
              value={searchFilters.lastName}
              onChange={(e) => setSearchFilters({ ...searchFilters, lastName: e.target.value })}
              disabled={!searchFilters.enterpriseId}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <select
              value={searchFilters.specialtyId}
              onChange={(e) => setSearchFilters({ ...searchFilters, specialtyId: e.target.value })}
              disabled={!searchFilters.enterpriseId}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">🩺 All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty.specialtyId} value={specialty.specialtyId}>
                  {specialty.department} - {specialty.clinicalArea}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearchDoctors}
              disabled={searching || !searchFilters.enterpriseId}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {searching ? "🔄 Searching..." : "🔍 Search"}
            </button>
            <button
              onClick={() => {
                setSearchFilters({ enterpriseId: "", doctorId: "", firstName: "", lastName: "", specialtyId: "" });
                setDoctors([]);
                setSelectedDoctor(null);
                setSelectedClinics([]);
                setClinicMappings({});
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm"
            >
              🗑️ Clear
            </button>
          </div>
        </motion.div>

        {/* Friendly Guide Message */}
        {doctors.length === 0 && !searching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-8 mb-8 border-4 border-dashed border-purple-300"
          >
            <div className="text-center">
              <div className="text-8xl mb-4 animate-bounce">👋</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                Welcome to Doctor-Clinic Mapping!
              </h2>
              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p className="text-lg font-semibold">🎯 Here's how to get started:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                    <div className="text-4xl mb-2">1️⃣</div>
                    <p className="font-bold text-purple-600">Enter Enterprise ID</p>
                    <p className="text-sm text-gray-600">Start by typing your Enterprise ID above</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                    <div className="text-4xl mb-2">2️⃣</div>
                    <p className="font-bold text-pink-600">Search Doctors</p>
                    <p className="text-sm text-gray-600">Click search to find doctors in your enterprise</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                    <div className="text-4xl mb-2">3️⃣</div>
                    <p className="font-bold text-orange-600">Map & Configure</p>
                    <p className="text-sm text-gray-600">Select a doctor, pick clinics, and configure each one!</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-6 italic">
                  💡 Pro Tip: You can map multiple clinics at once with individual settings for each!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content - Full Height Layout */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Doctors List - Fixed Width */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 w-[400px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <span>👨‍⚕️</span>
                Doctors
              </h2>
              {doctors.length > 0 && (
                <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-xs font-bold">
                  {doctors.length}
                </span>
              )}
            </div>

            {/* Search */}
            {doctors.length > 0 && (
              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search..."
                  className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            )}

            {/* Doctors List - Flex Grow with Scroll */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4 animate-spin">⚕️</div>
                  <p className="text-gray-500 font-semibold">Loading doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 && doctors.length > 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 font-semibold">No doctors match your search</p>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-gray-500 font-semibold">Search for doctors to begin</p>
                </div>
              ) : (
                filteredDoctors.map((doctor, index) => {
                  const gradients = [
                    "from-blue-400 to-cyan-400",
                    "from-purple-400 to-pink-400",
                    "from-green-400 to-emerald-400",
                    "from-orange-400 to-red-400",
                    "from-indigo-400 to-purple-400",
                    "from-teal-400 to-blue-400",
                    "from-pink-400 to-rose-400",
                    "from-yellow-400 to-orange-400"
                  ];
                  const gradient = gradients[index % gradients.length];
                  const isSelected = selectedDoctor?.doctorId === doctor.doctorId;
                  
                  return (
                    <motion.div
                      key={doctor.doctorId}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDoctorSelect(doctor)}
                      className={`p-4 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                        isSelected
                          ? "shadow-2xl ring-4 ring-purple-500 ring-offset-2"
                          : "shadow-md hover:shadow-xl"
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} ${
                        isSelected ? "opacity-100" : "opacity-70 hover:opacity-90"
                      } transition-opacity`}></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/90 p-2 rounded-full">
                            <span className="text-2xl">👨‍⚕️</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg drop-shadow-md">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            <p className="text-sm text-white/90 drop-shadow">Staff ID: {doctor.staffId}</p>
                            <p className="text-xs text-white/80 drop-shadow">
                              Specialty ID: {doctor.specialtyId} • {doctor.employmentStatus}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="bg-white rounded-full p-2 shadow-lg"
                          >
                            <span className="text-3xl">✅</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Clinics Selection - Fixed Width */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 w-[380px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <span>🏥</span>
                Clinics
              </h2>
              {selectedClinics.length > 0 && (
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {selectedClinics.length} selected
                </span>
              )}
            </div>

            {!selectedDoctor ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-6xl mb-4">👈</span>
                <p className="text-lg">Select a doctor first</p>
              </div>
            ) : (
              <>
                {/* Selected Doctor Info */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 mb-6 border-2 border-indigo-300">
                  <p className="text-sm text-gray-600">Mapping for:</p>
                  <h3 className="text-xl font-bold text-indigo-900">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">Staff ID: {selectedDoctor.staffId}</p>
                </div>

                {/* Clinics Display - Chip View */}
                <div className="max-h-[450px] overflow-y-auto pr-2 mb-6">
                  {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading clinics...</p>
                  ) : clinics.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No clinics found</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {clinics.map((clinic, index) => {
                        const chipGradients = [
                          "from-violet-500 to-purple-500",
                          "from-blue-500 to-indigo-500",
                          "from-emerald-500 to-teal-500",
                          "from-rose-500 to-pink-500",
                          "from-amber-500 to-orange-500",
                          "from-cyan-500 to-sky-500",
                          "from-fuchsia-500 to-pink-500",
                          "from-lime-500 to-green-500"
                        ];
                        const chipGradient = chipGradients[index % chipGradients.length];
                        const isSelected = selectedClinics.includes(clinic.clinicId);
                        
                        return (
                          <motion.button
                            key={clinic.clinicId}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleClinicSelection(clinic.clinicId)}
                            className={`px-4 py-3 rounded-xl font-semibold transition-all relative ${
                              isSelected
                                ? `bg-gradient-to-r ${chipGradient} text-white shadow-2xl ring-4 ring-offset-2 ring-purple-300`
                                : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 border-gray-200 hover:border-purple-300 shadow-md hover:shadow-lg"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <motion.span
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="text-xl bg-white text-green-500 rounded-full w-6 h-6 flex items-center justify-center font-bold"
                                >
                                  ✓
                                </motion.span>
                              ) : (
                                <span className="text-xl">🏥</span>
                              )}
                              <div className="text-left">
                                <div className="text-base font-bold">{clinic.clinicName}</div>
                                <div className={`text-sm font-medium ${
                                  isSelected ? "opacity-90" : "opacity-70"
                                }`}>
                                  {clinic.clinicAddress || clinic.clinicCity || 'No address'}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </>
            )}
          </motion.div>

          {/* Configuration Panel - Right Side */}
          {selectedDoctor && selectedClinics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-white rounded-xl shadow-lg p-4 flex flex-col overflow-hidden"
            >
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3 flex items-center gap-2">
                <span>⚙️</span> Configuration Panel
              </h3>
              
              {/* Clinic Tabs - Only show when multiple clinics selected */}
              {selectedClinics.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {selectedClinics.map((clinicId, index) => {
                    const clinic = clinics.find(c => c.clinicId === clinicId);
                    const tabColors = [
                      "from-pink-500 to-rose-500",
                      "from-blue-500 to-cyan-500",
                      "from-purple-500 to-violet-500",
                      "from-green-500 to-emerald-500",
                      "from-orange-500 to-amber-500",
                      "from-fuchsia-500 to-pink-500",
                    ];
                    const tabColor = tabColors[index % tabColors.length];
                    const isActive = activeClinicTab === clinicId;
                    
                    return (
                      <motion.button
                        key={clinicId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveClinicTab(clinicId)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm whitespace-nowrap flex items-center gap-2 ${
                          isActive
                            ? `bg-gradient-to-r ${tabColor} text-white shadow-lg`
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <span>{clinic?.clinicName}</span>
                        {isActive && <span>✨</span>}
                      </motion.button>
                    );
                  })}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto pr-2">
                {activeClinicTab ? (
                  (() => {
                    const clinicId = activeClinicTab;
                  const clinic = clinics.find(c => c.clinicId === clinicId);
                  const config = clinicMappings[clinicId] || {};
                  const index = selectedClinics.indexOf(clinicId);
                  const cardGradients = [
                    { from: "from-pink-400", via: "via-rose-400", to: "to-red-400", border: "border-pink-300" },
                    { from: "from-blue-400", via: "via-cyan-400", to: "to-teal-400", border: "border-blue-300" },
                    { from: "from-purple-400", via: "via-violet-400", to: "to-indigo-400", border: "border-purple-300" },
                    { from: "from-green-400", via: "via-emerald-400", to: "to-teal-400", border: "border-green-300" },
                    { from: "from-orange-400", via: "via-amber-400", to: "to-yellow-400", border: "border-orange-300" },
                    { from: "from-fuchsia-400", via: "via-pink-400", to: "to-rose-400", border: "border-fuchsia-300" },
                  ];
                  const gradient = cardGradients[index % cardGradients.length];

                  return (
                    <div className="space-y-3">
                      {/* Clinic Header */}
                      <div className={`bg-gradient-to-r ${gradient.from} ${gradient.via} ${gradient.to} p-3 rounded-xl`}>
                        <h4 className="text-white font-bold text-sm drop-shadow-md">{clinic?.clinicName}</h4>
                        <p className="text-white/90 text-xs drop-shadow">{clinic?.clinicAddress}</p>
                      </div>

                      {/* Configuration Fields - Compact */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">👨‍⚕️ Doctor Role</label>
                          <select
                            value={config.doctorRole}
                            onChange={(e) => updateClinicMapping(clinicId, 'doctorRole', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 text-sm"
                          >
                            <option value="Consultant">🩺 Consultant</option>
                            <option value="Visiting Specialist">✨ Visiting Specialist</option>
                            <option value="Resident">🎓 Resident</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">💬 Consultation Type</label>
                          <select
                            value={config.consultationType}
                            onChange={(e) => updateClinicMapping(clinicId, 'consultationType', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 text-sm"
                          >
                            <option value="In-person">🏥 In-person</option>
                            <option value="Telehealth">💻 Telehealth</option>
                            <option value="Hybrid">🔄 Hybrid</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">📅 Start Date</label>
                            <input
                              type="date"
                              value={config.startDate}
                              onChange={(e) => updateClinicMapping(clinicId, 'startDate', e.target.value)}
                              className="w-full px-2 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">🏁 End Date</label>
                            <input
                              type="date"
                              value={config.endDate}
                              onChange={(e) => updateClinicMapping(clinicId, 'endDate', e.target.value)}
                              className="w-full px-2 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">📆 Available Days</label>
                          <input
                            type="text"
                            placeholder="e.g., Mon, Wed, Fri"
                            value={config.availableDays}
                            onChange={(e) => updateClinicMapping(clinicId, 'availableDays', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 text-sm"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.isPrimaryClinic}
                              onChange={(e) => updateClinicMapping(clinicId, 'isPrimaryClinic', e.target.checked)}
                              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-200"
                            />
                            <div>
                              <span className="text-sm font-bold text-gray-700">⭐ Primary Clinic</span>
                              <p className="text-xs text-gray-500">Set as main location</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="text-6xl mb-4">👆</span>
                    <p className="text-lg">Select a clinic tab above to configure</p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Bottom */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedDoctor(null);
                    setSelectedClinics([]);
                    setClinicMappings({});
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveMapping}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg text-sm"
                >
                  💾 Save
                </button>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
