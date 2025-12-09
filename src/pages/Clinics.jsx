import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createDoctor } from "../services/doctorService";

export default function Clinics(){
  const [log, setLog] = useState([]);
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
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
    role: "Doctor",
    // Enterprise and Clinic assignment
    enterpriseId: 0,
    clinicId: 0
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  
  // Doctor onboarding - Enterprise and Clinic dropdowns
  const [doctorEnterprises, setDoctorEnterprises] = useState([]);
  const [doctorClinics, setDoctorClinics] = useState([]);
  const [loadingDoctorClinics, setLoadingDoctorClinics] = useState(false);

  // Create Clinic modal states
  const [showCreateClinicModal, setShowCreateClinicModal] = useState(false);
  const [createClinicActiveTab, setCreateClinicActiveTab] = useState("basic");
  const [createClinicForm, setCreateClinicForm] = useState({
    clinicId: 0,
    enterpriseId: 0,
    clinicName: "",
    clinicCode: "",
    contactEmail: "",
    contactPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    openingHours: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 0,
    updatedBy: 0
  });
  const [creatingClinic, setCreatingClinic] = useState(false);
  
  // Working hours state for clinic
  const [clinicWorkingHours, setClinicWorkingHours] = useState({
    Monday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
    Tuesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
    Wednesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
    Thursday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
    Friday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
    Saturday: { isOpen: false, startTime: "10:00", endTime: "14:00" },
    Sunday: { isOpen: false, startTime: "00:00", endTime: "00:00" }
  });
  
  // Create Enterprise modal states
  const [showCreateEnterpriseModal, setShowCreateEnterpriseModal] = useState(false);
  const [createEnterpriseActiveTab, setCreateEnterpriseActiveTab] = useState("basic");
  const [createEnterpriseForm, setCreateEnterpriseForm] = useState({
    enterpriseName: "",
    registrationNumber: "",
    contactEmail: "",
    contactPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    isActive: true
  });
  const [creatingEnterprise, setCreatingEnterprise] = useState(false);
  
  // Manage Enterprise modal states
  const [showManageEnterpriseModal, setShowManageEnterpriseModal] = useState(false);
  const [manageEnterpriseSearchId, setManageEnterpriseSearchId] = useState("");
  const [manageEnterpriseData, setManageEnterpriseData] = useState(null);
  const [manageEnterpriseEditMode, setManageEnterpriseEditMode] = useState(false);
  const [manageEnterpriseForm, setManageEnterpriseForm] = useState(null);
  const [manageEnterpriseLoading, setManageEnterpriseLoading] = useState(false);
  const [manageEnterpriseError, setManageEnterpriseError] = useState("");
  const [updatingEnterprise, setUpdatingEnterprise] = useState(false);
  
  // Success modal state
  const [showEnterpriseSuccessModal, setShowEnterpriseSuccessModal] = useState(false);
  const [enterpriseSuccessMessage, setEnterpriseSuccessMessage] = useState("");
  const [showClinicSuccessModal, setShowClinicSuccessModal] = useState(false);
  const [clinicSuccessMessage, setClinicSuccessMessage] = useState("");
  
  // List Clinics Modal states
  const [showListClinicsModal, setShowListClinicsModal] = useState(false);
  const [listClinicsSearchResults, setListClinicsSearchResults] = useState([]);
  const [listClinicsLoading, setListClinicsLoading] = useState(false);
  const [listClinicsError, setListClinicsError] = useState("");
  const [listClinicsFilters, setListClinicsFilters] = useState({
    enterpriseId: "",
    clinicId: "",
    clinicName: "",
    address: "",
    email: "",
    phone: ""
  });
  const [selectedClinicView, setSelectedClinicView] = useState(null);
  const [showClinicDetailsModal, setShowClinicDetailsModal] = useState(false);
  
  // Enterprises list for clinic creation
  const [allEnterprises, setAllEnterprises] = useState([]);
  const [loadingEnterprises, setLoadingEnterprises] = useState(false);

  // Load enterprises on initial page load so dropdowns on the page are populated
  useEffect(() => {
    const loadEnterprisesOnMount = async () => {
      try {
        setLoadingEnterprises(true);
        const response = await fetch("https://localhost:7104/api/Enterprise", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("📋 Enterprises loaded on mount:", data);
          setAllEnterprises(Array.isArray(data) ? data : data.data || []);
          setDoctorEnterprises(Array.isArray(data) ? data : data.data || []);
        } else {
          console.error("Failed to load enterprises on mount", response.status);
        }
      } catch (error) {
        console.error("Error loading enterprises on mount:", error);
      } finally {
        setLoadingEnterprises(false);
      }
    };

    loadEnterprisesOnMount();
  }, []);
  const searchEnterprise = async () => {
    if (!manageEnterpriseSearchId.trim()) {
      setManageEnterpriseError("Please enter an Enterprise ID");
      return;
    }
    
    try {
      setManageEnterpriseLoading(true);
      setManageEnterpriseError("");
      
      const response = await fetch(`https://localhost:7104/api/Enterprise/${manageEnterpriseSearchId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Enterprise not found");
      }
      
      const data = await response.json();
      setManageEnterpriseData(data);
      setManageEnterpriseForm({
        enterpriseId: data.enterpriseId,
        enterpriseName: data.enterpriseName,
        registrationNumber: data.registrationNumber,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        isActive: data.isActive
      });
      setManageEnterpriseEditMode(false);
    } catch (error) {
      console.error("Error searching enterprise:", error);
      setManageEnterpriseError("Failed to fetch enterprise details. Please check the ID and try again.");
      setManageEnterpriseData(null);
    } finally {
      setManageEnterpriseLoading(false);
    }
  };
  
  // Update enterprise
  const updateEnterprise = async () => {
    if (!manageEnterpriseForm) return;
    
    try {
      setUpdatingEnterprise(true);
      
      // Build complete EnterpriseModel for update
      const enterpriseModel = {
        enterpriseId: manageEnterpriseForm.enterpriseId,
        enterpriseName: manageEnterpriseForm.enterpriseName,
        registrationNumber: manageEnterpriseForm.registrationNumber,
        contactEmail: manageEnterpriseForm.contactEmail,
        contactPhone: manageEnterpriseForm.contactPhone,
        addressLine1: manageEnterpriseForm.addressLine1,
        addressLine2: manageEnterpriseForm.addressLine2,
        city: manageEnterpriseForm.city,
        state: manageEnterpriseForm.state,
        country: manageEnterpriseForm.country,
        postalCode: manageEnterpriseForm.postalCode,
        isActive: manageEnterpriseForm.isActive,
        createdAt: manageEnterpriseForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: manageEnterpriseForm.createdBy || 0,
        updatedBy: 0
      };
      
      console.log("📤 Sending Enterprise Model for Update:", enterpriseModel);
      
      const response = await fetch(`https://localhost:7104/api/Enterprise/EditEnterpriseInfo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(enterpriseModel)
      });
      
      console.log("📥 API Response Status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ API Error Response:", errorData);
        throw new Error("Failed to update enterprise");
      }
      
      setEnterpriseSuccessMessage("Enterprise Updated! ✨ You're a master editor! 🎯");
      setShowEnterpriseSuccessModal(true);
      setManageEnterpriseEditMode(false);
      setManageEnterpriseData(enterpriseModel);
    } catch (error) {
      console.error("Error updating enterprise:", error);
      alert("❌ Failed to update enterprise. Please try again.");
    } finally {
      setUpdatingEnterprise(false);
    }
  };
  
  // Validation function for Create Enterprise form
  const isCreateEnterpriseFormValid = () => {
    return (
      createEnterpriseForm.enterpriseName?.trim() !== "" &&
      createEnterpriseForm.registrationNumber?.trim() !== "" &&
      createEnterpriseForm.contactEmail?.trim() !== "" &&
      createEnterpriseForm.contactPhone?.trim() !== ""
    );
  };
  
  // Validation function for Create Clinic form
  
  // Load all enterprises for clinic creation dropdown
  useEffect(() => {
    const loadEnterprises = async () => {
      try {
        setLoadingEnterprises(true);
        const response = await fetch("https://localhost:7104/api/Enterprise", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("📋 Enterprises loaded:", data);
          setAllEnterprises(Array.isArray(data) ? data : data.data || []);
          
          // Also set for doctor onboarding
          setDoctorEnterprises(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error("Error loading enterprises:", error);
      } finally {
        setLoadingEnterprises(false);
      }
    };
    
    if (showCreateClinicModal || showDoctorForm || showListClinicsModal) {
      loadEnterprises();
    }
  }, [showCreateClinicModal, showDoctorForm, showListClinicsModal]);
  
  // Load clinics for doctor when enterprise is selected
  useEffect(() => {
    const loadClinics = async () => {
      if (!doctorFormData.enterpriseId || doctorFormData.enterpriseId === 0) {
        setDoctorClinics([]);
        return;
      }
      
      try {
        setLoadingDoctorClinics(true);
        const response = await fetch(`https://localhost:7104/api/Clinic/GetClinicByID?id=${doctorFormData.enterpriseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("🏥 Clinics loaded for enterprise:", data);
          setDoctorClinics(Array.isArray(data) ? data : data.data || []);
          // Reset clinic selection when enterprise changes
          setDoctorFormData(prev => ({ ...prev, clinicId: 0 }));
        } else {
          console.error("Failed to load clinics");
          setDoctorClinics([]);
        }
      } catch (error) {
        console.error("Error loading clinics:", error);
        setDoctorClinics([]);
      } finally {
        setLoadingDoctorClinics(false);
      }
    };
    
    loadClinics();
  }, [doctorFormData.enterpriseId]);
  
  // Load clinics for List Clinics modal when enterprise is selected
  useEffect(() => {
    const loadClinicsForListModal = async () => {
      if (!listClinicsFilters.enterpriseId || listClinicsFilters.enterpriseId === 0) {
        setDoctorClinics([]);
        return;
      }
      
      try {
        setLoadingDoctorClinics(true);
        const response = await fetch(`https://localhost:7104/api/Clinic/GetClinicByID?id=${listClinicsFilters.enterpriseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("🏥 Clinics loaded for enterprise in List Clinics:", data);
          setDoctorClinics(Array.isArray(data) ? data : data.data || []);
          // Reset clinic selection when enterprise changes
          setListClinicsFilters(prev => ({ ...prev, clinicId: 0 }));
        } else {
          console.error("Failed to load clinics");
          setDoctorClinics([]);
        }
      } catch (error) {
        console.error("Error loading clinics:", error);
        setDoctorClinics([]);
      } finally {
        setLoadingDoctorClinics(false);
      }
    };
    
    loadClinicsForListModal();
  }, [listClinicsFilters.enterpriseId]);

  const isCreateClinicFormValid = () => {
    return (
      createClinicForm.clinicName?.trim() !== "" &&
      createClinicForm.clinicCode?.trim() !== "" &&
      createClinicForm.enterpriseId > 0 &&
      createClinicForm.contactEmail?.trim() !== "" &&
      createClinicForm.contactPhone?.trim() !== "" &&
      createClinicForm.addressLine1?.trim() !== "" &&
      createClinicForm.city?.trim() !== "" &&
      createClinicForm.state?.trim() !== ""
    );
  };

  // Validate specific tab fields
  const isTabFieldsValid = (tabName) => {
    switch (tabName) {
      case "basic":
        return (
          createClinicForm.clinicName?.trim() !== "" &&
          createClinicForm.clinicCode?.trim() !== "" &&
          createClinicForm.enterpriseId > 0
        );
      case "contact":
        return (
          createClinicForm.contactEmail?.trim() !== "" &&
          createClinicForm.contactPhone?.trim() !== ""
        );
      case "address":
        return (
          createClinicForm.addressLine1?.trim() !== "" &&
          createClinicForm.city?.trim() !== "" &&
          createClinicForm.state?.trim() !== ""
        );
      case "settings":
        return true; // Settings tab is optional
      default:
        return false;
    }
  };
  
  const onAction = (action) => {
    if (action === "Add Enterprise") { 
      setShowCreateEnterpriseModal(true);
      return;
    }
    if (action === "Manage Enterprise") { 
      setShowManageEnterpriseModal(true);
      setManageEnterpriseSearchId("");
      setManageEnterpriseData(null);
      setManageEnterpriseForm(null);
      setManageEnterpriseEditMode(false);
      setManageEnterpriseError("");
      return;
    }
    if (action === "Add Clinic") { 
      setShowCreateClinicModal(true);
      return;
    }
    if (action === "List Clinics") { 
      setShowListClinicsModal(true);
      return; 
    }
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

  // Enterprise Management Actions
  const enterpriseActions = [
    { 
      title: "Add Enterprise", 
      icon: "🏢", 
      description: "Create new enterprise",
      color: "from-cyan-400 to-blue-500",
      bgColor: "from-cyan-50 to-blue-50",
      action: () => onAction("Add Enterprise")
    },
    { 
      title: "Manage Enterprise", 
      icon: "⚙️", 
      description: "Edit existing enterprises",
      color: "from-teal-400 to-emerald-500",
      bgColor: "from-teal-50 to-emerald-50",
      action: () => onAction("Manage Enterprise")
    }
  ];

  // Clinic Management Actions
  const clinicActions = [
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
    }
  ];

  // Doctor Onboarding Actions
  const doctorActions = [
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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8"
      initial={{ opacity: 1 }}
      animate={{ opacity: isNavigating ? 0 : 1 }}
      transition={{ duration: 0.3 }}
    >
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
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* ENTERPRISE MANAGEMENT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span>🏢</span>
            Enterprise Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enterpriseActions.map((action, index) => (
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

        {/* CLINICS MANAGEMENT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span>🏥</span>
            Clinics Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clinicActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
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
            
            {/* Create Clinic Backup Tile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredCard("Create Clinic Backup")}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => setShowCreateClinicModal(true)}
              className="relative cursor-pointer group"
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
                {/* Animated shine effect */}
                <motion.div
                  animate={{
                    x: hoveredCard === "Create Clinic Backup" ? ["-100%", "200%"] : "-100%",
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
                      rotate: hoveredCard === "Create Clinic Backup" ? [0, -10, 10, -10, 0] : 0,
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl mb-3"
                  >
                    🏥
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Create Clinic
                  </h3>
                  <p className="text-white/90 text-sm">
                    Backup access to clinic registration
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* DOCTOR ONBOARDING SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span>👨‍⚕️</span>
            Doctor Onboarding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctorActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
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
                          {/* Enterprise and Clinic Assignment Section */}
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 mb-4">
                            <h4 className="text-md font-bold text-indigo-900 mb-4 flex items-center gap-2">
                              🏢 Enterprise & Clinic Assignment
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-purple-900 mb-2">
                                  Select Enterprise <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={doctorFormData.enterpriseId || 0}
                                  onChange={(e) => {
                                    setDoctorFormData({ ...doctorFormData, enterpriseId: parseInt(e.target.value) });
                                    if (e.target.value) {
                                      setValidationErrors(validationErrors.filter(err => err !== "enterpriseId"));
                                    }
                                  }}
                                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                    validationErrors.includes("enterpriseId")
                                      ? "border-red-500 bg-red-50 animate-shake"
                                      : "border-purple-300"
                                  }`}
                                >
                                  <option value="0">-- Select an Enterprise --</option>
                                  {doctorEnterprises.map((enterprise) => (
                                    <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                                      [{enterprise.enterpriseId}] {enterprise.enterpriseName}
                                    </option>
                                  ))}
                                </select>
                                {doctorFormData.enterpriseId === 0 && (
                                  <p className="text-xs text-red-600 font-semibold mt-1">
                                    ⚠️ Enterprise selection is required
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-purple-900 mb-2">
                                  Select Clinic <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={doctorFormData.clinicId || 0}
                                  onChange={(e) => {
                                    setDoctorFormData({ ...doctorFormData, clinicId: parseInt(e.target.value) });
                                    if (e.target.value) {
                                      setValidationErrors(validationErrors.filter(err => err !== "clinicId"));
                                    }
                                  }}
                                  disabled={doctorFormData.enterpriseId === 0}
                                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                                    doctorFormData.enterpriseId === 0
                                      ? "border-slate-300 bg-slate-100 cursor-not-allowed opacity-60"
                                      : validationErrors.includes("clinicId")
                                      ? "border-red-500 bg-red-50 animate-shake"
                                      : "border-purple-300"
                                  }`}
                                >
                                  <option value="0">-- Select a Clinic --</option>
                                  {loadingDoctorClinics ? (
                                    <option disabled>Loading clinics...</option>
                                  ) : (
                                    doctorClinics.map((clinic) => (
                                      <option key={clinic.clinicId} value={clinic.clinicId}>
                                        [{clinic.clinicId}] {clinic.clinicName} - {clinic.addressLine1 || "Address Not Available"}
                                      </option>
                                    ))
                                  )}
                                </select>
                                {doctorFormData.enterpriseId === 0 ? (
                                  <p className="text-xs text-amber-600 font-semibold mt-1">
                                    ℹ️ Select an enterprise first
                                  </p>
                                ) : doctorFormData.clinicId === 0 ? (
                                  <p className="text-xs text-red-600 font-semibold mt-1">
                                    ⚠️ Clinic selection is required
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

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
                            👁️ Preview & Confirm
                          </button>
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  ✅ Confirm & Onboard Doctor
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

      {/* Create Clinic Modal */}
      <AnimatePresence>
        {showCreateClinicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateClinicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🏥 Create New Clinic</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreateClinicModal(false)}
                    type="button"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50">
                {[
                  { key: "basic", label: "Basic Info", icon: "📋" },
                  { key: "contact", label: "Contact", icon: "📞" },
                  { key: "address", label: "Address", icon: "📍" },
                  { key: "settings", label: "Settings", icon: "⚙️" }
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    type="button"
                    onClick={() => setCreateClinicActiveTab(tab.key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
                      createClinicActiveTab === tab.key
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105"
                        : "bg-white text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-600 border-2 border-slate-200"
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Modal Content - Fixed Height */}
              <div className="h-[calc(90vh-180px)] overflow-y-auto p-4">
                <form id="create-clinic-form">
                {createClinicActiveTab === "basic" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>📋</span> Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Name *</label>
                        <input
                          type="text"
                          value={createClinicForm.clinicName}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, clinicName: e.target.value })}
                          placeholder="Enter clinic name"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Code *</label>
                        <input
                          type="text"
                          value={createClinicForm.clinicCode}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, clinicCode: e.target.value })}
                          placeholder="e.g., CLINIC-001"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Enterprise *</label>
                        <select
                          value={createClinicForm.enterpriseId}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, enterpriseId: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors text-sm"
                        >
                          <option value="0">-- Select an Enterprise --</option>
                          {allEnterprises.map((enterprise) => (
                            <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                              [{enterprise.enterpriseId}] {enterprise.enterpriseName}
                            </option>
                          ))}
                        </select>
                        {createClinicForm.enterpriseId === 0 && (
                          <p className="text-xs text-red-600 font-semibold mt-1">
                            ⚠️ Enterprise selection is required
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {createClinicActiveTab === "contact" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>📞</span> Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                        <input
                          type="email"
                          value={createClinicForm.contactEmail}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, contactEmail: e.target.value })}
                          placeholder="clinic@example.com"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={createClinicForm.contactPhone}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, contactPhone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {createClinicActiveTab === "address" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>📍</span> Address Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 1 *</label>
                        <input
                          type="text"
                          value={createClinicForm.addressLine1}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, addressLine1: e.target.value })}
                          placeholder="Street address"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 2</label>
                        <input
                          type="text"
                          value={createClinicForm.addressLine2}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, addressLine2: e.target.value })}
                          placeholder="Apartment, suite, etc. (optional)"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={createClinicForm.city}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, city: e.target.value })}
                          placeholder="City"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">State/Province *</label>
                        <input
                          type="text"
                          value={createClinicForm.state}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, state: e.target.value })}
                          placeholder="State"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={createClinicForm.country}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, country: e.target.value })}
                          placeholder="Country"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Postal Code</label>
                        <input
                          type="text"
                          value={createClinicForm.postalCode}
                          onChange={(e) => setCreateClinicForm({ ...createClinicForm, postalCode: e.target.value })}
                          placeholder="Postal Code"
                          className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {createClinicActiveTab === "settings" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>⚙️</span> Operating Hours & Settings
                    </h3>
                    
                    {/* Working Hours Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4">
                      <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>🕐</span> Operating Hours
                      </h4>
                      
                      <div className="space-y-3">
                        {Object.keys(clinicWorkingHours).map((day) => (
                          <div key={day} className="bg-white rounded-lg p-3 border-2 border-slate-200 hover:border-purple-300 transition">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`day-${day}`}
                                checked={clinicWorkingHours[day].isOpen}
                                onChange={(e) => {
                                  setClinicWorkingHours({
                                    ...clinicWorkingHours,
                                    [day]: { ...clinicWorkingHours[day], isOpen: e.target.checked }
                                  });
                                }}
                                className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                              />
                              <label htmlFor={`day-${day}`} className="flex-1 font-semibold text-slate-700 cursor-pointer min-w-24">
                                {day}
                              </label>
                              
                              {clinicWorkingHours[day].isOpen ? (
                                <div className="flex items-center gap-2 ml-auto">
                                  <input
                                    type="time"
                                    value={clinicWorkingHours[day].startTime}
                                    onChange={(e) => {
                                      setClinicWorkingHours({
                                        ...clinicWorkingHours,
                                        [day]: { ...clinicWorkingHours[day], startTime: e.target.value }
                                      });
                                    }}
                                    className="px-2 py-1 border-2 border-slate-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                  <span className="text-slate-600 font-bold">→</span>
                                  <input
                                    type="time"
                                    value={clinicWorkingHours[day].endTime}
                                    onChange={(e) => {
                                      setClinicWorkingHours({
                                        ...clinicWorkingHours,
                                        [day]: { ...clinicWorkingHours[day], endTime: e.target.value }
                                      });
                                    }}
                                    className="px-2 py-1 border-2 border-slate-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                              ) : (
                                <span className="text-red-500 font-semibold ml-auto">Closed</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinic Status */}
                    <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={createClinicForm.isActive}
                        onChange={(e) => setCreateClinicForm({ ...createClinicForm, isActive: e.target.checked })}
                        className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                      />
                      <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                        ✅ Clinic is Active
                      </label>
                    </div>

                    {/* Info Box */}
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                      <p className="text-sm text-green-900">
                        <span className="font-bold">✨ Tip:</span> Check the days your clinic operates and set opening/closing times. Unchecked days will show as closed.
                      </p>
                    </div>
                  </motion.div>
                )}
                </form>
              </div>

              {/* Modal Footer with Tab Navigation */}
              <div className="bg-slate-100 p-3 border-t-2 border-slate-200 flex justify-between items-center gap-3">
                {/* Previous/Next Tab Buttons */}
                <div className="flex gap-2">
                  {createClinicActiveTab !== "basic" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const tabs = ["basic", "contact", "address", "settings"];
                        const currentIndex = tabs.indexOf(createClinicActiveTab);
                        if (currentIndex > 0) setCreateClinicActiveTab(tabs[currentIndex - 1]);
                      }}
                      className="px-4 py-2 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition border-2 border-slate-300"
                    >
                      ← Previous
                    </motion.button>
                  )}
                  {createClinicActiveTab !== "settings" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        if (!isTabFieldsValid(createClinicActiveTab)) {
                          alert(`❌ Please fill all mandatory fields in ${createClinicActiveTab.charAt(0).toUpperCase() + createClinicActiveTab.slice(1)} tab before proceeding.`);
                          return;
                        }
                        const tabs = ["basic", "contact", "address", "settings"];
                        const currentIndex = tabs.indexOf(createClinicActiveTab);
                        if (currentIndex < tabs.length - 1) setCreateClinicActiveTab(tabs[currentIndex + 1]);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition"
                    >
                      Next →
                    </motion.button>
                  )}
                </div>

                {/* Create Clinic Button (only show on last tab when valid) */}
                <div className="flex gap-2">
                  {createClinicActiveTab === "settings" && (
                    <motion.button
                      whileHover={{ scale: isCreateClinicFormValid() ? 1.02 : 1 }}
                      whileTap={{ scale: isCreateClinicFormValid() ? 0.98 : 1 }}
                      type="submit"
                      form="create-clinic-form"
                      disabled={!isCreateClinicFormValid()}
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          setCreatingClinic(true);
                          
                          // Check if enterprise is selected
                          if (createClinicForm.enterpriseId === 0 || createClinicForm.enterpriseId === "0") {
                            alert("⚠️ ENTERPRISE REQUIRED!\n\nPlease select an enterprise from the dropdown to continue. This is a mandatory field.");
                            setCreatingClinic(false);
                            return;
                          }
                          
                          // Validate required fields
                          if (!createClinicForm.clinicName || !createClinicForm.clinicCode || 
                              !createClinicForm.contactEmail || !createClinicForm.contactPhone || !createClinicForm.addressLine1 ||
                              !createClinicForm.city || !createClinicForm.state) {
                            alert("❌ Please fill in all required fields");
                            setCreatingClinic(false);
                            return;
                          }
                          
                          // Convert working hours to string format
                          const workingHoursString = Object.keys(clinicWorkingHours)
                            .map((day) => {
                              const hours = clinicWorkingHours[day];
                              if (hours.isOpen) {
                                return `${day}: ${hours.startTime}-${hours.endTime}`;
                              } else {
                                return `${day}: Closed`;
                              }
                            })
                            .join(", ");
                          
                          // Build ClinicModel matching backend structure
                          const clinicModel = {
                            clinicId: 0,
                            enterpriseId: createClinicForm.enterpriseId,
                            clinicName: createClinicForm.clinicName,
                            clinicCode: createClinicForm.clinicCode,
                            contactEmail: createClinicForm.contactEmail,
                            contactPhone: createClinicForm.contactPhone,
                            addressLine1: createClinicForm.addressLine1,
                            addressLine2: createClinicForm.addressLine2,
                            city: createClinicForm.city,
                            state: createClinicForm.state,
                            country: createClinicForm.country || "",
                            postalCode: createClinicForm.postalCode,
                            openingHours: workingHoursString,
                            isActive: createClinicForm.isActive,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            createdBy: 0,
                            updatedBy: 0
                          };
                          
                          console.log("📋 Creating clinic with enterpriseId:", clinicModel.enterpriseId);
                          console.log("📋 Working Hours:", workingHoursString);
                          console.log("📋 Full clinic model:", clinicModel);
                          
                          // Call API to create clinic
                          console.log("🔗 API Endpoint: https://localhost:7104/api/Clinic/CreateClinicInfo");
                          console.log("📤 Sending clinicModel:", JSON.stringify(clinicModel, null, 2));
                          
                          const response = await fetch("https://localhost:7104/api/Clinic/CreateClinicInfo", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                            },
                            body: JSON.stringify(clinicModel)
                          });
                          
                          console.log("📥 API Response Status:", response.status);
                          console.log("📥 API Response Headers:", {
                            'content-type': response.headers.get('content-type'),
                            'content-length': response.headers.get('content-length')
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.text();
                            console.error("❌ API Error Response (Status " + response.status + "):", errorData);
                            console.error("❌ Response Headers:", response.headers);
                            throw new Error(`API Error: ${response.status} - ${errorData || 'No response body'}`);
                          }
                          
                          const responseData = await response.json();
                          console.log("✅ Clinic created successfully:", responseData);
                          
                          // Show success modal
                          setClinicSuccessMessage("Clinic Created! 🎉 Welcome to the clinic family! 🏥");
                          setShowClinicSuccessModal(true);
                          setShowCreateClinicModal(false);
                          setCreateClinicActiveTab("basic");
                          
                          // Reset form
                          setCreateClinicForm({
                            clinicId: 0,
                            enterpriseId: 0,
                            clinicName: "",
                            clinicCode: "",
                            contactEmail: "",
                            contactPhone: "",
                            addressLine1: "",
                            addressLine2: "",
                            city: "",
                            state: "",
                            country: "",
                            postalCode: "",
                            openingHours: "",
                            isActive: true,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            createdBy: 0,
                            updatedBy: 0
                          });
                        } catch (error) {
                          console.error("❌ Error creating clinic:", error.message);
                          console.error("❌ Full error:", error);
                          alert("❌ Failed to create clinic.\n\nError: " + error.message);
                        } finally {
                          setCreatingClinic(false);
                        }
                      }}
                      className={`px-8 py-3 rounded-lg font-bold shadow-lg transition ${
                        isCreateClinicFormValid()
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                      }`}
                    >
                      {creatingClinic ? "Creating..." : "💾 Create Clinic"}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Enterprise Modal */}
      <AnimatePresence>
        {showCreateEnterpriseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateEnterpriseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🏢 Create New Enterprise</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreateEnterpriseModal(false)}
                    type="button"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50">
                {[
                  { key: "basic", label: "Basic Info", icon: "📋" },
                  { key: "contact", label: "Contact", icon: "📞" },
                  { key: "address", label: "Address", icon: "📍" }
                ].map((tab) => (
                  <motion.button
                    key={tab.key}
                    type="button"
                    onClick={() => setCreateEnterpriseActiveTab(tab.key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
                      createEnterpriseActiveTab === tab.key
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105"
                        : "bg-white text-slate-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 hover:text-cyan-600 border-2 border-slate-200"
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Modal Content - Fixed Height */}
              <div className="h-[calc(90vh-180px)] overflow-y-auto p-4">
                <form id="create-enterprise-form">
                {createEnterpriseActiveTab === "basic" && (
                  <motion.div
                    key="basic-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <h3 className="text-lg font-bold text-cyan-900 mb-2 flex items-center gap-2">
                      <span>📋</span>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Enterprise Name *</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.enterpriseName}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, enterpriseName: e.target.value })}
                          placeholder="Enter enterprise name"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Registration Number *</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.registrationNumber}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, registrationNumber: e.target.value })}
                          placeholder="Reg. Number"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">
                          Active <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={createEnterpriseForm.isActive}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {createEnterpriseActiveTab === "contact" && (
                  <motion.div
                    key="contact-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <h3 className="text-lg font-bold text-cyan-900 mb-2 flex items-center gap-2">
                      <span>📞</span>
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Email Address *</label>
                        <input
                          type="email"
                          value={createEnterpriseForm.contactEmail}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, contactEmail: e.target.value })}
                          placeholder="contact@example.com"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Phone Number *</label>
                        <input
                          type="tel"
                          value={createEnterpriseForm.contactPhone}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, contactPhone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {createEnterpriseActiveTab === "address" && (
                  <motion.div
                    key="address-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <h3 className="text-lg font-bold text-cyan-900 mb-2 flex items-center gap-2">
                      <span>📍</span>
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Address Line 1</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.addressLine1}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, addressLine1: e.target.value })}
                          placeholder="Street address"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Address Line 2</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.addressLine2}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, addressLine2: e.target.value })}
                          placeholder="Apt, suite, unit, etc. (optional)"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">City</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.city}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, city: e.target.value })}
                          placeholder="City"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">State</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.state}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, state: e.target.value })}
                          placeholder="State/Province"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Postal Code</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.postalCode}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, postalCode: e.target.value })}
                          placeholder="12345"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Country</label>
                        <input
                          type="text"
                          value={createEnterpriseForm.country}
                          onChange={(e) => setCreateEnterpriseForm({ ...createEnterpriseForm, country: e.target.value })}
                          placeholder="Country"
                          className="w-full px-3 py-1.5 text-sm border rounded-lg border-stone-300 focus:ring-1 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                </form>
              </div>

              {/* Modal Footer with Tab Navigation */}
              <div className="bg-slate-100 p-3 border-t-2 border-slate-200 flex justify-between items-center gap-3">
                {/* Previous Tab Button */}
                <div>
                  {createEnterpriseActiveTab !== "basic" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const tabs = ["basic", "contact", "address"];
                        const currentIndex = tabs.indexOf(createEnterpriseActiveTab);
                        if (currentIndex > 0) setCreateEnterpriseActiveTab(tabs[currentIndex - 1]);
                      }}
                      className="px-4 py-2 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition border-2 border-slate-300"
                    >
                      ← Previous
                    </motion.button>
                  )}
                </div>

                {/* Next Tab Button and Submit Button */}
                <div className="flex gap-2">
                  {createEnterpriseActiveTab !== "address" && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const tabs = ["basic", "contact", "address"];
                        const currentIndex = tabs.indexOf(createEnterpriseActiveTab);
                        if (currentIndex < tabs.length - 1) setCreateEnterpriseActiveTab(tabs[currentIndex + 1]);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition shadow-lg"
                    >
                      Next →
                    </motion.button>
                  )}
                  {createEnterpriseActiveTab === "address" && (
                    <motion.button
                      whileHover={{ scale: isCreateEnterpriseFormValid() ? 1.02 : 1 }}
                      whileTap={{ scale: isCreateEnterpriseFormValid() ? 0.98 : 1 }}
                      type="submit"
                      form="create-enterprise-form"
                      disabled={creatingEnterprise || !isCreateEnterpriseFormValid()}
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          setCreatingEnterprise(true);
                          
                          if (!isCreateEnterpriseFormValid()) {
                            alert("❌ Please fill in all required fields");
                            return;
                          }
                          
                          // Call API to create enterprise
                          const enterpriseModel = {
                            enterpriseId: 0,
                            enterpriseName: createEnterpriseForm.enterpriseName,
                            registrationNumber: createEnterpriseForm.registrationNumber,
                            contactEmail: createEnterpriseForm.contactEmail,
                            contactPhone: createEnterpriseForm.contactPhone,
                            addressLine1: createEnterpriseForm.addressLine1,
                            addressLine2: createEnterpriseForm.addressLine2,
                            city: createEnterpriseForm.city,
                            state: createEnterpriseForm.state,
                            country: createEnterpriseForm.country,
                            postalCode: createEnterpriseForm.postalCode,
                            isActive: createEnterpriseForm.isActive,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            createdBy: 0,
                            updatedBy: 0
                          };
                          
                          console.log("📤 Sending Enterprise Model:", enterpriseModel);
                          
                          const response = await fetch("https://localhost:7104/api/Enterprise/CreateEnterprise", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                            },
                            body: JSON.stringify(enterpriseModel)
                          });
                          
                          console.log("📥 API Response Status:", response.status);
                          
                          if (!response.ok) {
                            const errorData = await response.text();
                            console.error("❌ API Error Response:", errorData);
                            throw new Error(`API error: ${response.statusText}`);
                          }
                          
                          setEnterpriseSuccessMessage("Enterprise Created! 🎉 Time to conquer the business world! 💼");
                          setShowEnterpriseSuccessModal(true);
                          setShowCreateEnterpriseModal(false);
                          setCreateEnterpriseActiveTab("basic");
                          setCreateEnterpriseForm({
                            enterpriseName: "",
                            registrationNumber: "",
                            contactEmail: "",
                            contactPhone: "",
                            addressLine1: "",
                            addressLine2: "",
                            city: "",
                            state: "",
                            country: "",
                            postalCode: "",
                            isActive: true
                          });
                        } catch (error) {
                          console.error("Error creating enterprise:", error);
                          alert("❌ Failed to create enterprise. Please try again.");
                        } finally {
                          setCreatingEnterprise(false);
                        }
                      }}
                      className={`px-8 py-2 rounded-lg font-bold shadow-lg transition ${
                        isCreateEnterpriseFormValid()
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white cursor-pointer"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                      }`}
                    >
                      {creatingEnterprise ? "Creating..." : "💾 Create Enterprise"}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowCreateEnterpriseModal(false);
                      setCreateEnterpriseActiveTab("basic");
                      setCreateEnterpriseForm({
                        enterpriseName: "",
                        registrationNumber: "",
                        contactEmail: "",
                        contactPhone: "",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        country: "",
                        postalCode: "",
                        isActive: true
                      });
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Enterprise Modal */}
      <AnimatePresence>
        {showManageEnterpriseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowManageEnterpriseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">⚙️ Manage Enterprise</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowManageEnterpriseModal(false)}
                    type="button"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {!manageEnterpriseData ? (
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span>🔍</span> Search Enterprise
                    </h3>
                    
                    {/* Search Section */}
                    <div className="flex gap-2 mb-4">
                      <input
                        type="number"
                        value={manageEnterpriseSearchId}
                        onChange={(e) => setManageEnterpriseSearchId(e.target.value)}
                        placeholder="Enter Enterprise ID"
                        className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={searchEnterprise}
                        disabled={manageEnterpriseLoading}
                        className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition shadow-lg disabled:opacity-60"
                      >
                        {manageEnterpriseLoading ? "🔍 Searching..." : "🔍 Search"}
                      </motion.button>
                    </div>

                    {/* Error Message */}
                    {manageEnterpriseError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded mb-4"
                      >
                        {manageEnterpriseError}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>📋</span> Enterprise Details
                      </h3>
                      {!manageEnterpriseEditMode && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setManageEnterpriseEditMode(true)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition"
                        >
                          ✏️ Edit
                        </motion.button>
                      )}
                    </div>

                    {/* Enterprise Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Read-Only Fields */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Enterprise ID</label>
                        <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-700 font-medium">
                          {manageEnterpriseForm?.enterpriseId}
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Enterprise Name</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.enterpriseName || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, enterpriseName: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.enterpriseName}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Registration Number</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.registrationNumber || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, registrationNumber: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.registrationNumber}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="email"
                            value={manageEnterpriseForm?.contactEmail || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, contactEmail: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.contactEmail}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="tel"
                            value={manageEnterpriseForm?.contactPhone || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, contactPhone: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.contactPhone}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Active Status</label>
                        {manageEnterpriseEditMode ? (
                          <select
                            value={manageEnterpriseForm?.isActive ? 'true' : 'false'}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, isActive: e.target.value === 'true' })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.isActive ? "✅ Active" : "❌ Inactive"}
                          </div>
                        )}
                      </div>

                      {/* Address Fields */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Address Line 1</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.addressLine1 || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, addressLine1: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.addressLine1}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Address Line 2</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.addressLine2 || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, addressLine2: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.addressLine2 || "N/A"}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.city || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, city: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.city}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.state || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, state: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.state}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.country || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, country: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.country}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Postal Code</label>
                        {manageEnterpriseEditMode ? (
                          <input
                            type="text"
                            value={manageEnterpriseForm?.postalCode || ""}
                            onChange={(e) => setManageEnterpriseForm({ ...manageEnterpriseForm, postalCode: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-slate-700">
                            {manageEnterpriseData?.postalCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 p-3 border-t-2 border-slate-200 flex justify-between items-center gap-3">
                {manageEnterpriseEditMode && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setManageEnterpriseEditMode(false);
                      if (manageEnterpriseData) {
                        setManageEnterpriseForm({
                          enterpriseId: manageEnterpriseData.enterpriseId,
                          enterpriseName: manageEnterpriseData.enterpriseName,
                          registrationNumber: manageEnterpriseData.registrationNumber,
                          contactEmail: manageEnterpriseData.contactEmail,
                          contactPhone: manageEnterpriseData.contactPhone,
                          addressLine1: manageEnterpriseData.addressLine1,
                          addressLine2: manageEnterpriseData.addressLine2,
                          city: manageEnterpriseData.city,
                          state: manageEnterpriseData.state,
                          country: manageEnterpriseData.country,
                          postalCode: manageEnterpriseData.postalCode,
                          isActive: manageEnterpriseData.isActive
                        });
                      }
                    }}
                    className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </motion.button>
                )}

                <div className="flex-1" />

                {manageEnterpriseEditMode ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={updateEnterprise}
                    disabled={updatingEnterprise}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition shadow-lg disabled:opacity-60"
                  >
                    {updatingEnterprise ? "Updating..." : "💾 Update"}
                  </motion.button>
                ) : manageEnterpriseData ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setManageEnterpriseData(null);
                      setManageEnterpriseForm(null);
                      setManageEnterpriseSearchId("");
                      setManageEnterpriseEditMode(false);
                    }}
                    className="px-6 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-semibold transition"
                  >
                    New Search
                  </motion.button>
                ) : null}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowManageEnterpriseModal(false);
                    setManageEnterpriseSearchId("");
                    setManageEnterpriseData(null);
                    setManageEnterpriseForm(null);
                    setManageEnterpriseEditMode(false);
                    setManageEnterpriseError("");
                  }}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enterprise Success Modal */}
      <AnimatePresence>
        {showEnterpriseSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEnterpriseSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Success Content */}
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  className="text-8xl mb-6"
                >
                  🎉
                </motion.div>
                
                <h2 className="text-3xl font-bold mb-2">Success!</h2>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <p className="text-lg font-semibold text-white mb-2">
                    {enterpriseSuccessMessage}
                  </p>
                  <div className="flex justify-center gap-2 text-3xl mt-4">
                    <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>🚀</motion.span>
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>💼</motion.span>
                    <motion.span animate={{ rotate: [0, -20, 20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>⭐</motion.span>
                  </div>
                </motion.div>
              </div>

              {/* Button Section */}
              <div className="p-6 bg-white">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowEnterpriseSuccessModal(false);
                    navigate("/patients");
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
                >
                  Let's Check the Patients! 👥
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clinic Success Modal */}
      <AnimatePresence>
        {showClinicSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClinicSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Success Content */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  className="text-8xl mb-6"
                >
                  🏥
                </motion.div>
                
                <h2 className="text-3xl font-bold mb-2">Clinic Created!</h2>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <p className="text-lg font-semibold text-white mb-2">
                    {clinicSuccessMessage}
                  </p>
                  <div className="flex justify-center gap-2 text-3xl mt-4">
                    <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>💊</motion.span>
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>⚕️</motion.span>
                    <motion.span animate={{ rotate: [0, -20, 20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}>✨</motion.span>
                  </div>
                </motion.div>
              </div>

              {/* Button Section */}
              <div className="p-6 bg-white">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowClinicSuccessModal(false);
                    navigate("/patients");
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
                >
                  Let's Check the Patients! 👥
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Clinics Modal */}
      <AnimatePresence>
        {showListClinicsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowListClinicsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <span>🏥</span> All Clinics
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowListClinicsModal(false)}
                    type="button"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Filter Section */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b-2 border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">🔍 Search Clinics by Enterprise</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* Enterprise Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Enterprise *</label>
                    <select
                      value={listClinicsFilters.enterpriseId || 0}
                      onChange={(e) => {
                        setListClinicsFilters({
                          ...listClinicsFilters, 
                          enterpriseId: parseInt(e.target.value)
                        });
                        setDoctorClinics([]); // Reset clinic list when enterprise changes
                        setListClinicsSearchResults([]);
                      }}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="0">-- Select an Enterprise --</option>
                      {allEnterprises.map((enterprise) => (
                        <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                          [{enterprise.enterpriseId}] {enterprise.enterpriseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clinic Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Select Clinic *</label>
                    <select
                      value={listClinicsFilters.clinicId || 0}
                      onChange={(e) => setListClinicsFilters({...listClinicsFilters, clinicId: parseInt(e.target.value)})}
                      disabled={listClinicsFilters.enterpriseId === 0}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        listClinicsFilters.enterpriseId === 0
                          ? "border-slate-300 bg-slate-100 cursor-not-allowed opacity-60"
                          : "border-slate-300"
                      }`}
                    >
                      <option value="0">-- Select a Clinic --</option>
                      {loadingDoctorClinics ? (
                        <option disabled>Loading clinics...</option>
                      ) : (
                        doctorClinics.map((clinic) => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            [{clinic.clinicId}] {clinic.clinicName} - {clinic.addressLine1}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Search Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (listClinicsFilters.clinicId === 0) {
                        alert("⚠️ Please select a clinic to search");
                        return;
                      }

                      try {
                        setListClinicsLoading(true);
                        const response = await fetch(`https://localhost:7104/api/Clinic/GetClinicByID?id=${listClinicsFilters.clinicId}`, {
                          method: "GET",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                          }
                        });

                        if (response.ok) {
                          const data = await response.json();
                          console.log("🏥 Clinic search result:", data);
                          // If the API returns an array, use it; if single object, wrap in array
                          setListClinicsSearchResults(Array.isArray(data) ? data : [data]);
                          setListClinicsError("");
                        } else {
                          setListClinicsError("Failed to fetch clinic details");
                          setListClinicsSearchResults([]);
                        }
                      } catch (error) {
                        console.error("Error searching clinic:", error);
                        setListClinicsError(error.message);
                        setListClinicsSearchResults([]);
                      } finally {
                        setListClinicsLoading(false);
                      }
                    }}
                    disabled={listClinicsFilters.clinicId === 0}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      listClinicsFilters.clinicId === 0
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    }`}
                  >
                    🔍 Search
                  </motion.button>
                </div>
              </div>

              {/* Clinics List */}
              <div className="h-[calc(85vh-300px)] overflow-y-auto p-6">
                {listClinicsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-6xl"
                    >
                      ⏳
                    </motion.div>
                  </div>
                ) : listClinicsSearchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listClinicsSearchResults.map((clinic, index) => (
                      <motion.div
                        key={clinic.clinicId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedClinicView(clinic);
                          setShowClinicDetailsModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-bold text-slate-800 flex-1">{clinic.clinicName}</h4>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">ID: {clinic.clinicId}</span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-700">
                          <p><strong>Code:</strong> {clinic.clinicCode}</p>
                          <p><strong>📧:</strong> {clinic.contactEmail}</p>
                          <p><strong>📞:</strong> {clinic.contactPhone}</p>
                          <p><strong>📍:</strong> {clinic.addressLine1}, {clinic.city}</p>
                          <p><strong>Status:</strong> <span className={clinic.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{clinic.isActive ? "✅ Active" : "❌ Inactive"}</span></p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClinicView(clinic);
                            setShowClinicDetailsModal(true);
                          }}
                          className="w-full mt-4 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold text-sm transition"
                        >
                          👁️ View Details
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-3xl mb-3">🔎</p>
                    <p className="text-slate-600 text-center">No clinics found. Try adjusting your search filters or add a new clinic.</p>
                  </div>
                )}
              </div>

              {/* Footer with Actions */}
              <div className="bg-slate-100 p-4 border-t-2 border-slate-200 flex justify-end items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setListClinicsFilters({
                      enterpriseId: 0,
                      clinicId: 0
                    });
                    setListClinicsSearchResults([]);
                    setDoctorClinics([]);
                  }}
                  className="px-4 py-2 bg-slate-400 text-white rounded-lg font-semibold hover:bg-slate-500 transition"
                >
                  🔄 Reset
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowListClinicsModal(false)}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clinic Details Modal */}
      <AnimatePresence>
        {showClinicDetailsModal && selectedClinicView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClinicDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white sticky top-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">{selectedClinicView.clinicName}</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowClinicDetailsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-3">📋 Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Clinic ID</p>
                      <p className="text-slate-800">{selectedClinicView.clinicId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Clinic Code</p>
                      <p className="text-slate-800">{selectedClinicView.clinicCode}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Enterprise ID</p>
                      <p className="text-slate-800">{selectedClinicView.enterpriseId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Status</p>
                      <p className={selectedClinicView.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {selectedClinicView.isActive ? "✅ Active" : "❌ Inactive"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-3">📞 Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Email</p>
                      <p className="text-slate-800">{selectedClinicView.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Phone</p>
                      <p className="text-slate-800">{selectedClinicView.contactPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-3">📍 Address</h4>
                  <div className="space-y-2 text-slate-800">
                    <p>{selectedClinicView.addressLine1}</p>
                    {selectedClinicView.addressLine2 && <p>{selectedClinicView.addressLine2}</p>}
                    <p>{selectedClinicView.city}, {selectedClinicView.state} {selectedClinicView.postalCode}</p>
                    <p>{selectedClinicView.country}</p>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-3">🕐 Operating Hours</h4>
                  <p className="text-slate-800">{selectedClinicView.openingHours || "Not specified"}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 p-4 border-t-2 border-slate-200 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowClinicDetailsModal(false)}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
