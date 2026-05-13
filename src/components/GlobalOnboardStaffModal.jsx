import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createStaffDetail } from '../services/staffService';
import { getSelectedAccess, getAuthToken } from '../services/authService';
import { listRoles } from '../services/roleService';
import { useModal } from '../context/ModalContext';
import '../styles/fieldAnimations.css';

const API_BASE_URL = (import.meta).env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

const GlobalOnboardStaffModal = () => {
  const { showOnboardStaffModal, closeOnboardStaffModal } = useModal();
  const [activeTab, setActiveTab] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({}); // Track per-field errors
  const [emailError, setEmailError] = useState("");
  const [onboardedRoleName, setOnboardedRoleName] = useState("");
  const [isReceptionistMode, setIsReceptionistMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [onboardingClinics, setOnboardingClinics] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [availableRolesFromApi, setAvailableRolesFromApi] = useState([]);

  const tabOrder = ["personal", "contact", "professional", "employment", "compliance", "profile"];
  const countryCodeOptions = ["+91", "+1", "+44", "+61", "+65", "+971"];

  const [doctorFormData, setDoctorFormData] = useState({
    staffId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phoneCountryCode: "+91",
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
    emergencyCountryCode: "+91",
    emergencyContact: "",
    bio: "",
    profilePhotoUrl: "",
    achievements: "",
    publications: "",
    socialLinks: "",
    clinicId: 0,
    roleId: "",
    role: "",
    rolesAssigned: ""
  });

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isValidEmailWithDomain = (email) => {
    if (!email) return false;
    const normalized = email.trim();
    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicPattern.test(normalized)) return false;

    const [localPart, domainPartRaw] = normalized.split("@");
    if (!localPart || !domainPartRaw) return false;
    if (localPart.length > 64 || domainPartRaw.length > 253) return false;
    if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) return false;

    const domainPart = domainPartRaw.toLowerCase();
    if (domainPart === "localhost" || domainPart.includes("..")) return false;

    const labels = domainPart.split(".");
    if (labels.length < 2) return false;

    const hasInvalidLabel = labels.some(label => {
      if (!label || label.length > 63) return true;
      if (!/^[a-z0-9-]+$/i.test(label)) return true;
      if (label.startsWith("-") || label.endsWith("-")) return true;
      return false;
    });
    if (hasInvalidLabel) return false;

    const tld = labels[labels.length - 1];
    if (!/^[a-z]{2,24}$/i.test(tld)) return false;

    return true;
  };
  const hasValidFourDigitYear = (dateValue) => {
    if (!dateValue) return true;
    const yearPart = (dateValue.split("-")[0] || "").trim();
    return /^\d{4}$/.test(yearPart);
  };

  // Validate individual field and return error message
  const validateField = (fieldName, fieldValue) => {
    let error = "";

    switch (fieldName) {
      case "clinicId":
        if (!fieldValue) error = "Clinic is mandatory";
        break;
      case "firstName":
        if (!fieldValue?.trim()) error = "First name is required";
        break;
      case "lastName":
        if (!fieldValue?.trim()) error = "Last name is required";
        break;
      case "dateOfBirth":
        if (!fieldValue) error = "Date of birth is mandatory";
        else if (fieldValue > todayISO) error = "Date of birth cannot be in the future";
        break;
      case "gender":
        if (!fieldValue) error = "Gender selection is required";
        break;
      case "roleId":
        if (!fieldValue || fieldValue === "") error = "Role assignment is mandatory";
        break;
      case "email":
        if (!fieldValue?.trim()) error = "Email address is required";
        else if (!isValidEmailWithDomain(fieldValue)) error = "Valid email with proper domain is required";
        break;
      case "phone":
        if (!fieldValue) error = "Phone number is required";
        else if (fieldValue.length !== 10) error = "Phone number must be 10 digits";
        break;
      case "address":
        if (!fieldValue?.trim()) error = "Address is mandatory";
        break;
      case "emergencyContact":
        if (!fieldValue) error = "Emergency contact is required";
        else if (fieldValue.length !== 10) error = "Emergency contact must be 10 digits";
        break;
      case "licenseNumber":
        if (!fieldValue?.trim()) error = "License number is required for clinical roles";
        break;
      case "licenseExpiry":
        if (!fieldValue) error = "License expiry date is required";
        else if (!hasValidFourDigitYear(fieldValue)) error = "License expiry must have valid year";
        break;
      case "specialtyId":
        if (!fieldValue) error = "Specialty is required for clinical roles";
        break;
      case "yearsExperience":
        if (!fieldValue || fieldValue === "") error = "Years of experience is mandatory";
        break;
      case "education":
        if (!fieldValue?.trim()) error = "Education information is required";
        break;
      case "joiningDate":
        if (!fieldValue) error = "Joining date is mandatory";
        else if (!hasValidFourDigitYear(fieldValue)) error = "Joining date must have valid year";
        break;
      case "employmentStatus":
        if (!fieldValue?.trim()) error = "Employment status is required";
        break;
      default:
        break;
    }

    return error;
  };

  // Load initial data when modal opens
  useEffect(() => {
    if (showOnboardStaffModal) {
      loadInitialData();
    }
  }, [showOnboardStaffModal]);

  const loadInitialData = async () => {
    try {
      const access = getSelectedAccess();
      
      // Load clinics based on enterprise from login access
      if (access?.enterpriseId) {
        await loadClinics(access.enterpriseId);
      }

      // Load roles
      await loadRoles();
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadClinics = async (enterpriseId) => {
    try {
      const selectedAccess = getSelectedAccess();
      const response = await fetch(
        `${API_BASE_URL}/Clinic/GetClinicByID?id=${enterpriseId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
            "X-Enterprise-Id": enterpriseId.toString(),
            ...(selectedAccess?.clinicId && { "X-Clinic-Id": selectedAccess.clinicId.toString() })
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setOnboardingClinics(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to load clinics:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading clinics:", error);
    }
  };

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const roles = await listRoles();
      setAvailableRolesFromApi(Array.isArray(roles) ? roles : roles?.data || []);
    } catch (error) {
      console.error("Error loading roles:", error);
      setAvailableRolesFromApi([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setDoctorFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (value && !isValidEmailWithDomain(value)) {
        setEmailError("Please enter a valid email with a valid domain");
        setFieldErrors(prev => ({ ...prev, [name]: "Valid email with proper domain is required" }));
      } else {
        setEmailError("");
        setFieldErrors(prev => ({ ...prev, [name]: "" }));
      }
      return;
    }

    // Phone and emergency contact: digits only, max 10
    if (name === "phone" || name === "emergencyContact") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setDoctorFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
      // Validate the field
      const error = validateField(name, digitsOnly);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    // Date fields
    if (name === "dateOfBirth" || name === "licenseExpiry" || name === "joiningDate") {
      if ((name === "licenseExpiry" || name === "joiningDate") && value) {
        const [yearPart, monthPart, dayPart] = value.split("-");
        const normalizedYear = (yearPart || "").replace(/\D/g, "").slice(0, 4);
        const normalizedValue = [normalizedYear, monthPart, dayPart].filter(Boolean).join("-");
        setDoctorFormData(prev => ({
          ...prev,
          [name]: normalizedValue
        }));
        // Validate the field
        const error = validateField(name, normalizedValue);
        setFieldErrors(prev => ({ ...prev, [name]: error }));
        return;
      }

      setDoctorFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Validate the field
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
      return;
    }

    // Other inputs
    setDoctorFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate the field
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateTab = (tab) => {
    const errors = [];

    if (tab === "personal") {
      if (!doctorFormData.clinicId) errors.push("clinicId");
      if (!doctorFormData.firstName?.trim()) errors.push("firstName");
      if (!doctorFormData.lastName?.trim()) errors.push("lastName");
      if (!doctorFormData.dateOfBirth) errors.push("dateOfBirth");
      if (doctorFormData.dateOfBirth && doctorFormData.dateOfBirth > todayISO) errors.push("dateOfBirth");
      if (!doctorFormData.gender) errors.push("gender");
      if (!doctorFormData.roleId || doctorFormData.roleId === "") errors.push("roleId");
    } else if (tab === "contact") {
      console.log("Validating contact tab, address value:", doctorFormData.address);
      console.log("Address trimmed:", doctorFormData.address?.trim());
      console.log("Address is empty:", !doctorFormData.address?.trim());
      
      if (!doctorFormData.email?.trim()) errors.push("email");
      if (doctorFormData.email && !isValidEmailWithDomain(doctorFormData.email)) errors.push("email");
      if (!doctorFormData.phone) errors.push("phone");
      if (doctorFormData.phone && doctorFormData.phone.length !== 10) errors.push("phone");
      if (!doctorFormData.address?.trim()) {
        console.log("Address validation failed - pushing error");
        errors.push("address");
      }
      if (!doctorFormData.emergencyContact) errors.push("emergencyContact");
      if (doctorFormData.emergencyContact && doctorFormData.emergencyContact.length !== 10) errors.push("emergencyContact");
    } else if (tab === "professional") {
      const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(doctorFormData.roleId));
      const roleName = selectedRole?.roleName?.toLowerCase() || "";
      const requiresAcademic = roleName.includes("doctor") || roleName.includes("nurse");
      const isAdmin = roleName.includes("admin");
      
      // Validate years of experience and education for all roles
      if (!doctorFormData.yearsExperience) errors.push("yearsExperience");
      if (!doctorFormData.education?.trim()) errors.push("education");
      
      // Validate license and specialty only for clinical roles
      if (!isReceptionistMode && requiresAcademic && !isAdmin) {
        if (!doctorFormData.licenseNumber?.trim()) errors.push("licenseNumber");
        if (!doctorFormData.licenseExpiry) errors.push("licenseExpiry");
        if (doctorFormData.licenseExpiry && !hasValidFourDigitYear(doctorFormData.licenseExpiry)) errors.push("licenseExpiry");
        if (!doctorFormData.specialtyId) errors.push("specialtyId");
      }
    } else if (tab === "employment") {
      if (!doctorFormData.joiningDate) errors.push("joiningDate");
      if (doctorFormData.joiningDate && !hasValidFourDigitYear(doctorFormData.joiningDate)) errors.push("joiningDate");
      if (!doctorFormData.employmentStatus) errors.push("employmentStatus");
    }

    console.log(`${tab} tab validation complete. Errors:`, errors);
    return errors;
  };

  const validateBeforeSubmit = () => {
    const missing = [];
    if (!doctorFormData.clinicId || parseInt(doctorFormData.clinicId) <= 0) missing.push("Clinic ID");
    if (!doctorFormData.firstName?.trim()) missing.push("First Name");
    if (!doctorFormData.lastName?.trim()) missing.push("Last Name");
    if (!doctorFormData.dateOfBirth) missing.push("Date of Birth");
    if (doctorFormData.dateOfBirth && doctorFormData.dateOfBirth > todayISO) missing.push("Valid Date of Birth");
    if (!doctorFormData.gender) missing.push("Gender");
    if (!doctorFormData.roleId || doctorFormData.roleId === "") missing.push("Role");
    if (!doctorFormData.email?.trim()) missing.push("Email");
    if (doctorFormData.email && !isValidEmailWithDomain(doctorFormData.email)) missing.push("Valid Email with valid domain");
    if (!doctorFormData.phone?.trim()) missing.push("Phone");
    if (doctorFormData.phone?.trim() && doctorFormData.phone.length !== 10) missing.push("Valid 10-digit Phone");
    if (!doctorFormData.emergencyContact?.trim()) missing.push("Emergency Contact");
    if (doctorFormData.emergencyContact?.trim() && doctorFormData.emergencyContact.length !== 10) missing.push("Valid 10-digit Emergency Contact");
    if (!isReceptionistMode) {
      const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(doctorFormData.roleId));
      const roleName = selectedRole?.roleName?.toLowerCase() || "";
      const requiresAcademic = roleName.includes("doctor") || roleName.includes("nurse");
      const isAdmin = roleName.includes("admin");
      if (requiresAcademic && !isAdmin) {
        const specId = parseInt(doctorFormData.specialtyId);
        if (!doctorFormData.licenseNumber?.trim()) missing.push("License Number");
        if (!doctorFormData.licenseExpiry) missing.push("License Expiry");
        if (doctorFormData.licenseExpiry && !hasValidFourDigitYear(doctorFormData.licenseExpiry)) missing.push("Valid 4-digit year in License Expiry");
        if (!specId || specId <= 0 || Number.isNaN(specId)) missing.push("Specialty ID");
      }
    }
    if (!doctorFormData.joiningDate) missing.push("Joining Date");
    if (doctorFormData.joiningDate && !hasValidFourDigitYear(doctorFormData.joiningDate)) missing.push("Valid 4-digit year in Joining Date");
    if (!doctorFormData.employmentStatus?.trim()) missing.push("Employment Status");
    if (isReceptionistMode && (!doctorFormData.roleId || doctorFormData.roleId === 0)) missing.push("Assigned Role");
    return missing;
  };

  const handleDoctorSubmit = async () => {
    console.log("🚀 Submit clicked - validating...");
    const missing = validateBeforeSubmit();
    console.log("❌ Missing fields:", missing);
    console.log("📋 Form data:", doctorFormData);
    
    if (missing.length > 0) {
      // Close preview and show errors in the main form
      setShowPreview(false);
      setValidationErrors(missing.map(field => {
        // Convert friendly names back to field names for highlighting
        const fieldMap = {
          'Clinic ID': 'clinicId',
          'First Name': 'firstName',
          'Last Name': 'lastName',
          'Date of Birth': 'dateOfBirth',
          'Valid Date of Birth': 'dateOfBirth',
          'Gender': 'gender',
          'Role': 'roleId',
          'Email': 'email',
          'Valid Email with valid domain': 'email',
          'Phone': 'phone',
          'Valid 10-digit Phone': 'phone',
          'Emergency Contact': 'emergencyContact',
          'Valid 10-digit Emergency Contact': 'emergencyContact',
          'License Number': 'licenseNumber',
          'License Expiry': 'licenseExpiry',
          'Valid 4-digit year in License Expiry': 'licenseExpiry',
          'Specialty ID': 'specialtyId',
          'Joining Date': 'joiningDate',
          'Valid 4-digit year in Joining Date': 'joiningDate',
          'Employment Status': 'employmentStatus',
          'Assigned Role': 'roleId'
        };
        return fieldMap[field] || field.toLowerCase().replace(/\s+/g, '');
      }));
      // Scroll to top to show error message
      setTimeout(() => {
        document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      console.error("Validation failed:", missing);
      return;
    }

    console.log("✅ Validation passed, creating staff...");
    setIsCreating(true);
    try {
      const access = getSelectedAccess();
      const enterpriseId = access?.enterpriseId || 0;
      
      const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(doctorFormData.roleId));
      const roleName = selectedRole?.roleName || "";
      
      console.log("📤 Creating staff with role:", roleName);
      
      // Build payload matching StaffDetailModel (PascalCase on backend, camelCase in TS)
      const staffDetailPayload = {
        enterpriseId: enterpriseId || null,
        clinicId: parseInt(doctorFormData.clinicId) || null,
        firstName: doctorFormData.firstName,
        lastName: doctorFormData.lastName,
        dateOfBirth: doctorFormData.dateOfBirth ? new Date(doctorFormData.dateOfBirth).toISOString() : null,
        gender: doctorFormData.gender || null,
        email: doctorFormData.email || null,
        phone: doctorFormData.phone ? `${doctorFormData.phoneCountryCode}${doctorFormData.phone}` : null,
        address: doctorFormData.address || null,
        licenseNumber: doctorFormData.licenseNumber || null,
        licenseExpiry: doctorFormData.licenseExpiry ? new Date(doctorFormData.licenseExpiry).toISOString() : null,
        specialtyId: doctorFormData.specialtyId ? parseInt(doctorFormData.specialtyId) : null,
        yearsExperience: doctorFormData.yearsExperience ? parseInt(doctorFormData.yearsExperience) : null,
        education: doctorFormData.education || null,
        certifications: doctorFormData.certifications || null,
        languages: doctorFormData.languages || null,
        joiningDate: doctorFormData.joiningDate ? new Date(doctorFormData.joiningDate).toISOString() : null,
        employmentStatus: doctorFormData.employmentStatus || "Active",
        availability: doctorFormData.availability || null,
        insuranceDetails: doctorFormData.insuranceDetails || null,
        emergencyContact: doctorFormData.emergencyContact ? `${doctorFormData.emergencyCountryCode}${doctorFormData.emergencyContact}` : null,
        bio: doctorFormData.bio || null,
        profilePhotoUrl: doctorFormData.profilePhotoUrl || null,
        achievements: doctorFormData.achievements || null,
        publications: doctorFormData.publications || null,
        socialLinks: doctorFormData.socialLinks || null,
        rolesAssigned: roleName // Role name as string
      };

      console.log("📤 Sending payload to CreateRoleBasedProfile:", staffDetailPayload);

      const response = await createStaffDetail(staffDetailPayload);
      console.log("✅ Staff created successfully:", response);

      setOnboardedRoleName(roleName || "Staff Member");
      setShowSuccessModal(true);

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("❌ Error creating staff:", error);
      setShowPreview(false);
      setValidationErrors([`Error: ${error.message || "Failed to create staff member"}`]);
      // Scroll to top to show error message
      setTimeout(() => {
        document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } finally {
      setIsCreating(false);
      console.log("🏁 Submit process completed");
    }
  };

  const handleTabClick = (targetTab) => {
    // Allow going back to previous tabs without validation
    const currentIndex = tabOrder.indexOf(activeTab);
    const targetIndex = tabOrder.indexOf(targetTab);
    
    if (targetIndex <= currentIndex) {
      // Allow backward navigation
      setActiveTab(targetTab);
      setValidationErrors([]);
      return;
    }
    
    // For forward navigation, validate current tab first
    console.log(`Validating ${activeTab} tab before moving to ${targetTab}`);
    const errors = validateTab(activeTab);
    console.log(`Validation errors:`, errors);
    console.log(`Current form data:`, doctorFormData);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show error message
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear errors and navigate forward
    setValidationErrors([]);
    setActiveTab(targetTab);
  };

  const handleNextTab = () => {
    console.log(`Validating ${activeTab} tab before moving to next`);
    const errors = validateTab(activeTab);
    console.log(`Validation errors:`, errors);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show error message
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  const handlePreviousTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const handleShowPreview = () => {
    const errors = validateTab(activeTab);
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show error message
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowPreview(true);
  };

  const handleClose = () => {
    resetForm();
    closeOnboardStaffModal();
  };

  const resetForm = () => {
    setDoctorFormData({
      staffId: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      phoneCountryCode: "+91",
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
      emergencyCountryCode: "+91",
      emergencyContact: "",
      bio: "",
      profilePhotoUrl: "",
      achievements: "",
      publications: "",
      socialLinks: "",
      clinicId: 0,
      roleId: "",
      role: "",
      rolesAssigned: ""
    });
    setActiveTab("personal");
    setShowPreview(false);
    setValidationErrors([]);
    setFieldErrors({});
  };

  if (!showOnboardStaffModal) return null;

  return (
    <AnimatePresence>
      {/* Main Modal */}
      {showOnboardStaffModal && !showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
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
                    Onboard Staff
                  </h2>
                  <p className="text-purple-100 mt-1">Fill in all required information to add a new team member to your organization</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
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
                    onClick={() => handleTabClick(tab.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-105"
                        : "bg-white text-purple-700 hover:bg-purple-100 border-2 border-purple-200"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Error Messages */}
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-red-800 font-bold text-lg mb-2">Please fill in all required fields before proceeding</p>
                      <p className="text-red-700 text-sm mb-2">The following fields are missing or invalid:</p>
                      <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="font-medium">
                            {error === 'clinicId' && 'Clinic ID'}
                            {error === 'firstName' && 'First Name'}
                            {error === 'lastName' && 'Last Name'}
                            {error === 'dateOfBirth' && 'Date of Birth'}
                            {error === 'gender' && 'Gender'}
                            {error === 'roleId' && 'Role'}
                            {error === 'email' && 'Valid Email Address'}
                            {error === 'phone' && 'Valid 10-digit Phone Number'}
                            {error === 'address' && 'Address'}
                            {error === 'emergencyContact' && 'Valid 10-digit Emergency Contact'}
                            {error === 'licenseNumber' && 'License Number'}
                            {error === 'licenseExpiry' && 'License Expiry Date'}
                            {error === 'specialtyId' && 'Specialty ID'}
                            {error === 'yearsExperience' && 'Years of Experience'}
                            {error === 'education' && 'Education'}
                            {error === 'joiningDate' && 'Joining Date'}
                            {error === 'employmentStatus' && 'Employment Status'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

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
                        Clinic ID <span className="mandatory-indicator">*</span>
                      </label>
                      <select
                        name="clinicId"
                        value={doctorFormData.clinicId}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.clinicId ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                      >
                        <option value="">Select clinic</option>
                        {onboardingClinics.map(clinic => {
                          const clinicId = clinic.clinicID || clinic.clinicId || clinic.id;
                          return (
                            <option key={clinicId} value={clinicId}>
                              {clinic.clinicName || clinic.name} ({clinicId})
                            </option>
                          );
                        })}
                      </select>
                      {fieldErrors.clinicId && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.clinicId}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Assign Role <span className="mandatory-indicator">*</span>
                      </label>
                      <select
                        name="roleId"
                        value={doctorFormData.roleId || ""}
                        onChange={(e) => {
                          const selectedRoleId = e.target.value;
                          const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(selectedRoleId));
                          setDoctorFormData(prev => ({
                            ...prev,
                            roleId: selectedRoleId,
                            role: selectedRole?.roleName || "",
                            rolesAssigned: selectedRoleId
                          }));
                          const error = validateField("roleId", selectedRoleId);
                          setFieldErrors(prev => ({ ...prev, roleId: error }));
                        }}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.roleId ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                      >
                        <option value="">{loadingRoles ? "Loading roles..." : "Select role"}</option>
                        {availableRolesFromApi.map((role) => (
                          <option key={role.roleId} value={role.roleId}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.roleId && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.roleId}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        First Name <span className="mandatory-indicator">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={doctorFormData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.firstName ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                        placeholder="Enter first name"
                      />
                      {fieldErrors.firstName && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.firstName}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Last Name <span className="mandatory-indicator">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={doctorFormData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.lastName ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                        placeholder="Enter last name"
                      />
                      {fieldErrors.lastName && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.lastName}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Date of Birth <span className="mandatory-indicator">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={doctorFormData.dateOfBirth}
                        onChange={handleInputChange}
                        max={todayISO}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.dateOfBirth ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                      />
                      {fieldErrors.dateOfBirth && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.dateOfBirth}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Gender <span className="mandatory-indicator">*</span>
                      </label>
                      <select
                        name="gender"
                        value={doctorFormData.gender}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.gender ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.gender && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.gender}
                        </motion.p>
                      )}
                    </div>
                  </div>
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
                        Email <span className="mandatory-indicator">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={doctorFormData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.email ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                        placeholder="doctor@example.com"
                      />
                      {fieldErrors.email && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.email}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Phone <span className="mandatory-indicator">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="phoneCountryCode"
                          value={doctorFormData.phoneCountryCode}
                          onChange={handleInputChange}
                          className="w-28 px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {countryCodeOptions.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                        <div className="flex-1">
                          <input
                            type="tel"
                            name="phone"
                            value={doctorFormData.phone}
                            onChange={handleInputChange}
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                              fieldErrors.phone ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                            }`}
                            placeholder="Enter 10-digit phone number"
                          />
                          {fieldErrors.phone && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-red-600 mt-1 field-error-message"
                            >
                              ⚠️ {fieldErrors.phone}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Address <span className="mandatory-indicator">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={doctorFormData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.address ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                        placeholder="Enter full address"
                      />
                      {fieldErrors.address && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.address}
                        </motion.p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Emergency Contact <span className="mandatory-indicator">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="emergencyCountryCode"
                          value={doctorFormData.emergencyCountryCode}
                          onChange={handleInputChange}
                          className="w-28 px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {countryCodeOptions.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                        <div className="flex-1">
                          <input
                            type="tel"
                            name="emergencyContact"
                            value={doctorFormData.emergencyContact}
                            onChange={handleInputChange}
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                              fieldErrors.emergencyContact ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                            }`}
                            placeholder="Enter 10-digit emergency contact number"
                          />
                          {fieldErrors.emergencyContact && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-red-600 mt-1 field-error-message"
                            >
                              ⚠️ {fieldErrors.emergencyContact}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Professional Tab */}
              {activeTab === "professional" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {(() => {
                    const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(doctorFormData.roleId));
                    const roleName = selectedRole?.roleName?.toLowerCase() || "";
                    const requiresAcademic = roleName.includes("doctor") || roleName.includes("nurse");
                    const isAdmin = roleName.includes("admin");
                    const disableClinicalFields = !requiresAcademic || isAdmin;
                    const disabledClass = disableClinicalFields ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";

                    return (
                      <>
                        {isAdmin && (
                          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center mb-4">
                            <span className="text-4xl">👑</span>
                            <h3 className="text-lg font-bold text-yellow-800 mt-2">Admin Role Selected</h3>
                            <p className="text-yellow-700 mt-1">License and academic credentials are not required for admin roles</p>
                          </div>
                        )}
                        {!requiresAcademic && !isAdmin && (
                          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4 text-center">
                            <span className="text-2xl">ℹ️</span>
                            <p className="text-blue-700 mt-1">Non-clinical role: license and specialty are optional</p>
                          </div>
                        )}
                        {requiresAcademic && !isAdmin && (
                          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                            <p className="text-sm text-green-800 font-semibold">
                              🩺 Clinical Role: License and academic credentials are <strong>required</strong>
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              License Number {requiresAcademic && !isAdmin ? <span className="mandatory-indicator">*</span> : null}
                            </label>
                            <input
                              type="text"
                              name="licenseNumber"
                              value={doctorFormData.licenseNumber}
                              onChange={handleInputChange}
                              disabled={disableClinicalFields}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                disableClinicalFields ? "border-gray-200 " + disabledClass : fieldErrors.licenseNumber ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                              }`}
                              placeholder="Medical license number"
                            />
                            {!disableClinicalFields && fieldErrors.licenseNumber && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-600 mt-1 field-error-message"
                              >
                                ⚠️ {fieldErrors.licenseNumber}
                              </motion.p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              License Expiry {requiresAcademic && !isAdmin ? <span className="mandatory-indicator">*</span> : null}
                            </label>
                            <input
                              type="date"
                              name="licenseExpiry"
                              value={doctorFormData.licenseExpiry}
                              onChange={handleInputChange}
                              min="1000-01-01"
                              max="9999-12-31"
                              disabled={disableClinicalFields}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                disableClinicalFields ? "border-gray-200 " + disabledClass : fieldErrors.licenseExpiry ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                              }`}
                            />
                            {!disableClinicalFields && fieldErrors.licenseExpiry && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-600 mt-1 field-error-message"
                              >
                                ⚠️ {fieldErrors.licenseExpiry}
                              </motion.p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Specialty ID {requiresAcademic && !isAdmin ? <span className="mandatory-indicator">*</span> : null}
                            </label>
                            <input
                              type="text"
                              name="specialtyId"
                              value={doctorFormData.specialtyId}
                              onChange={handleInputChange}
                              disabled={disableClinicalFields}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                disableClinicalFields ? "border-gray-200 " + disabledClass : fieldErrors.specialtyId ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                              }`}
                              placeholder="Specialty ID"
                            />
                            {!disableClinicalFields && fieldErrors.specialtyId && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-600 mt-1 field-error-message"
                              >
                                ⚠️ {fieldErrors.specialtyId}
                              </motion.p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Years of Experience <span className="mandatory-indicator">*</span>
                            </label>
                            <input
                              type="number"
                              name="yearsExperience"
                              value={doctorFormData.yearsExperience}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                fieldErrors.yearsExperience ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                              }`}
                              placeholder="Years"
                            />
                            {fieldErrors.yearsExperience && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-600 mt-1 field-error-message"
                              >
                                ⚠️ {fieldErrors.yearsExperience}
                              </motion.p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Education <span className="mandatory-indicator">*</span>
                            </label>
                            <textarea
                              name="education"
                              value={doctorFormData.education}
                              onChange={handleInputChange}
                              rows={2}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                fieldErrors.education ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                              }`}
                              placeholder="Educational qualifications"
                            />
                            {fieldErrors.education && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-600 mt-1 field-error-message"
                              >
                                ⚠️ {fieldErrors.education}
                              </motion.p>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Certifications
                            </label>
                            <textarea
                              name="certifications"
                              value={doctorFormData.certifications}
                              onChange={handleInputChange}
                              rows={2}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Professional certifications"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-purple-900 mb-2">
                              Languages
                            </label>
                            <input
                              type="text"
                              name="languages"
                              value={doctorFormData.languages}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="English, Hindi, etc."
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
                        Joining Date <span className="mandatory-indicator">*</span>
                      </label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={doctorFormData.joiningDate}
                        onChange={handleInputChange}
                        min="1000-01-01"
                        max="9999-12-31"
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.joiningDate ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                      />
                      {fieldErrors.joiningDate && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.joiningDate}
                        </motion.p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Employment Status <span className="mandatory-indicator">*</span>
                      </label>
                      <select
                        name="employmentStatus"
                        value={doctorFormData.employmentStatus}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.employmentStatus ? "border-red-500 bg-red-50 field-shake field-invalid" : "border-purple-300"
                        }`}
                      >
                        <option value="">Select status</option>
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                      </select>
                      {fieldErrors.employmentStatus && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-600 mt-1 field-error-message"
                        >
                          ⚠️ {fieldErrors.employmentStatus}
                        </motion.p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Availability
                      </label>
                      <textarea
                        name="availability"
                        value={doctorFormData.availability}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Mon-Fri 9AM-5PM, etc."
                      />
                    </div>
                  </div>
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
                      name="insuranceDetails"
                      value={doctorFormData.insuranceDetails}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Insurance coverage details"
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
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={doctorFormData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Professional biography"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Profile Photo URL
                    </label>
                    <input
                      type="url"
                      name="profilePhotoUrl"
                      value={doctorFormData.profilePhotoUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Achievements
                    </label>
                    <textarea
                      name="achievements"
                      value={doctorFormData.achievements}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Professional achievements"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Publications
                    </label>
                    <textarea
                      name="publications"
                      value={doctorFormData.publications}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Research publications"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Social Links
                    </label>
                    <input
                      type="text"
                      name="socialLinks"
                      value={doctorFormData.socialLinks}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="LinkedIn, Twitter, etc."
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-6 bg-gray-50 border-t flex justify-between">
              <button
                type="button"
                onClick={handlePreviousTab}
                disabled={tabOrder.indexOf(activeTab) === 0}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="flex gap-3">
                {tabOrder.indexOf(activeTab) === tabOrder.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleShowPreview}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Review & Submit →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <h2 className="text-3xl font-bold text-white">📋 Review Doctor Information</h2>
              <p className="text-green-100">Please review all details before submitting</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2"><span className="font-bold">Name:</span> {doctorFormData.firstName} {doctorFormData.lastName}</div>
                <div><span className="font-bold">Staff ID:</span> {doctorFormData.staffId}</div>
                <div><span className="font-bold">Enterprise ID:</span> {doctorFormData.enterpriseId}</div>
                <div><span className="font-bold">Clinic ID:</span> {doctorFormData.clinicId}</div>
                <div><span className="font-bold">Role:</span> {doctorFormData.role || availableRolesFromApi.find(r => r.roleId === parseInt(doctorFormData.roleId))?.roleName}</div>
                <div><span className="font-bold">Email:</span> {doctorFormData.email}</div>
                <div><span className="font-bold">Phone:</span> {doctorFormData.phone ? `${doctorFormData.phoneCountryCode}${doctorFormData.phone}` : ""}</div>
                <div><span className="font-bold">License:</span> {doctorFormData.licenseNumber}</div>
                <div><span className="font-bold">Specialty ID:</span> {doctorFormData.specialtyId}</div>
                <div><span className="font-bold">Employment:</span> {doctorFormData.employmentStatus}</div>
                <div><span className="font-bold">Joining Date:</span> {doctorFormData.joiningDate}</div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
              >
                ← Go Back
              </button>
              <button
                onClick={handleDoctorSubmit}
                disabled={isCreating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isCreating ? "⏳ Creating..." : "✅ Confirm & Submit"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
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
              <h2 className="text-3xl font-bold text-green-900 mb-2">Success!</h2>
            </motion.div>
            
            <div className="text-center space-y-3">
              <p className="text-xl font-semibold text-green-800">
                {onboardedRoleName} successfully onboarded! 🏥
              </p>
              <p className="text-green-700">
                They're officially part of the team now!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalOnboardStaffModal;
