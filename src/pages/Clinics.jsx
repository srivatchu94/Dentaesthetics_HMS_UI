import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createDoctor } from "../services/doctorService";

export default function Clinics(){
  const [log, setLog] = useState([]);
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Doctor Management States
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [doctorFormData, setDoctorFormData] = useState({
    staffId: "",
    // Personal details
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    // Contact details
    email: "",
    phone: "",
    address: "",
    // Professional details
    licenseNumber: "",
    licenseExpiry: "",
    specialtyId: "",
    yearsExperience: "",
    education: "",
    certifications: "",
    languages: "",
    // Employment details
    joiningDate: "",
    employmentStatus: "",
    availability: "",
    // Compliance & legal
    insuranceDetails: "",
    emergencyContact: "",
    // Patient-facing info
    bio: "",
    profilePhotoUrl: "",
    achievements: "",
    publications: "",
    socialLinks: "",
    // System tracking
    branchId: "",
    role: "Doctor"
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  
  const onAction = (action) => {
    if (action === "Add Clinic") { navigate("/clinics/create"); return; }
    if (action === "List Clinics") { navigate("/clinics/view"); return; }
    if (action === "Onboard Doctors") { 
      setShowDoctorModal(true);
      setShowDoctorForm(true);
      return;
    }
    setLog((s) => [action, ...s].slice(0, 10));
    alert(`${action} (sample)`);
  };
  
  // Reset form
  const resetDoctorForm = () => {
    setDoctorFormData({
      staffId: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      phone: "",
      address: "",
      licenseNumber: "",
      licenseExpiry: "",
      specialtyId: "",
      yearsExperience: "",
      education: "",
      certifications: "",
      languages: "",
      joiningDate: "",
      employmentStatus: "",
      availability: "",
      insuranceDetails: "",
      emergencyContact: "",
      bio: "",
      profilePhotoUrl: "",
      achievements: "",
      publications: "",
      socialLinks: "",
      branchId: "",
      role: "Doctor"
    });
    setActiveTab("personal");
    setShowPreview(false);
  };

  // Tab navigation order
  const tabOrder = ["personal", "contact", "professional", "employment", "compliance", "profile"];

  // Validate required fields for each tab
  const validateTab = (tab) => {
    const errors = [];
    
    if (tab === "personal") {
      if (!doctorFormData.staffId) errors.push("staffId");
      if (!doctorFormData.branchId) errors.push("branchId");
      if (!doctorFormData.firstName) errors.push("firstName");
      if (!doctorFormData.lastName) errors.push("lastName");
      if (!doctorFormData.dateOfBirth) errors.push("dateOfBirth");
      if (!doctorFormData.gender) errors.push("gender");
    } else if (tab === "contact") {
      if (!doctorFormData.email) errors.push("email");
      if (!doctorFormData.phone) errors.push("phone");
      if (!doctorFormData.emergencyContact) errors.push("emergencyContact");
    } else if (tab === "professional") {
      if (!doctorFormData.licenseNumber) errors.push("licenseNumber");
      if (!doctorFormData.licenseExpiry) errors.push("licenseExpiry");
      if (!doctorFormData.specialtyId) errors.push("specialtyId");
    } else if (tab === "employment") {
      if (!doctorFormData.joiningDate) errors.push("joiningDate");
      if (!doctorFormData.employmentStatus) errors.push("employmentStatus");
    }
    
    return errors;
  };

  // Navigate to next tab
  const handleNextTab = () => {
    const errors = validateTab(activeTab);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  // Navigate to previous tab
  const handlePreviousTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  // Handle doctor form submit
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        doctorId: 0,
        staffId: parseInt(doctorFormData.staffId) || 0,
        firstName: doctorFormData.firstName || "string",
        lastName: doctorFormData.lastName || "string",
        dateOfBirth: doctorFormData.dateOfBirth ? new Date(doctorFormData.dateOfBirth).toISOString() : new Date().toISOString(),
        gender: doctorFormData.gender || "string",
        email: doctorFormData.email || "string",
        phone: doctorFormData.phone || "string",
        address: doctorFormData.address || "string",
        licenseNumber: doctorFormData.licenseNumber || "string",
        licenseExpiry: doctorFormData.licenseExpiry ? new Date(doctorFormData.licenseExpiry).toISOString() : new Date().toISOString(),
        specialtyId: parseInt(doctorFormData.specialtyId) || 0,
        yearsExperience: doctorFormData.yearsExperience ? parseInt(doctorFormData.yearsExperience) : 0,
        education: doctorFormData.education || "string",
        certifications: doctorFormData.certifications || "string",
        languages: doctorFormData.languages || "string",
        joiningDate: doctorFormData.joiningDate ? new Date(doctorFormData.joiningDate).toISOString() : new Date().toISOString(),
        employmentStatus: doctorFormData.employmentStatus || "string",
        availability: doctorFormData.availability || "string",
        insuranceDetails: doctorFormData.insuranceDetails || "string",
        emergencyContact: doctorFormData.emergencyContact || "string",
        bio: doctorFormData.bio || "string",
        profilePhotoUrl: doctorFormData.profilePhotoUrl || "string",
        achievements: doctorFormData.achievements || "string",
        publications: doctorFormData.publications || "string",
        socialLinks: doctorFormData.socialLinks || "string",
        branchId: parseInt(doctorFormData.branchId) || 0,
        role: doctorFormData.role || "Doctor",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      
      await createDoctor(payload);
      setShowPreview(false);
      setShowDoctorModal(false);
      setShowDoctorForm(false);
      setShowSuccessModal(true);
      resetDoctorForm();
    } catch (error) {
      console.error("Error saving doctor:", error);
      alert("Failed to save doctor. Please try again.");
    }
  };

  const quickActions = [
    { 
      title: "Add Clinic", 
      icon: "➕", 
      description: "Register a new clinic location",
      color: "from-emerald-400 to-teal-400",
      bgColor: "from-emerald-50 to-teal-50",
      action: () => onAction("Add Clinic")
    },
    { 
      title: "List Clinics", 
      icon: "📋", 
      description: "View all registered clinics",
      color: "from-blue-400 to-cyan-400",
      bgColor: "from-blue-50 to-cyan-50",
      action: () => onAction("List Clinics")
    },
    { 
      title: "Update Clinic", 
      icon: "✏️", 
      description: "Modify clinic information",
      color: "from-amber-400 to-orange-400",
      bgColor: "from-amber-50 to-orange-50",
      action: () => onAction("Update Clinic")
    },
    { 
      title: "Delete Clinic", 
      icon: "🗑️", 
      description: "Remove clinic from system",
      color: "from-rose-400 to-rose-500",
      bgColor: "from-red-50 to-rose-50",
      action: () => onAction("Delete Clinic")
    },
    { 
      title: "Onboard Doctors", 
      icon: "👨‍⚕️", 
      description: "Add and manage doctors",
      color: "from-indigo-400 to-purple-400",
      bgColor: "from-purple-50 to-indigo-50",
      action: () => onAction("Onboard Doctors")
    },
    { 
      title: "View Doctors", 
      icon: "👀", 
      description: "Search and edit doctors",
      color: "from-violet-400 to-purple-400",
      bgColor: "from-violet-50 to-purple-50",
      action: () => navigate("/doctors/view")
    },
    { 
      title: "Doctor-Clinic Mapping", 
      icon: "🔗", 
      description: "Map doctors to clinics",
      color: "from-pink-400 to-rose-400",
      bgColor: "from-pink-50 to-rose-50",
      action: () => navigate("/doctors/clinic-mapping")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-8"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
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
                🏥
              </motion.span>
              Clinic Management Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-cyan-50"
            >
              Manage clinic locations, operations, and analytics with ease
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard(action.title)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={action.action}
                className="relative cursor-pointer group"
              >
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-6 shadow-lg hover:shadow-2xl transition-all duration-300`}>
                  {/* Animated shine effect */}
                  <motion.div
                    animate={{
                      x: hoveredCard === action.title ? ["-100%", "200%"] : "-100%",
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
                        rotate: hoveredCard === action.title ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-5xl mb-3"
                    >
                      {action.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {action.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reports & Analytics Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-xl shadow-lg p-8 border border-purple-200"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                  📊
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
                  Reports & Analytics Dashboard
                </h3>
              </div>
              <p className="text-slate-600">
                View revenue trends, patient flow, performance metrics, and generate comprehensive reports across all clinics
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/reports")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              View Dashboard →
            </motion.button>
          </div>
        </motion.div>

        {/* Salary Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-xl shadow-lg p-8 border border-emerald-200"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-2xl shadow-lg">
                  💰
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                  Salary Management
                </h3>
              </div>
              <p className="text-slate-600">
                Calculate and manage staff salaries, incentives, and payment records across all clinic locations
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/salary")}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              Manage Salaries →
            </motion.button>
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> Recent Activity
          </h3>
          <AnimatePresence mode="popLayout">
            {log.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-slate-500"
              >
                <div className="text-5xl mb-3">📭</div>
                <p>No recent activity</p>
              </motion.div>
            ) : (
              <ul className="space-y-2">
                {log.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200 hover:border-teal-300 transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                    <span className="text-slate-700 font-medium">{item}</span>
                    <span className="text-xs text-slate-500 ml-auto">Just now</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Doctor Management Modal */}
      <AnimatePresence>
        {showDoctorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDoctorModal(false);
              setShowDoctorForm(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <span className="text-4xl">👨‍⚕️</span>
                      Doctor Onboarding & Management
                    </h2>
                    <p className="text-purple-100 mt-1">Manage doctor profiles, credentials, and specializations</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDoctorModal(false);
                      setShowDoctorForm(false);
                      resetDoctorForm();
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Doctor Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-purple-200"
                >
                  <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                    <span>➕</span>
                    Doctor Onboarding
                  </h3>

                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-purple-200 pb-2">
                      {[
                        { id: "personal", label: "Personal Info", icon: "👤" },
                        { id: "contact", label: "Contact", icon: "📞" },
                        { id: "professional", label: "Professional", icon: "🎓" },
                        { id: "employment", label: "Employment", icon: "💼" },
                        { id: "compliance", label: "Compliance", icon: "📋" },
                        { id: "profile", label: "Profile", icon: "✨" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-105"
                              : "bg-white text-purple-700 hover:bg-purple-100"
                          }`}
                        >
                          <span>{tab.icon}</span>
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleDoctorSubmit} className="space-y-6">
                      {/* Personal Info Tab */}
                      {activeTab === "personal" && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Staff ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                value={doctorFormData.staffId || ""}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, staffId: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "staffId"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("staffId")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="Enter staff ID"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Branch ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                value={doctorFormData.branchId || ""}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, branchId: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "branchId"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("branchId")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="Enter branch ID"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                First Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={doctorFormData.firstName}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, firstName: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "firstName"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("firstName")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="Enter first name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Last Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={doctorFormData.lastName}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, lastName: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "lastName"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("lastName")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="Enter last name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Date of Birth <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={doctorFormData.dateOfBirth}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, dateOfBirth: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "dateOfBirth"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("dateOfBirth")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Gender <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={doctorFormData.gender}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, gender: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "gender"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("gender")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                              >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Validation Message */}
                          {validationErrors.length > 0 && activeTab === "personal" && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3"
                            >
                              <span className="text-3xl">🤔</span>
                              <div>
                                <p className="text-red-700 font-bold text-lg">Oops! Looks like we're missing some info!</p>
                                <p className="text-red-600 mt-1">Don't be shy—fill in those red boxes so we can get to know this awesome doctor! 🩺✨</p>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Contact Tab */}
                      {activeTab === "contact" && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={doctorFormData.email}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, email: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "email"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("email")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="doctor@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Phone <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                value={doctorFormData.phone}
                                onChange={(e) => setDoctorFormData({ ...doctorFormData, phone: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Address
                            </label>
                            <textarea
                              value={doctorFormData.address}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, address: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="3"
                              placeholder="Enter complete address"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Emergency Contact <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={doctorFormData.emergencyContact}
                              onChange={(e) => {
                                setDoctorFormData({ ...doctorFormData, emergencyContact: e.target.value });
                                if (e.target.value) {
                                  setValidationErrors(validationErrors.filter(err => err !== "emergencyContact"));
                                }
                              }}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                validationErrors.includes("emergencyContact")
                                  ? "border-red-500 bg-red-50 animate-shake"
                                  : "border-purple-300"
                              }`}
                              placeholder="Emergency contact name & number"
                            />
                          </div>
                          
                          {/* Validation Message */}
                          {validationErrors.length > 0 && activeTab === "contact" && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3"
                            >
                              <span className="text-3xl">📱</span>
                              <div>
                                <p className="text-red-700 font-bold text-lg">Hey there! We need contact details!</p>
                                <p className="text-red-600 mt-1">How else can patients reach this doc? Fill those glowing red fields, please! 😊</p>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Professional Tab */}
                      {activeTab === "professional" && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                License Number <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={doctorFormData.licenseNumber}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, licenseNumber: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "licenseNumber"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("licenseNumber")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="Medical license number"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                License Expiry <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={doctorFormData.licenseExpiry}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, licenseExpiry: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "licenseExpiry"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("licenseExpiry")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Specialty ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                value={doctorFormData.specialtyId}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, specialtyId: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "specialtyId"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("specialtyId")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                                placeholder="Enter specialty ID"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Years of Experience
                              </label>
                              <input
                                type="number"
                                value={doctorFormData.yearsExperience}
                                onChange={(e) => setDoctorFormData({ ...doctorFormData, yearsExperience: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="Years of experience"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Education
                            </label>
                            <textarea
                              value={doctorFormData.education}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, education: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="3"
                              placeholder="Educational qualifications (degrees, institutions, years)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Certifications
                            </label>
                            <textarea
                              value={doctorFormData.certifications}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, certifications: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="3"
                              placeholder="Professional certifications and additional training"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Languages
                            </label>
                            <input
                              type="text"
                              value={doctorFormData.languages}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, languages: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              placeholder="Languages spoken (comma-separated)"
                            />
                          </div>
                          
                          {/* Validation Message */}
                          {validationErrors.length > 0 && activeTab === "professional" && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3"
                            >
                              <span className="text-3xl">🎓</span>
                              <div>
                                <p className="text-red-700 font-bold text-lg">Professional credentials needed!</p>
                                <p className="text-red-600 mt-1">We need to make sure this doc is legit! Fill in those red fields, stat! 👨‍⚕️💼</p>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Employment Tab */}
                      {activeTab === "employment" && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Joining Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={doctorFormData.joiningDate}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, joiningDate: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "joiningDate"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("joiningDate")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Employment Status <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={doctorFormData.employmentStatus}
                                onChange={(e) => {
                                  setDoctorFormData({ ...doctorFormData, employmentStatus: e.target.value });
                                  if (e.target.value) {
                                    setValidationErrors(validationErrors.filter(err => err !== "employmentStatus"));
                                  }
                                }}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                  validationErrors.includes("employmentStatus")
                                    ? "border-red-500 bg-red-50 animate-shake"
                                    : "border-purple-300"
                                }`}
                              >
                                <option value="">Select status</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Visiting">Visiting</option>
                                <option value="Consultant">Consultant</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Availability Schedule
                            </label>
                            <textarea
                              value={doctorFormData.availability}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, availability: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="4"
                              placeholder="Working days and hours (e.g., Mon-Fri 9AM-5PM, Sat 9AM-1PM)"
                            />
                          </div>
                          
                          {/* Validation Message */}
                          {validationErrors.length > 0 && activeTab === "employment" && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3"
                            >
                              <span className="text-3xl">💼</span>
                              <div>
                                <p className="text-red-700 font-bold text-lg">Employment details, please!</p>
                                <p className="text-red-600 mt-1">When did they start? Are they full-time? We need the deets in those red boxes! 📅</p>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {/* Compliance Tab */}
                      {activeTab === "compliance" && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Insurance Details
                            </label>
                            <textarea
                              value={doctorFormData.insuranceDetails}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, insuranceDetails: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="4"
                              placeholder="Malpractice insurance details (provider, policy number, coverage amount)"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Profile Tab */}
                      {activeTab === "profile" && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Profile Photo URL
                            </label>
                            <input
                              type="url"
                              value={doctorFormData.profilePhotoUrl}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, profilePhotoUrl: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              placeholder="https://example.com/photo.jpg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Bio
                            </label>
                            <textarea
                              value={doctorFormData.bio}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, bio: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="4"
                              placeholder="Professional biography for patients"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Achievements
                            </label>
                            <textarea
                              value={doctorFormData.achievements}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, achievements: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="3"
                              placeholder="Notable achievements and awards"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Publications
                            </label>
                            <textarea
                              value={doctorFormData.publications}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, publications: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="3"
                              placeholder="Research papers, publications, and articles"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Social Links
                            </label>
                            <textarea
                              value={doctorFormData.socialLinks}
                              onChange={(e) => setDoctorFormData({ ...doctorFormData, socialLinks: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              rows="3"
                              placeholder="LinkedIn, professional website, etc. (one per line)"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Tab Navigation */}
                      <div className="flex justify-between gap-3 pt-4 border-t-2 border-purple-200">
                        <button
                          type="button"
                          onClick={handlePreviousTab}
                          disabled={activeTab === "personal"}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                            activeTab === "personal"
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white shadow-lg"
                          }`}
                        >
                          ← Previous
                        </button>
                        
                        {activeTab === "profile" ? (
                          <div className="flex gap-3 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                const errors = validateTab("profile");
                                if (errors.length > 0) {
                                  alert(`⚠️ Please fill in required fields:\n\n${errors.join("\n")}`);
                                  return;
                                }
                                setShowPreview(true);
                              }}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              👁️ Preview
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              ➕ Onboard Doctor
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleNextTab}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                          >
                            Next →
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setShowDoctorModal(false);
                            setShowDoctorForm(false);
                            resetDoctorForm();
                          }}
                          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-4xl">👁️</span>
                  Preview Doctor Profile
                </h2>
                <p className="text-cyan-100 mt-1">Review all information before submitting</p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                {/* Personal Info Section */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <span>👤</span> Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-purple-700">Staff ID:</span> {doctorFormData.staffId}</div>
                    <div><span className="font-semibold text-purple-700">Branch ID:</span> {doctorFormData.branchId}</div>
                    <div><span className="font-semibold text-purple-700">First Name:</span> {doctorFormData.firstName}</div>
                    <div><span className="font-semibold text-purple-700">Last Name:</span> {doctorFormData.lastName}</div>
                    <div><span className="font-semibold text-purple-700">Date of Birth:</span> {doctorFormData.dateOfBirth}</div>
                    <div><span className="font-semibold text-purple-700">Gender:</span> {doctorFormData.gender}</div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border-2 border-teal-200">
                  <h3 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-2">
                    <span>📞</span> Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-teal-700">Email:</span> {doctorFormData.email}</div>
                    <div><span className="font-semibold text-teal-700">Phone:</span> {doctorFormData.phone}</div>
                    <div className="col-span-2"><span className="font-semibold text-teal-700">Address:</span> {doctorFormData.address || "N/A"}</div>
                    <div className="col-span-2"><span className="font-semibold text-teal-700">Emergency Contact:</span> {doctorFormData.emergencyContact}</div>
                  </div>
                </div>

                {/* Professional Section */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                  <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>🎓</span> Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-amber-700">License Number:</span> {doctorFormData.licenseNumber}</div>
                    <div><span className="font-semibold text-amber-700">License Expiry:</span> {doctorFormData.licenseExpiry}</div>
                    <div><span className="font-semibold text-amber-700">Specialty ID:</span> {doctorFormData.specialtyId}</div>
                    <div><span className="font-semibold text-amber-700">Years of Experience:</span> {doctorFormData.yearsExperience || "0"}</div>
                    <div className="col-span-2"><span className="font-semibold text-amber-700">Education:</span> {doctorFormData.education || "N/A"}</div>
                    <div className="col-span-2"><span className="font-semibold text-amber-700">Certifications:</span> {doctorFormData.certifications || "N/A"}</div>
                    <div><span className="font-semibold text-amber-700">Languages:</span> {doctorFormData.languages || "N/A"}</div>
                  </div>
                </div>

                {/* Employment Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-200">
                  <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <span>💼</span> Employment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-emerald-700">Joining Date:</span> {doctorFormData.joiningDate}</div>
                    <div><span className="font-semibold text-emerald-700">Employment Status:</span> {doctorFormData.employmentStatus}</div>
                    <div className="col-span-2"><span className="font-semibold text-emerald-700">Availability:</span> {doctorFormData.availability || "N/A"}</div>
                  </div>
                </div>

                {/* Compliance Section */}
                {doctorFormData.insuranceDetails && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <span>📋</span> Compliance Information
                    </h3>
                    <div className="text-sm">
                      <div><span className="font-semibold text-blue-700">Insurance Details:</span> {doctorFormData.insuranceDetails}</div>
                    </div>
                  </div>
                )}

                {/* Profile Section */}
                {(doctorFormData.bio || doctorFormData.achievements || doctorFormData.publications) && (
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border-2 border-pink-200">
                    <h3 className="text-xl font-bold text-pink-900 mb-4 flex items-center gap-2">
                      <span>✨</span> Profile Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      {doctorFormData.bio && <div><span className="font-semibold text-pink-700">Bio:</span> {doctorFormData.bio}</div>}
                      {doctorFormData.achievements && <div><span className="font-semibold text-pink-700">Achievements:</span> {doctorFormData.achievements}</div>}
                      {doctorFormData.publications && <div><span className="font-semibold text-pink-700">Publications:</span> {doctorFormData.publications}</div>}
                      {doctorFormData.socialLinks && <div><span className="font-semibold text-pink-700">Social Links:</span> {doctorFormData.socialLinks}</div>}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t-2 border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white rounded-lg font-semibold shadow-lg transition-all"
                >
                  ← Go Back
                </button>
                <button
                  onClick={handleDoctorSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  ✅ Confirm & Submit
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-green-300"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="text-center mb-6"
              >
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-900 mb-2">Woohoo! Success!</h2>
              </motion.div>
              
              <div className="text-center space-y-3 mb-6">
                <p className="text-xl font-semibold text-green-800">
                  Doctor successfully onboarded! 🏥
                </p>
                <p className="text-green-700">
                  They're officially part of the team now! Time to save some lives! 💪
                </p>
                <div className="flex justify-center gap-2 text-4xl mt-4">
                  <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>👨‍⚕️</motion.span>
                  <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>❤️</motion.span>
                  <motion.span animate={{ rotate: [0, -20, 20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>🎊</motion.span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
              >
                Awesome! Let's Go! 🚀
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
