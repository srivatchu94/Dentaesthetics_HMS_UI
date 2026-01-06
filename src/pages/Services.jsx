import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FancyDatePicker from "../components/FancyDatePicker";
import {
  createCamp,
  addCampParticipant,
} from "../services/campService";

export default function Services(){
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Camp modals state
  const [showRegisterCampModal, setShowRegisterCampModal] = useState(false);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [showTrackServicesModal, setShowTrackServicesModal] = useState(false);
  const [showCampReportsModal, setShowCampReportsModal] = useState(false);
  const [campId, setCampId] = useState(null);
  
  // Camp registration form
  const [campForm, setCampForm] = useState({
    campName: '',
    campType: '',
    campDate: '',
    startTime: '',
    endTime: '',
    venueType: '',
    institutionName: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    organizedBy: '',
    contactPerson: '',
    contactNumber: '',
    contactEmail: '',
    expectedParticipants: '',
    targetAgeGroup: '',
    servicesOffered: [],
    campDescription: '',
    specialNotes: '',
    budgetAllocated: '',
    sponsorshipDetails: ''
  });
  
  // Participant registration form
  const [participantForm, setParticipantForm] = useState({
    campName: '',
    participantName: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    parentGuardianName: '',
    studentOrStaff: '',
    classStandard: '',
    gradeYear: '',
    rollNumber: '',
    department: '',
    existingDentalIssues: [],
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    consentGiven: false,
    photoConsent: false
  });
  
  // Track services form
  const [trackServicesForm, setTrackServicesForm] = useState({
    campName: '',
    participantName: '',
    examinedBy: '',
    chiefComplaint: '',
    oralHygieneStatus: '',
    dentalIssuesFound: [],
    numberOfAffectedTeeth: '',
    clinicalNotes: '',
    servicesProvided: [],
    treatmentGiven: '',
    medicationsPrescribed: '',
    requiresFollowup: false,
    referralRequired: false,
    referralClinic: '',
    referralDate: '',
    priority: '',
    referralNotes: ''
  });

  const [reportFilterDate, setReportFilterDate] = useState('');

  const serviceCategories = [
    {
      id: 'dental-services',
      title: "🦷 Dental Services",
      description: "Manage dental treatments and procedures",
      gradient: "from-slate-500 via-slate-600 to-slate-700",
      bgGradient: "from-slate-50 to-slate-100",
      options: [
        {
          id: 'add-service',
          title: "➕ Add Service",
          description: "Create new dental service",
          action: "add",
          icon: "✨",
          color: "from-slate-400 to-slate-500"
        },
        {
          id: 'list-services',
          title: "📋 List Services",
          description: "View all available services",
          action: "list",
          icon: "📊",
          color: "from-blue-400 to-blue-500"
        },
        {
          id: 'edit-service',
          title: "✏️ Edit Service",
          description: "Modify service details",
          action: "edit",
          icon: "🔧",
          color: "from-indigo-400 to-indigo-500"
        },
        {
          id: 'remove-service',
          title: "🗑️ Remove Service",
          description: "Delete service from system",
          action: "remove",
          icon: "❌",
          color: "from-rose-400 to-rose-500"
        }
      ]
    },
    {
      id: 'service-packages',
      title: "📦 Service Packages",
      description: "Bundle services into treatment packages",
      gradient: "from-emerald-500 via-teal-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      options: [
        {
          id: 'create-package',
          title: "🎁 Create Package",
          description: "Design service bundles",
          action: "create-package",
          icon: "🌟",
          color: "from-emerald-400 to-teal-400"
        },
        {
          id: 'view-packages',
          title: "👁️ View Packages",
          description: "Browse treatment packages",
          action: "view-packages",
          icon: "📦",
          color: "from-teal-400 to-cyan-400"
        }
      ]
    },
    {
      id: 'pricing-management',
      title: "💰 Pricing Management",
      description: "Set and manage service pricing",
      gradient: "from-amber-500 via-orange-400 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      options: [
        {
          id: 'update-pricing',
          title: "💵 Update Pricing",
          description: "Modify service costs",
          action: "pricing",
          icon: "💎",
          color: "from-amber-400 to-orange-400"
        },
        {
          id: 'view-rates',
          title: "📈 View Rates",
          description: "Check current pricing",
          action: "rates",
          icon: "💰",
          color: "from-orange-400 to-orange-500"
        }
      ]
    },
    {
      id: 'camp-software',
      title: "🏕️ Camp Software",
      description: "Conduct dental/medical camps at schools and colleges",
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      bgGradient: "from-purple-50 to-pink-50",
      options: [
        {
          id: 'register-camp',
          title: "📝 Register Camp",
          description: "Create new camp event",
          action: "register-camp",
          icon: "🏕️",
          color: "from-purple-400 to-purple-500"
        },
        {
          id: 'add-participants',
          title: "👥 Add Participants",
          description: "Register camp attendees",
          action: "add-participants",
          icon: "✍️",
          color: "from-pink-400 to-pink-500"
        },
        {
          id: 'track-services',
          title: "🩺 Track Services",
          description: "Record services provided",
          action: "track-services",
          icon: "📋",
          color: "from-rose-400 to-rose-500"
        },
        {
          id: 'camp-reports',
          title: "📊 Camp Reports",
          description: "View attendance & stats",
          action: "camp-reports",
          icon: "📈",
          color: "from-fuchsia-400 to-purple-500"
        }
      ]
    }
  ];

  const handleServiceAction = (action) => {
    console.log(`Action: ${action}`);
    
    // Handle camp-specific actions
    switch(action) {
      case 'register-camp':
        setShowRegisterCampModal(true);
        break;
      case 'add-participants':
        if (!campId) {
          setErrorMessage("Please create a camp first!");
          return;
        }
        setShowAddParticipantsModal(true);
        break;
      case 'track-services':
        setShowTrackServicesModal(true);
        break;
      case 'camp-reports':
        setShowCampReportsModal(true);
        break;
      default:
        alert(`${action} - Feature coming soon! 🚀`);
    }
  };
  
  const handleCampFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Convert time string (HH:mm) to TimeSpan format (HH:mm:ss)
      const formatTimeToTimeSpan = (timeStr) => {
        if (!timeStr) return "00:00:00";
        return `${timeStr}:00`; // Convert "09:30" to "09:30:00"
      };

      // Convert date string to proper format
      const campData = {
        campName: campForm.campName,
        campType: campForm.campType,
        campDate: campForm.campDate,
        startTime: formatTimeToTimeSpan(campForm.startTime),
        endTime: formatTimeToTimeSpan(campForm.endTime),
        venueType: campForm.venueType,
        institutionName: campForm.institutionName,
        address: campForm.address,
        city: campForm.city,
        state: campForm.state,
        pinCode: campForm.pinCode,
        organizedBy: campForm.organizedBy,
        contactPerson: campForm.contactPerson,
        contactNumber: campForm.contactNumber,
        contactEmail: campForm.contactEmail,
        expectedParticipants: parseInt(campForm.expectedParticipants) || 0,
        targetAgeGroup: campForm.targetAgeGroup,
        servicesOffered: campForm.servicesOffered.join(', '),
        campDescription: campForm.campDescription,
        specialNotes: campForm.specialNotes,
        budgetAllocated: parseFloat(campForm.budgetAllocated) || 0,
        sponsorshipDetails: campForm.sponsorshipDetails,
        isActive: true
      };
      
      console.log('Camp Data being sent:', campData);
      const response = await createCamp(campData);
      setCampId(response.campId);
      setSuccessMessage('🎉 Camp registered successfully!');
      setShowRegisterCampModal(false);
      
      // Reset form
      setCampForm({
        campName: '', campType: '', campDate: '', startTime: '', endTime: '',
        venueType: '', institutionName: '', address: '', city: '', state: '',
        pinCode: '', organizedBy: '', contactPerson: '', contactNumber: '',
        contactEmail: '', expectedParticipants: '', targetAgeGroup: '',
        servicesOffered: [], campDescription: '', specialNotes: '',
        budgetAllocated: '', sponsorshipDetails: ''
      });
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Error creating camp: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  const handleParticipantFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!campId) {
      setErrorMessage("Camp ID is missing!");
      setLoading(false);
      return;
    }
    
    try {
      const participantData = {
        campId: campId,
        participantName: participantForm.participantName,
        age: parseInt(participantForm.age) || 0,
        gender: participantForm.gender,
        dateOfBirth: participantForm.dateOfBirth,
        phoneNumber: participantForm.phoneNumber,
        email: participantForm.email,
        parentGuardianName: participantForm.parentGuardianName,
        studentOrStaff: participantForm.studentOrStaff,
        classStandard: participantForm.classStandard,
        gradeYear: participantForm.gradeYear,
        rollNumber: participantForm.rollNumber,
        department: participantForm.department,
        existingDentalIssues: participantForm.existingDentalIssues.join(', '),
        medicalHistory: participantForm.medicalHistory,
        currentMedications: participantForm.currentMedications,
        allergies: participantForm.allergies,
        consentGiven: participantForm.consentGiven,
        photoConsent: participantForm.photoConsent
      };
      
      console.log('Participant Data being sent:', participantData);
      await addCampParticipant(participantData);
      setSuccessMessage('✅ Participant added successfully!');
      setShowAddParticipantsModal(false);
      
      // Reset form
      setParticipantForm({
        campName: '',
        participantName: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        phoneNumber: '',
        email: '',
        parentGuardianName: '',
        studentOrStaff: '',
        classStandard: '',
        gradeYear: '',
        rollNumber: '',
        department: '',
        existingDentalIssues: [],
        medicalHistory: '',
        currentMedications: '',
        allergies: '',
        consentGiven: false,
        photoConsent: false
      });
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Error adding participant: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTrackServicesSubmit = (e) => {
    e.preventDefault();
    console.log('Service Tracking:', trackServicesForm);
    setSuccessMessage('🩺 Services tracked successfully!');
    setShowTrackServicesModal(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Toast Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
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
                🦷
              </motion.span>
              Services Management Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-cyan-50"
            >
              Manage dental services, packages, and pricing with ease
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Service Categories */}
      <div className="space-y-8">
        {serviceCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            {/* Category Header */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${category.bgGradient} p-6 shadow-lg mb-4`}
            >
              <div className="relative z-10">
                <h2 className={`text-3xl font-bold bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent mb-2`}>
                  {category.title}
                </h2>
                <p className="text-slate-600 text-lg">{category.description}</p>
              </div>
              
              {/* Decorative gradient orb */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${category.gradient} opacity-20 rounded-full blur-3xl`}
              />
            </motion.div>

            {/* Service Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.options.map((option, optionIndex) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: categoryIndex * 0.1 + optionIndex * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredCard(option.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  onClick={() => handleServiceAction(option.action)}
                  className="relative cursor-pointer group"
                >
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${option.color} p-6 shadow-lg hover:shadow-2xl transition-all duration-300`}>
                    {/* Animated shine effect */}
                    <motion.div
                      animate={{
                        x: hoveredCard === option.id ? ["-100%", "200%"] : "-100%",
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
                          rotate: hoveredCard === option.id ? [0, -10, 10, -10, 0] : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl mb-3"
                      >
                        {option.icon}
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {option.title}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {option.description}
                      </p>
                    </div>

                    {/* Hover glow */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredCard === option.id ? 1 : 0 }}
                      className="absolute inset-0 bg-white/10 backdrop-blur-sm"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats/Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 p-8 shadow-2xl"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
        />
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Service Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="text-4xl mb-2">🦷</div>
              <div className="text-3xl font-bold text-white mb-1">42</div>
              <div className="text-cyan-200 text-sm">Active Services</div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="text-4xl mb-2">📦</div>
              <div className="text-3xl font-bold text-white mb-1">12</div>
              <div className="text-cyan-200 text-sm">Service Packages</div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="text-4xl mb-2">💰</div>
              <div className="text-3xl font-bold text-white mb-1">₹2.5L</div>
              <div className="text-cyan-200 text-sm">Avg Monthly Revenue</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Pro Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg"
      >
        <p className="text-amber-900 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <span className="font-semibold">Pro Tip:</span>
          Bundle related services into packages to offer better value and increase patient satisfaction!
        </p>
      </motion.div>

      {/* Register Camp Modal */}
      <AnimatePresence>
        {showRegisterCampModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegisterCampModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🏕️</span>
                    <div>
                      <h2 className="text-2xl font-bold">Register Camp</h2>
                      <p className="text-purple-100 text-sm">Create a new dental/medical camp event</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRegisterCampModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCampFormSubmit} className="p-6 space-y-6">
                {/* Basic Camp Information */}
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <span>📋</span> Basic Camp Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Camp Name *</label>
                      <input
                        type="text"
                        required
                        value={campForm.campName}
                        onChange={(e) => setCampForm({...campForm, campName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        placeholder="e.g., Dental Health Awareness Camp 2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Camp Type *</label>
                      <select
                        required
                        value={campForm.campType}
                        onChange={(e) => setCampForm({...campForm, campType: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      >
                        <option value="">Select Type</option>
                        <option value="Dental">Dental</option>
                        <option value="Medical">Medical</option>
                        <option value="Eye Checkup">Eye Checkup</option>
                        <option value="General Health">General Health</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Camp Date *</label>
                      <input
                        type="date"
                        required
                        value={campForm.campDate}
                        onChange={(e) => setCampForm({...campForm, campDate: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time *</label>
                        <input
                          type="time"
                          required
                          value={campForm.startTime}
                          onChange={(e) => setCampForm({...campForm, startTime: e.target.value})}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">End Time *</label>
                        <input
                          type="time"
                          required
                          value={campForm.endTime}
                          onChange={(e) => setCampForm({...campForm, endTime: e.target.value})}
                          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="bg-pink-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
                    <span>📍</span> Location Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Venue Type *</label>
                      <select
                        required
                        value={campForm.venueType}
                        onChange={(e) => setCampForm({...campForm, venueType: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                      >
                        <option value="">Select Venue Type</option>
                        <option value="School">School</option>
                        <option value="College">College</option>
                        <option value="Community Center">Community Center</option>
                        <option value="Corporate Office">Corporate Office</option>
                        <option value="Rural Area">Rural Area</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Institution Name *</label>
                      <input
                        type="text"
                        required
                        value={campForm.institutionName}
                        onChange={(e) => setCampForm({...campForm, institutionName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                        placeholder="e.g., St. Mary's High School"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                      <textarea
                        required
                        value={campForm.address}
                        onChange={(e) => setCampForm({...campForm, address: e.target.value})}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                        placeholder="Complete address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={campForm.city}
                        onChange={(e) => setCampForm({...campForm, city: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={campForm.state}
                        onChange={(e) => setCampForm({...campForm, state: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Pin Code *</label>
                      <input
                        type="text"
                        required
                        value={campForm.pinCode}
                        onChange={(e) => setCampForm({...campForm, pinCode: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                        placeholder="6 digits"
                      />
                    </div>
                  </div>
                </div>

                {/* Organizer Information */}
                <div className="bg-rose-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <span>👤</span> Organizer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Organized By *</label>
                      <input
                        type="text"
                        required
                        value={campForm.organizedBy}
                        onChange={(e) => setCampForm({...campForm, organizedBy: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                        placeholder="Your clinic/hospital name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={campForm.contactPerson}
                        onChange={(e) => setCampForm({...campForm, contactPerson: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number *</label>
                      <input
                        type="tel"
                        required
                        value={campForm.contactNumber}
                        onChange={(e) => setCampForm({...campForm, contactNumber: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={campForm.contactEmail}
                        onChange={(e) => setCampForm({...campForm, contactEmail: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Camp Details */}
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <span>🎯</span> Camp Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Participants</label>
                      <input
                        type="number"
                        value={campForm.expectedParticipants}
                        onChange={(e) => setCampForm({...campForm, expectedParticipants: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Target Age Group</label>
                      <select
                        value={campForm.targetAgeGroup}
                        onChange={(e) => setCampForm({...campForm, targetAgeGroup: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      >
                        <option value="">Select Age Group</option>
                        <option value="Children (5-12)">Children (5-12)</option>
                        <option value="Teens (13-18)">Teens (13-18)</option>
                        <option value="Adults">Adults</option>
                        <option value="All Ages">All Ages</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Services Offered</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Dental Checkup', 'Teeth Cleaning', 'Fluoride Treatment', 'Oral Hygiene Education', 'Free Medications', 'Referrals'].map(service => (
                          <label key={service} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={campForm.servicesOffered.includes(service)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCampForm({...campForm, servicesOffered: [...campForm.servicesOffered, service]});
                                } else {
                                  setCampForm({...campForm, servicesOffered: campForm.servicesOffered.filter(s => s !== service)});
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Camp Description</label>
                      <textarea
                        value={campForm.campDescription}
                        onChange={(e) => setCampForm({...campForm, campDescription: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Budget Allocated (₹)</label>
                      <input
                        type="number"
                        value={campForm.budgetAllocated}
                        onChange={(e) => setCampForm({...campForm, budgetAllocated: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegisterCampModal(false)}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? '⏳ Creating...' : '🏕️ Register Camp'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Participants Modal */}
      <AnimatePresence>
        {showAddParticipantsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddParticipantsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">👥</span>
                    <div>
                      <h2 className="text-2xl font-bold">Add Participant</h2>
                      <p className="text-pink-100 text-sm">Register camp attendee</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddParticipantsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleParticipantFormSubmit} className="p-6 space-y-6">
                {/* Camp Selection */}
                <div className="bg-pink-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
                    <span>🏕️</span> Select Camp
                  </h3>
                  <select
                    required
                    value={participantForm.campName}
                    onChange={(e) => setParticipantForm({...participantForm, campName: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  >
                    <option value="">Select Camp</option>
                    <option value="Dental Health Awareness Camp 2025">Dental Health Awareness Camp 2025</option>
                  </select>
                </div>

                {/* Personal Information */}
                <div className="bg-rose-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <span>👤</span> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={participantForm.participantName}
                        onChange={(e) => setParticipantForm({...participantForm, participantName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Age *</label>
                      <input
                        type="number"
                        required
                        value={participantForm.age}
                        onChange={(e) => setParticipantForm({...participantForm, age: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                      <select
                        required
                        value={participantForm.gender}
                        onChange={(e) => setParticipantForm({...participantForm, gender: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={participantForm.phoneNumber}
                        onChange={(e) => setParticipantForm({...participantForm, phoneNumber: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Parent/Guardian Name</label>
                      <input
                        type="text"
                        value={participantForm.parentGuardianName}
                        onChange={(e) => setParticipantForm({...participantForm, parentGuardianName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                        placeholder="For minors"
                      />
                    </div>
                  </div>
                </div>

                {/* Institution Details */}
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <span>🎓</span> Institution Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Student/Staff</label>
                      <select
                        value={participantForm.studentOrStaff}
                        onChange={(e) => setParticipantForm({...participantForm, studentOrStaff: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Student">Student</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Class/Standard</label>
                      <input
                        type="text"
                        value={participantForm.classStandard}
                        onChange={(e) => setParticipantForm({...participantForm, classStandard: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        placeholder="e.g., 8th Grade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={participantForm.rollNumber}
                        onChange={(e) => setParticipantForm({...participantForm, rollNumber: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={participantForm.department}
                        onChange={(e) => setParticipantForm({...participantForm, department: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                        placeholder="For college students"
                      />
                    </div>
                  </div>
                </div>

                {/* Health Information */}
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span>🩺</span> Health Information (Pre-Screening)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Dental Issues</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Toothache', 'Bleeding Gums', 'Sensitivity', 'Cavity', 'None'].map(issue => (
                          <label key={issue} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={participantForm.existingDentalIssues.includes(issue)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setParticipantForm({...participantForm, existingDentalIssues: [...participantForm.existingDentalIssues, issue]});
                                } else {
                                  setParticipantForm({...participantForm, existingDentalIssues: participantForm.existingDentalIssues.filter(i => i !== issue)});
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{issue}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies</label>
                      <input
                        type="text"
                        value={participantForm.allergies}
                        onChange={(e) => setParticipantForm({...participantForm, allergies: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div className="bg-green-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                    <span>✅</span> Consent
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantForm.consentGiven}
                        onChange={(e) => setParticipantForm({...participantForm, consentGiven: e.target.checked})}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-sm font-semibold text-gray-700">Consent for examination/treatment *</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantForm.photoConsent}
                        onChange={(e) => setParticipantForm({...participantForm, photoConsent: e.target.checked})}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-sm font-semibold text-gray-700">Photo consent for documentation</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipantsModal(false)}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? '⏳ Adding...' : '👥 Add Participant'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track Services Modal */}
      <AnimatePresence>
        {showTrackServicesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTrackServicesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🩺</span>
                    <div>
                      <h2 className="text-2xl font-bold">Track Services</h2>
                      <p className="text-rose-100 text-sm">Record services provided to participant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTrackServicesModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleTrackServicesSubmit} className="p-6 space-y-6">
                {/* Participant Selection */}
                <div className="bg-rose-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <span>👤</span> Select Participant
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Camp Name *</label>
                      <select
                        required
                        value={trackServicesForm.campName}
                        onChange={(e) => setTrackServicesForm({...trackServicesForm, campName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      >
                        <option value="">Select Camp</option>
                        <option value="Dental Health Awareness Camp 2025">Dental Health Awareness Camp 2025</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Participant *</label>
                      <select
                        required
                        value={trackServicesForm.participantName}
                        onChange={(e) => setTrackServicesForm({...trackServicesForm, participantName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      >
                        <option value="">Select Participant</option>
                        <option value="John Doe">John Doe</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Examination Details */}
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span>📋</span> Examination Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Examined By *</label>
                      <input
                        type="text"
                        required
                        value={trackServicesForm.examinedBy}
                        onChange={(e) => setTrackServicesForm({...trackServicesForm, examinedBy: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="Doctor name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Oral Hygiene Status</label>
                      <select
                        value={trackServicesForm.oralHygieneStatus}
                        onChange={(e) => setTrackServicesForm({...trackServicesForm, oralHygieneStatus: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="">Select Status</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Chief Complaint</label>
                      <textarea
                        value={trackServicesForm.chiefComplaint}
                        onChange={(e) => setTrackServicesForm({...trackServicesForm, chiefComplaint: e.target.value})}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Findings */}
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <span>🔍</span> Clinical Findings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Dental Issues Found</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Dental Caries', 'Gingivitis', 'Periodontitis', 'Missing Teeth', 'Malocclusion', 'None'].map(issue => (
                          <label key={issue} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={trackServicesForm.dentalIssuesFound.includes(issue)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTrackServicesForm({...trackServicesForm, dentalIssuesFound: [...trackServicesForm.dentalIssuesFound, issue]});
                                } else {
                                  setTrackServicesForm({...trackServicesForm, dentalIssuesFound: trackServicesForm.dentalIssuesFound.filter(i => i !== issue)});
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{issue}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Clinical Notes</label>
                      <textarea
                        value={trackServicesForm.clinicalNotes}
                        onChange={(e) => setTrackServicesForm({...trackServicesForm, clinicalNotes: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Services Provided */}
                <div className="bg-green-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                    <span>✅</span> Services Provided at Camp
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Oral Examination', 'Teeth Cleaning', 'Fluoride Application', 'Oral Hygiene Education', 'Medication Provided', 'Referral Given'].map(service => (
                      <label key={service} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trackServicesForm.servicesProvided.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTrackServicesForm({...trackServicesForm, servicesProvided: [...trackServicesForm.servicesProvided, service]});
                            } else {
                              setTrackServicesForm({...trackServicesForm, servicesProvided: trackServicesForm.servicesProvided.filter(s => s !== service)});
                            }
                          }}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Follow-up & Referral */}
                <div className="bg-amber-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>📅</span> Follow-up & Referral
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trackServicesForm.requiresFollowup}
                          onChange={(e) => setTrackServicesForm({...trackServicesForm, requiresFollowup: e.target.checked})}
                          className="w-5 h-5 text-amber-600 rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Requires Follow-up</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trackServicesForm.referralRequired}
                          onChange={(e) => setTrackServicesForm({...trackServicesForm, referralRequired: e.target.checked})}
                          className="w-5 h-5 text-amber-600 rounded"
                        />
                        <span className="text-sm font-semibold text-gray-700">Referral Required</span>
                      </label>
                    </div>
                    {trackServicesForm.referralRequired && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Referral Date</label>
                          <input
                            type="date"
                            value={trackServicesForm.referralDate}
                            onChange={(e) => setTrackServicesForm({...trackServicesForm, referralDate: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                          <select
                            value={trackServicesForm.priority}
                            onChange={(e) => setTrackServicesForm({...trackServicesForm, priority: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                          >
                            <option value="">Select Priority</option>
                            <option value="Urgent">Urgent</option>
                            <option value="Routine">Routine</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTrackServicesModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg transition-all"
                  >
                    🩺 Save Services
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camp Reports Modal */}
      <AnimatePresence>
        {showCampReportsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCampReportsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">📊</span>
                    <div>
                      <h2 className="text-2xl font-bold">Camp Reports</h2>
                      <p className="text-purple-100 text-sm">View attendance, statistics & analytics</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCampReportsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <span>🔍</span> Report Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select className="px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 outline-none">
                    <option>Select Camp</option>
                    <option>Dental Health Awareness Camp 2025</option>
                  </select>
                  <FancyDatePicker label="Report Date" value={reportFilterDate} onChange={setReportFilterDate} />
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all">
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="p-6 space-y-6">
                {/* Camp Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">📈 Camp Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl mb-2">🏕️</div>
                      <div className="text-2xl font-bold text-purple-600">5</div>
                      <div className="text-xs text-gray-600">Total Camps</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl mb-2">👥</div>
                      <div className="text-2xl font-bold text-pink-600">342</div>
                      <div className="text-xs text-gray-600">Participants</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="text-2xl font-bold text-green-600">320</div>
                      <div className="text-xs text-gray-600">Examined</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl mb-2">📊</div>
                      <div className="text-2xl font-bold text-blue-600">93.6%</div>
                      <div className="text-xs text-gray-600">Attendance</div>
                    </div>
                  </div>
                </div>

                {/* Service Metrics */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">🩺 Services Provided</h3>
                  <div className="space-y-3">
                    {[
                      { service: 'Oral Examinations', count: 320, color: 'blue' },
                      { service: 'Teeth Cleanings', count: 215, color: 'cyan' },
                      { service: 'Fluoride Applications', count: 180, color: 'teal' },
                      { service: 'Medications Distributed', count: 95, color: 'green' },
                      { service: 'Referrals Given', count: 42, color: 'amber' }
                    ].map(item => (
                      <div key={item.service} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-700">{item.service}</span>
                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`bg-gradient-to-r from-${item.color}-400 to-${item.color}-500 h-2 rounded-full`} style={{width: `${(item.count/320)*100}%`}}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-bold hover:from-red-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2">
                    <span>📄</span> PDF
                  </button>
                  <button className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2">
                    <span>📊</span> Excel
                  </button>
                  <button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2">
                    <span>🖨️</span> Print
                  </button>
                  <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2">
                    <span>📧</span> Email
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
