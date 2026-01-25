import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { createStaffDetail } from "../services/staffService";
import { createPatient } from "../services/patientService";
import { getSelectedAccess, setSelectedAccess, getAuthUserAccess } from "../services/authService";
import {
  AppointmentListModal,
  CreateAppointmentModal,
  EditAppointmentModal,
  DeleteAppointmentModal,
  CreatePatientModal,
  ManagePatientModal,
  InventoryListModal,
  CreateInventoryModal,
  EditInventoryModal,
  DeleteInventoryModal
} from "../components/AppointmentManagement";

const API_BASE_URL = (import.meta).env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

const SUPERADMIN_ENDPOINTS = {
  insert: `${API_BASE_URL}/SuperAdmin/Insert`,
  list: `${API_BASE_URL}/SuperAdmin/All`,
  update: (id) => `${API_BASE_URL}/SuperAdmin/EditSuperAdmin?id=${encodeURIComponent(id)}`,
  delete: (id) => `${API_BASE_URL}/SuperAdmin/DeleteSuperAdmin?id=${encodeURIComponent(id)}`
};

const ENTERPRISE_ENDPOINTS = {
  list: `${API_BASE_URL}/Enterprise/GetAllEnterprises`,
  getAll: `${API_BASE_URL}/Enterprise/GetAllEnterprises`,
  create: `${API_BASE_URL}/Enterprise/CreateEnterprise`,
  update: `${API_BASE_URL}/Enterprise/EditEnterpriseInfo`,
  delete: (id) => `${API_BASE_URL}/Enterprise/DeleteEnterprise?id=${id}`
};

const CLINIC_ENDPOINTS = {
  list: `${API_BASE_URL}/Clinic/All`,
  create: `${API_BASE_URL}/Clinic/CreateClinicInfo`,
  getByEnterpriseId: (id) => `${API_BASE_URL}/Clinic/GetClinicByID?id=${id}`,
  update: (id) => `${API_BASE_URL}/Clinic/${id}`,
  delete: (id) => `${API_BASE_URL}/Clinic/${id}`
};

const ROLE_ENDPOINTS = {
  getAll: `${API_BASE_URL}/RoleMaster/GetAllRolesForStaff`
};

const initialForm = {
  adminId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  phone: "",
  address: "",
  education: "",
  languages: "",
  yearsExperience: "",
  joiningDate: "",
  employmentStatus: "Active",
  availability: "",
  isActive: true
};

const toInputDate = (value) => {
  if (!value) return "";
  const isoMatch = typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

export default function SuperAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState(0);
  const [enterpriseSearchQuery, setEnterpriseSearchQuery] = useState("");
  // Enterprise view/edit/delete modal states
  const [showViewEnterpriseModal, setShowViewEnterpriseModal] = useState(false);
  const [viewingEnterprise, setViewingEnterprise] = useState(null);
  const [enterpriseEditMode, setEnterpriseEditMode] = useState(false);
  const [enterpriseEditData, setEnterpriseEditData] = useState(null);
  const [enterpriseEditLoading, setEnterpriseEditLoading] = useState(false);
  const [enterpriseEditError, setEnterpriseEditError] = useState("");
  const [enterpriseEditSuccess, setEnterpriseEditSuccess] = useState("");
  // Enterprise Create Modal state
  const [showCreateEnterpriseModal, setShowCreateEnterpriseModal] = useState(false);
  const [createEnterpriseActiveTab, setCreateEnterpriseActiveTab] = useState("details");
  const [enterpriseForm, setEnterpriseForm] = useState({
    name: "",
    registrationNumber: "",
    contactEmail: "",
    contactPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    website: "",
    establishedDate: null,
    notes: "",
  });
  const [enterpriseFormLoading, setEnterpriseFormLoading] = useState(false);
  const [showDeleteEnterpriseModal, setShowDeleteEnterpriseModal] = useState(false);
  const [deletingEnterprise, setDeletingEnterprise] = useState(null);
  // Create Clinic Modal states
  const [showCreateClinicModal, setShowCreateClinicModal] = useState(false);
  const [createClinicActiveTab, setCreateClinicActiveTab] = useState("basic");
  const [creatingClinic, setCreatingClinic] = useState(false);
  const [clinicFormError, setClinicFormError] = useState("");
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
  const [clinicHours, setClinicHours] = useState({
    monday: { isOpen: true, open: "09:00", close: "17:00" },
    tuesday: { isOpen: true, open: "09:00", close: "17:00" },
    wednesday: { isOpen: true, open: "09:00", close: "17:00" },
    thursday: { isOpen: true, open: "09:00", close: "17:00" },
    friday: { isOpen: true, open: "09:00", close: "17:00" },
    saturday: { isOpen: false, open: "09:00", close: "17:00" },
    sunday: { isOpen: false, open: "09:00", close: "17:00" }
  });
  // View Clinics states
  const [hoveredCard, setHoveredCard] = useState(null);
  const [viewClinicsLoading, setViewClinicsLoading] = useState(false);
  const [viewingClinic, setViewingClinic] = useState(null);
  const [showViewClinicModal, setShowViewClinicModal] = useState(false);
  const [clinicEditMode, setClinicEditMode] = useState(false);
  const [clinicEditData, setClinicEditData] = useState(null);
  const [clinicSaveLoading, setClinicSaveLoading] = useState(false);
  const [clinicSaveError, setClinicSaveError] = useState("");
  const [clinicSaveSuccess, setClinicSaveSuccess] = useState("");
  const [showDeleteClinicModal, setShowDeleteClinicModal] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deletingClinic, setDeletingClinic] = useState(false);
  // List Clinics modal states
  const [showListClinicsModal, setShowListClinicsModal] = useState(false);
  const [listClinicsEnterpriseId, setListClinicsEnterpriseId] = useState(0);
  const [listClinicsData, setListClinicsData] = useState([]);
  const [listClinicsLoading, setListClinicsLoading] = useState(false);
  const [listClinicsError, setListClinicsError] = useState("");
  // Inline edit within View modal
  const [viewEditMode, setViewEditMode] = useState(false);
  const [viewEditData, setViewEditData] = useState(null);
  const [viewSaveLoading, setViewSaveLoading] = useState(false);
  const [viewSaveError, setViewSaveError] = useState("");
  const [viewSaveSuccess, setViewSaveSuccess] = useState("");

  // Route guard: Only Super Admin (roleId = 1) can access this page
  useEffect(() => {
    try {
      const selectedAccess = getSelectedAccess();
      const isSuperAdmin = Array.isArray(selectedAccess?.roleIds) && selectedAccess.roleIds.includes(1);
      if (!isSuperAdmin) {
        // Redirect non-superadmins to home
        navigate('/', { replace: true });
      }
    } catch (err) {
      // Fallback: if access not available, redirect
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Onboard Staff (TeamHub parity)
  const [showOnboardStaffModal, setShowOnboardStaffModal] = useState(false);
  const [staffFormError, setStaffFormError] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [onboardStaffActiveStep, setOnboardStaffActiveStep] = useState("personal");
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const staffSteps = [
    { key: "personal", icon: "👤", label: "Personal Info" },
    { key: "contact", icon: "📞", label: "Contact" },
    { key: "professional", icon: "🎓", label: "Professional" },
    { key: "employment", icon: "💼", label: "Employment" },
    { key: "compliance", icon: "📋", label: "Compliance" },
    { key: "profile", icon: "✨", label: "Profile" }
  ];
  const [staffForm, setStaffForm] = useState({
    staffId: "",
    enterpriseId: "",
    clinicId: "",
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
    employmentStatus: "Active",
    availability: "",
    insuranceDetails: "",
    emergencyContact: "",
    bio: "",
    profilePhotoUrl: "",
    achievements: "",
    publications: "",
    socialLinks: "",
    rolesAssigned: "Reception"
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ name: "", isEdit: false, type: "superAdmin", isDeleted: false });

  // View Staff States
  const [showViewStaffModal, setShowViewStaffModal] = useState(false);
  const [viewStaffFilters, setViewStaffFilters] = useState({
    enterpriseId: "",
    clinicId: "",
    rolesAssigned: "",
    
  });
  const [staffList, setStaffList] = useState([]);
  const [staffListLoading, setStaffListLoading] = useState(false);
  const [staffListError, setStaffListError] = useState("");
  
  // Staff Detail Modal States
  const [showStaffDetailModal, setShowStaffDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetailLoading, setStaffDetailLoading] = useState(false);
  const [staffDetailError, setStaffDetailError] = useState("");
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState(null);

  // Appointment Management States
  const [showAppointmentListModal, setShowAppointmentListModal] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [showDeleteAppointmentModal, setShowDeleteAppointmentModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentSuccess, setAppointmentSuccess] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [appointmentFilterQuery, setAppointmentFilterQuery] = useState("");
  const [appointmentFilterEnterprise, setAppointmentFilterEnterprise] = useState("");
  const [appointmentFilterClinic, setAppointmentFilterClinic] = useState("");
  const [appointmentFilterFirstName, setAppointmentFilterFirstName] = useState("");
  const [appointmentFilterLastName, setAppointmentFilterLastName] = useState("");
  const [appointmentFilterDoctor, setAppointmentFilterDoctor] = useState("");
  const [appointmentFilterDate, setAppointmentFilterDate] = useState("");
  const [createAppointmentActiveTab, setCreateAppointmentActiveTab] = useState("basic");
  const [editAppointmentActiveTab, setEditAppointmentActiveTab] = useState("basic");
  const [createAppointmentForm, setCreateAppointmentForm] = useState({
    patientId: "",
    clinicId: "",
    doctorId: "",
    enterpriseId: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    appointmentDate: "",
    startTime: "",
    endTime: "",
    durationMinutes: "30",
    appointmentType: "Consultation",
    reasonForVisit: "",
    notes: "",
    roomNumber: "",
    telehealthLink: "",
    status: "Scheduled",
    isConfirmed: false,
    billableAmount: "",
    paymentStatus: "Pending",
    appointmentClinics: []
  });
  const [editAppointmentForm, setEditAppointmentForm] = useState(null);
  const [lastAppointmentFilters, setLastAppointmentFilters] = useState({
    clinicId: null,
    firstName: null,
    lastName: null,
    doctorId: null,
    appointmentDate: null
  });
  const [appointmentFormError, setAppointmentFormError] = useState("");
  const [appointmentFormLoading, setAppointmentFormLoading] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState(false);

  // Patient Management States
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [createPatientForm, setCreatePatientForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    enterpriseId: "",
    clinicId: "",
    role: "Patient",
    phoneNumber: "",
    alternatePhone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    pastSurgeries: "",
    familyMedicalHistory: "",
    smokingStatus: "",
    alcoholConsumption: "",
    exerciseFrequency: "",
    lastDentalVisit: "",
    dietaryRestrictions: "",
    additionalMedicalNotes: "",
    insuranceProvider: "",
    policyNumber: "",
    groupNumber: "",
    insurancePhone: "",
    policyHolderName: "",
    relationshipToHolder: "",
    coverageStartDate: "",
    coverageEndDate: "",
    copayAmount: "",
    deductibleAmount: "",
    coveragePercentage: "",
    isPrimaryInsurance: false,
    patientClinics: []
  });
  const [createPatientActiveTab, setCreatePatientActiveTab] = useState("patient-info");
  const [patientFormError, setPatientFormError] = useState("");
  const [patientFormLoading, setPatientFormLoading] = useState(false);
  const [patientSuccess, setPatientSuccess] = useState("");
  const [showManagePatientModal, setShowManagePatientModal] = useState(false);
  const [patientSearchId, setPatientSearchId] = useState("");
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientProfileLoading, setPatientProfileLoading] = useState(false);
  const [patientProfileError, setPatientProfileError] = useState("");
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState(null);
  const [editPatientActiveTab, setEditPatientActiveTab] = useState("patient-info");
  const [showDeletePatientModal, setShowDeletePatientModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(false);

  // Inventory Management States
  const [showInventoryListModal, setShowInventoryListModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
  const [showEditInventoryModal, setShowEditInventoryModal] = useState(false);
  const [showDeleteInventoryModal, setShowDeleteInventoryModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [inventorySuccess, setInventorySuccess] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);
  const [inventoryFilterQuery, setInventoryFilterQuery] = useState("");
  const [inventoryFilterCategory, setInventoryFilterCategory] = useState("");
  const [inventoryFilterStatus, setInventoryFilterStatus] = useState("");
  const [createInventoryForm, setCreateInventoryForm] = useState({
    itemName: "",
    itemCode: "",
    category: "",
    subCategory: "",
    unit: "Box",
    isActive: true
  });
  const [editInventoryForm, setEditInventoryForm] = useState(null);
  const [deletingInventory, setDeletingInventory] = useState(false);
  const [inventoryFormError, setInventoryFormError] = useState("");
  const [inventoryFormLoading, setInventoryFormLoading] = useState(false);

  // Ensure API headers reflect selected Enterprise/Clinic during patient creation
  useEffect(() => {
    if (!showCreatePatientModal) return;
    const entId = Number(createPatientForm.enterpriseId);
    const clinId = Number(createPatientForm.clinicId);
    if (entId > 0 && clinId > 0) {
      try {
        const allowed = getAuthUserAccess() || [];
        const isAllowed = allowed.some(a => Number(a.enterpriseId) === entId && Number(a.clinicId) === clinId);
        if (isAllowed) {
          setSelectedAccess(entId, clinId, getSelectedAccess()?.roleIds || []);
          console.log("🔐 Selected access set for patient registration:", { entId, clinId });
        } else {
          console.warn("🚫 Selected enterprise/clinic not in user access:", { entId, clinId });
          setPatientFormError("You do not have access to the selected enterprise/clinic");
        }
      } catch (e) {
        console.error("❌ Failed to set selected access:", e);
      }
    }
  }, [showCreatePatientModal, createPatientForm.enterpriseId, createPatientForm.clinicId]);

  // Filter enterprises/clinics to those the user has access to
  const userAccessList = getAuthUserAccess() || [];
  const allowedEnterpriseIds = new Set(userAccessList.map(a => Number(a.enterpriseId)));
  const allowedClinicIds = new Set(userAccessList.map(a => Number(a.clinicId)));
  const enterprisesForModal = (Array.isArray(enterprises) ? enterprises : []).filter(e => allowedEnterpriseIds.has(Number(e.enterpriseId)));
  const clinicsForModal = (Array.isArray(clinics) ? clinics : []).filter(c => allowedClinicIds.has(Number(c.clinicId)));

  // Clinic Inventory States
  const [showClinicInventoryListModal, setShowClinicInventoryListModal] = useState(false);
  const [showCreateClinicInventoryModal, setShowCreateClinicInventoryModal] = useState(false);
  const [clinicInventoryItems, setClinicInventoryItems] = useState([]);
  const [clinicInventoryLoading, setClinicInventoryLoading] = useState(false);
  const [clinicInventoryError, setClinicInventoryError] = useState("");
  const [createClinicInventoryForm, setCreateClinicInventoryForm] = useState({
    itemId: "",
    enterpriseId: "",
    clinicId: "",
    quantityAvailable: "",
    reorderLevel: "",
    minimumStock: "",
    storageLocation: "",
    status: "Available"
  });

  const APPOINTMENT_ENDPOINTS = {
    list: `${API_BASE_URL}/Appointments/GetAll`,
    create: `${API_BASE_URL}/Appointments/CreateAppointment`,
    update: `${API_BASE_URL}/Appointments/UpdateAppointment`,
    delete: (id) => `${API_BASE_URL}/Appointments/DeleteAppointment?id=${id}`,
    getByClinic: (clinicId) => `${API_BASE_URL}/Appointments/GetByClinic/${clinicId}`,
    getByDoctor: (doctorId) => `${API_BASE_URL}/Appointments/GetByDoctor/${doctorId}`,
    getByPatient: (patientId) => `${API_BASE_URL}/Appointments/GetByPatient/${patientId}`
  };

  const PATIENT_ENDPOINTS = {
    getFullProfile: (patientId) => `${API_BASE_URL}/Patient/details/fullProfile?patientId=${patientId}`,
    update: (patientId) => `${API_BASE_URL}/Patient/Update/${patientId}`,
    delete: (patientId) => `${API_BASE_URL}/Patient/Delete/${patientId}`
  };

  const INVENTORY_ENDPOINTS = {
    master: {
      list: `${API_BASE_URL}/Inventory/GetAllInventoryMasterItems`,
      create: `${API_BASE_URL}/Inventory/AddInventoryMasterItem`,
      createBulk: `${API_BASE_URL}/Inventory/AddInventoryMasterItemsBulk`,
      update: (id) => `${API_BASE_URL}/Inventory/UpdateInventoryMasterItem`,
      delete: (id) => `${API_BASE_URL}/InventoryMaster/Delete/${id}`
    },
    clinic: {
      list: `${API_BASE_URL}/ClinicInventory/GetAll`,
      create: `${API_BASE_URL}/ClinicInventory/Create`,
      update: (id) => `${API_BASE_URL}/ClinicInventory/Update/${id}`,
      delete: (id) => `${API_BASE_URL}/ClinicInventory/Delete/${id}`,
      getByClinic: (clinicId) => `${API_BASE_URL}/ClinicInventory/GetByClinic/${clinicId}`
    }
  };

  const filteredList = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return superAdmins;
    return superAdmins.filter((item) => {
      const fields = [
        item.firstName,
        item.lastName,
        item.email,
        item.phone,
        item.education,
        item.languages
      ].map((f) => (f || "").toString().toLowerCase());
      return fields.some((f) => f.includes(query));
    });
  }, [filterQuery, superAdmins]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigitsOnly = (form.phone || "").replace(/\D/g, "");
  const isEmailInvalid = Boolean(form.email) && !emailRegex.test(form.email.trim());
  const isPhoneInvalid = Boolean(form.phone) && phoneDigitsOnly.length !== 10;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "phone") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({
        ...prev,
        phone: sanitized
      }));
    } else if (name === "yearsExperience") {
      const sanitized = value.replace(/\D/g, "").slice(0, 2);
      setForm((prev) => ({
        ...prev,
        yearsExperience: sanitized
      }));
    } else if (name === "dateOfBirth" || name === "joiningDate") {
      const numericOnly = value.replace(/[^0-9-]/g, "").slice(0, 10);
      const [y = "", m = "", d = ""] = numericOnly.split("-");
      const normalized = [y.slice(0, 4), m.slice(0, 2), d.slice(0, 2)].filter(Boolean).join("-");
      setForm((prev) => ({
        ...prev,
        [name]: normalized
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
    setError("");
    setSuccess("");
  };

  const fetchSuperAdmins = async () => {
    try {
      setListLoading(true);
      setError("");
      const response = await fetch(SUPERADMIN_ENDPOINTS.list, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!response.ok) {
        throw new Error(`Unable to load super admins (${response.status})`);
      }
      const data = await response.json();
      const payload = Array.isArray(data) ? data : data.data || [];
      const normalized = payload.map((item) => ({
        adminId: item.adminId || item.adminID || item.id || "",
        firstName: item.firstName || item.first_name || "",
        lastName: item.lastName || item.last_name || "",
        dateOfBirth: item.dateOfBirth || item.dob || item.DateOfBirth || "",
        gender: item.gender || item.Gender || "",
        email: item.email || item.Email || "",
        phone: item.phone || item.Phone || "",
        address: item.address || item.Address || "",
        education: item.education || item.Education || "",
        languages: item.languages || item.Languages || "",
        yearsExperience: item.yearsExperience ?? item.YearsExperience ?? "",
        joiningDate: item.joiningDate || item.JoiningDate || "",
        employmentStatus: item.employmentStatus || item.EmploymentStatus || "",
        availability: item.availability || item.Availability || "",
        createdAt: item.createdAt || item.CreatedAt || "",
        updatedAt: item.updatedAt || item.UpdatedAt || "",
        isActive: item.isActive ?? item.IsActive ?? true
      }));
      setSuperAdmins(normalized);
    } catch (err) {
      setError(err.message || "Failed to fetch super admins");
    } finally {
      setListLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      console.log("📡 Fetching roles from:", ROLE_ENDPOINTS.getAll);
      const token = localStorage.getItem("accessToken");
      console.log("🔑 Token available:", !!token);
      
      const response = await fetch(ROLE_ENDPOINTS.getAll, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      console.log("📊 Roles API Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`❌ Unable to load roles (${response.status}):`, errorText);
        setRoles([]);
        return;
      }

      const data = await response.json();
      console.log("📦 Raw roles data:", JSON.stringify(data));
      
      // Handle multiple possible response formats
      let fetchedRoles = [];
      if (Array.isArray(data)) {
        fetchedRoles = data;
      } else if (data.data && Array.isArray(data.data)) {
        fetchedRoles = data.data;
      } else if (data.roles && Array.isArray(data.roles)) {
        fetchedRoles = data.roles;
      } else if (data.result && Array.isArray(data.result)) {
        fetchedRoles = data.result;
      } else {
        console.warn("⚠️ Unexpected response format:", data);
        fetchedRoles = [];
      }
      
      console.log("🔍 Fetched roles array:", fetchedRoles);
      
      // Extract role names if they're objects with a name/roleName property
      const roleNames = fetchedRoles.map((r) => {
        if (typeof r === "string") return r;
        if (typeof r === "object" && r !== null) {
          return r.name || r.roleName || r.Name || r.RoleName || r.role || r.Role || r.roleTitle || r.RoleTitle || "";
        }
        return "";
      });
      
      // Filter out SuperAdmin role and remove empty values
      const filtered = roleNames.filter((r) => r && r.toLowerCase() !== "superadmin" && r.toLowerCase() !== "super admin");
      console.log("✅ Roles loaded:", filtered);
      setRoles(filtered);
    } catch (err) {
      console.error("❌ Error fetching roles:", err);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.firstName || !form.lastName || !form.email) {
      setError("First name, last name, and email are required");
      return;
    }

    const trimmedEmail = form.email.trim();
    const sanitizedPhone = (form.phone || "").replace(/\D/g, "");
    const sanitizedYears = (form.yearsExperience || "").toString().replace(/\D/g, "");

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (form.phone && sanitizedPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    if (sanitizedYears && (sanitizedYears.length > 2 || Number(sanitizedYears) > 99)) {
      setError("Years of experience must be between 0 and 99");
      return;
    }

    const isEditing = Boolean(editingId);
    
    // Build payload - exclude AdminId from body when editing (sent as query param)
    const payload = {
      FirstName: form.firstName,
      LastName: form.lastName,
      DateOfBirth: toIsoOrNull(form.dateOfBirth),
      Gender: form.gender,
      Email: trimmedEmail,
      Phone: sanitizedPhone,
      Address: form.address,
      Education: form.education,
      Languages: form.languages,
      YearsExperience: sanitizedYears ? Number(sanitizedYears) : 0,
      JoiningDate: toIsoOrNull(form.joiningDate),
      EmploymentStatus: form.employmentStatus,
      Availability: form.availability,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      isActive: form.employmentStatus === "Active"
    };
    console.log("📤 Onboarding Super Admin - Payload:", payload);

    const endpoint = isEditing ? SUPERADMIN_ENDPOINTS.update(editingId) : SUPERADMIN_ENDPOINTS.insert;
    const method = isEditing ? "PUT" : "POST";

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.status !== 204) {
        const message = await response.text();
        throw new Error(message || "Unable to save super admin");
      }

      // Show success modal
      setSuccessData({
        name: `${form.firstName} ${form.lastName}`,
        isEdit: isEditing
      });
      setShowSuccessModal(true);
      setForm(initialForm);
      setEditingId("");
      // Switch to view and refresh list so user sees latest data
      setActiveCard("view");
      fetchSuperAdmins();
    } catch (err) {
      setError(err.message || "Something went wrong while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setActiveCard("onboard");
    setEditingId(admin.adminId);
    setForm({
      adminId: admin.adminId || "",
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      phone: admin.phone || "",
      dateOfBirth: toInputDate(admin.dateOfBirth),
      gender: admin.gender || "",
      address: admin.address || "",
      education: admin.education || "",
      languages: admin.languages || "",
      yearsExperience: admin.yearsExperience ?? "",
      joiningDate: toInputDate(admin.joiningDate),
      employmentStatus: admin.employmentStatus || "Active",
      availability: admin.availability || "",
      isActive: admin.isActive !== undefined ? !!admin.isActive : true
    });
  };

  const handleView = (admin) => {
    setViewingAdmin(admin);
    setShowViewModal(true);
    setViewEditMode(false);
    setViewSaveError("");
    setViewSaveSuccess("");
    setViewEditData({
      adminId: admin.adminId || "",
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      phone: admin.phone || "",
      dateOfBirth: admin.dateOfBirth ? toInputDate(admin.dateOfBirth) : "",
      gender: admin.gender || "",
      address: admin.address || "",
      education: admin.education || "",
      languages: admin.languages || "",
      yearsExperience: admin.yearsExperience ?? "",
      joiningDate: admin.joiningDate ? toInputDate(admin.joiningDate) : "",
      employmentStatus: admin.employmentStatus || (admin.isActive ? "Active" : "Inactive"),
      availability: admin.availability || "",
      isActive: admin.isActive !== undefined ? !!admin.isActive : true
    });
  };

  const handleDelete = (admin) => {
    setDeletingAdmin(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAdmin) return;

    try {
      setListLoading(true);
      setError("");
      console.log("🗑️ Deleting super admin:", deletingAdmin.adminId);
      console.log("📡 DELETE URL:", SUPERADMIN_ENDPOINTS.delete(deletingAdmin.adminId));
      
      const response = await fetch(SUPERADMIN_ENDPOINTS.delete(deletingAdmin.adminId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);
      
      if (!response.ok && response.status !== 204) {
        const contentType = response.headers.get("content-type");
        console.log("📡 Content-Type:", contentType);
        
        let message = "";
        try {
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            message = data.message || data.error || JSON.stringify(data);
          } else {
            message = await response.text();
          }
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          message = `HTTP ${response.status} ${response.statusText}`;
        }
        
        console.error("❌ Delete failed:", message);
        throw new Error(message || `Unable to delete super admin (HTTP ${response.status})`);
      }
      
      console.log("✅ Delete successful");
      setSuccess("Super admin deleted successfully");
      setShowDeleteModal(false);
      // If viewing modal is open, close it so success banner is visible
      setShowViewModal(false);
      setViewingAdmin(null);
      setDeletingAdmin(null);
      fetchSuperAdmins();
    } catch (err) {
      console.error("❌ Delete error:", err);
      setError(err.message || "Failed to delete super admin");
      setShowDeleteModal(false);
    } finally {
      setListLoading(false);
    }
  };

  const saveViewEdits = async () => {
    if (!viewEditData || !viewEditData.adminId) return;
    setViewSaveError("");
    setViewSaveSuccess("");
    try {
      setViewSaveLoading(true);
      const payload = {
        FirstName: viewEditData.firstName,
        LastName: viewEditData.lastName,
        DateOfBirth: toIsoOrNull(viewEditData.dateOfBirth),
        Gender: viewEditData.gender,
        Email: viewEditData.email,
        Phone: viewEditData.phone,
        Address: viewEditData.address,
        Education: viewEditData.education,
        Languages: viewEditData.languages,
        YearsExperience: viewEditData.yearsExperience ? Number(viewEditData.yearsExperience) : 0,
        JoiningDate: toIsoOrNull(viewEditData.joiningDate),
        EmploymentStatus: viewEditData.employmentStatus,
        Availability: viewEditData.availability,
        UpdatedAt: new Date().toISOString(),
        isActive: viewEditData.employmentStatus === "Active"
      };
      console.log("📤 Saving Super Admin - Payload:", payload);
      const endpoint = SUPERADMIN_ENDPOINTS.update(viewEditData.adminId);
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok && response.status !== 204) {
        const message = await response.text();
        throw new Error(message || "Unable to update super admin");
      }
      setViewSaveSuccess("Changes saved successfully");
      // Refresh list and the viewingAdmin object
      await fetchSuperAdmins();
      setViewingAdmin({
        ...viewingAdmin,
        ...viewEditData,
        dateOfBirth: viewEditData.dateOfBirth,
        joiningDate: viewEditData.joiningDate,
        isActive: !!viewEditData.isActive
      });
      setViewEditMode(false);
    } catch (err) {
      setViewSaveError(err.message || "Failed to save changes");
    } finally {
      setViewSaveLoading(false);
    }
  };

  const fetchEnterprises = async () => {
    try {
      setEnterpriseLoading(true);
      setError("");
      const endpoint = ENTERPRISE_ENDPOINTS.getAll;
      console.log("🏢 Fetching enterprises from:", endpoint);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Include token when available; API will ignore if not required
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Unable to load enterprises (${response.status}): ${errorText}`);
      }
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      let data;
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          // Surface the first chunk of the body to help diagnose HTML/error pages that masquerade as JSON
          const snippet = text.slice(0, 200);
          throw new Error(`Invalid JSON from enterprises (status ${response.status}): ${snippet}`);
        }
      } else {
        const snippet = text.slice(0, 200);
        throw new Error(`Unexpected content-type ${contentType}; body starts: ${snippet}`);
      }

      console.log("📊 Raw data from API:", data);
      
      const payload = Array.isArray(data) ? data : data.data || [];
      console.log("📦 Payload array:", payload);
      
      const normalized = payload.map((item) => ({
        enterpriseId: item.enterpriseId || item.enterpriseID || item.id || "",
        enterpriseName: item.enterpriseName || item.EnterpriseName || item.name || "",
        registrationNumber: item.registrationNumber || item.RegistrationNumber || "",
        contactEmail: item.contactEmail || item.ContactEmail || item.email || "",
        contactPhone: item.contactPhone || item.ContactPhone || item.phone || "",
        addressLine1: item.addressLine1 || item.AddressLine1 || "",
        addressLine2: item.addressLine2 || item.AddressLine2 || "",
        city: item.city || item.City || "",
        state: item.state || item.State || "",
        country: item.country || item.Country || "",
        postalCode: item.postalCode || item.PostalCode || "",
        isActive: item.isActive ?? item.IsActive ?? true,
        createdAt: item.createdAt || item.CreatedAt || "",
        updatedAt: item.updatedAt || item.UpdatedAt || ""
      }));
      console.log("✅ Normalized enterprises:", normalized);
      setEnterprises(normalized);
      console.log("✅ Enterprises set successfully, count:", normalized.length);
    } catch (err) {
      console.error("❌ Error fetching enterprises:", err);
      setError(err.message || "Failed to fetch enterprises");
    } finally {
      setEnterpriseLoading(false);
    }
  };

  const handleViewEnterprise = (enterprise) => {
    setViewingEnterprise(enterprise);
    setShowViewEnterpriseModal(true);
    setEnterpriseEditMode(false);
    setEnterpriseEditError("");
    setEnterpriseEditSuccess("");
    setEnterpriseEditData({
      enterpriseId: enterprise.enterpriseId || "",
      enterpriseName: enterprise.enterpriseName || "",
      registrationNumber: enterprise.registrationNumber || "",
      contactEmail: enterprise.contactEmail || "",
      contactPhone: enterprise.contactPhone || "",
      addressLine1: enterprise.addressLine1 || "",
      addressLine2: enterprise.addressLine2 || "",
      city: enterprise.city || "",
      state: enterprise.state || "",
      country: enterprise.country || "",
      postalCode: enterprise.postalCode || "",
      isActive: enterprise.isActive !== undefined ? !!enterprise.isActive : true
    });
  };

  const saveEnterpriseEdits = async () => {
    if (!enterpriseEditData || !enterpriseEditData.enterpriseId) return;
    setEnterpriseEditError("");
    setEnterpriseEditSuccess("");
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (enterpriseEditData.contactEmail && !emailRegex.test(enterpriseEditData.contactEmail.trim())) {
      setEnterpriseEditError("Please enter a valid email address");
      return;
    }
    
    // Validate phone number if provided
    if (enterpriseEditData.contactPhone && enterpriseEditData.contactPhone.replace(/\D/g, "").length !== 10) {
      setEnterpriseEditError("Phone number must be exactly 10 digits");
      return;
    }
    
    // Validate postal code if provided
    if (enterpriseEditData.postalCode && enterpriseEditData.postalCode.replace(/\D/g, "").length !== 6) {
      setEnterpriseEditError("Postal code must be exactly 6 digits");
      return;
    }
    
    try {
      setEnterpriseEditLoading(true);
      const now = new Date().toISOString();
      const payload = {
        EnterpriseId: enterpriseEditData.enterpriseId,
        EnterpriseName: enterpriseEditData.enterpriseName,
        RegistrationNumber: enterpriseEditData.registrationNumber,
        ContactEmail: enterpriseEditData.contactEmail,
        ContactPhone: enterpriseEditData.contactPhone,
        AddressLine1: enterpriseEditData.addressLine1,
        AddressLine2: enterpriseEditData.addressLine2,
        City: enterpriseEditData.city,
        State: enterpriseEditData.state,
        Country: enterpriseEditData.country,
        PostalCode: enterpriseEditData.postalCode,
        IsActive: !!enterpriseEditData.isActive,
        UpdatedAt: now
      };
      const endpoint = ENTERPRISE_ENDPOINTS.update;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok && response.status !== 200 && response.status !== 201 && response.status !== 204) {
        const message = await response.text();
        throw new Error(message || "Unable to update enterprise");
      }
      setEnterpriseEditSuccess("Changes saved successfully");
      await fetchEnterprises();
      setViewingEnterprise({
        ...viewingEnterprise,
        ...enterpriseEditData
      });
      setEnterpriseEditMode(false);
    } catch (err) {
      setEnterpriseEditError(err.message || "Failed to save changes");
    } finally {
      setEnterpriseEditLoading(false);
    }
  };

  const handleDeleteEnterprise = (enterprise) => {
    setDeletingEnterprise(enterprise);
    setShowDeleteEnterpriseModal(true);
  };

  const confirmDeleteEnterprise = async () => {
    if (!deletingEnterprise) return;
    try {
      setEnterpriseLoading(true);
      const deleteUrl = ENTERPRISE_ENDPOINTS.delete(deletingEnterprise.enterpriseId);
      console.log("🗑️ Deleting enterprise:", deletingEnterprise.enterpriseId);
      console.log("📡 DELETE URL:", deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok && response.status !== 200 && response.status !== 201 && response.status !== 204) {
        const message = await response.text();
        console.error("❌ Delete failed:", message);
        throw new Error(message || "Unable to delete enterprise");
      }
      
      console.log("✅ Enterprise deleted successfully");
      setSuccess("Enterprise deleted successfully");
      setShowDeleteEnterpriseModal(false);
      setDeletingEnterprise(null);
      setShowViewEnterpriseModal(false);
      console.log("🔄 Refreshing enterprise list...");
      await fetchEnterprises();
      console.log("✅ Enterprise list refreshed");
    } catch (err) {
      console.error("❌ Delete error:", err);
      setError(err.message || "Failed to delete enterprise");
      setShowDeleteEnterpriseModal(false);
    } finally {
      setEnterpriseLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      setClinicLoading(true);
      setError("");
      const response = await fetch(CLINIC_ENDPOINTS.list, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!response.ok) {
        throw new Error(`Unable to load clinics (${response.status})`);
      }
      const data = await response.json();
      const payload = Array.isArray(data) ? data : data.data || [];
      const normalized = payload.map((item) => ({
        clinicId: item.clinicId || item.clinicID || item.id || "",
        enterpriseId: item.enterpriseId || item.enterpriseID || "",
        clinicName: item.clinicName || item.name || "",
        clinicCity: item.clinicCity || item.city || "",
        clinicPhone: item.clinicPhone || item.phone || "",
        clinicEmail: item.clinicEmail || item.email || "",
        operatingHours: item.operatingHours || ""
      }));
      setClinics(normalized);
    } catch (err) {
      setError(err.message || "Failed to fetch clinics");
    } finally {
      setClinicLoading(false);
    }
  };

  // Load clinics for a specific enterprise
  const loadClinicsForEnterprise = async (enterpriseId) => {
    if (!enterpriseId || enterpriseId === 0) {
      setClinics([]);
      setError("Please select an enterprise");
      return;
    }
    
    try {
      setViewClinicsLoading(true);
      setError("");
      console.log("🏥 Loading clinics for enterprise ID:", enterpriseId);
      
      const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${enterpriseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Unable to load clinics (${response.status})`);
      }
      
      const data = await response.json();
      console.log("📊 Raw clinic data received:", data);
      
      const payload = Array.isArray(data) ? data : data.data || [];
      console.log("📊 Parsed clinics array:", payload);
      
      const normalized = payload.map((item) => ({
        clinicId: item.clinicId || item.ClinicId || item.clinic_id || "",
        enterpriseId: item.enterpriseId || item.EnterpriseId || item.enterprise_id || "",
        clinicName: item.clinicName || item.ClinicName || item.clinic_name || "",
        clinicCode: item.clinicCode || item.ClinicCode || item.clinic_code || "",
        contactEmail: item.contactEmail || item.ContactEmail || item.clinicEmail || item.ClinicEmail || "",
        contactPhone: item.contactPhone || item.ContactPhone || item.clinicPhone || item.ClinicPhone || "",
        addressLine1: item.addressLine1 || item.AddressLine1 || item.clinicAddress || item.ClinicAddress || "",
        addressLine2: item.addressLine2 || item.AddressLine2 || "",
        city: item.city || item.City || item.clinicCity || item.ClinicCity || "",
        state: item.state || item.State || "",
        country: item.country || item.Country || "",
        postalCode: item.postalCode || item.PostalCode || "",
        openingHours: item.openingHours || item.OpeningHours || item.operatingHours || item.OperatingHours || "",
        isActive: item.isActive ?? item.IsActive ?? true
      }));
      
      console.log("✅ Clinics normalized:", normalized.length, normalized);
      setClinics(normalized);
    } catch (err) {
      console.error("❌ Error loading clinics:", err);
      setError(err.message || "Failed to fetch clinics for this enterprise");
      setClinics([]);
    } finally {
      setViewClinicsLoading(false);
    }
  };

  // Fetch all doctors
  const fetchDoctors = async () => {
    try {
      console.log("👨‍⚕️ Fetching doctors...");
      const response = await fetch("${API_BASE_URL}/Doctors/GetAll", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });

      if (!response.ok) {
        console.warn("⚠️ Failed to fetch doctors:", response.status);
        return;
      }

      const data = await response.json();
      const doctorsList = Array.isArray(data) ? data : data.data || [];
      const normalized = doctorsList.map((item) => ({
        doctorId: item.doctorId || item.doctorID || item.id || "",
        firstName: item.firstName || item.FirstName || "",
        lastName: item.lastName || item.LastName || "",
        name: `${item.firstName || item.FirstName || ""} ${item.lastName || item.LastName || ""}`.trim(),
        email: item.email || item.Email || "",
        phone: item.phone || item.Phone || "",
        specialization: item.specialization || item.Specialization || ""
      }));
      setDoctors(normalized);
      console.log("✅ Doctors loaded:", normalized.length);
    } catch (err) {
      console.error("❌ Error fetching doctors:", err);
      // Don't show error to user, just log it
    }
  };

  // Fetch doctors by clinic ID
  const fetchDoctorsByClinic = async (clinicId) => {
    if (!clinicId) {
      setDoctors([]);
      return;
    }

    try {
      console.log("👨‍⚕️ Fetching doctors for clinic ID:", clinicId);
      const response = await fetch(`${API_BASE_URL}/StaffDetail/GetDoctorsForClinicID?clinicId=${clinicId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        console.warn("⚠️ Failed to fetch doctors for clinic:", response.status);
        return;
      }

      const data = await response.json();
      console.log("📊 Raw doctors data received:", data);
      const doctorsList = Array.isArray(data) ? data : data.data || [];
      const normalized = doctorsList.map((item) => ({
        doctorId: item.doctorId || item.doctorID || item.id || "",
        firstName: item.firstName || item.FirstName || "",
        lastName: item.lastName || item.LastName || "",
        name: `${item.firstName || item.FirstName || ""} ${item.lastName || item.LastName || ""}`.trim(),
        email: item.email || item.Email || "",
        phone: item.phone || item.Phone || "",
        specialization: item.specialization || item.Specialization || ""
      }));
      setDoctors(normalized);
      console.log("✅ Doctors for clinic loaded:", normalized.length);
    } catch (err) {
      console.error("❌ Error fetching doctors for clinic:", err);
      // Don't show error to user, just log it
    }
  };

  // Validate clinic form section for tab navigation
  const validateClinicFormSection = (currentTab) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Validate basic info tab before leaving
    if (currentTab === "basic") {
      if (!createClinicForm.enterpriseId || createClinicForm.enterpriseId === 0) {
        setClinicFormError("Enterprise selection is required");
        return false;
      }
      if (!createClinicForm.clinicName) {
        setClinicFormError("Clinic name is required");
        return false;
      }
      if (!createClinicForm.clinicCode) {
        setClinicFormError("Clinic code is required");
        return false;
      }
    }
    
    // Validate contact tab before leaving
    if (currentTab === "contact") {
      if (!createClinicForm.contactEmail) {
        setClinicFormError("Email is required");
        return false;
      }
      if (!emailRegex.test(createClinicForm.contactEmail.trim())) {
        setClinicFormError("Please enter a valid email address");
        return false;
      }
      if (!createClinicForm.contactPhone) {
        setClinicFormError("Phone number is required");
        return false;
      }
      if (createClinicForm.contactPhone.replace(/\D/g, "").length !== 10) {
        setClinicFormError("Phone number must be exactly 10 digits");
        return false;
      }
      if (createClinicForm.postalCode && createClinicForm.postalCode.replace(/\D/g, "").length !== 6) {
        setClinicFormError("Postal code must be exactly 6 digits");
        return false;
      }
    }
    
    // Validate address tab before leaving
    if (currentTab === "address") {
      if (!createClinicForm.addressLine1) {
        setClinicFormError("Address line 1 is required");
        return false;
      }
      if (!createClinicForm.city) {
        setClinicFormError("City is required");
        return false;
      }
    }
    
    setClinicFormError("");
    return true;
  };

  // Edit clinic function
  const saveClinicEdits = async () => {
    if (!clinicEditData) return;
    
    try {
      setClinicSaveLoading(true);
      setClinicSaveError("");
      setClinicSaveSuccess("");
      
      // Validate required fields and format
      if (!clinicEditData.contactEmail || !clinicEditData.contactPhone) {
        setClinicSaveError("Email and phone are required");
        setClinicSaveLoading(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clinicEditData.contactEmail.trim())) {
        setClinicSaveError("Please enter a valid email address");
        setClinicSaveLoading(false);
        return;
      }
      
      // Validate phone number
      if (clinicEditData.contactPhone.replace(/\D/g, "").length !== 10) {
        setClinicSaveError("Phone number must be exactly 10 digits");
        setClinicSaveLoading(false);
        return;
      }
      
      // Validate postal code if provided
      if (clinicEditData.postalCode && clinicEditData.postalCode.replace(/\D/g, "").length !== 6) {
        setClinicSaveError("Postal code must be exactly 6 digits");
        setClinicSaveLoading(false);
        return;
      }
      
      const now = new Date().toISOString();
      const clinicModel = {
        ClinicId: clinicEditData.clinicId,
        EnterpriseId: clinicEditData.enterpriseId,
        ClinicName: clinicEditData.clinicName,
        ClinicCode: clinicEditData.clinicCode,
        ContactEmail: clinicEditData.contactEmail,
        ContactPhone: clinicEditData.contactPhone,
        AddressLine1: clinicEditData.addressLine1,
        AddressLine2: clinicEditData.addressLine2,
        City: clinicEditData.city,
        State: clinicEditData.state,
        Country: clinicEditData.country || "",
        PostalCode: clinicEditData.postalCode,
        OpeningHours: clinicEditData.openingHours,
        IsActive: !!clinicEditData.isActive,
        CreatedAt: viewingClinic.createdAt || clinicEditData.createdAt || now,
        UpdatedAt: now
      };
      
      console.log("🏥 Updating clinic with ID:", clinicEditData.clinicId);
      console.log("📡 API URL:", CLINIC_ENDPOINTS.update(clinicEditData.clinicId));
      console.log("📦 Clinic Model:", clinicModel);
      
      const response = await fetch(CLINIC_ENDPOINTS.update(clinicEditData.clinicId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(clinicModel)
      });
      
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update clinic");
      }
      
      console.log("✅ Clinic updated successfully");
      setClinicSaveSuccess("✅ Clinic updated successfully!");
      setClinicEditMode(false);
      
      // Show success modal
      setSuccessData({
        name: clinicEditData.clinicName,
        isEdit: true,
        type: "clinic"
      });
      setShowSuccessModal(true);
      
      // Show success notification
      setSuccess("✅ Clinic updated successfully!");
      
      // Refresh clinics list
      if (selectedEnterpriseId > 0) {
        await loadClinicsForEnterprise(selectedEnterpriseId);
      }
      
      // Close modal after delay
      setTimeout(() => {
        setShowViewClinicModal(false);
        setClinicSaveSuccess("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("❌ Error updating clinic:", err);
      setClinicSaveError(err.message || "Failed to update clinic");
    } finally {
      setClinicSaveLoading(false);
    }
  };

  // Delete clinic function
  const handleDeleteClinic = (clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteClinicModal(true);
  };

  const confirmDeleteClinic = async () => {
    if (!clinicToDelete) return;
    
    try {
      setDeletingClinic(true);
      console.log("🗑️ Deleting clinic:", clinicToDelete.clinicId);
      
      const response = await fetch(CLINIC_ENDPOINTS.delete(clinicToDelete.clinicId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to delete clinic");
      }
      
      console.log("✅ Clinic deleted successfully");
      setShowDeleteClinicModal(false);
      setShowViewClinicModal(false);
      
      // Show success modal
      setSuccessData({
        name: clinicToDelete.clinicName,
        isEdit: false,
        type: "clinic",
        isDeleted: true
      });
      setShowSuccessModal(true);
      
      // Show success notification
      setSuccess("🎉 Clinic deleted successfully!");
      
      // Refresh clinics list
      if (selectedEnterpriseId > 0) {
        await loadClinicsForEnterprise(selectedEnterpriseId);
      }
      
      // Clear success message after delay
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("❌ Error deleting clinic:", err);
      setError(err.message || "Failed to delete clinic");
      setShowDeleteClinicModal(false);
    } finally {
      setDeletingClinic(false);
      setClinicToDelete(null);
    }
  };

  // Validation functions for staff form
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhoneNumber = (phone) => {
    const digitsOnly = (phone || "").replace(/\D/g, "");
    return digitsOnly.length === 10;
  };

  const validateYearFormat = (dateString) => {
    if (!dateString) return true; // Optional field
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return false;
    const year = dateObj.getFullYear().toString();
    return year.length === 4;
  };

  const validateDateFormat = (dateString) => {
    if (!dateString) return true; // Optional field
    return !isNaN(new Date(dateString).getTime());
  };

  // Handler for phone number input (restrict to 10 digits)
  const handlePhoneInput = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    return digitsOnly;
  };

  // Handler for emergency contact input (restrict to 10 digits)
  const handleEmergencyContactInput = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    return digitsOnly;
  };

  // Check if staff form has any meaningful data
  const hasStaffFormData = () => {
    return (
      staffForm.firstName.trim() !== "" ||
      staffForm.lastName.trim() !== "" ||
      staffForm.email.trim() !== "" ||
      staffForm.phone.trim() !== "" ||
      staffForm.dateOfBirth.trim() !== "" ||
      staffForm.gender.trim() !== "" ||
      staffForm.enterpriseId.trim() !== "" ||
      staffForm.clinicId.trim() !== "" ||
      staffForm.licenseNumber.trim() !== "" ||
      staffForm.licenseExpiry.trim() !== "" ||
      staffForm.joiningDate.trim() !== ""
    );
  };

  // Handle closing onboard staff modal
  const handleCloseOnboardStaffModal = () => {
    setShowOnboardStaffModal(false);
    // If form has data, keep the current step; otherwise reset to personal
    if (!hasStaffFormData()) {
      setOnboardStaffActiveStep("personal");
    }
  };

  // Handler for date input - only allows YYYY-MM-DD format with 4-digit year
  const handleDateChange = (value, fieldName) => {
    // Remove any non-date characters except dashes
    let cleaned = value.replace(/[^\d-]/g, "");
    
    // Split by dash
    const parts = cleaned.split("-");
    
    // Limit year to 4 digits max
    if (parts[0] && parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
    }
    
    // Limit month to 2 digits (01-12)
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
    }
    
    // Limit day to 2 digits (01-31)
    if (parts[2] && parts[2].length > 2) {
      parts[2] = parts[2].slice(0, 2);
    }
    
    const corrected = parts.join("-");
    
    // Only update if within valid length (YYYY-MM-DD is 10 chars)
    if (corrected.length <= 10) {
      setStaffForm({...staffForm, [fieldName]: corrected});
    }
  };

  // Create Staff (TeamHub parity)
  const handleCreateStaff = async () => {
    setStaffFormError("");
    // Basic required checks similar to TeamHub
    if (!staffForm.firstName || !staffForm.lastName || !staffForm.email || !staffForm.phone) {
      setStaffFormError("First name, last name, email, and phone are required");
      return;
    }

    // Email validation
    if (!validateEmail(staffForm.email)) {
      setStaffFormError("Please enter a valid email address (e.g., example@domain.com)");
      return;
    }

    // Phone number validation (10 digits)
    if (!validatePhoneNumber(staffForm.phone)) {
      setStaffFormError("Phone number must be exactly 10 digits");
      return;
    }

    // Emergency contact validation (10 digits)
    if (staffForm.emergencyContact && !validatePhoneNumber(staffForm.emergencyContact)) {
      setStaffFormError("Emergency contact number must be exactly 10 digits");
      return;
    }

    // Date of Birth validation
    if (staffForm.dateOfBirth && !validateDateFormat(staffForm.dateOfBirth)) {
      setStaffFormError("Date of Birth is invalid");
      return;
    }
    if (staffForm.dateOfBirth && !validateYearFormat(staffForm.dateOfBirth)) {
      setStaffFormError("Date of Birth year must be in proper format (4 digits)");
      return;
    }

    // Joining Date validation
    if (staffForm.joiningDate && !validateDateFormat(staffForm.joiningDate)) {
      setStaffFormError("Joining Date is invalid");
      return;
    }
    if (staffForm.joiningDate && !validateYearFormat(staffForm.joiningDate)) {
      setStaffFormError("Joining Date year must be in proper format (4 digits)");
      return;
    }

    // License Expiry Date validation (for clinical roles)
    const isClinicalRole = ["Doctor", "Nurse"].includes(staffForm.rolesAssigned);
    if (isClinicalRole && staffForm.licenseExpiry && !validateDateFormat(staffForm.licenseExpiry)) {
      setStaffFormError("License Expiry Date is invalid");
      return;
    }
    if (isClinicalRole && staffForm.licenseExpiry && !validateYearFormat(staffForm.licenseExpiry)) {
      setStaffFormError("License Expiry Date year must be in proper format (4 digits)");
      return;
    }

    const nowIso = new Date().toISOString();
    
    const payload = {
      staffId: staffForm.staffId || undefined,
      enterpriseId: staffForm.enterpriseId ? parseInt(staffForm.enterpriseId) : null,
      clinicId: staffForm.clinicId ? parseInt(staffForm.clinicId) : null,
      firstName: staffForm.firstName,
      lastName: staffForm.lastName,
      dateOfBirth: staffForm.dateOfBirth ? new Date(staffForm.dateOfBirth).toISOString() : null,
      gender: staffForm.gender || null,
      email: staffForm.email || null,
      phone: staffForm.phone || null,
      address: staffForm.address || null,
      ...(isClinicalRole && {
        licenseNumber: staffForm.licenseNumber || null,
        licenseExpiry: staffForm.licenseExpiry ? new Date(staffForm.licenseExpiry).toISOString() : null,
        specialtyId: staffForm.specialtyId ? parseInt(staffForm.specialtyId) : null
      }),
      yearsExperience: staffForm.yearsExperience ? parseInt(staffForm.yearsExperience) : null,
      education: staffForm.education || null,
      certifications: staffForm.certifications || null,
      languages: staffForm.languages || null,
      joiningDate: staffForm.joiningDate ? new Date(staffForm.joiningDate).toISOString() : null,
      employmentStatus: staffForm.employmentStatus || "Active",
      availability: staffForm.availability || null,
      insuranceDetails: staffForm.insuranceDetails || null,
      emergencyContact: staffForm.emergencyContact || null,
      bio: staffForm.bio || null,
      profilePhotoUrl: staffForm.profilePhotoUrl || null,
      achievements: staffForm.achievements || null,
      publications: staffForm.publications || null,
      socialLinks: staffForm.socialLinks || null,
      rolesAssigned: staffForm.rolesAssigned || "Reception",
      createdAt: nowIso,
      updatedAt: nowIso
    };

    console.log("=== SENDING TO CreateRoleBasedProfile API ===");
    console.log("Role:", staffForm.rolesAssigned, "| Is Clinical:", isClinicalRole);
    console.log("Full Payload:", payload);

    try {
      setCreatingStaff(true);
      await createStaffDetail(payload);
      setSuccessData({ 
        name: `${staffForm.firstName} ${staffForm.lastName}`, 
        isEdit: false 
      });
      setShowSuccessModal(true);
      
      // Reset form and re-open onboard modal in personal info section after success
      setTimeout(() => {
        setShowSuccessModal(false);
        setStaffForm({
          staffId: "",
          enterpriseId: "",
          clinicId: "",
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
          employmentStatus: "Active",
          availability: "",
          insuranceDetails: "",
          emergencyContact: "",
          bio: "",
          profilePhotoUrl: "",
          achievements: "",
          publications: "",
          socialLinks: "",
          rolesAssigned: "Reception"
        });
        setOnboardStaffActiveStep("personal");
        setShowOnboardStaffModal(true);
      }, 2000);
    } catch (err) {
      console.error("❌ Error onboarding staff:", err);
      setStaffFormError(err.message || "Failed to onboard staff");
    } finally {
      setCreatingStaff(false);
    }
  };

  async function fetchStaffProfiles() {
    // Validate required filters
    if (!viewStaffFilters.enterpriseId || !viewStaffFilters.clinicId) {
      setStaffListError("Enterprise and Clinic are required");
      return;
    }

    try {
      setStaffListLoading(true);
      setStaffListError("");
  
      // Build query parameters
      const params = new URLSearchParams();
      params.append("enterpriseId", viewStaffFilters.enterpriseId);
      params.append("clinicId", viewStaffFilters.clinicId);
      
      // Send 'all' if role not selected, otherwise send selected role
      const roleValue = viewStaffFilters.rolesAssigned || "all";
      params.append("rolesAssigned", roleValue);
      
      const url = `${API_BASE_URL}/StaffDetail/GetStaffDetailsbyRole?${params.toString()}`;
      console.log("📡 Fetching staff profiles:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`Unable to load staff profiles (${response.status})`);
      }
  
      const data = await response.json();
      console.log("📊 Raw API response:", data);
      console.log("📊 Response type:", typeof data, "Is Array:", Array.isArray(data));
      
      const staffArray = Array.isArray(data) ? data : data.data || [];
      console.log("📊 Staff array length:", staffArray.length);
      
      if (staffArray.length > 0) {
        console.log("🔍 FIRST ITEM KEYS:", Object.keys(staffArray[0]));
        console.log("🔍 FIRST ITEM FULL DATA:", JSON.stringify(staffArray[0], null, 2));
      }
      
      // Normalize staff data to match StaffDetailModel properties
      const normalizedStaff = staffArray.map((item, idx) => {
        // API returns nested structure: { role, id, profile: {...} }
        const profile = item.profile || item;
        
        const normalized = {
          staffId: profile.StaffId || item.id || "",
          firstName: profile.FirstName || "",
          lastName: profile.LastName || "",
          email: profile.Email || "",
          phone: profile.Phone || "",
          rolesAssigned: (item.role && item.role.trim()) || "",
          employmentStatus: profile.EmploymentStatus || "Unknown",
          // Additional fields for edit form population
          address: profile.Address ?? "",
          gender: profile.Gender ?? "",
          dateOfBirth: profile.DateOfBirth ?? "",
          yearsExperience: profile.YearsExperience ?? "",
          education: profile.Education ?? "",
          certifications: profile.Certifications ?? "",
          languages: profile.Languages ?? "",
          joiningDate: profile.JoiningDate ?? "",
          availability: profile.Availability ?? "",
          insuranceDetails: profile.InsuranceDetails ?? "",
          emergencyContact: profile.EmergencyContact ?? "",
          bio: profile.Bio ?? "",
          profilePhotoUrl: profile.ProfilePhotoUrl ?? "",
          achievements: profile.Achievements ?? "",
          publications: profile.Publications ?? "",
          socialLinks: profile.SocialLinks ?? "",
          licenseNumber: profile.LicenseNumber ?? "",
          licenseExpiry: profile.LicenseExpiry ?? "",
          specialtyId: profile.SpecialtyId ?? ""
        };
        
        if (idx === 0) {
          console.log("📝 NORMALIZED FIRST ITEM:", normalized);
          console.log("📝 Source role:", item.role);
          console.log("📝 Source profile StaffId:", profile.StaffId);
        }
        
        return normalized;
      });
      
      console.log("✅ Loaded staff profiles:", normalizedStaff.length);
      console.log("📦 All normalized data:", normalizedStaff);
      console.log("📊 Staff IDs present:", normalizedStaff.filter(s => s.staffId).length, "/ 13");
      console.log("📊 Roles present:", normalizedStaff.filter(s => s.rolesAssigned).length, "with role");
      setStaffList(normalizedStaff);
    } catch (err) {
      console.error("❌ Error fetching staff profiles:", err);
      setStaffListError(err.message || "Failed to fetch staff profiles");
      setStaffList([]);
    } finally {
      setStaffListLoading(false);
    }
  }

  // Open staff detail modal
  function handleViewStaffDetail(staff) {
    setSelectedStaff(staff);
    setShowStaffDetailModal(true);
    setStaffDetailError("");
  }

  // Helper function to convert ISO datetime to date input format (YYYY-MM-DD)
  function formatDateForInput(dateString) {
    if (!dateString) return "";
    // Extract date portion directly to avoid timezone issues
    // ISO format: "2021-09-17T00:00:00" -> "2021-09-17"
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    // Fallback for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    // Use UTC methods to avoid timezone shifts
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle staff edit - show edit form
  function handleEditStaff() {
    if (!selectedStaff) return;
    console.log("✏️ Opening edit form for staff:", selectedStaff.staffId);
    console.log("✏️ Selected staff complete data:", selectedStaff);
    
    // Pre-fill edit form with current staff data
    setEditStaffForm({
      firstName: selectedStaff.firstName || "",
      lastName: selectedStaff.lastName || "",
      email: selectedStaff.email || "",
      phone: selectedStaff.phone || "",
      address: selectedStaff.address || "",
      gender: selectedStaff.gender || "",
      dateOfBirth: formatDateForInput(selectedStaff.dateOfBirth),
      yearsExperience: selectedStaff.yearsExperience || "",
      education: selectedStaff.education || "",
      certifications: selectedStaff.certifications || "",
      languages: selectedStaff.languages || "",
      joiningDate: formatDateForInput(selectedStaff.joiningDate),
      employmentStatus: selectedStaff.employmentStatus || "Active",
      availability: selectedStaff.availability || "",
      insuranceDetails: selectedStaff.insuranceDetails || "",
      emergencyContact: selectedStaff.emergencyContact || "",
      bio: selectedStaff.bio || "",
      profilePhotoUrl: selectedStaff.profilePhotoUrl || "",
      achievements: selectedStaff.achievements || "",
      publications: selectedStaff.publications || "",
      socialLinks: selectedStaff.socialLinks || "",
      licenseNumber: selectedStaff.licenseNumber || "",
      licenseExpiry: formatDateForInput(selectedStaff.licenseExpiry),
      specialtyId: selectedStaff.specialtyId || ""
    });
    
    console.log("✏️ Edit form initialized:", {
      firstName: selectedStaff.firstName,
      address: selectedStaff.address,
      bio: selectedStaff.bio,
      gender: selectedStaff.gender
    });
    
    setIsEditingStaff(true);
    setStaffDetailError("");
  }

  // Handle staff save after editing
  async function handleSaveEditStaff() {
    if (!selectedStaff || !editStaffForm) return;
    
    try {
      setStaffDetailLoading(true);
      setStaffDetailError("");
      console.log("💾 Saving staff:", selectedStaff.staffId);
      
      // Build the payload matching StaffDetailModel
      const payload = {
        StaffId: selectedStaff.staffId,
        FirstName: editStaffForm.firstName,
        LastName: editStaffForm.lastName,
        Email: editStaffForm.email,
        Phone: editStaffForm.phone,
        EmploymentStatus: editStaffForm.employmentStatus,
        RolesAssigned: selectedStaff.rolesAssigned || "Reception",
        Address: editStaffForm.address || "",
        Gender: editStaffForm.gender || "",
        DateOfBirth: editStaffForm.dateOfBirth || null,
        YearsExperience: editStaffForm.yearsExperience ? parseInt(editStaffForm.yearsExperience) : 0,
        Education: editStaffForm.education || "",
        Certifications: editStaffForm.certifications || "",
        Languages: editStaffForm.languages || "",
        JoiningDate: editStaffForm.joiningDate || null,
        Availability: editStaffForm.availability || "",
        InsuranceDetails: editStaffForm.insuranceDetails || "",
        EmergencyContact: editStaffForm.emergencyContact || "",
        Bio: editStaffForm.bio || "",
        ProfilePhotoUrl: editStaffForm.profilePhotoUrl || "",
        Achievements: editStaffForm.achievements || "",
        Publications: editStaffForm.publications || "",
        SocialLinks: editStaffForm.socialLinks || "",
        LicenseNumber: editStaffForm.licenseNumber || "",
        LicenseExpiry: editStaffForm.licenseExpiry || null,
        SpecialtyId: selectedStaff.specialtyId || null,
        EnterpriseID: selectedStaff.enterpriseID || viewStaffFilters.enterpriseId,
        ClinicID: selectedStaff.clinicID || viewStaffFilters.clinicId
      };
      
      const roleParam = encodeURIComponent(selectedStaff.rolesAssigned || "Reception");
      const url = `${API_BASE_URL}/StaffDetail/EditRoleBasedProfile/${selectedStaff.staffId}?rolesAssigned=${roleParam}`;
      console.log("📡 Edit URL:", url);
      console.log("📦 Edit Payload:", payload);
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Unable to update staff (${response.status})`);
      }
      
      console.log("✅ Staff updated successfully");
      setSuccessData({
        name: `${editStaffForm.firstName} ${editStaffForm.lastName}`,
        isEdit: true
      });
      setShowSuccessModal(true);
      setShowStaffDetailModal(false);
      setIsEditingStaff(false);
      setEditStaffForm(null);
      
      // Refresh staff list
      await fetchStaffProfiles();
    } catch (err) {
      console.error("❌ Error editing staff:", err);
      setStaffDetailError(err.message || "Failed to update staff");
    } finally {
      setStaffDetailLoading(false);
    }
  }

  // Cancel edit
  function handleCancelEdit() {
    setIsEditingStaff(false);
    setEditStaffForm(null);
    setStaffDetailError("");
  }

  // Handle staff delete
  async function handleDeleteStaff() {
    if (!selectedStaff) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedStaff.firstName} ${selectedStaff.lastName}?`)) {
      return;
    }
    
    try {
      setStaffDetailLoading(true);
      console.log("🗑️ Deleting staff:", selectedStaff.staffId);
      
      // Build query parameters
      const params = new URLSearchParams({
        rolesAssigned: selectedStaff.rolesAssigned,
        profileId: selectedStaff.staffId,
        firstName: selectedStaff.firstName,
        lastName: selectedStaff.lastName
      });
      
      const url = `${API_BASE_URL}/StaffDetail/DeleteRoleBasedProfile?${params.toString()}`;
      console.log("🗑️ Delete URL:", url);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Delete API error response:", errorText);
        throw new Error(`Failed to delete staff (${response.status}): ${errorText}`);
      }
      
      console.log("✅ Staff deleted successfully");
      setShowStaffDetailModal(false);
      setSelectedStaff(null);
      // Refresh staff list
      await fetchStaffProfiles();
    } catch (err) {
      console.error("❌ Error deleting staff:", err);
      setStaffDetailError(err.message || "Failed to delete staff");
    } finally {
      setStaffDetailLoading(false);
    }
  }

  // Filter enterprises by search query
  const filteredEnterprises = useMemo(() => {
    const query = enterpriseSearchQuery.trim().toLowerCase();
    if (!query) return enterprises;
    return enterprises.filter(ent => 
      (ent.enterpriseName || "").toLowerCase().includes(query)
    );
  }, [enterprises, enterpriseSearchQuery]);

  // Load clinics for a specific enterprise
  const loadClinicsForEnterprise_old = async (enterpriseId) => {
    if (!enterpriseId || enterpriseId === 0) {
      setListClinicsError("Please select an enterprise");
      return;
    }
    
    try {
      setListClinicsLoading(true);
      setListClinicsError("");
      const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${enterpriseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Unable to load clinics (${response.status})`);
      }

      const data = await response.json();
      const enterpriseClinics = Array.isArray(data) ? data : data.data || [];
      
      setListClinicsData(enterpriseClinics);
    } catch (err) {
      setListClinicsError(err.message || "Failed to load clinics");
    } finally {
      setListClinicsLoading(false);
    }
  };

  // ============ APPOINTMENT CRUD FUNCTIONS ============

  const fetchAppointments = async (clinicId = null, firstName = null, lastName = null, doctorId = null, appointmentDate = null) => {
    try {
      setAppointmentLoading(true);
      setAppointmentError("");
      
      // Clinic ID and Appointment Date are required
      if (!clinicId) {
        setAppointmentError("Please select a clinic to filter appointments");
        setAppointmentLoading(false);
        return;
      }
      
      if (!appointmentDate) {
        setAppointmentError("Please select an appointment date to filter appointments");
        setAppointmentLoading(false);
        return;
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("clinicId", clinicId);
      queryParams.append("appointmentDate", appointmentDate);
      if (firstName) {
        queryParams.append("firstName", firstName);
      }
      if (lastName) {
        queryParams.append("lastName", lastName);
      }
      if (doctorId) {
        queryParams.append("doctorId", doctorId);
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/Appointments/GetAppointmentsSuperAdmin?${queryString}`;

      console.log("📋 Fetching appointments from:", url);
      console.log("   Clinic ID:", clinicId);
      console.log("   Appointment Date:", appointmentDate);
      console.log("   First Name:", firstName || "null");
      console.log("   Last Name:", lastName || "null");
      console.log("   Doctor ID:", doctorId || "null");
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Appointments fetch error:", response.status, errorText);
        throw new Error(`Failed to load appointments (${response.status})`);
      }

      const data = await response.json();
      console.log("✅ Appointments loaded:", data);
      const appointmentsList = Array.isArray(data) ? data : data.data || [];
      setAppointments(appointmentsList);
    } catch (err) {
      console.error("❌ Error fetching appointments:", err);
      setAppointmentError(err.message || "Failed to load appointments");
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    setAppointmentFormError("");

    // Validation
    if (!createAppointmentForm.patientId || !createAppointmentForm.clinicId || !createAppointmentForm.appointmentDate) {
      setAppointmentFormError("Patient ID, Clinic, and Appointment Date are required");
      return;
    }

    if (!createAppointmentForm.firstName || !createAppointmentForm.lastName || !createAppointmentForm.phoneNumber) {
      setAppointmentFormError("First name, last name, and phone number are required");
      return;
    }

    const normalizedPhone = (createAppointmentForm.phoneNumber || "").replace(/\D/g, "");
    if (normalizedPhone.length !== 10) {
      setAppointmentFormError("Phone number must be 10 digits");
      return;
    }

    const normalizedEmail = createAppointmentForm.email ? createAppointmentForm.email.trim() : "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
      setAppointmentFormError("Enter a valid email address");
      return;
    }

    // Parse and format data properly
    const patientId = parseInt(createAppointmentForm.patientId);
    const clinicId = parseInt(createAppointmentForm.clinicId);
    const enterpriseId = parseInt(createAppointmentForm.enterpriseId) || 0;
    
    // Keep doctorId as string, or null if empty
    const doctorId = createAppointmentForm.doctorId && String(createAppointmentForm.doctorId).trim() !== "" ? String(createAppointmentForm.doctorId).trim() : null;
    const durationMinutes = createAppointmentForm.durationMinutes ? parseInt(createAppointmentForm.durationMinutes) : null;
    const billableAmount = createAppointmentForm.billableAmount ? parseFloat(createAppointmentForm.billableAmount) : null;

    // Format appointment date as date only (e.g., "2026-01-12")
    // Format appointment date as date only (e.g., "2026-01-12")
    // Use split to avoid timezone issues
    const appointmentDateOnly = createAppointmentForm.appointmentDate 
      ? createAppointmentForm.appointmentDate.split('T')[0]
      : null;

    // Format times as TimeSpan "HH:mm:ss" format
    const formatTimeToTimeSpan = (timeString) => {
      if (!timeString) return null;
      // If it's in format "HH:mm", add ":00" to make "HH:mm:00"
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString + ":00";
      }
      // If it's already in "HH:mm:ss" format, return as is
      if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
        return timeString;
      }
      return null;
    };

    const startTime = formatTimeToTimeSpan(createAppointmentForm.startTime);
    const endTime = formatTimeToTimeSpan(createAppointmentForm.endTime);

    // Validate critical numeric fields
    if (isNaN(patientId) || isNaN(clinicId)) {
      setAppointmentFormError("Patient ID and Clinic ID must be valid numbers");
      return;
    }

    const payload = {
      patientId: patientId,
      clinicId: clinicId,
      doctorId: doctorId,
      attendingPhysician: createAppointmentForm.attendingPhysician ? createAppointmentForm.attendingPhysician.trim() : null,
      enterpriseId: enterpriseId,
      firstName: createAppointmentForm.firstName.trim(),
      lastName: createAppointmentForm.lastName.trim(),
      phoneNumber: normalizedPhone,
      email: normalizedEmail || null,
      appointmentDate: appointmentDateOnly,
      startTime: startTime,
      endTime: endTime,
      durationMinutes: durationMinutes,
      appointmentType: createAppointmentForm.appointmentType || "Consultation",
      reasonForVisit: createAppointmentForm.reasonForVisit ? createAppointmentForm.reasonForVisit.trim() : null,
      notes: createAppointmentForm.notes ? createAppointmentForm.notes.trim() : null,
      roomNumber: createAppointmentForm.roomNumber ? createAppointmentForm.roomNumber.trim() : null,
      telehealthLink: createAppointmentForm.telehealthLink ? createAppointmentForm.telehealthLink.trim() : null,
      status: createAppointmentForm.status || "Scheduled",
      isConfirmed: createAppointmentForm.isConfirmed === true,
      billableAmount: billableAmount,
      paidAmount: createAppointmentForm.paidAmount ? parseFloat(createAppointmentForm.paidAmount) : null,
      pendingAmount: createAppointmentForm.pendingAmount ? parseFloat(createAppointmentForm.pendingAmount) : null,
      paymentStatus: createAppointmentForm.paymentStatus || "Pending",
      createdBy: null,
      updatedBy: null
    };

    console.log("📋 Creating appointment with payload:", payload);

    try {
      setAppointmentFormLoading(true);
      const response = await fetch(APPOINTMENT_ENDPOINTS.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to create appointment (${response.status})`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error("❌ Server error response:", errorData);
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.errors) {
              errorMessage = Object.values(errorData.errors).join(", ");
            }
          } else {
            // Try to get raw text response
            const errorText = await response.clone().text();
            console.error("❌ Server error (raw text):", errorText);
            // Show first 200 chars of error
            errorMessage = errorText.substring(0, 200) || `Failed to create appointment (${response.status})`;
          }
        } catch (e) {
          console.error("❌ Error parsing response:", e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Appointment created successfully:", result);
      
      setAppointmentSuccess(`Appointment created successfully for ${createAppointmentForm.firstName} ${createAppointmentForm.lastName}`);
      setShowCreateAppointmentModal(false);
      
      // Reset form
      setCreateAppointmentForm({
        patientId: "",
        clinicId: "",
        doctorId: "",
        enterpriseId: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        appointmentDate: "",
        startTime: "",
        endTime: "",
        durationMinutes: "30",
        appointmentType: "Consultation",
        reasonForVisit: "",
        notes: "",
        roomNumber: "",
        telehealthLink: "",
        status: "Scheduled",
        isConfirmed: false,
        billableAmount: "",
        paymentStatus: "Pending",
        appointmentClinics: []
      });

      // Refresh list
      await fetchAppointments();
      
      // Show success
      setTimeout(() => setAppointmentSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error creating appointment:", err);
      setAppointmentFormError(err.message || "Failed to create appointment");
    } finally {
      setAppointmentFormLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    setAppointmentFormError("");

    if (!editAppointmentForm || !editAppointmentForm.appointmentId) {
      setAppointmentFormError("Invalid appointment selected");
      return;
    }

    // Parse and format data properly
    const appointmentId = parseInt(editAppointmentForm.appointmentId);
    const patientId = parseInt(editAppointmentForm.patientId);
    const clinicId = parseInt(editAppointmentForm.clinicId);
    const enterpriseId = parseInt(editAppointmentForm.enterpriseId) || 0;
    
    // Keep doctorId as string, or null if empty
    const doctorId = editAppointmentForm.doctorId && String(editAppointmentForm.doctorId).trim() !== "" ? String(editAppointmentForm.doctorId).trim() : null;
    const durationMinutes = editAppointmentForm.durationMinutes ? parseInt(editAppointmentForm.durationMinutes) : null;
    const billableAmount = editAppointmentForm.billableAmount ? parseFloat(editAppointmentForm.billableAmount) : null;
    
    // Parse visitId and createdBy as integers
    const visitId = editAppointmentForm.visitId && editAppointmentForm.visitId !== "" ? parseInt(editAppointmentForm.visitId) : null;
    const createdByInt = editAppointmentForm.createdBy && editAppointmentForm.createdBy !== "" ? parseInt(editAppointmentForm.createdBy) : null;

    // Format appointment date as date only (e.g., "2026-01-12")
    // Use split to avoid timezone issues
    const appointmentDateOnly = editAppointmentForm.appointmentDate 
      ? editAppointmentForm.appointmentDate.split('T')[0]
      : null;

    // Format times as TimeSpan "HH:mm:ss" format
    const formatTimeToTimeSpan = (timeString) => {
      if (!timeString) return null;
      // If it's in format "HH:mm", add ":00" to make "HH:mm:00"
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString + ":00";
      }
      // If it's already in "HH:mm:ss" format, return as is
      if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
        return timeString;
      }
      return null;
    };

    const startTime = formatTimeToTimeSpan(editAppointmentForm.startTime);
    const endTime = formatTimeToTimeSpan(editAppointmentForm.endTime);

    // Validate critical numeric fields
    if (isNaN(appointmentId) || isNaN(patientId) || isNaN(clinicId)) {
      setAppointmentFormError("Appointment ID, Patient ID, and Clinic ID must be valid numbers");
      return;
    }

    const payload = {
      appointmentId: appointmentId,
      patientId: patientId,
      clinicId: clinicId,
      doctorId: doctorId,
      visitId: visitId,
      attendingPhysician: editAppointmentForm.attendingPhysician || null,
      enterpriseId: enterpriseId,
      firstName: editAppointmentForm.firstName.trim(),
      lastName: editAppointmentForm.lastName.trim(),
      phoneNumber: editAppointmentForm.phoneNumber.trim(),
      email: editAppointmentForm.email ? editAppointmentForm.email.trim() : null,
      appointmentDate: appointmentDateOnly,
      startTime: startTime,
      endTime: endTime,
      durationMinutes: durationMinutes,
      appointmentType: editAppointmentForm.appointmentType || "Consultation",
      reasonForVisit: editAppointmentForm.reasonForVisit ? editAppointmentForm.reasonForVisit.trim() : null,
      notes: editAppointmentForm.notes ? editAppointmentForm.notes.trim() : null,
      roomNumber: editAppointmentForm.roomNumber ? editAppointmentForm.roomNumber.trim() : null,
      telehealthLink: editAppointmentForm.telehealthLink ? editAppointmentForm.telehealthLink.trim() : null,
      status: editAppointmentForm.status || "Scheduled",
      isConfirmed: editAppointmentForm.isConfirmed === true,
      billableAmount: billableAmount,
      paidAmount: editAppointmentForm.paidAmount && editAppointmentForm.paidAmount !== "" ? parseFloat(editAppointmentForm.paidAmount) : null,
      pendingAmount: editAppointmentForm.pendingAmount && editAppointmentForm.pendingAmount !== "" ? parseFloat(editAppointmentForm.pendingAmount) : null,
      paymentStatus: editAppointmentForm.paymentStatus || "Pending",
      createdAt: editAppointmentForm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: createdByInt,
      updatedBy: null
    };

    console.log("📋 Updating appointment with payload:", payload);
    console.log("� Paid from form:", editAppointmentForm.paid, "Type:", typeof editAppointmentForm.paid);
    console.log("💰 Pending from form:", editAppointmentForm.pending, "Type:", typeof editAppointmentForm.pending);
    console.log("�📋 Payload JSON:", JSON.stringify(payload, null, 2));

    try {
      setAppointmentFormLoading(true);
      const response = await fetch(APPOINTMENT_ENDPOINTS.update, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to update appointment (${response.status})`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error("❌ Server error response:", errorData);
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.errors) {
              errorMessage = Object.values(errorData.errors).join(", ");
            }
          } else {
            // Try to get raw text response
            const errorText = await response.clone().text();
            console.error("❌ Server error (raw text):", errorText);
            // Show first 200 chars of error
            errorMessage = errorText.substring(0, 200) || `Failed to update appointment (${response.status})`;
          }
        } catch (e) {
          console.error("❌ Error parsing response:", e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Appointment updated successfully:", result);
      
      setAppointmentSuccess("Appointment updated successfully");
      setShowEditAppointmentModal(false);
      setShowAppointmentListModal(false);
      setEditAppointmentForm(null);
      
      setTimeout(() => setAppointmentSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error updating appointment:", err);
      setAppointmentFormError(err.message || "Failed to update appointment");
    } finally {
      setAppointmentFormLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) {
      setAppointmentError("No appointment selected");
      return;
    }

    console.log("🗑️ Appointment to delete:", appointmentToDelete);
    console.log("🗑️ Appointment ID:", appointmentToDelete.appointmentId);
    console.log("🗑️ Delete URL:", APPOINTMENT_ENDPOINTS.delete(appointmentToDelete.appointmentId));

    try {
      setDeletingAppointment(true);
      const deleteUrl = APPOINTMENT_ENDPOINTS.delete(appointmentToDelete.appointmentId);
      console.log("🗑️ Calling DELETE endpoint:", deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });

      if (!response.ok) {
        console.error("❌ Delete failed with status:", response.status);
        throw new Error(`Failed to delete appointment (${response.status})`);
      }

      setAppointmentSuccess("Appointment deleted successfully");
      setShowDeleteAppointmentModal(false);
      setShowAppointmentListModal(false);
      setAppointmentToDelete(null);
      setTimeout(() => setAppointmentSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error deleting appointment:", err);
      setAppointmentError(err.message || "Failed to delete appointment");
    } finally {
      setDeletingAppointment(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    const query = appointmentFilterQuery.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((apt) => {
      const fields = [
        apt.firstName,
        apt.lastName,
        apt.email,
        apt.phoneNumber,
        apt.appointmentType,
        apt.status,
        apt.reasonForVisit
      ].map((f) => (f || "").toString().toLowerCase());
      return fields.some((f) => f.includes(query));
    });
  }, [appointmentFilterQuery, appointments]);

  const handleCloseAppointmentList = () => {
    setShowAppointmentListModal(false);
    // Reset filter inputs while keeping fetched results intact
    setAppointmentFilterQuery("");
    setAppointmentFilterEnterprise("");
    setAppointmentFilterClinic("");
    setAppointmentFilterFirstName("");
    setAppointmentFilterLastName("");
    setAppointmentFilterDoctor("");
    setAppointmentFilterDate("");
    setLastAppointmentFilters({ clinicId: null, firstName: null, lastName: null, doctorId: null, appointmentDate: null });
  };

  // ============ PATIENT MANAGEMENT HANDLERS ============

  const handleCreatePatientEnterpriseChange = (enterpriseId) => {
    // Load clinics for the selected enterprise
    if (enterpriseId) {
      loadClinicsForEnterprise(enterpriseId);
    } else {
      setClinics([]);
    }
  };

  const handleCreatePatient = async () => {
    if (!createPatientForm.firstName || !createPatientForm.lastName || !createPatientForm.clinicId) {
      setPatientFormError("Please fill in all required fields");
      return;
    }

    // Validate email if provided
    if (createPatientForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createPatientForm.email)) {
        setPatientFormError("Please enter a valid email address");
        return;
      }
    }

    // Validate phone number - should not be more than 10 digits
    if (createPatientForm.phoneNumber) {
      const phoneDigits = createPatientForm.phoneNumber.replace(/\D/g, "");
      if (phoneDigits.length > 10) {
        setPatientFormError("Phone number should not exceed 10 digits");
        return;
      }
      if (phoneDigits.length === 0) {
        setPatientFormError("Phone number should contain at least some digits");
        return;
      }
    }

    // Validate alternate phone if provided
    if (createPatientForm.alternatePhone) {
      const altPhoneDigits = createPatientForm.alternatePhone.replace(/\D/g, "");
      if (altPhoneDigits.length > 10) {
        setPatientFormError("Alternate phone number should not exceed 10 digits");
        return;
      }
    }

    try {
      setPatientFormLoading(true);
      setPatientFormError("");

      const patientDataModel = {
        patient: {
          patientId: 0,
          patientEntityID: "",
          patientFirstName: createPatientForm.firstName,
          patientLastName: createPatientForm.lastName,
          patientDOB: createPatientForm.dateOfBirth || new Date().toISOString(),
          patientGender: createPatientForm.gender || "",
          patientBloodType: createPatientForm.bloodGroup || "",
          clinicID: createPatientForm.clinicId || ""
        },
        patientContact: {
          patientId: 0,
          patientAddress: `${createPatientForm.addressLine1 || ""}${createPatientForm.addressLine2 ? ", " + createPatientForm.addressLine2 : ""}`.trim(),
          patientCity: createPatientForm.city || "",
          patientPhone: createPatientForm.phoneNumber || "",
          patientEmail: createPatientForm.email || "",
          patientEmergencyContact: createPatientForm.emergencyContactName 
            ? `${createPatientForm.emergencyContactName} - ${createPatientForm.emergencyContactPhone} (${createPatientForm.emergencyContactRelation})`
            : ""
        },
        patientMedicalInfo: {
          patientId: 0,
          patientMedicalHistory: createPatientForm.familyMedicalHistory || "",
          patientAllergies: createPatientForm.allergies || "",
          patientCurrentMedications: createPatientForm.currentMedications || "",
          patientPrimaryPhysician: "",
          no_of_visits: 0,
          lastVisitedDate: createPatientForm.lastDentalVisit || new Date().toISOString(),
          chronicDiseases: createPatientForm.chronicConditions || "",
          medicalHistory: `Past Surgeries: ${createPatientForm.pastSurgeries || "None"}; Smoking: ${createPatientForm.smokingStatus || "Unknown"}; Alcohol: ${createPatientForm.alcoholConsumption || "Unknown"}; Exercise: ${createPatientForm.exerciseFrequency || "Unknown"}; Diet: ${createPatientForm.dietaryRestrictions || "None"}; Notes: ${createPatientForm.additionalMedicalNotes || "None"}`
        },
        patientInsurance: {
          patientId: 0,
          patientInsuranceProvider: createPatientForm.insuranceProvider || ""
        }
      };

      console.log("Submitting patient data from SuperAdmin:", patientDataModel);
      console.log("📤 Full Payload JSON:", JSON.stringify(patientDataModel, null, 2));
      const response = await createPatient(patientDataModel);
      console.log("Patient created successfully:", response);
      
      setPatientSuccess("Patient registered successfully!");
      setShowCreatePatientModal(false);
      setCreatePatientForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        maritalStatus: "",
        enterpriseId: "",
        clinicId: "",
        role: "Patient",
        phoneNumber: "",
        alternatePhone: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: "",
        allergies: "",
        chronicConditions: "",
        currentMedications: "",
        pastSurgeries: "",
        familyMedicalHistory: "",
        smokingStatus: "",
        alcoholConsumption: "",
        exerciseFrequency: "",
        lastDentalVisit: "",
        dietaryRestrictions: "",
        additionalMedicalNotes: "",
        insuranceProvider: "",
        policyNumber: ""
      });
      setTimeout(() => setPatientSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error registering patient:", err);
      setPatientFormError(err.message || "Failed to register patient");
    } finally {
      setPatientFormLoading(false);
    }
  };

  // ============ INVENTORY MANAGEMENT HANDLERS ============

  const fetchInventoryItems = async () => {
    try {
      setInventoryLoading(true);
      const response = await fetch(INVENTORY_ENDPOINTS.master.list, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch inventory:", response.status);
        return;
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.data || [];
      console.log("✅ Inventory items loaded:", items);
      setInventoryItems(items);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
      setInventoryError("Failed to load inventory items");
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleCreateInventory = async () => {
    const isMultipleMode = Array.isArray(createInventoryForm);
    
    // Validate
    if (isMultipleMode) {
      // Validate all items
      for (let i = 0; i < createInventoryForm.length; i++) {
        const item = createInventoryForm[i];
        if (!item.itemName || !item.itemCode || !item.category) {
          setInventoryFormError(`Item ${i + 1}: Name, Code, and Category are required`);
          return;
        }
      }
    } else {
      // Validate single item
      if (!createInventoryForm.itemName || !createInventoryForm.itemCode || !createInventoryForm.category) {
        setInventoryFormError("Item Name, Code, and Category are required");
        return;
      }
    }

    try {
      setInventoryFormLoading(true);
      const endpoint = isMultipleMode ? INVENTORY_ENDPOINTS.master.createBulk : INVENTORY_ENDPOINTS.master.create;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(createInventoryForm)
      });

      if (!response.ok) {
        throw new Error(`Failed to create inventory (${response.status})`);
      }

      const successMsg = isMultipleMode 
        ? `${createInventoryForm.length} inventory items created successfully` 
        : "Inventory item created successfully";
      
      setInventorySuccess(successMsg);
      setShowCreateInventoryModal(false);
      setCreateInventoryForm({
        itemName: "",
        itemCode: "",
        category: "",
        subCategory: "",
        unit: "",
        isActive: true
      });
      fetchInventoryItems();
      setTimeout(() => setInventorySuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error creating inventory:", err);
      setInventoryFormError(err.message || "Failed to create inventory item");
    } finally {
      setInventoryFormLoading(false);
    }
  };

  const handleUpdateInventory = async () => {
    if (!editInventoryForm || !editInventoryForm.itemId) {
      setInventoryFormError("No inventory selected");
      return;
    }

    try {
      setInventoryFormLoading(true);
      const response = await fetch(INVENTORY_ENDPOINTS.master.update(editInventoryForm.itemId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(editInventoryForm)
      });

      if (!response.ok) {
        throw new Error(`Failed to update inventory (${response.status})`);
      }

      setInventorySuccess("Inventory item updated successfully");
      setShowEditInventoryModal(false);
      setEditInventoryForm(null);
      fetchInventoryItems();
      setTimeout(() => setInventorySuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error updating inventory:", err);
      setInventoryFormError(err.message || "Failed to update inventory item");
    } finally {
      setInventoryFormLoading(false);
    }
  };

  const handleDeleteInventory = async () => {
    if (!inventoryToDelete || !inventoryToDelete.itemId) {
      setInventoryError("No inventory selected");
      return;
    }

    try {
      setDeletingInventory(true);
      const response = await fetch(INVENTORY_ENDPOINTS.master.delete(inventoryToDelete.itemId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete inventory (${response.status})`);
      }

      setInventorySuccess("Inventory item deleted successfully");
      setShowDeleteInventoryModal(false);
      setShowInventoryListModal(false);
      setInventoryToDelete(null);
      fetchInventoryItems();
      setTimeout(() => setInventorySuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error deleting inventory:", err);
      setInventoryError(err.message || "Failed to delete inventory item");
    } finally {
      setDeletingInventory(false);
    }
  };

  const filteredInventoryItems = useMemo(() => {
    const query = inventoryFilterQuery.trim().toLowerCase();
    const items = inventoryItems.filter((item) => {
      if (inventoryFilterCategory && item.category !== inventoryFilterCategory) return false;
      if (inventoryFilterStatus && item.isActive.toString() !== inventoryFilterStatus) return false;
      
      const fields = [
        item.itemName,
        item.itemCode,
        item.category,
        item.subCategory
      ].map((f) => (f || "").toString().toLowerCase());
      
      if (!query) return true;
      return fields.some((f) => f.includes(query));
    });
    return items;
  }, [inventoryFilterQuery, inventoryFilterCategory, inventoryFilterStatus, inventoryItems]);

  // ============ PATIENT MANAGEMENT HANDLERS ============

  const handleSearchPatient = async () => {
    if (!patientSearchId) {
      setPatientProfileError("Please enter a Patient ID");
      return;
    }

    try {
      setPatientProfileLoading(true);
      setPatientProfileError("");
      setPatientProfile(null);

      const response = await fetch(PATIENT_ENDPOINTS.getFullProfile(patientSearchId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Patient not found");
        }
        throw new Error(`Failed to fetch patient (${response.status})`);
      }

      const data = await response.json();
      console.log("✅ Patient profile loaded:", data);
      setPatientProfile(data);
    } catch (err) {
      console.error("❌ Error fetching patient:", err);
      setPatientProfileError(err.message || "Failed to load patient profile");
    } finally {
      setPatientProfileLoading(false);
    }
  };

  const handleUpdatePatient = async () => {
    if (!editPatientForm || !editPatientForm.patientId) {
      setPatientFormError("No patient selected");
      return;
    }

    try {
      setPatientFormLoading(true);
      setPatientFormError("");

      const response = await fetch(PATIENT_ENDPOINTS.update(editPatientForm.patientId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(editPatientForm)
      });

      if (!response.ok) {
        throw new Error(`Failed to update patient (${response.status})`);
      }

      setAppointmentSuccess("Patient updated successfully");
      setShowEditPatientModal(false);
      setEditPatientForm(null);
      // Refresh the patient profile
      if (patientSearchId) {
        handleSearchPatient();
      }
      setTimeout(() => setAppointmentSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error updating patient:", err);
      setPatientFormError(err.message || "Failed to update patient");
    } finally {
      setPatientFormLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete || !patientToDelete.patientId) {
      setPatientProfileError("No patient selected");
      return;
    }

    try {
      setDeletingPatient(true);
      const response = await fetch(PATIENT_ENDPOINTS.delete(patientToDelete.patientId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete patient (${response.status})`);
      }

      setAppointmentSuccess("Patient deleted successfully");
      setShowDeletePatientModal(false);
      setShowManagePatientModal(false);
      setPatientToDelete(null);
      setPatientProfile(null);
      setPatientSearchId("");
      setTimeout(() => setAppointmentSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error deleting patient:", err);
      setPatientProfileError(err.message || "Failed to delete patient");
    } finally {
      setDeletingPatient(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchSuperAdmins();
    fetchRoles();
    fetchEnterprises();
    fetchClinics();
    fetchDoctors();
  }, []);

  // Reset to main page when navigating to SuperAdmin route
  useEffect(() => {
    // Reset activeCard to show main options whenever navigation occurs (using location.key)
    // location.key changes even when clicking the same nav link
    setActiveCard(null);
    setError("");
    setSuccess("");
    setShowViewModal(false);
  }, [location.key]);

  // Refresh super admins list when view modal closes to show latest data
  useEffect(() => {
    if (!showViewModal) {
      // Modal was just closed, refresh the list so updated data appears
      fetchSuperAdmins();
    }
  }, [showViewModal]);

  // Load enterprises when viewing clinics
  useEffect(() => {
    if (activeCard === "clinics") {
      console.log("📋 View Clinics activated, loading enterprises...");
      fetchEnterprises();
    }
  }, [activeCard]);

  // Load enterprises when Create Patient modal opens
  useEffect(() => {
    if (showCreatePatientModal) {
      console.log("📋 Create Patient modal opened, loading enterprises...");
      console.log("Current enterprises:", enterprises);
      fetchEnterprises().then(() => {
        console.log("✅ Enterprises fetched for patient modal");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreatePatientModal]);

  // Fetch clinics based on enterprise ID in staff form
  useEffect(() => {
    if (staffForm.enterpriseId) {
      const fetchClinicsForEnterprise = async () => {
        try {
          const response = await fetch(CLINIC_ENDPOINTS.getByEnterpriseId(staffForm.enterpriseId), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
            }
          });

          if (!response.ok) {
            console.warn(`Unable to load clinics for enterprise ${staffForm.enterpriseId}`);
            return;
          }

          const data = await response.json();
          const fetchedClinics = Array.isArray(data) ? data : data.data || [];
          setClinics(fetchedClinics);
          console.log("✅ Clinics loaded for enterprise:", staffForm.enterpriseId, fetchedClinics);
        } catch (err) {
          console.error("❌ Error fetching clinics:", err);
        }
      };

      fetchClinicsForEnterprise();
    } else {
      setClinics([]);
    }
  }, [staffForm.enterpriseId]);

  // Fetch clinics based on enterprise ID in appointment form
  useEffect(() => {
    if (createAppointmentForm.enterpriseId) {
      const fetchClinicsForAppointment = async () => {
        try {
          console.log("📋 Loading clinics for appointment, enterprise ID:", createAppointmentForm.enterpriseId);
          const response = await fetch(CLINIC_ENDPOINTS.getByEnterpriseId(createAppointmentForm.enterpriseId), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
            }
          });

          if (!response.ok) {
            console.warn(`Unable to load clinics for enterprise ${createAppointmentForm.enterpriseId}`);
            setAppointmentFormError(`Failed to load clinics (${response.status})`);
            return;
          }

          const data = await response.json();
          const fetchedClinics = Array.isArray(data) ? data : data.data || [];
          console.log("✅ Clinics loaded for appointment enterprise:", createAppointmentForm.enterpriseId, fetchedClinics);
          
          // Update clinics in state - create a temporary appointments clinics state
          // We'll store it in the form as appointmentClinics
          setCreateAppointmentForm((prev) => ({
            ...prev,
            appointmentClinics: fetchedClinics
          }));
        } catch (err) {
          console.error("❌ Error fetching clinics for appointment:", err);
          setAppointmentFormError("Failed to load clinics");
        }
      };

      fetchClinicsForAppointment();
    } else {
      setCreateAppointmentForm((prev) => ({
        ...prev,
        appointmentClinics: [],
        clinicId: ""
      }));
    }
  }, [createAppointmentForm.enterpriseId]);

  // Handle patient form clinic loading when enterprise changes
  useEffect(() => {
    if (createPatientForm.enterpriseId) {
      const fetchClinicsForPatient = async () => {
        try {
          console.log("📋 Loading clinics for patient, enterprise ID:", createPatientForm.enterpriseId);
          const response = await fetch(
            `${API_BASE_URL}/Clinic/GetClinicByID?id=${createPatientForm.enterpriseId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
              }
            }
          );

          if (!response.ok) {
            console.warn(`Unable to load clinics for enterprise ${createPatientForm.enterpriseId}`);
            return;
          }

          const data = await response.json();
          const fetchedClinics = Array.isArray(data) ? data : data.data || [];
          console.log("✅ Clinics loaded for patient enterprise:", createPatientForm.enterpriseId, fetchedClinics);
          
          setCreatePatientForm((prev) => ({
            ...prev,
            patientClinics: fetchedClinics
          }));
        } catch (err) {
          console.error("❌ Error fetching clinics for patient:", err);
        }
      };

      fetchClinicsForPatient();
    } else {
      setCreatePatientForm((prev) => ({
        ...prev,
        patientClinics: [],
        clinicId: ""
      }));
    }
  }, [createPatientForm.enterpriseId]);

  const activeAccent = activeCard === "onboard" ? "from-teal-500 to-emerald-500" : "from-indigo-500 to-purple-500";

  const sections = [
    {
      id: 'superadmin-management',
      title: "🛡️ Super Admin Management",
      description: "Manage super administrators and their access",
      gradient: "from-amber-500 via-orange-500 to-rose-600",
      bgGradient: "from-amber-50 to-rose-50",
      options: [
        {
          id: 'onboard-superadmin',
          title: "✨ Onboard Super Admin",
          description: "Add new super administrator",
          icon: "➕",
          color: "from-teal-500 to-emerald-500",
          action: () => setActiveCard("onboard")
        },
        {
          id: 'view-superadmins',
          title: "📋 View Super Admins",
          description: "Browse and manage super admins",
          icon: "👁️",
          color: "from-indigo-500 to-purple-500",
          action: () => {
            setActiveCard("view");
            fetchSuperAdmins();
          }
        }
      ]
    },
    {
      id: 'enterprise-management',
      title: "🏢 Enterprise Management",
      description: "Manage enterprises and clinics across the organization",
      gradient: "from-blue-500 via-cyan-500 to-teal-600",
      bgGradient: "from-blue-50 to-teal-50",
      options: [
        {
          id: 'add-enterprise',
          title: "➕ Add Enterprise",
          description: "Create new enterprise",
          icon: "➕",
          color: "from-cyan-500 to-blue-500",
          action: () => setShowCreateEnterpriseModal(true)
        },
        {
          id: 'view-enterprises',
          title: "🏢 Manage Enterprise",
          description: "View and edit enterprises",
          icon: "⚙️",
          color: "from-blue-500 to-cyan-500",
          action: () => {
            setActiveCard("enterprises");
            fetchEnterprises();
          }
        }
      ]
    },
    {
      id: 'clinic-management',
      title: "🏥 Clinic Management",
      description: "Manage clinic locations and operations",
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-50 to-cyan-50",
      options: [
        {
          id: 'add-clinic',
          title: "➕ Add Clinic",
          description: "Create new clinic location",
          icon: "➕",
          color: "from-emerald-400 to-teal-400",
          action: () => {
            console.log("🏥 Add Clinic clicked, loading enterprises...");
            setShowCreateClinicModal(true);
            setCreateClinicActiveTab("basic");
            setClinicFormError("");
            fetchEnterprises();
          }
        },
        {
          id: 'view-clinics',
          title: "🏥 Manage Clinics",
          description: "View and edit clinic locations",
          icon: "⚙️",
          color: "from-teal-500 to-emerald-500",
          action: () => {
            console.log("🏥 View Clinics clicked, loading enterprises...");
            setActiveCard("clinics");
            setSelectedEnterpriseId(0);
            setEnterpriseSearchQuery("");
            setClinics([]);
            fetchEnterprises();
          }
        }
      ]
    },
    {
      id: 'staff-onboarding',
      title: "🔔 Recruit & Integrate",
      description: "Onboard staff and manage roles (TeamHub parity)",
      gradient: "from-purple-500 via-indigo-500 to-blue-500",
      bgGradient: "from-purple-50 to-indigo-50",
      options: [
        {
          id: 'onboard-staff',
          title: "🎭 Onboard Staff",
          description: "Add reception team members",
          icon: "🔔",
          color: "from-indigo-500 to-purple-500",
          action: () => {
            setOnboardStaffActiveStep("personal");
            setShowOnboardStaffModal(true);
            setStaffFormError("");
            fetchEnterprises();
            fetchClinics();
          }
        },
        {
          id: 'view-staff',
          title: "👁️ View Staff Details",
          description: "Search and manage reception staff",
          icon: "💬",
          color: "from-blue-500 to-cyan-500",
          action: () => {
            setShowViewStaffModal(true);
            setStaffListError("");
            setStaffList([]);
            setViewStaffFilters({
              enterpriseId: "",
              clinicId: "",
              rolesAssigned: "",
            });
            fetchEnterprises();
            fetchRoles();
          }
        },
        {
          id: 'doctor-clinic-mapping',
          title: "🔗 Doctor-Clinic Mapping",
          description: "Map doctors to multiple clinic locations",
          icon: "🏥",
          color: "from-violet-500 to-indigo-500",
          action: () => {
            window.location.href = "/superadmin/clinic-mapping";
          }
        }
      ]
    },
    {
      id: 'patient-management',
      title: "👥 Patient Management",
      description: "Manage patient information and records",
      gradient: "from-teal-500 via-cyan-500 to-blue-600",
      bgGradient: "from-teal-50 to-blue-50",
      options: [
        {
          id: 'create-patient',
          title: "➕ Create Patient",
          description: "Add new patient to the system",
          icon: "🆕",
          color: "from-teal-500 to-cyan-500",
          action: () => {
            setShowCreatePatientModal(true);
            setCreatePatientActiveTab("patient-info");
            setPatientFormError("");
            fetchEnterprises();
          }
        },
        {
          id: 'manage-patient',
          title: "📋 Manage Patients",
          description: "Search and manage patient records",
          icon: "👤",
          color: "from-cyan-500 to-blue-500",
          action: () => {
            setShowManagePatientModal(true);
            setPatientSearchId("");
            setPatientProfile(null);
            setPatientProfileError("");
          }
        }
      ]
    },
    {
      id: 'appointment-management',
      title: "📅 Appointment Management",
      description: "Manage patient appointments and scheduling",
      gradient: "from-rose-500 via-pink-500 to-red-600",
      bgGradient: "from-rose-50 to-red-50",
      options: [
        {
          id: 'add-appointment',
          title: "➕ Create Appointment",
          description: "Schedule new patient appointment",
          icon: "📅",
          color: "from-rose-500 to-pink-500",
          action: () => {
            setShowCreateAppointmentModal(true);
            setCreateAppointmentActiveTab("basic");
            setAppointmentFormError("");
            setCreateAppointmentForm({
              patientId: "",
              clinicId: "",
              doctorId: "",
              enterpriseId: "",
              firstName: "",
              lastName: "",
              phoneNumber: "",
              email: "",
              appointmentDate: "",
              startTime: "",
              endTime: "",
              durationMinutes: "30",
              appointmentType: "Consultation",
              reasonForVisit: "",
              notes: "",
              roomNumber: "",
              telehealthLink: "",
              status: "Scheduled",
              isConfirmed: false,
              billableAmount: "",
              paymentStatus: "Pending",
              appointmentClinics: []
            });
            fetchEnterprises();
            fetchClinics();
          }
        },
        {
          id: 'view-appointments',
          title: "📋 Manage Appointments",
          description: "View and edit appointments",
          icon: "📊",
          color: "from-pink-500 to-rose-500",
          action: () => {
            setShowAppointmentListModal(true);
            setAppointmentFilterQuery("");
            setAppointmentError("");
            // Clear all filters
            setAppointmentFilterEnterprise("");
            setAppointmentFilterClinic("");
            setAppointmentFilterFirstName("");
            setAppointmentFilterLastName("");
            setAppointmentFilterDoctor("");
            setAppointmentFilterDate("");
            setAppointments([]);
          }
        }
      ]
    },
    {
      id: 'inventory-management',
      title: "📦 Inventory Management",
      description: "Manage medical supplies and equipment inventory",
      gradient: "from-violet-500 via-purple-500 to-indigo-600",
      bgGradient: "from-violet-50 to-indigo-50",
      options: [
        {
          id: 'add-inventory',
          title: "📦 Add Inventory Items",
          description: "Add single or multiple inventory items",
          icon: "📦",
          color: "from-violet-500 to-purple-500",
          action: () => {
            navigate('/inventory/add-master');
          }
        },
        {
          id: 'view-inventory',
          title: "📊 Manage Inventory",
          description: "View and edit inventory items",
          icon: "📋",
          color: "from-purple-500 to-violet-500",
          action: () => {
            setShowInventoryListModal(true);
            setInventoryFilterQuery("");
            setInventoryFilterCategory("");
            setInventoryFilterStatus("");
            setInventoryError("");
            fetchInventoryItems();
          }
        },
        {
          id: 'clinic-inventory',
          title: "🏥 Clinic Stock",
          description: "Manage inventory across clinics",
          icon: "📈",
          color: "from-indigo-500 to-violet-500",
          action: () => {
            navigate('/inventory/clinic');
          }
        }
      ]
    }
  ];

  const handleCardClick = (option) => {
    if (option.action) {
      option.action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-8 shadow-2xl mb-8"
        >
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
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
                🛡️
              </motion.span>
              Super Admin Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/90"
            >
              Centralized control room for super administrator management
            </motion.p>
          </div>
        </motion.div>

        {/* Sections */}
        {!activeCard && (
        <div className="space-y-8">
          {sections.map((section, sectionIdx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * sectionIdx }}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${section.bgGradient} p-6 shadow-lg border border-white/50`}
            >
              {/* Section Header */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${section.gradient} p-6 mb-6 shadow-lg`}>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">{section.title}</h2>
                  <p className="text-white/90">{section.description}</p>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.options.map((option, idx) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCardClick(option)}
                    className="relative group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer text-left border border-slate-100"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      }}
                    />
                    
                    <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                        {option.icon}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-purple-600 transition-all">
                        {option.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {option.description}
                      </p>
                    </div>

                    {/* Hover Shine Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      }}
                      animate={{
                        x: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 0.6,
                        ease: 'easeInOut',
                        repeat: 0,
                      }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {/* Content Area - Onboard/View Forms */}
        <AnimatePresence mode="wait">
          {activeCard === "onboard" && (
            <motion.div
              key="onboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${activeAccent} opacity-10`} />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-teal-700 flex items-center gap-2">{editingId ? "Editing existing record" : "New onboarding"}</p>
                  <h2 className="text-2xl font-bold text-slate-800">Onboard Super Admin</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-500">Fields with * are required</div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCard(null);
                      setForm(initialForm);
                      setEditingId("");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}
              {success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">Use a valid work email; access links are sent here.</p>
                    {isEmailInvalid && <p className="text-xs text-rose-600 mt-1">Enter a valid email address.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      title="Enter exactly 10 digits"
                      placeholder="e.g., 9876543210"
                    />
                    <p className="text-xs text-slate-500 mt-1">Enter a 10-digit mobile number without country code.</p>
                    {isPhoneInvalid && <p className="text-xs text-rose-600 mt-1">Phone number must be exactly 10 digits.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      max={toInputDate(new Date())}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={form.joiningDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status</label>
                    <select
                      name="employmentStatus"
                      value={form.employmentStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Onboarding">Onboarding</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Education</label>
                    <input
                      type="text"
                      name="education"
                      value={form.education}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Highest qualification"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Languages</label>
                    <input
                      type="text"
                      name="languages"
                      value={form.languages}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="English, Hindi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Years Experience</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      name="yearsExperience"
                      value={form.yearsExperience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      inputMode="numeric"
                      pattern="\\d{1,2}"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Availability</label>
                    <input
                      type="text"
                      name="availability"
                      value={form.availability}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Weekdays 9 AM - 6 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Street, City, Country"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? "Saving..." : editingId ? "Update Super Admin" : "Onboard Super Admin"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(""); setForm(initialForm); }}
                      className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
              </div>
            </motion.div>
          )}

          {activeCard === "view" && (
            <motion.div
              key="view-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${activeAccent} opacity-10`} />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-700">Live roster</p>
                  <h2 className="text-2xl font-bold text-slate-800">View Super Admins</h2>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search name, email, language"
                    className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  <button
                    onClick={fetchSuperAdmins}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}
              {success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">{success}</div>}

              <div className="overflow-x-auto border border-slate-100/80 rounded-2xl bg-white/95 shadow-sm backdrop-blur-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      {["Name", "Email", "Phone", "Experience", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                    ) : filteredList.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No super admins found</td></tr>
                    ) : (
                      filteredList.map((admin, idx) => (
                        <tr key={admin.adminId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 text-slate-800 font-semibold">{admin.firstName} {admin.lastName}</td>
                          <td className="px-4 py-3 text-slate-700">{admin.email}</td>
                          <td className="px-4 py-3 text-slate-700">{admin.phone}</td>
                          <td className="px-4 py-3 text-slate-700">{admin.yearsExperience || 0} yrs</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admin.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                              {admin.employmentStatus || (admin.isActive ? "Active" : "Inactive")}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => handleView(admin)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              View/Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

          {activeCard === "enterprises" && (
            <motion.div
              key="enterprises-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Directory</p>
                    <h2 className="text-2xl font-bold text-slate-800">View Enterprises</h2>
                  </div>
                  <button
                    onClick={fetchEnterprises}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    Refresh
                  </button>
                </div>

                {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}

                <div className="overflow-x-auto border border-slate-100/80 rounded-2xl bg-white/95 shadow-sm backdrop-blur-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {["Enterprise ID", "Name", "Contact Email", "Contact Phone", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enterpriseLoading ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                      ) : enterprises.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No enterprises found</td></tr>
                      ) : (
                        enterprises.map((enterprise, idx) => (
                          <tr key={enterprise.enterpriseId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{enterprise.enterpriseId}</td>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{enterprise.enterpriseName}</td>
                            <td className="px-4 py-3 text-slate-700">{enterprise.contactEmail || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-700">{enterprise.contactPhone || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enterprise.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                                {enterprise.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleViewEnterprise(enterprise)}
                                className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold shadow-sm hover:shadow-md"
                              >
                                View/Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeCard === "clinics" && (
            <motion.div
              key="clinics-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10" />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-green-700">Directory</p>
                    <h2 className="text-2xl font-bold text-slate-800">View Clinics</h2>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEnterpriseId(0);
                      setEnterpriseSearchQuery("");
                      setClinics([]);
                      fetchEnterprises();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    Refresh
                  </button>
                </div>

                {success && (
                  <div className="pointer-events-none fixed right-6 top-6 z-[60]">
                    <div className="pointer-events-auto max-w-sm rounded-2xl bg-white/95 shadow-2xl border border-emerald-100 px-4 py-3 flex items-start gap-3">
                      <div className="shrink-0 text-2xl">🎉</div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Success</p>
                        <p className="text-sm text-slate-700">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}

                {/* Enterprise Selection */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700">Select Enterprise</label>
                  <select
                    value={selectedEnterpriseId}
                    onChange={(e) => {
                      const entId = parseInt(e.target.value);
                      setSelectedEnterpriseId(entId);
                      if (entId > 0) {
                        loadClinicsForEnterprise(entId);
                      } else {
                        setClinics([]);
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white"
                  >
                    <option value={0}>-- Select an Enterprise --</option>
                    {enterprises.map((ent) => (
                      <option key={ent.enterpriseId} value={ent.enterpriseId}>
                        {ent.enterpriseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto border border-slate-100/80 rounded-2xl bg-white/95 shadow-sm backdrop-blur-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {["Clinic ID", "Name", "Code", "City", "Phone", "Email", "Hours", "Status", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewClinicsLoading ? (
                        <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">Loading clinics...</td></tr>
                      ) : selectedEnterpriseId === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">Select an enterprise to view clinics</td></tr>
                      ) : clinics.length === 0 ? (
                        <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">No clinics found for this enterprise</td></tr>
                      ) : (
                        clinics.map((clinic, idx) => (
                          <tr key={clinic.clinicId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{clinic.clinicId}</td>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{clinic.clinicName}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.clinicCode || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.city || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.contactPhone || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.contactEmail || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.openingHours || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${clinic.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                                {clinic.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setViewingClinic(clinic);
                                  setClinicEditData(clinic);
                                  setClinicEditMode(false);
                                  setShowViewClinicModal(true);
                                  setClinicSaveError("");
                                  setClinicSaveSuccess("");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:shadow-lg transition-all"
                              >
                                View/Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Staff Modal */}
        <AnimatePresence>
          {showViewStaffModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="relative z-20 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">👁️</span>
                      <div>
                        <h2 className="text-2xl font-bold text-white">View Staff Details</h2>
                        <p className="text-purple-100 text-sm">Search and filter staff members</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewStaffModal(false)}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  {staffListError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
                      {staffListError}
                    </div>
                  )}

                  {/* Filter Form */}
                  <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <span>🔍</span> Search Filters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Enterprise (Required) */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Enterprise <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={viewStaffFilters.enterpriseId}
                          onChange={(e) => {
                            setViewStaffFilters({
                              ...viewStaffFilters,
                              enterpriseId: e.target.value,
                              clinicId: ""
                            });
                            if (e.target.value) {
                              loadClinicsForEnterprise(parseInt(e.target.value));
                            } else {
                              setClinics([]);
                            }
                          }}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="">-- Select Enterprise --</option>
                          {enterprises.map((ent) => (
                            <option key={ent.enterpriseId} value={ent.enterpriseId}>
                              {ent.enterpriseName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Clinic (Required) */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Clinic <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={viewStaffFilters.clinicId}
                          onChange={(e) =>
                            setViewStaffFilters({ ...viewStaffFilters, clinicId: e.target.value })
                          }
                          disabled={!viewStaffFilters.enterpriseId}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Select Clinic --</option>
                          {clinics.map((clinic) => (
                            <option key={clinic.clinicId} value={clinic.clinicId}>
                              {clinic.clinicName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Role (Optional) */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Role <span className="text-slate-400 text-xs">(optional)</span>
                        </label>
                        <select
                          value={viewStaffFilters.rolesAssigned}
                          onChange={(e) =>
                            setViewStaffFilters({ ...viewStaffFilters, rolesAssigned: e.target.value })
                          }
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="">-- Select Role --</option>
                          {roles.map((roleName) => (
                            <option key={roleName} value={roleName}>
                              {roleName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Optional filters removed as requested */}

                    {/* Search Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={fetchStaffProfiles}
                        disabled={staffListLoading}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                      >
                        {staffListLoading ? "Searching..." : "🔍 Search Staff"}
                      </button>
                    </div>
                  </div>

                  {/* Staff Results */}
                  {staffList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800">
                          📋 Staff Members ({staffList.length})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Profile ID</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {staffList.map((staff, idx) => (
                              <tr 
                                key={staff.staffId || idx} 
                                onClick={() => handleViewStaffDetail(staff)}
                                className="hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <td className="px-6 py-4 text-sm text-slate-700">{staff.staffId || "N/A"}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                  {staff.firstName} {staff.lastName}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700">{staff.email || "N/A"}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{staff.phone || "N/A"}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{staff.rolesAssigned || "N/A"}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    staff.employmentStatus === "Active" 
                                      ? "bg-emerald-100 text-emerald-700" 
                                      : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {staff.employmentStatus || "Unknown"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {staffList.length === 0 && !staffListLoading && !staffListError && (
                    <div className="text-center py-12 text-slate-500">
                      <span className="text-4xl mb-2 block">🔍</span>
                      <p className="text-lg">Enter search criteria above to find staff members</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staff Detail Modal */}
        <AnimatePresence>
          {showStaffDetailModal && selectedStaff && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="relative z-20 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">👤</span>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedStaff.firstName} {selectedStaff.lastName}</h2>
                        <p className="text-purple-100 text-sm">{selectedStaff.rolesAssigned || "No Role"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowStaffDetailModal(false)}
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  {staffDetailError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
                      {staffDetailError}
                    </div>
                  )}

                  {/* View Mode - Profile Info */}
                  {!isEditingStaff && (
                    <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Profile Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase">Profile ID</label>
                          <p className="text-sm text-slate-900 font-medium">{selectedStaff.staffId || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase">Role</label>
                          <p className="text-sm text-slate-900 font-medium">{selectedStaff.rolesAssigned || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase">Email</label>
                          <p className="text-sm text-slate-900 font-medium">{selectedStaff.email || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase">Phone</label>
                          <p className="text-sm text-slate-900 font-medium">{selectedStaff.phone || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 uppercase">Employment Status</label>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedStaff.employmentStatus === "Active" || selectedStaff.employmentStatus === "Full-time"
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {selectedStaff.employmentStatus || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Mode - Form */}
                  {isEditingStaff && editStaffForm && (
                    <div className="space-y-6">
                      {/* Personal Information */}
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">👤 Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                            <input type="text" value={editStaffForm.firstName} onChange={(e) => setEditStaffForm({...editStaffForm, firstName: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                            <input type="text" value={editStaffForm.lastName} onChange={(e) => setEditStaffForm({...editStaffForm, lastName: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                            <select value={editStaffForm.gender} onChange={(e) => setEditStaffForm({...editStaffForm, gender: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent">
                              <option value="">-- Select --</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                            <input type="date" value={editStaffForm.dateOfBirth} onChange={(e) => setEditStaffForm({...editStaffForm, dateOfBirth: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">📞 Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                            <input type="email" value={editStaffForm.email} onChange={(e) => setEditStaffForm({...editStaffForm, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                            <input type="tel" value={editStaffForm.phone} onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                            <input type="text" value={editStaffForm.address} onChange={(e) => setEditStaffForm({...editStaffForm, address: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
                            <input type="text" value={editStaffForm.emergencyContact} onChange={(e) => setEditStaffForm({...editStaffForm, emergencyContact: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">💼 Professional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Years of Experience</label>
                            <input type="number" value={editStaffForm.yearsExperience} onChange={(e) => setEditStaffForm({...editStaffForm, yearsExperience: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Education</label>
                            <input type="text" value={editStaffForm.education} onChange={(e) => setEditStaffForm({...editStaffForm, education: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Certifications</label>
                            <input type="text" value={editStaffForm.certifications} onChange={(e) => setEditStaffForm({...editStaffForm, certifications: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Languages</label>
                            <input type="text" value={editStaffForm.languages} onChange={(e) => setEditStaffForm({...editStaffForm, languages: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          
                          {/* Clinical fields - only for Doctor and Nurse */}
                          {(selectedStaff.rolesAssigned?.toLowerCase() === 'doctor' || selectedStaff.rolesAssigned?.toLowerCase() === 'nurse') && (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">License Number</label>
                                <input type="text" value={editStaffForm.licenseNumber} onChange={(e) => setEditStaffForm({...editStaffForm, licenseNumber: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">License Expiry</label>
                                <input type="date" value={editStaffForm.licenseExpiry} onChange={(e) => setEditStaffForm({...editStaffForm, licenseExpiry: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Specialty ID</label>
                                <input type="text" value={editStaffForm.specialtyId} onChange={(e) => setEditStaffForm({...editStaffForm, specialtyId: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Employment Details */}
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Employment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Joining Date</label>
                            <input type="date" value={editStaffForm.joiningDate} onChange={(e) => setEditStaffForm({...editStaffForm, joiningDate: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status</label>
                            <select value={editStaffForm.employmentStatus} onChange={(e) => setEditStaffForm({...editStaffForm, employmentStatus: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent">
                              <option value="Active">Active</option>
                              <option value="Full-time">Full-time</option>
                              <option value="Part-time">Part-time</option>
                              <option value="Inactive">Inactive</option>
                              <option value="On Leave">On Leave</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Availability</label>
                            <input type="text" value={editStaffForm.availability} onChange={(e) => setEditStaffForm({...editStaffForm, availability: e.target.value})} placeholder="e.g., Mon-Fri 9-5" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Insurance Details</label>
                            <input type="text" value={editStaffForm.insuranceDetails} onChange={(e) => setEditStaffForm({...editStaffForm, insuranceDetails: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">✨ Additional Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                            <textarea value={editStaffForm.bio} onChange={(e) => setEditStaffForm({...editStaffForm, bio: e.target.value})} rows="3" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                            <input type="text" value={editStaffForm.profilePhotoUrl} onChange={(e) => setEditStaffForm({...editStaffForm, profilePhotoUrl: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Achievements</label>
                            <textarea value={editStaffForm.achievements} onChange={(e) => setEditStaffForm({...editStaffForm, achievements: e.target.value})} rows="2" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Publications</label>
                            <textarea value={editStaffForm.publications} onChange={(e) => setEditStaffForm({...editStaffForm, publications: e.target.value})} rows="2" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Social Links</label>
                            <input type="text" value={editStaffForm.socialLinks} onChange={(e) => setEditStaffForm({...editStaffForm, socialLinks: e.target.value})} placeholder="LinkedIn, Twitter, etc." className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => isEditingStaff ? handleCancelEdit() : setShowStaffDetailModal(false)}
                      className="px-6 py-3 rounded-xl bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
                    >
                      {isEditingStaff ? "Cancel" : "Close"}
                    </button>
                    {!isEditingStaff && (
                      <>
                        <button
                          onClick={handleEditStaff}
                          disabled={staffDetailLoading}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                        >
                          ✏️ {staffDetailLoading ? "Processing..." : "Edit"}
                        </button>
                        <button
                          onClick={handleDeleteStaff}
                          disabled={staffDetailLoading}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                        >
                          🗑️ {staffDetailLoading ? "Processing..." : "Delete"}
                        </button>
                      </>
                    )}
                    {isEditingStaff && (
                      <button
                        onClick={handleSaveEditStaff}
                        disabled={staffDetailLoading}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                      >
                        💾 {staffDetailLoading ? "Saving..." : "Save"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View/Edit Clinic Modal */}
        <AnimatePresence>
          {showViewClinicModal && viewingClinic && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                if (!clinicEditMode) {
                  setShowViewClinicModal(false);
                  setClinicSaveError("");
                  setClinicSaveSuccess("");
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
                
                {/* Header */}
                <div className="relative z-10 px-8 pt-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <span>🏥</span> {clinicEditMode ? "Edit Clinic" : "Clinic Details"}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">{viewingClinic.clinicName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowViewClinicModal(false);
                        setClinicEditMode(false);
                        setClinicSaveError("");
                        setClinicSaveSuccess("");
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-slate-100">
                  {clinicSaveError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
                      {clinicSaveError}
                    </div>
                  )}
                  {clinicSaveSuccess && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 mb-4">
                      {clinicSaveSuccess}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">📋 Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Clinic Name</label>
                          {clinicEditMode ? (
                            <input
                              type="text"
                              value={clinicEditData?.clinicName || ""}
                              onChange={(e) => setClinicEditData({...clinicEditData, clinicName: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                            />
                          ) : (
                            <p className="text-slate-900">{viewingClinic.clinicName || "N/A"}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Clinic Code</label>
                          {clinicEditMode ? (
                            <input
                              type="text"
                              value={clinicEditData?.clinicCode || ""}
                              onChange={(e) => setClinicEditData({...clinicEditData, clinicCode: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                            />
                          ) : (
                            <p className="text-slate-900">{viewingClinic.clinicCode || "N/A"}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">📞 Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                          {clinicEditMode ? (
                            <>
                              <input
                                type="email"
                                value={clinicEditData?.contactEmail || ""}
                                onChange={(e) => setClinicEditData({...clinicEditData, contactEmail: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                              />
                              <p className="text-xs text-slate-500 mt-1">Use a valid email address for clinic contact.</p>
                            </>
                          ) : (
                            <p className="text-slate-900">{viewingClinic.contactEmail || "N/A"}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                          {clinicEditMode ? (
                            <>
                              <input
                                type="tel"
                                value={clinicEditData?.contactPhone || ""}
                                onChange={(e) => {
                                  const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                                  setClinicEditData({...clinicEditData, contactPhone: sanitized});
                                }}
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                maxLength={10}
                                title="Enter exactly 10 digits"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                              />
                              <p className="text-xs text-slate-500 mt-1">Enter a 10-digit number without country code.</p>
                            </>
                          ) : (
                            <p className="text-slate-900">{viewingClinic.contactPhone || "N/A"}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">📍 Address</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Address Line 1</label>
                          {clinicEditMode ? (
                            <input
                              type="text"
                              value={clinicEditData?.addressLine1 || ""}
                              onChange={(e) => setClinicEditData({...clinicEditData, addressLine1: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                            />
                          ) : (
                            <p className="text-slate-900">{viewingClinic.addressLine1 || "N/A"}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Address Line 2</label>
                          {clinicEditMode ? (
                            <input
                              type="text"
                              value={clinicEditData?.addressLine2 || ""}
                              onChange={(e) => setClinicEditData({...clinicEditData, addressLine2: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                            />
                          ) : (
                            <p className="text-slate-900">{viewingClinic.addressLine2 || "N/A"}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                            {clinicEditMode ? (
                              <input
                                type="text"
                                value={clinicEditData?.city || ""}
                                onChange={(e) => setClinicEditData({...clinicEditData, city: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                              />
                            ) : (
                              <p className="text-slate-900">{viewingClinic.city || "N/A"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                            {clinicEditMode ? (
                              <input
                                type="text"
                                value={clinicEditData?.state || ""}
                                onChange={(e) => setClinicEditData({...clinicEditData, state: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                              />
                            ) : (
                              <p className="text-slate-900">{viewingClinic.state || "N/A"}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                            {clinicEditMode ? (
                              <input
                                type="text"
                                value={clinicEditData?.country || ""}
                                onChange={(e) => setClinicEditData({...clinicEditData, country: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                              />
                            ) : (
                              <p className="text-slate-900">{viewingClinic.country || "N/A"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Postal Code</label>
                            {clinicEditMode ? (
                              <>
                                <input
                                  type="text"
                                  value={clinicEditData?.postalCode || ""}
                                  onChange={(e) => {
                                    const sanitized = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setClinicEditData({...clinicEditData, postalCode: sanitized});
                                  }}
                                  inputMode="numeric"
                                  pattern="[0-9]{6}"
                                  maxLength={6}
                                  title="Enter exactly 6 digits"
                                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400"
                                />
                                <p className="text-xs text-slate-500 mt-1">Enter a 6-digit postal code.</p>
                              </>
                            ) : (
                              <p className="text-slate-900">{viewingClinic.postalCode || "N/A"}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operating Hours */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">🕐 Operating Hours</h3>
                      {clinicEditMode ? (
                        <textarea
                          value={clinicEditData?.openingHours || ""}
                          onChange={(e) => setClinicEditData({...clinicEditData, openingHours: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 resize-none"
                          rows="6"
                        />
                      ) : (
                        <pre className="text-slate-900 whitespace-pre-wrap font-sans">{viewingClinic.openingHours || "N/A"}</pre>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-3">⚙️ Settings</h3>
                      {clinicEditMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="editClinicIsActive"
                            checked={clinicEditData?.isActive ?? true}
                            onChange={(e) => setClinicEditData({...clinicEditData, isActive: e.target.checked})}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-400"
                          />
                          <label htmlFor="editClinicIsActive" className="text-sm font-semibold text-slate-700">
                            Clinic is Active
                          </label>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${viewingClinic.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                          {viewingClinic.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 px-8 py-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-3 justify-end">
                    {clinicEditMode ? (
                      <>
                        <button
                          onClick={() => {
                            setClinicEditMode(false);
                            setClinicEditData(viewingClinic);
                            setClinicSaveError("");
                          }}
                          className="px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveClinicEdits}
                          disabled={clinicSaveLoading}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {clinicSaveLoading ? "Saving..." : "💾 Save Changes"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setClinicEditMode(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClinic(viewingClinic)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold hover:shadow-lg transition-all"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Clinic Confirmation Modal */}
        <AnimatePresence>
          {showDeleteClinicModal && clinicToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !deletingClinic && setShowDeleteClinicModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🗑️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Clinic?</h3>
                  <p className="text-slate-600 mb-6">
                    Are you sure you want to delete <span className="font-semibold">{clinicToDelete.clinicName}</span>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteClinicModal(false)}
                      disabled={deletingClinic}
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteClinic}
                      disabled={deletingClinic}
                      className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {deletingClinic ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Details Modal */}
        <AnimatePresence>
          {showViewModal && viewingAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <div className="relative z-10 p-8 flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-2xl shadow-lg">👤</div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{viewingAdmin.firstName} {viewingAdmin.lastName}</h2>
                        <p className="text-sm text-slate-600">Super Admin Details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit toggle and messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {viewSaveError && (
                        <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{viewSaveError}</div>
                      )}
                      {viewSaveSuccess && (
                        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{viewSaveSuccess}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (viewEditMode) {
                          // cancel
                          setViewEditMode(false);
                          setViewEditData({
                            adminId: viewingAdmin.adminId || "",
                            firstName: viewingAdmin.firstName || "",
                            lastName: viewingAdmin.lastName || "",
                            email: viewingAdmin.email || "",
                            phone: viewingAdmin.phone || "",
                            dateOfBirth: viewingAdmin.dateOfBirth ? toInputDate(viewingAdmin.dateOfBirth) : "",
                            gender: viewingAdmin.gender || "",
                            address: viewingAdmin.address || "",
                            education: viewingAdmin.education || "",
                            languages: viewingAdmin.languages || "",
                            yearsExperience: viewingAdmin.yearsExperience ?? "",
                            joiningDate: viewingAdmin.joiningDate ? toInputDate(viewingAdmin.joiningDate) : "",
                            employmentStatus: viewingAdmin.employmentStatus || (viewingAdmin.isActive ? "Active" : "Inactive"),
                            availability: viewingAdmin.availability || "",
                            isActive: viewingAdmin.isActive !== undefined ? !!viewingAdmin.isActive : true
                          });
                        } else {
                          setViewEditMode(true);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold ${viewEditMode ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-indigo-600 text-white'} hover:opacity-90`}
                    >
                      {viewEditMode ? 'Cancel Edit' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                      {viewEditMode ? (
                        <>
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.email} onChange={(e)=>setViewEditData({...viewEditData,email:e.target.value})} />
                          <p className="text-xs text-slate-500 mt-1">Use a valid work email; access links are sent here.</p>
                        </>
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.email}</p>
                      )}
                    </div>
                    {/* Phone */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                      {viewEditMode ? (
                        <>
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.phone} onChange={(e)=>setViewEditData({...viewEditData,phone:e.target.value})} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Enter exactly 10 digits" placeholder="e.g., 9876543210" />
                          <p className="text-xs text-slate-500 mt-1">Enter a 10-digit mobile number without country code.</p>
                        </>
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.phone || 'N/A'}</p>
                      )}
                    </div>
                    {/* Gender */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Gender</p>
                      {viewEditMode ? (
                        <select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.gender} onChange={(e)=>setViewEditData({...viewEditData,gender:e.target.value})}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.gender || 'N/A'}</p>
                      )}
                    </div>
                    {/* DOB */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</p>
                      {viewEditMode ? (
                        <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.dateOfBirth} onChange={(e)=>setViewEditData({...viewEditData,dateOfBirth:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.dateOfBirth ? toInputDate(viewingAdmin.dateOfBirth) : 'N/A'}</p>
                      )}
                    </div>
                    {/* Experience */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Years of Experience</p>
                      {viewEditMode ? (
                        <input type="number" min="0" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.yearsExperience} onChange={(e)=>setViewEditData({...viewEditData,yearsExperience:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.yearsExperience || 0} years</p>
                      )}
                    </div>
                    {/* Joining Date */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Joining Date</p>
                      {viewEditMode ? (
                        <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.joiningDate} onChange={(e)=>setViewEditData({...viewEditData,joiningDate:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.joiningDate ? toInputDate(viewingAdmin.joiningDate) : 'N/A'}</p>
                      )}
                    </div>
                    {/* Employment Status */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Employment Status</p>
                      {viewEditMode ? (
                        <select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.employmentStatus} onChange={(e)=>setViewEditData({...viewEditData,employmentStatus:e.target.value})}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          viewingAdmin.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {viewingAdmin.employmentStatus || (viewingAdmin.isActive ? 'Active' : 'Inactive')}
                        </span>
                      )}
                    </div>
                    {/* Education */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Education</p>
                      {viewEditMode ? (
                        <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.education} onChange={(e)=>setViewEditData({...viewEditData,education:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.education || 'N/A'}</p>
                      )}
                    </div>
                    {/* Languages */}
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Languages</p>
                      {viewEditMode ? (
                        <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.languages} onChange={(e)=>setViewEditData({...viewEditData,languages:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.languages || 'N/A'}</p>
                      )}
                    </div>
                    {/* Availability */}
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Availability</p>
                      {viewEditMode ? (
                        <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.availability} onChange={(e)=>setViewEditData({...viewEditData,availability:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.availability || 'N/A'}</p>
                      )}
                    </div>
                    {/* Address */}
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
                      {viewEditMode ? (
                        <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200" value={viewEditData.address} onChange={(e)=>setViewEditData({...viewEditData,address:e.target.value})} />
                      ) : (
                        <p className="text-slate-800">{viewingAdmin.address || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  </div>

                  {/* Sticky Footer */}
                  <div className="mt-6 flex gap-3 flex-shrink-0 border-t border-slate-200 pt-4">
                    {viewEditMode ? (
                      <button
                        onClick={saveViewEdits}
                        disabled={viewSaveLoading}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                      >
                        {viewSaveLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDeletingAdmin(viewingAdmin);
                          setShowDeleteModal(true);
                        }}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && deletingAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-red-500/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 text-white flex items-center justify-center text-2xl shadow-lg">⚠️</div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Confirm Delete</h2>
                      <p className="text-sm text-slate-600">This action cannot be undone</p>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                    <p className="text-slate-800">
                      Are you sure you want to delete super admin <span className="font-semibold">{deletingAdmin.firstName} {deletingAdmin.lastName}</span>?
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Email: {deletingAdmin.email}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={confirmDelete}
                      disabled={listLoading}
                      className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                    >
                      {listLoading ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletingAdmin(null);
                      }}
                      disabled={listLoading}
                      className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Flyer Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowSuccessModal(false)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 opacity-95">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl"
                  />
                  <motion.div
                    animate={{
                      scale: [1.2, 1, 1.2],
                      rotate: [360, 180, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/30 rounded-full blur-3xl"
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 p-10 text-center">
                  {/* Success Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: "spring",
                      damping: 15,
                      stiffness: 200
                    }}
                    className="mx-auto w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center mb-6"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl"
                    >
                      ✨
                    </motion.span>
                  </motion.div>

                  {/* Success Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-4xl font-bold text-white mb-3">
                      {successData.type === "clinic" && successData.isDeleted 
                        ? "Deleted Successfully!" 
                        : successData.isEdit ? "Updated Successfully!" : "Welcome Aboard!"}
                    </h2>
                    <p className="text-xl text-white/90 mb-2">
                      <span className="font-semibold">{successData.name}</span>
                    </p>
                    <p className="text-white/80 mb-6">
                      {successData.type === "clinic" ? (
                        successData.isDeleted 
                          ? "Clinic has been successfully deleted"
                          : successData.isEdit 
                            ? "Clinic details have been updated" 
                            : "Clinic has been successfully created"
                      ) : (
                        successData.isEdit 
                          ? "Super admin details have been updated" 
                          : "has been successfully onboarded as a Super Admin"
                      )}
                    </p>

                    {/* Decorative Stars */}
                    <div className="flex justify-center gap-3 mb-8">
                      {[...Array(5)].map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="text-2xl"
                        >
                          ⭐
                        </motion.span>
                      ))}
                    </div>

                    {/* Close Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      onClick={() => setShowSuccessModal(false)}
                      className="px-8 py-4 rounded-2xl bg-white text-teal-600 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                    >
                      Awesome! 🎉
                    </motion.button>
                  </motion.div>

                  {/* Confetti Effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          y: "50%",
                          x: `${50}%`,
                          opacity: 0 
                        }}
                        animate={{ 
                          y: [`50%`, `${Math.random() * 100}%`],
                          x: [`50%`, `${Math.random() * 100}%`],
                          opacity: [0, 1, 0],
                          rotate: [0, Math.random() * 360]
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          delay: Math.random() * 0.5,
                          repeat: Infinity,
                          repeatDelay: Math.random() * 3
                        }}
                        className="absolute w-2 h-2 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Close Button Top Right */}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowCreateEnterpriseModal(false);
                setCreateEnterpriseActiveTab("basic");
                setEnterpriseForm({
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
                setError("");
                setSuccess("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
                
                {/* Header */}
                <div className="relative z-10 px-8 pt-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Create Enterprise</h2>
                      <p className="text-sm text-slate-600 mt-1">Add a new enterprise to the system</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateEnterpriseModal(false);
                        setCreateEnterpriseActiveTab("basic");
                        setEnterpriseForm({
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
                        setError("");
                        setSuccess("");
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setCreateEnterpriseActiveTab("basic")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        createEnterpriseActiveTab === "basic"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Basic Info
                    </button>
                    <button
                      onClick={() => setCreateEnterpriseActiveTab("contact")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        createEnterpriseActiveTab === "contact"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Contact
                    </button>
                    <button
                      onClick={() => setCreateEnterpriseActiveTab("address")}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        createEnterpriseActiveTab === "address"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Address
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 mb-4">
                      {success}
                    </div>
                  )}

                  {/* Basic Info Tab */}
                  {createEnterpriseActiveTab === "basic" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Enterprise Name *
                        </label>
                        <input
                          type="text"
                          value={enterpriseForm.enterpriseName}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, enterpriseName: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Enter enterprise name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={enterpriseForm.registrationNumber}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, registrationNumber: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Enter registration number"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="createEnterpriseIsActive"
                          checked={enterpriseForm.isActive}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, isActive: e.target.checked})}
                          className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-400"
                        />
                        <label htmlFor="createEnterpriseIsActive" className="text-sm font-semibold text-slate-700">
                          Active
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {createEnterpriseActiveTab === "contact" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          value={enterpriseForm.contactEmail}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, contactEmail: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="contact@enterprise.com"
                          required
                        />
                        <p className="text-xs text-slate-500 mt-1">Use a valid email address for enterprise contact.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={enterpriseForm.contactPhone}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setEnterpriseForm({...enterpriseForm, contactPhone: sanitized});
                          }}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          title="Enter exactly 10 digits"
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="e.g., 9876543210"
                        />
                        <p className="text-xs text-slate-500 mt-1">Enter a 10-digit number without country code.</p>
                      </div>
                    </div>
                  )}

                  {/* Address Tab */}
                  {createEnterpriseActiveTab === "address" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          value={enterpriseForm.addressLine1}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, addressLine1: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={enterpriseForm.addressLine2}
                          onChange={(e) => setEnterpriseForm({...enterpriseForm, addressLine2: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          placeholder="Apartment, suite, unit, etc. (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={enterpriseForm.city}
                            onChange={(e) => setEnterpriseForm({...enterpriseForm, city: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={enterpriseForm.state}
                            onChange={(e) => setEnterpriseForm({...enterpriseForm, state: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={enterpriseForm.country}
                            onChange={(e) => setEnterpriseForm({...enterpriseForm, country: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={enterpriseForm.postalCode}
                            onChange={(e) => {
                              const sanitized = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setEnterpriseForm({...enterpriseForm, postalCode: sanitized});
                            }}
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            title="Enter exactly 6 digits"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                            placeholder="e.g., 560001"
                          />
                          <p className="text-xs text-slate-500 mt-1">Enter a 6-digit postal code.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Actions */}
                <div className="relative z-10 px-8 py-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        setError("");
                        setSuccess("");

                        if (!enterpriseForm.enterpriseName || !enterpriseForm.contactEmail) {
                          setError("Enterprise name and contact email are required");
                          return;
                        }

                        // Validate email format
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(enterpriseForm.contactEmail.trim())) {
                          setError("Please enter a valid email address");
                          return;
                        }

                        // Validate phone number if provided
                        if (enterpriseForm.contactPhone && enterpriseForm.contactPhone.replace(/\D/g, "").length !== 10) {
                          setError("Phone number must be exactly 10 digits");
                          return;
                        }

                        try {
                          setEnterpriseFormLoading(true);
                          const now = new Date().toISOString();
                          const payload = {
                            EnterpriseName: enterpriseForm.enterpriseName,
                            RegistrationNumber: enterpriseForm.registrationNumber,
                            ContactEmail: enterpriseForm.contactEmail,
                            ContactPhone: enterpriseForm.contactPhone,
                            AddressLine1: enterpriseForm.addressLine1,
                            AddressLine2: enterpriseForm.addressLine2,
                            City: enterpriseForm.city,
                            State: enterpriseForm.state,
                            Country: enterpriseForm.country,
                            PostalCode: enterpriseForm.postalCode,
                            IsActive: !!enterpriseForm.isActive,
                            CreatedAt: now,
                            UpdatedAt: now
                          };

                          const response = await fetch(ENTERPRISE_ENDPOINTS.create, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
                            },
                            body: JSON.stringify(payload)
                          });

                          if (!response.ok && response.status !== 200 && response.status !== 201 && response.status !== 204) {
                            const message = await response.text();
                            throw new Error(message || "Unable to create enterprise");
                          }

                          console.log("✅ Enterprise created successfully");
                          setSuccess("Enterprise created successfully!");
                          setError(""); // Clear any previous errors
                          
                          // Refresh enterprises list
                          try {
                            await fetchEnterprises();
                            console.log("✅ Enterprises list refreshed");
                          } catch (fetchErr) {
                            console.error("Failed to refresh enterprises after creation:", fetchErr);
                            // Don't show error to user, enterprise was created successfully
                          }

                          // Close modal after a short delay
                          setTimeout(() => {
                            setShowCreateEnterpriseModal(false);
                            setCreateEnterpriseActiveTab("basic");
                            setEnterpriseForm({
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
                            setError("");
                            setSuccess("");
                          }, 1500);
                        } catch (err) {
                          setError(err.message || "Failed to create enterprise");
                        } finally {
                          setEnterpriseFormLoading(false);
                        }
                      }}
                      disabled={enterpriseFormLoading}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                    >
                      {enterpriseFormLoading ? "Creating..." : "Create Enterprise"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateEnterpriseModal(false);
                        setCreateEnterpriseActiveTab("basic");
                        setEnterpriseForm({
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
                        setError("");
                        setSuccess("");
                      }}
                      disabled={enterpriseFormLoading}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold disabled:opacity-60 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View/Edit Enterprise Modal */}
        <AnimatePresence>
          {showViewEnterpriseModal && viewingEnterprise && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowViewEnterpriseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                <div className="relative z-10 p-8 flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-2xl shadow-lg">🏢</div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{viewingEnterprise.enterpriseName}</h2>
                        <p className="text-sm text-slate-600">Enterprise Details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewEnterpriseModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9'}}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        {enterpriseEditError && (
                          <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{enterpriseEditError}</div>
                        )}
                        {enterpriseEditSuccess && (
                          <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{enterpriseEditSuccess}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (enterpriseEditMode) {
                            setEnterpriseEditMode(false);
                            setEnterpriseEditData({
                              enterpriseId: viewingEnterprise.enterpriseId || "",
                              enterpriseName: viewingEnterprise.enterpriseName || "",
                              registrationNumber: viewingEnterprise.registrationNumber || "",
                              contactEmail: viewingEnterprise.contactEmail || "",
                              contactPhone: viewingEnterprise.contactPhone || "",
                              addressLine1: viewingEnterprise.addressLine1 || "",
                              addressLine2: viewingEnterprise.addressLine2 || "",
                              city: viewingEnterprise.city || "",
                              state: viewingEnterprise.state || "",
                              country: viewingEnterprise.country || "",
                              postalCode: viewingEnterprise.postalCode || "",
                              isActive: viewingEnterprise.isActive !== undefined ? !!viewingEnterprise.isActive : true
                            });
                          } else {
                            setEnterpriseEditMode(true);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${enterpriseEditMode ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-blue-600 text-white'} hover:opacity-90`}
                      >
                        {enterpriseEditMode ? 'Cancel Edit' : 'Edit'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Enterprise Name</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.enterpriseName} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,enterpriseName:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.enterpriseName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Registration Number</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.registrationNumber} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,registrationNumber:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.registrationNumber || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Contact Email</p>
                        {enterpriseEditMode ? (
                          <>
                            <input type="email" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.contactEmail} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,contactEmail:e.target.value})} required />
                            <p className="text-xs text-slate-500 mt-1">Use a valid email address for enterprise contact.</p>
                          </>
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.contactEmail}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Contact Phone</p>
                        {enterpriseEditMode ? (
                          <>
                            <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.contactPhone} onChange={(e)=>{
                              const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setEnterpriseEditData({...enterpriseEditData,contactPhone:sanitized});
                            }} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Enter exactly 10 digits" placeholder="e.g., 9876543210" />
                            <p className="text-xs text-slate-500 mt-1">Enter a 10-digit number without country code.</p>
                          </>
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.contactPhone || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Address Line 1</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.addressLine1} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,addressLine1:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.addressLine1 || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Address Line 2</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.addressLine2} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,addressLine2:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.addressLine2 || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">City</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.city} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,city:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.city || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">State</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.state} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,state:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.state || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Country</p>
                        {enterpriseEditMode ? (
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.country} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,country:e.target.value})} />
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.country || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Postal Code</p>
                        {enterpriseEditMode ? (
                          <>
                            <input className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.postalCode} onChange={(e)=>{
                              const sanitized = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setEnterpriseEditData({...enterpriseEditData,postalCode:sanitized});
                            }} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} title="Enter exactly 6 digits" placeholder="e.g., 560001" />
                            <p className="text-xs text-slate-500 mt-1">Enter a 6-digit postal code.</p>
                          </>
                        ) : (
                          <p className="text-slate-800">{viewingEnterprise.postalCode || 'N/A'}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                        {enterpriseEditMode ? (
                          <select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={enterpriseEditData.isActive} onChange={(e)=>setEnterpriseEditData({...enterpriseEditData,isActive:e.target.value === 'true'})}>
                            <option value={true}>Active</option>
                            <option value={false}>Inactive</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            viewingEnterprise.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {viewingEnterprise.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 flex-shrink-0 border-t border-slate-200 pt-4">
                    {enterpriseEditMode ? (
                      <button
                        onClick={saveEnterpriseEdits}
                        disabled={enterpriseEditLoading}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                      >
                        {enterpriseEditLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleDeleteEnterprise(viewingEnterprise)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowViewEnterpriseModal(false)}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Enterprise Modal */}
        <AnimatePresence>
          {showDeleteEnterpriseModal && deletingEnterprise && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteEnterpriseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-red-500/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 text-white flex items-center justify-center text-2xl shadow-lg">⚠️</div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Confirm Delete</h2>
                      <p className="text-sm text-slate-600">This action cannot be undone</p>
                    </div>
                  </div>
                  <p className="text-slate-700 mb-6">Are you sure you want to delete <strong>{deletingEnterprise.enterpriseName}</strong>?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={confirmDeleteEnterprise}
                      disabled={enterpriseLoading}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                    >
                      {enterpriseLoading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteEnterpriseModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowListClinicsModal(false);
                setListClinicsEnterpriseId(0);
                setListClinicsData([]);
                setListClinicsError("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
                
                {/* Header */}
                <div className="relative z-10 px-8 pt-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <span>🏥</span> List Clinics
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">View all clinics for an enterprise</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowListClinicsModal(false);
                        setListClinicsEnterpriseId(0);
                        setListClinicsData([]);
                        setListClinicsError("");
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Filter Section */}
                <div className="relative z-10 px-8 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Select Enterprise *
                      </label>
                      <select
                        value={listClinicsEnterpriseId}
                        onChange={(e) => {
                          const enterpriseId = parseInt(e.target.value);
                          setListClinicsEnterpriseId(enterpriseId);
                          setListClinicsData([]);
                          setListClinicsError("");
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                      >
                        <option value="0">-- Select an Enterprise --</option>
                        {enterprises.map((enterprise) => (
                          <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                            {enterprise.enterpriseName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => loadClinicsForEnterprise(listClinicsEnterpriseId)}
                      disabled={listClinicsEnterpriseId === 0 || listClinicsLoading}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {listClinicsLoading ? "Loading..." : "Load Clinics"}
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  {listClinicsError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
                      {listClinicsError}
                    </div>
                  )}

                  {listClinicsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                      <p className="text-slate-600">Loading clinics...</p>
                    </div>
                  ) : listClinicsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-6xl mb-4">🏥</div>
                      <p className="text-lg text-slate-600">
                        {listClinicsEnterpriseId === 0 
                          ? "Select an enterprise to view clinics"
                          : "No clinics found for this enterprise"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                            <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Clinic ID</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Clinic Name</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">City</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listClinicsData.map((clinic, index) => (
                            <motion.tr
                              key={clinic.clinicId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-slate-700">{clinic.clinicId}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-slate-800">{clinic.clinicName}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{clinic.clinicCity}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{clinic.clinicPhone}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{clinic.clinicEmail}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{clinic.operatingHours}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="relative z-10 px-8 py-4 border-t border-slate-200 bg-white">
                  <button
                    onClick={() => {
                      setShowListClinicsModal(false);
                      setListClinicsEnterpriseId(0);
                      setListClinicsData([]);
                      setListClinicsError("");
                    }}
                    className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboard Staff Modal */}
        <AnimatePresence>
          {showOnboardStaffModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowOnboardStaffModal(false);
                setStaffFormError("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-sky-500/10" />

                {/* Header */}
                <div className="relative z-10 px-8 pt-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <span>👨‍⚕️</span> Onboard Staff
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">Fill in all required information to add a new team member to your organization</p>
                    </div>
                    <button
                      onClick={() => {
                        handleCloseOnboardStaffModal();
                        setStaffFormError("");
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  {staffFormError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">
                      {staffFormError}
                    </div>
                  )}

                  {/* Stepper */}
                  <div className="flex flex-wrap gap-2 sticky top-0 bg-white pt-2 pb-4 z-20">
                    {staffSteps.map((s) => {
                      const active = s.key === onboardStaffActiveStep;
                      return (
                        <button
                          key={s.key}
                          onClick={() => setOnboardStaffActiveStep(s.key)}
                          className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${active ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"}`}
                        >
                          <span className="mr-2">{s.icon}</span>{s.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Step Content */}
                  {onboardStaffActiveStep === "personal" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Enterprise ID *</label>
                        <select
                          value={staffForm.enterpriseId}
                          onChange={(e) => setStaffForm({...staffForm, enterpriseId: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="">Select enterprise</option>
                          {enterprises.map((enterprise) => (
                            <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                              {(enterprise.enterpriseName || "Enterprise")} ({enterprise.enterpriseId})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Clinic ID *</label>
                        <select
                          value={staffForm.clinicId}
                          onChange={(e) => setStaffForm({...staffForm, clinicId: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="">Select clinic</option>
                          {clinics.map((clinic) => (
                            <option key={clinic.clinicId || clinic.clinicID} value={clinic.clinicId || clinic.clinicID}>
                              {(clinic.clinicName || clinic.name || "Clinic")} ({clinic.clinicId || clinic.clinicID})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Role *</label>
                        <select
                          value={staffForm.rolesAssigned}
                          onChange={(e) => setStaffForm({...staffForm, rolesAssigned: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          disabled={rolesLoading}
                        >
                          <option value="">{rolesLoading ? "Loading roles..." : "Select role"}</option>
                          {roles.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={staffForm.firstName}
                          onChange={(e) => setStaffForm({...staffForm, firstName: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={staffForm.lastName}
                          onChange={(e) => setStaffForm({...staffForm, lastName: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth * (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={staffForm.dateOfBirth}
                          onChange={(e) => handleDateChange(e.target.value, "dateOfBirth")}
                          maxLength="10"
                          className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                            staffForm.dateOfBirth && (!validateDateFormat(staffForm.dateOfBirth) || !validateYearFormat(staffForm.dateOfBirth))
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200"
                          }`}
                          placeholder="YYYY-MM-DD"
                        />
                        {staffForm.dateOfBirth && (!validateDateFormat(staffForm.dateOfBirth) || !validateYearFormat(staffForm.dateOfBirth)) && (
                          <p className="text-red-500 text-xs mt-1">Year must be in proper 4-digit format (YYYY)</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Gender *</label>
                        <select
                          value={staffForm.gender}
                          onChange={(e) => setStaffForm({...staffForm, gender: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {onboardStaffActiveStep === "contact" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                        <input
                          type="email"
                          value={staffForm.email}
                          onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                            staffForm.email && !validateEmail(staffForm.email)
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200"
                          }`}
                          placeholder="doctor@example.com"
                        />
                        {staffForm.email && !validateEmail(staffForm.email) && (
                          <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone * (10 digits)</label>
                        <input
                          type="tel"
                          value={staffForm.phone}
                          onChange={(e) => {
                            const sanitized = handlePhoneInput(e.target.value);
                            setStaffForm({...staffForm, phone: sanitized});
                          }}
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                            staffForm.phone && !validatePhoneNumber(staffForm.phone)
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200"
                          }`}
                          placeholder="+91 98765 43210"
                          maxLength="10"
                        />
                        {staffForm.phone && !validatePhoneNumber(staffForm.phone) && (
                          <p className="text-red-500 text-xs mt-1">Phone number must be exactly 10 digits</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                        <textarea
                          value={staffForm.address}
                          onChange={(e) => setStaffForm({...staffForm, address: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          rows="2"
                          placeholder="Enter full address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Emergency Contact * (10 digits)</label>
                        <input
                          type="text"
                          value={staffForm.emergencyContact}
                          onChange={(e) => {
                            const sanitized = handleEmergencyContactInput(e.target.value);
                            setStaffForm({...staffForm, emergencyContact: sanitized});
                          }}
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                            staffForm.emergencyContact && !validatePhoneNumber(staffForm.emergencyContact)
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200"
                          }`}
                          placeholder="Emergency contact number"
                          maxLength="10"
                        />
                        {staffForm.emergencyContact && !validatePhoneNumber(staffForm.emergencyContact) && (
                          <p className="text-red-500 text-xs mt-1">Emergency contact must be exactly 10 digits</p>
                        )}
                      </div>
                    </div>
                  )}

                  {onboardStaffActiveStep === "professional" && (
                    <div className="space-y-4">
                      <div className={`rounded-lg border p-3 flex gap-2 ${["Doctor", "Nurse"].includes(staffForm.rolesAssigned) ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                        <span className="text-lg">{["Doctor", "Nurse"].includes(staffForm.rolesAssigned) ? "✅" : "ℹ️"}</span>
                        <span className={`text-sm ${["Doctor", "Nurse"].includes(staffForm.rolesAssigned) ? "text-blue-700" : "text-gray-600"}`}>
                          {["Doctor", "Nurse"].includes(staffForm.rolesAssigned) ? "Clinical role: license and specialty are required" : "Non-clinical role: license and specialty are optional"}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">License Number</label>
                        <input
                          type="text"
                          value={staffForm.licenseNumber}
                          onChange={(e) => setStaffForm({...staffForm, licenseNumber: e.target.value})}
                          disabled={!["Doctor", "Nurse"].includes(staffForm.rolesAssigned)}
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all ${
                            ["Doctor", "Nurse"].includes(staffForm.rolesAssigned)
                              ? "border-slate-200 bg-white"
                              : "border-slate-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                          placeholder="Medical license number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">License Expiry (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={staffForm.licenseExpiry}
                          onChange={(e) => handleDateChange(e.target.value, "licenseExpiry")}
                          maxLength="10"
                          disabled={!["Doctor", "Nurse"].includes(staffForm.rolesAssigned)}
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all ${
                            staffForm.licenseExpiry && (!validateDateFormat(staffForm.licenseExpiry) || !validateYearFormat(staffForm.licenseExpiry))
                              ? "border-red-400 bg-red-50"
                              : !["Doctor", "Nurse"].includes(staffForm.rolesAssigned)
                              ? "border-slate-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                              : "border-slate-200 bg-white"
                          }`}
                          placeholder="YYYY-MM-DD"
                        />
                        {staffForm.licenseExpiry && (!validateDateFormat(staffForm.licenseExpiry) || !validateYearFormat(staffForm.licenseExpiry)) && (
                          <p className="text-red-500 text-xs mt-1">Year must be in proper 4-digit format (YYYY)</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Specialty ID</label>
                        <input
                          type="number"
                          value={staffForm.specialtyId}
                          onChange={(e) => setStaffForm({...staffForm, specialtyId: e.target.value})}
                          disabled={!["Doctor", "Nurse"].includes(staffForm.rolesAssigned)}
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all ${
                            ["Doctor", "Nurse"].includes(staffForm.rolesAssigned)
                              ? "border-slate-200 bg-white"
                              : "border-slate-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                          placeholder="Specialty ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Years of Experience *</label>
                        <input
                          type="number"
                          min="0"
                          value={staffForm.yearsExperience}
                          onChange={(e) => setStaffForm({...staffForm, yearsExperience: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Years"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Education *</label>
                        <input
                          type="text"
                          value={staffForm.education}
                          onChange={(e) => setStaffForm({...staffForm, education: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Educational qualifications"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Certifications</label>
                        <input
                          type="text"
                          value={staffForm.certifications}
                          onChange={(e) => setStaffForm({...staffForm, certifications: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Professional certifications"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Languages</label>
                        <input
                          type="text"
                          value={staffForm.languages}
                          onChange={(e) => setStaffForm({...staffForm, languages: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="English, Hindi, etc."
                        />
                      </div>
                    </div>
                  )}

                  {onboardStaffActiveStep === "employment" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Joining Date (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={staffForm.joiningDate}
                          onChange={(e) => handleDateChange(e.target.value, "joiningDate")}
                          maxLength="10"
                          className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                            staffForm.joiningDate && (!validateDateFormat(staffForm.joiningDate) || !validateYearFormat(staffForm.joiningDate))
                              ? "border-red-400 bg-red-50"
                              : "border-slate-200"
                          }`}
                        />
                        {staffForm.joiningDate && (!validateDateFormat(staffForm.joiningDate) || !validateYearFormat(staffForm.joiningDate)) && (
                          <p className="text-red-500 text-xs mt-1">Year must be in proper 4-digit format (YYYY)</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status</label>
                        <select
                          value={staffForm.employmentStatus}
                          onChange={(e) => setStaffForm({...staffForm, employmentStatus: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Availability</label>
                        <input
                          type="text"
                          value={staffForm.availability}
                          onChange={(e) => setStaffForm({...staffForm, availability: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="e.g., Mon-Fri, 9-5"
                        />
                      </div>
                    </div>
                  )}

                  {onboardStaffActiveStep === "compliance" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Insurance Details</label>
                        <input
                          type="text"
                          value={staffForm.insuranceDetails}
                          onChange={(e) => setStaffForm({...staffForm, insuranceDetails: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Insurance details"
                        />
                      </div>
                    </div>
                  )}

                  {onboardStaffActiveStep === "profile" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                        <textarea
                          value={staffForm.bio}
                          onChange={(e) => setStaffForm({...staffForm, bio: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          rows="2"
                          placeholder="Short professional summary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                        <input
                          type="text"
                          value={staffForm.profilePhotoUrl}
                          onChange={(e) => setStaffForm({...staffForm, profilePhotoUrl: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Achievements</label>
                        <input
                          type="text"
                          value={staffForm.achievements}
                          onChange={(e) => setStaffForm({...staffForm, achievements: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Comma-separated"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Publications</label>
                        <input
                          type="text"
                          value={staffForm.publications}
                          onChange={(e) => setStaffForm({...staffForm, publications: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Comma-separated"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Social Links</label>
                        <input
                          type="text"
                          value={staffForm.socialLinks}
                          onChange={(e) => setStaffForm({...staffForm, socialLinks: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Comma-separated"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Actions */}
                <div className="relative z-10 px-8 py-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-3 justify-between">
                    <button
                      onClick={() => {
                        const idx = staffSteps.findIndex(s => s.key === onboardStaffActiveStep);
                        if (idx > 0) setOnboardStaffActiveStep(staffSteps[idx - 1].key);
                      }}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold disabled:opacity-60 transition-all"
                      disabled={creatingStaff || staffSteps.findIndex(s => s.key === onboardStaffActiveStep) === 0}
                    >
                      ← Previous
                    </button>

                    {staffSteps.findIndex(s => s.key === onboardStaffActiveStep) < staffSteps.length - 1 ? (
                      <button
                        onClick={() => {
                          if (onboardStaffActiveStep === "personal") {
                            if (!staffForm.enterpriseId || !staffForm.clinicId || !staffForm.rolesAssigned || !staffForm.firstName || !staffForm.lastName || !staffForm.dateOfBirth || !staffForm.gender) {
                              setStaffFormError("Please complete all required fields in Personal Info");
                              return;
                            }
                          }
                          const idx = staffSteps.findIndex(s => s.key === onboardStaffActiveStep);
                          setStaffFormError("");
                          setOnboardStaffActiveStep(staffSteps[idx + 1].key);
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                        disabled={creatingStaff}
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        onClick={handleCreateStaff}
                        disabled={creatingStaff}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                      >
                        {creatingStaff ? "Creating..." : "Create Staff"}
                      </button>
                    )}
                  </div>
                </div>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowCreateClinicModal(false);
                setCreateClinicActiveTab("basic");
                setClinicFormError("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
                
                {/* Header */}
                <div className="relative z-10 px-8 pt-6 pb-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <span>🏥</span> Create New Clinic
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">Register a new clinic location</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateClinicModal(false);
                        setCreateClinicActiveTab("basic");
                        setClinicFormError("");
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mt-4">
                    {[
                      { key: "basic", label: "Basic Info", icon: "📋" },
                      { key: "contact", label: "Contact", icon: "📞" },
                      { key: "address", label: "Address", icon: "📍" },
                      { key: "hours", label: "Operating Hours & Settings", icon: "⚙️" }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          // Validate current section before moving to next
                          if (createClinicActiveTab !== tab.key && !validateClinicFormSection(createClinicActiveTab)) {
                            return; // Don't navigate if validation fails
                          }
                          setCreateClinicActiveTab(tab.key);
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                          createClinicActiveTab === tab.key
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
                  {clinicFormError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
                      {clinicFormError}
                    </div>
                  )}

                  {/* Basic Info Tab */}
                  {createClinicActiveTab === "basic" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <span>📋</span> Basic Information
                      </h3>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Select Enterprise *
                        </label>
                        <select
                          value={createClinicForm.enterpriseId}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            console.log("🏢 Enterprise selected:", val);
                            setCreateClinicForm({...createClinicForm, enterpriseId: val});
                          }}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        >
                          <option value="0">-- Select an Enterprise --</option>
                          {enterprises.length > 0 ? (
                            enterprises.map((enterprise) => {
                              console.log("📝 Rendering enterprise option:", enterprise.enterpriseName, enterprise.enterpriseId);
                              return (
                                <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                                  {enterprise.enterpriseName}
                                </option>
                              );
                            })
                          ) : (
                            <option disabled>No enterprises available</option>
                          )}
                        </select>
                        {createClinicForm.enterpriseId === 0 && (
                          <p className="text-xs text-rose-600 font-semibold mt-1">
                            ⚠️ Enterprise selection is required
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Clinic Name *
                          </label>
                          <input
                            type="text"
                            value={createClinicForm.clinicName}
                            onChange={(e) => setCreateClinicForm({...createClinicForm, clinicName: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            placeholder="Enter clinic name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Clinic Code *
                          </label>
                          <input
                            type="text"
                            value={createClinicForm.clinicCode}
                            onChange={(e) => setCreateClinicForm({...createClinicForm, clinicCode: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            placeholder="e.g., CLINIC-001"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {createClinicActiveTab === "contact" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <span>📞</span> Contact Information
                      </h3>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={createClinicForm.contactEmail}
                          onChange={(e) => setCreateClinicForm({...createClinicForm, contactEmail: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          placeholder="clinic@example.com"
                          required
                        />
                        <p className="text-xs text-slate-500 mt-1">Use a valid email address for clinic contact.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={createClinicForm.contactPhone}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setCreateClinicForm({...createClinicForm, contactPhone: sanitized});
                          }}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          title="Enter exactly 10 digits"
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          placeholder="e.g., 9876543210"
                        />
                        <p className="text-xs text-slate-500 mt-1">Enter a 10-digit number without country code.</p>
                      </div>
                    </div>
                  )}

                  {/* Address Tab */}
                  {createClinicActiveTab === "address" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <span>📍</span> Address Information
                      </h3>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={createClinicForm.addressLine1}
                          onChange={(e) => setCreateClinicForm({...createClinicForm, addressLine1: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={createClinicForm.addressLine2}
                          onChange={(e) => setCreateClinicForm({...createClinicForm, addressLine2: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={createClinicForm.city}
                            onChange={(e) => setCreateClinicForm({...createClinicForm, city: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={createClinicForm.state}
                            onChange={(e) => setCreateClinicForm({...createClinicForm, state: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={createClinicForm.country}
                            onChange={(e) => setCreateClinicForm({...createClinicForm, country: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={createClinicForm.postalCode}
                            onChange={(e) => {
                              const sanitized = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setCreateClinicForm({...createClinicForm, postalCode: sanitized});
                            }}
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            title="Enter exactly 6 digits"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            placeholder="e.g., 560001"
                          />
                          <p className="text-xs text-slate-500 mt-1">Enter a 6-digit postal code.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operating Hours & Settings Tab */}
                  {createClinicActiveTab === "hours" && (
                    <div className="space-y-6">
                      <div className="max-h-[45vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                          <span>🕐</span> Operating Hours
                        </h3>
                        <div className="space-y-3">
                          {[
                            { key: "monday", label: "Monday" },
                            { key: "tuesday", label: "Tuesday" },
                            { key: "wednesday", label: "Wednesday" },
                            { key: "thursday", label: "Thursday" },
                            { key: "friday", label: "Friday" },
                            { key: "saturday", label: "Saturday" },
                            { key: "sunday", label: "Sunday" }
                          ].map(day => (
                            <div key={day.key} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-2 w-32">
                                <input
                                  type="checkbox"
                                  id={`clinic-${day.key}`}
                                  checked={clinicHours[day.key].isOpen}
                                  onChange={(e) => setClinicHours({
                                    ...clinicHours,
                                    [day.key]: { ...clinicHours[day.key], isOpen: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-400"
                                />
                                <label htmlFor={`clinic-${day.key}`} className="text-sm font-semibold text-slate-700">
                                  {day.label}
                                </label>
                              </div>
                              {clinicHours[day.key].isOpen ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="time"
                                    value={clinicHours[day.key].open}
                                    onChange={(e) => setClinicHours({
                                      ...clinicHours,
                                      [day.key]: { ...clinicHours[day.key], open: e.target.value }
                                    })}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                                  />
                                  <span className="text-slate-500 font-semibold">→</span>
                                  <input
                                    type="time"
                                    value={clinicHours[day.key].close}
                                    onChange={(e) => setClinicHours({
                                      ...clinicHours,
                                      [day.key]: { ...clinicHours[day.key], close: e.target.value }
                                    })}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                                  />
                                </div>
                              ) : (
                                <div className="flex-1 text-sm text-slate-400 italic">Closed</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="createClinicIsActive"
                            checked={createClinicForm.isActive}
                            onChange={(e) => setCreateClinicForm({...createClinicForm, isActive: e.target.checked})}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-400"
                          />
                          <label htmlFor="createClinicIsActive" className="text-sm font-semibold text-emerald-700">
                            ✅ Clinic is Active
                          </label>
                        </div>
                        <p className="text-xs text-slate-500 mt-3">
                          ✨ Tip: Check the days your clinic operates and set opening/closing times. Unchecked days will show as closed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Actions */}
                <div className="relative z-10 px-8 py-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        setClinicFormError("");
                        
                        if (!createClinicForm.clinicName || !createClinicForm.clinicCode) {
                          setClinicFormError("Clinic name and code are required");
                          return;
                        }
                        
                        if (createClinicForm.enterpriseId === 0) {
                          setClinicFormError("Please select an enterprise");
                          return;
                        }
                        
                        if (!createClinicForm.contactEmail || !createClinicForm.contactPhone) {
                          setClinicFormError("Email and phone are required");
                          return;
                        }
                        
                        // Validate email format
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(createClinicForm.contactEmail.trim())) {
                          setClinicFormError("Please enter a valid email address");
                          return;
                        }
                        
                        // Validate phone number
                        if (createClinicForm.contactPhone.replace(/\D/g, "").length !== 10) {
                          setClinicFormError("Phone number must be exactly 10 digits");
                          return;
                        }
                        
                        // Validate postal code if provided
                        if (createClinicForm.postalCode && createClinicForm.postalCode.replace(/\D/g, "").length !== 6) {
                          setClinicFormError("Postal code must be exactly 6 digits");
                          return;
                        }
                        
                        if (!createClinicForm.addressLine1 || !createClinicForm.city) {
                          setClinicFormError("Address line 1 and city are required");
                          return;
                        }
                        
                        try {
                          setCreatingClinic(true);
                          const now = new Date().toISOString();
                          
                          // Format clinic hours into a string
                          const formattedHours = Object.entries(clinicHours)
                            .map(([day, hours]) => {
                              const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                              if (hours.isOpen) {
                                return `${dayName}: ${hours.open} - ${hours.close}`;
                              } else {
                                return `${dayName}: Closed`;
                              }
                            })
                            .join("\n");
                          
                          const clinicModel = {
                            ClinicId: 0,
                            EnterpriseId: createClinicForm.enterpriseId,
                            ClinicName: createClinicForm.clinicName,
                            ClinicCode: createClinicForm.clinicCode,
                            ContactEmail: createClinicForm.contactEmail,
                            ContactPhone: createClinicForm.contactPhone,
                            AddressLine1: createClinicForm.addressLine1,
                            AddressLine2: createClinicForm.addressLine2,
                            City: createClinicForm.city,
                            State: createClinicForm.state,
                            Country: createClinicForm.country || "",
                            PostalCode: createClinicForm.postalCode,
                            OpeningHours: formattedHours,
                            IsActive: !!createClinicForm.isActive,
                            CreatedAt: now,
                            UpdatedAt: now
                          };
                          
                          console.log("🏥 Creating clinic:", clinicModel);
                          
                          const response = await fetch(CLINIC_ENDPOINTS.create, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
                            },
                            body: JSON.stringify(clinicModel)
                          });
                          
                          console.log("📡 Response status:", response.status);
                          
                          if (!response.ok && response.status !== 200 && response.status !== 201 && response.status !== 204) {
                            const message = await response.text();
                            console.error("❌ Create clinic failed:", message);
                            throw new Error(message || "Unable to create clinic");
                          }
                          
                          console.log("✅ Clinic created successfully");
                          setSuccess("Clinic created successfully! 🎉");
                          setClinicFormError("");
                          
                          // Show success modal
                          setSuccessData({
                            name: createClinicForm.clinicName,
                            isEdit: false,
                            type: "clinic"
                          });
                          setShowSuccessModal(true);
                          
                          // Refresh clinics list
                          try {
                            await fetchClinics();
                            console.log("✅ Clinics list refreshed");
                          } catch (fetchErr) {
                            console.error("Failed to refresh clinics after creation:", fetchErr);
                          }
                          
                          // Close modal after a short delay
                          setTimeout(() => {
                            setShowCreateClinicModal(false);
                            setCreateClinicActiveTab("basic");
                            setClinicFormError("");
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
                            setClinicHours({
                              monday: { isOpen: true, open: "09:00", close: "17:00" },
                              tuesday: { isOpen: true, open: "09:00", close: "17:00" },
                              wednesday: { isOpen: true, open: "09:00", close: "17:00" },
                              thursday: { isOpen: true, open: "09:00", close: "17:00" },
                              friday: { isOpen: true, open: "09:00", close: "17:00" },
                              saturday: { isOpen: false, open: "09:00", close: "17:00" },
                              sunday: { isOpen: false, open: "09:00", close: "17:00" }
                            });
                          }, 1500);
                        } catch (err) {
                          setClinicFormError(err.message || "Failed to create clinic");
                        } finally {
                          setCreatingClinic(false);
                        }
                      }}
                      disabled={creatingClinic}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 transition-all"
                    >
                      {creatingClinic ? "Creating..." : "Create Clinic"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateClinicModal(false);
                        setCreateClinicActiveTab("basic");
                        setClinicFormError("");
                      }}
                      disabled={creatingClinic}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold disabled:opacity-60 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointment Success Notification */}
        <AnimatePresence>
          {appointmentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
            >
              <div className="text-2xl">✅</div>
              <div>
                <div className="font-bold">{appointmentSuccess}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory Success Notification */}
        <AnimatePresence>
          {inventorySuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-6 z-50 bg-gradient-to-r from-violet-400 to-purple-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
            >
              <div className="text-2xl">✅</div>
              <div>
                <div className="font-bold">{inventorySuccess}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointment Management Modals */}
        <AppointmentListModal
          show={showAppointmentListModal}
          onClose={handleCloseAppointmentList}
          appointments={appointments}
          loading={appointmentLoading}
          error={appointmentError}
          filterQuery={appointmentFilterQuery}
          setFilterQuery={setAppointmentFilterQuery}
          onEdit={(apt) => {
            setEditAppointmentForm({
              ...apt,
              doctorId: appointmentFilterDoctor || apt.doctorId
            });
            setShowEditAppointmentModal(true);
          }}
          onDelete={(apt) => {
            setAppointmentToDelete(apt);
            setShowDeleteAppointmentModal(true);
          }}
          filteredAppointments={filteredAppointments}
          enterpriseId={appointmentFilterEnterprise}
          clinicId={appointmentFilterClinic}
          firstName={appointmentFilterFirstName}
          lastName={appointmentFilterLastName}
          doctorId={appointmentFilterDoctor}
          appointmentDate={appointmentFilterDate}
          setEnterpriseIdFilter={setAppointmentFilterEnterprise}
          setClinicIdFilter={setAppointmentFilterClinic}
          setFirstNameFilter={setAppointmentFilterFirstName}
          setLastNameFilter={setAppointmentFilterLastName}
          setDoctorIdFilter={setAppointmentFilterDoctor}
          setAppointmentDateFilter={setAppointmentFilterDate}
          enterprises={enterprises}
          clinics={clinics}
          doctors={doctors}
          onClearFilters={() => {
            setAppointmentFilterQuery("");
            setAppointmentError("");
            setAppointmentFilterEnterprise("");
            setAppointmentFilterClinic("");
            setAppointmentFilterFirstName("");
            setAppointmentFilterLastName("");
            setAppointmentFilterDoctor("");
            setAppointmentFilterDate("");
            setAppointments([]);
            setLastAppointmentFilters({ clinicId: null, firstName: null, lastName: null, doctorId: null, appointmentDate: null });
          }}
          onEnterpriseChange={useCallback((enterpriseId) => {
            setAppointmentFilterClinic("");
            if (enterpriseId) {
              loadClinicsForEnterprise(enterpriseId);
            }
          }, [loadClinicsForEnterprise])}
          onClinicChange={useCallback((clinicId) => {
            if (clinicId) {
              fetchDoctorsByClinic(clinicId);
            } else {
              setDoctors([]);
            }
          }, [fetchDoctorsByClinic])}
          onApplyFilters={useCallback((filters) => {
            setLastAppointmentFilters(filters);
            fetchAppointments(
              filters.clinicId,
              filters.firstName,
              filters.lastName,
              filters.doctorId,
              filters.appointmentDate
            );
          }, [fetchAppointments])}
        />

        <CreateAppointmentModal
          show={showCreateAppointmentModal}
          onClose={() => {
            setShowCreateAppointmentModal(false);
            setCreateAppointmentActiveTab("basic");
            setAppointmentFormError("");
          }}
          form={createAppointmentForm}
          setForm={setCreateAppointmentForm}
          onSubmit={handleCreateAppointment}
          loading={appointmentFormLoading}
          error={appointmentFormError}
          activeTab={createAppointmentActiveTab}
          setActiveTab={setCreateAppointmentActiveTab}
          enterprises={enterprises}
          clinics={clinics}
          doctors={doctors}
          onEnterpriseChange={useCallback((enterpriseId) => {
            setCreateAppointmentForm((prev) => ({
              ...prev,
              clinicId: "",
              doctorId: "",
              appointmentClinics: []
            }));
            if (enterpriseId) {
              loadClinicsForEnterprise(enterpriseId);
            }
          }, [loadClinicsForEnterprise])}
          onClinicChange={(clinicId) => {
            if (clinicId) {
              fetchDoctorsByClinic(clinicId);
            } else {
              setDoctors([]);
            }
          }}
        />

        <EditAppointmentModal
          show={showEditAppointmentModal}
          onClose={() => {
            setShowEditAppointmentModal(false);
            setEditAppointmentActiveTab("basic");
            setAppointmentFormError("");
          }}
          form={editAppointmentForm}
          onFormChange={(field, value) => {
            setEditAppointmentForm(prev => ({
              ...prev,
              [field]: value
            }));
          }}
          onSubmit={handleUpdateAppointment}
          loading={appointmentFormLoading}
          error={appointmentFormError}
          activeTab={editAppointmentActiveTab}
          setActiveTab={setEditAppointmentActiveTab}
          clinicDoctors={doctors}
        />

        <DeleteAppointmentModal
          show={showDeleteAppointmentModal}
          onClose={() => {
            setShowDeleteAppointmentModal(false);
            setAppointmentToDelete(null);
          }}
          appointment={appointmentToDelete}
          onConfirm={handleDeleteAppointment}
          loading={deletingAppointment}
        />

        {/* Patient Management Modals */}
        <CreatePatientModal
          show={showCreatePatientModal}
          onClose={() => {
            setShowCreatePatientModal(false);
            setCreatePatientActiveTab("patient-info");
            setPatientFormError("");
          }}
          form={createPatientForm}
          setForm={setCreatePatientForm}
          onSubmit={handleCreatePatient}
          loading={patientFormLoading}
          error={patientFormError}
          activeTab={createPatientActiveTab}
          setActiveTab={setCreatePatientActiveTab}
          enterprises={enterprisesForModal}
          clinics={clinicsForModal}
          onEnterpriseChange={handleCreatePatientEnterpriseChange}
        />

        <ManagePatientModal
          show={showManagePatientModal}
          onClose={() => {
            setShowManagePatientModal(false);
            setPatientSearchId("");
            setPatientProfile(null);
            setPatientProfileError("");
          }}
          searchId={patientSearchId}
          setSearchId={setPatientSearchId}
          onSearch={handleSearchPatient}
          patientProfile={patientProfile}
          loading={patientProfileLoading}
          error={patientProfileError}
        />

        {/* Inventory Management Modals */}
        <InventoryListModal
          show={showInventoryListModal}
          onClose={() => setShowInventoryListModal(false)}
          items={inventoryItems}
          loading={inventoryLoading}
          error={inventoryError}
          filterQuery={inventoryFilterQuery}
          setFilterQuery={setInventoryFilterQuery}
          filterCategory={inventoryFilterCategory}
          setFilterCategory={setInventoryFilterCategory}
          filterStatus={inventoryFilterStatus}
          setFilterStatus={setInventoryFilterStatus}
          onEdit={(item) => {
            setEditInventoryForm(item);
            setShowEditInventoryModal(true);
            setInventoryFormError("");
          }}
          onDelete={(item) => {
            setInventoryToDelete(item);
            setShowDeleteInventoryModal(true);
          }}
          filteredItems={filteredInventoryItems}
        />

        <CreateInventoryModal
          show={showCreateInventoryModal}
          onClose={() => {
            setShowCreateInventoryModal(false);
            setCreateInventoryForm({
              itemName: "",
              itemCode: "",
              category: "",
              subCategory: "",
              unit: "Box",
              isActive: true
            });
            setInventoryFormError("");
          }}
          form={createInventoryForm}
          setForm={setCreateInventoryForm}
          onSubmit={handleCreateInventory}
          loading={inventoryFormLoading}
          error={inventoryFormError}
        />

        <EditInventoryModal
          show={showEditInventoryModal}
          onClose={() => {
            setShowEditInventoryModal(false);
            setEditInventoryForm(null);
            setInventoryFormError("");
          }}
          form={editInventoryForm}
          setForm={setEditInventoryForm}
          onSubmit={handleUpdateInventory}
          loading={inventoryFormLoading}
          error={inventoryFormError}
        />

        <DeleteInventoryModal
          show={showDeleteInventoryModal}
          onClose={() => {
            setShowDeleteInventoryModal(false);
            setInventoryToDelete(null);
          }}
          item={inventoryToDelete}
          onConfirm={handleDeleteInventory}
          loading={deletingInventory}
        />
      </div>
    </div>
  );
}

