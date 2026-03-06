import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createDoctor, searchDoctors } from '../services/doctorService';
import { bulkAssignRoles } from '../services/accessControlService';
import { listRoles } from '../services/roleService';
import { createStaffDetail, searchStaff } from '../services/staffService';
import { getSelectedAccess } from '../services/authService';

const API_BASE_URL = (import.meta).env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

// Roles mapped to backend database (RoleId matches backend)
const availableRoles = [
  { 
    id: 2, 
    name: "Doctor", 
    icon: "🩺", 
    color: "from-cyan-400 to-blue-400", 
    description: "Medical professional access",
    permissions: ["Patient Records", "Treatment Plans", "Prescriptions", "Scheduling"]
  },
  { 
    id: 3, 
    name: "Staff", 
    icon: "👨‍⚕️", 
    color: "from-rose-400 to-pink-400", 
    description: "Staff member access",
    permissions: ["Patient Records", "Appointments", "Clinic Operations"]
  },
  { 
    id: 6, 
    name: "Nurse", 
    icon: "👩‍⚕️", 
    color: "from-green-400 to-emerald-400", 
    description: "Nursing staff access",
    permissions: ["Patient Care", "Treatment Assistance", "Medical Records"]
  },
  { 
    id: 7, 
    name: "ClinicAdmin", 
    icon: "🏥", 
    color: "from-yellow-400 to-orange-400", 
    description: "Clinic administration access",
    permissions: ["Clinic Management", "Staff Management", "Billing", "Reports"]
  },
  { 
    id: 8, 
    name: "EntityAdmin", 
    icon: "👑", 
    color: "from-purple-500 to-indigo-600", 
    description: "Enterprise administration access",
    permissions: ["Enterprise Management", "Multi-clinic Operations", "User Management", "Settings"]
  }
];
const countryCodeOptions = ["+91", "+1", "+44", "+61", "+65", "+971"];

const TeamHub = () => {
  const navigate = useNavigate();
  
  // Doctor Onboarding Modal States
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [isReceptionistMode, setIsReceptionistMode] = useState(false);
  const [onboardedRoleName, setOnboardedRoleName] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [emailError, setEmailError] = useState("");
  
  // Access Control Modal States
  const [showAccessControlModal, setShowAccessControlModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    staffId: "",
    firstName: "",
    lastName: "",
    clinicId: "",
    enterpriseId: ""
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [accessControlEntries, setAccessControlEntries] = useState([]);
  const [rolesToRemove, setRolesToRemove] = useState([]);
  const [accessControlTab, setAccessControlTab] = useState("assign"); // "assign" or "remove"
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [roleSelectionMode, setRoleSelectionMode] = useState("multi-select"); // multi-select, drag-drop, toggle-switch, permission-builder
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigningRoles, setIsAssigningRoles] = useState(false);
  const [isRevokingAccess, setIsRevokingAccess] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ name: "", roles: "", count: 0 });
  const [showCredentialManagementModal, setShowCredentialManagementModal] = useState(false);
  const [showCredentialSuccess, setShowCredentialSuccess] = useState(false);
  const [credentialSuccessUsername, setCredentialSuccessUsername] = useState("");
  const [credentialFormData, setCredentialFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    enterpriseId: 0,
    clinicId: 0,
    roleId: 0,
    roleName: ""
  });
  const [allEnterprises, setAllEnterprises] = useState([]);
  const [onboardingClinics, setOnboardingClinics] = useState([]);
  const [credentialClinics, setCredentialClinics] = useState([]);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialError, setCredentialError] = useState("");
  const [roleOptions, setRoleOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [availableRolesFromApi, setAvailableRolesFromApi] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [freezeEnterprise, setFreezeEnterprise] = useState(false);
  const [freezeCredentialEnterprise, setFreezeCredentialEnterprise] = useState(false);
  const [freezeAccessControlEnterprise, setFreezeAccessControlEnterprise] = useState(false);
  // Today's date (YYYY-MM-DD) for date validation and max attribute
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
  
  // Security Questions Modal States
  const [showSecurityQuestionsModal, setShowSecurityQuestionsModal] = useState(false);
  const [securityQuestionStep, setSecurityQuestionStep] = useState('selection'); // selection, questions
  const [securityQuestionsFormData, setSecurityQuestionsFormData] = useState({
    enterpriseId: 0,
    clinicId: 0,
    doctorId: '',
    doctorName: '',
    answers: {}
  });
  const [securityQuestionsClinics, setSecurityQuestionsClinics] = useState([]);
  const [securityQuestionsDoctors, setSecurityQuestionsDoctors] = useState([]);
  const [securityQuestionsLoading, setSecurityQuestionsLoading] = useState(false);
  const [securityQuestionsError, setSecurityQuestionsError] = useState("");
  
  
  // Standard Security Questions
  const standardSecurityQuestions = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "In which city were you born?",
    "What was the make and model of your first car?",
    "What is your favorite book?"
  ];
  
  // Sample staff data (would come from API)
  const mockStaffData = [
    { id: 1, staffId: "S001", firstName: "Rajesh", lastName: "Kumar", clinicId: "C001", currentRole: "Doctor", email: "rajesh.kumar@dentaesthetics.com" },
    { id: 2, staffId: "S002", firstName: "Priya", lastName: "Sharma", clinicId: "C001", currentRole: "Receptionist", email: "priya.sharma@dentaesthetics.com" },
    { id: 3, staffId: "S003", firstName: "Amit", lastName: "Patel", clinicId: "C002", currentRole: "Manager", email: "amit.patel@dentaesthetics.com" },
    { id: 4, staffId: "S004", firstName: "Sneha", lastName: "Reddy", clinicId: "C001", currentRole: "Admin", email: "sneha.reddy@dentaesthetics.com" },
    { id: 5, staffId: "S005", firstName: "Vikram", lastName: "Singh", clinicId: "C003", currentRole: "Doctor", email: "vikram.singh@dentaesthetics.com" },
    { id: 6, staffId: "S006", firstName: "Anjali", lastName: "Desai", clinicId: "C002", currentRole: "Lab Technician", email: "anjali.desai@dentaesthetics.com" },
    { id: 7, staffId: "S007", firstName: "Rahul", lastName: "Mehta", clinicId: "C001", currentRole: "Accountant", email: "rahul.mehta@dentaesthetics.com" },
    { id: 8, staffId: "S008", firstName: "Kavya", lastName: "Nair", clinicId: "C003", currentRole: "Receptionist", email: "kavya.nair@dentaesthetics.com" },
    { id: 9, staffId: "S009", firstName: "Arjun", lastName: "Verma", clinicId: "C002", currentRole: "Doctor", email: "arjun.verma@dentaesthetics.com" },
    { id: 10, staffId: "S010", firstName: "Deepika", lastName: "Joshi", clinicId: "C001", currentRole: "Manager", email: "deepika.joshi@dentaesthetics.com" },
    { id: 11, staffId: "S011", firstName: "Sanjay", lastName: "Gupta", clinicId: "C003", currentRole: "Admin", email: "sanjay.gupta@dentaesthetics.com" },
    { id: 12, staffId: "S012", firstName: "Neha", lastName: "Kapoor", clinicId: "C002", currentRole: "Receptionist", email: "neha.kapoor@dentaesthetics.com" },
    { id: 13, staffId: "S013", firstName: "Aditya", lastName: "Shah", clinicId: "C001", currentRole: "Lab Technician", email: "aditya.shah@dentaesthetics.com" },
    { id: 14, staffId: "S014", firstName: "Pooja", lastName: "Iyer", clinicId: "C003", currentRole: "Doctor", email: "pooja.iyer@dentaesthetics.com" },
    { id: 15, staffId: "S015", firstName: "Karthik", lastName: "Rao", clinicId: "C002", currentRole: "Accountant", email: "karthik.rao@dentaesthetics.com" },
    { id: 16, staffId: "S016", firstName: "Divya", lastName: "Menon", clinicId: "C001", currentRole: "Receptionist", email: "divya.menon@dentaesthetics.com" },
    { id: 17, staffId: "S017", firstName: "Rohan", lastName: "Chopra", clinicId: "C003", currentRole: "Manager", email: "rohan.chopra@dentaesthetics.com" },
    { id: 18, staffId: "S018", firstName: "Ishita", lastName: "Bansal", clinicId: "C002", currentRole: "Doctor", email: "ishita.bansal@dentaesthetics.com" },
    { id: 19, staffId: "S019", firstName: "Varun", lastName: "Malhotra", clinicId: "C001", currentRole: "Lab Technician", email: "varun.malhotra@dentaesthetics.com" },
    { id: 20, staffId: "S020", firstName: "Simran", lastName: "Khanna", clinicId: "C003", currentRole: "Admin", email: "simran.khanna@dentaesthetics.com" }
  ];
  const [doctorFormData, setDoctorFormData] = useState({
    staffId: 0,
    enterpriseId: "",
    clinicId: "",
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
    employmentStatus: "Active",
    availability: "",
    insuranceDetails: "",
    emergencyCountryCode: "+91",
    emergencyContact: "",
    bio: "",
    profilePhotoUrl: "",
    achievements: "",
    publications: "",
    socialLinks: "",
    branchId: "",
    role: "",
    roleId: "",
    rolesAssigned: ""
  });

  // Load roles from API on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const roles = await listRoles();
        console.log("📋 Roles loaded from API:", roles);
        setAvailableRolesFromApi(roles);
        setRoleOptions(roles); // Also set for credential modal compatibility
      } catch (error) {
        console.error("❌ Error loading roles:", error);
        alert("Failed to load roles. Please refresh the page.");
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  // Fetch and pre-select existing roles when staff is selected in access control
  useEffect(() => {
    if (!selectedStaff || !showRoleManager) return;

    const fetchExistingRoles = async () => {
      try {
        console.log('🔍 Fetching existing roles for staff:', selectedStaff);
        console.log('📊 Available roles in state:', availableRoles);
        
        const staffId = selectedStaff.profileId || selectedStaff.userId || selectedStaff.staffId || selectedStaff.id;
        console.log('🆔 Extracted staffId:', staffId);
        console.log('📌 Staff object keys:', Object.keys(selectedStaff));
        console.log('📋 Full selectedStaff object:', JSON.stringify(selectedStaff, null, 2));
        
        if (staffId) {
          console.log('🔄 Calling fetchRolesByStaffId with:', staffId);
          const apiRoles = await fetchRolesByStaffId(staffId);
          console.log('📝 Returned apiRoles:', apiRoles);
          if (apiRoles.length > 0) {
            console.log('✨ Setting roles from API:', apiRoles);
            setSelectedRoles(apiRoles);
            
            // Populate accessControlEntries for the Remove Access functionality
            // Convert role objects to access control entry format
            const entries = apiRoles.map((role, index) => ({
              accessControlId: `${staffId}_${role.id}`, // Generate unique ID
              roleId: role.id,
              userId: staffId,
              isActive: true
            }));
            console.log('📋 Setting accessControlEntries:', entries);
            setAccessControlEntries(entries);
            setRolesToRemove([]);
            
            return;
          } else {
            console.log('ℹ️ API returned empty roles, falling back to staff payload');
          }
        } else {
          console.warn('⚠️ Could not extract staffId from selectedStaff');
        }
        
        const clinicId = selectedStaff.clinicId || selectedStaff.clinicID;

        console.log('🆔 Staff ID:', staffId, '| Clinic ID:', clinicId);

        const roleIdsFromStaff = selectedStaff ? (
          Array.isArray(selectedStaff.roleIds)
            ? selectedStaff.roleIds
            : Array.isArray(selectedStaff.roles)
              ? selectedStaff.roles.filter(r => r !== null).map(r => r.roleId || r.id).filter(Boolean)
              : selectedStaff.roleId
                ? [selectedStaff.roleId]
                : []
        ) : [];

        const roleNamesFromStaff = typeof selectedStaff.rolesAssigned === "string"
          ? selectedStaff.rolesAssigned.split(',').map(r => r.trim()).filter(Boolean)
          : typeof selectedStaff.currentRole === "string"
            ? [selectedStaff.currentRole]
            : [];

        if (roleIdsFromStaff.length > 0 || roleNamesFromStaff.length > 0) {
          const normalizedNames = roleNamesFromStaff.map(name => name.toLowerCase());
          const preSelectedRoles = availableRoles.filter(role =>
            roleIdsFromStaff.includes(role.id) || normalizedNames.includes(role.name.toLowerCase())
          );

          console.log('✨ Pre-selected roles from staff payload:', preSelectedRoles);
          setSelectedRoles(preSelectedRoles);
        }

        if (!staffId || !clinicId) {
          console.warn('⚠️ Missing staffId or clinicId for fetching roles');
          setSelectedRoles([]);
          return;
        }

        // Fetch existing roles for this staff using the dedicated API endpoint
        console.log('🔄 Fetching existing roles via fetchRolesByStaffId...');
        
        const existingRoles = await fetchRolesByStaffId(staffId);
        console.log('✅ Existing roles from API:', existingRoles);

        setRolesToRemove([]);

        if (existingRoles && Array.isArray(existingRoles) && existingRoles.length > 0) {
          // Extract role IDs from existing roles
          const existingRoleIds = existingRoles.map(role => {
            if (!role) return null;
            const roleId = role.roleId || role.RoleId || role.id;
            console.log('🔗 Role entry:', role, '-> Role ID:', roleId);
            return roleId;
          }).filter(id => id); // Remove any undefined
          
          console.log('👤 Extracted existing role IDs:', existingRoleIds);
          console.log('📌 Available role IDs in UI:', availableRoles.map(r => r.id));

          if (existingRoleIds.length > 0) {
            // Filter availableRoles to match existing roleIds
            const preSelectedRoles = availableRoles.filter(role => {
              const isSelected = existingRoleIds.includes(role.id);
              console.log(`  Role ${role.name} (ID: ${role.id}) - Selected: ${isSelected}`);
              return isSelected;
            });

            console.log('✨ Pre-selected roles:', preSelectedRoles);
            setSelectedRoles(preSelectedRoles);
          } else {
            console.log('⚠️ No valid role IDs extracted from access entries');
            setSelectedRoles([]);
          }
        } else {
          console.log('ℹ️ No existing roles found for this staff (empty response)');
          setSelectedRoles([]);
          setAccessControlEntries([]);
          setRolesToRemove([]);
        }
      } catch (error) {
        console.error('❌ Error fetching existing roles:', error);
        console.error('   Error details:', error.message, error.stack);
        // Don't block UI if fetch fails, just start with empty selection
        setSelectedRoles([]);
        setAccessControlEntries([]);
        setRolesToRemove([]);
      }
    };

    fetchExistingRoles();
  }, [selectedStaff, showRoleManager]);

  // Fetch clinics when enterprise is selected in onboarding modal
  useEffect(() => {
    if (!doctorFormData.enterpriseId || doctorFormData.enterpriseId === "" || doctorFormData.enterpriseId === 0) {
      setOnboardingClinics([]);
      return;
    }

    const fetchOnboardingClinics = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/Clinic/GetClinicByID?id=${doctorFormData.enterpriseId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const clinicList = Array.isArray(data) ? data : (data?.clinics || [data]);
          console.log("📋 Clinics loaded for onboarding:", clinicList);
          setOnboardingClinics(clinicList);
          // If enterprise is frozen (from login), keep preset clinic if any; else reset
          if (!freezeEnterprise) {
            setDoctorFormData(prev => ({ ...prev, clinicId: "" }));
          }
        } else {
          setOnboardingClinics([]);
        }
      } catch (error) {
        console.error("Error fetching clinics:", error);
        setOnboardingClinics([]);
      }
    };

    fetchOnboardingClinics();
  }, [doctorFormData.enterpriseId, freezeEnterprise]);

  // Auto-populate clinic in credential modal when frozen enterprise's clinics are loaded
  useEffect(() => {
    if (freezeCredentialEnterprise && credentialClinics.length > 0 && credentialFormData.clinicId === 0) {
      // Auto-select the first clinic from the enterprise
      const firstClinic = credentialClinics[0];
      setCredentialFormData(prev => ({
        ...prev,
        clinicId: firstClinic.clinicId
      }));
    }
  }, [credentialClinics, freezeCredentialEnterprise]);

  const sections = [
    {
      id: 'doctors-lounge',
      title: "👨‍⚕️ Doctors Lounge",
      description: "Manage physicians, specialists, and medical staff",
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-50 to-indigo-50",
      options: [
        {
          id: 'clinic-mapping',
          title: "🏥 Clinic Mapping",
          description: "Map doctors to clinics",
          path: "/doctors/clinic-mapping",
          icon: "🗺️",
          color: "from-purple-500 to-pink-500"
        }
      ]
    },
    {
      id: 'reception-staff',
      title: "Onboard Staff",
      description: "Recruit and integrate new team members",
      gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
      bgGradient: "from-rose-50 to-pink-50",
      options: [
        {
          id: 'onboard-receptionist',
          title: "🎭 Onboard Staff",
          description: "Add reception team members",
          path: "/receptionists/onboard",
          icon: "🔔",
          color: "from-rose-500 to-pink-500"
        },
        {
          id: 'view-receptionists',
          title: "👁️ View Staff Details",
          description: "Search and manage reception staff",
          path: "/staff/details",
          icon: "💬",
          color: "from-pink-500 to-fuchsia-500"
        }
      ]
    },
    {
      id: 'access-control',
      title: "🔐 Access Control",
      description: "Manage staff permissions and roles",
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      bgGradient: "from-violet-50 to-purple-50",
      options: [
        {
          id: 'manage-access',
          title: "🔑 Manage Access",
          description: "Control staff role assignments",
          path: "/access-control",
          icon: "🛡️",
          color: "from-violet-500 to-purple-500"
        },
        
      ]
    },
    {
      id: 'credential-management',
      title: "🔐 Credential Management",
      description: "Manage user credentials and authentication",
      gradient: "from-orange-500 via-red-500 to-rose-600",
      bgGradient: "from-orange-50 to-rose-50",
      options: [
        {
          id: 'create-credential',
          title: "🆕 Create Credential",
          description: "Register new user credentials",
          path: "#",
          icon: "🔐",
          color: "from-orange-500 to-red-500"
        },
        {
          id: 'security-questions',
          title: "🔒 Security Questions",
          description: "Set up security questions for verification",
          path: "#",
          icon: "❓",
          color: "from-red-500 to-rose-500"
        }
      ]
    }
  ];

  const handleCardClick = (path, optionId) => {
    if (optionId === 'onboard-doctor') {
      setIsReceptionistMode(false);
      setDoctorFormData(prev => ({ ...prev, role: "Doctor" }));
      loadRoles();
      loadEnterprises();
      // Preselect enterprise from login and freeze selection
      const access = getSelectedAccess();
      if (access?.enterpriseId) {
        setDoctorFormData(prev => ({ ...prev, enterpriseId: access.enterpriseId, clinicId: access.clinicId || "" }));
        setFreezeEnterprise(true);
      }
      setShowDoctorModal(true);
      return;
    }
    if (optionId === 'onboard-receptionist') {
      setIsReceptionistMode(true);
      setDoctorFormData(prev => ({ ...prev, role: "Receptionist" }));
      loadRoles();
      loadEnterprises();
      // Preselect enterprise from login and freeze selection
      const access = getSelectedAccess();
      if (access?.enterpriseId) {
        setDoctorFormData(prev => ({ ...prev, enterpriseId: access.enterpriseId, clinicId: access.clinicId || "" }));
        setFreezeEnterprise(true);
      }
      setShowDoctorModal(true);
      return;
    }
    if (optionId === 'create-staff-profile') {
      navigate('/staff/onboard');
      return;
    }
    if (optionId === 'view-staff-profiles') {
      navigate('/staff/details');
      return;
    }
    if (optionId === 'manage-access') {
      setShowAccessControlModal(true);
      // Prefill and freeze enterprise from login
      const access = getSelectedAccess();
      console.log('🔐 Login Access Data:', access);
      
      // TEMPORARY FIX: If values are still swapped, correct them here
      let correctEnterpriseId = access?.enterpriseId;
      if (access && access.clinicId > access.enterpriseId) {
        // If clinicId is larger than enterpriseId, they're likely swapped
        // (since enterprise IDs are typically 5 digits like 10004, clinic IDs are 4 digits like 5007)
        correctEnterpriseId = access.clinicId;
        console.log('⚠️ Detected swap, using clinicId as enterpriseId:', correctEnterpriseId);
      }
      
      if (correctEnterpriseId) {
        setSearchFilters(prev => ({
          ...prev,
          enterpriseId: correctEnterpriseId.toString()
        }));
        setFreezeAccessControlEnterprise(true);
        console.log('✅ Set searchFilters.enterpriseId to:', correctEnterpriseId.toString());
      }
      return;
    }
    if (optionId === 'create-credential') {
      setShowCredentialManagementModal(true);
      setCredentialError("");
      loadEnterprises();
      loadRoles();
      // Prefill enterprise (and clinic) from login selection and freeze in credential modal
      const access = getSelectedAccess();
      if (access?.enterpriseId) {
        setCredentialFormData(prev => ({
          ...prev,
          enterpriseId: access.enterpriseId,
          clinicId: access.clinicId || 0
        }));
        setFreezeCredentialEnterprise(true);
        // Ensure clinics are loaded for the preset enterprise
        loadClinicsForCredential(access.enterpriseId);
      }
      return;
    }
    if (optionId === 'security-questions') {
      setShowSecurityQuestionsModal(true);
      loadEnterprises();
      return;
    }
    navigate(path);
  };
  
  // Access Control Functions
  const handleSearchStaff = async () => {
    setIsSearching(true);
    try {
      // Get enterprise ID from searchFilters (already set from login when modal opened)
      const enterpriseId = searchFilters.enterpriseId;
      
      if (!enterpriseId) {
        alert('❌ Enterprise ID not found. Please login again.');
        setIsSearching(false);
        return;
      }

      console.log('🔍 Searching staff with filters:', {
        enterpriseId,
        clinicId: searchFilters.clinicId,
        profileId: searchFilters.staffId,
        firstName: searchFilters.firstName,
        lastName: searchFilters.lastName
      });
      
      // Call searchStaff service function with proper parameters
      const allStaff = await searchStaff({
        enterpriseId,
        clinicId: searchFilters.clinicId ? parseInt(searchFilters.clinicId) : undefined,
        profileId: searchFilters.staffId,
        firstName: searchFilters.firstName,
        lastName: searchFilters.lastName
      });
      
      console.log('✅ Staff found from API:', allStaff);
      console.log('📋 First staff object structure:', allStaff[0]);
      
      // Log all available fields from first result for debugging
      if (allStaff && allStaff.length > 0) {
        console.log('📊 Available fields in API response:');
        console.log(Object.keys(allStaff[0]));
        console.log('🔍 Raw first staff:', JSON.stringify(allStaff[0], null, 2));
      }

      // Transform API results to match UI structure
      const transformedResults = (Array.isArray(allStaff) ? allStaff : (allStaff?.data || [])).map((staff, index) => {
        // Try multiple field name variations for ID
        const staffId = staff.staffId || staff.id || staff.profileId || staff.StaffId || staff.StaffID || 'N/A';
        const id = staff.id || staff.staffId || staff.profileId || `staff_${index}`;
        
        // Parse fullName into firstName and lastName
        let firstName = '';
        let lastName = '';
        
        if (staff.fullName && typeof staff.fullName === 'string') {
          const nameParts = staff.fullName.trim().split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = staff.fullName;
            lastName = '';
          }
        } else {
          // Fallback to individual fields if fullName not available
          firstName = staff.firstName || staff.first_name || staff.firstname || '';
          lastName = staff.lastName || staff.last_name || staff.lastname || '';
        }
        
        const transformed = {
          id: id,
          staffId: staffId,  // Display the staff ID
          profileId: staff.profileId || staffId,
          firstName: firstName,
          lastName: lastName,
          fullName: staff.fullName || `${firstName} ${lastName}`.trim(),
          enterpriseID: staff.enterpriseID || staff.enterpriseId || '',
          clinicId: staff.clinicID || staff.clinicId || '',
          currentRole: staff.role || staff.roleType || staff.role_name || staff.roleName || '',
          roleId: staff.roleId || staff.RoleId || null,
          roleIds: staff.roleIds || staff.RoleIds || [],
          roles: staff.roles || staff.Roles || [],
          rolesAssigned: staff.rolesAssigned || staff.role || staff.roleType || staff.roleName || '',
          email: staff.email || staff.emailId || '',
          phone: staff.phone || ''
        };
        
        if (index === 0) {
          console.log('🔄 First transformed result:', transformed);
          console.log('✅ Staff ID value:', staffId);
          console.log('📝 Full Name from API:', staff.fullName);
          console.log('📝 Parsed firstName:', firstName);
          console.log('📝 Parsed lastName:', lastName);
          console.log('📝 Role from API:', staff.role);
          console.log('📝 Transformed role/currentRole:', transformed.currentRole);
        }
        
        return transformed;
      });

      setSearchResults(transformedResults);

      if (transformedResults.length === 0) {
        alert('ℹ️ No staff found matching the search criteria.');
      }
    } catch (error) {
      console.error('❌ Error searching staff:', error);
      alert(`❌ Failed to search staff: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load enterprises for credential management
  const loadEnterprises = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Enterprise/GetAllEnterprises`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Enterprises loaded:", data);
        setAllEnterprises(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error loading enterprises:", error);
    }
  };

  // Load clinics when enterprise is selected
    // Load roles for credential management and receptionist onboarding
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        // Use RoleMaster/GetAllRoles API via roleService (base URL includes /api)
        const roles = await listRoles();
        setRoleOptions(Array.isArray(roles) ? roles : roles?.data || []);
      } catch (error) {
        console.error("Error loading roles:", error);
        setRoleOptions([]);
      } finally {
        setRolesLoading(false);
      }
    };
  const loadClinicsForCredential = async (enterpriseId) => {
    if (!enterpriseId || enterpriseId === 0) {
      setCredentialClinics([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${enterpriseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🏥 Clinics loaded:", data);
        setCredentialClinics(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error loading clinics:", error);
      setCredentialClinics([]);
    }
  };

  // Load clinics for patient registration

  // Handle credential registration
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!credentialFormData.firstName?.trim()) {
      setCredentialError("First name is required");
      return;
    }
    if (!credentialFormData.lastName?.trim()) {
      setCredentialError("Last name is required");
      return;
    }
    if (!credentialFormData.email?.trim()) {
      setCredentialError("Email is required");
      return;
    }
    if (!credentialFormData.mobileNumber?.trim()) {
      setCredentialError("Mobile number is required");
      return;
    }
    // Extract digits only from mobile (allows +, spaces, hyphens in display)
    const digitsOnly = credentialFormData.mobileNumber.replace(/\D/g, "");
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      setCredentialError("Mobile number must contain 10-15 digits (country code optional, e.g., +91 9876543210)");
      return;
    }
    // Take only last 10 digits (removes country code if provided)
    const mobileNumber10Digit = digitsOnly.slice(-10);
    if (!credentialFormData.password?.trim()) {
      setCredentialError("Password is required");
      return;
    }
    if (credentialFormData.password !== credentialFormData.confirmPassword) {
      setCredentialError("Passwords do not match");
      return;
    }
    if (credentialFormData.enterpriseId === 0) {
      setCredentialError("Enterprise selection is required");
      return;
    }
    if (credentialFormData.clinicId === 0) {
      setCredentialError("Clinic selection is required");
      return;
    }
    if (credentialFormData.roleId === 0) {
      setCredentialError("Role selection is required");
      return;
    }

    setCredentialLoading(true);
    try {
      console.log("🔴 BEFORE PAYLOAD - Full credentialFormData:", credentialFormData);
      console.log("🔴 roleId:", credentialFormData.roleId);
      console.log("🔴 roleName:", credentialFormData.roleName);

      const payload = {
        firstName: credentialFormData.firstName,
        lastName: credentialFormData.lastName,
        emailId: credentialFormData.email,
        username: credentialFormData.email,
        password: credentialFormData.password,
        mobileNumber: mobileNumber10Digit,
        enterpriseId: parseInt(credentialFormData.enterpriseId),
        clinicId: parseInt(credentialFormData.clinicId),
        roleId: parseInt(credentialFormData.roleId),
        roleName: credentialFormData.roleName
      };

      console.log("📝 Registering credential:", payload);
      console.log("🔍 RoleName in payload:", payload.roleName);
      console.log("🔍 Full payload JSON:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_BASE_URL}/Authentication/registerUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      console.log("📤 API Response Status:", response.status);
      console.log("📤 API Response Headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Credential registered successfully:", data);
        console.log("✅ Response data keys:", Object.keys(data));
        
        // Show success modal with mobile number
        setCredentialSuccessUsername(digitsOnly);
        setShowCredentialSuccess(true);
        
        // Reset form
        setCredentialFormData({
          firstName: "",
          lastName: "",
          email: "",
          mobileNumber: "",
          password: "",
          confirmPassword: "",
          enterpriseId: 0,
          clinicId: 0,
          roleId: 0
        });

        // Close modal after success
        setTimeout(() => {
          setShowCredentialManagementModal(false);
          setShowCredentialSuccess(false);
        }, 2000);
      } else {
        // Read response body once, then try to parse as JSON, fallback to text
        const responseText = await response.text();
        let errorMessage = "Failed to register credential";
        
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            console.log("❌ Error response (JSON):", errorData);
            errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to register credential`;
          } else {
            errorMessage = `HTTP ${response.status}: Failed to register credential`;
          }
        } catch (parseError) {
          // If JSON parsing fails, use raw text
          console.log("❌ Error response (Text):", responseText);
          errorMessage = responseText || `HTTP ${response.status}: Failed to register credential`;
        }
        console.log("❌ Full error details:", { status: response.status, message: errorMessage, body: responseText });
        setCredentialError(errorMessage);
      }
    } catch (error) {
      console.error("❌ Error registering credential:", error);
      console.error("❌ Error stack:", error.stack);
      setCredentialError(error.message || "Error registering credential. Please try again.");
    } finally {
      setCredentialLoading(false);
    }
  };

  // Handle patient registration


  // Load clinics when enterprise is selected for security questions
  const loadClinicsForSecurityQuestions = async (enterpriseId) => {
    if (!enterpriseId || enterpriseId === 0) {
      setSecurityQuestionsClinics([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${enterpriseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🏥 Clinics loaded for security questions:", data);
        setSecurityQuestionsClinics(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error loading clinics:", error);
      setSecurityQuestionsClinics([]);
    }
  };

  // Load doctors for selected clinic or enterprise
  const loadDoctorsForSecurityQuestions = async (enterpriseId, clinicId = null) => {
    try {
      let url;
      // If clinic is selected, load doctors for that clinic; otherwise load doctors for entire enterprise
      if (clinicId) {
        url = `${API_BASE_URL}/Doctor/GetDoctorsByClinic?clinicId=${clinicId}`;
      } else {
        url = `${API_BASE_URL}/Doctor/GetDoctorsByEnterpriseID?enterpriseId=${enterpriseId}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🩺 Doctors loaded for security questions:`, data);
        setSecurityQuestionsDoctors(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      setSecurityQuestionsDoctors([]);
    }
  }

  // Handle security questions setup
  const handleSecurityQuestionsSubmit = async (e) => {
    e.preventDefault();

    // Validate selection step
    if (securityQuestionStep === 'selection') {
      if (!securityQuestionsFormData.enterpriseId) {
        setSecurityQuestionsError("Please select an enterprise");
        return;
      }
      // Clinic is now optional - if not selected, doctors are loaded from entire enterprise
      if (!securityQuestionsFormData.doctorId) {
        setSecurityQuestionsError("Please select a doctor");
        return;
      }

      setSecurityQuestionStep('questions');
      setSecurityQuestionsError("");
      return;
    }

    // Validate answers step
    if (securityQuestionStep === 'questions') {
      for (let i = 0; i < standardSecurityQuestions.length; i++) {
        if (!securityQuestionsFormData.answers[i] || !securityQuestionsFormData.answers[i].trim()) {
          setSecurityQuestionsError(`Please answer question ${i + 1}`);
          return;
        }
      }

      // Submit answers
      setSecurityQuestionsLoading(true);
      try {
        const payload = {
          doctorId: securityQuestionsFormData.doctorId,
          enterpriseId: securityQuestionsFormData.enterpriseId,
          clinicId: securityQuestionsFormData.clinicId,
          securityAnswers: standardSecurityQuestions.map((question, index) => ({
            question: question,
            answer: securityQuestionsFormData.answers[index]
          }))
        };

        console.log("📝 Submitting security questions:", payload);

        const response = await fetch(`${API_BASE_URL}/Authentication/SetSecurityQuestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log("✅ Security questions set successfully");
          setSecurityQuestionsError("");
          
          // Show success and close modal
          setTimeout(() => {
            setShowSecurityQuestionsModal(false);
            setSecurityQuestionStep('selection');
            setSecurityQuestionsFormData({
              enterpriseId: 0,
              clinicId: 0,
              doctorId: '',
              doctorName: '',
              answers: {}
            });
            alert("✅ Security questions set successfully!");
          }, 1000);
        } else {
          const errorData = await response.json();
          setSecurityQuestionsError(errorData.message || "Failed to set security questions");
        }
      } catch (error) {
        console.error("Error setting security questions:", error);
        setSecurityQuestionsError("Error setting security questions. Please try again.");
      } finally {
        setSecurityQuestionsLoading(false);
      }
    }
  };

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setShowRoleManager(true);
    // Pre-select the staff's current role(s)
    if (staff?.currentRole) {
      const matchedRoles = availableRoles.filter(role => 
        role.name === staff.currentRole
      );
      setSelectedRoles(matchedRoles);
    } else {
      setSelectedRoles([]);
    }
  };
  
  const handleToggleRole = (role) => {
    setSelectedRoles(prev => {
      const exists = prev.find(r => r.id === role.id);
      if (exists) {
        // Remove role
        return prev.filter(r => r.id !== role.id);
      } else {
        // Add role
        return [...prev, role];
      }
    });
  };
  
  const handleApplyRoles = () => {
    if (selectedRoles.length === 0) {
      alert("⚠️ Please select at least one role to assign!");
      return;
    }
    setShowConfirmation(true);
  };
  
  const handleConfirmAssignment = async () => {
    if (selectedStaff) {
      const roleNames = selectedRoles.map(r => r.name).join(", ");
      setIsAssigningRoles(true);
      
      try {
        // Get enterprise ID from SELECTED STAFF
        const enterpriseId = selectedStaff.enterpriseID;
        
        if (!enterpriseId) {
          throw new Error("Enterprise ID not found in selected staff");
        }

        // Prepare the payload for backend API
        // StaffId is same as profileId - use whichever is available
        const staffId = selectedStaff.staffId || selectedStaff.profileId || selectedStaff.id;
        
        if (!staffId) {
          console.error('❌ Selected staff object:', selectedStaff);
          throw new Error("Staff ID/Profile ID is required but not found in selected staff");
        }

        // Validate clinic ID from selected staff
        if (!selectedStaff.clinicId) {
          console.error('❌ Selected staff object:', selectedStaff);
          throw new Error("Clinic ID is required but not found in selected staff");
        }

        const payload = {
          userId: staffId.toString(),  // staffId/profileId as string
          enterpriseId: parseInt(enterpriseId),  // Convert to int as required - FROM SELECTED STAFF
          clinicId: parseInt(selectedStaff.clinicId),  // clinicId from selected staff as int
          roleIds: selectedRoles.map(r => r.id),  // Array of role IDs as int
          isActive: true
        };
        
        console.log('📤 Sending role assignment:', payload);
        console.log('🆔 Staff/Profile ID:', staffId);
        console.log('🏢 Enterprise ID (from selected staff):', enterpriseId);
        console.log('🏥 Clinic ID (from staff):', selectedStaff.clinicId);
        console.log('👤 Selected Staff:', selectedStaff);
        
        // Call the backend API to assign roles (calls AssignRoles endpoint for each role)
        const result = await bulkAssignRoles(payload);
        
        console.log('✅ Roles assigned successfully:', result);
        
        // Update the staff's role in the results (showing first role for display)
        setSearchResults(prev => prev.map(s => 
          s.id === selectedStaff.id ? { ...s, currentRole: selectedRoles[0].name, allRoles: selectedRoles } : s
        ));
        
        // Close modals
        setShowConfirmation(false);
        setShowRoleManager(false);
        setIsAssigningRoles(false);
        
        // Show animated success popup
        setSuccessMessage({
          name: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
          roles: roleNames,
          count: result.length
        });
        setShowSuccessPopup(true);
        
        // Reset selection after 4 seconds
        setTimeout(() => {
          setSelectedStaff(null);
          setSelectedRoles([]);
        }, 4000);
        
      } catch (error) {
        console.error('❌ Error assigning roles:', error);
        setIsAssigningRoles(false);
        
        // Show error in a custom way (you can create error popup too)
        alert(`❌ Failed to assign roles: ${error.message}\n\nPlease check the console for details.`);
      }
    }
  };

  const fetchRolesByStaffId = async (staffId) => {
    try {
      console.log('🔄 Fetching roles for staffId:', staffId);
      console.log('📌 staffId type:', typeof staffId, '| Empty?:', !staffId, '| Value:', JSON.stringify(staffId));
      
      if (!staffId || staffId === '' || staffId === 'undefined') {
        console.error('❌ Invalid staffId provided:', staffId);
        return [];
      }
      
      const url = `${API_BASE_URL}/Authentication/GetRolesByStaffId?staffId=${encodeURIComponent(staffId)}`;
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('⚠️ API returned non-OK status:', response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('📋 Raw response data:', data);
      
      if (!data) {
        console.warn('⚠️ Response data is null or undefined');
        return [];
      }
      
      const rolesArray = Array.isArray(data) ? data : (data?.roles || data?.data || []);
      console.log('📋 Extracted roles array:', rolesArray);
      
      if (!rolesArray || !Array.isArray(rolesArray)) {
        console.warn('⚠️ Roles array is not valid');
        return [];
      }
      
      const mappedRoles = rolesArray
        .filter(role => role !== null && role !== undefined)
        .map(role => {
          const roleId = role.roleId || role.RoleId || role.id;
          console.log('  Processing role:', role, '-> Role ID:', roleId);
          if (!roleId) {
            console.warn('    ⚠️ Missing roleId for role:', role);
            return null;
          }
          const uiRole = availableRoles.find(r => r.id === roleId);
          if (uiRole) {
            console.log('    Found in availableRoles:', uiRole);
            return uiRole;
          }
          const mapped = {
            id: roleId,
            name: role.roleName || role.name || `Role ${roleId}`,
            icon: "🔒",
            color: "from-slate-400 to-slate-600",
            permissions: []
          };
          console.log('    Created custom role:', mapped);
          return mapped;
        })
        .filter(Boolean);
      
      console.log('✅ Final mapped roles:', mappedRoles);
      return mappedRoles;
    } catch (error) {
      console.error('❌ Error fetching roles by staff ID:', error);
      console.error('   Error details:', error.message, error.stack);
    }
    return [];
  };

  const getRemovableRoles = () => {
    const roleIds = accessControlEntries
      .map(entry => entry.roleId || entry.RoleId || entry.role_id)
      .filter(Boolean);
    const uniqueRoleIds = [...new Set(roleIds)];
    const mapped = uniqueRoleIds
      .map(id => {
        const uiRole = availableRoles.find(r => r.id === id);
        if (uiRole) return uiRole;
        const apiRole = availableRolesFromApi.find(r => r.roleId === id || r.id === id);
        if (apiRole) {
          return {
            id,
            name: apiRole.roleName || apiRole.name || `Role ${id}`,
            icon: "🔒",
            color: "from-slate-400 to-slate-600",
            permissions: []
          };
        }
        return { id, name: `Role ${id}`, icon: "🔒", color: "from-slate-400 to-slate-600", permissions: [] };
      })
      .filter(Boolean);

    return mapped.length > 0 ? mapped : selectedRoles;
  };

  const handleRemoveSelectedAccess = async () => {
    if (!selectedStaff) return;
    if (rolesToRemove.length === 0) {
      alert("⚠️ Please select at least one role to remove.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${rolesToRemove.length} selected role(s) for ${selectedStaff.firstName || "this staff member"} ${selectedStaff.lastName || ""}?`
    );
    if (!confirmed) return;

    setIsRevokingAccess(true);
    try {
      const staffId = selectedStaff.profileId || selectedStaff.userId || selectedStaff.staffId || selectedStaff.id;
      const clinicId = selectedStaff.clinicId || selectedStaff.clinicID;

      if (!staffId) {
        throw new Error("Staff ID not found for removal.");
      }

      const roleNamesToRemove = rolesToRemove
        .map(roleId => {
          const fromSelected = selectedRoles.find(r => r.id === roleId);
          if (fromSelected?.name) return fromSelected.name;
          const fromAvailable = availableRoles.find(r => r.id === roleId);
          if (fromAvailable?.name) return fromAvailable.name;
          const fromApi = availableRolesFromApi.find(r => r.roleId === roleId || r.id === roleId);
          return fromApi?.roleName || fromApi?.name || null;
        })
        .filter(Boolean);

      const removePayload = {
        staffId,
        roleNames: roleNamesToRemove
      };

      const removeUrl = `${API_BASE_URL}/Authentication/RemoveAccessControl`;
      const response = await fetch(removeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(removePayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RemoveAccessControl failed: ${response.status} ${errorText}`);
      }

      const remainingRoles = selectedRoles.filter(role => !rolesToRemove.includes(role.id));
      setSelectedRoles(remainingRoles);
      setRolesToRemove([]);
      setAccessControlEntries(prev => prev.filter(entry => !rolesToRemove.includes(entry.roleId || entry.RoleId || entry.role_id)));

      setSearchResults(prev => prev.map(s => {
        if (s.id !== selectedStaff.id) return s;
        return {
          ...s,
          currentRole: remainingRoles.length > 0 ? remainingRoles[0].name : "No Access",
          rolesAssigned: remainingRoles.map(r => r.name).join(", ")
        };
      }));

      alert("✅ Selected access removed successfully.");
    } catch (error) {
      console.error("❌ Error removing selected access:", error);
      alert(`❌ Failed to remove access: ${error.message || "Unknown error"}`);
    } finally {
      setIsRevokingAccess(false);
    }
  };

  const resetAccessControl = () => {
    setSearchFilters({ staffId: "", firstName: "", lastName: "", clinicId: "", enterpriseId: "" });
    setSearchResults([]);
    setSelectedStaff(null);
    setShowRoleManager(false);
    setSelectedRoles([]);
    setAccessControlEntries([]);
    setRolesToRemove([]);
    setShowConfirmation(false);
    setFreezeAccessControlEnterprise(false);
  };

  // Tab navigation order
  const tabOrder = ["personal", "contact", "professional", "employment", "compliance", "profile"];

  // Validate required fields for each tab
  const validateTab = (tab) => {
    const errors = [];
    
    if (tab === "personal") {
      if (!doctorFormData.clinicId) errors.push("clinicId");
      if (!doctorFormData.firstName) errors.push("firstName");
      if (!doctorFormData.lastName) errors.push("lastName");
      if (!doctorFormData.dateOfBirth) errors.push("dateOfBirth");
      // Disallow future DOB
      if (doctorFormData.dateOfBirth && doctorFormData.dateOfBirth > todayISO) errors.push("dateOfBirth");
      if (!doctorFormData.gender) errors.push("gender");
      if (!doctorFormData.roleId || doctorFormData.roleId === "") errors.push("roleId");
    } else if (tab === "contact") {
      if (!doctorFormData.email) errors.push("email");
      if (doctorFormData.email && !isValidEmailWithDomain(doctorFormData.email)) errors.push("email");
      if (!doctorFormData.phone) errors.push("phone");
      if (doctorFormData.phone && doctorFormData.phone.length !== 10) errors.push("phone");
      if (!doctorFormData.emergencyContact) errors.push("emergencyContact");
      if (doctorFormData.emergencyContact && doctorFormData.emergencyContact.length !== 10) errors.push("emergencyContact");
    } else if (tab === "professional") {
      if (!isReceptionistMode) {
        if (!doctorFormData.licenseNumber) errors.push("licenseNumber");
        if (!doctorFormData.licenseExpiry) errors.push("licenseExpiry");
        if (doctorFormData.licenseExpiry && !hasValidFourDigitYear(doctorFormData.licenseExpiry)) errors.push("licenseExpiry");
        if (!doctorFormData.specialtyId) errors.push("specialtyId");
      }
    } else if (tab === "employment") {
      if (!doctorFormData.joiningDate) errors.push("joiningDate");
      if (doctorFormData.joiningDate && !hasValidFourDigitYear(doctorFormData.joiningDate)) errors.push("joiningDate");
      if (!doctorFormData.employmentStatus) errors.push("employmentStatus");
    }
    
    return errors;
  };

  // Validate all required fields before submit (covers all tabs)
  const validateBeforeSubmit = () => {
    const missing = [];
    // Personal
    if (!doctorFormData.clinicId || parseInt(doctorFormData.clinicId) <= 0) missing.push('Clinic ID');
    if (!doctorFormData.firstName?.trim()) missing.push('First Name');
    if (!doctorFormData.lastName?.trim()) missing.push('Last Name');
    if (!doctorFormData.dateOfBirth) missing.push('Date of Birth');
    if (doctorFormData.dateOfBirth && doctorFormData.dateOfBirth > todayISO) missing.push('Valid Date of Birth');
    if (!doctorFormData.gender) missing.push('Gender');
    if (!doctorFormData.roleId || doctorFormData.roleId === "") missing.push('Role');
    // Contact
    if (!doctorFormData.email?.trim()) missing.push('Email');
    if (doctorFormData.email && !isValidEmailWithDomain(doctorFormData.email)) missing.push('Valid Email with valid domain');
    if (!doctorFormData.phone?.trim()) missing.push('Phone');
    if (doctorFormData.phone?.trim() && doctorFormData.phone.length !== 10) missing.push('Valid 10-digit Phone');
    if (!doctorFormData.emergencyContact?.trim()) missing.push('Emergency Contact');
    if (doctorFormData.emergencyContact?.trim() && doctorFormData.emergencyContact.length !== 10) missing.push('Valid 10-digit Emergency Contact');
    // Professional
    if (!isReceptionistMode) {
      const specId = parseInt(doctorFormData.specialtyId);
      if (!doctorFormData.licenseNumber?.trim()) missing.push('License Number');
      if (!doctorFormData.licenseExpiry) missing.push('License Expiry');
      if (doctorFormData.licenseExpiry && !hasValidFourDigitYear(doctorFormData.licenseExpiry)) missing.push('Valid 4-digit year in License Expiry');
      if (!specId || specId <= 0 || Number.isNaN(specId)) missing.push('Specialty ID');
    }
    // Employment
    if (!doctorFormData.joiningDate) missing.push('Joining Date');
    if (doctorFormData.joiningDate && !hasValidFourDigitYear(doctorFormData.joiningDate)) missing.push('Valid 4-digit year in Joining Date');
    if (!doctorFormData.employmentStatus?.trim()) missing.push('Employment Status');
    // Receptionist-only
    if (isReceptionistMode && (!doctorFormData.roleId || doctorFormData.roleId === 0)) missing.push('Assigned Role');
    return missing;
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setDoctorFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (value && !isValidEmailWithDomain(value)) {
        setEmailError("Please enter a valid email with a valid domain");
      } else {
        setEmailError("");
      }
      return;
    }

    if (name === "phone" || name === "emergencyContact") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setDoctorFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
      return;
    }

    if ((name === "licenseExpiry" || name === "joiningDate") && value) {
      const [yearPart, monthPart, dayPart] = value.split("-");
      const normalizedYear = (yearPart || "").replace(/\D/g, "").slice(0, 4);
      const normalizedValue = [normalizedYear, monthPart, dayPart].filter(Boolean).join("-");
      setDoctorFormData(prev => ({
        ...prev,
        [name]: normalizedValue
      }));
      return;
    }

    setDoctorFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      branchId: "",
      role: "Doctor"
    });
    setActiveTab("personal");
    setShowPreview(false);
    setValidationErrors([]);
  };

  // Handle preview
  const handleShowPreview = () => {
    const errors = validateTab(activeTab);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setShowPreview(true);
  };

  // Handle doctor form submit
  const handleDoctorSubmit = async () => {
    try {
      const missing = validateBeforeSubmit();
      if (missing.length > 0) {
        setValidationErrors(prev => prev); // keep current highlights; tabs already mark fields
        alert(`Please fill required fields: ${missing.join(', ')}`);
        return;
      }

      // Get selected role name from the role ID
      const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(doctorFormData.roleId));
      const roleName = selectedRole?.roleName || "";
      console.log("🎭 Selected role:", roleName);

      // Build payload for StaffDetail API - matches the C# model exactly
      const selectedAccess = getSelectedAccess();
      const resolvedEnterpriseId = parseInt(doctorFormData.enterpriseId) || selectedAccess?.enterpriseId || null;
      const staffDetailPayload = {
        enterpriseId: resolvedEnterpriseId,
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
        rolesAssigned: roleName // ✅ Send role name, not ID
      };

      // 🔍 DEBUG LOG
      console.log("=== SENDING TO CreateRoleBasedProfile API ===");
      console.log("Full Payload:", staffDetailPayload);
      console.log("Role Name:", roleName);
      console.log("Role Name (rolesAssigned):", staffDetailPayload.rolesAssigned, "(Type:", typeof staffDetailPayload.rolesAssigned, ")");
      console.log("License Expiry:", staffDetailPayload.licenseExpiry);
      console.log("Specialty ID:", staffDetailPayload.specialtyId);
      console.log("Years Experience:", staffDetailPayload.yearsExperience);

      // Call the createStaffDetail API function
      const response = await createStaffDetail(staffDetailPayload);
      console.log("✅ Staff details saved successfully:", response);

      setShowPreview(false);
      setShowDoctorModal(false);
      setOnboardedRoleName(roleName);
      setShowSuccessModal(true);
      resetDoctorForm();

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error("❌ Error saving staff details:", error);
      const backendMessage = (error && (error.response?.data || error.message)) || "Unknown error";
      alert(`Failed to onboard staff: ${backendMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Beautiful Animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-4"
          >
            🌟 Team Hub
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Your central hub for managing doctors, administrative staff, and reception team
          </motion.p>
        </motion.div>

        {/* Sections Grid with Beautiful Tiles */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Section Header */}
              <motion.div
                className={`bg-gradient-to-r ${section.gradient} p-6 text-white relative overflow-hidden`}
              >
                <motion.div
                  animate={{
                    x: [-100, 1000],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"
                />
                <div className="relative">
                  <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
                  <p className="text-white/90">{section.description}</p>
                </div>
              </motion.div>

              {/* Options Grid - Beautiful Tiles */}
              <div className={`bg-gradient-to-br ${section.bgGradient} p-6`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.options.map((option, optIdx) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + optIdx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCardClick(option.path, option.id)}
                      className="cursor-pointer"
                    >
                      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 h-full relative overflow-hidden">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: optIdx * 0.3
                          }}
                          className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${option.color} opacity-10 rounded-full blur-2xl`}
                        />
                        <div className="relative">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`w-16 h-16 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center text-3xl mb-4 shadow-lg`}
                          >
                            {option.icon}
                          </motion.div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {option.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {option.description}
                          </p>
                          <motion.div
                            className="flex items-center text-sm font-semibold"
                            whileHover={{ x: 5 }}
                          >
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${option.color}`}>
                              Go to page →
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info Card with Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-amber-500 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl"
            >
              💡
            </motion.span>
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-2">Quick Tip</h3>
              <p className="text-amber-800">
                Use the <strong>Doctors Lounge</strong> to manage all physician-related tasks, including onboarding, 
                profile management, and clinic assignments. Administrative and reception staff can be managed 
                through their respective sections for streamlined workflow!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Doctor Onboarding Modal */}
      <AnimatePresence>
        {showDoctorModal && !showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDoctorModal(false);
              resetDoctorForm();
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
                      Onboard Staff
                    </h2>
                    <p className="text-purple-100 mt-1">Fill in all required information to add a new team member to your organization</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDoctorModal(false);
                      resetDoctorForm();
                    }}
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
                      onClick={() => setActiveTab(tab.id)}
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
                          Clinic ID <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="clinicId"
                          value={doctorFormData.clinicId}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("clinicId") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                          disabled={!doctorFormData.enterpriseId}
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
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Assign Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="roleId"
                          value={doctorFormData.roleId || ""}
                          onChange={(e) => {
                            const selectedRoleId = e.target.value;
                            const selectedRole = availableRolesFromApi.find(r => r.roleId === parseInt(selectedRoleId));
                            console.log("🎭 Role selected:", selectedRole);
                            setDoctorFormData(prev => ({
                              ...prev,
                              roleId: selectedRoleId,
                              role: selectedRole?.roleName || "",
                              rolesAssigned: selectedRoleId
                            }));
                          }}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("roleId") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                        >
                          <option value="">{loadingRoles ? "Loading roles..." : "Select role"}</option>
                          {availableRolesFromApi.map((role) => (
                            <option key={role.roleId} value={role.roleId}>
                              {role.roleName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={doctorFormData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("firstName") ? "border-red-500 bg-red-50" : "border-purple-300"
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
                          name="lastName"
                          value={doctorFormData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("lastName") ? "border-red-500 bg-red-50" : "border-purple-300"
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
                          name="dateOfBirth"
                          value={doctorFormData.dateOfBirth}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("dateOfBirth") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                          max={todayISO}
                          title="Date of birth cannot be in the future"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="gender"
                          value={doctorFormData.gender}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("gender") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
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
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={doctorFormData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            (validationErrors.includes("email") || emailError) ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                          placeholder="doctor@example.com"
                        />
                        {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Phone <span className="text-red-500">*</span>
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
                          <input
                            type="tel"
                            name="phone"
                            value={doctorFormData.phone}
                            onChange={handleInputChange}
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            className={`flex-1 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              validationErrors.includes("phone") ? "border-red-500 bg-red-50" : "border-purple-300"
                            }`}
                            placeholder="Enter 10-digit phone number"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={doctorFormData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter full address"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Emergency Contact <span className="text-red-500">*</span>
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
                          <input
                            type="tel"
                            name="emergencyContact"
                            value={doctorFormData.emergencyContact}
                            onChange={handleInputChange}
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            className={`flex-1 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              validationErrors.includes("emergencyContact") ? "border-red-500 bg-red-50" : "border-purple-300"
                            }`}
                            placeholder="Enter 10-digit emergency contact number"
                          />
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
                    {/* Check if role requires academic/license fields */}
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
                                License Number {requiresAcademic && !isAdmin ? <span className="text-red-500">*</span> : null}
                              </label>
                              <input
                                type="text"
                                name="licenseNumber"
                                value={doctorFormData.licenseNumber}
                                onChange={handleInputChange}
                                disabled={disableClinicalFields}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  disableClinicalFields ? "border-gray-200 " + disabledClass : validationErrors.includes("licenseNumber") ? "border-red-500 bg-red-50" : "border-purple-300"
                                }`}
                                placeholder="Medical license number"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                License Expiry {requiresAcademic && !isAdmin ? <span className="text-red-500">*</span> : null}
                              </label>
                              <input
                                type="date"
                                name="licenseExpiry"
                                value={doctorFormData.licenseExpiry}
                                onChange={handleInputChange}
                                min="1000-01-01"
                                max="9999-12-31"
                                disabled={disableClinicalFields}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  disableClinicalFields ? "border-gray-200 " + disabledClass : validationErrors.includes("licenseExpiry") ? "border-red-500 bg-red-50" : "border-purple-300"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Specialty ID {requiresAcademic && !isAdmin ? <span className="text-red-500">*</span> : null}
                              </label>
                              <input
                                type="text"
                                name="specialtyId"
                                value={doctorFormData.specialtyId}
                                onChange={handleInputChange}
                                disabled={disableClinicalFields}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  disableClinicalFields ? "border-gray-200 " + disabledClass : validationErrors.includes("specialtyId") ? "border-red-500 bg-red-50" : "border-purple-300"
                                }`}
                                placeholder="Specialty ID"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Years of Experience <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                name="yearsExperience"
                                value={doctorFormData.yearsExperience}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  validationErrors.includes("yearsExperience") ? "border-red-500 bg-red-50" : "border-purple-300"
                                }`}
                                placeholder="Years"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-purple-900 mb-2">
                                Education <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                name="education"
                                value={doctorFormData.education}
                                onChange={handleInputChange}
                                rows={2}
                                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                  validationErrors.includes("education") ? "border-red-500 bg-red-50" : "border-purple-300"
                                }`}
                                placeholder="Educational qualifications"
                              />
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
                          Joining Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="joiningDate"
                          value={doctorFormData.joiningDate}
                          onChange={handleInputChange}
                          min="1000-01-01"
                          max="9999-12-31"
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("joiningDate") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Employment Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="employmentStatus"
                          value={doctorFormData.employmentStatus}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("employmentStatus") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                        >
                          <option value="">Select status</option>
                          <option value="Full-Time">Full-Time</option>
                          <option value="Part-Time">Part-Time</option>
                          <option value="Contract">Contract</option>
                        </select>
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

                {validationErrors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-red-700 font-semibold">Please fill in all required fields marked with *</p>
                  </div>
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
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
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
              exit={{ scale: 0.9 }}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:shadow-lg transition-all"
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
              
              <div className="text-center space-y-3">
                <p className="text-xl font-semibold text-green-800">
                  {onboardedRoleName} successfully onboarded! 🏥
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  className="text-6xl mb-4"
                >
                  🎯
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Confirm Role Assignment</h3>
                <p className="text-slate-600">Review the roles you're about to assign</p>
              </div>

              {/* Staff Info */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xl">
                    👤
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{selectedStaff?.firstName} {selectedStaff?.lastName}</h4>
                    <p className="text-sm text-slate-600">Staff ID: {selectedStaff?.staffId}</p>
                  </div>
                </div>
              </div>

              {/* Selected Roles Display */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-700 mb-3">Roles to be assigned:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRoles.map((role, index) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-gradient-to-br ${role.color} rounded-lg p-3 text-white`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{role.icon}</span>
                        <div className="flex-1">
                          <h5 className="font-bold text-sm">{role.name}</h5>
                          <p className="text-xs text-white/80">{role.permissions.length} permissions</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-6">
                <p className="text-blue-900 text-sm">
                  <strong>Total Permissions:</strong> {[...new Set(selectedRoles.flatMap(r => r.permissions))].length} unique access rights will be granted
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmAssignment}
                  disabled={isAssigningRoles}
                  className={`flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg transition-all ${
                    isAssigningRoles ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isAssigningRoles ? '⏳ Assigning...' : '✓ Confirm & Assign'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Access Control Modal */}
      <AnimatePresence>
        {showAccessControlModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAccessControlModal(false);
              resetAccessControl();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <span className="text-4xl">🔐</span>
                      Access Control Center
                    </h2>
                    <p className="text-purple-100 mt-1">Search and manage staff role permissions</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAccessControlModal(false);
                      resetAccessControl();
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {!showRoleManager ? (
                  <>
                    {/* Tab Navigation */}
                    <div className="mb-6 flex gap-2 border-b-2 border-slate-200">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAccessControlTab("assign");
                          setSelectedStaff(null);
                          setSearchResults([]);
                          setSearchFilters(prev => ({ ...prev, staffId: "", firstName: "", lastName: "", clinicId: "" }));
                        }}
                        className={`px-6 py-3 font-bold text-lg transition-all flex items-center gap-2 ${
                          accessControlTab === "assign"
                            ? "text-violet-600 border-b-4 border-violet-600"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <span className="text-2xl">➕</span>
                        Assign Roles
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAccessControlTab("remove");
                          setSelectedStaff(null);
                          setSearchResults([]);
                          setSearchFilters(prev => ({ ...prev, staffId: "", firstName: "", lastName: "", clinicId: "" }));
                        }}
                        className={`px-6 py-3 font-bold text-lg transition-all flex items-center gap-2 ${
                          accessControlTab === "remove"
                            ? "text-red-600 border-b-4 border-red-600"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <span className="text-2xl">🛑</span>
                        Remove Access
                      </motion.button>
                    </div>

                    {/* Search Filters */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔍</span>
                        {accessControlTab === "assign" ? "Search Staff - Assign Roles" : "Search Staff - Remove Access"}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Staff ID</label>
                          <input
                            type="text"
                            value={searchFilters.staffId}
                            onChange={(e) => setSearchFilters({ ...searchFilters, staffId: e.target.value })}
                            placeholder="e.g., S001"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={searchFilters.firstName}
                            onChange={(e) => setSearchFilters({ ...searchFilters, firstName: e.target.value })}
                            placeholder="e.g., John"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={searchFilters.lastName}
                            onChange={(e) => setSearchFilters({ ...searchFilters, lastName: e.target.value })}
                            placeholder="e.g., Doe"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic ID</label>
                          <input
                            type="text"
                            value={searchFilters.clinicId}
                            onChange={(e) => setSearchFilters({ ...searchFilters, clinicId: e.target.value })}
                            placeholder="e.g., C001"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSearchStaff}
                          disabled={isSearching}
                          className={`flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all ${
                            isSearching ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isSearching ? '⏳ Searching...' : '🔍 Search Staff'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSearchFilters(prev => ({ ...prev, staffId: "", firstName: "", lastName: "", clinicId: "" }));
                            setSearchResults([]);
                          }}
                          className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all"
                        >
                          🧹 Clear Filters
                        </motion.button>
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">👥</span>
                          Search Results ({searchResults.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.map((staff) => (
                            <motion.div
                              key={staff.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.03, y: -5 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSelectStaff(staff)}
                              className="relative cursor-pointer bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all"
                            >
                              <div className="flex items-center gap-4 mb-3">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
                                  👤
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 text-lg">
                                    🆔 {staff.staffId || 'N/A'}
                                  </h4>
                                  <p className="text-sm text-slate-700 font-semibold">
                                    {staff.fullName || (staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : (staff.firstName || staff.lastName || '(Name not available)'))}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-600">Role:</span>
                                  <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full font-semibold text-xs">
                                    {staff.currentRole}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <span>📍</span>
                                  <span>Clinic: {staff.clinicId}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <span>✉️</span>
                                  <span className="truncate">{staff.email}</span>
                                </div>
                              </div>
                              <div className="mt-3 text-center">
                                <span className="text-purple-600 font-semibold text-sm">Click to manage roles →</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.length === 0 && searchFilters.staffId === "" && searchFilters.firstName === "" && searchFilters.lastName === "" && searchFilters.clinicId === "" && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-slate-500 text-lg">Enter search criteria to find staff members</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Role Manager View */
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {/* Staff Info Header */}
                    <div className="bg-gradient-to-r from-violet-100 to-purple-100 rounded-xl p-6 mb-6 border-2 border-purple-300">
                      <button
                        onClick={() => setShowRoleManager(false)}
                        className="mb-4 text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-2"
                      >
                        ← Back to Search
                      </button>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-3xl shadow-lg">
                          👤
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{selectedStaff?.firstName} {selectedStaff?.lastName}</h3>
                          <p className="text-slate-600">Staff ID: {selectedStaff?.staffId} | Current Role: <span className="font-semibold text-purple-700">{selectedStaff?.currentRole}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Mode Selection Hidden - Only Multi-Select Available */}

                    {/* Selected/Current Roles Counter */}
                    {accessControlTab === "assign" && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {selectedRoles.length}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">Selected Roles</h4>
                            <p className="text-sm text-slate-600">
                              {selectedRoles.length === 0 ? "No roles selected" : selectedRoles.map(r => r.name).join(", ")}
                            </p>
                          </div>
                        </div>
                        {selectedRoles.length > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedRoles([])}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-all"
                          >
                            Clear All
                          </motion.button>
                        )}
                      </div>
                    </div>
                    )}

                    {accessControlTab === "remove" && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {selectedRoles.length}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">Currently Assigned Roles</h4>
                            <p className="text-sm text-slate-600">
                              {selectedRoles.length === 0 ? "No roles currently assigned" : selectedRoles.map(r => r.name).join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Remove Access Card */}
                    {getRemovableRoles().length > 0 && accessControlTab === "remove" && (
                      <div className="mb-6 bg-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4 text-white">
                          <h4 className="text-lg font-bold flex items-center gap-2">
                            <span className="text-2xl">🛑</span>
                            Remove Access
                          </h4>
                          <p className="text-red-100 text-sm">Select which roles to remove for this staff member.</p>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {getRemovableRoles().map(role => (
                              <label key={role.id} className="flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rolesToRemove.includes(role.id)}
                                  onChange={() => {
                                    setRolesToRemove(prev =>
                                      prev.includes(role.id)
                                        ? prev.filter(id => id !== role.id)
                                        : [...prev, role.id]
                                    );
                                  }}
                                  className="w-4 h-4 text-red-600 rounded"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{role.icon || "🔒"}</span>
                                  <span className="font-semibold text-slate-700">{role.name}</span>
                                </div>
                              </label>
                            ))}
                          </div>

                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="text-sm text-slate-600">
                              Selected: <span className="font-semibold">{rolesToRemove.length}</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleRemoveSelectedAccess}
                              disabled={isRevokingAccess || rolesToRemove.length === 0}
                              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                isRevokingAccess || rolesToRemove.length === 0
                                  ? "bg-red-200 text-red-500 cursor-not-allowed"
                                  : "bg-red-500 hover:bg-red-600 text-white"
                              }`}
                            >
                              {isRevokingAccess ? "⏳ Removing..." : "Remove Selected"}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    )}

                    {getRemovableRoles().length === 0 && accessControlTab === "remove" && (
                      <div className="text-center py-12 bg-red-50 rounded-xl border-2 border-red-200">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-slate-600 text-lg font-semibold">No roles to remove</p>
                        <p className="text-slate-500">This staff member currently has no assigned roles.</p>
                      </div>
                    )}

                    {/* Role Selection - Different Modes */}
                    {roleSelectionMode === "multi-select" && accessControlTab === "assign" && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">☑️</span>
                          Multi-Select Cards
                        </h3>
                        <div className="grid grid-cols-5 gap-4">
                          {availableRoles.map((role, index) => {
                            const isSelected = selectedRoles.find(r => r.id === role.id);
                            return (
                              <motion.div
                                key={role.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleToggleRole(role)}
                                className="relative cursor-pointer group"
                              >
                                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${role.color} p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border-4 ${
                                  isSelected ? 'border-yellow-400' : 'border-transparent'
                                }`}>
                                  <motion.div
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "200%" }}
                                    transition={{ duration: 0.6 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                  />
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      className="absolute top-2 right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg z-20"
                                    >
                                      <span className="text-slate-800 font-bold text-lg">✓</span>
                                    </motion.div>
                                  )}
                                  <div className="relative z-10 text-center">
                                    <motion.div
                                      animate={isSelected ? { rotate: [0, -10, 10, -10, 0], scale: 1.1 } : {}}
                                      transition={{ duration: 0.5 }}
                                      className="text-4xl mb-2"
                                    >
                                      {role.icon}
                                    </motion.div>
                                    <h4 className="text-base font-bold text-white mb-1">{role.name}</h4>
                                    <p className="text-white/90 text-xs mb-2">{role.description}</p>
                                    <div className="mt-2 space-y-1">
                                      {role.permissions.slice(0, 2).map((perm, i) => (
                                        <div key={i} className="text-[10px] text-white/80 bg-white/20 rounded px-2 py-0.5">
                                          {perm}
                                        </div>
                                      ))}
                                      {role.permissions.length > 2 && (
                                        <div className="text-[10px] text-white/80">+{role.permissions.length - 2} more</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {roleSelectionMode === "drag-drop" && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          Drag & Drop Roles
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Available Roles Pool */}
                          <div className="bg-slate-50 rounded-xl p-4 border-2 border-dashed border-slate-300">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                              <span>📦</span> Available Roles
                            </h4>
                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                              {availableRoles.filter(r => !selectedRoles.find(s => s.id === r.id)).map((role) => (
                                <motion.div
                                  key={role.id}
                                  drag
                                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                  whileDrag={{ scale: 1.1, rotate: 5, cursor: "grabbing" }}
                                  onClick={() => handleToggleRole(role)}
                                  className={`bg-gradient-to-br ${role.color} rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-md`}
                                >
                                  <div className="text-center text-white">
                                    <div className="text-3xl mb-1">{role.icon}</div>
                                    <div className="text-xs font-bold">{role.name}</div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Drop Zone */}
                          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border-2 border-dashed border-purple-400">
                            <h4 className="font-bold text-purple-700 mb-3 flex items-center gap-2">
                              <span>✅</span> Assigned Roles (Click to remove)
                            </h4>
                            {selectedRoles.length === 0 ? (
                              <div className="h-64 flex items-center justify-center text-center">
                                <div>
                                  <div className="text-6xl mb-2">👈</div>
                                  <p className="text-slate-500">Click roles from the left to assign</p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                {selectedRoles.map((role) => (
                                  <motion.div
                                    key={role.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => handleToggleRole(role)}
                                    className={`bg-gradient-to-br ${role.color} rounded-lg p-3 cursor-pointer shadow-lg border-2 border-yellow-400`}
                                  >
                                    <div className="text-center text-white relative">
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <span className="text-slate-800 text-xs font-bold">✓</span>
                                      </div>
                                      <div className="text-3xl mb-1">{role.icon}</div>
                                      <div className="text-xs font-bold">{role.name}</div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {roleSelectionMode === "toggle-switch" && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">🎚️</span>
                          Toggle Switches
                        </h3>
                        <div className="space-y-2">
                          {availableRoles.map((role) => {
                            const isSelected = selectedRoles.find(r => r.id === role.id);
                            return (
                              <motion.div
                                key={role.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                  isSelected 
                                    ? `bg-gradient-to-r ${role.color} border-yellow-400 shadow-lg` 
                                    : 'bg-white border-slate-200 hover:border-purple-300'
                                }`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="text-4xl">{role.icon}</div>
                                  <div className="flex-1">
                                    <h4 className={`font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>{role.name}</h4>
                                    <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-600'}`}>{role.description}</p>
                                    <div className="flex gap-2 mt-1">
                                      {role.permissions.slice(0, 3).map((perm, i) => (
                                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {perm}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleToggleRole(role)}
                                  className={`relative w-16 h-8 rounded-full transition-all ${
                                    isSelected ? 'bg-yellow-400' : 'bg-slate-300'
                                  }`}
                                >
                                  <motion.div
                                    animate={{ x: isSelected ? 32 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg ${
                                      isSelected ? 'bg-white' : 'bg-slate-500'
                                    }`}
                                  />
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {roleSelectionMode === "permission-builder" && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">🔧</span>
                          Custom Permission Builder
                        </h3>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 mb-4">
                          <p className="text-blue-900 mb-2"><strong>Build custom access by selecting individual permissions</strong></p>
                          <p className="text-sm text-blue-700">Roles with matching permissions will be auto-selected</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Permission Categories */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-700">Select Permissions:</h4>
                            {[
                              { category: "System Access", perms: ["All Access", "User Management", "System Settings", "Audit Logs"] },
                              { category: "Clinical", perms: ["Patient Records", "Prescriptions", "Surgery", "Treatments", "Appointments"] },
                              { category: "Operations", perms: ["Staff Management", "Inventory", "Reports", "Equipment"] },
                              { category: "Financial", perms: ["Billing", "Payments", "Insurance", "Invoices", "Payroll"] }
                            ].map((cat) => (
                              <div key={cat.category} className="bg-white rounded-lg p-4 border border-slate-200">
                                <h5 className="font-bold text-slate-800 mb-2">{cat.category}</h5>
                                <div className="space-y-2">
                                  {cat.perms.map((perm) => {
                                    const rolesWithPerm = availableRoles.filter(r => r.permissions.includes(perm));
                                    const hasSelectedRole = rolesWithPerm.some(r => selectedRoles.find(s => s.id === r.id));
                                    return (
                                      <label key={perm} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                        <input
                                          type="checkbox"
                                          checked={hasSelectedRole}
                                          onChange={() => {
                                            // Auto-select roles with this permission
                                            rolesWithPerm.forEach(role => {
                                              if (!selectedRoles.find(r => r.id === role.id)) {
                                                handleToggleRole(role);
                                              }
                                            });
                                          }}
                                          className="w-4 h-4 text-purple-600 rounded"
                                        />
                                        <span className="text-sm text-slate-700">{perm}</span>
                                        <span className="text-xs text-slate-500">({rolesWithPerm.length})</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Selected Roles Preview */}
                          <div>
                            <h4 className="font-bold text-slate-700 mb-3">Auto-Selected Roles:</h4>
                            {selectedRoles.length === 0 ? (
                              <div className="bg-slate-50 rounded-lg p-8 text-center border-2 border-dashed border-slate-300">
                                <div className="text-5xl mb-2">👈</div>
                                <p className="text-slate-500">Select permissions to auto-assign roles</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {selectedRoles.map((role) => (
                                  <motion.div
                                    key={role.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`bg-gradient-to-r ${role.color} rounded-lg p-4 text-white shadow-lg`}
                                  >
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-3xl">{role.icon}</span>
                                      <div className="flex-1">
                                        <h5 className="font-bold">{role.name}</h5>
                                        <p className="text-xs text-white/80">{role.description}</p>
                                      </div>
                                      <button
                                        onClick={() => handleToggleRole(role)}
                                        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="text-xs text-white/80">
                                      <strong>{role.permissions.length} permissions:</strong> {role.permissions.join(", ")}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Action Buttons - Only Show for Assign Tab */}
                    {accessControlTab === "assign" && (
                    <div className="mt-6 flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowRoleManager(false)}
                        className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
                      >
                        ← Back to Search
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApplyRoles}
                        disabled={selectedRoles.length === 0}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg ${
                          selectedRoles.length === 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white'
                        }`}
                      >
                        Apply {selectedRoles.length > 0 && `(${selectedRoles.length})`} Role{selectedRoles.length !== 1 && 's'} →
                      </motion.button>
                    </div>
                    )}

                    {/* Back Button - Only Show for Remove Tab */}
                    {accessControlTab === "remove" && (
                    <div className="mt-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowRoleManager(false)}
                        className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
                      >
                        ← Back to Search
                      </motion.button>
                    </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                      <p className="text-blue-900 flex items-center gap-2">
                        <span className="text-2xl">💡</span>
                        <span><strong>Multi-Select Mode:</strong> Click multiple role cards to assign several roles to {selectedStaff?.firstName}. Selected roles will show a yellow checkmark and border.</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup with Animations */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowSuccessPopup(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Confetti Animation Background */}
              <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 p-8 text-center overflow-hidden">
                {/* Animated confetti particles */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 1 }}
                    animate={{ 
                      y: [null, 200],
                      x: [null, Math.random() * 200 - 100],
                      rotate: [null, Math.random() * 360],
                      opacity: [null, 0]
                    }}
                    transition={{ 
                      duration: 2 + Math.random(),
                      delay: Math.random() * 0.5,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      backgroundColor: ['#fbbf24', '#f472b6', '#a78bfa', '#60a5fa', '#34d399'][i % 5]
                    }}
                  />
                ))}
                
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative z-10"
                >
                  <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="text-6xl"
                    >
                      🎉
                    </motion.div>
                  </div>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2 relative z-10"
                >
                  Boom! Roles Assigned! 🚀
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg relative z-10"
                >
                  That was smoother than butter! 🧈
                </motion.p>
              </div>
              
              {/* Details Section */}
              <div className="p-6 bg-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <span className="text-3xl">👤</span>
                    <div>
                      <p className="text-sm text-slate-600">Superstar</p>
                      <p className="font-bold text-slate-800">{successMessage.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <span className="text-3xl">🎭</span>
                    <div>
                      <p className="text-sm text-slate-600">New Powers Unlocked</p>
                      <p className="font-bold text-slate-800">{successMessage.roles}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <span className="text-3xl">💾</span>
                    <div>
                      <p className="text-sm text-slate-600">Database Magic</p>
                      <p className="font-bold text-slate-800">{successMessage.count} record{successMessage.count > 1 ? 's' : ''} created</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-sm text-slate-500 italic mt-4"
                  >
                    "With great power comes great responsibility!" 🦸‍♂️
                  </motion.div>
                </motion.div>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  Awesome! 🎊
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credential Management Modal */}
      <AnimatePresence>
        {showCredentialManagementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCredentialManagementModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">🔐 Create User Credential</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCredentialManagementModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <form onSubmit={handleCredentialSubmit} className="space-y-6">
                  {/* Organization Assignment - FIRST (Mandatory) */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">🏢 Organization Assignment</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Enterprise <span className="text-red-500">*</span></label>
                        <select
                          value={credentialFormData.enterpriseId}
                          onChange={(e) => {
                            const enterpriseId = parseInt(e.target.value) || 0;
                            setCredentialFormData(prev => ({
                              ...prev,
                              enterpriseId,
                              clinicId: 0
                            }));
                            setCredentialError("");
                            loadClinicsForCredential(enterpriseId);
                          }}
                          className={`w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none ${freezeCredentialEnterprise ? 'bg-gray-100 cursor-not-allowed opacity-90' : ''}`}
                          disabled={freezeCredentialEnterprise}
                        >
                          <option value="0">-- Select Enterprise --</option>
                          {allEnterprises.map((enterprise) => (
                            <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                              [{enterprise.enterpriseId}] {enterprise.enterpriseName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic <span className="text-red-500">*</span></label>
                        <select
                          value={credentialFormData.clinicId}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, clinicId: parseInt(e.target.value) || 0 }))}
                          disabled={credentialFormData.enterpriseId === 0}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="0">-- Select Clinic --</option>
                          {credentialClinics.map((clinic) => (
                            <option key={clinic.clinicId} value={clinic.clinicId}>
                              [{clinic.clinicId}] {clinic.clinicName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information - SECOND */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">👤 Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">First Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={credentialFormData.firstName}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={credentialFormData.lastName}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                          placeholder="Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={credentialFormData.email}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          value={credentialFormData.mobileNumber}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                          placeholder="e.g., +91 9876543210"
                          title="Enter mobile with country code (e.g., +91 9876543210). Only digits will be sent to API."
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code with + (e.g., +91 9876543210). Only digits used for login.</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">🔐 Account Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          value={credentialFormData.password}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          value={credentialFormData.confirmPassword}
                          onChange={(e) => setCredentialFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Role <span className="text-red-500">*</span></label>
                        <select
                          value={credentialFormData.roleId}
                          onChange={(e) => {
                            const roleId = parseInt(e.target.value) || 0;
                            const selectedRole = roleOptions.find(role => role.roleId === roleId || role.id === roleId);
                            const roleName = selectedRole ? (selectedRole.roleName || selectedRole.name || "") : "";
                            console.log("🎯 Role Selected - ID:", roleId);
                            console.log("🎯 Selected Role Object:", selectedRole);
                            console.log("🎯 Role Name:", roleName);
                            setCredentialFormData(prev => {
                              const updated = { ...prev, roleId: roleId, roleName: roleName };
                              console.log("✅ Updated credentialFormData:", updated);
                              return updated;
                            });
                          }}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        >
                          <option value="0">{rolesLoading ? "Loading roles..." : "-- Select Role --"}</option>
                          {roleOptions.map((role) => (
                            <option key={role.roleId || role.id} value={role.roleId || role.id}>
                              {role.roleName || role.name || role.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {credentialError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                      <span>⚠️</span> {credentialError}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={credentialLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {credentialLoading ? "Registering..." : "🔐 Register Credential"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credential Success Modal */}
      <AnimatePresence>
        {showCredentialSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                ✅
              </motion.div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
              <p className="text-slate-600 mb-4">Credential registered successfully</p>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-slate-600 mb-2">MOBILE NUMBER</p>
                <p className="text-xl font-bold text-slate-800 break-all">{credentialSuccessUsername}</p>
              </div>
              <p className="text-sm text-gray-500">Closing in a moment...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Questions Modal */}
      <AnimatePresence>
        {showSecurityQuestionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSecurityQuestionsModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 border-b-4 border-red-600">
                <h2 className="text-2xl font-bold">🔒 Set Security Questions</h2>
                <p className="text-red-100 text-sm mt-1">
                  {securityQuestionStep === 'selection' 
                    ? 'Select enterprise, clinic, and doctor'
                    : 'Answer the security questions'}
                </p>
              </div>

              <div className="p-8">
                {/* Error Message */}
                {securityQuestionsError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold"
                  >
                    ⚠️ {securityQuestionsError}
                  </motion.div>
                )}

                {/* Selection Step */}
                {securityQuestionStep === 'selection' && (
                  <form onSubmit={handleSecurityQuestionsSubmit} className="space-y-6">
                    {/* Enterprise Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Enterprise ID <span className="text-red-500">*</span></label>
                      <select
                        value={securityQuestionsFormData.enterpriseId}
                        onChange={(e) => {
                          const enterpriseId = parseInt(e.target.value);
                          setSecurityQuestionsFormData(prev => ({ ...prev, enterpriseId, clinicId: 0, doctorId: '', doctorName: '' }));
                          loadClinicsForSecurityQuestions(enterpriseId);
                          // Load doctors from entire enterprise initially
                          loadDoctorsForSecurityQuestions(enterpriseId, null);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select Enterprise</option>
                        {allEnterprises.map(enterprise => (
                          <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                            {enterprise.enterpriseName || enterprise.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Clinic Selection - Optional */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Clinic ID <span className="text-gray-500 text-sm">(Optional)</span></label>
                      <select
                        value={securityQuestionsFormData.clinicId}
                        onChange={(e) => {
                          const clinicId = parseInt(e.target.value) || 0;
                          setSecurityQuestionsFormData(prev => ({ ...prev, clinicId, doctorId: '', doctorName: '' }));
                          // Load doctors from clinic if selected, otherwise from entire enterprise
                          loadDoctorsForSecurityQuestions(securityQuestionsFormData.enterpriseId, clinicId || null);
                        }}
                        disabled={!securityQuestionsFormData.enterpriseId}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">-- All Clinics in Enterprise --</option>
                        {securityQuestionsClinics.map(clinic => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            {clinic.clinicName || clinic.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Leave blank to see doctors from all clinics in this enterprise</p>
                    </div>

                    {/* Doctor Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Select Doctor <span className="text-red-500">*</span></label>
                      <p className="text-xs text-gray-600 mb-2">From {securityQuestionsFormData.clinicId ? 'selected clinic' : 'enterprise'}</p>
                      <select
                        value={securityQuestionsFormData.doctorId}
                        onChange={(e) => {
                          const doctorId = e.target.value;
                          const selectedDoctor = securityQuestionsDoctors.find(d => d.doctorId.toString() === doctorId);
                          setSecurityQuestionsFormData(prev => ({ 
                            ...prev, 
                            doctorId,
                            doctorName: selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : ''
                          }));
                        }}
                        disabled={!securityQuestionsFormData.enterpriseId}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">Select Doctor</option>
                        {securityQuestionsDoctors.map(doctor => (
                          <option key={doctor.doctorId} value={doctor.doctorId}>
                            {doctor.firstName} {doctor.lastName} ({doctor.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Doctor Info */}
                    {securityQuestionsFormData.doctorName && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg"
                      >
                        <p className="text-sm font-semibold text-blue-800">
                          Selected: <span className="text-blue-600">{securityQuestionsFormData.doctorName}</span>
                        </p>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={securityQuestionsLoading || !securityQuestionsFormData.doctorId}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ➜ Next: Answer Questions
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setShowSecurityQuestionsModal(false)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                      >
                        ❌ Cancel
                      </motion.button>
                    </div>
                  </form>
                )}

                {/* Questions Step */}
                {securityQuestionStep === 'questions' && (
                  <form onSubmit={handleSecurityQuestionsSubmit} className="space-y-6">
                    {/* Doctor Name Display */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg"
                    >
                      <p className="text-sm font-semibold text-blue-800">Doctor: <span className="text-blue-600">{securityQuestionsFormData.doctorName}</span></p>
                    </motion.div>

                    {/* Security Questions */}
                    <div className="space-y-6">
                      {standardSecurityQuestions.map((question, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Q{index + 1}. {question}
                          </label>
                          <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="text"
                            value={securityQuestionsFormData.answers[index] || ''}
                            onChange={(e) => {
                              setSecurityQuestionsFormData(prev => ({
                                ...prev,
                                answers: { ...prev.answers, [index]: e.target.value }
                              }));
                              setSecurityQuestionsError("");
                            }}
                            placeholder="Your answer"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setSecurityQuestionStep('selection')}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                      >
                        ← Back
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={securityQuestionsLoading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {securityQuestionsLoading ? '⏳ Saving...' : '✅ Save Security Answers'}
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamHub;


