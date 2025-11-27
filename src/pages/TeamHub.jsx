import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createDoctor } from '../services/doctorService';

const TeamHub = () => {
  const navigate = useNavigate();
  
  // Doctor Onboarding Modal States
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Access Control Modal States
  const [showAccessControlModal, setShowAccessControlModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    staffId: "",
    firstName: "",
    lastName: "",
    clinicId: ""
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [roleSelectionMode, setRoleSelectionMode] = useState("multi-select"); // multi-select, drag-drop, toggle-switch, permission-builder
  
  // Expanded roles with permissions
  const availableRoles = [
    { 
      id: 1, 
      name: "Super Admin", 
      icon: "👑", 
      color: "from-purple-500 to-indigo-600", 
      description: "Complete system control",
      permissions: ["All Access", "User Management", "System Settings", "Audit Logs"]
    },
    { 
      id: 2, 
      name: "Clinic Admin", 
      icon: "🏥", 
      color: "from-blue-500 to-cyan-500", 
      description: "Clinic-level administration",
      permissions: ["Clinic Settings", "Staff Management", "Reports", "Inventory"]
    },
    { 
      id: 3, 
      name: "Senior Doctor", 
      icon: "👨‍⚕️", 
      color: "from-teal-400 to-emerald-400", 
      description: "Advanced medical access",
      permissions: ["Patient Records", "Prescriptions", "Surgery", "Supervise Staff"]
    },
    { 
      id: 4, 
      name: "Doctor", 
      icon: "🩺", 
      color: "from-cyan-400 to-blue-400", 
      description: "Standard medical care",
      permissions: ["Patient Records", "Prescriptions", "Treatments", "Appointments"]
    },
    { 
      id: 5, 
      name: "Dental Hygienist", 
      icon: "🦷", 
      color: "from-green-400 to-teal-400", 
      description: "Preventive dental care",
      permissions: ["Cleanings", "X-Rays", "Patient Education", "Basic Exams"]
    },
    { 
      id: 6, 
      name: "Nurse", 
      icon: "👩‍⚕️", 
      color: "from-pink-400 to-rose-400", 
      description: "Patient care support",
      permissions: ["Patient Records", "Vital Signs", "Assist Procedures", "Medications"]
    },
    { 
      id: 7, 
      name: "Receptionist", 
      icon: "📞", 
      color: "from-rose-400 to-pink-400", 
      description: "Front desk operations",
      permissions: ["Appointments", "Check-in/out", "Phone Calls", "Basic Info"]
    },
    { 
      id: 8, 
      name: "Practice Manager", 
      icon: "💼", 
      color: "from-emerald-400 to-teal-400", 
      description: "Operations management",
      permissions: ["Staff Scheduling", "Inventory", "Reports", "Billing Overview"]
    },
    { 
      id: 9, 
      name: "Financial Manager", 
      icon: "💰", 
      color: "from-amber-400 to-orange-400", 
      description: "Financial operations",
      permissions: ["Billing", "Payments", "Insurance", "Financial Reports"]
    },
    { 
      id: 10, 
      name: "Accountant", 
      icon: "📊", 
      color: "from-orange-400 to-amber-400", 
      description: "Accounting & bookkeeping",
      permissions: ["Invoices", "Expenses", "Tax Records", "Payroll"]
    },
    { 
      id: 11, 
      name: "Lab Technician", 
      icon: "🔬", 
      color: "from-indigo-400 to-purple-400", 
      description: "Laboratory operations",
      permissions: ["Lab Tests", "Equipment", "Results Entry", "Quality Control"]
    },
    { 
      id: 12, 
      name: "Pharmacist", 
      icon: "💊", 
      color: "from-violet-400 to-purple-400", 
      description: "Medication management",
      permissions: ["Prescriptions", "Drug Inventory", "Dispensing", "Drug Info"]
    },
    { 
      id: 13, 
      name: "Radiologist", 
      icon: "📷", 
      color: "from-slate-400 to-slate-500", 
      description: "Imaging specialist",
      permissions: ["X-Rays", "Imaging", "Results", "Equipment"]
    },
    { 
      id: 14, 
      name: "IT Support", 
      icon: "💻", 
      color: "from-blue-400 to-indigo-400", 
      description: "Technical support",
      permissions: ["System Access", "Troubleshooting", "Backups", "Updates"]
    },
    { 
      id: 15, 
      name: "Marketing", 
      icon: "📢", 
      color: "from-pink-400 to-fuchsia-400", 
      description: "Marketing & outreach",
      permissions: ["Campaigns", "Social Media", "Analytics", "Patient Engagement"]
    },
    { 
      id: 16, 
      name: "HR Manager", 
      icon: "👥", 
      color: "from-teal-400 to-cyan-400", 
      description: "Human resources",
      permissions: ["Recruitment", "Onboarding", "Performance", "Leave Management"]
    }
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

  const sections = [
    {
      id: 'doctors-lounge',
      title: "👨‍⚕️ Doctors Lounge",
      description: "Manage physicians, specialists, and medical staff",
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-50 to-indigo-50",
      options: [
        {
          id: 'onboard-doctor',
          title: "🩺 Onboard Doctor",
          description: "Add new doctors to the system",
          path: "/doctors",
          icon: "👨‍⚕️",
          color: "from-blue-500 to-cyan-500"
        },
        {
          id: 'view-doctors',
          title: "👀 View Doctors",
          description: "Browse and manage doctor profiles",
          path: "/doctors/view",
          icon: "📋",
          color: "from-indigo-500 to-purple-500"
        },
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
      id: 'admin-staff',
      title: "💼 Administrative Staff",
      description: "Manage admin personnel and office staff",
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-50 to-teal-50",
      options: [
        {
          id: 'onboard-admin',
          title: "👔 Onboard Admin",
          description: "Add administrative staff members",
          path: "/staff/create",
          icon: "📝",
          color: "from-emerald-500 to-teal-500"
        },
        {
          id: 'view-admins',
          title: "👥 View Staff",
          description: "Browse administrative personnel",
          path: "/staff/view",
          icon: "📊",
          color: "from-teal-500 to-cyan-500"
        }
      ]
    },
    {
      id: 'reception-staff',
      title: "🎯 Reception Staff",
      description: "Manage front desk and reception team",
      gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
      bgGradient: "from-rose-50 to-pink-50",
      options: [
        {
          id: 'onboard-receptionist',
          title: "🎭 Onboard Receptionist",
          description: "Add reception team members",
          path: "/staff/create?role=receptionist",
          icon: "🔔",
          color: "from-rose-500 to-pink-500"
        },
        {
          id: 'view-receptionists',
          title: "📞 View Receptionists",
          description: "Manage reception staff",
          path: "/staff/view?role=receptionist",
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
        }
      ]
    }
  ];

  const handleCardClick = (path, optionId) => {
    if (optionId === 'onboard-doctor') {
      setShowDoctorModal(true);
      return;
    }
    if (optionId === 'manage-access') {
      setShowAccessControlModal(true);
      return;
    }
    navigate(path);
  };
  
  // Access Control Functions
  const handleSearchStaff = () => {
    // Filter mock data based on search criteria
    const filtered = mockStaffData.filter(staff => {
      return (
        (searchFilters.staffId === "" || staff.staffId.toLowerCase().includes(searchFilters.staffId.toLowerCase())) &&
        (searchFilters.firstName === "" || staff.firstName.toLowerCase().includes(searchFilters.firstName.toLowerCase())) &&
        (searchFilters.lastName === "" || staff.lastName.toLowerCase().includes(searchFilters.lastName.toLowerCase())) &&
        (searchFilters.clinicId === "" || staff.clinicId.toLowerCase().includes(searchFilters.clinicId.toLowerCase()))
      );
    });
    setSearchResults(filtered);
  };
  
  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setShowRoleManager(true);
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
  
  const handleConfirmAssignment = () => {
    if (selectedStaff) {
      const roleNames = selectedRoles.map(r => r.name).join(", ");
      // Update the staff's role in the results (showing first role for display)
      setSearchResults(prev => prev.map(s => 
        s.id === selectedStaff.id ? { ...s, currentRole: selectedRoles[0].name, allRoles: selectedRoles } : s
      ));
      setShowConfirmation(false);
      setShowRoleManager(false);
      setSelectedStaff(null);
      setSelectedRoles([]);
      
      // Show success animation
      setTimeout(() => {
        alert(`✅ Successfully assigned ${selectedRoles.length} role(s) to ${selectedStaff.firstName} ${selectedStaff.lastName}!\n\nRoles: ${roleNames}`);
      }, 300);
    }
  };
  
  const resetAccessControl = () => {
    setSearchFilters({ staffId: "", firstName: "", lastName: "", clinicId: "" });
    setSearchResults([]);
    setSelectedStaff(null);
    setShowRoleManager(false);
    setSelectedRoles([]);
    setShowConfirmation(false);
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
      const payload = {
        doctorId: 0,
        staffId: parseInt(doctorFormData.staffId) || 0,
        firstName: doctorFormData.firstName,
        lastName: doctorFormData.lastName,
        dateOfBirth: doctorFormData.dateOfBirth ? new Date(doctorFormData.dateOfBirth).toISOString() : new Date().toISOString(),
        gender: doctorFormData.gender,
        email: doctorFormData.email,
        phone: doctorFormData.phone,
        address: doctorFormData.address || "string",
        licenseNumber: doctorFormData.licenseNumber,
        licenseExpiry: doctorFormData.licenseExpiry ? new Date(doctorFormData.licenseExpiry).toISOString() : new Date().toISOString(),
        specialtyId: parseInt(doctorFormData.specialtyId) || 0,
        yearsExperience: doctorFormData.yearsExperience ? parseInt(doctorFormData.yearsExperience) : 0,
        education: doctorFormData.education || "string",
        certifications: doctorFormData.certifications || "string",
        languages: doctorFormData.languages || "string",
        joiningDate: doctorFormData.joiningDate ? new Date(doctorFormData.joiningDate).toISOString() : new Date().toISOString(),
        employmentStatus: doctorFormData.employmentStatus,
        availability: doctorFormData.availability || "string",
        insuranceDetails: doctorFormData.insuranceDetails || "string",
        emergencyContact: doctorFormData.emergencyContact,
        bio: doctorFormData.bio || "string",
        profilePhotoUrl: doctorFormData.profilePhotoUrl || "string",
        achievements: doctorFormData.achievements || "string",
        publications: doctorFormData.publications || "string",
        socialLinks: doctorFormData.socialLinks || "string",
        branchId: parseInt(doctorFormData.branchId) || 0,
        role: "Doctor",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await createDoctor(payload);
      setShowPreview(false);
      setShowDoctorModal(false);
      setShowSuccessModal(true);
      resetDoctorForm();
      
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving doctor:", error);
      alert("Failed to save doctor. Please try again.");
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

        {/* Quick Stats with Beautiful Animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            />
            <div className="relative flex items-center justify-between mb-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                👨‍⚕️
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-3xl font-bold"
              >
                24
              </motion.span>
            </div>
            <p className="text-white/90 font-semibold relative">Active Doctors</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            />
            <div className="relative flex items-center justify-between mb-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="text-4xl"
              >
                👔
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="text-3xl font-bold"
              >
                12
              </motion.span>
            </div>
            <p className="text-white/90 font-semibold relative">Admin Staff</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            />
            <div className="relative flex items-center justify-between mb-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                className="text-4xl"
              >
                🎯
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="text-3xl font-bold"
              >
                8
              </motion.span>
            </div>
            <p className="text-white/90 font-semibold relative">Reception Team</p>
          </motion.div>
        </motion.div>

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
                      Doctor Onboarding & Management
                    </h2>
                    <p className="text-purple-100 mt-1">Complete all required fields to onboard a new doctor</p>
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
                          Staff ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="staffId"
                          value={doctorFormData.staffId}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("staffId") ? "border-red-500 bg-red-50" : "border-purple-300"
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
                          name="branchId"
                          value={doctorFormData.branchId}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("branchId") ? "border-red-500 bg-red-50" : "border-purple-300"
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
                            validationErrors.includes("email") ? "border-red-500 bg-red-50" : "border-purple-300"
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
                          name="phone"
                          value={doctorFormData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("phone") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                          placeholder="+91 98765 43210"
                        />
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
                        <input
                          type="text"
                          name="emergencyContact"
                          value={doctorFormData.emergencyContact}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("emergencyContact") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                          placeholder="Emergency contact number"
                        />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          License Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={doctorFormData.licenseNumber}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("licenseNumber") ? "border-red-500 bg-red-50" : "border-purple-300"
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
                          name="licenseExpiry"
                          value={doctorFormData.licenseExpiry}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("licenseExpiry") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Specialty ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="specialtyId"
                          value={doctorFormData.specialtyId}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            validationErrors.includes("specialtyId") ? "border-red-500 bg-red-50" : "border-purple-300"
                          }`}
                          placeholder="Specialty ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="yearsExperience"
                          value={doctorFormData.yearsExperience}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Years"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Education
                        </label>
                        <textarea
                          name="education"
                          value={doctorFormData.education}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        type="text"
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
                  <div><span className="font-bold">Branch ID:</span> {doctorFormData.branchId}</div>
                  <div><span className="font-bold">Email:</span> {doctorFormData.email}</div>
                  <div><span className="font-bold">Phone:</span> {doctorFormData.phone}</div>
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
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  ✓ Confirm & Assign
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
                    {/* Search Filters */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔍</span>
                        Search Staff Members
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
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSearchStaff}
                        className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        🔍 Search Staff
                      </motion.button>
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
                                  <h4 className="font-bold text-slate-800 text-lg">{staff.firstName} {staff.lastName}</h4>
                                  <p className="text-sm text-slate-600">ID: {staff.staffId}</p>
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

                    {/* Mode Selection Tabs */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🎨</span>
                        Choose Your Selection Style
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: "multi-select", icon: "☑️", name: "Multi-Select Cards", desc: "Click to toggle" },
                          { id: "drag-drop", icon: "🎯", name: "Drag & Drop", desc: "Drag roles to assign" },
                          { id: "toggle-switch", icon: "🎚️", name: "Toggle Switches", desc: "Quick on/off" },
                          { id: "permission-builder", icon: "🔧", name: "Permission Builder", desc: "Custom access" }
                        ].map(mode => (
                          <motion.button
                            key={mode.id}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setRoleSelectionMode(mode.id);
                              setSelectedRoles([]);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              roleSelectionMode === mode.id
                                ? 'bg-gradient-to-br from-violet-500 to-purple-500 border-purple-400 text-white shadow-lg'
                                : 'bg-white border-purple-200 hover:border-purple-400 text-slate-700'
                            }`}
                          >
                            <div className="text-3xl mb-1">{mode.icon}</div>
                            <div className={`font-bold text-sm ${roleSelectionMode === mode.id ? 'text-white' : 'text-slate-800'}`}>
                              {mode.name}
                            </div>
                            <div className={`text-xs ${roleSelectionMode === mode.id ? 'text-purple-100' : 'text-slate-500'}`}>
                              {mode.desc}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Roles Counter */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {selectedRoles.length}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">Selected Roles</h4>
                            <p className="text-sm text-slate-600">
                              {selectedRoles.length === 0 ? "Select roles using the chosen method" : selectedRoles.map(r => r.name).join(", ")}
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

                    {/* Role Selection - Different Modes */}
                    {roleSelectionMode === "multi-select" && (
                      <>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-2xl">☑️</span>
                          Multi-Select Cards
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                    {/* Action Buttons */}
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
    </div>
  );
};

export default TeamHub;
