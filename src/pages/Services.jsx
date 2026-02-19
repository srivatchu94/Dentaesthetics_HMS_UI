import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FancyDatePicker from "../components/FancyDatePicker";
import CampStatisticsModal from "../components/CampStatisticsModal";
import { PharmacyBillingModal } from "../components/PharmacyBillingModal";
import {
  createCamp,
  addCampParticipant,
  getAllCamps,
  getAllCampParticipants,
  getCampsByClinicId,
  deleteCampParticipant,
  updateCampParticipant,
  getAllCampServices,
  addCampService,
  getServicesByCampID,
} from "../services/campService";
import { getSelectedAccess } from "../services/authService";

// Utility function to calculate age from date of birth
const calculateAgeFromDOB = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 0 ? age.toString() : '';
};

// Utility function to parse services - handles both array and comma-separated string formats
const parseServicesOffered = (servicesData) => {
  if (!servicesData) return [];
  
  // If already an array, return it as-is
  if (Array.isArray(servicesData)) {
    console.log('✅ Services already in array format:', servicesData);
    return servicesData;
  }
  
  // If it's a string, split by comma and trim
  if (typeof servicesData === 'string') {
    const parsed = servicesData
      .split(',')
      .map(service => service.trim())
      .filter(service => service.length > 0);
    console.log('✅ Parsed services from string:', parsed);
    return parsed;
  }
  
  return [];
};

// Utility function to process camp data and parse services
const processCampData = (camps, masterServices = []) => {
  if (!camps) return [];
  
  const campArray = Array.isArray(camps) ? camps : [camps];
  
  return campArray.map(camp => {
    console.log('🏕️ Processing camp:', camp.campName);
    console.log('📋 servicesOffered from API:', camp.servicesOffered);
    console.log('📊 Type of servicesOffered:', typeof camp.servicesOffered);
    
    // Parse servicesOffered - handles both array and string formats
    const parsedServiceNames = parseServicesOffered(camp.servicesOffered);
    console.log('✅ Parsed service names array:', parsedServiceNames);
    
    // Try to match parsed service names with master service IDs
    let matchedServiceIds = [];
    if (masterServices && masterServices.length > 0) {
      console.log('🔍 Attempting to match services with master services list...');
      matchedServiceIds = parsedServiceNames
        .map(serviceName => {
          // Trim and lowercase for comparison
          const normalizedName = serviceName.toLowerCase().trim();
          
          // Try to find exact match
          const matchedService = masterServices.find(s => 
            s.campServiceName?.toLowerCase().trim() === normalizedName
          );
          
          if (matchedService) {
            console.log(`  ✓ Matched "${serviceName}" → ID ${matchedService.campServiceId}`);
            return matchedService.campServiceId;
          } else {
            // Try partial match if exact match fails
            console.warn(`  ⚠️ No exact match for "${serviceName}". Master services available:`);
            masterServices.forEach(s => {
              console.warn(`    - ${s.campServiceName} (ID: ${s.campServiceId})`);
            });
            return null;
          }
        })
        .filter(id => id !== null);
    } else {
      console.warn('⚠️ No master services provided for matching');
    }
    
    console.log('🎯 Final matched service IDs:', matchedServiceIds);
    console.log('---');
    
    return {
      ...camp,
      // Store matched IDs for form binding
      servicesOffered: matchedServiceIds,
      // Keep raw names for display
      parsedServiceNames: parsedServiceNames,
      // Store matched IDs separately
      matchedServiceIds: matchedServiceIds
    };
  });
};

export default function Services(){
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Camp modals state
  const [showRegisterCampModal, setShowRegisterCampModal] = useState(false);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [showCampStatisticsModal, setShowCampStatisticsModal] = useState(false);
  const [showViewCampsModal, setShowViewCampsModal] = useState(false);
  const [showViewParticipantsModal, setShowViewParticipantsModal] = useState(false);
  const [showEditParticipantModal, setShowEditParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [campId, setCampId] = useState(null);
  
  // Pharmacy Billing modal state
  const [showPharmacyBillingModal, setShowPharmacyBillingModal] = useState(false);
  
  // View camps and participants state
  const [camps, setCamps] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedCampForParticipants, setSelectedCampForParticipants] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  
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
    photoConsent: false,
    service: ''
  });

  // Edit participant form
  const [editParticipantForm, setEditParticipantForm] = useState({
    participantId: null,
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
    existingDentalIssues: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    consentGiven: false,
    photoConsent: false,
    registrationStatus: 'Registered',
    service: ''
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
  
  // Camp Services state
  const [campServices, setCampServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [servicesSearchInput, setServicesSearchInput] = useState('');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);

  // Participant Services state
  const [participantCampServices, setParticipantCampServices] = useState([]);
  const [filteredParticipantServices, setFilteredParticipantServices] = useState([]);
  const [participantServicesSearchInput, setParticipantServicesSearchInput] = useState('');
  const [showParticipantServicesDropdown, setShowParticipantServicesDropdown] = useState(false);
  const [participantServicesLoading, setParticipantServicesLoading] = useState(false);

  // Fetch camp services when register camp modal opens
  useEffect(() => {
    if (showRegisterCampModal) {
      handleFetchCampServices();
    }
  }, [showRegisterCampModal]);

  const serviceCategories = [
    {
      id: 'dental-services',
      title: "⚕️ Healthcare Services",
      description: "Manage medical treatments and procedures",
      gradient: "from-slate-500 via-slate-600 to-slate-700",
      bgGradient: "from-slate-50 to-slate-100",
      options: [
        {
          id: 'add-service',
          title: "➕ Add Service",
          description: "Create new healthcare service",
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
          color: "from-indigo-400 to-purple-500"
        },
        {
          id: 'edit-service',
          title: "✏️ Edit Service",
          description: "Modify service details",
          action: "edit",
          icon: "🔧",
          color: "from-purple-400 to-pink-500"
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
          color: "from-indigo-400 to-purple-500"
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
          color: "from-pink-400 to-purple-500"
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
          id: 'view-camps',
          title: "👁️ View Camps",
          description: "View all camp details",
          action: "view-camps",
          icon: "📋",
          color: "from-purple-400 to-indigo-500"
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
          id: 'list-participants',
          title: "📋 List Participants",
          description: "View and manage participants",
          action: "list-participants",
          icon: "👥",
          color: "from-cyan-400 to-teal-500"
        },
        {
          id: 'camp-statistics',
          title: "📈 Camp Statistics",
          description: "Generate beautiful statistics & reports",
          action: "camp-statistics",
          icon: "⭐",
          color: "from-pink-400 to-rose-500"
        }
      ]
    },
    {
      id: 'pharmacy-billing',
      title: "💊 Pharmacy Billing & Inventory",
      description: "Manage medication dispensing and pharmacy sales",
      gradient: "from-green-500 via-emerald-500 to-teal-600",
      bgGradient: "from-green-50 to-emerald-50",
      options: [
        {
          id: 'pharmacy-billing',
          title: "💊 Pharmacy Billing",
          description: "Generate medication bills and invoices",
          action: "pharmacy-billing",
          icon: "💉",
          color: "from-green-400 to-emerald-500"
        },
        {
          id: 'inventory-tracking',
          title: "📦 Inventory Tracking",
          description: "Monitor medication stock levels",
          action: "inventory-tracking",
          icon: "📊",
          color: "from-emerald-400 to-teal-500"
        },
        {
          id: 'supplier-management',
          title: "🏪 Supplier Management",
          description: "Manage pharmaceutical suppliers",
          action: "supplier-management",
          icon: "🤝",
          color: "from-teal-400 to-blue-500"
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
      case 'view-camps':
        handleViewCamps();
        break;
      case 'add-participants':
        handleSelectCampForParticipants();
        break;
      case 'list-participants':
        handleListParticipants();
        break;
      case 'camp-statistics':
        setShowCampStatisticsModal(true);
        break;
      case 'pharmacy-billing':
        setShowPharmacyBillingModal(true);
        break;
      default:
        alert(`${action} - Feature coming soon! 🚀`);
    }
  };

  // Function to fetch camp services
  const handleFetchCampServices = async () => {
    setServicesLoading(true);
    try {
      console.log('🔄 FETCHING ALL CAMP SERVICES...');
      const services = await getAllCampServices();
      console.log('✅ API RESPONSE RECEIVED');
      console.log('  Type of response:', typeof services);
      console.log('  Is Array:', Array.isArray(services));
      console.log('  Response:', services);
      
      // Transform API response to match expected format
      let transformedServices = [];
      if (services && Array.isArray(services)) {
        console.log('📊 Total services from API:', services.length);
        
        // Check if response is array of strings or array of objects
        if (services.length > 0 && typeof services[0] === 'string') {
          console.log('📝 API returned STRINGS - transforming to objects...');
          transformedServices = services.map((serviceName, index) => ({
            campServiceId: index + 1, // Use index as ID
            campServiceName: serviceName,
            campServiceCode: serviceName.substring(0, 3).toUpperCase() // Generate code from first 3 letters
          }));
          console.log('✅ Transformed services:');
          transformedServices.forEach((s, idx) => {
            console.log(`  ${idx + 1}. NAME: "${s.campServiceName}" | ID: ${s.campServiceId} | CODE: ${s.campServiceCode}`);
          });
        } else if (services.length > 0 && typeof services[0] === 'object') {
          console.log('✅ API returned OBJECTS - using as-is');
          transformedServices = services;
          transformedServices.forEach((s, idx) => {
            console.log(`  ${idx + 1}. NAME: "${s.campServiceName}" | ID: ${s.campServiceId} | CODE: ${s.campServiceCode}`);
          });
        }
      } else {
        console.warn('⚠️ SERVICES ARRAY IS EMPTY OR INVALID');
        console.warn('  services:', services);
      }
      
      setCampServices(transformedServices);
      setFilteredServices(transformedServices);
      console.log('✅ STATE UPDATED - campServices and filteredServices set');
      console.log('📊 Final transformed services count:', transformedServices.length);
    } catch (error) {
      console.error('❌ ERROR FETCHING CAMP SERVICES:', error);
      console.error('  Error message:', error.message);
      console.error('  Error details:', error);
      setErrorMessage('Failed to load services. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setServicesLoading(false);
      console.log('✅ servicesLoading set to false');
    }
  };

  // Function to handle service search
  const handleServiceSearch = (query) => {
    console.log('🔍 SEARCHING SERVICES');
    console.log('  Search query:', `"${query}"`);
    console.log('  campServices type:', typeof campServices);
    console.log('  campServices is Array:', Array.isArray(campServices));
    console.log('  campServices.length:', campServices?.length || 0);
    setServicesSearchInput(query);
    if (query.trim() === '') {
      console.log('✅ EMPTY SEARCH - Showing all services');
      setFilteredServices(campServices);
      console.log('  setFilteredServices called with campServices');
    } else {
      console.log('🔎 FILTERING BY QUERY...');
      const filtered = campServices.filter(service => {
        const nameMatch = service.campServiceName.toLowerCase().includes(query.toLowerCase());
        const codeMatch = service.campServiceCode.toLowerCase().includes(query.toLowerCase());
        const matches = nameMatch || codeMatch;
        if (matches) {
          console.log(`  ✅ MATCHED: ${service.campServiceName}`);
        }
        return matches;
      });
      console.log('✅ FILTERED RESULTS - Count:', filtered.length);
      filtered.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.campServiceName} (ID: ${s.campServiceId})`);
      });
      setFilteredServices(filtered);
    }
  };

  // Function to add new camp service
  const handleAddCampService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      setErrorMessage('Please enter a service name');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const newService = {
        campServiceId: 0,
        campServiceCode: newServiceName.replace(/\s+/g, '_').toUpperCase(),
        campServiceName: newServiceName,
        isActive: true,
        createdDate: new Date().toISOString(),
      };

      const result = await addCampService(newService);
      console.log('✅ Service added successfully:', result);
      
      // Show funny success message
      setSuccessMessage(`🎉 "${newServiceName}" has been added to the service menu! Let's make those smiles even brighter! 😁`);
      
      // Reset form and reload services
      setNewServiceName('');
      setShowAddServiceModal(false);
      await handleFetchCampServices();
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('❌ Error adding service:', error);
      setErrorMessage(`Error adding service: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch participant services by camp ID
  const handleFetchParticipantServices = async (campId) => {
    setParticipantServicesLoading(true);
    try {
      const response = await getServicesByCampID(campId);
      console.log('✅ Participant Services fetched:', response);
      
      // Handle both direct array response and wrapped response (data property)
      let services = Array.isArray(response) ? response : (response?.data ? response.data : []);
      
      // Ensure services is always an array
      if (!Array.isArray(services)) {
        console.warn('⚠️ Services response is not an array, setting to empty array');
        services = [];
      }
      
      // Transform string array to objects if needed
      let transformedServices = [];
      if (services.length > 0 && typeof services[0] === 'string') {
        console.log('📝 API returned STRINGS - transforming to objects...');
        transformedServices = services.map((serviceName, index) => ({
          campServiceId: index + 1,
          campServiceName: serviceName,
          campServiceCode: serviceName.substring(0, 3).toUpperCase()
        }));
      } else if (services.length > 0 && typeof services[0] === 'object') {
        console.log('✅ API returned OBJECTS - using as-is');
        transformedServices = services;
      }
      
      setParticipantCampServices(transformedServices);
      setFilteredParticipantServices(transformedServices);
    } catch (error) {
      console.error('❌ Error fetching participant services:', error);
      setErrorMessage('Failed to load services for this camp.');
      setTimeout(() => setErrorMessage(''), 3000);
      // Set empty arrays on error
      setParticipantCampServices([]);
      setFilteredParticipantServices([]);
    } finally {
      setParticipantServicesLoading(false);
    }
  };

  // Function to handle participant service search
  const handleParticipantServiceSearch = (query) => {
    setParticipantServicesSearchInput(query);
    // Ensure participantCampServices is an array
    const campServicesArray = Array.isArray(participantCampServices) ? participantCampServices : [];
    
    if (query.trim() === '') {
      setFilteredParticipantServices(campServicesArray);
    } else {
      const filtered = campServicesArray.filter(service =>
        service?.campServiceName?.toLowerCase().includes(query.toLowerCase()) ||
        service?.campServiceCode?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredParticipantServices(filtered);
    }
  };

  const handleSelectCampForParticipants = async () => {
    setViewLoading(true);
    try {
      const selectedAccess = getSelectedAccess();
      console.log('🔐 Selected Access:', selectedAccess);
      
      if (!selectedAccess) {
        setErrorMessage("No clinic access found. Please login again!");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
      
      if (!selectedAccess.clinicId || selectedAccess.clinicId === 0) {
        setErrorMessage("Invalid Clinic ID in your login context!");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
      
      console.log('📍 Fetching camps for clinicId:', selectedAccess.clinicId);
      const campsData = await getCampsByClinicId(selectedAccess.clinicId);
      console.log('✅ Camps received:', campsData);
      
      if (!campsData || campsData.length === 0) {
        setErrorMessage("No camps available for your clinic. Please create a camp first!");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
      
      // Process camps to parse servicesOffered
      console.log('🔧 Camp Services available:', campServices);
      const processedCamps = processCampData(campsData, campServices);
      console.log('✅ Processed camps:', processedCamps);
      setCamps(processedCamps);
      // Reset participant form and open the modal
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
      setShowAddParticipantsModal(true);
    } catch (error) {
      console.error('❌ Error in handleSelectCampForParticipants:', error);
      const errorMessage = error.message || 'Failed to fetch camps';
      setErrorMessage(`Error fetching camps: ${errorMessage}`);
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewCamps = async () => {
    setViewLoading(true);
    try {
      const selectedAccess = getSelectedAccess();
      console.log('🔐 Selected Access for View Camps:', selectedAccess);
      
      if (!selectedAccess?.clinicId) {
        setErrorMessage("Clinic ID not found in your login context!");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
      
      console.log('📍 Fetching camps for clinicId:', selectedAccess.clinicId);
      const campsData = await getCampsByClinicId(selectedAccess.clinicId);
      console.log('✅ Camps received:', campsData);
      
      // Process camps to parse servicesOffered
      console.log('🔧 Camp Services available:', campServices);
      const processedCamps = processCampData(campsData, campServices);
      console.log('✅ Processed camps:', processedCamps);
      setCamps(processedCamps || []);
      setShowViewCampsModal(true);
    } catch (error) {
      console.error('❌ Error fetching camps:', error);
      setErrorMessage(`Error fetching camps: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewParticipants = async (selectedCampId) => {
    if (!selectedCampId) {
      setErrorMessage("Please select a camp first!");
      return;
    }
    setViewLoading(true);
    try {
      const participantsData = await getAllCampParticipants(selectedCampId);
      setParticipants(participantsData || []);
      setSelectedCampForParticipants(selectedCampId);
    } catch (error) {
      setErrorMessage(`Error fetching participants: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setViewLoading(false);
    }
  };

  const handleListParticipants = async () => {
    setViewLoading(true);
    try {
      const selectedAccess = getSelectedAccess();
      console.log('🔐 Selected Access for List Participants:', selectedAccess);
      
      if (!selectedAccess?.clinicId) {
        setErrorMessage("Clinic ID not found in your login context!");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
      
      console.log('📍 Fetching camps for clinicId:', selectedAccess.clinicId);
      const campsData = await getCampsByClinicId(selectedAccess.clinicId);
      console.log('✅ Camps received:', campsData);
      
      if (!campsData || campsData.length === 0) {
        setErrorMessage("No camps available for your clinic!");
        setTimeout(() => setErrorMessage(""), 3000);
        setViewLoading(false);
        return;
      }
      
      // Process camps to parse servicesOffered
      console.log('🔧 Camp Services available:', campServices);
      const processedCamps = processCampData(campsData, campServices);
      console.log('✅ Processed camps:', processedCamps);
      setCamps(processedCamps || []);
      setSelectedCampForParticipants(null);
      setParticipants([]);
      setShowViewParticipantsModal(true);
    } catch (error) {
      console.error('❌ Error in handleListParticipants:', error);
      setErrorMessage(`Error loading camps: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setViewLoading(false);
    }
  };
  
  const handleCampFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const selectedAccess = getSelectedAccess();
      
      console.log('📝 Submitting camp form...');
      console.log('📋 campForm.servicesOffered (IDs):', campForm.servicesOffered);
      console.log('🔍 campServices available:', campServices);
      
      // Convert time string (HH:mm) to TimeSpan format (HH:mm:ss)
      const formatTimeToTimeSpan = (timeStr) => {
        if (!timeStr) return "00:00:00";
        return `${timeStr}:00`; // Convert "09:30" to "09:30:00"
      };

      // Convert date string to proper format
      const servicesAsString = campForm.servicesOffered.map(serviceId => {
        const service = campServices.find(s => s.campServiceId === serviceId);
        console.log(`  Mapping service ID ${serviceId} to name: ${service?.campServiceName || 'NOT FOUND'}`);
        return service?.campServiceName || serviceId;
      }).join(', ');
      
      console.log('✅ Services as comma-separated string:', servicesAsString);
      
      const campData = {
        enterpriseId: selectedAccess?.enterpriseId,
        clinicId: selectedAccess?.clinicId,
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
        servicesOffered: servicesAsString,
        campDescription: campForm.campDescription,
        specialNotes: campForm.specialNotes,
        budgetAllocated: parseFloat(campForm.budgetAllocated) || 0,
        sponsorshipDetails: campForm.sponsorshipDetails,
        isActive: true
      };
      
      console.log('✅ Camp Data being sent to API:', campData);
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
    
    try {
      const selectedAccess = getSelectedAccess();
      console.log('🔐 Selected Access:', selectedAccess);
      console.log('🏢 Enterprise ID:', selectedAccess?.enterpriseId);
      console.log('🏥 Clinic ID:', selectedAccess?.clinicId);
      
      if (!selectedAccess?.enterpriseId || !selectedAccess?.clinicId) {
        setErrorMessage("Enterprise or Clinic ID missing from login token! Please login again.");
        setLoading(false);
        return;
      }
      
      if (!campId || campId === 0) {
        setErrorMessage("Camp ID is missing! Please select a camp first.");
        setLoading(false);
        return;
      }
      
      // Validation
      if (!participantForm.participantName || participantForm.participantName.trim() === '') {
        setErrorMessage("Participant name is required!");
        setLoading(false);
        return;
      }
      
      if (!participantForm.age || parseInt(participantForm.age) <= 0) {
        setErrorMessage("Age must be a valid number greater than 0!");
        setLoading(false);
        return;
      }
      
      if (!participantForm.gender) {
        setErrorMessage("Gender is required!");
        setLoading(false);
        return;
      }
      
      if (!participantForm.phoneNumber || participantForm.phoneNumber.trim() === '') {
        setErrorMessage("Phone number is required!");
        setLoading(false);
        return;
      }
      
      if (!participantForm.consentGiven) {
        setErrorMessage("Consent for examination/treatment is required!");
        setLoading(false);
        return;
      }
      
      // Convert dateOfBirth to proper DateTime format for C# parsing
      // Format: ISO 8601 with time (YYYY-MM-DDTHH:mm:ss.fffZ) or null
      let dateOfBirthFormatted = null;
      if (participantForm.dateOfBirth) {
        const dateObj = new Date(participantForm.dateOfBirth);
        if (!isNaN(dateObj.getTime())) {
          // Format as ISO 8601 datetime (C# DateTime? will parse this correctly)
          dateOfBirthFormatted = dateObj.toISOString();
        }
      }

      const participantData = {
        participantId: 0,
        campId: campId,
        enterpriseId: selectedAccess?.enterpriseId || 0,
        clinicId: selectedAccess?.clinicId || 0,
        participantName: participantForm.participantName?.trim() || '',
        age: parseInt(participantForm.age) || 0,
        gender: participantForm.gender || '',
        dateOfBirth: dateOfBirthFormatted,
        phoneNumber: participantForm.phoneNumber?.trim() || '',
        email: participantForm.email?.trim() || '',
        parentGuardianName: participantForm.parentGuardianName?.trim() || '',
        studentOrStaff: participantForm.studentOrStaff || '',
        classStandard: participantForm.classStandard || '',
        gradeYear: participantForm.gradeYear || '',
        rollNumber: participantForm.rollNumber || '',
        department: participantForm.department || '',
        existingDentalIssues: participantForm.existingDentalIssues && participantForm.existingDentalIssues.length > 0 
          ? participantForm.existingDentalIssues.join(', ') 
          : '',
        medicalHistory: participantForm.medicalHistory?.trim() || '',
        currentMedications: participantForm.currentMedications?.trim() || '',
        allergies: participantForm.allergies?.trim() || '',
        consentGiven: participantForm.consentGiven || false,
        photoConsent: participantForm.photoConsent || false,
        registrationDate: new Date().toISOString().split('T')[0],
        registrationStatus: 'Active',
        service: Array.isArray(participantForm.service) && participantForm.service.length > 0 
          ? participantForm.service.join(', ') 
          : ''
      };
      
      console.log('👥 Participant Data being sent:', JSON.stringify(participantData, null, 2));
      console.log('🏕️ Camp ID:', campId);
      console.log('🏢 Enterprise ID:', participantData.enterpriseId);
      console.log('🏥 Clinic ID:', participantData.clinicId);
      console.log('📋 Participant Name:', participantData.participantName);
      console.log('📅 Date of Birth (formatted):', participantData.dateOfBirth);
      
      const response = await addCampParticipant(participantData);
      console.log('✅ Response from backend:', response);

      // Funny success messages
      const funnyMessages = [
        '🎉 Boom! Another smile saved!',
        '🦷 Houston, we have a participant!',
        '✨ One less cavity waiting to happen!',
        '🎊 Another brave soul ready for dental adventure!',
        '🚀 Participant added with 100% less pain!',
        '🌟 Welcome to the healthy teeth club!',
        '💫 We just made a dentist smile! 👨‍⚕️',
        '🎯 Bullseye! Participant registered!',
        '⚡ Faster than a dental drill spinning!',
        '🏆 Champion added to the camp! 🏆'
      ];

      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setSuccessMessage(randomMessage);
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
      setCampId(null);
      setCamps([]);
      
      // Redirect to list participants after showing success message
      setTimeout(() => {
        setSuccessMessage("");
        // Open list participants modal with the current camp
        handleServiceAction('list-participants');
        if (campId) {
          handleViewParticipants(campId);
        }
      }, 3000);
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      const errorMessage = error.message || 'Failed to add participant';
      setErrorMessage(`Error: ${errorMessage}`);
      setTimeout(() => setErrorMessage(""), 5000);
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

  const handleDeleteParticipantConfirmed = async (participantId) => {
    setLoading(true);
    try {
      await deleteCampParticipant(participantId);
      
      // Funny deletion messages
      const funnyDeleteMessages = [
        "🎉 Participant successfully evaporated from the system!",
        "✨ Another one bites the dust! Participant deleted with style!",
        "🚀 Participant sent to the digital void! Bye-bye!",
        "💫 Poof! Like magic, the participant has vanished!",
        "🎊 One less participant to worry about! Crisis averted!",
        "🌈 Participant deleted! They'll be back... in another camp!",
        "⚡ ZAP! Participant obliterated from existence!",
        "🎭 Exit stage left! Participant has left the building!",
        "🏆 Successfully removed! One less tooth to track!",
        "🎪 The participant has left the circus! 🎯"
      ];
      
      const randomMessage = funnyDeleteMessages[Math.floor(Math.random() * funnyDeleteMessages.length)];
      setSuccessMessage(randomMessage);
      
      // Refresh the participants list
      if (selectedCampForParticipants) {
        handleViewParticipants(selectedCampForParticipants);
      }
      
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error('❌ Error deleting participant:', error);
      setErrorMessage(`Error deleting participant: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Toast Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-indigo-400 to-purple-500 text-white px-10 py-6 rounded-2xl shadow-2xl text-center max-w-md pointer-events-auto"
            >
              <p className="text-2xl font-bold mb-2">{successMessage}</p>
              <p className="text-sm text-green-50">Redirecting to participants...</p>
            </motion.div>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-8 py-4 rounded-lg shadow-2xl z-50 text-center max-w-sm"
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
                  className="relative cursor-pointer group h-full"
                >
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${option.color} p-6 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-between`}>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        Services Offered *
                        <button
                          type="button"
                          onClick={() => {
                            handleFetchCampServices();
                            setShowAddServiceModal(true);
                          }}
                          className="ml-auto px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                        >
                          + Add Service
                        </button>
                      </label>
                      
                      {/* Multiselect Dropdown */}
                      <div className="relative">
                        {/* Dropdown trigger button */}
                        <button
                          type="button"
                          onClick={() => {
                            console.log('📂 DROPDOWN OPENED - LOGGING STATE:');
                            console.log('  showServicesDropdown:', showServicesDropdown);
                            console.log('  campServices.length:', campServices?.length || 0);
                            console.log('  filteredServices.length:', filteredServices?.length || 0);
                            console.log('  campForm.servicesOffered:', campForm.servicesOffered);
                            console.log('  servicesLoading:', servicesLoading);
                            console.log('  servicesSearchInput:', servicesSearchInput);
                            console.log('---FULL CAMP SERVICES LIST---');
                            campServices.forEach((s, i) => console.log(`${i+1}. ${s.campServiceName} (ID: ${s.campServiceId})`));
                            console.log('---FULL FILTERED SERVICES LIST---');
                            filteredServices.forEach((s, i) => console.log(`${i+1}. ${s.campServiceName} (ID: ${s.campServiceId})`));
                            
                            if (!showServicesDropdown) {
                              console.log('🔄 Dropdown was closed, calling handleFetchCampServices()...');
                              handleFetchCampServices();
                            } else {
                              console.log('Dropdown was open, closing it');
                            }
                            setShowServicesDropdown(!showServicesDropdown);
                          }}
                          className="w-full px-4 py-3 text-left bg-white border-2 border-purple-300 rounded-lg hover:border-purple-500 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {campForm.servicesOffered && Array.isArray(campForm.servicesOffered) && campForm.servicesOffered.length > 0 ? (
                                campForm.servicesOffered.map((serviceId) => {
                                  const service = campServices.find(s => s.campServiceId === serviceId);
                                  return (
                                    <span
                                      key={serviceId}
                                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-md"
                                    >
                                      ✓ {service?.campServiceName || `Service ${serviceId}`}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCampForm({
                                            ...campForm,
                                            servicesOffered: campForm.servicesOffered.filter(id => id !== serviceId)
                                          });
                                        }}
                                        className="ml-1 hover:text-red-200 font-bold text-lg leading-none"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-gray-500 text-base">Select services...</span>
                              )}
                            </div>
                            <span className="text-purple-600 text-2xl ml-2">▼</span>
                          </div>
                        </button>

                        {/* Dropdown menu */}
                        {showServicesDropdown && (
                          <div>
                            <div 
                              className="fixed inset-0 z-20"
                              onClick={() => setShowServicesDropdown(false)}
                            />
                            
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-300 rounded-lg shadow-2xl z-30 max-h-96 overflow-y-auto">
                              <div className="sticky top-0 bg-purple-50 border-b-2 border-purple-200 p-4 z-40">
                                <input
                                  type="text"
                                  placeholder="Search services..."
                                  value={servicesSearchInput}
                                  onChange={(e) => handleServiceSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 outline-none"
                                  autoFocus
                                />
                              </div>

                              <div className="py-2">
                                {servicesLoading && <div className="p-4 text-center text-gray-600">Loading...</div>}
                                {!servicesLoading && (!Array.isArray(filteredServices) || filteredServices.length === 0) && (
                                  <div className="p-4 text-center text-gray-500">No services available</div>
                                )}
                                {!servicesLoading && Array.isArray(filteredServices) && filteredServices.length > 0 && (
                                  filteredServices.map((service, idx) => {
                                    const serviceId = service.campServiceId || (idx + 1);
                                    const serviceName = service.campServiceName || service;
                                    const isSelected = campForm.servicesOffered && campForm.servicesOffered.includes(serviceId);
                                    
                                    const labelClass = 'flex items-center gap-4 px-5 py-4 cursor-pointer border-b hover:bg-purple-50 transition-all';
                                    const selectedLabelClass = 'flex items-center gap-4 px-5 py-4 cursor-pointer border-b bg-purple-100 hover:bg-purple-150 transition-all';
                                    
                                    return (
                                      <label 
                                        key={serviceId} 
                                        className={isSelected ? selectedLabelClass : labelClass}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected || false}
                                          onChange={(e) => {
                                            const current = campForm.servicesOffered || [];
                                            if (e.target.checked) {
                                              setCampForm({...campForm, servicesOffered: [...current, serviceId]});
                                            } else {
                                              setCampForm({...campForm, servicesOffered: current.filter(id => id !== serviceId)});
                                            }
                                          }}
                                          className="w-6 h-6 text-purple-600 rounded border-2 border-purple-400"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className={isSelected ? 'font-semibold text-base text-purple-900' : 'font-semibold text-base text-gray-800'}>
                                            {serviceName}
                                          </div>
                                          {service.campServiceCode && <div className="text-xs text-gray-500">{service.campServiceCode}</div>}
                                        </div>
                                        {isSelected && <span className="text-purple-600 text-xl font-bold">check</span>}
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summary of selected services */}
                      {campForm.servicesOffered && Array.isArray(campForm.servicesOffered) && campForm.servicesOffered.length > 0 && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 shadow-sm">
                          <p className="text-sm font-bold text-purple-900 mb-3">
                            ✓ Selected {campForm.servicesOffered.length} Service{campForm.servicesOffered.length !== 1 ? 's' : ''}:
                          </p>
                          <ul className="space-y-2">
                            {campForm.servicesOffered.map((serviceId) => {
                              const service = campServices.find(s => s.campServiceId === serviceId);
                              return (
                                <li key={serviceId} className="text-sm text-gray-700 flex items-center gap-2">
                                  <span className="text-purple-600 font-bold">•</span>
                                  <span className="font-medium">{service?.campServiceName || `Service ${serviceId}`}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
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
                    onChange={(e) => {
                      const selectedCamp = camps.find(c => c.campName === e.target.value);
                      setParticipantForm({
                        ...participantForm, 
                        campName: e.target.value
                      });
                      if (selectedCamp) {
                        setCampId(selectedCamp.campId);
                        console.log('🏕️ Selected camp:', selectedCamp.campName, 'ID:', selectedCamp.campId);
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  >
                    <option value="">Select Camp</option>
                    {camps.map((camp) => (
                      <option key={camp.campId} value={camp.campName}>
                        {camp.campName} ({camp.campType}) - {new Date(camp.campDate).toLocaleDateString()}
                      </option>
                    ))}
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={participantForm.dateOfBirth}
                        onChange={(e) => {
                          const newDOB = e.target.value;
                          const calculatedAge = calculateAgeFromDOB(newDOB);
                          setParticipantForm({
                            ...participantForm, 
                            dateOfBirth: newDOB,
                            age: calculatedAge
                          });
                        }}
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={participantForm.email}
                        onChange={(e) => setParticipantForm({...participantForm, email: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Parent/Guardian Name</label>
                      <input
                        type="text"
                        value={participantForm.parentGuardianName}
                        onChange={(e) => setParticipantForm({...participantForm, parentGuardianName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                        placeholder="For minors"
                      />
                    </div>

                    {/* Services Offered Dropdown */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Services Availed</label>
                      
                      <div className="relative">
                        {/* Dropdown toggle */}
                        <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border-2 border-rose-200 cursor-pointer hover:border-rose-400 transition-all"
                             onClick={() => {
                               if (!showParticipantServicesDropdown && campId) {
                                 handleFetchParticipantServices(campId);
                               }
                               setShowParticipantServicesDropdown(!showParticipantServicesDropdown);
                             }}>
                          <div className="flex-1 flex flex-wrap gap-2">
                            {participantForm.service && Array.isArray(participantForm.service) && participantForm.service.length > 0 ? (
                              participantForm.service.map((s, idx) => (
                                <span key={idx} className="inline-flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full text-sm">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">Select services...</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!showParticipantServicesDropdown && campId) {
                                handleFetchParticipantServices(campId);
                              }
                              setShowParticipantServicesDropdown(!showParticipantServicesDropdown);
                            }}
                            className="ml-auto text-rose-600 hover:text-rose-800 transition-all"
                          >
                            {showParticipantServicesDropdown ? '▼' : '▶'}
                          </button>
                        </div>

                        {/* Dropdown list */}
                        {showParticipantServicesDropdown && (
                          <div>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setShowParticipantServicesDropdown(false)}
                            />
                            
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-rose-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                              {/* Search input */}
                              <div className="sticky top-0 bg-white border-b border-rose-100 p-2 z-30">
                                <input
                                  type="text"
                                  placeholder="Search services..."
                                  value={participantServicesSearchInput}
                                  onChange={(e) => handleParticipantServiceSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:border-rose-500 outline-none text-sm"
                                  autoFocus
                                />
                              </div>

                              {/* Services list */}
                              <div className="py-2">
                                {participantServicesLoading && <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>}
                                {!participantServicesLoading && (!Array.isArray(filteredParticipantServices) || filteredParticipantServices.length === 0) && (
                                  <div className="p-4 text-center text-gray-500 text-sm">No services available</div>
                                )}
                                {!participantServicesLoading && Array.isArray(filteredParticipantServices) && filteredParticipantServices.length > 0 && (
                                  filteredParticipantServices.map((service, idx) => {
                                    const serviceId = service.campServiceId || (idx + 1);
                                    const isSelected = participantForm.service && Array.isArray(participantForm.service) && participantForm.service.includes(service.campServiceName);
                                    return (
                                      <label
                                        key={serviceId}
                                        className={isSelected ? 'flex items-center gap-3 px-4 py-3 bg-rose-100 cursor-pointer border-b border-rose-100 hover:bg-rose-150 transition-all' : 'flex items-center gap-3 px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-rose-100 transition-all'}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected || false}
                                          onChange={(e) => {
                                            const current = Array.isArray(participantForm.service) ? [...participantForm.service] : [];
                                            if (e.target.checked) {
                                              if (!current.includes(service.campServiceName)) {
                                                current.push(service.campServiceName);
                                              }
                                            } else {
                                              const idx = current.indexOf(service.campServiceName);
                                              if (idx > -1) current.splice(idx, 1);
                                            }
                                            setParticipantForm({
                                              ...participantForm,
                                              service: current
                                            });
                                          }}
                                          className="w-4 h-4 text-rose-600"
                                        />
                                        <div className="flex-1">
                                          <div className="text-sm font-semibold text-gray-800">{service.campServiceName}</div>
                                          {service.campServiceCode && <div className="text-xs text-gray-500">{service.campServiceCode}</div>}
                                        </div>
                                        {isSelected && <span className="text-rose-600 text-lg font-bold">✓</span>}
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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

      {/* View Camps Modal */}
      <AnimatePresence>
        {showViewCampsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewCampsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">📋</span>
                    <div>
                      <h2 className="text-2xl font-bold">View All Camps</h2>
                      <p className="text-purple-100 text-sm">Manage your dental/medical camp events</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewCampsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {viewLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <span className="text-4xl">⏳</span>
                    </motion.div>
                  </div>
                ) : camps.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl">🏕️</span>
                    <p className="text-gray-500 mt-4 text-lg">No camps found. Create your first camp!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {camps.map((camp) => (
                      <motion.div
                        key={camp.campId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-purple-900 flex-1">{camp.campName}</h3>
                          <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">{camp.campType}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <span>📍</span>
                            <span>{camp.institutionName}, {camp.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <span>📅</span>
                            <span>{new Date(camp.campDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <span>🕐</span>
                            <span>{camp.startTime} - {camp.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <span>👥</span>
                            <span>{camp.expectedParticipants} Expected Participants</span>
                          </div>
                          <div className="flex flex-col gap-2 text-gray-700">
                            <span className="flex items-center gap-2">
                              <span>🩺</span>
                              <span className="font-semibold">Services Offered:</span>
                            </span>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {Array.isArray(camp.servicesOffered) && camp.servicesOffered.length > 0 ? (
                                camp.servicesOffered.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-xs font-semibold"
                                  >
                                    ✓ {service}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 text-xs italic">No services specified</span>
                              )}
                            </div>
                          </div>
                          {camp.contactPerson && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <span>📞</span>
                              <span>{camp.contactPerson}: {camp.contactNumber}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-purple-200 flex gap-2">
                          <button
                            onClick={() => {
                              handleViewParticipants(camp.campId);
                              setShowViewCampsModal(false);
                              setShowViewParticipantsModal(true);
                            }}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition-all text-sm"
                          >
                            👥 View Participants
                          </button>
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

      {/* View Participants Modal */}
      <AnimatePresence>
        {showViewParticipantsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewParticipantsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">👥</span>
                    <div>
                      <h2 className="text-2xl font-bold">Camp Participants</h2>
                      <p className="text-rose-100 text-sm">View and manage participant details for this camp</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewParticipantsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Camp Selection Section */}
                <div className="mb-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-5 border-2 border-rose-200">
                  <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <span>🏕️</span> Select Camp to View Participants
                  </h3>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <select
                        value={selectedCampForParticipants || ""}
                        onChange={(e) => setSelectedCampForParticipants(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-rose-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none font-semibold text-gray-800"
                      >
                        <option value="">-- Select a Camp --</option>
                        {camps.map((camp) => (
                          <option key={camp.campId} value={camp.campId}>
                            {camp.campName} ({camp.campType}) - {new Date(camp.campDate).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (selectedCampForParticipants) {
                          handleViewParticipants(selectedCampForParticipants);
                        } else {
                          setErrorMessage("Please select a camp first!");
                          setTimeout(() => setErrorMessage(""), 3000);
                        }
                      }}
                      disabled={!selectedCampForParticipants || viewLoading}
                      className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {viewLoading ? "Loading..." : "🔍 View Participants"}
                    </motion.button>
                  </div>
                </div>

                {/* Display Selected Camp Services */}
                {selectedCampForParticipants && (
                  (() => {
                    const selectedCamp = camps.find(c => c.campId === selectedCampForParticipants);
                    return selectedCamp && Array.isArray(selectedCamp.servicesOffered) && selectedCamp.servicesOffered.length > 0 ? (
                      <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                        <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                          <span>🩺</span> Services Offered in this Camp
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCamp.servicesOffered.map((service, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-md"
                            >
                              <span>✓</span> {service}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()
                )}

                {/* Participants Grid */}
                {selectedCampForParticipants ? (
                  <>
                    {viewLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                          <span className="text-4xl">⏳</span>
                        </motion.div>
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="text-6xl">👥</span>
                        <p className="text-gray-500 mt-4 text-lg">No participants registered yet for this camp</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">
                          {participants.length} Participant{participants.length !== 1 ? 's' : ''} Found
                        </h4>
                        {/* Grid Header */}
                        <div className="grid grid-cols-14 gap-2 bg-gradient-to-r from-rose-100 to-pink-100 p-4 rounded-lg font-bold text-gray-800 sticky top-16 z-10 text-xs md:text-sm">
                          <div className="col-span-2">Name</div>
                          <div className="col-span-1">Age</div>
                          <div className="col-span-1">Gender</div>
                          <div className="col-span-1">Phone</div>
                          <div className="col-span-1">Email</div>
                          <div className="col-span-2">Guardian</div>
                          <div className="col-span-2">Service</div>
                          <div className="col-span-2">Actions</div>
                        </div>
                        {/* Grid Rows */}
                        {participants.map((participant) => (
                          <motion.div
                            key={participant.participantId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grid grid-cols-14 gap-2 bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border-2 border-rose-200 hover:shadow-lg transition-all items-center text-xs md:text-sm"
                          >
                            <div className="col-span-2 text-sm font-semibold text-gray-800">{participant.participantName}</div>
                            <div className="col-span-1 text-gray-700">{participant.age}</div>
                            <div className="col-span-1 text-gray-700">{participant.gender}</div>
                            <div className="col-span-1 text-gray-700 truncate">{participant.phoneNumber}</div>
                            <div className="col-span-1 text-gray-700 truncate">{participant.email}</div>
                            <div className="col-span-2 text-gray-700 truncate">{participant.parentGuardianName}</div>
                            <div className="col-span-2">
                              {participant.service ? (
                                <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  {participant.service}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-xs">N/A</span>
                              )}
                            </div>
                            <div className="col-span-2 flex gap-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setEditingParticipant(participant);
                                  // Convert date to YYYY-MM-DD format for date input
                                  let dobValue = '';
                                  if (participant.dateOfBirth) {
                                    // Handle ISO datetime format (2005-03-15T00:00:00.000Z) or other formats
                                    const dateObj = new Date(participant.dateOfBirth);
                                    if (!isNaN(dateObj.getTime())) {
                                      const year = dateObj.getFullYear();
                                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                      const day = String(dateObj.getDate()).padStart(2, '0');
                                      dobValue = `${year}-${month}-${day}`;
                                    }
                                  }
                                  setEditParticipantForm({
                                    participantId: participant.participantId,
                                    participantName: participant.participantName,
                                    age: participant.age,
                                    gender: participant.gender,
                                    dateOfBirth: dobValue,
                                    phoneNumber: participant.phoneNumber,
                                    email: participant.email,
                                    parentGuardianName: participant.parentGuardianName,
                                    studentOrStaff: participant.studentOrStaff,
                                    classStandard: participant.classStandard || '',
                                    gradeYear: participant.gradeYear || '',
                                    rollNumber: participant.rollNumber || '',
                                    department: participant.department || '',
                                    existingDentalIssues: participant.existingDentalIssues || '',
                                    medicalHistory: participant.medicalHistory || '',
                                    currentMedications: participant.currentMedications || '',
                                    allergies: participant.allergies || '',
                                    consentGiven: participant.consentGiven || false,
                                    photoConsent: participant.photoConsent || false,
                                    registrationStatus: participant.registrationStatus || 'Registered',
                                    service: participant.service || ''
                                  });
                                  setShowEditParticipantModal(true);
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                              >
                                ✏️ Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${participant.participantName}? This action cannot be undone!`)) {
                                    handleDeleteParticipantConfirmed(participant.participantId);
                                  }
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all"
                              >
                                🗑️ Delete
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-6xl">👥</span>
                    <p className="text-gray-500 mt-4 text-lg">Please select a camp to view participants</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Participant Modal */}
      <AnimatePresence>
        {showEditParticipantModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditParticipantModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">✏️</span>
                    <div>
                      <h2 className="text-2xl font-bold">Edit Participant</h2>
                      <p className="text-amber-100 text-sm">Update participant information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditParticipantModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  // Format dateOfBirth to YYYY-MM-DD (date only) for DateTime? type
                  let dobFormatted = null;
                  if (editParticipantForm.dateOfBirth) {
                    const dateObj = new Date(editParticipantForm.dateOfBirth);
                    if (!isNaN(dateObj.getTime())) {
                      const year = dateObj.getFullYear();
                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                      const day = String(dateObj.getDate()).padStart(2, '0');
                      dobFormatted = `${year}-${month}-${day}`;
                    }
                  }

                  const participantDataToUpdate = {
                    campId: selectedCampForParticipants,
                    ...editParticipantForm,
                    dateOfBirth: dobFormatted,
                    service: Array.isArray(editParticipantForm.service) && editParticipantForm.service.length > 0 
                      ? editParticipantForm.service.join(', ') 
                      : ''
                  };

                  await updateCampParticipant(participantDataToUpdate);
                  setSuccessMessage("🎉 Participant updated successfully!");
                  
                  // Close modal immediately
                  setShowEditParticipantModal(false);
                  
                  // Wait a bit for visual feedback, then refresh and show latest data
                  setTimeout(async () => {
                    if (selectedCampForParticipants) {
                      await handleViewParticipants(selectedCampForParticipants);
                    }
                    // Keep showing success for a moment longer
                  }, 500);
                  
                  setTimeout(() => setSuccessMessage(""), 3500);
                } catch (error) {
                  console.error('Error updating participant:', error);
                  setErrorMessage(`Error updating participant: ${error.message}`);
                  setTimeout(() => setErrorMessage(""), 5000);
                } finally {
                  setLoading(false);
                }
              }} className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>👤</span> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editParticipantForm.participantName}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, participantName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={editParticipantForm.dateOfBirth}
                        onChange={(e) => {
                          const newDOB = e.target.value;
                          const calculatedAge = calculateAgeFromDOB(newDOB);
                          setEditParticipantForm({
                            ...editParticipantForm, 
                            dateOfBirth: newDOB,
                            age: calculatedAge ? parseInt(calculatedAge) : ''
                          });
                        }}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Age *</label>
                      <input
                        type="number"
                        required
                        value={editParticipantForm.age}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, age: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                      <select
                        required
                        value={editParticipantForm.gender}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, gender: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Services Availed Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Services Availed</label>
                  
                  <div className="relative">
                    {/* Dropdown toggle */}
                    <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border-2 border-rose-200 cursor-pointer hover:border-rose-400 transition-all"
                         onClick={() => {
                           if (!showParticipantServicesDropdown && selectedCampForParticipants) {
                             handleFetchParticipantServices(selectedCampForParticipants);
                           }
                           setShowParticipantServicesDropdown(!showParticipantServicesDropdown);
                         }}>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {editParticipantForm.service && Array.isArray(editParticipantForm.service) && editParticipantForm.service.length > 0 ? (
                          editParticipantForm.service.map((s, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full text-sm">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">Select services...</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!showParticipantServicesDropdown && selectedCampForParticipants) {
                            handleFetchParticipantServices(selectedCampForParticipants);
                          }
                          setShowParticipantServicesDropdown(!showParticipantServicesDropdown);
                        }}
                        className="ml-auto text-rose-600 hover:text-rose-800 transition-all"
                      >
                        {showParticipantServicesDropdown ? '▼' : '▶'}
                      </button>
                    </div>

                    {/* Dropdown list */}
                    {showParticipantServicesDropdown && (
                      <div>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowParticipantServicesDropdown(false)}
                        />
                        
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-rose-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                          {/* Search input */}
                          <div className="sticky top-0 bg-white border-b border-rose-100 p-2 z-30">
                            <input
                              type="text"
                              placeholder="Search services..."
                              value={participantServicesSearchInput}
                              onChange={(e) => handleParticipantServiceSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:border-rose-500 outline-none text-sm"
                              autoFocus
                            />
                          </div>

                          {/* Services list */}
                          <div className="py-2">
                            {participantServicesLoading && <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>}
                            {!participantServicesLoading && (!Array.isArray(filteredParticipantServices) || filteredParticipantServices.length === 0) && (
                              <div className="p-4 text-center text-gray-500 text-sm">No services available</div>
                            )}
                            {!participantServicesLoading && Array.isArray(filteredParticipantServices) && filteredParticipantServices.length > 0 && (
                              filteredParticipantServices.map((service, idx) => {
                                const serviceId = service.campServiceId || (idx + 1);
                                const isSelected = editParticipantForm.service && Array.isArray(editParticipantForm.service) && editParticipantForm.service.includes(service.campServiceName);
                                return (
                                  <label
                                    key={serviceId}
                                    className={isSelected ? 'flex items-center gap-3 px-4 py-3 bg-rose-100 cursor-pointer border-b border-rose-100 hover:bg-rose-150 transition-all' : 'flex items-center gap-3 px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-rose-100 transition-all'}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected || false}
                                      onChange={(e) => {
                                        const current = Array.isArray(editParticipantForm.service) ? [...editParticipantForm.service] : [];
                                        if (e.target.checked) {
                                          if (!current.includes(service.campServiceName)) {
                                            current.push(service.campServiceName);
                                          }
                                        } else {
                                          const idx = current.indexOf(service.campServiceName);
                                          if (idx > -1) current.splice(idx, 1);
                                        }
                                        setEditParticipantForm({
                                          ...editParticipantForm,
                                          service: current
                                        });
                                      }}
                                      className="w-4 h-4 text-rose-600"
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-gray-800">{service.campServiceName}</div>
                                      {service.campServiceCode && <div className="text-xs text-gray-500">{service.campServiceCode}</div>}
                                    </div>
                                    {isSelected && <span className="text-rose-600 text-lg font-bold">✓</span>}
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📞</span> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={editParticipantForm.phoneNumber}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, phoneNumber: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={editParticipantForm.email}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, email: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Parent/Guardian Name</label>
                      <input
                        type="text"
                        value={editParticipantForm.parentGuardianName}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, parentGuardianName: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical/Dental Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🏥</span> Medical/Dental Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Existing Dental Issues</label>
                      <textarea
                        value={editParticipantForm.existingDentalIssues}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, existingDentalIssues: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none h-20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Medical History</label>
                      <textarea
                        value={editParticipantForm.medicalHistory}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, medicalHistory: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none h-20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies</label>
                      <textarea
                        value={editParticipantForm.allergies}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, allergies: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none h-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📋</span> Registration Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                      <select
                        required
                        value={editParticipantForm.registrationStatus}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, registrationStatus: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                      >
                        <option value="Registered">Registered</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>✓</span> Consent
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editParticipantForm.consentGiven}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, consentGiven: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-700">Medical/Dental Treatment Consent</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editParticipantForm.photoConsent}
                        onChange={(e) => setEditParticipantForm({...editParticipantForm, photoConsent: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-700">Photo Documentation Consent</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "💾 Saving..." : "💾 Save Changes"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowEditParticipantModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all"
                  >
                    ✕ Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Camp Service Modal */}
      <AnimatePresence>
        {showAddServiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddServiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">➕</span>
                    <div>
                      <h2 className="text-2xl font-bold">Add New Service</h2>
                      <p className="text-purple-100 text-sm">Create a new dental/medical service</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddServiceModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAddCampService} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g., Root Canal Treatment"
                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    autoFocus
                  />
                </div>

                {/* Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> The service code will be auto-generated from the service name. You can use this service immediately in your camp registration.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading || !newServiceName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "✨ Add Service"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all"
                  >
                    ✕ Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camp Statistics Modal */}
      <CampStatisticsModal
        isOpen={showCampStatisticsModal}
        onClose={() => setShowCampStatisticsModal(false)}
      />

      {/* Pharmacy Billing Modal */}
      <PharmacyBillingModal
        show={showPharmacyBillingModal}
        onClose={() => setShowPharmacyBillingModal(false)}
      />
    </div>
  );
}
