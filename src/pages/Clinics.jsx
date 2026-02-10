import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FancyDatePicker from "../components/FancyDatePicker";
import { createDoctor } from "../services/doctorService";
import { getSelectedAccess } from "../services/authService";
import { useModal } from "../context/ModalContext";

const API_BASE_URL = (import.meta)?.env?.VITE_API_BASE_URL || 'https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api';

export default function Clinics(){
  const [log, setLog] = useState([]);
  const navigate = useNavigate();
  const { openOnboardStaffModal } = useModal();
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
  
  // View Clinics Modal states
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
  
  // Edit Clinic Modal states
  const [showEditClinicModal, setShowEditClinicModal] = useState(false);
  const [editClinicForm, setEditClinicForm] = useState(null);
  const [editingClinicId, setEditingClinicId] = useState(null);
  const [editClinicLoading, setEditClinicLoading] = useState(false);
  const [editClinicError, setEditClinicError] = useState("");
  
  // Delete Clinic confirmation states
  const [showDeleteClinicConfirm, setShowDeleteClinicConfirm] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deletingClinic, setDeletingClinic] = useState(false);
  const [deleteClinicError, setDeleteClinicError] = useState("");
  
  // Search Doctors Modal States
  const [showSearchDoctorsModal, setShowSearchDoctorsModal] = useState(false);
  const [searchDoctorsParams, setSearchDoctorsParams] = useState({
    enterpriseId: 0,
    clinicId: 0
  });
  const [searchDoctorsResults, setSearchDoctorsResults] = useState([]);
  const [searchDoctorsLoading, setSearchDoctorsLoading] = useState(false);
  const [searchDoctorsError, setSearchDoctorsError] = useState("");
  const [selectedDoctorView, setSelectedDoctorView] = useState(null);
  const [showDoctorDetailsModal, setShowDoctorDetailsModal] = useState(false);
  const [doctorDetailsLoading, setDoctorDetailsLoading] = useState(false);
  const [isEditingDoctorDetails, setIsEditingDoctorDetails] = useState(false);
  const [doctorEditFormData, setDoctorEditFormData] = useState(null);
  const [showDoctorUpdateSuccessModal, setShowDoctorUpdateSuccessModal] = useState(false);
  const [doctorUpdateSuccessMessage, setDoctorUpdateSuccessMessage] = useState("");
  const [showDoctorUpdateErrorModal, setShowDoctorUpdateErrorModal] = useState(false);
  const [doctorUpdateErrorMessage, setDoctorUpdateErrorMessage] = useState("");
  
  // Inventory Management States
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [showAddToMasterModal, setShowAddToMasterModal] = useState(false);
  const [masterInventoryItems, setMasterInventoryItems] = useState([]);
  const [masterItemRows, setMasterItemRows] = useState([
    {
      itemName: "",
      itemCode: "",
      category: "",
      subCategory: "",
      unit: "",
      isActive: true
    }
  ]);
  const [masterItemLoading, setMasterItemLoading] = useState(false);
  const [masterItemErrors, setMasterItemErrors] = useState({});
  const [inventoryFormData, setInventoryFormData] = useState({
    enterpriseId: 0,
    clinicId: 0,
    items: [
      {
        inventoryId: 0,
        itemId: 0,
        itemName: "",
        quantityAvailable: 0,
        reorderLevel: 0,
        minimumStock: 0,
        storageLocation: "",
        status: "Available"
      }
    ]
  });
  const [inventoryClinics, setInventoryClinics] = useState([]);
  const [inventoryResults, setInventoryResults] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [showInventorySuccess, setShowInventorySuccess] = useState(false);
  const [inventorySuccessMessage, setInventorySuccessMessage] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [showMasterSuccess, setShowMasterSuccess] = useState(false);
  const [masterSuccessMessage, setMasterSuccessMessage] = useState("");
  
  // Funny success messages for inventory
  const funnyInventoryMessages = [
    "🎉 Boom! Your inventory is now legendary!",
    "💎 Holy moly! You just became an inventory wizard!",
    "🌟 Your inventory is so organized, Marie Kondo just called!",
    "🎊 Bazinga! Your items are perfectly stocked!",
    "🏆 You deserve a medal! Your inventory is immaculate!",
    "🚀 Houston, we have perfect inventory!",
    "💫 Your inventory is chef's kiss!",
    "🎯 Nailed it! Your inventory is on point!",
    "✨ Abracadabra! Magic inventory levels detected!"
  ];

  const funnyMasterMessages = [
    "🎁 New items unlocked! You're a master now!",
    "📚 Your master catalog just grew wings!",
    "🌈 Rainbow of inventory added to the vault!",
    "🎪 The master inventory circus just got bigger!",
    "👑 Royal items have entered the kingdom!",
    "🔥 Master inventory on fire with new items!",
    "🎨 Your master palette just got more colorful!",
    "🌺 Beautiful items blooming in the master list!",
    "⚡ Lightning fast! Master items added!"
  ];
  
  // Enterprises list for clinic creation
  const [allEnterprises, setAllEnterprises] = useState([]);
  const [loadingEnterprises, setLoadingEnterprises] = useState(false);

  // Load enterprises on initial page load so dropdowns on the page are populated
  useEffect(() => {
    const loadEnterprisesOnMount = async () => {
      try {
        setLoadingEnterprises(true);
        const response = await fetch(`${API_BASE_URL}/Enterprise`, {
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
          console.warn("Failed to load enterprises on mount", response.status, "using login enterprise");
          // Fallback: Use enterprise from login
          const selectedAccess = getSelectedAccess();
          if (selectedAccess?.enterpriseId) {
            const loginEnterprise = {
              enterpriseId: selectedAccess.enterpriseId,
              enterpriseName: `Enterprise ${selectedAccess.enterpriseId}`
            };
            setAllEnterprises([loginEnterprise]);
            setDoctorEnterprises([loginEnterprise]);
            console.log("✅ Using enterprise from login on mount:", loginEnterprise);
          }
        }
      } catch (error) {
        console.error("Error loading enterprises on mount:", error);
        // Fallback: Use enterprise from login
        const selectedAccess = getSelectedAccess();
        if (selectedAccess?.enterpriseId) {
          const loginEnterprise = {
            enterpriseId: selectedAccess.enterpriseId,
            enterpriseName: `Enterprise ${selectedAccess.enterpriseId}`
          };
          setAllEnterprises([loginEnterprise]);
          setDoctorEnterprises([loginEnterprise]);
          console.log("✅ Using enterprise from login on mount (error):", loginEnterprise);
        }
      } finally {
        setLoadingEnterprises(false);
      }
    };

    loadEnterprisesOnMount();
  }, []);

  // Load master inventory items when modal opens
  useEffect(() => {
    if (showAddInventoryModal) {
      const loadMasterItems = async () => {
        try {
          const response = await fetch("`${API_BASE_URL}/inventory/GetAllInventoryMasterItems", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log("📦 Master inventory items loaded:", data);
            setMasterInventoryItems(Array.isArray(data) ? data : data.data || []);
          } else {
            console.error("Failed to load master inventory items", response.status);
            setMasterInventoryItems([]);
          }
        } catch (error) {
          console.error("Error loading master inventory items:", error);
          setMasterInventoryItems([]);
        }
      };

      loadMasterItems();
    }
  }, [showAddInventoryModal]);

  const searchEnterprise = async () => {
    if (!manageEnterpriseSearchId.trim()) {
      setManageEnterpriseError("Please enter an Enterprise ID");
      return;
    }
    
    try {
      setManageEnterpriseLoading(true);
      setManageEnterpriseError("");
      
      const response = await fetch(`${API_BASE_URL}/Enterprise/${manageEnterpriseSearchId}`, {
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
      
      const response = await fetch(`${API_BASE_URL}/Enterprise/EditEnterpriseInfo`, {
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
        const response = await fetch(`${API_BASE_URL}/Enterprise`, {
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
        } else {
          console.warn("Failed to load enterprises from API, using login enterprise");
          // Fallback: Use enterprise from login
          const selectedAccess = getSelectedAccess();
          if (selectedAccess?.enterpriseId) {
            const loginEnterprise = {
              enterpriseId: selectedAccess.enterpriseId,
              enterpriseName: `Enterprise ${selectedAccess.enterpriseId}`
            };
            setAllEnterprises([loginEnterprise]);
            setDoctorEnterprises([loginEnterprise]);
            console.log("✅ Using enterprise from login:", loginEnterprise);
          }
        }
      } catch (error) {
        console.error("Error loading enterprises:", error);
        // Fallback: Use enterprise from login
        const selectedAccess = getSelectedAccess();
        if (selectedAccess?.enterpriseId) {
          const loginEnterprise = {
            enterpriseId: selectedAccess.enterpriseId,
            enterpriseName: `Enterprise ${selectedAccess.enterpriseId}`
          };
          setAllEnterprises([loginEnterprise]);
          setDoctorEnterprises([loginEnterprise]);
          console.log("✅ Using enterprise from login (error fallback):", loginEnterprise);
        }
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
        const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${doctorFormData.enterpriseId}`, {
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
  
  // Load clinics for View Clinics modal when enterprise is selected
  useEffect(() => {
    const loadClinicsForListModal = async () => {
      if (!listClinicsFilters.enterpriseId || listClinicsFilters.enterpriseId === 0) {
        setDoctorClinics([]);
        return;
      }
      
      try {
        setLoadingDoctorClinics(true);
        const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${listClinicsFilters.enterpriseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("🏥 Clinics loaded for enterprise in View Clinics:", data);
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

  // Load clinics automatically when View Clinics modal opens
  useEffect(() => {
    if (showListClinicsModal) {
      const selectedAccess = getSelectedAccess();
      if (selectedAccess?.enterpriseId) {
        const loadAllClinics = async () => {
          try {
            setListClinicsLoading(true);
            const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${selectedAccess.enterpriseId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              console.log("🏥 All clinics loaded for enterprise:", data);
              setListClinicsSearchResults(Array.isArray(data) ? data : [data]);
              setListClinicsError("");
            } else {
              setListClinicsError("Failed to load clinics");
              setListClinicsSearchResults([]);
            }
          } catch (error) {
            console.error("Error loading clinics:", error);
            setListClinicsError(error.message);
            setListClinicsSearchResults([]);
          } finally {
            setListClinicsLoading(false);
          }
        };

        loadAllClinics();
      }
    }
  }, [showListClinicsModal]);

  // Load clinics for Search Doctors modal when enterprise is selected
  useEffect(() => {
    const loadClinicsForSearchDoctors = async () => {
      if (!searchDoctorsParams.enterpriseId || searchDoctorsParams.enterpriseId === 0) {
        setDoctorClinics([]);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${searchDoctorsParams.enterpriseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("🏥 Clinics loaded for enterprise in Search Doctors:", data);
          setDoctorClinics(Array.isArray(data) ? data : data.data || []);
        } else {
          console.error("Failed to load clinics for Search Doctors");
          setDoctorClinics([]);
        }
      } catch (error) {
        console.error("Error loading clinics for Search Doctors:", error);
        setDoctorClinics([]);
      }
    };
    
    loadClinicsForSearchDoctors();
  }, [searchDoctorsParams.enterpriseId]);

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
      // Pre-populate enterprise from login
      const selectedAccess = getSelectedAccess();
      if (selectedAccess?.enterpriseId) {
        setCreateClinicForm(prev => ({
          ...prev,
          enterpriseId: selectedAccess.enterpriseId
        }));
      }
      setShowCreateClinicModal(true);
      return;
    }
    if (action === "View Clinics") { 
      setShowListClinicsModal(true);
      return; 
    }
    if (action === "View Staff") { 
      navigate('/staff/details');
      return;
    }
    if (action === "Onboard Staff") { 
      openOnboardStaffModal();
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
      // System tracking
      branchId: "",
      role: "Doctor",
      // Enterprise and Clinic assignment
      enterpriseId: 0,
      clinicId: 0
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
        enterpriseId: parseInt(doctorFormData.enterpriseId) || 0,
        clinicId: parseInt(doctorFormData.clinicId) || 0,
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

  // Search Doctors Handler
  const handleSearchDoctors = async (e) => {
    e?.preventDefault();
    
    // Validate enterprise ID
    if (searchDoctorsParams.enterpriseId === 0 || searchDoctorsParams.enterpriseId === "") {
      setSearchDoctorsError("Please select an Enterprise to search doctors");
      return;
    }

    setSearchDoctorsLoading(true);
    setSearchDoctorsError("");
    
    try {
      // Build query parameters
      let queryParams = `EnterpriseID=${searchDoctorsParams.enterpriseId}`;
      if (searchDoctorsParams.clinicId && searchDoctorsParams.clinicId > 0) {
        queryParams += `&clinicId=${searchDoctorsParams.clinicId}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/DoctorProfile/SearchDoctors?${queryParams}`,
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
        console.log("🩺 Search doctors results:", data);
        setSearchDoctorsResults(Array.isArray(data) ? data : data.data || []);
        setSearchDoctorsError("");
      } else {
        const errorData = await response.json();
        setSearchDoctorsError(errorData.message || "Failed to search doctors");
        setSearchDoctorsResults([]);
      }
    } catch (error) {
      console.error("Error searching doctors:", error);
      setSearchDoctorsError("Error searching doctors. Please try again.");
      setSearchDoctorsResults([]);
    } finally {
      setSearchDoctorsLoading(false);
    }
  };

  // Get Doctor Details
  const handleViewDoctorDetails = async (doctorId) => {
    setDoctorDetailsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/DoctorProfile/GetDoctorById?id=${doctorId}`,
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
        console.log("🩺 Doctor details:", data);
        setSelectedDoctorView(data);
        setDoctorEditFormData(data);
        setShowDoctorDetailsModal(true);
        setIsEditingDoctorDetails(false);
      } else {
        alert("Failed to load doctor details");
      }
    } catch (error) {
      console.error("Error loading doctor details:", error);
      alert("Error loading doctor details. Please try again.");
    } finally {
      setDoctorDetailsLoading(false);
    }
  };

  // Handle Edit Doctor
  const handleEditDoctor = () => {
    setIsEditingDoctorDetails(true);
  };

  // Handle Cancel Edit
  const handleCancelEditDoctor = () => {
    setIsEditingDoctorDetails(false);
    setDoctorEditFormData(selectedDoctorView);
  };

  // Handle Update Doctor
  const handleUpdateDoctor = async () => {
    try {
      setDoctorDetailsLoading(true);
      const payload = {
        ...doctorEditFormData,
        dateOfBirth: doctorEditFormData.dateOfBirth ? new Date(doctorEditFormData.dateOfBirth).toISOString() : doctorEditFormData.dateOfBirth,
        licenseExpiry: doctorEditFormData.licenseExpiry ? new Date(doctorEditFormData.licenseExpiry).toISOString() : doctorEditFormData.licenseExpiry,
        joiningDate: doctorEditFormData.joiningDate ? new Date(doctorEditFormData.joiningDate).toISOString() : doctorEditFormData.joiningDate,
      };

      const response = await fetch("`${API_BASE_URL}/DoctorProfile/UpdateDoctorProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log("✅ Doctor updated successfully");
        setDoctorUpdateSuccessMessage("Doctor profile updated successfully!");
        setShowDoctorUpdateSuccessModal(true);
        setIsEditingDoctorDetails(false);
        
        // Update the selected doctor view with new data
        setSelectedDoctorView(doctorEditFormData);
        
        // Refresh search results
        setTimeout(() => {
          handleSearchDoctors();
        }, 1500);
      } else {
        const errorData = await response.json();
        setDoctorUpdateErrorMessage(errorData.message || "Failed to update doctor profile");
        setShowDoctorUpdateErrorModal(true);
      }
    } catch (error) {
      console.error("Error updating doctor:", error);
      setDoctorUpdateErrorMessage("Error updating doctor profile. Please try again.");
      setShowDoctorUpdateErrorModal(true);
    } finally {
      setDoctorDetailsLoading(false);
    }
  };

  // Inventory Management Handlers
  const loadClinicsForInventory = async (enterpriseId) => {
    if (!enterpriseId || enterpriseId === 0) {
      setInventoryClinics([]);
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
        console.log("🏥 Clinics loaded for inventory:", data);
        setInventoryClinics(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error loading clinics for inventory:", error);
      setInventoryClinics([]);
    }
  };

  // Handle Add Inventory Item Row
  const handleAddInventoryRow = () => {
    setInventoryFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          inventoryId: 0,
          itemId: 0,
          itemName: "",
          quantityAvailable: 0,
          reorderLevel: 0,
          minimumStock: 0,
          storageLocation: "",
          status: "Available"
        }
      ]
    }));
  };

  // Handle Remove Inventory Item Row
  const handleRemoveInventoryRow = (index) => {
    setInventoryFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle Inventory Item Change
  const handleInventoryItemChange = (index, field, value) => {
    setInventoryFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Handle Add Inventory Submit
  const handleAddInventorySubmit = async (e) => {
    e.preventDefault();

    if (inventoryFormData.enterpriseId === 0) {
      setInventoryError("Please select an Enterprise");
      return;
    }
    if (inventoryFormData.clinicId === 0) {
      setInventoryError("Please select a Clinic");
      return;
    }
    if (inventoryFormData.items.length === 0) {
      setInventoryError("Please add at least one inventory item");
      return;
    }

    // Validate all items
    for (let item of inventoryFormData.items) {
      if (!item.itemName?.trim()) {
        setInventoryError("Please fill in all item names");
        return;
      }
      if (item.quantityAvailable <= 0) {
        setInventoryError("Please enter valid quantities");
        return;
      }
    }

    setInventoryLoading(true);
    try {
      // Format items as ClinicInventory objects (matching backend model)
      const items = inventoryFormData.items.map((item) => ({
        inventoryId: item.inventoryId || 0,
        itemId: item.itemId,
        itemName: item.itemName,
        enterpriseId: parseInt(inventoryFormData.enterpriseId),
        clinicId: parseInt(inventoryFormData.clinicId),
        quantityAvailable: parseInt(item.quantityAvailable) || 0,
        reorderLevel: parseInt(item.reorderLevel) || 0,
        minimumStock: parseInt(item.minimumStock) || 0,
        storageLocation: item.storageLocation || '',
        status: item.status || 'Available'
      }));

      const payload = {
        enterpriseId: parseInt(inventoryFormData.enterpriseId),
        clinicId: parseInt(inventoryFormData.clinicId),
        items: items
      };

      console.log("📦 Adding inventory:", payload);

      // Use the correct API endpoint for adding clinic inventory
      const response = await fetch("`${API_BASE_URL}/inventory/SaveClinicInventoryBatch?enterpriseId=" + payload.enterpriseId + "&clinicId=" + payload.clinicId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(items)
      });

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        console.log("✅ Success response:", responseData);
        
        const randomMessage = funnyInventoryMessages[Math.floor(Math.random() * funnyInventoryMessages.length)];
        setInventorySuccessMessage(randomMessage);
        setShowInventorySuccess(true);
        
        // Reset form
        setInventoryFormData({
          enterpriseId: 0,
          clinicId: 0,
          items: [
            {
              inventoryId: 0,
              itemId: 0,
              itemName: "",
              quantityAvailable: 0,
              reorderLevel: 0,
              minimumStock: 0,
              storageLocation: "",
              status: "Available"
            }
          ]
        });

        setTimeout(() => {
          setShowAddInventoryModal(false);
          setShowInventorySuccess(false);
        }, 2000);
      } else {
        console.error("❌ Error response status:", response.status);
        const errorText = await response.text();
        console.error("❌ Error response body:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          setInventoryError(errorData.message || `Failed to add inventory (${response.status})`);
        } catch (e) {
          setInventoryError(`Failed to add inventory. Server responded with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error adding inventory:", error);
      setInventoryError("Error adding inventory: " + (error.message || "Unknown error"));
    } finally {
      setInventoryLoading(false);
    }
  };

  // Master Inventory Handlers
  const handleAddMasterRow = () => {
    setMasterItemRows([...masterItemRows, {
      itemName: "",
      itemCode: "",
      category: "",
      subCategory: "",
      unit: "",
      isActive: true
    }]);
  };

  const handleRemoveMasterRow = (index) => {
    if (masterItemRows.length > 1) {
      setMasterItemRows(masterItemRows.filter((_, i) => i !== index));
      setMasterItemErrors({});
    }
  };

  const handleMasterItemChange = (index, field, value) => {
    const updatedRows = [...masterItemRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setMasterItemRows(updatedRows);
  };

  const handleAddToMasterSubmit = async (e) => {
    e.preventDefault();

    // Validate rows
    const validRows = masterItemRows.filter(row => {
      return row.itemName.trim() && row.itemCode.trim() && row.category && row.unit;
    });

    if (validRows.length === 0) {
      alert("Please fill at least one master item with required fields");
      return;
    }

    setMasterItemLoading(true);
    try {
      const response = await fetch("`${API_BASE_URL}/inventory/AddInventoryMasterItemsBulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(validRows)
      });

      if (response.ok) {
        const randomMessage = funnyMasterMessages[Math.floor(Math.random() * funnyMasterMessages.length)];
        setMasterSuccessMessage(randomMessage);
        setShowMasterSuccess(true);
        
        // Reload master items
        const reloadResponse = await fetch("`${API_BASE_URL}/inventory/GetAllInventoryMasterItems", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setMasterInventoryItems(Array.isArray(data) ? data : data.data || []);
        }

        // Reset form after delay
        setTimeout(() => {
          setMasterItemRows([{
            itemName: "",
            itemCode: "",
            category: "",
            subCategory: "",
            unit: "",
            isActive: true
          }]);
          setMasterItemErrors({});
          setShowAddToMasterModal(false);
          setShowMasterSuccess(false);
        }, 2000);
      } else {
        alert("Failed to add master inventory items");
      }
    } catch (error) {
      console.error("Error adding master items:", error);
      alert("Error adding master items: " + error.message);
    } finally {
      setMasterItemLoading(false);
    }
  };

  // Handle Edit Inventory Search
  const handleSearchEditInventory = async () => {
    if (inventoryFormData.enterpriseId === 0) {
      setInventoryError("Please select an Enterprise");
      return;
    }
    if (inventoryFormData.clinicId === 0) {
      setInventoryError("Please select a Clinic");
      return;
    }

    setInventoryLoading(true);
    try {
      // Use the correct API endpoint: GetClinicInventoryByClinicId
      const response = await fetch(
        `${API_BASE_URL}/Inventory/GetClinicInventoryByClinicId?clinicId=${inventoryFormData.clinicId}`,
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
        console.log("📦 Inventory items loaded:", data);
        setInventoryResults(Array.isArray(data) ? data : data.data || []);
        setInventoryError("");
      } else {
        setInventoryError("No inventory items found for this clinic");
        setInventoryResults([]);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      setInventoryError("Error loading inventory. Please try again.");
      setInventoryResults([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Handle Save All Inventory Changes
  const handleSaveInventoryChanges = async () => {
    setInventoryLoading(true);
    try {
      const payload = {
        enterpriseId: parseInt(inventoryFormData.enterpriseId),
        clinicId: parseInt(inventoryFormData.clinicId),
        items: inventoryResults.map((item) => ({
          inventoryId: item.inventoryId || 0,
          itemId: item.itemId,
          itemName: item.itemName,
          enterpriseId: inventoryFormData.enterpriseId,
          clinicId: inventoryFormData.clinicId,
          quantityAvailable: parseInt(item.quantityAvailable) || 0,
          reorderLevel: parseInt(item.reorderLevel) || 0,
          minimumStock: parseInt(item.minimumStock) || 0,
          storageLocation: item.storageLocation || "",
          status: item.status || "Available"
        }))
      };

      console.log("💾 Saving inventory changes:", payload);

      const response = await fetch(`${API_BASE_URL}/inventory/SaveClinicInventoryBatch?enterpriseId=${inventoryFormData.enterpriseId}&clinicId=${inventoryFormData.clinicId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload.items)
      });

      if (response.ok) {
        const randomMessage = funnyInventoryMessages[Math.floor(Math.random() * funnyInventoryMessages.length)];
        setInventorySuccessMessage(randomMessage);
        setShowInventorySuccess(true);

        setTimeout(() => {
          setShowEditInventoryModal(false);
          setShowInventorySuccess(false);
        }, 2000);
      } else {
        const errorText = await response.text();
        setInventoryError(errorText || "Failed to update inventory");
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      setInventoryError("Error updating inventory. Please try again.");
    } finally {
      setInventoryLoading(false);
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
      title: "View Clinics", 
      icon: "📋", 
      description: "View all registered clinics",
      color: "from-blue-400 to-cyan-400",
      bgColor: "from-blue-50 to-cyan-50",
      action: () => onAction("View Clinics")
    }
  ];

  // Staff Management Actions
  const doctorActions = [
    { 
      title: "Onboard Staff", 
      icon: "👨‍⚕️", 
      description: "Add and manage staff",
      color: "from-indigo-400 to-purple-400",
      bgColor: "from-purple-50 to-indigo-50",
      action: () => onAction("Onboard Staff")
    },
    { 
      title: "View Staff", 
      icon: "👁️", 
      description: "Search and manage staff profiles",
      color: "from-violet-400 to-purple-400",
      bgColor: "from-violet-50 to-purple-50",
      action: () => onAction("View Staff")
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

  // Inventory Management Actions
  const inventoryActions = [
    { 
      title: "Add Inventory", 
      icon: "📦", 
      description: "Add new inventory items",
      color: "from-cyan-400 to-blue-400",
      bgColor: "from-cyan-50 to-blue-50",
      action: () => {
        setShowAddInventoryModal(true);
        setInventoryError("");
        setInventoryFormData({
          enterpriseId: 0,
          clinicId: 0,
          items: [
            {
              inventoryItemId: 0,
              itemName: "",
              quantity: 0,
              unit: "pcs",
              description: ""
            }
          ]
        });
      }
    },
    { 
      title: "Manage Inventory", 
      icon: "✏️", 
      description: "Manage existing inventory",
      color: "from-orange-400 to-amber-400",
      bgColor: "from-orange-50 to-amber-50",
      action: () => {
        setShowEditInventoryModal(true);
        setInventoryError("");
        setInventoryResults([]);
        setInventoryFormData({
          enterpriseId: 0,
          clinicId: 0,
          items: []
        });
      }
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
        {getSelectedAccess().roleId === 1 && (
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
            {enterpriseActions.filter(() => getSelectedAccess().roleId === 1).map((action, index) => (
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
        )}

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
          </div>
        </motion.div>

        {/* STAFF MANAGEMENT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span>👨‍⚕️</span>
            Staff Management
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

        {/* INVENTORY MANAGEMENT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <span>📦</span>
            Inventory Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventoryActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
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
                      Staff Management
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
                    Staff Management
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
                              <FancyDatePicker
                                value={doctorFormData.dateOfBirth}
                                onChange={(date) => {
                                  setDoctorFormData({ ...doctorFormData, dateOfBirth: date });
                                  if (date) {
                                    setValidationErrors(validationErrors.filter(err => err !== "dateOfBirth"));
                                  }
                                }}
                                required
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
                              <FancyDatePicker
                                value={doctorFormData.licenseExpiry}
                                onChange={(date) => {
                                  setDoctorFormData({ ...doctorFormData, licenseExpiry: date });
                                  if (date) {
                                    setValidationErrors(validationErrors.filter(err => err !== "licenseExpiry"));
                                  }
                                }}
                                required
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
                              <FancyDatePicker
                                value={doctorFormData.joiningDate}
                                onChange={(date) => {
                                  setDoctorFormData({ ...doctorFormData, joiningDate: date });
                                  if (date) {
                                    setValidationErrors(validationErrors.filter(err => err !== "joiningDate"));
                                  }
                                }}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-purple-900 mb-2">Employment Status <span className="text-red-500">*</span></label>
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
                          className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors ${
                            createClinicForm.contactEmail && !createClinicForm.contactEmail.includes('@') 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-slate-300'
                          }`}
                        />
                        {createClinicForm.contactEmail && !createClinicForm.contactEmail.includes('@') && (
                          <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Please enter a valid email address</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number * (Max 10 digits)</label>
                        <input
                          type="tel"
                          value={createClinicForm.contactPhone}
                          onChange={(e) => {
                            const phoneValue = e.target.value.replace(/\D/g, '');
                            if (phoneValue.length <= 10) {
                              setCreateClinicForm({ ...createClinicForm, contactPhone: phoneValue });
                            }
                          }}
                          placeholder="Enter up to 10 digits"
                          maxLength="10"
                          className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors ${
                            createClinicForm.contactPhone.length > 10 ? 'border-red-500 bg-red-50' : 'border-slate-300'
                          }`}
                        />
                        {createClinicForm.contactPhone.length > 0 && (
                          <p className="text-xs text-slate-600 font-semibold mt-1">
                            {createClinicForm.contactPhone.length}/10 digits
                          </p>
                        )}
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
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Postal Code * (Max 6 digits)</label>
                        <input
                          type="text"
                          value={createClinicForm.postalCode}
                          onChange={(e) => {
                            const postalValue = e.target.value.replace(/\D/g, '');
                            if (postalValue.length <= 6) {
                              setCreateClinicForm({ ...createClinicForm, postalCode: postalValue });
                            }
                          }}
                          placeholder="Enter up to 6 digits"
                          maxLength="6"
                          className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 transition-colors ${
                            createClinicForm.postalCode.length > 6 ? 'border-red-500 bg-red-50' : 'border-slate-300'
                          }`}
                        />
                        {createClinicForm.postalCode.length > 0 && (
                          <p className="text-xs text-slate-600 font-semibold mt-1">
                            {createClinicForm.postalCode.length}/6 digits
                          </p>
                        )}
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
                          console.log("🔗 API Endpoint: ${API_BASE_URL}/Clinic/CreateClinicInfo");
                          console.log("📤 Sending clinicModel:", JSON.stringify(clinicModel, null, 2));
                          
                          const response = await fetch(`${API_BASE_URL}/Clinic/CreateClinicInfo`, {
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
                          
                          const response = await fetch("`${API_BASE_URL}/Enterprise/CreateEnterprise", {
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

      {/* View Clinics Modal */}
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
                <h3 className="text-lg font-bold text-slate-800">📋 Your Clinics</h3>
                <p className="text-sm text-slate-600 mt-1">View and manage all clinics in your organization</p>
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
                    <p className="text-3xl mb-3">🏥</p>
                    <p className="text-slate-600 text-center">No clinics found in your organization.</p>
                  </div>
                )}
              </div>

              {/* Footer with Actions */}
              <div className="bg-slate-100 p-4 border-t-2 border-slate-200 flex justify-end items-center gap-3">
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
                  onClick={() => {
                    setEditClinicForm({ ...selectedClinicView });
                    setEditingClinicId(selectedClinicView.clinicId);
                    setShowClinicDetailsModal(false);
                    setShowEditClinicModal(true);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
                >
                  ✏️ Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `⚠️ Are you sure you want to delete "${selectedClinicView.clinicName}"?\n\nThis action cannot be undone.`
                    );
                    if (confirmed) {
                      setClinicToDelete(selectedClinicView);
                      setShowClinicDetailsModal(false);
                      setShowDeleteClinicConfirm(true);
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition"
                >
                  🗑️ Delete
                </motion.button>
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

      {/* Edit Clinic Modal */}
      <AnimatePresence>
        {showEditClinicModal && editClinicForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditClinicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white sticky top-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">✏️ Edit Clinic</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditClinicModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {editClinicError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-semibold">❌ {editClinicError}</p>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>📋</span> Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Name *</label>
                      <input
                        type="text"
                        value={editClinicForm.clinicName}
                        onChange={(e) => setEditClinicForm({ ...editClinicForm, clinicName: e.target.value })}
                        placeholder="Enter clinic name"
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Code *</label>
                      <input
                        type="text"
                        value={editClinicForm.clinicCode}
                        onChange={(e) => setEditClinicForm({ ...editClinicForm, clinicCode: e.target.value })}
                        placeholder="e.g., CLINIC-001"
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>📞</span> Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={editClinicForm.contactEmail}
                        onChange={(e) => setEditClinicForm({ ...editClinicForm, contactEmail: e.target.value })}
                        placeholder="clinic@example.com"
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          editClinicForm.contactEmail && !editClinicForm.contactEmail.includes('@') 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone * (Max 10 digits)</label>
                      <input
                        type="tel"
                        value={editClinicForm.contactPhone}
                        onChange={(e) => {
                          const phoneValue = e.target.value.replace(/\D/g, '');
                          if (phoneValue.length <= 10) {
                            setEditClinicForm({ ...editClinicForm, contactPhone: phoneValue });
                          }
                        }}
                        placeholder="Enter up to 10 digits"
                        maxLength="10"
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>📍</span> Address Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 1 *</label>
                      <input
                        type="text"
                        value={editClinicForm.addressLine1}
                        onChange={(e) => setEditClinicForm({ ...editClinicForm, addressLine1: e.target.value })}
                        placeholder="Street address"
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={editClinicForm.addressLine2 || ''}
                        onChange={(e) => setEditClinicForm({ ...editClinicForm, addressLine2: e.target.value })}
                        placeholder="Apartment, suite, etc. (optional)"
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={editClinicForm.city}
                          onChange={(e) => setEditClinicForm({ ...editClinicForm, city: e.target.value })}
                          placeholder="City"
                          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">State *</label>
                        <input
                          type="text"
                          value={editClinicForm.state}
                          onChange={(e) => setEditClinicForm({ ...editClinicForm, state: e.target.value })}
                          placeholder="State"
                          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={editClinicForm.country || ''}
                          onChange={(e) => setEditClinicForm({ ...editClinicForm, country: e.target.value })}
                          placeholder="Country"
                          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Postal Code * (Max 6 digits)</label>
                        <input
                          type="text"
                          value={editClinicForm.postalCode || ''}
                          onChange={(e) => {
                            const postalValue = e.target.value.replace(/\D/g, '');
                            if (postalValue.length <= 6) {
                              setEditClinicForm({ ...editClinicForm, postalCode: postalValue });
                            }
                          }}
                          placeholder="Enter up to 6 digits"
                          maxLength="6"
                          className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 p-4 border-t-2 border-slate-200 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditClinicModal(false)}
                  disabled={editClinicLoading}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-60"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!editClinicForm.clinicName || !editClinicForm.clinicCode || !editClinicForm.contactEmail || 
                        !editClinicForm.contactPhone || !editClinicForm.addressLine1 || !editClinicForm.city || !editClinicForm.state) {
                      setEditClinicError("Please fill in all required fields");
                      return;
                    }

                    if (editClinicForm.contactEmail && !editClinicForm.contactEmail.includes('@')) {
                      setEditClinicError("Please enter a valid email address");
                      return;
                    }

                    try {
                      setEditClinicLoading(true);
                      setEditClinicError("");

                      const response = await fetch(`${API_BASE_URL}/Clinic/${editingClinicId}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                        },
                        body: JSON.stringify(editClinicForm)
                      });

                      if (response.ok) {
                        setShowEditClinicModal(false);
                        // Refresh the clinics list
                        setListClinicsSearchResults([]);
                        setListClinicsFilters({ ...listClinicsFilters, clinicId: 0 });
                        alert("✅ Clinic updated successfully!");
                      } else {
                        const errorData = await response.text();
                        setEditClinicError(`Failed to update clinic: ${errorData || response.statusText}`);
                      }
                    } catch (error) {
                      console.error("Error updating clinic:", error);
                      setEditClinicError(error.message || "Error updating clinic");
                    } finally {
                      setEditClinicLoading(false);
                    }
                  }}
                  disabled={editClinicLoading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-60"
                >
                  {editClinicLoading ? "Saving..." : "💾 Save Changes"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Clinic Confirmation Modal */}
      <AnimatePresence>
        {showDeleteClinicConfirm && clinicToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🗑️</span>
                <h3 className="text-2xl font-bold text-slate-800">Delete Clinic?</h3>
              </div>

              {/* Message */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <p className="text-slate-800">
                  Are you sure you want to delete <span className="font-bold text-red-600">{clinicToDelete.clinicName}</span>?
                </p>
                <p className="text-sm text-slate-600 mt-2">This action cannot be undone.</p>
              </div>

              {/* Error Message */}
              {deleteClinicError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 font-semibold">❌ {deleteClinicError}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowDeleteClinicConfirm(false);
                    setClinicToDelete(null);
                  }}
                  disabled={deletingClinic}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-60"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      setDeletingClinic(true);
                      setDeleteClinicError("");

                      const response = await fetch(`${API_BASE_URL}/Clinic/${clinicToDelete.clinicId}`, {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                        }
                      });

                      if (response.ok) {
                        setShowDeleteClinicConfirm(false);
                        alert("✅ Clinic deleted successfully!");
                        
                        // Reload clinics list from login enterprise
                        const selectedAccess = getSelectedAccess();
                        if (selectedAccess?.enterpriseId) {
                          try {
                            const reloadResponse = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${selectedAccess.enterpriseId}`, {
                              method: "GET",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                              }
                            });

                            if (reloadResponse.ok) {
                              const data = await reloadResponse.json();
                              console.log("🏥 Clinics reloaded after deletion:", data);
                              setListClinicsSearchResults(Array.isArray(data) ? data : [data]);
                            }
                          } catch (reloadError) {
                            console.error("Error reloading clinics:", reloadError);
                          }
                        }
                      } else {
                        const errorData = await response.text();
                        setDeleteClinicError(`Failed to delete clinic: ${errorData || response.statusText}`);
                      }
                    } catch (error) {
                      console.error("Error deleting clinic:", error);
                      setDeleteClinicError(error.message || "Error deleting clinic");
                    } finally {
                      setDeletingClinic(false);
                    }
                  }}
                  disabled={deletingClinic}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition disabled:opacity-60"
                >
                  {deletingClinic ? "Deleting..." : "🗑️ Delete"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Doctors Modal */}
      <AnimatePresence>
        {showSearchDoctorsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearchDoctorsModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">🔍 Search Doctors</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSearchDoctorsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Search Criteria */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Search Criteria</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Enterprise ID */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Enterprise <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={searchDoctorsParams.enterpriseId}
                      onChange={(e) => {
                        setSearchDoctorsParams(prev => ({
                          ...prev,
                          enterpriseId: parseInt(e.target.value) || 0,
                          clinicId: 0 // Reset clinic when enterprise changes
                        }));
                        setSearchDoctorsError("");
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-medium bg-white"
                    >
                      <option value="0">-- Select Enterprise --</option>
                      {allEnterprises.map((enterprise) => (
                        <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                          [{enterprise.enterpriseId}] {enterprise.enterpriseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clinic ID */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Clinic <span className="text-gray-400">(Optional)</span>
                    </label>
                    <select
                      value={searchDoctorsParams.clinicId}
                      onChange={(e) =>
                        setSearchDoctorsParams(prev => ({
                          ...prev,
                          clinicId: parseInt(e.target.value) || 0
                        }))
                      }
                      disabled={searchDoctorsParams.enterpriseId === 0}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-medium bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="0">-- All Clinics --</option>
                      {doctorClinics.map((clinic) => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>
                          [{clinic.clinicId}] {clinic.clinicName} {clinic.address ? `- ${clinic.address}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Error Message */}
                {searchDoctorsError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold flex items-center gap-2"
                  >
                    <span>⚠️</span> {searchDoctorsError}
                  </motion.div>
                )}

                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearchDoctors}
                  disabled={searchDoctorsLoading}
                  className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchDoctorsLoading ? "Searching..." : "🔍 Search Doctors"}
                </motion.button>
              </div>

              {/* Enterprise Clinics fetched by Enterprise ID */}
              {searchDoctorsParams.enterpriseId > 0 && (
                <div className="px-6">
                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <span>🏥</span> Enterprise Clinics
                      </h4>
                      <span className="text-sm text-blue-700">Enterprise ID: {searchDoctorsParams.enterpriseId}</span>
                    </div>

                    {loadingDoctorClinics ? (
                      <div className="flex items-center gap-3 text-blue-700">
                        <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <span>Loading clinics for this enterprise...</span>
                      </div>
                    ) : doctorClinics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {doctorClinics.map((clinic) => (
                          <div
                            key={clinic.clinicId}
                            className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-blue-900">
                                [{clinic.clinicId}] {clinic.clinicName || "Clinic"}
                              </div>
                              <span className="text-sm text-blue-700">{clinic.clinicCode || ""}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              {clinic.addressLine1 || clinic.address || "No address on file"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-blue-800">No clinics found for this enterprise.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Results Section */}
              <div className="p-6">
                {searchDoctorsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full"
                    />
                  </div>
                ) : searchDoctorsResults.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">
                      👨‍⚕️ Found {searchDoctorsResults.length} Doctor(s)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchDoctorsResults.map((doctor) => (
                        <motion.div
                          key={doctor.doctorId}
                          whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
                          onClick={() => handleViewDoctorDetails(doctor.doctorId)}
                          className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg cursor-pointer hover:border-purple-400 transition"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="text-lg font-bold text-slate-800">
                                {doctor.firstName} {doctor.lastName}
                              </h5>
                              <p className="text-sm text-slate-600">ID: {doctor.doctorId}</p>
                            </div>
                            <span className="text-2xl">👨‍⚕️</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="font-semibold text-slate-700">Specialty:</span>{" "}
                              <span className="text-slate-600">ID {doctor.specialtyId}</span>
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Status:</span>{" "}
                              <span className={doctor.employmentStatus === "Active" ? "text-green-600 font-bold" : "text-orange-600"}>
                                {doctor.employmentStatus || "Unknown"}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 pt-2">Click to view details</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600">
                    <p className="text-lg font-semibold mb-2">No doctors found</p>
                    <p className="text-sm">Try searching with different criteria</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doctor Details Modal */}
      <AnimatePresence>
        {showDoctorDetailsModal && selectedDoctorView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowDoctorDetailsModal(false);
              setIsEditingDoctorDetails(false);
            }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">
                    {selectedDoctorView.firstName} {selectedDoctorView.lastName}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowDoctorDetailsModal(false);
                      setIsEditingDoctorDetails(false);
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {doctorDetailsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">👤 Personal Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">First Name</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.firstName || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, firstName: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.firstName}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Last Name</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.lastName || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, lastName: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.lastName}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Gender</p>
                          {isEditingDoctorDetails ? (
                            <select
                              value={doctorEditFormData?.gender || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, gender: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.gender}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Date of Birth</p>
                          {isEditingDoctorDetails ? (
                            <FancyDatePicker
                              value={doctorEditFormData?.dateOfBirth?.split('T')[0] || ""}
                              onChange={(date) =>
                                setDoctorEditFormData(prev => ({ ...prev, dateOfBirth: date }))
                              }
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.dateOfBirth?.split('T')[0]}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Doctor ID</p>
                          <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.doctorId}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Staff ID</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.staffId || ""}
                              disabled
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 opacity-50 cursor-not-allowed"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.staffId}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">📞 Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Email</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="email"
                              value={doctorEditFormData?.email || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, email: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.email}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Phone</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="tel"
                              value={doctorEditFormData?.phone || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, phone: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.phone}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase">Address</p>
                          {isEditingDoctorDetails ? (
                            <textarea
                              value={doctorEditFormData?.address || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, address: e.target.value }))
                              }
                              rows="2"
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.address}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">🎓 Professional Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">License Number</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.licenseNumber || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, licenseNumber: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.licenseNumber}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">License Expiry</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="date"
                              value={doctorEditFormData?.licenseExpiry?.split('T')[0] || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, licenseExpiry: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">
                              {selectedDoctorView.licenseExpiry ? new Date(selectedDoctorView.licenseExpiry).toLocaleDateString() : "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Specialty ID</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="number"
                              value={doctorEditFormData?.specialtyId || 0}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, specialtyId: parseInt(e.target.value) || 0 }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.specialtyId}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Years Experience</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="number"
                              value={doctorEditFormData?.yearsExperience || 0}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.yearsExperience}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Education</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.education || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, education: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.education}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Certifications</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.certifications || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, certifications: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.certifications}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Employment Information */}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">💼 Employment Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Joining Date</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="date"
                              value={doctorEditFormData?.joiningDate?.split('T')[0] || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, joiningDate: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">
                              {selectedDoctorView.joiningDate ? new Date(selectedDoctorView.joiningDate).toLocaleDateString() : "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Employment Status</p>
                          {isEditingDoctorDetails ? (
                            <select
                              value={doctorEditFormData?.employmentStatus || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, employmentStatus: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            >
                              <option value="">Select</option>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Leave">Leave</option>
                            </select>
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.employmentStatus}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Branch ID</p>
                          {isEditingDoctorDetails ? (
                            <input
                              type="text"
                              value={doctorEditFormData?.branchId || ""}
                              onChange={(e) =>
                                setDoctorEditFormData(prev => ({ ...prev, branchId: e.target.value }))
                              }
                              className="mt-1 w-full px-2 py-1 border border-gray-300 rounded bg-white"
                            />
                          ) : (
                            <p className="text-slate-800 font-semibold mt-1">{selectedDoctorView.branchId}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Organization Information */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">🏢 Organization Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Enterprise ID</p>
                          <p className="text-slate-800 font-semibold mt-1 bg-gray-100 p-2 rounded opacity-50">
                            {selectedDoctorView.enterpriseId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Clinic ID</p>
                          <p className="text-slate-800 font-semibold mt-1 bg-gray-100 p-2 rounded opacity-50">
                            {selectedDoctorView.clinicId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end sticky bottom-0">
                {isEditingDoctorDetails ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelEditDoctor}
                      className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdateDoctor}
                      disabled={doctorDetailsLoading}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                    >
                      {doctorDetailsLoading ? "Saving..." : "💾 Save Changes"}
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDoctorDetailsModal(false)}
                      className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
                    >
                      Close
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditDoctor}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                    >
                      ✏️ Edit
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal - Doctor Update */}
      <AnimatePresence>
        {showDoctorUpdateSuccessModal && (
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
              <p className="text-slate-600 mb-6">{doctorUpdateSuccessMessage}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowDoctorUpdateSuccessModal(false);
                  setShowDoctorDetailsModal(false);
                }}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal - Doctor Update */}
      <AnimatePresence>
        {showDoctorUpdateErrorModal && (
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
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-6xl mb-4"
              >
                ❌
              </motion.div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">Error</h3>
              <p className="text-slate-600 mb-6">{doctorUpdateErrorMessage}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDoctorUpdateErrorModal(false)}
                className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Inventory Modal */}
      <AnimatePresence>
        {showAddInventoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddInventoryModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">📦 Add Inventory Items</h3>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setShowAddToMasterModal(true)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm transition"
                    >
                      ➕ Add to Master
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowAddInventoryModal(false)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                    >
                      <span className="text-2xl">×</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <form onSubmit={handleAddInventorySubmit} className="space-y-6">
                  {/* Enterprise & Clinic Selection */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">🏢 Select Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Enterprise <span className="text-red-500">*</span></label>
                        <select
                          value={inventoryFormData.enterpriseId}
                          onChange={(e) => {
                            const enterpriseId = parseInt(e.target.value) || 0;
                            setInventoryFormData(prev => ({
                              ...prev,
                              enterpriseId,
                              clinicId: 0
                            }));
                            setInventoryError("");
                            loadClinicsForInventory(enterpriseId);
                          }}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none"
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
                          value={inventoryFormData.clinicId}
                          onChange={(e) => setInventoryFormData(prev => ({ ...prev, clinicId: parseInt(e.target.value) || 0 }))}
                          disabled={inventoryFormData.enterpriseId === 0}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="0">-- Select Clinic --</option>
                          {inventoryClinics.map((clinic) => (
                            <option key={clinic.clinicId} value={clinic.clinicId}>
                              [{clinic.clinicId}] {clinic.clinicName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Items */}
                  {inventoryFormData.enterpriseId > 0 && inventoryFormData.clinicId > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">📋</span>
                        <h4 className="text-lg font-bold text-slate-800">Inventory Items</h4>
                        <span className="ml-auto text-sm font-semibold text-emerald-700 bg-emerald-200 px-3 py-1 rounded-full">{inventoryFormData.items.length} item{inventoryFormData.items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-4">
                        {inventoryFormData.items.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-2 border-emerald-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            {/* Row Header */}
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-emerald-100">
                              <span className="font-bold text-emerald-700 bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">#{index + 1}</span>
                              <span className="text-xs font-semibold text-gray-500">Item Details</span>
                              {inventoryFormData.items.length > 1 && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => handleRemoveInventoryRow(index)}
                                  className="ml-auto px-3 py-1 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition text-sm"
                                >
                                  ✕ Remove
                                </motion.button>
                              )}
                            </div>

                            {/* Main Fields Grid - 2 columns for better organization */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* Item Name Dropdown */}
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Item Name *</label>
                                <select
                                  value={item.itemId || ''}
                                  onChange={(e) => {
                                    const itemId = parseInt(e.target.value);
                                    const selectedMaster = masterInventoryItems.find(m => m.itemId === itemId);
                                    if (selectedMaster) {
                                      handleInventoryItemChange(index, "itemId", itemId);
                                      handleInventoryItemChange(index, "itemName", selectedMaster.itemName);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-white"
                                >
                                  <option value="">Select from Master</option>
                                  {masterInventoryItems.map(item => (
                                    <option key={item.itemId} value={item.itemId}>
                                      {item.itemName}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantity Available */}
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Quantity Available *</label>
                                <input
                                  type="number"
                                  value={item.quantityAvailable}
                                  onChange={(e) => handleInventoryItemChange(index, "quantityAvailable", parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                                />
                              </div>

                              {/* Reorder Level */}
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Reorder Level</label>
                                <input
                                  type="number"
                                  value={item.reorderLevel}
                                  onChange={(e) => handleInventoryItemChange(index, "reorderLevel", parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                                />
                              </div>

                              {/* Minimum Stock */}
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Minimum Stock</label>
                                <input
                                  type="number"
                                  value={item.minimumStock}
                                  onChange={(e) => handleInventoryItemChange(index, "minimumStock", parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                                />
                              </div>

                              {/* Storage Location */}
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Storage Location</label>
                                <input
                                  type="text"
                                  value={item.storageLocation}
                                  onChange={(e) => handleInventoryItemChange(index, "storageLocation", e.target.value)}
                                  placeholder="e.g., Shelf A-1"
                                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                                />
                              </div>

                              {/* Status */}
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Status</label>
                                <select
                                  value={item.status}
                                  onChange={(e) => handleInventoryItemChange(index, "status", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-white"
                                >
                                  <option value="Available">Available</option>
                                  <option value="LowStock">LowStock</option>
                                  <option value="OutOfStock">OutOfStock</option>
                                </select>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Add Another Item Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleAddInventoryRow}
                        className="mt-5 w-full px-4 py-3 border-2 border-dashed border-emerald-400 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition bg-emerald-50/50"
                      >
                        + Add Another Item
                      </motion.button>
                    </div>
                  )}

                  {/* Error Message */}
                  {inventoryError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold flex items-center gap-2"
                    >
                      <span>⚠️</span> {inventoryError}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={inventoryLoading || inventoryFormData.enterpriseId === 0 || inventoryFormData.clinicId === 0}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inventoryLoading ? "Adding..." : "✅ Add Inventory Items"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Inventory Modal with Innovative Display */}
      <AnimatePresence>
        {showEditInventoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditInventoryModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">✏️ Manage Inventory</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditInventoryModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Enterprise & Clinic Selection for Search */}
                {inventoryResults.length === 0 ? (
                  <div className="space-y-6">
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">🏢 Select Location to View Inventory</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Enterprise <span className="text-red-500">*</span></label>
                          <select
                            value={inventoryFormData.enterpriseId}
                            onChange={(e) => {
                              const enterpriseId = parseInt(e.target.value) || 0;
                              setInventoryFormData(prev => ({
                                ...prev,
                                enterpriseId,
                                clinicId: 0
                              }));
                              setInventoryError("");
                              loadClinicsForInventory(enterpriseId);
                            }}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
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
                            value={inventoryFormData.clinicId}
                            onChange={(e) => setInventoryFormData(prev => ({ ...prev, clinicId: parseInt(e.target.value) || 0 }))}
                            disabled={inventoryFormData.enterpriseId === 0}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="0">-- Select Clinic --</option>
                            {inventoryClinics.map((clinic) => (
                              <option key={clinic.clinicId} value={clinic.clinicId}>
                                [{clinic.clinicId}] {clinic.clinicName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {inventoryError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold flex items-center gap-2"
                      >
                        <span>⚠️</span> {inventoryError}
                      </motion.div>
                    )}

                    {/* Search Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSearchEditInventory}
                      disabled={inventoryLoading || inventoryFormData.enterpriseId === 0 || inventoryFormData.clinicId === 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inventoryLoading ? "Loading..." : "🔍 Load Inventory Items"}
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Back Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setInventoryResults([]);
                        setInventoryError("");
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                    >
                      ← Back to Search
                    </motion.button>

                    {/* Innovative Inventory Display - Compact & Beautiful */}
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-slate-800 mb-4">📦 Inventory Items ({inventoryResults.length})</h4>
                      
                      {/* Ultra-Compact Grid Layout - 4-5 columns on large screens */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {inventoryResults.map((item, index) => (
                          <motion.div
                            key={`inventory-${item.inventoryId || index}`}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ y: -8, scale: 1.05 }}
                            className={`group relative rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all ${
                              item.status === 'Available' 
                                ? 'bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100 border border-emerald-300' 
                                : item.status === 'LowStock'
                                ? 'bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 border border-yellow-300'
                                : 'bg-gradient-to-br from-red-100 via-pink-50 to-rose-100 border border-red-300'
                            }`}
                          >
                            {/* Animated background shimmer */}
                            <motion.div
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                            />

                            <div className="relative z-10 p-3">
                              {/* Status Badge */}
                              <div className="flex items-center justify-between mb-2">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="text-2xl"
                                >
                                  {item.status === 'Available' ? '✅' : item.status === 'LowStock' ? '⚠️' : '❌'}
                                </motion.div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  item.status === 'Available' 
                                    ? 'bg-emerald-200 text-emerald-800' 
                                    : item.status === 'LowStock'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              {/* Item Name */}
                              <h5 className="text-sm font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">{item.itemName}</h5>

                              {/* Quick Stats */}
                              <div className="space-y-1.5 bg-white/60 backdrop-blur-sm rounded-lg p-2.5 mb-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-600">Qty:</span>
                                  <span className={`text-sm font-bold ${
                                    item.status === 'Available' 
                                      ? 'text-emerald-700' 
                                      : item.status === 'LowStock'
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                                  }`}>
                                    {item.quantityAvailable}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-600">Min:</span>
                                  <span className="text-xs font-semibold text-slate-700">{item.minimumStock}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-600">Loc:</span>
                                  <span className="text-xs text-slate-700 text-right line-clamp-1">{item.storageLocation || '—'}</span>
                                </div>
                              </div>

                              {/* Edit Button */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setEditingItemIndex(editingItemIndex === index ? null : index)}
                                className="w-full px-2 py-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded font-bold text-xs hover:shadow-lg transition"
                              >
                                {editingItemIndex === index ? '✓ Done' : '✏️ Edit'}
                              </motion.button>
                            </div>

                            {/* Edit Mode - Overlay */}
                            <AnimatePresence>
                              {editingItemIndex === index && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center p-2"
                                >
                                  <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="bg-white rounded-lg shadow-2xl p-3 w-full max-h-[90vh] overflow-y-auto"
                                  >
                                    <h6 className="font-bold text-slate-800 mb-2 text-sm">Edit {item.itemName}</h6>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600">Qty Available</label>
                                        <input
                                          type="number"
                                          value={item.quantityAvailable}
                                          onChange={(e) => {
                                            const updated = [...inventoryResults];
                                            updated[index].quantityAvailable = parseInt(e.target.value) || 0;
                                            setInventoryResults(updated);
                                          }}
                                          className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                          min="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600">Reorder Level</label>
                                        <input
                                          type="number"
                                          value={item.reorderLevel}
                                          onChange={(e) => {
                                            const updated = [...inventoryResults];
                                            updated[index].reorderLevel = parseInt(e.target.value) || 0;
                                            setInventoryResults(updated);
                                          }}
                                          className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                          min="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600">Min Stock</label>
                                        <input
                                          type="number"
                                          value={item.minimumStock}
                                          onChange={(e) => {
                                            const updated = [...inventoryResults];
                                            updated[index].minimumStock = parseInt(e.target.value) || 0;
                                            setInventoryResults(updated);
                                          }}
                                          className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                          min="0"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600">Location</label>
                                        <input
                                          type="text"
                                          value={item.storageLocation}
                                          onChange={(e) => {
                                            const updated = [...inventoryResults];
                                            updated[index].storageLocation = e.target.value;
                                            setInventoryResults(updated);
                                          }}
                                          className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                          placeholder="Shelf A-1"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold text-slate-600">Status</label>
                                        <select
                                          value={item.status}
                                          onChange={(e) => {
                                            const updated = [...inventoryResults];
                                            updated[index].status = e.target.value;
                                            setInventoryResults(updated);
                                          }}
                                          className="mt-0.5 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                        >
                                          <option value="Available">Available</option>
                                          <option value="LowStock">LowStock</option>
                                          <option value="OutOfStock">OutOfStock</option>
                                        </select>
                                      </div>
                                    </div>
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Error Message */}
                    {inventoryError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg font-semibold flex items-center gap-2"
                      >
                        <span>⚠️</span> {inventoryError}
                      </motion.div>
                    )}

                    {/* Save All Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveInventoryChanges}
                      disabled={inventoryLoading || editingItemIndex !== null}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inventoryLoading ? "Saving..." : "💾 Save All Changes"}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Master Inventory Modal */}
      <AnimatePresence>
        {showAddToMasterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddToMasterModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">📦</span>
                    <div>
                      <h3 className="text-2xl font-bold">Add to Master Inventory</h3>
                      <p className="text-purple-100 text-sm mt-1">Add new items to your master catalog</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddToMasterModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddToMasterSubmit} className="p-6">
                <div className="space-y-4 mb-6">
                  {masterItemRows.map((row, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-5 hover:shadow-md transition"
                    >
                      {/* Row Header */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-200">
                        <span className="font-bold text-purple-700 bg-purple-200 w-8 h-8 rounded-full flex items-center justify-center text-sm">#{index + 1}</span>
                        <span className="text-xs font-semibold text-gray-600">Item {index + 1}</span>
                        {masterItemRows.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => handleRemoveMasterRow(index)}
                            className="ml-auto px-3 py-1 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition text-sm"
                          >
                            ✕ Remove
                          </motion.button>
                        )}
                      </div>

                      {/* 2x2 Grid for main fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Item Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Item Name *</label>
                          <input
                            type="text"
                            value={row.itemName}
                            onChange={(e) => handleMasterItemChange(index, "itemName", e.target.value)}
                            placeholder="e.g., Composite Resin"
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          />
                        </div>

                        {/* Item Code */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Item Code/SKU *</label>
                          <input
                            type="text"
                            value={row.itemCode}
                            onChange={(e) => handleMasterItemChange(index, "itemCode", e.target.value)}
                            placeholder="e.g., CR-001"
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Category *</label>
                          <select
                            value={row.category}
                            onChange={(e) => handleMasterItemChange(index, "category", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-white"
                          >
                            <option value="">Select Category</option>
                            <option value="Consumables">Consumables</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Instruments">Instruments</option>
                            <option value="Medicines">Medicines</option>
                            <option value="Supplies">Supplies</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Sub Category */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Sub Category</label>
                          <input
                            type="text"
                            value={row.subCategory}
                            onChange={(e) => handleMasterItemChange(index, "subCategory", e.target.value)}
                            placeholder="e.g., Dental Materials"
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          />
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Unit *</label>
                          <select
                            value={row.unit}
                            onChange={(e) => handleMasterItemChange(index, "unit", e.target.value)}
                            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-white"
                          >
                            <option value="">Select Unit</option>
                            <option value="pcs">pcs</option>
                            <option value="box">box</option>
                            <option value="dozen">dozen</option>
                            <option value="kg">kg</option>
                            <option value="liter">liter</option>
                            <option value="ml">ml</option>
                            <option value="tube">tube</option>
                            <option value="bottle">bottle</option>
                            <option value="pack">pack</option>
                          </select>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-end">
                          <label className="flex items-center gap-3 cursor-pointer w-full px-4 py-2 bg-purple-100 rounded-lg border-2 border-purple-200 hover:bg-purple-200 transition">
                            <input
                              type="checkbox"
                              checked={row.isActive}
                              onChange={(e) => handleMasterItemChange(index, "isActive", e.target.checked)}
                              className="w-5 h-5 accent-purple-600 rounded"
                            />
                            <span className="font-semibold text-slate-700">Mark as Active</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add Another Row Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleAddMasterRow}
                  className="w-full px-4 py-3 border-2 border-dashed border-purple-400 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition mb-6 bg-purple-50/50"
                >
                  ➕ Add Another Item
                </motion.button>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAddToMasterModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition"
                  >
                    ❌ Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={masterItemLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {masterItemLoading ? "⏳ Saving..." : "✅ Save to Master"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Success Modal */}
      <AnimatePresence>
        {showInventorySuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-emerald-200"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl mb-6 text-center"
              >
                🎉
              </motion.div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 text-center">Success!</h3>
              <p className="text-lg font-semibold text-slate-800 mb-4 text-center leading-relaxed">{inventorySuccessMessage}</p>
              <div className="flex items-center justify-center gap-1 mb-4">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
              </div>
              <p className="text-sm text-emerald-600 font-semibold text-center">Your inventory has been updated</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master Inventory Success Modal */}
      <AnimatePresence>
        {showMasterSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-purple-200"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl mb-6 text-center"
              >
                🎁
              </motion.div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 text-center">Master Updated!</h3>
              <p className="text-lg font-semibold text-slate-800 mb-4 text-center leading-relaxed">{masterSuccessMessage}</p>
              <div className="flex items-center justify-center gap-1 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="text-2xl"
                >
                  🌟
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="text-2xl"
                >
                  🌟
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="text-2xl"
                >
                  🌟
                </motion.div>
              </div>
              <p className="text-sm text-purple-600 font-semibold text-center">New items added to your master catalog</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}



